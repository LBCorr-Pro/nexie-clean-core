'use server';

import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

const ai = genkit({ plugins: [googleAI()] });

const DebugInputSchema = z.object({ prompt: z.string() });
const DebugOutputSchema = z.object({
  mediaUrl: z.string().optional(),
  error: z.string().optional(),
});

async function pcmToWavBase64(
  pcmData: Buffer,
  channels = 1,
  sampleRate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate,
      bitDepth: sampleWidth * 8,
    });
    const bufs: Buffer[] = [];
    writer.on('error', (err) => reject(err));
    writer.on('data', (chunk: Buffer) => {
      bufs.push(chunk);
    });
    writer.on('end', () => {
      const wavBuffer = Buffer.concat(bufs);
      const base64 = wavBuffer.toString('base64');
      resolve(base64);
    });
    writer.write(pcmData);
    writer.end();
  });
}

const getApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("No API key (GEMINI_API_KEY or GOOGLE_API_KEY) found.");
  }
  return apiKey;
};

export const debugTtsWithGenkit = ai.defineFlow(
  {
    name: 'debugTtsWithGenkit',
    inputSchema: DebugInputSchema,
    outputSchema: DebugOutputSchema,
  },
  async ({ prompt }) => {
    try {
      console.log("[Debug Flow] Starting test with Genkit + Gemini TTS...");
      const apiKey = getApiKey();
      const dynamicAi = genkit({ plugins: [googleAI({ apiKey })] });
      
      // CORREÇÃO: O modelo é especificado diretamente na chamada `generate`.
      const llmResponse = await dynamicAi.generate({
        model: googleAI.model('gemini-1.5-flash-preview-tts'),
        prompt: prompt,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Kore',
              },
            },
          },
        },
      });

      const output = llmResponse.output()?.media;
      if (!output) {
        console.error("[Genkit TTS] Response without media:", JSON.stringify(llmResponse.toJSON(), null, 2));
        throw new Error("Genkit: Response without media returned");
      }

      let mediaUrl: string;

      if (output.url) {
        mediaUrl = output.url;
      } else if (output.content && output.contentType) {
        if (output.contentType.startsWith('audio/L16') || output.contentType === 'audio/pcm' || output.contentType.includes('pcm')) {
          const pcmBuffer = Buffer.from(output.content, 'base64');
          const wavBase64 = await pcmToWavBase64(pcmBuffer);
          mediaUrl = `data:audio/wav;base64,${wavBase64}`;
        } else {
          mediaUrl = `data:${output.contentType};base64,${output.content}`;
        }
      } else {
        console.error("[Genkit TTS] Media returned but without url, content, or contentType:", output);
        throw new Error("Unexpected media format returned");
      }

      console.log("[Debug Flow] Genkit TTS finished successfully.");
      return { mediaUrl };

    } catch (e: any) {
      console.error("[Debug Flow] Error in Genkit TTS:", e.stack || e.message);
      return { error: e.message };
    }
  }
);

export const debugTtsWithGoogleCloud = ai.defineFlow(
  {
    name: 'debugTtsWithGoogleCloud',
    inputSchema: DebugInputSchema,
    outputSchema: DebugOutputSchema,
  },
  async ({ prompt }) => {
    try {
      console.log("[Debug Flow] Starting test with Google Cloud SDK TextToSpeech...");

      const ttsClient = new TextToSpeechClient();

      const request = {
        input: { text: prompt },
        voice: {
          languageCode: 'pt-BR',
          name: 'pt-BR-Neural2-A',
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
        },
      };

      const [response] = await ttsClient.synthesizeSpeech(request);

      if (!response.audioContent) {
        console.error("[Google TTS] Response without audioContent:", JSON.stringify(response, null, 2));
        throw new Error("Google SDK TTS: Response without audioContent");
      }

      const base64Audio = Buffer.from(response.audioContent).toString('base64');
      const mediaUrl = `data:audio/mp3;base64,${base64Audio}`;

      console.log("[Debug Flow] Google TTS completed successfully.");
      return { mediaUrl };

    } catch (e: any) {
      console.error("[Debug Flow] Error in Google TTS:", e.stack || e.message);
      return { error: e.message };
    }
  }
);
