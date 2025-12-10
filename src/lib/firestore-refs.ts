// src/lib/firestore-refs.ts
import { collection, doc, CollectionReference, DocumentReference, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import { getDb } from './firebase';
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
  users: (): CollectionReference => collection(getDb(), 'users'),
  companies: (): CollectionReference => collection(getDb(), 'companies'),
  anyCollection: (path: string): CollectionReference => collection(getDb(), path),

  // --- USER-SPECIFIC CONTEXT (Corrected) ---
  user: {
    doc: (userId: string): DocumentReference => doc(refs.users(), userId),
    masterPermissions: (userId: string): DocumentReference => doc(collection(doc(refs.users(), userId), 'permissions'), 'master'),
    instancePermissions: (userId: string, instanceId: string): DocumentReference => doc(collection(doc(refs.users(), userId), 'permissions'), instanceId),
  },

  // --- MASTER CONTEXT ---
  master: {
    masterDoc: (): DocumentReference => getMasterDoc(),
    
    configCollection: (collectionName: string): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), collectionName),
    modulesDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), 'modules'),
    modulesConfigDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), 'modules_config'),
    appMenuConfigDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), 'app_menu_config'),
    generalSettingsDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), 'general_settings'),
    appearanceSettingsDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), 'appearance_settings'),
    appearanceConfigDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), 'appearance_config'),
    editorPreferencesDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), 'editor_preferences'),
    
    accessMethodsSettingsDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), 'access_methods_settings'),
    loginPageBehaviorSettingsDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), 'login_page_behavior_settings'),
    loginPageDesignSettingsDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config'), 'login_page_design_settings'),

    userRegistrationFields: (): CollectionReference => getNestedCollection(doc(getNestedCollection(getMasterDoc(), 'config'), 'user_registration_settings'), 'field_configs'),
    companyRegistrationFields: (): CollectionReference => getNestedCollection(doc(getNestedCollection(getMasterDoc(), 'config'), 'company_registration_settings'), 'field_configs'),
    moduleDefinitions: (): CollectionReference => getNestedCollection(refs.master.modulesConfigDoc(), 'definitions'),
    moduleDefinitionDoc: (moduleId: string): DocumentReference => doc(refs.master.moduleDefinitions(), moduleId),

    menuGroups: (): CollectionReference => getNestedCollection(refs.master.appMenuConfigDoc(), 'app_menu_groups'),
    menuItems: (): CollectionReference => getNestedCollection(refs.master.appMenuConfigDoc(), 'app_menu_item_configs'),
    menuPresets: (): CollectionReference => getNestedCollection(refs.master.appMenuConfigDoc(), 'menu_presets'),
    appearancePresets: (): CollectionReference => getNestedCollection(refs.master.appearanceConfigDoc(), 'appearance_presets'),
    colorPresets: (): CollectionReference => getNestedCollection(refs.master.appearanceConfigDoc(), 'color_presets'),

    accessLevelTemplates: (): CollectionReference => getNestedCollection(doc(getNestedCollection(getMasterDoc(), 'config'), 'access_levels'), 'templates'),
    accessLevelTemplateDoc: (templateId: string): DocumentReference => doc(refs.master.accessLevelTemplates(), templateId),
    
    inviteModuleCollection: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config/modules'), 'invite'),
    generatedInvites: (): CollectionReference => getNestedCollection(doc(getNestedCollection(getMasterDoc(), 'module_data'), 'invite_module_data'), 'generated_invites'),

    lexicalEditorModuleCollection: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config/modules'), 'lexical-editor'),
    lexicalEditorPresets: (): CollectionReference => getNestedCollection(doc(refs.master.lexicalEditorModuleCollection(), 'default_presets'), 'presets'),

    tiptapEditorModuleCollection: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config/modules'), 'tiptap-editor'),
    tiptapEditorPresets: (): CollectionReference => getNestedCollection(doc(refs.master.tiptapEditorModuleCollection(), 'default_presets'), 'presets'),

    aiAssistants: (): CollectionReference<AIAssistant> => {
      const baseCollection = getNestedCollection(doc(getNestedCollection(getMasterDoc(), 'config/modules/ai-settings'), 'assistants'), 'definitions');
      return baseCollection.withConverter(aiAssistantConverter);
    },
    aiContexts: (): CollectionReference<AIContext> => {
        const baseCollection = getNestedCollection(doc(getNestedCollection(getMasterDoc(), 'config/modules/ai-settings'), 'contexts'), 'definitions');
        return baseCollection.withConverter(aiContextConverter);
    },
    aiProviderConfigurations: (): CollectionReference => getNestedCollection(doc(getNestedCollection(getMasterDoc(), 'config/modules/ai-settings'), 'configurations'), 'providers'),
    aiContextAssignmentsDoc: (): DocumentReference => doc(getNestedCollection(getMasterDoc(), 'config/modules/ai-settings'), 'context_assignments'),
    aiMonitoringLogs: (): CollectionReference => getNestedCollection(doc(getNestedCollection(getMasterDoc(), 'module_data'), 'data'), 'logs'),

    plans: (): CollectionReference => getNestedCollection(getMasterDoc(), 'plans'),
    planDoc: (planId: string): DocumentReference => doc(refs.master.plans(), planId),
    users: (): CollectionReference => getNestedCollection(getMasterDoc(), 'users'),
    companies: (): CollectionReference => getNestedCollection(getMasterDoc(), 'companies'),
    manualArticles: (): CollectionReference => getNestedCollection(getMasterDoc(), 'manual_articles'),
    splashScreenCampaigns: (): CollectionReference => getNestedCollection(doc(getNestedCollection(getMasterDoc(), 'config'), 'splash_screen_campaigns'), 'campaigns'),
    splashScreenCampaignViews: (): CollectionReference => getNestedCollection(doc(getNestedCollection(getMasterDoc(), 'module_data'), 'splash_screen_campaign_data'), 'views'),

    // Refs for Calc Genius Module
    calcGeniusGroupsCol: (): CollectionReference => getNestedCollection(doc(getNestedCollection(getMasterDoc(), 'config/modules'), 'calc-genius'), 'groups'),
    calcGeniusGroupDoc: (docId: string): DocumentReference => doc(refs.master.calcGeniusGroupsCol(), docId),
    calcGeniusFieldsCol: (): CollectionReference => getNestedCollection(doc(getNestedCollection(getMasterDoc(), 'config/modules'), 'calc-genius'), 'fields'),
    calcGeniusFieldDoc: (docId: string): DocumentReference => doc(refs.master.calcGeniusFieldsCol(), docId),
    calcGeniusFormulasCol: (): CollectionReference => getNestedCollection(doc(getNestedCollection(getMasterDoc(), 'config/modules'), 'calc-genius'), 'formulas'),
    calcGeniu_sFormulaDoc: (docId: string): DocumentReference => doc(refs.master.calcGeniusFormulasCol(), docId),
  },

  // --- INSTANCE CONTEXT ---
  instance: {
    configCollection: (instanceId: string, collectionName: string): DocumentReference => doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), collectionName),
    generalSettingsDoc: (instanceId: string): DocumentReference => doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), 'general_settings'),
    appearanceSettingsDoc: (instanceId: string): DocumentReference => doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), 'appearance_settings'),
    
    accessMethodsSettingsDoc: (instanceId: string): DocumentReference => doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), 'access_methods_settings'),
    loginPageBehaviorSettingsDoc: (instanceId: string): DocumentReference => doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), 'login_page_behavior_settings'),
    loginPageDesignSettingsDoc: (instanceId: string): DocumentReference => doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), 'login_page_design_settings'),
    
    userRegistrationFields: (instanceId: string): CollectionReference => getNestedCollection(doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), 'user_registration_settings'), 'field_configs'),
    companyRegistrationFields: (instanceId: string): CollectionReference => getNestedCollection(doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), 'company_registration_settings'), 'field_configs'),
    menuGroups: (instanceId: string): CollectionReference => getNestedCollection(doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), 'app_menu_config'), 'app_menu_groups'),
    menuItems: (instanceId: string): CollectionReference => getNestedCollection(doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), 'app_menu_config'), 'app_menu_item_configs'),

    users: (instanceId: string): CollectionReference => getNestedCollection(getInstanceDoc(instanceId), 'users'),
    userDoc: (instanceId: string, userId: string): DocumentReference => doc(refs.instance.users(instanceId), userId),
    userSubscriptionDoc: (instanceId: string, userId: string): DocumentReference => getNestedDoc(refs.instance.userDoc(instanceId, userId), 'subscription', 'main'),

    companies: (instanceId: string): CollectionReference => getNestedCollection(getInstanceDoc(instanceId), 'companies'),
    companyDoc: (instanceId: string, companyId: string): DocumentReference => doc(refs.instance.companies(instanceId), companyId),
    
    subinstances: (instanceId: string): CollectionReference => getNestedCollection(getInstanceDoc(instanceId), 'subinstances'),
    subinstanceDoc: (instanceId: string, subInstanceId: string): DocumentReference => doc(refs.instance.subinstances(instanceId), subInstanceId),

    // Module settings for instance
    modulesDoc: (instanceId: string): DocumentReference => doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), 'modules'),
    instanceModuleDefs: (instanceId: string): CollectionReference => getNestedCollection(refs.instance.modulesDoc(instanceId), 'definitions'),
    instanceModuleDefDoc: (instanceId: string, moduleId: string): DocumentReference => doc(refs.instance.instanceModuleDefs(instanceId), moduleId),
    
    inviteModuleCollection: (instanceId: string): DocumentReference => doc(getNestedCollection(getInstanceDoc(instanceId), 'config/modules'), 'invite'),
    generatedInvites: (instanceId: string): CollectionReference => getNestedCollection(doc(getNestedCollection(getInstanceDoc(instanceId), 'module_data'), 'invite_module_data'), 'generated_invites'),
    
    aiSettingsModuleCollection: (instanceId: string): CollectionReference => getNestedCollection(refs.instance.modulesDoc(instanceId), 'ai-settings'),
    aiContextAssignmentsDoc: (instanceId: string): DocumentReference => doc(refs.instance.aiSettingsModuleCollection(instanceId), 'context_assignments'),
    
    splashScreenCampaigns: (instanceId: string): CollectionReference => getNestedCollection(doc(getNestedCollection(getInstanceDoc(instanceId), 'config'), 'splash_screen_campaigns'), 'campaigns'),
    splashScreenCampaignViews: (instanceId: string): CollectionReference => getNestedCollection(doc(getNestedCollection(getInstanceDoc(instanceId), 'module_data'), 'splash_screen_campaign_data'), 'views'),
    manualArticles: (instanceId: string): CollectionReference => getNestedCollection(getInstanceDoc(instanceId), 'manual_articles'),

    // Plan & Subscription
    subscriptionDoc: (instanceId: string): DocumentReference => getNestedDoc(getInstanceDoc(instanceId), 'subscription', 'main'),
    plans: (instanceId: string): CollectionReference => getNestedCollection(getInstanceDoc(instanceId), 'plans'),
    planDoc: (instanceId: string, planId: string): DocumentReference => doc(refs.instance.plans(instanceId), planId),
  },

  // --- SUB-INSTANCE CONTEXT ---
  subinstance: {
    configCollection: (instanceId: string, subInstanceId: string, collectionName: string): DocumentReference => doc(getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'config'), collectionName),
    generalSettingsDoc: (instanceId: string, subInstanceId: string): DocumentReference => doc(getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'config'), 'general_settings'),
    appearanceSettingsDoc: (instanceId: string, subInstanceId: string): DocumentReference => doc(getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'config'), 'appearance_settings'),
    accessMethodsSettingsDoc: (instanceId: string, subInstanceId: string): DocumentReference => doc(getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'config'), 'access_methods_settings'),
    loginPageBehaviorSettingsDoc: (instanceId: string, subInstanceId: string): DocumentReference => doc(getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'config'), 'login_page_behavior_settings'),
    generatedInvites: (instanceId: string, subInstanceId: string): CollectionReference => getNestedCollection(doc(getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'module_data'), 'invite_module_data'), 'generated_invites'),
    splashScreenCampaigns: (instanceId: string, subInstanceId: string): CollectionReference => getNestedCollection(doc(getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'config'), 'splash_screen_campaigns'), 'campaigns'),
    splashScreenCampaignViews: (instanceId: string, subInstanceId: string): CollectionReference => getNestedCollection(doc(getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'module_data'), 'splash_screen_campaign_data'), 'views'),
    manualArticles: (instanceId: string, subInstanceId: string): CollectionReference => getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'manual_articles'),
    userRegistrationFields: (instanceId: string, subInstanceId: string): CollectionReference => getNestedCollection(doc(getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'config'), 'user_registration_settings'), 'field_configs'),
    companyRegistrationFields: (instanceId: string, subInstanceId: string): CollectionReference => getNestedCollection(doc(getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'config'), 'company_registration_settings'), 'field_configs'),
    menuGroups: (instanceId: string, subInstanceId: string): CollectionReference => getNestedCollection(doc(getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'config'), 'app_menu_config'), 'app_menu_groups'),
    menuItems: (instanceId: string, subInstanceId: string): CollectionReference => getNestedCollection(doc(getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'config'), 'app_menu_item_configs'), 'menuItems'),
    plans: (instanceId: string, subInstanceId: string): CollectionReference => getNestedCollection(refs.instance.subinstanceDoc(instanceId, subInstanceId), 'plans'),
    planDoc: (instanceId: string, subInstanceId: string, planId: string): DocumentReference => doc(refs.subinstance.plans(instanceId, subInstanceId), planId),
  }
};