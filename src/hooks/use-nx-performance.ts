
// src/hooks/use-nx-performance.ts
"use client";

import * as React from 'react';
import { useUserPermissions } from './use-user-permissions';
import { useToast } from "@/hooks/nx-use-toast";
import { clearAllCachedSettings } from '@/lib/dexie';
import { useTranslations } from 'next-intl';

const APP_CACHE_KEY = 'myAppPerformanceCacheKey';

export const useNxPerformance = () => {
  const { toast } = useToast();
  const t = useTranslations('performance');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [dialogContent, setDialogContent] = React.useState({
    title: "",
    description: "",
    actionText: "",
    onConfirm: () => {},
  });

  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const canManagePerformance = hasPermission('master.performance.manage');

  const openConfirmationDialog = (title: string, description: string, actionText: string, onConfirm: () => void) => {
    if (!canManagePerformance) return;
    setDialogContent({ title, description, actionText, onConfirm });
    setIsDialogOpen(true);
  };

  const handleClearDexieCache = async () => {
    setIsProcessing(true);
    try {
      await clearAllCachedSettings();
      toast({
        title: t('toasts.dexie.successTitle'),
        description: t('toasts.dexie.successDescription'),
        duration: 7000,
      });
    } catch (error) {
      console.error("Error clearing Dexie cache:", error);
      toast({ title: t('toasts.dexie.errorTitle'), description: t('toasts.dexie.errorDescription'), variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setIsDialogOpen(false);
    }
  };

  const handleClearSpecificAppCache = () => {
    setIsProcessing(true);
    try {
      localStorage.removeItem(APP_CACHE_KEY);
      toast({
        title: t('toasts.appCache.successTitle'),
        description: t('toasts.appCache.successDescription', { cacheKey: APP_CACHE_KEY }),
      });
    } catch (error) {
      console.error("Error clearing specific app cache:", error);
      toast({ title: t('toasts.appCache.errorTitle'), variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setIsDialogOpen(false);
    }
  };

  const handleClearFullLocalStorage = () => {
    setIsProcessing(true);
    try {
      localStorage.clear();
      toast({
        title: t('toasts.localStorage.successTitle'),
        description: t('toasts.localStorage.successDescription'),
      });
    } catch (error) {
      console.error("Error clearing full LocalStorage:", error);
      toast({ title: t('toasts.localStorage.errorTitle'), variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setIsDialogOpen(false);
    }
  };

  const handleClearFullSessionStorage = () => {
    setIsProcessing(true);
    try {
      sessionStorage.clear();
      toast({
        title: t('toasts.sessionStorage.successTitle'),
        description: t('toasts.sessionStorage.successDescription'),
      });
    } catch (error) {
      console.error("Error clearing full SessionStorage:", error);
      toast({ title: t('toasts.sessionStorage.errorTitle'), variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setIsDialogOpen(false);
    }
  };

  return {
    isProcessing,
    isLoading: isLoadingPermissions,
    canManagePerformance,
    isDialogOpen,
    setIsDialogOpen,
    dialogContent,
    APP_CACHE_KEY,
    actions: {
      confirmDexieClear: () => openConfirmationDialog(
        t('dialogs.dexie.title'),
        t('dialogs.dexie.description'),
        t('dialogs.dexie.actionText'),
        handleClearDexieCache
      ),
      confirmLocalStorageClear: () => openConfirmationDialog(
        t('dialogs.localStorage.title'),
        t('dialogs.localStorage.description'),
        t('dialogs.localStorage.actionText'),
        handleClearFullLocalStorage
      ),
      confirmSessionStorageClear: () => openConfirmationDialog(
        t('dialogs.sessionStorage.title'),
        t('dialogs.sessionStorage.description'),
        t('dialogs.sessionStorage.actionText'),
        handleClearFullSessionStorage
      ),
      clearAppCache: handleClearSpecificAppCache
    }
  };
};
