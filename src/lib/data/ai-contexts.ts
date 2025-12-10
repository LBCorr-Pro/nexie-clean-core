
export interface AiContext {
  id: string;
  name: string;
  description: string;
  category?: string; // Adicionando categoria para agrupamento
}

export const aiContexts: AiContext[] = [
  {
    id: 'post_creator_feed',
    name: 'Criador de Posts para o Feed',
    description: 'Usado no feed principal para ajudar os usuários a gerar conteúdo para novas postagens.',
    category: 'Conteúdo',
  },
  {
    id: 'support_chat_widget',
    name: 'Assistente de Suporte (Widget)',
    description: 'O chatbot principal que aparece no widget de suporte para responder a perguntas dos usuários.',
    category: 'Suporte',
  },
  {
    id: 'product_description_generator',
    name: 'Gerador de Descrição de Produto',
    description: 'Assistente na área de e-commerce para criar descrições de produtos ricas e otimizadas para SEO.',
    category: 'E-commerce',
  },
];
