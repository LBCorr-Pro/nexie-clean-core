// src/ai/dev.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';

// CORREÇÃO: Passa explicitamente a chave de API do ambiente para a inicialização do plugin.
// Isso garante que a instância global do Genkit use a credencial correta,
// resolvendo o erro de "modelo não encontrado".
export default genkit({
  plugins: [
    googleAI({
      // Garante que estamos usando a chave de API do ambiente, a mesma que funcionou no teste simples.
      apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY!,
    }),
  ],
});

enableFirebaseTelemetry();
