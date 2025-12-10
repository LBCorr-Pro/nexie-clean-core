// src/app/not-found.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, Suspense } from 'react';

function NotFoundContent() {
  const router = useRouter();

  useEffect(() => {
    // Optional: Log this event to an analytics service
    console.error(`404 Not Found: Path - ${window.location.pathname}`);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 dark:bg-muted/20 p-4 md:p-8">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader className="pt-8 pb-6">
          <AlertTriangle className="mx-auto h-16 w-16 text-destructive" />
          <CardTitle className="mt-4 text-3xl font-bold">Página Não Encontrada</CardTitle>
          <CardDescription className="mt-2 text-lg text-muted-foreground">
            Oops! A página que você está procurando não existe ou foi movida.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </CardContent>
        <CardFooter className="mt-4 pb-8 justify-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            Ir para a Página Inicial
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}
