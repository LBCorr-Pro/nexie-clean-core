// src/lib/data/editor-contexts.ts

export interface EditorContextDefinition {
  id: string; // O contextId usado no componente SmartRichTextEditor
  name: string; // Um nome amigável para a UI
  description: string; // Descrição de onde este editor é usado
}

/**
 * Este arquivo é o manifesto de todos os contextos de editor de texto rico na aplicação.
 * Cada vez que um <SmartRichTextEditor> é adicionado a um novo local, seu 'contextId'
 * deve ser registrado aqui para que apareça no painel de gerenciamento.
 */
export const editorContexts: EditorContextDefinition[] = [
  {
    id: "invite_email",
    name: "Convite por E-mail",
    description: "Template padrão para o corpo do e-mail de convite.",
  },
  {
    id: "invite_whatsapp",
    name: "Convite por WhatsApp",
    description: "Template padrão para a mensagem de convite do WhatsApp.",
  },
  // Adicione novos contextos de editor aqui conforme são criados na aplicação.
];
