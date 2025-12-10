'use client';

import React from 'react';
import { useResolvedAIAssistant } from '@/hooks/useResolvedAIAssistant';
import { AIAssistantInterface } from '@/components/features/ai/AIAssistantInterface';

interface SmartAIAssistantProps {
  contextId: string;
  instanceId?: string; // Opcional, para determinar o escopo
}

export function SmartAIAssistant({ contextId, instanceId }: SmartAIAssistantProps) {
  const { assistantId, loading, source } = useResolvedAIAssistant(contextId, instanceId);

  if (loading) {
    return <div>Carregando assistente de IA...</div>;
  }

  return (
    <div>
      {/* Opcional: Renderizar de onde o assistente está vindo para depuração */}
      {/* <div className="text-xs text-muted-foreground mb-2">Source: {source}</div> */}
      <AIAssistantInterface assistantId={assistantId} />
    </div>
  );
}
