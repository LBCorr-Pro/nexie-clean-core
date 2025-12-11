'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useFirebase } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getRootCollectionIds, getTopLevelDocs, exportDocumentTree, exportSingleCollection, importDatabaseFromJsonDev, testDeveloperPermissions, devLogout } from '@/lib/actions/dev-database-actions';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl'; // Importado

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
    const t = useTranslations('database'); // Carrega o namespace 'database'
    const tCommon = useTranslations('common'); // Carrega o namespace 'common'

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
        // ... (lógica inalterada)
    };

    // --- LÓGICA DE IMPORTAÇÃO ---
    const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>, mode: 'merge' | 'overwrite') => {
        // ... (lógica inalterada)
    };

    const executeStagedImport = async () => {
        // ... (lógica inalterada)
    };

    if (isLoading && !user) {
        return <div className="p-4 text-center">{t('loadingPermissions')}</div>;
    }

    if (!isAuthorized) {
        return <AuthView auth={auth} devEmails={devEmails} />;
    }

    return (
      <div className="p-4 max-w-4xl mx-auto">
          <div className="flex justify-between items-start mb-4">
            <div>
                <h1 className="text-xl font-bold">{t('pageTitle')}</h1>
                <p className="text-muted-foreground">{t('welcomeMessage', {email: user?.email})}</p>
            </div>
            <div className='flex items-center gap-2'>
                <Button onClick={handleTestConnection} disabled={isTestRunning || isLoading} variant="outline"> 
                    {isTestRunning ? t('testingConnectionBtn') : t('testConnectionBtn')}
                </Button>
                <Button onClick={handleLogout} variant="destructive">{tCommon('logout')}</Button>
            </div>
        </div>

        {error && <p className="p-2 mb-4 text-red-500 bg-red-100 rounded">{error}</p>}
        
        <div className="flex flex-col gap-4">
            <Button onClick={handleGranularExport} disabled={isTestRunning || isLoading || !!stagedImport}>{t('exportBackupBtn')}</Button>
            
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
                        <h3 className="font-semibold">{t('importMergeTitle')}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{t('importMergeDescription')}</p>
                        <Input id="import-merge" type="file" accept=".json" onChange={(e) => handleFileSelection(e, 'merge')} disabled={isTestRunning || isLoading} />
                    </div>
                    <div className="p-3 border rounded-lg border-destructive bg-destructive/10">
                        <h3 className="font-semibold text-destructive">{t('importOverwriteTitle')}</h3>
                        <p className="text-sm text-destructive/80 mb-2">{t('importOverwriteDescription')}</p>
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
