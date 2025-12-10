// src/app/[locale]/(app)/access/login-page-settings/page.tsx
"use client";

import * as React from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { collection, doc, getDoc, setDoc, serverTimestamp, getDocs, query, limit, type CollectionReference } from "firebase/firestore";
import { useToast } from "@/hooks/nx-use-toast";
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { useSearchParams } from "next/navigation";
import { useUserPermissions, type PermissionId } from '@/hooks/use-user-permissions';
import { refs } from '@/lib/firestore-refs';
import { useTranslations } from 'next-intl';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, LogIn, Info, ShieldCheck } from "lucide-react";
import { Alert, AlertTitle, AlertDescription as AlertBoxDescription } from "@/components/ui/alert";
import { BackButton } from "@/components/ui/back-button";

const createLoginPageBehaviorSchema = (t: (key: string) => string) => z.object({
  loginPageActive: z.boolean().default(true),
  fallbackPageUrl: z.string().refine(val => val.trim() === '' || val.startsWith('/'), {
    message: t('form.validation.fallbackUrlInvalid')
  }).default("/dashboard"),
  customized: z.boolean().optional(),
});

type LoginPageBehaviorFormData = z.infer<ReturnType<typeof createLoginPageBehaviorSchema>>;
interface MenuItemForSelect { menuKey: string; displayName: string; originalHref: string; }

async function fetchMenuItemsForSelect(contextType: string, instanceId: string | null, subInstanceId: string | null): Promise<MenuItemForSelect[]> {
    let itemsRef: CollectionReference = refs.master.menuItems();
    if (contextType === 'subinstance' && instanceId && subInstanceId) {
        const subItemsQuery = query(refs.subinstance.menuItems(instanceId, subInstanceId), limit(1));
        if (!(await getDocs(subItemsQuery)).empty) itemsRef = refs.subinstance.menuItems(instanceId, subInstanceId);
    } else if (contextType === 'instance' && instanceId) {
        const instanceItemsQuery = query(refs.instance.menuItems(instanceId), limit(1));
        if (!(await getDocs(instanceItemsQuery)).empty) itemsRef = refs.instance.menuItems(instanceId);
    }

    const snapshot = await getDocs(itemsRef);
    const items: MenuItemForSelect[] = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.canBeInitialPage && !data.isHidden && data.originalHref) {
            items.push({ menuKey: doc.id, displayName: data.displayName, originalHref: data.originalHref });
        }
    });
    return items.sort((a,b) => a.displayName.localeCompare(b.displayName));
}

const ContextAlert: React.FC<{ contextInfo: any }> = ({ contextInfo }) => {
    if (contextInfo.isLoading || !contextInfo.alertTitle) return null;
    return (
        <Alert variant={contextInfo.hasPermission ? 'info' : 'destructive'} className="mt-4">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>{contextInfo.alertTitle}</AlertTitle>
            <AlertBoxDescription>{contextInfo.alertDescription}</AlertBoxDescription>
        </Alert>
    );
};

