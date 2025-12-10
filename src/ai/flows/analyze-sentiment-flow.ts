
// src/ai/flows/analyze-sentiment-flow.ts
'use server';

/**
 * @fileOverview An AI flow for analyzing the sentiment of a given text.
 *
 * - analyzeSentiment - A function that takes text and returns its sentiment.
 */
import ai from '@/ai/dev';
import { z } from 'zod';

const AnalyzeSentimentInputSchema = z.object({
  textToAnalyze: z.string().describe('The text content to analyze for sentiment.'),
});
export type AnalyzeSentimentInput = z.infer<typeof AnalyzeSentimentInputSchema>;

const AnalyzeSentimentOutputSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']).describe('The overall sentiment of the text.'),
  confidenceScore: z.number().min(0).max(1).describe('A score from 0 to 1 indicating the confidence of the sentiment analysis.'),
});
export type AnalyzeSentimentOutput = z.infer<typeof AnalyzeSentimentOutputSchema>;

export async function analyzeSentiment(
  input: AnalyzeSentimentInput
): Promise<AnalyzeSentimentOutput> {
  return analyzeSentimentFlow(input);
}

const sentimentPrompt = ai.definePrompt({
  name: 'sentimentAnalysisPrompt',
  input: { schema: AnalyzeSentimentInputSchema },
  output: { schema: AnalyzeSentimentOutputSchema },
  prompt: `Analyze the sentiment of the following text. Determine if it is positive, negative, or neutral.
You must also provide a confidence score from 0.0 to 1.0 for your analysis.

Text to analyze:
"""
{{{textToAnalyze}}}
"""
`,
});

const analyzeSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeSentimentFlow',
    inputSchema: AnalyzeSentimentInputSchema,
    outputSchema: AnalyzeSentimentOutputSchema,
  },
  async (input: AnalyzeSentimentInput): Promise<AnalyzeSentimentOutput> => {
    try {
      const response = await sentimentPrompt(input);
      const output = response.output;
      if (!output) {
        throw new Error('AI did not return a valid sentiment analysis.');
      }
      return output;
    } catch (e: any) {
      console.error("Error in analyzeSentimentFlow:", e);
      // Fallback to a neutral sentiment in case of an error from the LLM
      return {
        sentiment: 'neutral',
        confidenceScore: 0.5,
      };
    }
  }
);
