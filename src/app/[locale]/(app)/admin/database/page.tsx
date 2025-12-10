'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/nx-use-toast';
import { exportDatabaseToJson, importDatabaseFromJson } from '@/lib/actions/nx-database-actions';
import PageTitle from '@/components/shared/page-title';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icon } from '@/components/ui/icon';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { AccessDenied } from '@/components/ui/access-denied';
import { Skeleton } from '@/components/ui/skeleton';

export default function DatabaseAdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { currentUser, isLoadingPermissions } = useUserPermissions();

  // A verificação de Master Admin agora é centralizada e reativa.
  const isMasterAdmin = useMemo(() => {
    if (isLoadingPermissions || !currentUser) return false;
    return currentUser.uid === process.env.NEXT_PUBLIC_MASTER_UID;
  }, [currentUser, isLoadingPermissions]);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const result = await exportDatabaseToJson();
      // O tratamento de erro agora é mais robusto, pois a action pode lançar um erro de permissão.
      if (result.success) {
        const jsonString = JSON.stringify(result.data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `firestore-export-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({ title: 'Sucesso', description: 'O banco de dados foi exportado e o download foi iniciado.' });
      } else {
        throw new Error('A exportação falhou no servidor.');
      }
    } catch (error: any) {
      console.error('Erro ao exportar o banco de dados:', error);
      toast({ variant: 'destructive', title: 'Erro de Exportação', description: error.message || 'Não foi possível exportar o banco de dados.' });
    }
    setIsLoading(false);
  };

  const handleImport = async (mode: 'merge' | 'clean') => {
    if (!file) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nenhum arquivo JSON selecionado.' });
      return;
    }

    if (mode === 'clean') {
      if (!confirm('Você tem CERTEZA de que deseja limpar TODO o banco de dados e substituí-lo por este backup? Esta ação é IRREVERSÍVEL.')) {
        return;
      }
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        const result = await importDatabaseFromJson(jsonData, mode);
        if (result.success) {
          toast({ title: 'Sucesso', description: result.message });
        } else {
          throw new Error(result.message || 'A importação falhou no servidor.');
        }
      } catch (error: any) {
        console.error('Erro ao importar o banco de dados:', error);
        toast({ variant: 'destructive', title: 'Erro de Importação', description: `Não foi possível importar o arquivo: ${error.message}` });
      }
      setIsLoading(false);
      setFile(null);
    };
    reader.readAsText(file);
  };

  // Enquanto as permissões estão carregando, exibe um skeleton para evitar piscar a tela.
  if (isLoadingPermissions) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Se, após o carregamento, o usuário não for master, exibe a tela de Acesso Negado.
  if (!isMasterAdmin) {
    return <AccessDenied />;
  }

  // Renderiza a página completa apenas para o Master Admin.
  return (
    <PageTitle title="Gerenciamento de Banco de Dados" description="Ferramentas para exportar e importar os dados do sistema.">
      <div className="space-y-8">
        <Alert variant="destructive">
          <Icon name="AlertTriangle" className="h-4 w-4" />
          <AlertTitle>Atenção: Área de Alto Risco</AlertTitle>
          <AlertDescription>
            As ações nesta página podem causar perda permanente de dados. Somente o Master Admin pode usar esta ferramenta.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Exportar Banco de Dados</CardTitle>
            <CardDescription>
              Crie um backup completo (dump) de todo o banco de dados do Firestore em um único arquivo JSON.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={isLoading}>
              {isLoading ? 'Exportando...' : 'Gerar e Baixar JSON do Banco de Dados'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Importar Banco de Dados</CardTitle>
            <CardDescription>
              Faça o upload de um arquivo JSON para popular o banco de dados. As ações são registradas e apenas o Master Admin pode executá-las.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="json-upload" className="mb-2 block text-sm font-medium">Selecione o arquivo JSON:</label>
              <Input 
                id="json-upload"
                type="file" 
                accept=".json,application/json" 
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <Button onClick={() => handleImport('merge')} disabled={isLoading || !file} className="w-full sm:w-auto">
                {isLoading ? 'Importando...' : '1. Popular/Atualizar (Merge)'}
              </Button>
              <Button onClick={() => handleImport('clean')} disabled={isLoading || !file} variant="destructive" className="w-full sm:w-auto">
                {isLoading ? 'Limpando e Importando...' : '2. Limpar e Substituir (Clean)'}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p><strong className="text-primary">1. Popular/Atualizar (Merge):</strong> Adiciona novos dados e atualiza os existentes, mas não apaga nada.</p>
              <p><strong className="text-destructive">2. Limpar e Substituir (Clean):</strong> Deleta TUDO e substitui pelo conteúdo do arquivo. Ação irreversível.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTitle>
  );
}
