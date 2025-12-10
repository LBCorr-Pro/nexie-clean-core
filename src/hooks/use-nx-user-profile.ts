// src/hooks/use-nx-user-profile.ts
"use client";

import { useAuthContext } from "@/context/AuthContext";

// Esta é uma versão simplificada. Em um cenário real, você poderia buscar
// dados adicionais do usuário do Firestore aqui.
export function useNxUserProfile() {
  const { user, authStatus, loading } = useAuthContext();

  // Mapeia o status do contexto de autenticação para um status mais semântico para esta página.
  const getStatus = () => {
    if (loading || authStatus === 'loading') return 'loading';
    if (authStatus === 'unauthenticated' || !user) return 'error';
    return 'authenticated';
  }

  return {
    user: user,
    status: getStatus(),
    isLoading: getStatus() === 'loading',
  };
}
