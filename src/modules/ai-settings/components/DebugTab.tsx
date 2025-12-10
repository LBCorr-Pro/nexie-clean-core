// src/modules/ai-settings/components/DebugTab.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Bug, Mic } from 'lucide-react';
import { useToast } from "@/hooks/nx-use-toast";
import { Separator } from '@/components/ui/separator';
import { debugTtsWithGenkit, debugTtsWithGoogleCloud } from '../flows/debug-tts-flow';

export function DebugTab() {
  const { toast } = useToast();
  
  const [ttsPrompt, setTtsPrompt] = useState('Hello, this is a test of the text-to-speech generation.');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ mediaUrl?: string | null, error?: string | null }>({});

  const handleTtsTest = async (testFunction: (input: { prompt: string }) => Promise<any>, testName: string) => {
    if (!ttsPrompt.trim()) {
      toast({ title: "O prompt de TTS não pode ser vazio", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    setResult({});
    toast({ title: `Iniciando teste: ${testName}` });

    try {
      const output = await testFunction({ prompt: ttsPrompt });
      if (output.error) {
        throw new Error(output.error);
      }
      setResult(output);
      toast({
        title: `Teste ${testName} Concluído`,
        description: "O resultado (áudio ou erro) é exibido abaixo.",
      });
    } catch (e: any) {
      const errorMessage = e.message || 'Ocorreu um erro desconhecido.';
      setResult({ error: errorMessage });
      toast({
        title: `Erro no Teste ${testName}`,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Bug className="mr-2"/>Aba de Debug de IA</CardTitle>
        <CardDescription>
          Use esta seção para executar testes de diagnóstico isolados nas capacidades de IA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Seção de Teste de Text-to-Speech (TTS) */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold flex items-center"><Mic className="mr-2"/>Teste de Geração de Áudio (Text-to-Speech)</h3>
          <p className="text-sm text-muted-foreground">
            Insira um texto e execute os testes para gerar áudio usando diferentes métodos de backend. 
            Isso ajuda a diagnosticar problemas de conectividade e configuração com as APIs de TTS.
          </p>
          <div className="space-y-2">
            <Label htmlFor="tts-input">Texto para Converter em Áudio</Label>
            <Textarea
              id="tts-input"
              rows={3}
              value={ttsPrompt}
              onChange={(e) => setTtsPrompt(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleTtsTest(debugTtsWithGenkit, 'Genkit TTS')} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Testar com Genkit
            </Button>
            <Button onClick={() => handleTtsTest(debugTtsWithGoogleCloud, 'Google Cloud SDK')} disabled={isLoading} variant="outline">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Testar com Google Cloud SDK
            </Button>
          </div>
          {(result.mediaUrl || result.error) && (
            <div className="space-y-2 pt-4 border-t">
              <Label className="font-semibold">Resultado do Teste</Label>
              <div className="text-sm p-4 bg-muted rounded-md min-h-[60px] w-full">
                {isLoading ? (
                  <p>Aguardando...</p>
                ) : result.mediaUrl ? (
                  <audio controls src={result.mediaUrl} className="w-full">
                    Seu navegador não suporta o elemento de áudio.
                  </audio>
                ) : result.error ? (
                  <p className="text-red-500 whitespace-pre-wrap font-mono">{result.error}</p>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Outros testes de debug podem ser adicionados aqui no futuro. */}

      </CardContent>
    </Card>
  );
}
