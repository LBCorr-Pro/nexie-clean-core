"use client";

import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { useFirebase } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AuthViewProps {
    onAuthorized: (isAuthorized: boolean) => void;
    devEmails: string[];
}

// Função para criar a sessão do servidor
async function createDevSession(idToken: string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch('/api/auth/dev-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
        if (!response.ok) {
            const data = await response.json();
            return { success: false, error: data.error || 'Falha ao criar sessão de desenvolvimento.' };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export function AuthView({ onAuthorized, devEmails }: AuthViewProps) {
    const { auth } = useFirebase();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [emailInput, setEmailInput] = useState(process.env.NEXT_PUBLIC_DEV_EMAILS?.split(',')[0] || '');
    const [passwordInput, setPasswordInput] = useState('');
    const devPass = process.env.NEXT_PUBLIC_DEV_PASS;

    const handleSuccessfulLogin = async (user: User) => {
        const idToken = await user.getIdToken();
        const sessionResult = await createDevSession(idToken);
        if (sessionResult.success) {
            onAuthorized(true);
        } else {
            setError(sessionResult.error);
            onAuthorized(false);
        }
    };

    const handleGoogleSignIn = async () => {
        if (!auth) return;
        setIsLoading(true);
        setError(null);
        const provider = new GoogleAuthProvider();
        try {
            const userCredential = await signInWithPopup(auth, provider);
            if (devEmails.includes(userCredential.user.email || '')) {
                await handleSuccessfulLogin(userCredential.user);
            } else {
                setError('Sua conta Google não tem permissão.');
                await userCredential.user.delete(); // Impede que a conta fique registrada
                onAuthorized(false);
            }
        } catch (error: any) {
            setError(`Falha no login com Google: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth || !devPass) {
            setError("A autenticação por senha não está configurada.");
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
            await handleSuccessfulLogin(userCredential.user);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                try {
                    const newUserCredential = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
                    await handleSuccessfulLogin(newUserCredential.user);
                } catch (creationError: any) {
                    setError(`Falha ao criar usuário de dev: ${creationError.message}`);
                }
            } else {
                setError(`Erro de login: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 flex flex-col items-center justify-center min-h-screen">
            <div className="w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-4 text-center">Acesso Restrito</h1>
                {error && <p className="text-red-500 mb-4 text-center bg-red-100 p-2 rounded">{error}</p>}
                
                <form onSubmit={handlePasswordSignIn} className="flex flex-col gap-4 mb-4 p-4 border rounded-lg">
                    <h2 className="font-semibold text-center">Login com Senha</h2>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="password">Senha</Label>
                        <Input id="password" type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required />
                    </div>
                    <Button type="submit" disabled={isLoading}>{isLoading ? 'Verificando...' : 'Entrar'}</Button>
                </form>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Ou</span></div>
                </div>

                <Button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full">Login com Google</Button>
            </div>
        </div>
    );
}
