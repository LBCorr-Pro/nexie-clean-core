// src/ai/flows/debug-flow.ts
'use server';

import ai from '@/ai/dev'; // Usa a instância global já configurada
import { googleAI } from '@genkit-ai/google-genai'; // Importa para referenciar o modelo
import { z } from 'zod';
import { refs } from '@/lib/firestore-refs';
import { Timestamp, addDoc } from 'firebase/firestore'; // CORREÇÃO: Importa do client-side SDK

const DebugFlowInputSchema = z.object({
  prompt: z.string().describe("The user's text prompt."),
});
type DebugFlowInput = z.infer<typeof DebugFlowInputSchema>;

const DebugFlowOutputSchema = z.object({
  response: z.string().optional().describe('The text response from the AI model.'),
  error: z.string().optional().describe('An error message if the operation failed.'),
});
type DebugFlowOutput = z.infer<typeof DebugFlowOutputSchema>;

export async function runDebugFlow(input: DebugFlowInput): Promise<DebugFlowOutput> {
  return debugFlow(input);
}

const debugFlow = ai.defineFlow(
  {
    name: 'debugFlow',
    inputSchema: DebugFlowInputSchema,
    outputSchema: DebugFlowOutputSchema,
  },
  async (input: DebugFlowInput): Promise<DebugFlowOutput> => {
    const logsCollectionRef = refs.master.aiMonitoringLogs();
    
    console.log(`[debugFlow] Started with prompt: "${input.prompt.substring(0, 30)}..."`);
    
    try {
      const model = googleAI.model('gemini-1.5-flash'); // CORREÇÃO: Mantido gemini-1.5-flash como no original
      console.log(`[debugFlow] Calling model: gemini-1.5-flash`);

      const llmResponse = await ai.generate({
        model: model, 
        prompt: input.prompt,
      });

      const responseText = llmResponse.text;
      console.log('[debugFlow] Received response from AI successfully.');

      // Log de sucesso
      // CORREÇÃO: Usa a função addDoc
      await addDoc(logsCollectionRef, {
        assistantId: 'debug_flow',
        assistantName: 'Fluxo de Debug',
        userInput: input.prompt,
        aiOutput: responseText,
        status: 'success',
        timestamp: Timestamp.now(),
        cost: 0, 
      });

      return { response: responseText };

    } catch (e: any) {
      console.error("[debugFlow] Error during execution:", e);
      
      // Log de erro
      // CORREÇÃO: Usa a função addDoc
      await addDoc(logsCollectionRef, {
        assistantId: 'debug_flow',
        assistantName: 'Fluxo de Debug',
        userInput: input.prompt,
        aiOutput: null,
        status: 'error',
        errorDetails: e.message || 'An unknown error occurred in the debug flow.',
        timestamp: Timestamp.now(),
        cost: 0,
      });

      return { error: e.message || 'An unknown error occurred in the debug flow.' };
    }
  }
);
