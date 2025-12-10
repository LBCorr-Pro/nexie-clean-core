// src/hooks/use-file-upload.ts
"use client";

import { useState, useRef, useCallback } from 'react';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { useToast } from "@/hooks/nx-use-toast";
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useSearchParams } from 'next/navigation';

const storage = getStorage();

interface UseFileUploadProps {
  contextPath?: string; 
  maxFileSizeMB?: number;
  onUploadComplete?: (url: string) => void;
  onDeleteComplete?: () => void;
  // fieldName is no longer needed
}

export const useFileUpload = ({ 
    contextPath = 'general', 
    maxFileSizeMB = 5, 
    onUploadComplete, 
    onDeleteComplete 
}: UseFileUploadProps) => {
  const { toast } = useToast();
  const { actingAsInstanceId, isActingAsMaster } = useInstanceActingContext();
  const searchParams = useSearchParams();
  const subInstanceId = searchParams.get('subInstanceId');

  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFinalPath = useCallback(() => {
    if (isActingAsMaster && !actingAsInstanceId) {
        return `master_assets/${contextPath}`;
    } else if (actingAsInstanceId) {
        if(subInstanceId) {
            return `instance_assets/${actingAsInstanceId}/subinstances/${subInstanceId}/${contextPath}`;
        } else {
            return `instance_assets/${actingAsInstanceId}/${contextPath}`;
        }
    }
    return null;
  }, [isActingAsMaster, actingAsInstanceId, subInstanceId, contextPath]);

  const handleFileUpload = useCallback(async (file: File, previousUrl?: string | null) => {
    const finalPath = getFinalPath();
    if (!finalPath) {
        toast({ title: "Erro de Contexto", description: "Não foi possível determinar o contexto de salvamento.", variant: "destructive"});
        return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    const filePath = `${finalPath}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const fileStorageRef = storageRef(storage, filePath);

    if (previousUrl && typeof previousUrl === 'string' && previousUrl.includes('firebasestorage.googleapis.com')) {
      try {
        const oldFileRef = storageRef(storage, previousUrl);
        await deleteObject(oldFileRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          console.warn(`[FileUpload] Could not delete old file from '${previousUrl}':`, error);
        }
      }
    }
    
    const uploadTask = uploadBytesResumable(fileStorageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (error) => {
        toast({ title: "Erro no Upload", variant: "destructive" });
        setIsUploading(false);
        setUploadProgress(null);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onUploadComplete?.(downloadURL);
        toast({ title: "Arquivo Enviado!", description: "A URL foi atualizada." });
        setIsUploading(false);
        setUploadProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    );
  }, [getFinalPath, toast, onUploadComplete]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, currentUrl?: string | null) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: `O tamanho máximo permitido é ${maxFileSizeMB}MB.`, variant: "destructive" });
        return;
      }
      handleFileUpload(file, currentUrl);
    }
  }, [maxFileSizeMB, handleFileUpload, toast]);

  const handleFileDelete = useCallback(async (urlToDelete?: string | null) => {
    if (!urlToDelete || typeof urlToDelete !== 'string' || !urlToDelete.includes('firebasestorage.googleapis.com')) {
      onDeleteComplete?.();
      toast({ title: "URL Removida", description: "O campo de URL foi limpo."});
      return;
    }

    setIsDeleting(true);
    try {
      const fileRef = storageRef(storage, urlToDelete);
      await deleteObject(fileRef);
      onDeleteComplete?.();
      toast({ title: "Imagem Removida", description: "A imagem foi excluída do armazenamento."});
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        onDeleteComplete?.();
        toast({ title: "Arquivo não encontrado no Storage", description: "A URL foi limpa mesmo assim.", variant: "default" });
      } else {
        console.error("[FileDelete] Error deleting file:", error);
        toast({ title: "Erro ao Remover Imagem", description: "Não foi possível excluir o arquivo do armazenamento.", variant: "destructive" });
      }
    } finally {
      setIsDeleting(false);
    }
  }, [toast, onDeleteComplete]);


  return {
    isUploading,
    isDeleting,
    uploadProgress,
    handleFileChange,
    handleFileDelete,
    fileInputRef,
  };
};
