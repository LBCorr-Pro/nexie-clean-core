// src/modules/storage/actions.ts
'use server';

import { getStorage } from 'firebase-admin/storage';
import { getAdminApp } from '@/lib/firebase-admin-helpers';
import { firebaseConfig } from '@/lib/firebase';
import { File } from '@google-cloud/storage';

const adminApp = getAdminApp();

export interface StorageItem {
  name: string;
  fullPath: string;
  type: 'file' | 'folder';
  url?: string;
  size?: number;
  updated?: string;
}

// Define o tipo para a resposta da API que esperamos
type GetFilesApiResponse = {
    prefixes?: string[];
};

export async function listFilesAndFolders(
  path: string = '',
  instanceId: string | null,
  subInstanceId: string | null
): Promise<{ success: boolean; items?: StorageItem[]; error?: string }> {
  try {
    const bucket = getStorage().bucket(firebaseConfig.storageBucket);

    let prefix = '';
    if (instanceId) {
        prefix = `instance_assets/${instanceId}/`;
        if (subInstanceId) {
            prefix += `subinstances/${subInstanceId}/`;
        }
    } else {
        prefix = 'master_assets/';
    }

    const finalPath = `${prefix}${path ? `${path}/` : ''}`;

    // CORREÇÃO FINAL: Remove a tipagem da desestruturação
    const [files, nextQuery, apiResponse] = await bucket.getFiles({
      prefix: finalPath,
      delimiter: '/',
    });

    const items: StorageItem[] = [];

    // CORREÇÃO FINAL: Usa asserção de tipo para tratar o 'unknown'
    const prefixes = (apiResponse as GetFilesApiResponse)?.prefixes;
    if (prefixes) {
      prefixes.forEach((prefix: string) => {
        const folderName = prefix.replace(finalPath, '').replace(/\/$/, '');
        if(folderName) {
            items.push({
                name: folderName,
                fullPath: prefix.slice(0, -1), 
                type: 'folder',
            });
        }
      });
    }

    for (const file of files) {
      if (file.name === finalPath) continue;
      
      const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491',
      });

      items.push({
        name: file.name.split('/').pop() || file.name,
        fullPath: file.name,
        type: 'file',
        url: url,
        size: Number(file.metadata.size),
        updated: file.metadata.updated,
      });
    }
    
    items.sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
    });

    return { success: true, items: items };

  } catch (error: any) {
    console.error('[Storage Action] Error listing files:', error);
    return { success: false, error: `Falha ao listar arquivos: ${error.message}` };
  }
}
