'use client';

import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl'; // Importado

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
    const t = useTranslations('database'); // Carrega o namespace 'database'
    const tCommon = useTranslations('common'); // Carrega o namespace 'common'
    const { file, mode } = stagedImport;

    return (
        <div className={`p-4 border-2 rounded-lg ${mode === 'overwrite' ? 'border-destructive' : 'border-primary'}`}>
            <h3 className="text-lg font-bold">{t('confirmImportTitle')}</h3>
            <p>{t('selectedFileLabel')} <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">{file.name}</span></p>
            <p>{t('operationModeLabel')} <span className={`font-bold ${mode === 'overwrite' ? 'text-destructive' : 'text-primary'}`}>{mode.toUpperCase()}</span></p>
            
            {mode === 'overwrite' && (
                 <p className="text-sm font-bold text-destructive mt-2">{t('overwriteWarning')}</p>
            )}

            <div className="flex gap-4 mt-4">
                <Button onClick={onExecute} disabled={isLoading} className={mode === 'overwrite' ? 'bg-destructive hover:bg-destructive/90' : ''}>
                    {isLoading ? t('executingButton') : t('executeButton', { mode: mode.toUpperCase() })}
                </Button>
                <Button variant="ghost" onClick={onCancel} disabled={isLoading}>{tCommon('cancel')}</Button>
            </div>
        </div>
    );
}