export default function LoginPageBehaviorSettingsPage() {
  const t = useTranslations('loginPageSettings');
  const { toast } = useToast();
  const { actingAsInstanceId } = useInstanceActingContext();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const searchParams = useSearchParams();
  const subInstanceId = searchParams.get('subInstanceId');

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [availablePages, setAvailablePages] = React.useState<MenuItemForSelect[]>([]);
  const [contextInfo, setContextInfo] = React.useState<any>({});

  const contextType = React.useMemo(() => {
    if (subInstanceId && actingAsInstanceId) return 'subinstance';
    if (actingAsInstanceId) return 'instance';
    return 'master';
  }, [subInstanceId, actingAsInstanceId]);
  
  const LoginPageBehaviorSchema = createLoginPageBehaviorSchema(t);

  const form = useForm<LoginPageBehaviorFormData>({
    resolver: zodResolver(LoginPageBehaviorSchema),
    defaultValues: { loginPageActive: true, fallbackPageUrl: "/dashboard", customized: false },
  });

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        let alertTitle = t('contextAlert.globalTitle');
        let alertDescription = t('contextAlert.globalDescription');
        const editPerm: PermissionId = contextType === 'master' ? 'master.settings.access_methods.edit' : 'instance.settings.access_methods.edit';
        const canEdit = hasPermission(editPerm);

        const masterDocSnap = await getDoc(refs.master.loginPageBehaviorSettingsDoc());
        const masterData = masterDocSnap.exists() ? masterDocSnap.data() : {};
        let dataToLoad: any = masterData;

        if (contextType === 'instance' && actingAsInstanceId) {
            const instanceRef = refs.instance.loginPageBehaviorSettingsDoc(actingAsInstanceId);
            const instanceDoc = await getDoc(instanceRef);
            if (instanceDoc.exists() && instanceDoc.data().customized) {
                dataToLoad = instanceDoc.data();
                alertTitle = t('contextAlert.instanceCustomTitle');
                alertDescription = t('contextAlert.instanceCustomDescription');
            } else {
                alertTitle = t('contextAlert.instanceInheritingTitle');
                alertDescription = t('contextAlert.instanceInheritingDescription');
            }
        }
        
        form.reset(dataToLoad);

        if (!canEdit) {
            alertTitle = t('contextAlert.permissionDeniedTitle');
            alertDescription = t('contextAlert.permissionDeniedDescription', { permissionId: editPerm });
        }

        setContextInfo({ alertTitle, alertDescription, hasPermission: canEdit, isLoading: isLoadingPermissions });
        const pages = await fetchMenuItemsForSelect(contextType, actingAsInstanceId, subInstanceId);
        setAvailablePages(pages);

      } catch (e) {
        console.error(e);
        toast({ title: t('toasts.loadError'), variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    if (!isLoadingPermissions) loadData();
  }, [contextType, actingAsInstanceId, subInstanceId, form, toast, hasPermission, isLoadingPermissions, t]);

  const onSubmit = async (data: LoginPageBehaviorFormData) => {
    setIsSaving(true);
    const isCustom = contextType !== 'master';
    const dataToSave = { ...data, customized: isCustom, updatedAt: serverTimestamp() };

    try {
        let settingsRef = refs.master.loginPageBehaviorSettingsDoc();
         if (contextType === 'subinstance' && actingAsInstanceId && subInstanceId) {
            settingsRef = refs.subinstance.loginPageBehaviorSettingsDoc(actingAsInstanceId, subInstanceId);
        } else if (contextType === 'instance' && actingAsInstanceId) {
            settingsRef = refs.instance.loginPageBehaviorSettingsDoc(actingAsInstanceId);
        }
      await setDoc(settingsRef, dataToSave, { merge: true });
      toast({ title: t('toasts.saveSuccess'), description: t('toasts.saveSuccessDescription') });
      form.reset(dataToSave, { keepValues: true });
    } catch (error) {
      console.error(error);
      toast({ title: t('toasts.saveError'), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const isFormEffectivelyDisabled = isLoading || isSaving || isLoadingPermissions || !contextInfo.hasPermission;

  return (
    <div className="space-y-6">
        <BackButton />
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><LogIn className="mr-2 h-6 w-6 text-primary" />{t('pageTitle')}</CardTitle>
                        <CardDescription>{t('pageDescription')}</CardDescription>
                        <ContextAlert contextInfo={contextInfo} />
                    </CardHeader>
                    <fieldset disabled={isFormEffectivelyDisabled}>
                        <CardContent className="space-y-6">
                            <FormField
                            control={form.control}
                            name="loginPageActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel>{t('form.loginPageActiveLabel')}</FormLabel>
                                    <FormDescription>{t('form.loginPageActiveDescription')}</FormDescription>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="fallbackPageUrl"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('form.fallbackUrlLabel')}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={form.watch("loginPageActive") || isLoading}>
                                    <FormControl><SelectTrigger><SelectValue placeholder={isLoading ? t('form.loadingPlaceholder') : t('form.fallbackUrlPlaceholder')} /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {availablePages.length > 0 ? (
                                            availablePages.map(page => (
                                            <SelectItem key={page.menuKey} value={page.originalHref}>{page.displayName} ({page.originalHref})</SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="/dashboard" disabled>{t('form.noPagesConfigured')}</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormDescription>{t('form.fallbackUrlDescription')}</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-md text-sm">
                                <Info className="h-5 w-5 mr-2 inline-block align-text-bottom" />
                                {t('infoBox')}
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <div className="flex w-full justify-end">
                                <Button type="submit" disabled={isFormEffectivelyDisabled || !form.formState.isDirty}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('buttons.save')}
                                </Button>
                            </div>
                        </CardFooter>
                    </fieldset>
                </Card>
            </form>
        </FormProvider>
    </div>
  );
}
