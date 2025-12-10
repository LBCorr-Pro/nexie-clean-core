
'use server';
/**
 * @fileOverview An AI agent that translates text to English.
 *
 * - translateToEnglish - A function that translates text to English.
 * - TranslateToEnglishInput - The input type for the translateToEnglish function.
 * - TranslateToEnglishOutput - The return type for the translateToEnglish function.
 */

import ai from '@/ai/dev';
import {z} from 'genkit';

const TranslateToEnglishInputSchema = z.object({
  text: z.string().describe('The text to translate to English.'),
});
export type TranslateToEnglishInput = z.infer<typeof TranslateToEnglishInputSchema>;

const TranslateToEnglishOutputSchema = z.object({
  translatedText: z.string().optional(), // Tornar opcional para acomodar erros
  error: z.string().optional().describe('Error message if translation failed.'),
});
export type TranslateToEnglishOutput = z.infer<typeof TranslateToEnglishOutputSchema>;

export async function translateToEnglish(input: TranslateToEnglishInput): Promise<TranslateToEnglishOutput> {
  // Basic check to avoid translating empty or very short strings if desired
  if (!input.text.trim() || input.text.trim().length < 2) {
    return { translatedText: input.text };
  }
  // O fluxo agora lida com try/catch e retorna o erro estruturado
  return translateToEnglishFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateToEnglishPrompt',
  input: {schema: TranslateToEnglishInputSchema},
  output: {schema: z.object({ translatedText: z.string() })}, // O prompt em si ainda espera só o texto traduzido
  prompt: `Translate the following text to English. Provide only the translated text.
If the input text is already in English or is a proper noun that shouldn't be translated (like a brand name), return it as is.
Ensure the output is suitable for use as a base for a URL slug (e.g., prefer lowercase, simple terms if multiple translations exist).

Text to translate: {{{text}}}`.trim(),
});

const translateToEnglishFlow = ai.defineFlow(
  {
    name: 'translateToEnglishFlow',
    inputSchema: TranslateToEnglishInputSchema,
    outputSchema: TranslateToEnglishOutputSchema, // Usar o schema de output atualizado
  },
  async (input: TranslateToEnglishInput): Promise<TranslateToEnglishOutput> => {
    try {
      const response = await prompt(input);
      
      if (!response || !response.output || response.output.translatedText === undefined) {
        console.error("TranslateToEnglishFlow: AI did not return an output or translatedText was undefined.");
        return { error: "Falha na tradução: resposta inesperada da IA." };
      }
      return { translatedText: response.output.translatedText };
    } catch (e: any) {
      console.error("Error in translateToEnglishFlow during prompt execution:", e);
      let errorMessage = "Falha na tradução.";
      if (e.message && (e.message.includes("429") || e.message.toLowerCase().includes("too many requests"))) {
        errorMessage = "Limite de chamadas à API de tradução excedido. Por favor, tente novamente mais tarde.";
      } else if (e.message) {
        errorMessage = `Erro de tradução: ${e.message}`;
      }
      return { error: errorMessage };
    }
  }
);
