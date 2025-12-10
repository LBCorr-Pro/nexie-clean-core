// src/hooks/use-nx-forgot-password-handler.ts
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/nx-use-toast';
import { getFirebaseAuth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
});

type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>;

export function useNxForgotPasswordHandler() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setIsSuccess(false);
    setAuthError(null);

    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, data.email);

      setIsSuccess(true);
      toast({
        title: "E-mail Enviado",
        description: "Se uma conta com este e-mail existir, um link para redefinição de senha foi enviado.",
      });
      form.reset();

    } catch (error: any) {
      const errorMsg = error.message || "Ocorreu um erro desconhecido.";
      setAuthError(errorMsg);
      toast({ variant: "destructive", title: "Falha ao Enviar", description: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { form, onSubmit, isSubmitting, isSuccess, authError };
}
