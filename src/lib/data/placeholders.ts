// src/lib/data/placeholders.ts

/**
 * Define a estrutura para um único placeholder.
 */
export interface Placeholder {
  /** O nome amigável do placeholder, exibido na UI. Ex: "Nome do Usuário" */
  label: string;
  /** O código real a ser copiado e inserido. Ex: "{{nome_do_usuario}}" */
  value: string;
  /** Uma breve descrição do que o placeholder representa. */
  description: string;
}

/**
 * Uma lista de placeholders disponíveis em todo o sistema.
 * Esta lista pode ser importada e utilizada por qualquer componente que precise de variáveis dinâmicas.
 */
export const availablePlaceholders: Placeholder[] = [
  {
    label: "Nome do Usuário",
    value: "{{nome_do_usuario}}",
    description: "O nome completo do usuário.",
  },
  {
    label: "Apelido do Usuário",
    value: "{{apelido_do_usuario}}",
    description: "O nome de usuário ou apelido.",
  },
  {
    label: "Email do Usuário",
    value: "{{email_do_usuario}}",
    description: "O endereço de e-mail do usuário.",
  },
  {
    label: "Nome do Sistema",
    value: "{{nome_do_sistema}}",
    description: "O nome completo da plataforma/sistema.",
  },
  {
    label: "Apelido do Sistema",
    value: "{{apelido_do_sistema}}",
    description: "O nome curto ou apelido do sistema.",
  },
  {
    label: "URL do Sistema",
    value: "{{url_do_sistema}}",
    description: "A URL base da plataforma.",
  },
  {
    label: "Link de Convite",
    value: "{{link_de_convite}}",
    description: "A URL única para um usuário aceitar um convite (usado no módulo de convites).",
  },
  // Adicione outros placeholders globais aqui conforme necessário
];
