// Implemented with Genkit
'use server';

/**
 * @fileOverview An AI agent that suggests color schemes based on user preferences.
 *
 * - suggestColorScheme - A function that suggests a color scheme.
 * - SuggestColorSchemeInput - The input type for the suggestColorScheme function.
 * - SuggestColorSchemeOutput - The return type for the suggestColorScheme function.
 */

import ai from '@/ai/dev';
import {z} from 'genkit';

const SuggestColorSchemeInputSchema = z.object({
  userPreferences: z
    .string()
    .describe('The user\u0027s color preferences, including preferred hues, saturation, and brightness levels.'),
  context: z
    .string()
    .describe('The specific context for the color scheme, such as background, buttons, or titles.'),
  exampleColorScheme: z
    .string()
    .optional()
    .describe("Example of color scheme user has used before, as a CSS string."),
  rating: z
    .number()
    .optional()
    .describe("A rating from 1-5 of the previously suggested color scheme.  This allows iterative refinement of the AI's suggestions."),
});
export type SuggestColorSchemeInput = z.infer<typeof SuggestColorSchemeInputSchema>;

const SuggestColorSchemeOutputSchema = z.object({
  colorScheme: z
    .string()
    .describe('A CSS string representing the suggested color scheme, optimized for the given context and user preferences.'),
  reasoning: z
    .string()
    .describe('Explanation of why the ColorScheme was chosen'),
});
export type SuggestColorSchemeOutput = z.infer<typeof SuggestColorSchemeOutputSchema>;

export async function suggestColorScheme(input: SuggestColorSchemeInput): Promise<SuggestColorSchemeOutput> {
  return suggestColorSchemeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestColorSchemePrompt',
  input: {schema: SuggestColorSchemeInputSchema},
  output: {schema: SuggestColorSchemeOutputSchema},
  prompt: `You are an AI color scheme expert.  You suggest optimal color schemes in CSS format for different UI contexts, based on user preferences.

User Preferences: {{{userPreferences}}}
Context: {{{context}}}

{{#if exampleColorScheme}}
Previous Color Scheme: {{{exampleColorScheme}}}
User Rating: {{{rating}}}

Based on the user\u0027s rating of their previous color scheme, you should adjust the color scheme accordingly.  If the rating is high (4 or 5), you should keep the color scheme similar.  If the rating is low (1 or 2), you should change the color scheme significantly.  If the rating is neutral (3), you can make moderate changes.
{{/if}}

Generate a CSS string representing the suggested color scheme. Your response should include reasoning explaining why it was chosen.`,
});

const suggestColorSchemeFlow = ai.defineFlow(
  {
    name: 'suggestColorSchemeFlow',
    inputSchema: SuggestColorSchemeInputSchema,
    outputSchema: SuggestColorSchemeOutputSchema,
  },
  async (input: SuggestColorSchemeInput) => {
    const response = await prompt(input);
    return response.output!;
  }
);
