// src/lib/nx-firestore-refs.ts
import { collection, doc, CollectionReference, DocumentReference, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import { getDb } from './firebase'; // Corrected import
import { AIAssistant, AIContext } from '@/modules/ai-settings/types';

// --- Type Converters ---
const aiAssistantConverter: FirestoreDataConverter<AIAssistant> = {
  toFirestore: (assistant: AIAssistant) => {
    const { id, ...data } = assistant;
    return data;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): AIAssistant => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as AIAssistant;
  }
};

const aiContextConverter: FirestoreDataConverter<AIContext> = {
  toFirestore: (context: AIContext) => {
    const { id, ...data } = context;
    return data;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): AIContext => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as AIContext;
  }
};


// --- Base References (Lazy Loaded) ---
const getGlobalCollection = () => collection(getDb(), 'Global');
const getMasterDoc = () => doc(getGlobalCollection(), 'master');
const getInstanceDoc = (instanceId: string) => doc(getGlobalCollection(), instanceId);

// --- Helper functions for safely creating nested references ---
const getNestedCollection = (baseRef: DocumentReference, collectionName: string): CollectionReference => {
  return collection(baseRef, collectionName);
};

const getNestedDoc = (baseRef: DocumentReference, collectionName: string, docId: string): DocumentReference => {
    return doc(baseRef, collectionName, docId);
};


// --- The Corrected and Final Architecture ---
export const refs = {
  // --- Top-Level ---
  instances: (): CollectionReference => getGlobalCollection(),
  instanceDoc: (instanceId: string): DocumentReference => getInstanceDoc(instanceId),
  users: (): CollectionReference => collection(getDb(), 'users'), // Root users collection
  companies: (): CollectionReference => collection(getDb(), 'companies'),
  anyCollection: (path: string): CollectionReference => collection(getDb(), path),

  // --- MASTER CONTEXT ---
  master: {
    masterDoc: (): DocumentReference => getMasterDoc(),
    
    // Config Collection and its documents
    configCollection: (collectionName: string): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), collectionName),
    modulesConfigDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), 'modules_config'),
    appMenuConfigDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), 'app_menu_config'),
    generalSettingsDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), 'general_settings'),
    appearanceSettingsDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), 'appearance_settings'),
    appearanceConfigDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), 'appearance_config'),
    
    // Configuration Subcollections
    userRegistrationFields: (): CollectionReference => getNestedCollection(doc(getNestedCollection(getMasterDoc(), 'config'), 'user_registration_settings'), 'field_configs'),
    companyRegistrationFields: (): CollectionReference => getNestedCollection(doc(getNestedCollection(getMasterDoc(), 'config'), 'company_registration_settings'), 'field_configs'),
    moduleDefinitions: (): CollectionReference => getNestedCollection(refs.master.modulesConfigDoc(), 'definitions'),
    menuGroups: (): CollectionReference => getNestedCollection(refs.master.appMenuConfigDoc(), 'app_menu_groups'),
    menuItems: (): CollectionReference => getNestedCollection(refs.master.appMenuConfigDoc(), 'app_menu_item_configs'),
    menuPresets: (): CollectionReference => getNestedCollection(refs.master.appMenuConfigDoc(), 'menu_presets'),
    appearancePresets: (): CollectionReference => getNestedCollection(refs.master.appearanceConfigDoc(), 'appearance_presets'),
    colorPresets: (): CollectionReference => getNestedCollection(refs.master.appearanceConfigDoc(), 'color_presets'),

    // Master-level collections
    plans: (): CollectionReference => getNestedCollection(getMasterDoc(), 'plans'),
    users: (): CollectionReference => getNestedCollection(getMasterDoc(), 'users'),
  },

  // --- INSTANCE CONTEXT ---
  instance: {
    configCollection: (instanceId: string, collectionName: string): DocumentReference => doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), collectionName),
    generalSettingsDoc: (instanceId: string): DocumentReference => doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), 'general_settings'),
    appearanceSettingsDoc: (instanceId: string): DocumentReference => doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), 'appearance_settings'),
    
    users: (instanceId: string): CollectionReference => getNestedCollection(getInstanceDoc(instanceId), 'users'),
    userDoc: (instanceId: string, userId: string): DocumentReference => doc(refs.instance.users(instanceId), userId),
    
    subinstances: (instanceId: string): CollectionReference => getNestedCollection(getInstanceDoc(instanceId), 'subinstances'),
    subinstanceDoc: (instanceId: string, subInstanceId: string): DocumentReference => doc(refs.instance.subinstances(instanceId), subInstanceId),

    // Module settings for instance
    modulesDoc: (instanceId: string): DocumentReference => doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), 'modules'),
    aiSettingsModuleCollection: (instanceId: string): CollectionReference => getNestedCollection(refs.instance.modulesDoc(instanceId), 'ai-settings'),
    aiContextAssignmentsDoc: (instanceId: string): DocumentReference => doc(refs.instance.aiSettingsModuleCollection(instanceId), 'context_assignments'),
  },

  // --- SUB-INSTANCE CONTEXT ---
  subinstance: {
    configCollection: (instanceId: string, subInstanceId: string, collectionName: string): DocumentReference => doc(getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'config'), collectionName),
    generalSettingsDoc: (instanceId: string, subInstanceId: string): DocumentReference => doc(getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'config'), 'general_settings'),
    appearanceSettingsDoc: (instanceId: string, subInstanceId: string): DocumentReference => doc(getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'config'), 'appearance_settings'),
  }
};
