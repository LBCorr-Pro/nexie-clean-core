// src/lib/actions/dev-actions.ts

'use server';

import { getFirestore, Timestamp, WriteBatch, DocumentReference, FieldValue, CollectionReference } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin-helpers"; // CORREÇÃO: Usa o novo helper
import { defaultMenuItemsData } from '@/lib/seed-data/default-menu-items';
import { defaultMenuGroupsData } from '@/lib/seed-data/default-menu-groups';
import { defaultModuleDefinitionsData } from '@/lib/seed-data/default-module-definitions';
import { defaultManualArticlesData } from '@/lib/seed-data/default-manual-articles';
import { defaultLexicalPresets, defaultTiptapPresets } from '@/lib/seed-data/default-editor-presets';
import type { ModuleDefinition } from "@/contexts/instance-acting-context";
import fs from 'fs/promises';
import path from 'path';
import { knownModuleFolderSlugs } from "../known-module-folders";

async function ensureDocExists(batch: WriteBatch, docRef: DocumentReference, data: any) {
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        batch.set(docRef, { 
            ...data,
            lastUpdated: FieldValue.serverTimestamp() 
        });
    }
}

/**
 * Nova Server Action para ler as pastas de módulos e atualizar o arquivo de manifesto.
 */
export async function syncModuleFoldersAction(): Promise<{ success: boolean; message: string }> {
  try {
    const modulesDir = path.resolve(process.cwd(), 'src/modules');
    const entries = await fs.readdir(modulesDir, { withFileTypes: true });
    
    const folderSlugs = entries
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const newSlugsFound = folderSlugs.filter(slug => !knownModuleFolderSlugs.includes(slug));
    const oldSlugsRemoved = knownModuleFolderSlugs.filter(slug => !folderSlugs.includes(slug));

    if (newSlugsFound.length === 0 && oldSlugsRemoved.length === 0) {
      return { success: true, message: "Nenhum módulo novo encontrado. O manifesto já está sincronizado." };
    }

    const newKnownModuleSlugs = folderSlugs.sort((a, b) => a.localeCompare(b));

    const fileContent = `// src/lib/known-module-folders.ts

/**
 * This file acts as a static representation of the module folders
 * physically present in the 'src/modules' directory.
 * It is automatically managed by the 'syncModuleFoldersAction'.
 */
export const knownModuleFolderSlugs: string[] = [
${newKnownModuleSlugs.map(slug => `    "${slug}",`).join('\n')}
];
`;
    const filePath = path.resolve(process.cwd(), 'src/lib/known-module-folders.ts');
    await fs.writeFile(filePath, fileContent.trim() + '\n');
    
    let message = "Manifesto de módulos atualizado com sucesso. ";
    if (newSlugsFound.length > 0) message += `${newSlugsFound.length} novo(s) módulo(s) adicionado(s): ${newSlugsFound.join(', ')}. `;
    if (oldSlugsRemoved.length > 0) message += `${oldSlugsRemoved.length} módulo(s) removido(s): ${oldSlugsRemoved.join(', ')}. `;
    
    return { success: true, message };

  } catch (error: any) {
    console.error('[DevActions] Error syncing module folders:', error);
    return { success: false, message: `Falha ao sincronizar pastas de módulos: ${error.message}` };
  }
}


export async function seedDefaultEditorPresetsAction(): Promise<{ success: boolean; message: string }> {
    const adminDb = getAdminDb();
    const batch = adminDb.batch();
    try {
        const modulesConfigDocRef = adminDb.doc('Global/master/config/modules');

        const lexicalPresetsRef = modulesConfigDocRef.collection('lexical-editor').doc('default_presets').collection('presets');
        for (const preset of defaultLexicalPresets) {
            const presetDocRef = lexicalPresetsRef.doc(preset.name.toLowerCase().replace(/\s+/g, '-'));
            batch.set(presetDocRef, { ...preset, createdAt: FieldValue.serverTimestamp() });
        }

        const tiptapPresetsRef = modulesConfigDocRef.collection('tiptap-editor').doc('default_presets').collection('presets');
        for (const preset of defaultTiptapPresets) {
            const presetDocRef = tiptapPresetsRef.doc(preset.name.toLowerCase().replace(/\s+/g, '-'));
            batch.set(presetDocRef, { ...preset, createdAt: FieldValue.serverTimestamp() });
        }
        
        await batch.commit();
        return { success: true, message: `Presets para Lexical e TipTap foram salvos com sucesso.` };
    } catch (error: any) {
        console.error("[DevActions] Error seeding editor presets:", error);
        return { success: false, message: `Falha ao popular presets de editor: ${error.message}` };
    }
}

