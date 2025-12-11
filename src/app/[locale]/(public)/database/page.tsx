"use client";

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useFirebase } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getRootCollectionIds, getTopLevelDocs, exportDocumentTree, exportSingleCollection, importDatabaseFromJsonDev, testDeveloperPermissions, devLogout } from '@/lib/actions/dev-database-actions';
import { useRouter } from 'next/navigation';

import { AuthView } from './AuthView';
import { ImportStage } from './ImportStage';

// --- Tipos de Dados ---
interface DocumentData { [key: string]: any; _subcollections?: { [collectionId: string]: CollectionData; }; }
interface CollectionData { [docId: string]: DocumentData; }
interface StagedImport {
    file: File;
    content: any;
    mode: 'merge' | 'overwrite';
}

const COMPLEX_COLLECTIONS = ['Global', 'companies'];

export default function DatabasePage() {
    const { auth } = useFirebase();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true); 
    const [isTestRunning, setIsTestRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [log, setLog] = useState<string[]>([]);
    const [stagedImport, setStagedImport] = useState<StagedImport | null>(null);

    const enableDbDevOverride = process.env.NEXT_PUBLIC_ENABLE_DB_DEV_OVERRIDE === 'true';
    const devEmails = process.env.NEXT_PUBLIC_DEV_EMAILS?.split(',') || [];

    // Hook de autenticação principal
    useEffect(() => {
        if (!enableDbDevOverride) {
            router.push('/');
            return;
        }

        if (!auth) {
            setIsLoading(false);
            return;
        };
        
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser && devEmails.includes(currentUser.email || '')) {
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [auth, enableDbDevOverride, router]);

    const appendLog = (message: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] > ${message}`]);

    const handleTestConnection = async () => {
        setIsTestRunning(true);
        setError(null);
        appendLog("Iniciando teste de conexão e permissão do servidor...");
        const result = await testDeveloperPermissions();
        if (result.success) {
            appendLog(`✅ SUCESSO: ${result.message}`);
            alert(`Sucesso: ${result.message}`);
        } else {
            const errorMessage = `❌ FALHA: ${result.error}`
            appendLog(errorMessage);
            setError(errorMessage);
            alert(errorMessage);
        }
        setIsTestRunning(false);
    }

    const handleLogout = async () => {
        if(auth) await auth.signOut();
        await devLogout();
        setIsAuthorized(false);
        setUser(null);
        setLog([]);
        setError(null);
        appendLog('Sessão do cliente e do servidor limpas. Recarregando...');
        router.refresh();
    };

    // --- LÓGICA DE EXPORTAÇÃO ---
    const handleGranularExport = async () => {
        setIsLoading(true);
        setError(null);
        setLog([]);
        appendLog("Iniciando exportação granular...");

        const fullDatabaseJson: { [collectionId: string]: CollectionData } = {};

        try {
            appendLog('Passo 1/3: Buscando coleções raiz...');
            const collectionsResult = await getRootCollectionIds();
            if (!collectionsResult.success || !collectionsResult.ids) throw new Error(collectionsResult.error || "Falha ao buscar coleções.");
            appendLog(` -> Encontradas: ${collectionsResult.ids.join(', ')}`);

            appendLog('Passo 2/3: Processando coleções...');
            for (const collectionId of collectionsResult.ids) {
                if (COMPLEX_COLLECTIONS.includes(collectionId)) {
                    appendLog(`  - Coleção '${collectionId}' (complexa): granular...`);
                    const collectionData: CollectionData = {};
                    const docsResult = await getTopLevelDocs(collectionId);
                    if (!docsResult.success || !docsResult.ids) throw new Error(docsResult.error || `Falha ao listar docs de ${collectionId}`);
                    for (const docId of docsResult.ids) {
                        const treeResult = await exportDocumentTree(collectionId, docId);
                        if (!treeResult.success || !treeResult.data) throw new Error(treeResult.error || `Falha ao exportar árvore ${collectionId}/${docId}`);
                        collectionData[docId] = treeResult.data;
                    }
                    fullDatabaseJson[collectionId] = collectionData;
                } else {
                    appendLog(`  - Coleção '${collectionId}' (simples): direta...`);
                    const collectionResult = await exportSingleCollection(collectionId);
                    if (!collectionResult.success || !collectionResult.data) throw new Error(collectionResult.error || `Falha ao exportar coleção ${collectionId}`);
                    fullDatabaseJson[collectionId] = collectionResult.data;
                }
            }

            appendLog("Passo 3/3: Compilando JSON e iniciando download...");
            const json = JSON.stringify(fullDatabaseJson, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `database-backup-${new Date().toISOString()}.json`;
            document.body.appendChild(a);
            a.click();
            
            alert('Exportação concluída! O seu download começará em breve.');

            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            appendLog('Recursos de download limpos.');

        } catch (error: any) {
            const errorMessage = `ERRO NA EXPORTAÇÃO: ${error.message}`;
            appendLog(errorMessage);
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // --- LÓGICA DE IMPORTAÇÃO ---
    const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>, mode: 'merge' | 'overwrite') => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setError(null);
        setLog([]);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = JSON.parse(e.target?.result as string);
                if (typeof content !== 'object' || content === null || Array.isArray(content)) {
                    throw new Error("Arquivo inválido. O backup deve ser um objeto JSON.");
                }
                appendLog(`Arquivo '${file.name}' validado. Pronto para importação em modo ${mode.toUpperCase()}.`);
                setStagedImport({ file, content, mode });
            } catch (err: any) {
                setError(`Erro ao ler arquivo: ${err.message}`);
            }
        };
        reader.readAsText(file);
    };

    const executeStagedImport = async () => {
        if (!stagedImport) return;
        const { content, mode } = stagedImport;

        // O prompt de confirmação para OVERWRITE foi removido conforme solicitado.

        setIsLoading(true);
        setError(null);
        appendLog(`Iniciando importação no servidor em modo ${mode.toUpperCase()}...`);

        try {
            const result = await importDatabaseFromJsonDev(content, mode);
            if (!result.success) throw new Error(result.error || "Erro desconhecido no servidor.");
            appendLog(`✅ SUCESSO: ${result.message}`);
            alert(result.message);
        } catch (error: any) {
            appendLog(`❌ ERRO: ${error.message}`);
            setError(error.message);
            alert(error.message);
        } finally {
            setIsLoading(false);
            setStagedImport(null);
        }
    };

    if (isLoading && !user) {
        return <div className="p-4 text-center">Verificando permissões...</div>;
    }

    if (!isAuthorized) {
        return <AuthView auth={auth} devEmails={devEmails} />;
    }

    return (
      <div className="p-4 max-w-4xl mx-auto">
          <div className="flex justify-between items-start mb-4">
            <div>
                <h1 className="text-xl font-bold">Gerenciamento de Banco de Dados (DEV)</h1>
                <p className="text-muted-foreground">Bem-vindo, {user?.email}!</p>
            </div>
            <div className='flex items-center gap-2'>
                <Button onClick={handleTestConnection} disabled={isTestRunning || isLoading} variant="outline"> 
                    {isTestRunning ? 'Testando...' : 'Testar Conexão'}
                </Button>
                <Button onClick={handleLogout} variant="destructive">Logout</Button>
            </div>
        </div>

        {error && <p className="p-2 mb-4 text-red-500 bg-red-100 rounded">{error}</p>}
        
        <div className="flex flex-col gap-4">
            <Button onClick={handleGranularExport} disabled={isTestRunning || isLoading || !!stagedImport}>1. Exportar Cópia de Segurança</Button>
            
            <hr className="my-2"/>

            {stagedImport ? (
                <ImportStage 
                    stagedImport={stagedImport} 
                    onExecute={executeStagedImport} 
                    onCancel={() => setStagedImport(null)} 
                    isLoading={isLoading} 
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                        <h3 className="font-semibold">2. Restaurar com MERGE (Seguro)</h3>
                        <p className="text-sm text-muted-foreground mb-2">Adiciona/atualiza dados. Não apaga.</p>
                        <Input id="import-merge" type="file" accept=".json" onChange={(e) => handleFileSelection(e, 'merge')} disabled={isTestRunning || isLoading} />
                    </div>
                    <div className="p-3 border rounded-lg border-destructive bg-destructive/10">
                        <h3 className="font-semibold text-destructive">OU Restaurar com OVERWRITE (Reset)</h3>
                        <p className="text-sm text-destructive/80 mb-2">APAGA TUDO antes de importar.</p>
                        <Input id="import-overwrite" type="file" accept=".json" onChange={(e) => handleFileSelection(e, 'overwrite')} disabled={isTestRunning || isLoading} />
                    </div>
                </div>
            )}
            
            {log.length > 0 && (
                <div className="p-2 mt-4 text-xs font-mono text-white bg-gray-900 rounded-md max-h-60 overflow-y-auto">
                    {log.map((line, index) => <p key={index}>{line}</p>)}
                </div>
            )}
        </div>
      </div>
    );
}
