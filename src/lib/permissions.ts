// src/lib/permissions.ts
export type PermissionId =
  | 'master.settings.general.edit'
  | 'master.settings.appearance.edit'
  | 'master.settings.access_methods.edit'
  | 'master.settings.user_fields.edit'
  | 'master.settings.company_fields.edit'
  | 'master.settings.menu.edit'
  | 'master.menu.sync_defaults'
  | 'master.instance.create'
  | 'master.instance.view_all'
  | 'master.instance.edit_details'
  | 'master.instance.manage_status'
  | 'master.instance.delete'
  | 'master.modules.create'
  | 'master.modules.edit'
  | 'master.modules.delete'
  | 'master.modules.view_definitions'
  | 'master.modules.import'
  | 'master.access_levels.create'
  | 'master.access_levels.edit'
  | 'master.access_levels.delete'
  | 'master.users.create_global'
  | 'master.users.view_global'
  | 'master.users.update_global'
  | 'master.companies.view'
  | 'master.companies.create'
  | 'master.companies.edit'
  | 'master.companies.delete'
  | 'master.sync.manage'
  | 'master.ia_integrations.manage'
  | 'master.ia_integrations.set_default'
  | 'instance.dashboard.view'
  | 'instance.settings.general.edit'
  | 'instance.settings.appearance.edit'
  | 'instance.settings.access_methods.edit'
  | 'instance.settings.menu.edit'
  | 'instance.users.manage'
  | 'instance.users.invite'
  | 'instance.users.view_list'
  | 'instance.users.edit_details'
  | 'instance.users.manage_access'
  | 'instance.users.delete'
  | 'instance.subinstances.manage'
  | 'instance.modules.manage_status'
  | 'instance.companies.view'
  | 'instance.companies.create'
  | 'instance.companies.edit'
  | 'instance.companies.delete'
  | 'module.invite.configure'
  | 'module.storage.configure'
  | 'module.storage.view'
  | 'module.storage.upload'
  | 'module.storage.rename'
  | 'module.storage.delete'
  | 'module.payment.configure'
  | 'module.smart-notes.access'
  | 'module.smart-notes.configure'
  | 'module.fast-smart-notes.access'
  | 'module.fast-smart-notes.configure'
  | 'module.pdf-generator.configure'
  // Permissões do Módulo de Feed
  | 'module.feed.view'
  | 'module.feed.create_post'
  | 'module.feed.submit_for_review'
  | 'module.feed.approve_posts'
  | 'module.feed.publish_approved_post'
  | 'module.feed.publish_without_approval'
  | 'module.feed.edit_own_post'
  | 'module.feed.edit_any_post'
  | 'module.feed.delete_own_post'
  | 'module.feed.delete_any_post'
  | 'module.feed.manage_comments'
  | 'module.feed.configure'
  | 'module.feed.assign_author'
  | 'module.feed.view_audit_trail'
  // Novas permissões
  | 'instance.settings.company_fields.edit'
  | 'master.manual.manage'
  | 'master.performance.manage'
  | 'instance.plans.manage'
  | 'master.plans.manage'
  | 'instance.settings.user_fields.edit'
  | 'master.lexical.configure'
  | 'master.lexical.presets.manage'
  // Calc Genius
  | 'module.calc-genius.view'
  | 'module.calc-genius.groups.manage'
  | 'module.calc-genius.fields.manage'
  | 'module.calc-genius.formulas.manage';

export interface Permission {
  id: PermissionId;
  name: string;
  description: string;
  category: 'master' | 'instance' | 'module' | 'subinstance' | 'general';
  moduleId?: string;
  masterOnly?: boolean; // Nova propriedade
}

