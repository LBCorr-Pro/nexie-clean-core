"use client";

import { Button } from "@/components/ui/button";

interface StagedImport {
    file: File;
    mode: 'merge' | 'overwrite';
}

interface ImportStageProps {
    stagedImport: StagedImport;
    onExecute: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

export function ImportStage({ stagedImport, onExecute, onCancel, isLoading }: ImportStageProps) {
    const { file, mode } = stagedImport;

    return (
        <div className={`p-4 border-2 rounded-lg ${mode === 'overwrite' ? 'border-destructive' : 'border-primary'}`}>
            <h3 className="text-lg font-bold">Confirmar Importação</h3>
            <p>Arquivo selecionado: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">{file.name}</span></p>
            <p>Modo de operação: <span className={`font-bold ${mode === 'overwrite' ? 'text-destructive' : 'text-primary'}`}>{mode.toUpperCase()}</span></p>
            
            {mode === 'overwrite' && (
                 <p className="text-sm font-bold text-destructive mt-2">ATENÇÃO: Esta ação é irreversível e apagará todos os dados existentes.</p>
            )}

            <div className="flex gap-4 mt-4">
                <Button onClick={onExecute} disabled={isLoading} className={mode === 'overwrite' ? 'bg-destructive hover:bg-destructive/90' : ''}>
                    {isLoading ? 'Executando...' : `Executar ${mode.toUpperCase()}`}
                </Button>
                <Button variant="ghost" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
            </div>
        </div>
    );
}
