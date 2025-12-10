import { AiContextManager } from '@/modules/ai-settings/components/AiContextManager';

export default function AiContextsPage() {
  // Por enquanto, esta página renderiza o gerenciador de contexto para o escopo 'master'.
  // Em uma aplicação real, a lógica para determinar o escopo e o instanceId seria mais complexa,
  // provavelmente baseada na URL ou permissões do usuário.
  return <AiContextManager scope="master" />;
}
