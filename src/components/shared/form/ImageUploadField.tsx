// src/components/shared/form/ImageUploadField.tsx
"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { ImageIcon, UploadCloud, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFileUpload } from '@/hooks/use-file-upload';
import { useUserPermissions } from '@/hooks/use-user-permissions'; 
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface ImageUploadFieldProps {
    value?: string;
    onChange: (value: string | null) => void;
    label?: string;
    description?: string;
    aihint: string;
    contextPath: string;
    disabled?: boolean;
}

export const ImageUploadField = ({ 
    value, 
    onChange, 
    label,
    description, 
    aihint, 
    contextPath, 
    disabled = false 
}: ImageUploadFieldProps) => {

    const tCommon = useTranslations('common');
    const { activeModuleStatuses } = useUserPermissions();
    const isStorageModuleActive = activeModuleStatuses.get('storage') ?? false;

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };
    
    const { 
        isUploading, 
        isDeleting, 
        uploadProgress, 
        handleFileChange, 
        handleFileDelete, 
        fileInputRef 
    } = useFileUpload({ 
        contextPath, 
        onUploadComplete: onChange, 
        onDeleteComplete: () => onChange(null) 
    });
    
    const imageUrl = value;
    const isProcessing = isUploading || isDeleting;
    const isUploadDisabled = !isStorageModuleActive || isProcessing || disabled;

    return (
        <div className="space-y-2">
          {label && <label className="form-label flex items-center font-medium"><ImageIcon className="mr-2 h-4 w-4"/>{label}</label>}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2">
            <Input 
              type="url" 
              placeholder="https://..." 
              value={imageUrl ?? ''} 
              onChange={handleUrlChange} 
              disabled={isProcessing || disabled} 
              className="flex-grow"
            />
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 sm:flex-initial" 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isUploadDisabled}
                    title={!isStorageModuleActive ? "O módulo de armazenamento está desativado." : "Enviar arquivo"}
                >
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : isStorageModuleActive ? <UploadCloud className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4 text-destructive"/>}
                    {isUploading ? tCommon('sending') : tCommon('upload')}
                </Button>
                 {imageUrl && (
                    <Button type="button" variant="destructive" size="icon" className="w-10 h-10 shrink-0" onClick={() => handleFileDelete(imageUrl)} disabled={isProcessing || disabled}>
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                    </Button>
                 )}
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => handleFileChange(e, imageUrl)} 
                className="hidden" 
                accept="image/png, image/jpeg, image/svg+xml, image/webp, image/gif, image/vnd.microsoft.icon"
                disabled={isUploadDisabled}
            />
          </div>
          {isUploading && uploadProgress !== null && (<Progress value={uploadProgress} className="mt-2"/>)}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {!isStorageModuleActive && <p className="text-xs text-destructive mt-1">{tCommon('uploadDisabled')}</p>}
          {imageUrl && typeof imageUrl === 'string' && !isDeleting && imageUrl.startsWith('http') && (
              <div className="mt-2 relative aspect-video w-full max-w-xs rounded-md overflow-hidden border bg-muted/30">
                  <Image src={imageUrl} alt={`Preview para ${label || 'imagem'}`} fill className="object-contain" data-ai-hint={aihint} />
              </div>
          )}
        </div>
    );
}