export async function cleanupAndConsolidateModuleDefinitionsAction(): Promise<{ success: boolean; message: string }> {
  const adminDb = getAdminDb();
  const collectionRef = adminDb.collection("Global/master/config/modules_config/definitions");
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    return { success: true, message: "Nenhuma definição de módulo encontrada para limpar." };
  }

  const modulesMap = new Map<string, ModuleDefinition & { docId: string }>();

  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data() as ModuleDefinition;
    if (data.id && typeof data.id === 'string') {
      const existing = modulesMap.get(data.id);
      const incomingTimestamp = (data.updatedAt || data.createdAt) as Timestamp;
      const existingTimestamp = (existing?.updatedAt || existing?.createdAt) as Timestamp;

      if (!existing || (incomingTimestamp && existingTimestamp && incomingTimestamp.toMillis() > existingTimestamp.toMillis())) {
        modulesMap.set(data.id, { ...data, docId: docSnap.id });
      }
    }
  });
  
  const batch = adminDb.batch();
  let consolidatedCount = 0;
  let deletedCount = 0;
  
  try {
    const modulesConfigDocRef = adminDb.doc("Global/master/config/modules_config");
    await ensureDocExists(batch, modulesConfigDocRef, { description: "Container for global module definitions."});
    
    snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const slug = data.id;

        if (slug && docSnap.id !== slug) {
            batch.delete(docSnap.ref);
            deletedCount++;
        }
    });

    for (const [slug, moduleData] of modulesMap.entries()) {
      const { docId: oldDocId, ...dataToSave } = moduleData;
      const newDocRef = collectionRef.doc(slug);
      batch.set(newDocRef, dataToSave, { merge: true });
      consolidatedCount++;
    }

    await batch.commit();

    return {
      success: true,
      message: `${consolidatedCount} módulos consolidados e ${deletedCount} documentos duplicados/antigos foram excluídos com sucesso.`,
    };
  } catch (error: any) {
    console.error("[DevActions] Error cleaning up module definitions:", error);
    return { success: false, message: `Falha ao limpar definições de módulo: ${error.message}` };
  }
}

export async function cleanupLegacyGeneralSettingsFieldsAction(): Promise<{ success: boolean; message: string }> {
    const adminDb = getAdminDb();
    try {
        const generalSettingsDocRef = adminDb.doc("Global/master/config/general_settings");
        
        const docSnap = await generalSettingsDocRef.get();
        if (!docSnap.exists) {
            return { success: true, message: "Documento de configurações gerais não existe, nenhuma limpeza necessária." };
        }

        const batch = adminDb.batch();

        const fieldsToDelete = ['systemLogoUrl', 'systemPhotoUrl'];
        const updateData: { [key: string]: FieldValue } = {};
        fieldsToDelete.forEach(field => {
            updateData[field] = FieldValue.delete();
        });

        batch.update(generalSettingsDocRef, updateData);
        await batch.commit();

        return { success: true, message: "Campos de configurações gerais legados foram removidos com sucesso." };

    } catch (error: any) {
        console.error("[DevActions] Error cleaning up legacy general settings fields:", error);
        return { success: false, message: `Falha ao limpar campos: ${error.message}` };
    }
}

export async function cleanupLegacyAppearanceFieldsAction(): Promise<{ success: boolean; message: string }> {
    const adminDb = getAdminDb();
    try {
        const appearanceSettingsDocRef = adminDb.doc("Global/master/config/appearance_settings");
        
        const docSnap = await appearanceSettingsDocRef.get();
        if (!docSnap.exists) {
            return { success: true, message: "Documento de configurações de aparência não existe, nenhuma limpeza necessária." };
        }

        const batch = adminDb.batch();

        const fieldsToDelete = [
            'bottomBarItems', 'fontFamilyTitle', 'fontSizeTitle', 'fontSizeSubtitle',
            'fontWeightTitle', 'letterSpacingTitle', 'inputColor', 'logoUrl',
            'logoCollapsedUrl', 'topBarShowLogo', 'topBarShowText', 'topBarText', 'topBarTextColor'
        ];
        const updateData: { [key: string]: FieldValue } = {};
        fieldsToDelete.forEach(field => {
            updateData[field] = FieldValue.delete();
        });

        batch.update(appearanceSettingsDocRef, updateData);
        await batch.commit();

        return { success: true, message: "Campos de aparência legados foram removidos com sucesso." };

    } catch (error: any) {
        console.error("[DevActions] Error cleaning up legacy appearance settings fields:", error);
        return { success: false, message: `Falha ao limpar campos de aparência: ${error.message}` };
    }
}

