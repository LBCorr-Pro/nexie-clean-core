// src/components/shared/form/BirthDateInput.tsx
"use client";

import React from 'react';
import { FormControl } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Interface para a estrutura de dados desacoplada
export interface DateParts {
  day: string;
  month: string;
  year: string;
}

// A interface agora aceita e emite o objeto DateParts.
interface BirthDateInputProps {
  disabled?: boolean;
  value?: DateParts | null;
  onChange: (value: DateParts | null) => void; 
}

const months = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

export const BirthDateInput: React.FC<BirthDateInputProps> = ({ disabled, value, onChange }) => {
  
  // CORREÇÃO: Deriva o estado diretamente das props. O componente agora é totalmente controlado.
  const day = value?.day || '';
  const month = value?.month || '';
  const year = value?.year || '';

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  
  const daysInMonth = (m: number, y: number) => (m > 0 && y > 1000) ? new Date(y, m, 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth(Number(month), Number(year)) }, (_, i) => String(i + 1));

  // Função que chama a prop onChange com o novo objeto DateParts ou null.
  const updateFormValue = (newDay: string, newMonth: string, newYear: string) => {
    if (newDay || newMonth || newYear) {
      onChange({ day: newDay, month: newMonth, year: newYear });
    } else {
      onChange(null);
    }
  };

  const handleDayChange = (d: string) => {
    updateFormValue(d, month, year);
  };

  const handleMonthChange = (m: string) => {
    const maxDays = daysInMonth(Number(m), Number(year));
    let newDay = day;
    // Reseta o dia se ele se tornar inválido para o novo mês
    if (Number(day) > maxDays) {
        newDay = '';
    }
    updateFormValue(newDay, m, year);
  };

  const handleYearChange = (y: string) => {
    const maxDays = daysInMonth(Number(month), Number(y));
     let newDay = day;
    // Reseta o dia se o ano for bissexto e o mês for fevereiro
    if (Number(day) > maxDays) {
       newDay = '';
    }
    updateFormValue(newDay, month, y);
  };

  return (
    <div className={cn("grid grid-cols-3 gap-2", disabled && "opacity-50")}>
        <Select onValueChange={handleDayChange} value={day} disabled={disabled || !month || !year}>
          <FormControl><SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger></FormControl>
          <SelectContent>
            {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select onValueChange={handleMonthChange} value={month} disabled={disabled}>
          <FormControl><SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger></FormControl>
          <SelectContent>
            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select onValueChange={handleYearChange} value={year} disabled={disabled}>
          <FormControl><SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger></FormControl>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
    </div>
  );
};
