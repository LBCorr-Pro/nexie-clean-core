// src/hooks/use-formatters.ts
"use client";

import { useFormatter } from 'next-intl';

/**
 * Hook centralizado para formatação de dados (datas, números, etc.)
 * usando as configurações de localidade do next-intl.
 */
export function useFormatters() {
  const { dateTime } = useFormatter();

  /**
   * Formata uma data e hora para um formato curto (ex: 23/07/24 15:30).
   * @param date O objeto Date a ser formatado.
   * @returns A string formatada ou '' se a data for nula/indefinida.
   */
  const shortDateTime = (date: Date | null | undefined): string => {
    if (!date) return ''
    return dateTime(date, {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Outros formatadores podem ser adicionados aqui (ex: moeda, número)

  return {
    shortDateTime,
    // Adicione outras funções de formatação exportadas aqui
  };
}
