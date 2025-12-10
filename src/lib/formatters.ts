// src/lib/formatters.ts
import { format as formatDateFns, isValid } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import type { Locale } from 'date-fns'; // CORREÇÃO: Importa o tipo Locale

// Mapeia o código do locale para o objeto de locale do date-fns
const locales: { [key: string]: Locale } = {
  'pt-BR': ptBR,
  'en': enUS,
  'es': es,
};

/**
 * Formata uma data de acordo com o locale fornecido.
 * @param date - O objeto Date ou um Timestamp do Firestore a ser formatado.
 * @param locale - O código do locale (ex: 'pt-BR', 'en').
 * @returns A data formatada como string ou uma string vazia se a data for inválida.
 */
export const formatLocaleDate = (date: Date | { toDate: () => Date } | null | undefined, locale: string): string => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : date.toDate();
  
  if (!isValid(dateObj)) {
    return '';
  }

  const localeObject = locales[locale] || enUS;
  return formatDateFns(dateObj, 'Ppp', { locale: localeObject }); // 'Ppp' -> 27 de set. de 2025 23:30:00
};

/**
 * Formata um número como uma string de moeda de acordo com o locale.
 * @param amount - O valor numérico.
 * @param locale - O código do locale (ex: 'pt-BR', 'en').
 * @param currency - O código da moeda de 3 letras (ex: 'BRL', 'USD').
 * @returns A string de moeda formatada.
 */
export const formatLocaleCurrency = (amount: number, locale: string, currency: string = 'BRL'): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    // Fallback simples
    return `${currency} ${amount.toFixed(2)}`;
  }
};
