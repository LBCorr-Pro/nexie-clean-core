'use client';

import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Auth } from 'firebase/auth';
import { useTranslations } from 'next-intl'; // Importado

interface AuthViewProps {
    auth: Auth | null;
    devEmails: string[];
}

// Função para criar a sessão do servidor (com tradução de erro)
async function createDevSession(idToken: string, t: (key: string) => string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch('/api/auth/dev-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
        if (!response.ok) {
            const data = await response.json();
            return { success: false, error: data.error || t('sessionCreationError') };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export function AuthView({ auth, devEmails }: AuthViewProps) {
    const t = useTranslations('auth'); // Carrega o namespace 'auth'
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [emailInput, setEmailInput] = useState(devEmails[0] || '');
    const [passwordInput, setPasswordInput] = useState('');

    const handleSuccessfulLogin = async (user: User) => {
        const idToken = await user.getIdToken();
        const sessionResult = await createDevSession(idToken, t);
        if (sessionResult.success) {
            window.location.reload();
        } else {
            setError(sessionResult.error);
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
                setError(t('googleSignInError'));
                await auth.signOut();
            }
        } catch (error: any) {
            setError(t('loginError', { error: error.message }));
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) {
            setError("Firebase Auth não está disponível."); // Mensagem para dev, não precisa de tradução
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
            await handleSuccessfulLogin(userCredential.user);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                try {
                    const newUserCredential = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
                    await handleSuccessfulLogin(newUserCredential.user);
                } catch (creationError: any) {
                    setError(t('devUserCreationError', { error: creationError.message }));
                }
            } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                setError(t('invalidCredentialsError'));
            }
            else {
                setError(t('loginError', { error: error.message }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-sm p-6 bg-white border rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-2 text-center">{t('restrictedAccessTitle')}</h1>
                <p className="text-sm text-center text-muted-foreground mb-4">
                    {t('pageDescription')}
                </p>
                
                {error && <p className="text-red-500 mb-4 text-center bg-red-100 p-2 rounded">{error}</p>}
                
                <form onSubmit={handlePasswordSignIn} className="flex flex-col gap-4 mb-4">
                    <div>
                        <Label htmlFor="email">{t('devEmailLabel')}</Label>
                        <Input id="email" type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} required placeholder="dev@example.com" />
                    </div>
                    <div>
                        <Label htmlFor="password">{t('passwordLabel')}</Label>
                        <Input id="password" type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required />
                    </div>
                    <Button type="submit" disabled={isLoading}>{isLoading ? t('signingInButton') : t('signInButton')}</Button>
                </form>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">{t('orSeparator')}</span></div>
                </div>

                <Button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full" variant="outline">
                    {t('googleSignInButton')}
                </Button>
                 <p className="text-xs text-center text-gray-500 mt-4">
                    {t('authorizedEmails', { emails: devEmails.join(', ') })}
                </p>
            </div>
        </div>
    );
}
