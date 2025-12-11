// src/lib/firebase-admin.ts
// Este arquivo está obsoleto. A lógica foi movida para firebase-admin-helpers.ts
// Re-exportando os helpers para permitir a inicialização preguiçosa (lazy initialization) 
// e garantir que a conexão só seja estabelecida quando necessário dentro das Server Actions.

export { getAdminApp, getAdminDb, getAdminAuth } from './firebase-admin-helpers';

// A exportação 'db' legada é intencionalmente omitida para forçar o uso do novo padrão getAdminDb().
