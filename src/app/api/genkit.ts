import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// No Next.js, as variáveis do arquivo .env (ou .env.local) são carregadas
// automaticamente no `process.env` no lado do servidor. 
// Portanto, não precisamos do pacote `dotenv` aqui.

export default genkit({
  plugins: [
    // Inicia o plugin do Google AI, passando explicitamente a API Key.
    // Usamos `as string` para garantir ao TypeScript que a variável existe.
    googleAI({ apiKey: process.env.GOOGLE_API_KEY as string }),
  ],
});
