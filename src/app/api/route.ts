
import { NextResponse } from 'next/server';
import ai from './genkit'; // Importa a instância configurada
import { googleAI } from '@genkit-ai/google-genai';

// Define o modelo CORRETO e FINAL que será usado: gemini-2.5-flash
const model = googleAI.model('gemini-2.5-flash');

export async function GET(request: Request) {
  try {
    console.log('Iniciando a geração de conteúdo com o modelo correto...');

    const response = await ai.generate({
      model: model,
      prompt: 'Isso é um teste. Responda apenas com "SUCESSO".',
    });

    // Acessa a propriedade .text para obter a resposta
    const textResponse = response.text;
    console.log('Conteúdo gerado com sucesso:', textResponse);

    return NextResponse.json({ result: textResponse });

  } catch (error) {
    console.error('Ocorreu um erro na rota /api:', error);
    return NextResponse.json(
      { error: 'Falha ao gerar conteúdo' },
      { status: 500 }
    );
  }
}
