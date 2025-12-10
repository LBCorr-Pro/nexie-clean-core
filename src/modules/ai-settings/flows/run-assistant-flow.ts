'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin-helpers'; // CORREÇÃO: Usa o novo helper
import { genkit, z } from 'genkit'; 
import { googleAI } from '@genkit-ai/google-genai';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import type { AIProviderConfig, RunAssistantOutput, AIAssistant } from '@/modules/ai-settings/types';

const ai = genkit({ plugins: [googleAI()] });

// CORREÇÃO: A função getAdminDb() agora é importada
const getDb = () => {
    return getAdminDb();
};
const getAdminCollection = (path: string) => getDb().collection(path);
const getAdminDoc = (path: string) => getDb().doc(path);

const RunAssistantInputSchema = z.object({
    assistantId: z.string(),
    userInput: z.string(),
});
type RunAssistantInput = z.infer<typeof RunAssistantInputSchema>;

const RunAssistantOutputSchema = z.object({
    textResponse: z.string().optional(),
    mediaUrl: z.string().optional(),
    error: z.string().optional(),
});

export async function runAssistantFlow(input: RunAssistantInput): Promise<RunAssistantOutput> {
    return runAssistant(input);
}

const runAssistant = ai.defineFlow(
    {
        name: 'runAssistantFlow',
        inputSchema: RunAssistantInputSchema,
        outputSchema: RunAssistantOutputSchema,
    },
    async (input: RunAssistantInput): Promise<RunAssistantOutput> => {
        let logsCollectionRef;
        try {
            logsCollectionRef = getAdminCollection('Global/master/ai_module_data/data/logs');
            if (!input.userInput?.trim()) throw new Error("User prompt cannot be empty.");

            const assistantRef = getAdminDoc(`Global/master/config/modules/ai-settings/assistants/definitions/${input.assistantId}`);
            const assistantDoc = await assistantRef.get();
            if (!assistantDoc.exists) throw new Error(`Assistant \"${input.assistantId}\" not found.`);
            const assistantData = { id: assistantDoc.id, ...assistantDoc.data() } as AIAssistant;

            const configRef = getAdminDoc(`Global/master/config/modules/ai-settings/configurations/providers/${assistantData.configurationId}`);
            const configDoc = await configRef.get();
            if (!configDoc.exists) throw new Error(`Configuration \"${assistantData.configurationId}\" not found.`);
            const configData = configDoc.data() as AIProviderConfig;
            if (!configData.isActive) throw new Error(`Configuration \"${configData.name}\" is inactive.`);

            console.log('[runAssistantFlow][DIAGNOSTIC] Assistant ID:', input.assistantId);
            console.log('[runAssistantFlow][DIAGNOSTIC] Model ID from Firestore:', configData.modelId);
            const isTtsModel = configData.modelId.includes('-tts');
            console.log('[runAssistantFlow][DIAGNOSTIC] Is this a TTS model?:', isTtsModel);

            if (isTtsModel) {
                console.log('[runAssistantFlow] TTS route selected.');
                const ttsClient = new TextToSpeechClient();
                
                const request = {
                    input: { text: input.userInput },
                    voice: {
                        languageCode: 'en-US',
                        name: 'Charon',
                        model: configData.modelId,
                    },
                    audioConfig: {
                        audioEncoding: 'MP3' as const,
                    },
                };

                const [response] = await ttsClient.synthesizeSpeech(request);

                if (!response.audioContent) {
                    throw new Error("TTS API response did not contain audio content.");
                }
                const base64Audio = Buffer.from(response.audioContent).toString('base64');
                const mediaUrl = `data:audio/mp3;base64,${base64Audio}`;

                return { mediaUrl };

            } else {
                console.log('[runAssistantFlow] Text (Genkit) route selected.');
                const apiKeyToUse = (configData.useDefaultApiKey 
                    ? (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) 
                    : configData.apiKey);
                    
                if (!apiKeyToUse) throw new Error(`No API Key found for \"${configData.name}\".`);

                const dynamicAi = genkit({ plugins: [ googleAI({ apiKey: apiKeyToUse }) ], });
                
                // CONSTRUÇÃO DO PROMPT FINAL
                const finalPrompt = (assistantData.systemPrompt ? assistantData.systemPrompt + '\n\n' : '') + input.userInput;
                console.log('[runAssistantFlow][DIAGNOSTIC] System Prompt Used:', !!assistantData.systemPrompt);
                
                const llmResponse = await dynamicAi.generate({ 
                    model: googleAI.model(configData.modelId),
                    prompt: finalPrompt
                });
                
                return { textResponse: llmResponse.text };
            }
        } catch (e: any) {
            console.error("[runAssistantFlow] Error in flow:", e.stack || e.message);
            if (logsCollectionRef) {
                await logsCollectionRef.add({ /* error log */ });
            }
            return { error: e.message || 'An unknown error occurred.' };
        }
    }
);
