
// src/components/dev/SessionDebugger.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useNxDynamicMenu } from '@/hooks/use-nx-dynamic-menu';
import { useNxLoginPageLoader } from '@/hooks/use-nx-login-page-loader';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

interface SessionDebuggerProps {
  isPublicPage?: boolean;
}

export function SessionDebugger({ isPublicPage = false }: SessionDebuggerProps) {
  const t = useTranslations('auth.debugger');
  const { user, loading: isAuthLoading } = useAuth();
  
  const { generalSettings, isLoading: isGeneralSettingsLoading } = useNxDynamicMenu();
  const { settings: loginSettings, isLoading: isLoginSettingsLoading } = useNxLoginPageLoader();

  const [clientInfo, setClientInfo] = useState({
    theme: 'N/A',
    sessionCookie: false
  });

  useEffect(() => {
    const updateClientInfo = () => {
      setClientInfo({
        theme: localStorage.getItem('theme') || 'Não definido',
        sessionCookie: document.cookie.includes('session='),
      });
    };
    updateClientInfo();
    window.addEventListener('storage', updateClientInfo);
    return () => window.removeEventListener('storage', updateClientInfo);
  }, []);

  const isLoading = isAuthLoading || isGeneralSettingsLoading || isLoginSettingsLoading;

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
  }
  
  return (
    <Card className="w-full max-w-md bg-muted/50">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs font-mono space-y-4">
         {isPublicPage && !clientInfo.sessionCookie && (
            <Alert variant="warning">
                <AlertTriangle className="h-4 w-4"/>
                <AlertTitle>{t('session.warningTitle')}</AlertTitle>
                <AlertDescription>
                    {t('session.noCookieWarning')}
                </AlertDescription>
            </Alert>
         )}
        <div>
          <h3 className="font-bold mb-1">{t('userStatus.title')}</h3>
          <p><strong>{t('userStatus.isLoggedIn')}:</strong> {user ? t('userStatus.yes') : t('userStatus.no')}</p>
          <p><strong>{t('userStatus.uid')}:</strong> {user?.uid || 'N/A'}</p>
          <p><strong>{t('userStatus.email')}:</strong> {user?.email || 'N/A'}</p>
        </div>
        <div>
          <h3 className="font-bold mb-1">{t('clientInfo.title')}</h3>
          <p><strong>{t('clientInfo.theme')}:</strong> {clientInfo.theme}</p>
        </div>
        <div>
          <h3 className="font-bold mb-1">{t('appSettings.title')}</h3>
          <p><strong>{t('appSettings.multilingual')}:</strong> {generalSettings?.multilingual_system_enabled ? t('userStatus.yes') : t('userStatus.no')}</p>
          <p><strong>{t('appSettings.defaultLanguage')}:</strong> {generalSettings?.defaultLanguage || 'N/A'}</p>
          <p><strong>{t('appSettings.defaultHomepage')}:</strong> {loginSettings?.behavior?.fallbackPageUrl || 'N/A'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
