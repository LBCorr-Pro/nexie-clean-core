'use client';

import { useDocumentData } from 'react-firebase-hooks/firestore';
import { refs } from '@/lib/firestore-refs';

// Hook para resolver qual ID de assessor usar com base no contexto e escopo.
export function useResolvedAIAssistant(contextId: string, instanceId?: string) {
  const DEFAULT_ASSISTANT_ID = 'asst_general_default'; // ID de fallback

  // 1. Tenta buscar as atribuições da Instância
  const [instanceAssignments, loadingInstance] = useDocumentData(
    instanceId ? refs.instance.aiContextAssignmentsDoc(instanceId) : undefined
  );

  // 2. Tenta buscar as atribuições do Master
  const [masterAssignments, loadingMaster] = useDocumentData(
    refs.master.aiContextAssignmentsDoc()
  );

  const loading = loadingInstance || loadingMaster;

  // 3. Lógica de Resolução
  let resolvedAssistantId = DEFAULT_ASSISTANT_ID;
  let resolutionSource: 'instance' | 'master' | 'default' = 'default';

  if (!loading) {
    const instanceAssistantId = instanceAssignments?.[contextId];
    const masterAssistantId = masterAssignments?.[contextId];

    if (instanceId && instanceAssistantId) {
      resolvedAssistantId = instanceAssistantId;
      resolutionSource = 'instance';
    } else if (masterAssistantId) {
      resolvedAssistantId = masterAssistantId;
      resolutionSource = 'master';
    }
  }

  return { 
    assistantId: resolvedAssistantId, 
    loading, 
    source: resolutionSource 
  };
}
