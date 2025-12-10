// src/hooks/use-nx-login-page-loader.ts
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getDoc, query, where, getDocs, DocumentReference } from 'firebase/firestore';
import { refs } from '@/lib/firestore-refs';
import { useLog } from '@/contexts/LogContext';

// --- Types ---
interface DesignSettings {
  backgroundColor?: string;
  backgroundImageUrl?: string;
  logoUrl?: string;
  cardBackgroundColor?: string;
  primaryColor?: string;
  textColor?: string;
  title?: string;
  subtitle?: string;
  customCss?: string;
}

export interface AccessMethods {
  allowEmail: boolean;
  allowGoogle: boolean;
  allowPublicRegistration?: boolean;
}

interface BehaviorSettings {
  fallbackPageUrl: string;
  loginPageActive: boolean;
}

interface PageSettings {
  design: DesignSettings;
  accessMethods: AccessMethods;
  behavior: BehaviorSettings;
}

export function useNxLoginPageLoader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { logEvent } = useLog();
  const instanceSlugFromUrl = searchParams.get('instance_slug');

  const [settings, setSettings] = useState<PageSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Use `undefined` to indicate that the tenant check has not yet completed.
  const [tenantId, setTenantId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let designDocRef: DocumentReference, behaviorDocRef: DocumentReference, accessDocRef: DocumentReference;
        // This will be `null` for master, or a string for an instance.
        let currentTenantId: string | null = null;

        if (instanceSlugFromUrl) {
          const instancesQuery = query(refs.instances(), where("slug", "==", instanceSlugFromUrl));
          const querySnapshot = await getDocs(instancesQuery);
          if (querySnapshot.empty) {
             logEvent('warn', `[LoginPageLoader] No instance found with slug: ${instanceSlugFromUrl}. Using Master settings.`);
          } else {
            currentTenantId = querySnapshot.docs[0].id;
          }
        }
        
        // The check is complete. Set the tenantId to the result (string or null).
        setTenantId(currentTenantId);

        if (currentTenantId) {
            designDocRef = refs.instance.loginPageDesignSettingsDoc(currentTenantId);
            behaviorDocRef = refs.instance.loginPageBehaviorSettingsDoc(currentTenantId);
            accessDocRef = refs.instance.accessMethodsSettingsDoc(currentTenantId);
        } else {
            designDocRef = refs.master.loginPageDesignSettingsDoc();
            behaviorDocRef = refs.master.loginPageBehaviorSettingsDoc();
            accessDocRef = refs.master.accessMethodsSettingsDoc();
        }
        
        const [designSnap, behaviorSnap, accessSnap, masterBehaviorSnap] = await Promise.all([
          getDoc(designDocRef),
          getDoc(behaviorDocRef),
          getDoc(accessDocRef),
          getDoc(refs.master.loginPageBehaviorSettingsDoc()) // Always fetch master for fallback
        ]);

        const designData: any = designSnap.exists() ? designSnap.data() : {};
        const accessData: any = accessSnap.exists() ? accessSnap.data() : {};
        
        let behaviorData: any;
        if(behaviorSnap.exists() && behaviorSnap.data().customized) {
            behaviorData = behaviorSnap.data();
        } else {
            behaviorData = masterBehaviorSnap.exists() ? masterBehaviorSnap.data() : {};
        }

        setSettings({
          design: {
            backgroundColor: designData.backgroundColor,
            backgroundImageUrl: designData.backgroundImageUrl,
            logoUrl: designData.logoUrl,
            cardBackgroundColor: designData.cardBackgroundColor,
            primaryColor: designData.primaryColor,
            textColor: designData.textColor,
            title: behaviorData.title,
            subtitle: behaviorData.subtitle,
            customCss: designData.customCss,
          },
          accessMethods: {
            allowEmail: accessData.allowEmail ?? true,
            allowGoogle: accessData.allowGoogle ?? true,
            allowPublicRegistration: behaviorData.allowPublicRegistration ?? false,
          },
          behavior: {
            loginPageActive: behaviorData.loginPageActive ?? true,
            fallbackPageUrl: behaviorData.fallbackPageUrl || '/dashboard',
          }
        });

      } catch (e: any) {
        logEvent('error', `[LoginPageLoader] Error fetching settings: ${e.message}`);
        setError(e.message || "An error occurred while loading page settings.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [instanceSlugFromUrl, logEvent]);

  const handleRedirect = useCallback((locale: string, callbackUrl?: string) => {
    if (callbackUrl && callbackUrl !== '/') {
        router.push(callbackUrl);
        return;
    }
    const redirectUrl = settings?.behavior.fallbackPageUrl || '/dashboard';
    router.push(`/${locale}${redirectUrl}`);
  }, [settings, router]);

  return { settings, isLoading, error, tenantId, handleRedirect };
}
