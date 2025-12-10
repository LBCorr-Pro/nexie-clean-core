// src/modules/invite/components/ManageInvitesTab.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from 'next-intl';
import { db, } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, Timestamp, doc, updateDoc, where, onSnapshot, CollectionReference } from "firebase/firestore";
import { useToast } from "@/hooks/nx-use-toast";
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useSearchParams } from 'next/navigation';
import { useFormatters } from '@/hooks/use-formatters';
import { refs } from '@/lib/firestore-refs';
import { getAuth } from 'firebase/auth';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, ListChecks, Ban, Copy, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Schema receives translation function
const getGenerateInviteSchema = (t: (key: string) => string) => z.object({
  issued_to_email: z.string().email(t('zod.invalidEmail')).optional().or(z.literal('')),
  target_access_level_id: z.string().optional().or(z.literal('')),
});
type GenerateInviteFormData = z.infer<ReturnType<typeof getGenerateInviteSchema>>;

// Firestore data structure
interface AccessLevelTemplate { docId: string; templateName: string; }
interface InviteSettings { prefix?: string; code_length?: number; does_not_expire?: boolean; validity_type?: 'days' | 'hours' | 'months'; validity_value?: number; }
interface GeneratedInviteFromDB {
  docId: string; code: string; slug: string; status: 'pending' | 'accepted' | 'expired' | 'revoked'; 
  created_at: Timestamp; expires_at: Timestamp | null; 
  issued_to_email?: string; target_access_level_id?: string; instanceId_context?: string; 
}
// UI data structure with Date objects
interface GeneratedInviteForUI extends Omit<GeneratedInviteFromDB, 'created_at' | 'expires_at'> {
  created_at: Date;
  expires_at: Date | null;
}

const NO_LEVEL_VALUE = "_NONE_";

