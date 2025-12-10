'use client';

import React, { useState, useMemo } from 'react';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { aiContexts } from '@/lib/data/ai-contexts';
import { refs } from '@/lib/firestore-refs';
import { AIAssistant } from '@/modules/ai-settings/types';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AiContextManagerProps {
  scope: 'master' | 'instance';
  instanceId?: string;
}

export function AiContextManager({ scope, instanceId }: AiContextManagerProps) {
  // 1. Fetch Data
  const [assistants, loadingAssistants] = useCollectionData<AIAssistant>(refs.master.aiAssistants());
  
  const assignmentsRef = scope === 'instance' && instanceId 
    ? refs.instance.aiContextAssignmentsDoc(instanceId)
    : refs.master.aiContextAssignmentsDoc();
  
  const [assignments, loadingAssignments, errorAssignments] = useDocumentData(assignmentsRef);

  const [masterAssignments, loadingMasterAssignments] = useDocumentData(refs.master.aiContextAssignmentsDoc());

  // 2. State
  const [isSaving, setIsSaving] = useState(false);

  // 3. Memoization
  const sortedContexts = useMemo(() => aiContexts.sort((a, b) => a.name.localeCompare(b.name)), []);
  const sortedAssistants = useMemo(() => assistants?.sort((a: AIAssistant, b: AIAssistant) => a.name.localeCompare(b.name)), [assistants]);

  // 4. Handlers
  const handleAssignmentChange = async (contextId: string, newAssistantId: string) => {
    setIsSaving(true);
    const currentAssignments = assignments ? { ...assignments } : {};
    
    if (newAssistantId === '__inherit__') {
      delete currentAssignments[contextId];
    } else {
      currentAssignments[contextId] = newAssistantId;
    }

    try {
      await setDoc(assignmentsRef, currentAssignments, { merge: true });
      toast.success('Contexto atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Falha ao atualizar o contexto.', { description: error.message });
    }
    setIsSaving(false);
  };

  // 5. Render Logic
  const getAssignmentDetails = (contextId: string) => {
    if (scope === 'instance' && assignments && assignments[contextId]) {
      const assistant = assistants?.find((a: AIAssistant) => a.id === assignments[contextId]);
      return { id: assistant?.id, name: assistant?.name, source: 'instance' as const };
    }
    if (masterAssignments && masterAssignments[contextId]) {
      const assistant = assistants?.find((a: AIAssistant) => a.id === masterAssignments[contextId]);
      return { id: assistant?.id, name: assistant?.name, source: 'master' as const };
    }
    return { id: null, name: 'Nenhum (Padrão do sistema)', source: 'default' as const };
  };

  if (loadingAssistants || loadingAssignments || loadingMasterAssignments) {
    return <div>Carregando contextos e assessores...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Contextos de IA</CardTitle>
        <CardDescription>
          Atribua um Assessor de IA específico para cada contexto de uso no sistema.
          {scope === 'instance' && ' As configurações aqui substituem as configurações master.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedContexts.map(context => {
          const { id: assignedId, name: assignedName, source } = getAssignmentDetails(context.id);
          return (
            <div key={context.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg">
              <div className="mb-4 sm:mb-0">
                <h3 className="font-semibold">{context.name}</h3>
                <p className="text-sm text-muted-foreground">{context.description}</p>
                <p className="text-xs mt-1">
                  <span className="font-medium">Atual:</span> {assignedName} 
                  {scope === 'instance' && source !== 'default' && 
                    <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${source === 'instance' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {source === 'instance' ? 'Nesta Instância' : 'Master'}
                    </span>
                  }
                </p>
              </div>
              <div className="w-full sm:w-64">
                <Select
                  value={scope === 'instance' && (!assignments || !assignments[context.id]) ? '__inherit__' : assignedId || undefined}
                  onValueChange={(value) => handleAssignmentChange(context.id, value)}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Trocar assessor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {scope === 'instance' && <SelectItem value="__inherit__">Herdar de Master</SelectItem>}
                    {sortedAssistants?.map((assistant: AIAssistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
