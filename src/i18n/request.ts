import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from './i18n-config';
import fs from 'fs/promises';
import path from 'path';

// Função para carregar e mesclar todos os arquivos JSON de um diretório de locale
async function loadLocaleMessages(locale: string) {
  const localeDir = path.join(process.cwd(), 'src', 'locales', locale);
  try {
    const files = await fs.readdir(localeDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const messages: { [key: string]: any } = {};

    for (const file of jsonFiles) {
      const filePath = path.join(localeDir, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const namespace = path.basename(file, '.json');
      messages[namespace] = JSON.parse(fileContent);
    }

    return messages;
  } catch (error) {
    // Se o diretório para um locale não existir, podemos tratar como 404
    // ou logar o erro, dependendo da estratégia desejada.
    console.error(`Could not load locale directory: ${localeDir}`, error);
    notFound();
  }
}

export default getRequestConfig(async ({ locale }) => {
  // Valida o locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  return {
    messages: await loadLocaleMessages(locale),
    locale, // CORREÇÃO: Adiciona o `locale` ao objeto de retorno.
  };
});