export async function seedDefaultMenuItemsAction() {
  const adminDb = getAdminDb();
  const batch = adminDb.batch();
  try {
    const appMenuConfigDocRef = adminDb.doc("Global/master/config/app_menu_config");
    await ensureDocExists(batch, appMenuConfigDocRef, { description: "Container for application menu groups and item configurations." });
    
    const itemsCollectionRef = adminDb.collection(`${appMenuConfigDocRef.path}/app_menu_item_configs`);
    const existingItemsSnapshot = await itemsCollectionRef.get();
    if (!existingItemsSnapshot.empty) {
        existingItemsSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
    }
    defaultMenuItemsData.forEach(item => {
      const { menuKey, ...dataToSave } = item;
      const newDocRef = itemsCollectionRef.doc(menuKey);
      batch.set(newDocRef, { ...dataToSave, menuKey: menuKey, customized: false, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    });
    await batch.commit();
    return { success: true, message: `${defaultMenuItemsData.length} itens de menu padrão foram populados com sucesso em ${itemsCollectionRef.path}!` };
  } catch (error: any) {
    return { success: false, message: `Falha ao popular itens de menu: ${error.message}` };
  }
}

export async function seedDefaultMenuGroupsAction() {
  const adminDb = getAdminDb();
  const batch = adminDb.batch();
  try {
    const appMenuConfigDocRef = adminDb.doc("Global/master/config/app_menu_config");
    await ensureDocExists(batch, appMenuConfigDocRef, { description: "Container for application menu groups and item configurations." });
    
    const groupsCollectionRef = adminDb.collection(`${appMenuConfigDocRef.path}/app_menu_groups`);
    const existingGroupsSnapshot = await groupsCollectionRef.get();
    
    // Deleta todos os grupos existentes para garantir uma base limpa.
    existingGroupsSnapshot.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });

    // Recria os grupos a partir da fonte da verdade.
    for (const group of defaultMenuGroupsData) {
        const { docId, ...dataToSave } = group; 
        const newDocRef = groupsCollectionRef.doc(docId);
        batch.set(newDocRef, { ...dataToSave, customized: false, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    }
    
    await batch.commit();
    return { success: true, message: `A lista de grupos foi resetada e ${defaultMenuGroupsData.length} grupos padrão foram salvos.` };

  } catch (error: any) {
    return { success: false, message: `Falha ao popular grupos de menu: ${error.message}` };
  }
}

export async function seedDefaultModuleDefinitionsAction() {
  const adminDb = getAdminDb();
  try {
    const definitionsCollectionRef = adminDb.collection("Global/master/config/modules_config/definitions");
    const batch = adminDb.batch();
    const modulesConfigDocRef = adminDb.doc("Global/master/config/modules_config");
    await ensureDocExists(batch, modulesConfigDocRef, { description: "Container for global module definitions." });
    
    for (const moduleDef of defaultModuleDefinitionsData) {
      const docRef = definitionsCollectionRef.doc(moduleDef.id);
      batch.set(docRef, { ...moduleDef, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    await batch.commit();

    return { 
      success: true, 
      message: `${defaultModuleDefinitionsData.length} definições de módulo foram salvas/atualizadas com sucesso.` 
    };
  } catch (error: any) {
    console.error("[DevActions] Error seeding default module definitions:", error);
    return { success: false, message: `Falha ao popular definições de módulo: ${error.message}` };
  }
}

export async function seedDefaultManualArticlesAction() {
  const adminDb = getAdminDb();
  const batch = adminDb.batch();
  try {
    const manualCollectionRef = adminDb.collection("Global/master/manual_articles");
    
    for (const article of defaultManualArticlesData) {
      const docRef = manualCollectionRef.doc(article.slug);
      batch.set(docRef, { ...article, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    
    await batch.commit();
    return { success: true, message: `${defaultManualArticlesData.length} artigo(s) do manual foram populados com sucesso.` };
  } catch (error: any) {
    console.error("[DevActions] Error seeding manual articles:", error);
    return { success: false, message: `Falha ao popular artigos do manual: ${error.message}` };
  }
}

export async function deleteModuleDefinitionAction(docId: string) {
    const adminDb = getAdminDb();
    if (!docId) { return { success: false, message: "ID do documento não fornecido." }; }
    try {
        const docRef = adminDb.doc(`Global/master/config/modules_config/definitions/${docId}`);
        await docRef.delete();
        return { success: true, message: `Definição de módulo com ID ${docId} foi excluída.` };
    } catch (error: any) {
        console.error(`[DevActions] Error deleting module definition ${docId}:`, error);
        return { success: false, message: `Falha ao excluir definição: ${error.message}` };
    }
}
