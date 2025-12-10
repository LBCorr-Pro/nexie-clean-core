
'use server';
/**
 * @fileOverview An AI agent that suggests icons and colors for UI elements.
 *
 * - suggestStyle - A function that suggests an icon and color.
 * - SuggestStyleInput - The input type for the suggestStyle function.
 * - SuggestStyleOutput - The return type for the suggestStyle function.
 */

import ai from '@/ai/dev';
import {z} from 'genkit';

const SuggestStyleInputSchema = z.object({
  itemName: z.string().describe('The name or label of the item for which to suggest a style (e.g., "User Profile", "Settings Group").'),
  itemType: z.enum(['menuItem', 'menuGroup']).describe('The type of item for which to suggest a style.'),
  existingIcons: z.array(z.string()).optional().describe('A list of Lucide icon names (PascalCase or kebab-case) already in use, to encourage different suggestions.'),
  existingColors: z.array(z.string()).optional().describe('A list of HEX color codes already in use, to encourage visually distinct color suggestions.'),
});
export type SuggestStyleInput = z.infer<typeof SuggestStyleInputSchema>;

const SuggestStyleOutputSchema = z.object({
  suggestedIcon: z.string().describe('A suggested Lucide icon name (e.g., "User", "Settings", "LayoutGrid"). The name should be in PascalCase if possible, or kebab-case. Provide a common, generic icon like "Shapes" or "Blocks" if a specific one is not obvious.'),
  suggestedColor: z.string().describe('A suggested HEX color code (e.g., "#3B82F6", "#10B981"). Suggest a modern, pleasant color, trying to make it distinct from existing colors if provided. Default to a neutral like #6B7280 or a muted primary if no distinct option is clear.'),
});
export type SuggestStyleOutput = z.infer<typeof SuggestStyleOutputSchema>;

export async function suggestStyle(input: SuggestStyleInput): Promise<SuggestStyleOutput> {
  return suggestStyleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestStylePrompt',
  input: {schema: SuggestStyleInputSchema},
  output: {schema: SuggestStyleOutputSchema},
  prompt: `You are a UI/UX design assistant. Your task is to suggest a relevant Lucide icon and a modern HEX color code for a given item name and type.

Item Name: {{{itemName}}}
Item Type: {{{itemType}}}

{{#if existingIcons}}
Existing Icons (try to suggest something different if appropriate):
{{#each existingIcons}}
- {{{this}}}
{{/each}}
{{/if}}

{{#if existingColors}}
Existing Colors (try to suggest a visually distinct color if appropriate):
{{#each existingColors}}
- {{{this}}}
{{/each}}
{{/if}}

Based on the item name and type, suggest:
1.  A Lucide icon name. The icon should be semantically relevant to the item name. Prioritize common and easily recognizable icons. If the item type is 'menuGroup', icons like 'LayoutGrid', 'Folder', 'Archive', 'Settings2' might be suitable. If it's 'menuItem', be more specific to the itemName. If no specific icon comes to mind, suggest a generic one like "Shapes" or "Blocks". Provide the icon name in PascalCase (e.g., UserCog) or kebab-case (e.g., user-cog).
2.  A HEX color code. The color should be modern, aesthetically pleasing, and have good contrast potential. If existing colors are provided, try to suggest a color that is visually distinct. If no specific color is obvious, suggest a versatile color like "#3B82F6" (blue), "#10B981" (green), or a neutral like "#6B7280" (gray).

Ensure your response is only the JSON object with "suggestedIcon" and "suggestedColor".
`,
});

const suggestStyleFlow = ai.defineFlow(
  {
    name: 'suggestStyleFlow',
    inputSchema: SuggestStyleInputSchema,
    outputSchema: SuggestStyleOutputSchema,
  },
  async (input: SuggestStyleInput) => {
    const response = await prompt(input);
    const output = response.output;
    if (!output) {
      console.error("AI did not return an output for suggestStyleFlow with input:", input);
      // Fallback in case of no output or error from LLM
      return {
        suggestedIcon: input.itemType === 'menuGroup' ? "LayoutGrid" : "ListTree",
        suggestedColor: "#6B7280", // A neutral gray
      };
    }
    // Ensure the output has the correct shape, even if the LLM messed up.
    return {
      suggestedIcon: output.suggestedIcon || (input.itemType === 'menuGroup' ? "LayoutGrid" : "ListTree"),
      suggestedColor: output.suggestedColor && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(output.suggestedColor) ? output.suggestedColor : "#3B82F6",
    };
  }
);
