// src/components/shared/form/CnpjInput.tsx
"use client";

import React from 'react';
import { Input } from "@/components/ui/input";
import { formatCNPJ } from "@/lib/utils";

interface CnpjInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CnpjInput: React.FC<CnpjInputProps> = ({
  value = '',
  onChange,
  placeholder,
  disabled,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '').slice(0, 14);
    onChange(rawValue);
  };

  return (
    <Input
      placeholder={placeholder || "00.000.000/0000-00"}
      value={formatCNPJ(value)}
      onChange={handleChange}
      maxLength={18}
      disabled={disabled}
    />
  );
};
