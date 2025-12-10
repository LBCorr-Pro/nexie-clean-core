import { z } from 'zod';

export const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio to transcribe, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  languageCode: z.string().optional().describe('The BCP-47 language code for the audio (e.g., "pt-BR", "en-US"). If not provided, the language will be auto-detected.'),
  punctuationPrompt: z.string().optional().describe("An optional prompt to guide the model, e.g., to add punctuation."),
  model: z.string().optional().describe("The Genkit model identifier to use for transcription (e.g., 'googleai/gemini-1.5-flash', 'openai/whisper-1')."),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

export const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text.'),
  error: z.string().optional().describe('Error message if transcription failed.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;
