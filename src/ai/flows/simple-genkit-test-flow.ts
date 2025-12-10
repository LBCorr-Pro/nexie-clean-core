'use server';

import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ai = genkit({ plugins: [googleAI()] });

const SimpleInputSchema = z.object({
  text: z.string(),
});

const SimpleOutputSchema = z.object({
  text: z.string(),
});

export const simpleGenkitTestFlow = ai.defineFlow(
  {
    name: 'simpleGenkitTestFlow',
    inputSchema: SimpleInputSchema,
    outputSchema: SimpleOutputSchema,
  },
  async (input) => {
    console.log('[simpleGenkitTestFlow] Starting flow with input:', input.text);

    try {
      const llmResponse = await ai.generate({
        model: googleAI.model('gemini-1.5-flash-latest'),
        prompt: input.text,
      });

      const textResponse = llmResponse.text; // CORREÇÃO: Acessado como um getter, não um método.
      console.log('[simpleGenkitTestFlow] LLM response:', textResponse);

      return { text: textResponse };
    } catch (e: any) {
      console.error('[simpleGenkitTestFlow] Error:', e.stack || e.message);
      throw e;
    }
  }
);
