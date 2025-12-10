// src/components/shared/form/ColorPickerInput.tsx
"use client";

import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// A interface agora estende React.InputHTMLAttributes para aceitar props padrão de input.
interface ColorPickerInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    // O componente é totalmente controlado.
    value: string;
    onValueChange: (value: string) => void;
}

export const ColorPickerInput = React.forwardRef<HTMLInputElement, ColorPickerInputProps>(({
    label,
    value,
    onValueChange,
    className,
    disabled,
    ...props
}, ref) => {

    const colorStyle = useMemo(() => {
        if (!value) return {};
        return { backgroundColor: value };
    }, [value]);

    // Handler unificado para o evento de mudança
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onValueChange(e.target.value);
    };

    return (
        <div className="w-full">
            <Label>{label}</Label>
            <div className="relative flex items-center">
                {/* Este input mostra o valor hexadecimal e permite a digitação direta */}
                <Input
                    type="text"
                    ref={ref}
                    value={value || ''}
                    onChange={handleChange}
                    className={cn("w-full pr-12", className)}
                    disabled={disabled}
                    {...props}
                />
                {/* Este container posiciona o seletor de cor visual por cima do input de texto */}
                <div 
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md border border-input flex items-center justify-center"
                    style={colorStyle}
                >
                    {/* O input de cor real fica invisível, mas é funcional */}
                    <Input 
                        type="color" 
                        value={value || '#000000'} 
                        onChange={handleChange} 
                        className="w-full h-full opacity-0 cursor-pointer"
                        disabled={disabled}
                        aria-label={label} // Adiciona acessibilidade
                    />
                </div>
            </div>
        </div>
    );
});
ColorPickerInput.displayName = 'ColorPickerInput';
