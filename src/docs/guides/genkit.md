# Guia Operacional: Genkit Integrado

Este manual descreve a configuração e operação do Genkit no projeto.

---

## 1. Visão Geral da Configuração Genkit

A configuração do Genkit é otimizada para Next.js, TypeScript e Firebase, utilizando os modelos do Google AI (Gemini).

*   **Dependências Chave (`package.json`):**
    *   `genkit`, `@genkit-ai/core`: Funcionalidades centrais.
    *   `@genkit-ai/google-genai`: Conexão com os modelos Google AI.
    *   `@genkit-ai/firebase`: Integração para telemetria com Firebase.
    *   `@genkit-ai/next`: Integração com o Next.js.
*   **Arquivo de Configuração (`src/ai/dev.ts`):**
    *   Inicializa o Genkit usando a função `genkit()`.
    *   O plugin `googleAI` é ativado, passando a `apiKey` explicitamente para garantir a autenticação no ambiente Next.js/Vercel.
    *   A função `enableFirebaseTelemetry()` está ativada para monitoramento detalhado dos fluxos.

## 2. Padrão de Implementação de Fluxos

### Padrão 1: Instância Global (Chave Estática do `.env`)

Usado para fluxos de uso geral. A chave da API é fornecida diretamente do `process.env`.

**Arquivo:** `src/ai/dev.ts` (Corrigido)
```typescript
// src/ai/dev.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';

export default genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY as string,
    }),
  ],
});

enableFirebaseTelemetry();
```

### Padrão 2: Instância por Execução (Chave Dinâmica do Firestore)

Para funcionalidades complexas onde cada assistente pode ter uma `apiKey` e `modelId` diferentes, armazenados no banco de dados.

**Arquivo:** `src/ai/flows/run-assistant-flow.ts` (Corrigido)
```typescript
// ... (imports)

const runAssistant = ai.defineFlow(
  { /* ... schema ... */ },
  async (input: RunAssistantInput): Promise<RunAssistantOutput> => {
    try {
      // 1. Busca os dados do assistente e sua configuração do Firestore
      const assistantData = await getAssistantFromFirestore(input.assistantId);
      const configData = await getConfigFromFirestore(assistantData.configurationId);

      // 2. Cria uma instância do Genkit dinamicamente com a chave do Firestore
      const dynamicAi = genkit({
        plugins: [
          googleAI({ apiKey: configData.apiKey }),
        ],
      });

      // 3. Usa a instância dinâmica para a chamada de geração
      const llmResponse = await dynamicAi.generate({
        model: googleAI.model(configData.modelId),
        prompt: `...`,
      });

      return { response: llmResponse.text };

    } catch (e: any) {
      // ... (tratamento de erro)
    }
  }
);
```

### O Teste Simples de Sucesso (`simple-genkit-test-flow.ts`)

Este fluxo funciona porque cria uma instância local e isolada do Genkit, que por padrão busca a `GEMINI_API_KEY` do ambiente. Ele serve como uma ferramenta de diagnóstico fundamental para isolar problemas de conexão e autenticação. Se ele funcionar, sabemos que a chave da API é válida e o problema está na configuração do fluxo principal.

## 3. Geração de Imagens (Gemini/Nano Banana) e Áudio (TTS)

- **Geração de Imagens:** O Gemini pode gerar e processar imagens de forma conversacional. Você pode pedir ao Gemini com texto, imagens ou uma combinação dos dois.
- **Conversão de Texto em Voz (TTS):** A API Gemini pode transformar entradas de texto em áudio de um ou vários falantes, com controle sobre estilo, tom e ritmo.

## 4. Considerações Críticas

*   **Variáveis de Ambiente**: A `GOOGLE_API_KEY` é crucial.
*   **Status do Servidor Genkit**: O servidor (`npm run genkit:dev`) deve estar rodando para os fluxos serem invocáveis.
*   **Depuração**: Verifique o console do servidor Genkit e os logs no Firebase.
*   **Incompatibilidade de SDKs:** Um erro comum é `logsCollectionRef.add is not a function`. Isso ocorre ao misturar o SDK do Firebase para **cliente** com o **Admin SDK**. Fluxos de backend (`'use server'`) devem usar **exclusivamente** o Admin SDK (`firebase-admin`) e não devem importar o `firestore-refs.ts` do cliente.
