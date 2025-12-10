import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Schema para um único Assessor de IA, usado para validação e tipagem.
export const AIAssistantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  assistantType: z.enum(['text', 'speech', 'image', 'video']),
  configurationId: z.string(),
  systemPrompt: z.string().optional(),
});

export type AIAssistant = z.infer<typeof AIAssistantSchema>;

// Schema para a Configuração de um Provedor de IA (ex: Google AI).
export const AIProviderConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.enum(['google-ai', 'openai']),
  modelId: z.string(),
  apiKey: z.string().optional(),
  isActive: z.boolean(),
  useDefaultApiKey: z.boolean().optional(),
});

export type AIProviderConfig = z.infer<typeof AIProviderConfigSchema>;

// Schema para a saída do fluxo runAssistant.
export const RunAssistantOutputSchema = z.object({
  textResponse: z.string().optional(),
  mediaUrl: z.string().optional(),
  error: z.string().optional(),
});

export type RunAssistantOutput = z.infer<typeof RunAssistantOutputSchema>;

// Schema para os logs de monitoramento de IA.
export const AILogSchema = z.object({
  id: z.string(),
  timestamp: z.instanceof(Timestamp),
  assistantId: z.string(),
  assistantName: z.string().optional(),
  status: z.string(), // ex: 'success', 'error'
  cost: z.number().optional(),
  userInput: z.string().optional(),
  aiOutput: z.string().optional(),
  errorDetails: z.string().optional(),
});

export type AILog = z.infer<typeof AILogSchema>;

// Schema para um Contexto de IA, que representa um "slot" na aplicação.
export const AIContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
});

export type AIContext = z.infer<typeof AIContextSchema>;
