// src/components/ui/toaster.tsx
"use client";

import { useToast } from "@/hooks/nx-use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { Button } from "./button";
import { Copy } from "lucide-react";
import React from 'react';

export function Toaster() {
  const { toasts, toast: toastFn } = useToast();

  const handleCopy = (description: React.ReactNode) => {
    const textToCopy = typeof description === 'string' ? description : String(description);
    navigator.clipboard.writeText(textToCopy);
    toastFn({
      title: "Copiado!",
      description: "A mensagem de erro foi copiada para a área de transferência.",
      duration: 2000,
    });
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isDestructive = variant === 'destructive';
        return (
          <Toast key={id} {...props} variant={variant} duration={isDestructive ? 12000 : props.duration}>
            <div className="grid gap-1 w-full">
               <div className="flex items-start justify-between gap-4">
                 {title && <ToastTitle>{title}</ToastTitle>}
                 {isDestructive && description && (
                   <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive-foreground/70 hover:text-destructive-foreground hover:bg-destructive/90 shrink-0"
                    onClick={() => handleCopy(description)}
                    aria-label="Copiar erro"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {description && (
                <ToastDescription className="break-words"> 
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
