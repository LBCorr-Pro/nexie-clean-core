'use client';

import React, { useState } from 'react';
import { runAssistantFlow } from '@/modules/ai-settings/flows/run-assistant-flow';
import { RunAssistantOutput } from '@/modules/ai-settings/types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface AIAssistantInterfaceProps {
  assistantId: string;
}

export function AIAssistantInterface({ assistantId }: AIAssistantInterfaceProps) {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<RunAssistantOutput | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setIsLoading(true);
    setResponse(null);
    const toastId = toast.loading('Aguardando resposta da IA...');

    try {
      const result = await runAssistantFlow({ assistantId, userInput });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setResponse(result);
      toast.success('IA respondeu com sucesso!', { id: toastId });

    } catch (error: any) {
      console.error('Error running assistant flow:', error);
      setResponse({ error: error.message || 'Ocorreu um erro desconhecido.' });
      toast.error('Erro ao executar a IA.', { id: toastId, description: error.message });
    }

    setIsLoading(false);
  };

  const renderResponse = () => {
    if (!response) return null;

    if (response.error) {
      return (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{response.error}</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        {response.textResponse && (
            <div className="prose dark:prose-invert rounded-md border bg-muted p-4">
                {response.textResponse}
            </div>
        )}
        {response.mediaUrl && (
          <div>
            {response.mediaUrl.startsWith('data:audio') && <audio controls src={response.mediaUrl} className="w-full" />}
            {response.mediaUrl.startsWith('data:image') && <Image src={response.mediaUrl} alt="AI Generated Image" className="rounded-lg shadow-md max-w-full h-auto" width={512} height={512} />}
            {response.mediaUrl.startsWith('data:video') && <video controls src={response.mediaUrl} className="rounded-lg shadow-md max-w-full h-auto" />}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Textarea
              placeholder="Digite sua solicitação aqui..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
            <div className="h-24"> 
              {renderResponse()}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isLoading || !userInput.trim()}>
            {isLoading ? 'Gerando...' : 'Enviar'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
