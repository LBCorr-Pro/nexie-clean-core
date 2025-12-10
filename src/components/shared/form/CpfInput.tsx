// src/components/shared/form/CpfInput.tsx
"use client";

import React from 'react';
import { Input } from "@/components/ui/input";
import { formatCPF } from "@/lib/utils";

interface CpfInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CpfInput: React.FC<CpfInputProps> = ({
  value = '',
  onChange,
  placeholder,
  disabled,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '').slice(0, 11);
    onChange(rawValue);
  };

  return (
    <Input
      placeholder={placeholder || "000.000.000-00"}
      value={formatCPF(value)}
      onChange={handleChange}
      maxLength={14}
      disabled={disabled}
    />
  );
};