export const availablePermissions: Permission[] = [
  // Master - Configurações Globais (todas masterOnly)
  { id: 'master.settings.general.edit', name: 'Editar Configurações Gerais (Master)', description: 'Permite editar as configurações gerais globais do sistema.', category: 'master', masterOnly: true },
  { id: 'master.settings.appearance.edit', name: 'Editar Aparência (Master)', description: 'Permite editar as configurações de aparência globais.', category: 'master', masterOnly: true },
  { id: 'master.settings.access_methods.edit', name: 'Editar Formas de Acesso (Master)', description: 'Permite editar as formas de acesso globais.', category: 'master', masterOnly: true },
  { id: 'master.settings.user_fields.edit', name: 'Editar Campos de Cadastro de Usuário (Master)', description: 'Permite editar os campos padrão para cadastro de usuários.', category: 'master', masterOnly: true },
  { id: 'master.settings.company_fields.edit', name: 'Editar Campos de Cadastro de Empresa (Master)', description: 'Permite editar os campos padrão para cadastro de empresas.', category: 'master', masterOnly: true },
  { id: 'master.settings.menu.edit', name: 'Editar Menus (Master)', description: 'Permite editar a estrutura de menus (grupos, itens) no nível Master.', category: 'master', masterOnly: true },
  { id: 'master.menu.sync_defaults', name: 'Sincronizar Padrões de Menu (Master)', description: 'Permite sincronizar/resetar o menu Master para os padrões do sistema.', category: 'master', masterOnly: true },

  // Master - Gestão de Instâncias (todas masterOnly)
  { id: 'master.instance.create', name: 'Criar Novas Instâncias', description: 'Permite criar novas instâncias de cliente.', category: 'master', masterOnly: true },
  { id: 'master.instance.view_all', name: 'Visualizar Todas Instâncias', description: 'Permite ver a lista de todas as instâncias.', category: 'master', masterOnly: true },
  { id: 'master.instance.edit_details', name: 'Editar Detalhes da Instância', description: 'Permite editar nome, slug, domínio da instância.', category: 'master', masterOnly: true },
  { id: 'master.instance.manage_status', name: 'Gerenciar Status da Instância', description: 'Permite ativar ou desativar instâncias.', category: 'master', masterOnly: true },
  { id: 'master.instance.delete', name: 'Excluir Instâncias', description: 'Permite excluir instâncias (ação perigosa).', category: 'master', masterOnly: true },

  // Master - Módulos (todas masterOnly)
  { id: 'master.modules.view_definitions', name: 'Visualizar Definições de Módulos (Master)', description: 'Permite visualizar a lista de definições de módulos globais.', category: 'master', masterOnly: true },
  { id: 'master.modules.create', name: 'Criar Definições de Módulos', description: 'Permite criar novas definições de módulos globais.', category: 'master', masterOnly: true },
  { id: 'master.modules.edit', name: 'Editar Definições de Módulos', description: 'Permite editar definições de módulos globais (nome, ícone, status global).', category: 'master', masterOnly: true },
  { id: 'master.modules.delete', name: 'Excluir Definições de Módulos', description: 'Permite excluir definições de módulos globais.', category: 'master', masterOnly: true },
  { id: 'master.modules.import', name: 'Importar/Registrar Módulos Descobertos', description: 'Permite registrar módulos que existem como pastas mas não no Firestore.', category: 'master', masterOnly: true },

  // Master - Níveis de Acesso (todas masterOnly)
  { id: 'master.access_levels.create', name: 'Criar Templates de Níveis de Acesso', description: 'Permite criar novos templates de níveis de acesso globais.', category: 'master', masterOnly: true },
  { id: 'master.access_levels.edit', name: 'Editar Templates de Níveis de Acesso', description: 'Permite editar templates de níveis de acesso globais.', category: 'master', masterOnly: true },
  { id: 'master.access_levels.delete', name: 'Excluir Templates de Níveis de Acesso', description: 'Permite excluir templates de níveis de acesso globais.', category: 'master', masterOnly: true },

  // Master - Usuários e Empresas Globais (todas masterOnly)
  { id: 'master.users.create_global', name: 'Criar Usuários Globais (Master)', description: 'Permite criar usuários no nível Master, não atrelados a instâncias.', category: 'master', masterOnly: true },
  { id: 'master.users.view_global', name: 'Visualizar Usuários Globais (Master)', description: 'Permite visualizar usuários no nível Master.', category: 'master', masterOnly: true },
  { id: 'master.users.update_global', name: 'Editar Usuários Globais (Master)', description: 'Permite editar as informações de usuários no nível Master.', category: 'master', masterOnly: true },
  { id: 'master.companies.view', name: 'Visualizar Empresas Globais (Master)', description: 'Permite visualizar empresas cadastradas no nível Master.', category: 'master', masterOnly: true },
  { id: 'master.companies.create', name: 'Criar Empresas Globais (Master)', description: 'Permite cadastrar novas empresas no nível Master.', category: 'master', masterOnly: true },
  { id: 'master.companies.edit', name: 'Editar Empresas Globais (Master)', description: 'Permite editar dados de empresas no nível Master.', category: 'master', masterOnly: true },
  { id: 'master.companies.delete', name: 'Excluir Empresas Globais (Master)', description: 'Permite excluir empresas do nível Master.', category: 'master', masterOnly: true },
  
  // Master - Sincronização e IA (todas masterOnly)
  { id: 'master.sync.manage', name: 'Gerenciar Sincronização de Dados (Master)', description: 'Permite controlar processos de sincronização entre Master e instâncias.', category: 'master', masterOnly: true },
  { id: 'master.ia_integrations.manage', name: 'Gerenciar Integrações de IA (Master)', description: 'Permite configurar provedores e modelos de IA.', category: 'master', moduleId: 'ai-module', masterOnly: true },
  { id: 'master.ia_integrations.set_default', name: 'Definir IA Padrão (Master)', description: 'Permite escolher qual integração de IA é a padrão do sistema.', category: 'master', moduleId: 'ai-module', masterOnly: true },

  // Instance - Permissões que podem ser delegadas
  { id: 'instance.dashboard.view', name: 'Visualizar Dashboard da Instância', description: 'Permite acesso ao dashboard principal da instância.', category: 'instance' },
  { id: 'instance.settings.general.edit', name: 'Editar Configurações Gerais da Instância', description: 'Permite editar configurações gerais da instância.', category: 'instance' },
  { id: 'instance.settings.appearance.edit', name: 'Editar Aparência da Instância', description: 'Permite editar a aparência visual da instância.', category: 'instance' },
  { id: 'instance.settings.access_methods.edit', name: 'Editar Formas de Acesso da Instância', description: 'Permite editar as formas de acesso para a instância.', category: 'instance' },
  { id: 'instance.settings.menu.edit', name: 'Editar Menu da Instância', description: 'Permite personalizar o menu lateral para a instância.', category: 'instance' },
  { id: 'instance.users.manage', name: 'Gerenciar Usuários da Instância (geral)', description: 'Permissão ampla para gerenciamento de usuários da instância (usar com cautela).', category: 'instance' },
  { id: 'instance.users.invite', name: 'Convidar Usuários para Instância', description: 'Permite enviar convites para novos usuários na instância.', category: 'instance', moduleId: 'invite' },
  { id: 'instance.users.view_list', name: 'Visualizar Lista de Usuários da Instância', description: 'Permite ver a lista de usuários da instância.', category: 'instance' },
  { id: 'instance.users.edit_details', name: 'Editar Detalhes de Usuários da Instância', description: 'Permite editar informações de perfil dos usuários da instância.', category: 'instance' },
  { id: 'instance.users.manage_access', name: 'Gerenciar Acesso de Usuários da Instância', description: 'Permite alterar níveis de acesso ou status de usuários da instância.', category: 'instance' },
  { id: 'instance.users.delete', name: 'Excluir Usuários da Instância', description: 'Permite remover usuários da instância.', category: 'instance' },
  { id: 'instance.subinstances.manage', name: 'Gerenciar Sub-instâncias', description: 'Permite criar, editar e excluir sub-instâncias dentro da instância.', category: 'instance' },
  { id: 'instance.modules.manage_status', name: 'Gerenciar Status de Módulos da Instância', description: 'Permite ativar ou desativar módulos para a instância.', category: 'instance' },
  { id: 'instance.companies.view', name: 'Visualizar Empresas (Instância)', description: 'Permite visualizar empresas associadas à instância.', category: 'instance' },
  { id: 'instance.companies.create', name: 'Cadastrar Empresas (Instância)', description: 'Permite cadastrar novas empresas dentro da instância.', category: 'instance' },
  { id: 'instance.companies.edit', name: 'Editar Empresas (Instância)', description: 'Permite editar dados de empresas associadas à instância.', category: 'instance' },
  { id: 'instance.companies.delete', name: 'Excluir Empresas (Instância)', description: 'Permite excluir empresas associadas à instância.', category: 'instance' },

  // Module-specific permissions (geralmente não são masterOnly)
  { id: 'module.invite.configure', name: 'Configurar Módulo de Convites (Operacional)', description: 'Permite alterar as configurações operacionais do módulo de convites (prefixo, validade, templates).', category: 'module', moduleId: 'invite' },
  { id: 'module.storage.configure', name: 'Configurar Módulo de Armazenamento (Operacional)', description: 'Permite alterar as configurações operacionais do módulo de armazenamento (provedor, caminhos).', category: 'module', moduleId: 'storage' },
  { id: 'module.storage.view', name: 'Visualizar Módulo de Armazenamento', description: 'Permite visualizar o módulo de armazenamento.', category: 'module', moduleId: 'storage' },
  { id: 'module.storage.upload', name: 'Fazer Upload de Arquivos', description: 'Permite fazer upload de arquivos no módulo de armazenamento.', category: 'module', moduleId: 'storage' },
  { id: 'module.storage.rename', name: 'Renomear Arquivos', description: 'Permite renomear arquivos no módulo de armazenamento.', category: 'module', moduleId: 'storage' },
  { id: 'module.storage.delete', name: 'Excluir Arquivos', description: 'Permite excluir arquivos no módulo de armazenamento.', category: 'module', moduleId: 'storage' },
  { id: 'module.payment.configure', name: 'Configurar Módulo de Pagamento (Operacional)', description: 'Permite alterar as configurações operacionais do módulo de pagamento (gateways ativos).', category: 'module', moduleId: 'payment' },
  { id: 'module.smart-notes.access', name: 'Acessar Smart Notes', description: 'Permite visualizar e usar o módulo Smart Notes.', category: 'module', moduleId: 'smart-notes' },
  { id: 'module.smart-notes.configure', name: 'Configurar Módulo Smart Notes (Operacional)', description: 'Permite alterar as configurações operacionais do módulo Smart Notes.', category: 'module', moduleId: 'smart-notes' },
  { id: 'module.fast-smart-notes.access', name: 'Acessar Fast Smart Notes', description: 'Permite visualizar e usar o módulo Fast Smart Notes.', category: 'module', moduleId: 'fast-smart-notes' },
  { id: 'module.fast-smart-notes.configure', name: 'Configurar Módulo Fast Smart Notes (Operacional)', description: 'Permite alterar as configurações operacionais do módulo Fast Smart Notes.', category: 'module', moduleId: 'fast-smart-notes' },
  { id: 'module.pdf-generator.configure', name: 'Configurar Gerador de PDF', description: 'Permite alterar o layout e as configurações padrão dos PDFs gerados.', category: 'module', moduleId: 'pdf-generator' },
  
  // Permissões do Módulo de Feed
  { id: 'module.feed.view', name: 'Visualizar Feed', description: 'Permite ver os posts no feed da instância.', category: 'module', moduleId: 'feed' },
  { id: 'module.feed.create_post', name: 'Criar Posts', description: 'Permite que o usuário crie rascunhos de posts.', category: 'module', moduleId: 'feed' },
  { id: 'module.feed.submit_for_review', name: 'Submeter para Revisão', description: 'Permite que um usuário submeta um rascunho para aprovação.', category: 'module', moduleId: 'feed' },
  { id: 'module.feed.approve_posts', name: 'Aprovar Posts', description: 'Permite que o usuário aprove ou reprove posts pendentes de revisão.', category: 'module', moduleId: 'feed' },
  { id: 'module.feed.publish_approved_post', name: 'Publicar Post Aprovado', description: 'Permite que o usuário publique um post que já foi aprovado por um revisor.', category: 'module', moduleId: 'feed' },
  { id: 'module.feed.publish_without_approval', name: 'Publicar Posts Diretamente', description: 'Permite que o usuário publique posts sem necessidade de aprovação.', category: 'module', moduleId: 'feed' },
  { id: 'module.feed.edit_own_post', name: 'Editar Posts Próprios', description: 'Permite que o usuário edite seus próprios posts.', category: 'module', moduleId: 'feed' },
  { id: 'module.feed.edit_any_post', name: 'Editar Qualquer Post', description: 'Permite que o usuário edite posts de qualquer autor na instância.', category: 'module', moduleId: 'feed' },
  { id: 'module.feed.delete_own_post', name: 'Excluir Posts Próprios', description: 'Permite que o usuário exclua seus próprios posts.', category: 'module', moduleId: 'feed' },
  { id: 'module.feed.delete_any_post', name: 'Excluir Qualquer Post', description: 'Permite que o usuário exclua posts de qualquer autor na instância.', category: 'module', moduleId: 'feed' },
  { id: 'module.feed.manage_comments', name: 'Gerenciar Comentários', description: 'Permite que o usuário aprove, reprove ou exclua comentários em qualquer post.', category: 'module', moduleId: 'feed' },
  { id: 'module.feed.configure', name: 'Configurar Módulo de Feed', description: 'Permite alterar as configurações operacionais do módulo de feed para a instância.', category: 'module', moduleId: 'feed' },
  { id: 'module.feed.assign_author', name: 'Atribuir Autoria', description: 'Permite alterar o autor exibido em uma publicação.', category: 'module', moduleId: 'feed' },
  { id: 'module.feed.view_audit_trail', name: 'Ver Histórico de Auditoria', description: 'Permite visualizar o histórico de criação e modificações de um post.', category: 'module', moduleId: 'feed' },

  // Novas permissões
  { id: 'instance.settings.company_fields.edit', name: 'Editar Campos de Empresa (Instância)', description: 'Permite editar os campos de cadastro de empresas para a instância.', category: 'instance' },
  { id: 'master.manual.manage', name: 'Gerenciar Manual (Master)', description: 'Permite gerenciar o manual de ajuda do sistema.', category: 'master', masterOnly: true },
  { id: 'master.performance.manage', name: 'Gerenciar Performance (Master)', description: 'Permite gerenciar as configurações de performance do sistema.', category: 'master', masterOnly: true },
  { id: 'instance.plans.manage', name: 'Gerenciar Planos (Instância)', description: 'Permite gerenciar os planos de assinatura da instância.', category: 'instance' },
  { id: 'master.plans.manage', name: 'Gerenciar Planos (Master)', description: 'Permite gerenciar os planos de assinatura do sistema.', category: 'master', masterOnly: true },
  { id: 'instance.settings.user_fields.edit', name: 'Editar Campos de Usuário (Instância)', description: 'Permite editar os campos de cadastro de usuários para a instância.', category: 'instance' },
  { id: 'master.lexical.configure', name: 'Configurar Lexical (Master)', description: 'Permite configurar o editor Lexical.', category: 'master', masterOnly: true },
  { id: 'master.lexical.presets.manage', name: 'Gerenciar Presets do Lexical (Master)', description: 'Permite gerenciar os presets do editor Lexical.', category: 'master', masterOnly: true },

  // Calc Genius
  { id: 'module.calc-genius.view', name: 'Visualizar Calc Genius', description: 'Permite visualizar o módulo Calc Genius.', category: 'module', moduleId: 'calc-genius' },
  { id: 'module.calc-genius.groups.manage', name: 'Gerenciar Grupos (Calc Genius)', description: 'Permite gerenciar grupos no Calc Genius.', category: 'module', moduleId: 'calc-genius' },
  { id: 'module.calc-genius.fields.manage', name: 'Gerenciar Campos (Calc Genius)', description: 'Permite gerenciar campos no Calc Genius.', category: 'module', moduleId: 'calc-genius' },
  { id: 'module.calc-genius.formulas.manage', name: 'Gerenciar Fórmulas (Calc Genius)', description: 'Permite gerenciar fórmulas no Calc Genius.', category: 'module', moduleId: 'calc-genius' },
];

// **CORREÇÃO:** Gera um objeto onde todas as chaves de permissão são verdadeiras.
// Este é o objeto usado para o Modo Desenvolvedor e para o Master Admin, garantindo acesso total.
export const ALL_PERMISSIONS_TRUE: Partial<Record<PermissionId, boolean>> = 
  Object.fromEntries(availablePermissions.map(p => [p.id, true]));
