
// src/app/[locale]/(authenticated)/layout.tsx
import { ReactNode } from 'react';
import { Navbar } from '@/components/nav/navbar';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

// Este layout não precisa mais do RouteGuard.
// A lógica foi centralizada no RootOrchestrator no layout principal.
export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
        <Navbar />
        <main className="p-4 sm:p-6 lg:p-8">
            {children}
        </main>
    </div>
  );
}
