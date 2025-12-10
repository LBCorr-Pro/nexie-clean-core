// src/modules/ai-settings/components/TestTab.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Send } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/nx-use-toast';
import { onSnapshot, query, orderBy } from 'firebase/firestore';
import { refs } from '@/lib/firestore-refs';
import type { AIAssistant } from '../types';
import { runAssistantFlow } from '@/modules/ai-settings/flows/run-assistant-flow';

export function TestTab() {
    const { toast } = useToast();
    const [assistants, setAssistants] = useState<AIAssistant[]>([]);
    const [selectedAssistantId, setSelectedAssistantId] = useState<string>("");
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isThinking, setIsThinking] = useState(false);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        const q = query(refs.master.aiAssistants(), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedAssistants = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as AIAssistant[];
            setAssistants(fetchedAssistants);
            if (fetchedAssistants.length > 0 && !selectedAssistantId) {
                setSelectedAssistantId(fetchedAssistants[0].id);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [selectedAssistantId]);

    const handleRun = async () => {
        if (!selectedAssistantId || !prompt) {
            toast({ title: "Entrada Inválida", description: "Selecione um assistente e insira um prompt.", variant: "destructive" });
            return;
        }

        setIsThinking(true);
        setResult(null);
        
        try {
            const output = await runAssistantFlow({ assistantId: selectedAssistantId, userInput: prompt });
            if (output.error) {
                throw new Error(output.error);
            }
            setResult(output);
            toast({ title: "Execução Concluída", description: "O assistente respondeu com sucesso." });
        } catch (error: any) {
            console.error("Erro ao executar o assistente:", error);
            setResult({ error: error.message || 'Ocorreu um erro desconhecido.' });
            toast({ title: "Erro na Execução", description: error.message, variant: "destructive" });
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Testar Assistentes</CardTitle>
                <CardDescription>Execute testes em tempo real com seus assistentes configurados para verificar suas respostas, prompts e configurações.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="col-span-1 md:col-span-1">
                        <label htmlFor="assistant-select" className="text-sm font-medium">Assistente</label>
                        <Select value={selectedAssistantId} onValueChange={setSelectedAssistantId} disabled={isLoading || isThinking}>
                            <SelectTrigger id="assistant-select">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoading ? (
                                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                                ) : (
                                    assistants.map(assistant => (
                                        <SelectItem key={assistant.id} value={assistant.id}>{assistant.name}</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-1 md:col-span-3">
                        <label htmlFor="prompt-textarea" className="text-sm font-medium">Prompt do Usuário</label>
                        <Textarea
                            id="prompt-textarea"
                            placeholder="Digite sua pergunta ou instrução aqui..."
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            rows={3}
                            disabled={isThinking}
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-4">
                 <Button onClick={handleRun} disabled={!selectedAssistantId || !prompt || isThinking || isLoading} className="w-full">
                    {isThinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} 
                    {isThinking ? 'Processando...' : 'Executar Assistente'}
                </Button>

                {result && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted/50 w-full">
                        <h3 className="font-semibold mb-2">Resultado da Execução</h3>
                        {result.textResponse && (
                            <div className="text-sm whitespace-pre-wrap">{result.textResponse}</div>
                        )}
                        {result.mediaUrl && (
                             <div className="mt-2">
                                <p className="text-sm font-medium">Mídia Gerada:</p>
                                 {result.mediaUrl.startsWith('data:audio') ? (
                                     <audio controls src={result.mediaUrl} className="w-full mt-1">
                                         Seu navegador não suporta o elemento de áudio.
                                     </audio>
                                 ) : (
                                    <Image src={result.mediaUrl} alt="Mídia gerada" width={512} height={512} className="rounded-md max-w-full h-auto mt-1" />
                                 )}
                            </div>
                        )}
                        {result.error && (
                            <p className="text-red-500 text-sm"><strong>Erro:</strong> {result.error}</p>
                        )}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
