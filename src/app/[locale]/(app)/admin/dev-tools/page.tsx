// src/app/[locale]/(app)/admin/dev-tools/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl'; // Importado
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogBoxDesc, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as AlertDialogAlertTitle } from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle, DatabaseZap, ShieldCheck, ListChecks, Blocks, Bug, Info, Globe, ListTree as ListTreeIcon, Trash2 as TrashIcon, BookOpen, ToyBrick, Terminal, FileJson, GitBranch, Palette, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/nx-use-toast";
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { syncModuleFoldersAction, cleanupAndConsolidateModuleDefinitionsAction, seedDefaultManualArticlesAction, seedDefaultEditorPresetsAction, cleanupLegacyAppearanceFieldsAction } from '@/lib/actions/dev-actions';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from "@/lib/utils";
import { useDebugMenu } from '@/contexts/DebugMenuContext';

export default function DevToolsPage() {
  const t = useTranslations('devTools'); // Usando o novo namespace
  const { toast } = useToast();
  const { isActingAsMaster, actingAsInstanceId } = useInstanceActingContext();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const { isLogVisible, toggleLogVisibility, isActingBarVisible, toggleActingBar } = useDebugMenu();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isCleaningModules, setIsCleaningModules] = useState(false);
  const [isSeedingManual, setIsSeedingManual] = useState(false);
  const [isSeedingPresets, setIsSeedingPresets] = useState(false);
  const [isCleaningAppearance, setIsCleaningAppearance] = useState(false);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<(() => Promise<void>) | null>(null);
  const [confirmDialogContent, setConfirmDialogContent] = useState({ title: "", description: "", destructive: false, actionText: t("confirmDialog.defaultActionText") });

  const canAccessDevTools = useMemo(() => hasPermission('master.sync.manage'), [hasPermission]);
  const canImportModules = useMemo(() => hasPermission('master.modules.import'), [hasPermission]);

  const isPageEffectivelyDisabled = useMemo(() => {
    return isLoadingPermissions || !isActingAsMaster || !!actingAsInstanceId || !canAccessDevTools;
  }, [isLoadingPermissions, canAccessDevTools, isActingAsMaster, actingAsInstanceId]);

  const isProcessingAnyAction = useMemo(() => {
    return isSyncing || isCleaningModules || isSeedingManual || isSeedingPresets || isCleaningAppearance;
  }, [isSyncing, isCleaningModules, isSeedingManual, isSeedingPresets, isCleaningAppearance]);

  const handleSyncModules = async () => {
    if (!canImportModules) { toast({ title: t("toasts.permissionDenied"), variant: "destructive" }); return; }
    setIsSyncing(true);
    const result = await syncModuleFoldersAction();
    if (result.success) { toast({ title: t("toasts.syncSuccessTitle"), description: result.message });
    } else { toast({ title: t("toasts.syncErrorTitle"), description: result.message, variant: "destructive" }); }
    setIsSyncing(false);
  };

  const handleCleanupModules = async () => {
    if (!canAccessDevTools) { toast({ title: t("toasts.permissionDenied"), variant: "destructive" }); return; }
    setIsCleaningModules(true);
    const result = await cleanupAndConsolidateModuleDefinitionsAction();
    if (result.success) { toast({ title: t("toasts.cleanupSuccessTitle"), description: result.message, duration: 7000 });
    } else { toast({ title: t("toasts.cleanupErrorTitle"), description: result.message, variant: "destructive" }); }
    setIsCleaningModules(false); setShowConfirmDialog(false); setActionToConfirm(null);
  }
  
  const confirmAndExecute = (actionFn: () => Promise<void>, title: string, description: string, actionText: string = t("confirmDialog.defaultActionText"), isDestructive: boolean = true) => {
    setConfirmDialogContent({ title, description, destructive: isDestructive, actionText });
    setActionToConfirm(() => actionFn);
    setShowConfirmDialog(true);
  };
  
  const handleSeedManual = async () => {
    if (!canAccessDevTools) { toast({ title: t("toasts.permissionDenied"), variant: "destructive" }); return; }
    setIsSeedingManual(true);
    const result = await seedDefaultManualArticlesAction();
    if (result.success) { toast({ title: t("toasts.seedSuccessTitle"), description: result.message });
    } else { toast({ title: t("toasts.seedErrorTitle"), description: result.message, variant: "destructive" }); }
    setIsSeedingManual(false); setShowConfirmDialog(false); setActionToConfirm(null);
  }
  
  const handleSeedEditorPresets = async () => {
    if (!canAccessDevTools) { toast({ title: t("toasts.permissionDenied"), variant: "destructive" }); return; }
    setIsSeedingPresets(true);
    const result = await seedDefaultEditorPresetsAction();
    if (result.success) { toast({ title: t("toasts.seedSuccessTitle"), description: result.message });
    } else { toast({ title: t("toasts.seedErrorTitle"), description: result.message, variant: "destructive" }); }
    setIsSeedingPresets(false); setShowConfirmDialog(false); setActionToConfirm(null);
  }

  const handleCleanAppearance = async () => {
    if (!canAccessDevTools) { toast({ title: t("toasts.permissionDenied"), variant: "destructive" }); return; }
    setIsCleaningAppearance(true);
    const result = await cleanupLegacyAppearanceFieldsAction();
    if (result.success) { toast({ title: t("toasts.cleanupSuccessTitle"), description: result.message });
    } else { toast({ title: t("toasts.cleanupErrorTitle"), description: result.message, variant: "destructive" }); }
    setIsCleaningAppearance(false); setShowConfirmDialog(false); setActionToConfirm(null);
  }

  
  if (isLoadingPermissions) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  if (!isActingAsMaster || !!actingAsInstanceId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2" />{t("access.restrictedTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="mt-3 text-sm bg-sky-50 border-sky-300 dark:bg-sky-900/30 dark:border-sky-700">
            <Globe className="h-4 w-4 !text-sky-600 dark:!text-sky-400" />
            <AlertTitle className="font-semibold text-sky-700 dark:text-sky-300">{t("access.masterContextRequiredTitle")}</AlertTitle>
            <AlertDescription className="text-sky-600 dark:text-sky-400">
              {t("access.masterContextRequiredDescription")}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  if (!canAccessDevTools) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center"><ShieldCheck className="mr-2" />{t("access.permissionNeededTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t("access.permissionNeededDescription")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Bug className="mr-2 h-6 w-6 text-primary" />{t("debugCard.title")}</CardTitle>
          <CardDescription>{t("debugCard.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center space-x-2 p-3 border rounded-md">
            <Switch
              id="actingBarSwitch"
              checked={isActingBarVisible}
              onCheckedChange={toggleActingBar}
              disabled={isPageEffectivelyDisabled}
            />
            <Label htmlFor="actingBarSwitch" className="font-semibold flex items-center gap-2">
              <ToyBrick className="h-4 w-4"/> {t("debugCard.actingBarLabel")}
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-md">
            <Switch
              id="logWindowSwitch"
              checked={isLogVisible}
              onCheckedChange={toggleLogVisibility}
              disabled={isPageEffectivelyDisabled}
            />
            <Label htmlFor="logWindowSwitch" className="font-semibold flex items-center gap-2">
              <Terminal className="h-4 w-4"/> {t("debugCard.logWindowLabel")}
            </Label>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><DatabaseZap className="mr-2 h-6 w-6 text-primary" />{t("actionsCard.title")}</CardTitle>
          <CardDescription>
            <strong className="text-destructive">{t("actionsCard.warning")}</strong> {t("actionsCard.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-md space-y-3">
            <h3 className="font-semibold flex items-center"><GitBranch className="mr-2 h-5 w-5 text-blue-600" />{t("syncModules.title")}</h3>
            <p className="text-sm text-muted-foreground">{t("syncModules.description")}</p>
            <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700" onClick={handleSyncModules} disabled={isProcessingAnyAction || !canImportModules}>
              {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitBranch className="mr-2 h-4 w-4" />} {t("syncModules.button")}
            </Button>
            {!canImportModules && <p className="text-xs text-destructive mt-1">{t("syncModules.permissionNeeded")}</p>}
          </div>
          <div className="p-4 border rounded-md space-y-3">
            <h3 className="font-semibold flex items-center"><FileJson className="mr-2 h-5 w-5 text-blue-600" />{t("seedPresets.title")}</h3>
            <p className="text-sm text-muted-foreground">{t("seedPresets.description")}</p>
            <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700" onClick={() => confirmAndExecute(handleSeedEditorPresets, t("seedPresets.dialogTitle"), t("seedPresets.dialogDescription"), t("seedPresets.dialogAction"), false)} disabled={isPageEffectivelyDisabled || isProcessingAnyAction}>
              {isSeedingPresets ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileJson className="mr-2 h-4 w-4" />} {t("seedPresets.button")}
            </Button>
          </div>
          <div className="p-4 border rounded-md space-y-3">
            <h3 className="font-semibold flex items-center"><BookOpen className="mr-2 h-5 w-5 text-blue-600" />{t("seedManual.title")}</h3>
            <p className="text-sm text-muted-foreground">{t("seedManual.description")}</p>
            <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700" onClick={() => confirmAndExecute(handleSeedManual, t("seedManual.dialogTitle"), t("seedManual.dialogDescription"), t("seedManual.dialogAction"), false)} disabled={isPageEffectivelyDisabled || isProcessingAnyAction}>
              {isSeedingManual ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />} {t("seedManual.button")}
            </Button>
          </div>
          <div className="p-4 border border-destructive/50 rounded-md space-y-3 bg-destructive/5">
            <h3 className="font-semibold flex items-center text-destructive"><TrashIcon className="mr-2 h-5 w-5" />{t("cleanupModules.title")}</h3>
            <p className="text-sm text-destructive/90">
              <strong className="font-bold">{t("cleanupModules.destructiveAction")}</strong> {t("cleanupModules.description")}
            </p>
            <Button variant="destructive" onClick={() => confirmAndExecute(handleCleanupModules, t("cleanupModules.dialogTitle"), t("cleanupModules.dialogDescription"), t("cleanupModules.dialogAction"), true)} disabled={isPageEffectivelyDisabled || isProcessingAnyAction}>
              {isCleaningModules ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrashIcon className="mr-2 h-4 w-4" />} {t("cleanupModules.button")}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={showConfirmDialog} onOpenChange={(open) => { if (!isProcessingAnyAction) setShowConfirmDialog(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogAlertTitle className={cn(confirmDialogContent.destructive && "text-destructive")}>{confirmDialogContent.title}</AlertDialogAlertTitle>
            <AlertDialogBoxDesc>{confirmDialogContent.description}</AlertDialogBoxDesc>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowConfirmDialog(false); setActionToConfirm(null); }} disabled={isProcessingAnyAction}>{t("confirmDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (actionToConfirm) { actionToConfirm(); } }} disabled={isProcessingAnyAction} className={cn(confirmDialogContent.destructive && "bg-destructive hover:bg-destructive/90")}>
              {isProcessingAnyAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmDialogContent.actionText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
