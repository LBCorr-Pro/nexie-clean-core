// src/components/auth/public-redirect.tsx
'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { useLocale } from 'next-intl';
import { Loader2 } from 'lucide-react';

function FullPageLoader() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

interface PublicRedirectProps {
  children: ReactNode;
}

export function PublicRedirect({ children }: PublicRedirectProps) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    // Se não estiver a carregar e o utilizador estiver logado, redireciona.
    if (!loading && user) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [user, loading, router, locale]);

  // Enquanto carrega ou se o utilizador está logado (e será redirecionado), mostra um loader.
  // Isto evita que a página pública "pisque" para o utilizador logado.
  if (loading || user) {
    return <FullPageLoader />;
  }

  // Se o utilizador não está autenticado, renderiza a página pública.
  return <>{children}</>;
}