export function ManageInvitesTab() {
    const { toast } = useToast();
    const t = useTranslations('invite.manageTab');
    const { hasPermission } = useUserPermissions();
    const { actingAsInstanceId } = useInstanceActingContext();
    const { shortDateTime } = useFormatters();
    const searchParams = useSearchParams();
    const subInstanceId = searchParams.get('subInstanceId');
    const auth = getAuth();

    const [inviteSettings, setInviteSettings] = useState<InviteSettings>({});
    const [invites, setInvites] = useState<GeneratedInviteForUI[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [accessLevelTemplates, setAccessLevelTemplates] = useState<AccessLevelTemplate[]>([]);
    const [generatedInviteDetails, setGeneratedInviteDetails] = useState<{code: string; link: string} | null>(null);
    const [inviteToRevoke, setInviteToRevoke] = useState<GeneratedInviteForUI | null>(null);
    const [isRevoking, setIsRevoking] = useState(false);

    const canManage = hasPermission('module.invite.configure');

    const GenerateInviteSchema = getGenerateInviteSchema(t);
    
    const form = useForm<GenerateInviteFormData>({
        resolver: zodResolver(GenerateInviteSchema),
        defaultValues: { issued_to_email: "", target_access_level_id: "" },
    });
    
    const getInvitesCollectionRef = useCallback((): CollectionReference => {
        if (actingAsInstanceId && subInstanceId) return refs.subinstance.generatedInvites(actingAsInstanceId, subInstanceId);
        if (actingAsInstanceId) return refs.instance.generatedInvites(actingAsInstanceId);
        return refs.master.generatedInvites();
    }, [actingAsInstanceId, subInstanceId]);

    useEffect(() => {
        setIsLoadingData(true);

        // Unsub function for settings
        const settingsConfigRef = doc(refs.master.inviteModuleCollection(), 'settings');
        const unsubSettings = onSnapshot(settingsConfigRef, (doc) => {
            if(doc.exists()) setInviteSettings(doc.data() as InviteSettings);
        });

        // Unsub function for invites
        const invitesQuery = query(getInvitesCollectionRef(), orderBy("created_at", "desc"));
        const unsubInvites = onSnapshot(invitesQuery, (snapshot) => {
            const invitesFromDb = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as GeneratedInviteFromDB));
            // CORRECT: Convert Timestamps to Dates immediately after fetching
            const invitesForUi = invitesFromDb.map(invite => ({
                ...invite,
                created_at: invite.created_at.toDate(),
                expires_at: invite.expires_at ? invite.expires_at.toDate() : null,
            }));
            setInvites(invitesForUi);
            setIsLoadingData(false);
        });

        // Unsub function for templates
        const unsubTemplates = onSnapshot(query(refs.master.accessLevelTemplates(), orderBy("templateName", "asc")), (snapshot) => {
          setAccessLevelTemplates(snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as AccessLevelTemplate)));
        });

        return () => { unsubSettings(); unsubInvites(); unsubTemplates(); };
    }, [getInvitesCollectionRef]);
    
    const onSubmit = async (formData: GenerateInviteFormData) => {
        if (!canManage) return;
        setIsGenerating(true);
        
        const prefix = inviteSettings.prefix || "NEXIE";
        const codeLength = inviteSettings.code_length || 6;

        let newCode = ""; let codeExists = true; let attempts = 0;
        const invitesCollectionRef = getInvitesCollectionRef();

        while (codeExists && attempts < 10) {
          const randomPart = Array.from({ length: codeLength }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 36))).join('');
          newCode = `${prefix.toUpperCase()}${randomPart}`;
          const q = query(invitesCollectionRef, where("slug", "==", newCode.toLowerCase()), limit(1));
          const snapshot = await getDocs(q);
          codeExists = !snapshot.empty;
          attempts++;
        }

        if (codeExists) { 
            toast({ title: t('toasts.generationErrorTitle'), description: t('toasts.generationError'), variant: "destructive" }); 
            setIsGenerating(false); 
            return;
        }

        const now = Timestamp.now();
        let expiryDate: Timestamp | null = null;
        if (inviteSettings.does_not_expire !== true) {
            let date = new Date(now.toDate());
            const validityValue = inviteSettings.validity_value || 7;
            const validityType = inviteSettings.validity_type || 'days';
            if (validityType === 'days') date.setDate(date.getDate() + validityValue);
            else if (validityType === 'hours') date.setHours(date.getHours() + validityValue);
            else if (validityType === 'months') date.setMonth(date.getMonth() + validityValue);
            expiryDate = Timestamp.fromDate(date);
        }

        const inviteData = {
          code: newCode, slug: newCode.toLowerCase(), status: 'pending' as const, created_at: now, expires_at: expiryDate,
          instanceId_context: actingAsInstanceId || null, issued_by_uid: auth.currentUser?.uid || null,
          issued_to_email: formData.issued_to_email || null,
          target_access_level_id: formData.target_access_level_id || null,
        };
        
        try {
          await addDoc(invitesCollectionRef, inviteData);
          const inviteLink = `${window.location.origin}/register?invite=${inviteData.slug}`;
          setGeneratedInviteDetails({ code: inviteData.code, link: inviteLink });
          form.reset();
        } catch (error: any) { 
            toast({ title: t('toasts.generationErrorTitle'), description: error.message, variant: "destructive" });
        } finally { 
            setIsGenerating(false); 
            if(generatedInviteDetails) setInviteToRevoke(null);
        }
    };

    const handleRevoke = async () => {
        if (!inviteToRevoke || !canManage) return;
        setIsRevoking(true);
        try {
            const inviteRef = doc(getInvitesCollectionRef(), inviteToRevoke.docId);
            await updateDoc(inviteRef, { status: 'revoked', updatedAt: serverTimestamp() });
            toast({ title: t('toasts.revokeSuccess') });
        } catch(e: any) {
            toast({ title: t('toasts.revokeError'), description: e.message, variant: "destructive"});
        } finally {
            setIsRevoking(false);
            setInviteToRevoke(null);
        }
    };

    const statusMap: Record<GeneratedInviteForUI['status'], { label: string; color: string; }> = {
        pending:  { label: t('status.pending'),  color: "bg-yellow-500" },
        accepted: { label: t('status.accepted'), color: "bg-green-500" },
        expired:  { label: t('status.expired'),  color: "bg-red-500" },
        revoked:  { label: t('status.revoked'),  color: "bg-red-500" },
    }
    
    return (
        <div className="space-y-8">
            {canManage ? (
                <Card className="shadow-md">
                    <CardHeader><CardTitle className="text-xl flex items-center"><Send className="mr-2 h-5 w-5"/>{t('generateTitle')}</CardTitle></CardHeader>
                    <FormProvider {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <fieldset disabled={isGenerating || isLoadingData}>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="issued_to_email" render={({ field }) => ( <FormItem><FormLabel>{t('emailLabel')}</FormLabel><FormControl><Input type="email" placeholder={t('emailPlaceholder')} {...field} value={field.value ?? ''} /></FormControl><FormDescription>{t('emailDescription')}</FormDescription><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="target_access_level_id" render={({ field }) => (
                                <FormItem><FormLabel>{t('accessLevelLabel')}</FormLabel>
                                    <Select onValueChange={(value) => field.onChange(value === NO_LEVEL_VALUE ? '' : value)} value={field.value || NO_LEVEL_VALUE} disabled={accessLevelTemplates.length === 0}>
                                        <FormControl><SelectTrigger><SelectValue placeholder={t('accessLevelPlaceholder')} /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value={NO_LEVEL_VALUE}>{t('noAccessLevelOption')}</SelectItem>{accessLevelTemplates.map(template => (<SelectItem key={template.docId} value={template.docId}>{template.templateName}</SelectItem>))}</SelectContent>
                                    </Select><FormMessage />
                                </FormItem>)}/>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isGenerating || isLoadingData}>
                                {(isGenerating || isLoadingData) ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>{t('generatingButton')}</> : t('generateButton')}
                                </Button>
                            </CardFooter>
                            </fieldset>
                        </form>
                    </FormProvider>
                </Card>
            ) : (
                <Card><CardContent className="pt-6 flex items-center text-muted-foreground"><AlertTriangle className="mr-2 text-yellow-500"/> {t('accessDeniedMessage', { permission: 'module.invite.configure' })}</CardContent></Card>
            )}

            <Separator />

            <div>
                <h3 className="text-xl font-medium mb-3 flex items-center"><ListChecks className="mr-2 h-5 w-5"/>{t('generatedTitle')}</h3>
                 {isLoadingData ? (<div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div>)
                  : invites.length === 0 ? (<p className="text-muted-foreground text-sm">{t('noInvitesMessage')}</p>)
                  : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader><TableRow><TableHead>{t('table.code')}</TableHead><TableHead>{t('table.status')}</TableHead><TableHead>{t('table.recipient')}</TableHead><TableHead>{t('table.targetLevel')}</TableHead><TableHead>{t('table.createdAt')}</TableHead><TableHead>{t('table.expiresAt')}</TableHead><TableHead className="text-right">{t('table.actions')}</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {invites.map(invite => {
                          const levelName = invite.target_access_level_id ? accessLevelTemplates.find(t => t.docId === invite.target_access_level_id)?.templateName || t('recipientTypes.na') : t('recipientTypes.defaultLevel');
                          const statusInfo = statusMap[invite.status];
                          const canBeRevoked = canManage && invite.status === 'pending' && (!invite.expires_at || invite.expires_at > new Date());
                          return (
                            <TableRow key={invite.docId}>
                              <TableCell className="font-mono text-xs">{invite.code}</TableCell>
                              <TableCell><Badge className={cn("text-xs text-white", statusInfo.color)}>{statusInfo.label}</Badge></TableCell>
                              <TableCell className="text-xs">{invite.issued_to_email || t('recipientTypes.open')}</TableCell>
                              <TableCell className="text-xs">{levelName}</TableCell>
                              <TableCell className="text-xs">{shortDateTime(invite.created_at)}</TableCell>
                              <TableCell className="text-xs">{invite.expires_at ? shortDateTime(invite.expires_at) : t('neverExpires')}</TableCell>
                              <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" onClick={() => setInviteToRevoke(invite)} disabled={!canBeRevoked || isRevoking}><Ban className="h-4 w-4 mr-1"/>{t('actions.revoke')}</Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
            </div>

            <AlertDialog open={!!generatedInviteDetails} onOpenChange={(isOpen) => !isOpen && setGeneratedInviteDetails(null)}>
                <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>{t('dialogs.generatedTitle')}</AlertDialogTitle>
                {generatedInviteDetails && ( <AlertDialogDescription className="space-y-2 !mt-4"><p>{t('dialogs.generatedDescription')}</p><div><strong>{t('dialogs.generatedCodeLabel')}</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{generatedInviteDetails.code}</code> <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => navigator.clipboard.writeText(generatedInviteDetails.code).then(() => toast({title: t('dialogs.copySuccessToast')}))}><Copy className="h-3.5 w-3.5"/></Button></div><div><strong>{t('dialogs.generatedLinkLabel')}</strong> <a href={generatedInviteDetails.link} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 break-all">{generatedInviteDetails.link}</a> <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => navigator.clipboard.writeText(generatedInviteDetails.link).then(() => toast({title: t('dialogs.linkCopySuccessToast')}))}><Copy className="h-3.5 w-3.5"/></Button></div><p className="text-xs text-muted-foreground pt-2">{t('dialogs.generatedHelpText')}</p></AlertDialogDescription> )}</AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end">
                    <AlertDialogAction onClick={() => setGeneratedInviteDetails(null)} className="w-full sm:w-auto">{t('dialogs.closeButton')}</AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!inviteToRevoke} onOpenChange={(isOpen) => !isOpen && setInviteToRevoke(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('dialogs.revokeTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t.rich('dialogs.revokeDescription', {
                          code: inviteToRevoke?.code,
                          strong: (chunks) => <strong>{chunks}</strong>
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end">
                        <AlertDialogCancel className="w-full sm:w-auto" disabled={isRevoking}>{t('dialogs.cancelButton')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRevoke} disabled={isRevoking} className="bg-destructive hover:bg-destructive/90 w-full sm:w-auto">{isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{t('dialogs.confirmRevokeButton')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
