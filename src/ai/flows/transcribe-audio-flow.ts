
'use server';
/**
 * @fileOverview An AI flow for transcribing audio.
 *
 * - transcribeAudio - A function that takes audio data and transcribes it.
 */

import ai from '@/ai/dev';
import {
  TranscribeAudioInputSchema,
  TranscribeAudioOutputSchema,
  type TranscribeAudioInput,
  type TranscribeAudioOutput,
} from '@/ai/schemas/transcription-schemas';

export async function transcribeAudio(
  input: TranscribeAudioInput
): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const transcriptionPrompt = ai.definePrompt({
  name: 'transcriptionPrompt',
  input: { schema: TranscribeAudioInputSchema },
  prompt: `You are an expert audio transcription service. Your task is to transcribe the provided audio file into text.

Your output MUST be ONLY the transcribed text. Do not include any introductory phrases, explanations, or any text other than the transcription itself.
Ignore any non-speech sounds like silence, music, or noise. Only transcribe the spoken words.

{{#if languageCode}}
The language of the audio is {{languageCode}}.
{{else}}
First, auto-detect the spoken language, and then provide the transcription in that detected language.
{{/if}}

{{#if punctuationPrompt}}
Also, apply correct punctuation and formatting to the text for better readability.
{{else}}
Do not add any punctuation unless it is clearly spoken in the audio.
{{/if}}

Transcribe the following audio:
{{media url=audioDataUri}}
`,
});


const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async (input: TranscribeAudioInput) => {
    try {
      const response = await transcriptionPrompt(input, { model: input.model || 'googleai/gemini-1.5-flash' });
      const text = response.text;
      
      if (!text) {
        return { transcription: '', error: 'The model returned an empty transcription.' };
      }

      return { transcription: text };
    } catch (e: any) {
      console.error("Error in transcribeAudioFlow:", e);
      return { transcription: '', error: `AI Error: ${e.message || String(e)}` };
    }
  }
);
