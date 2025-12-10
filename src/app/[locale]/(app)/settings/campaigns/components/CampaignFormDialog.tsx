// src/app/[locale]/(app)/settings/campaigns/components/CampaignFormDialog.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { addDoc, serverTimestamp, query, orderBy, onSnapshot, Timestamp, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/nx-use-toast";
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { useSearchParams } from 'next/navigation';
import { refs } from '@/lib/firestore-refs';
import { useTranslations } from 'next-intl';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DatePickerInput } from '@/components/shared/form/DatePickerInput';
import { ImageUploadField } from '@/components/shared/form/ImageUploadField';
import type { Campaign, AccessLevelTemplate } from '../types';
import { campaignSchema } from '../schemas';

// Frontend-specific type with JS Dates
interface CampaignForPage extends Omit<Campaign, 'id' | 'startDate' | 'endDate' | 'createdAt' | 'last_updated'> {
  id: string;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt?: Date;
  last_updated?: Date;
}

type CampaignFormData = z.infer<typeof campaignSchema>;

const toFormData = (campaign: CampaignForPage): CampaignFormData => {
    return {
        campaignName: campaign.campaignName || '',
        description: campaign.description || '',
        startDate: campaign.startDate || null,
        endDate: campaign.endDate || null,
        status: campaign.status || 'inactive',
        birthdayCampaign: campaign.birthdayCampaign || false,
        settings: {
            mainElementType: campaign.settings?.mainElementType || 'image',
            mainElementSource: campaign.settings?.mainElementSource || '',
            backgroundType: campaign.settings?.backgroundType || 'color',
            backgroundColor: campaign.settings?.backgroundColor || '#FFFFFF',
            backgroundGradientFrom: campaign.settings?.backgroundGradientFrom || '#FFFFFF',
            backgroundGradientTo: campaign.settings?.backgroundGradientTo || '#FFFFFF',
            backgroundGradientDirection: campaign.settings?.backgroundGradientDirection || 'to right',
            backgroundImageUrl: campaign.settings?.backgroundImageUrl || '',
            backgroundVideoUrl: campaign.settings?.backgroundVideoUrl || '',
            totalDurationSeconds: campaign.settings?.totalDurationSeconds || 5,
            destinationPageDefault: campaign.settings?.destinationPageDefault || '/',
        },
        targetAudience: {
            type: campaign.targetAudience?.type || 'public',
            accessLevelIds: campaign.targetAudience?.accessLevelIds || [],
        },
    };
};

const toFirestoreData = (data: CampaignFormData): Partial<Campaign> => {
    return {
        campaignName: data.campaignName,
        description: data.description,
        campaignType: 'app_opening',
        displayFrequency: 'once_per_day',
        startDate: data.startDate ? Timestamp.fromDate(data.startDate) : null,
        endDate: data.endDate ? Timestamp.fromDate(data.endDate) : null,
        status: data.status,
        birthdayCampaign: data.birthdayCampaign,
        settings: {
            ...data.settings,
        },
        targetAudience: {
            ...data.targetAudience,
        },
    };
};

const defaultValues: CampaignFormData = {
    campaignName: '',
    description: '',
    startDate: null,
    endDate: null,
    status: 'inactive',
    birthdayCampaign: false,
    settings: {
        mainElementType: 'image',
        mainElementSource: '',
        backgroundType: 'color',
        backgroundColor: '#FFFFFF',
        backgroundGradientFrom: '#FFFFFF',
        backgroundGradientTo: '#000000',
        backgroundGradientDirection: 'to right',
        backgroundImageUrl: '',
        backgroundVideoUrl: '',
        totalDurationSeconds: 5,
        destinationPageDefault: '/',
    },
    targetAudience: {
        type: 'public',
        accessLevelIds: [],
    },
};

interface CampaignFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingCampaign: CampaignForPage | null;
}

export function CampaignFormDialog({ isOpen, onClose, editingCampaign }: CampaignFormDialogProps) {
  const t = useTranslations('campaigns');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const { actingAsInstanceId } = useInstanceActingContext();
  const searchParams = useSearchParams();
  const subInstanceId = searchParams.get('subInstanceId');
  const [accessLevels, setAccessLevels] = useState<AccessLevelTemplate[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: defaultValues,
  });

  const watchedBackgroundType = form.watch("settings.backgroundType");
  const watchedTargetAudienceType = form.watch("targetAudience.type");

  useEffect(() => {
    const q = query(refs.master.accessLevelTemplates(), orderBy("templateName"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const levels = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as AccessLevelTemplate));
      setAccessLevels(levels);
    }, (error) => {
        console.error("Failed to fetch access levels:", error);
        toast({ title: t('toasts.loadAccessLevelsError'), variant: "destructive" });
    });
    return () => unsubscribe();
  }, [toast, t]);

  const resetForm = useCallback(() => {
    if (editingCampaign) {
        form.reset(toFormData(editingCampaign));
    } else {
        form.reset(defaultValues);
    }
  }, [editingCampaign, form]);

  useEffect(() => {
    if(isOpen) {
        resetForm();
    }
  }, [isOpen, resetForm]);

  const onSubmit = async (data: CampaignFormData) => {
    if (!actingAsInstanceId && !subInstanceId) {
        toast({ title: t('toasts.contextErrorTitle'), description: t('toasts.contextErrorDesc'), variant: "destructive" });
        return;
    }
    setIsSaving(true);
    
    try {
        let campaignsCollectionRef;
        if(actingAsInstanceId && subInstanceId) {
          campaignsCollectionRef = refs.subinstance.splashScreenCampaigns(actingAsInstanceId, subInstanceId);
        } else if (actingAsInstanceId) {
          campaignsCollectionRef = refs.instance.splashScreenCampaigns(actingAsInstanceId);
        } else {
          campaignsCollectionRef = refs.master.splashScreenCampaigns();
        }

        const payload = toFirestoreData(data);

        if (editingCampaign) {
            const campaignRef = doc(db, campaignsCollectionRef.path, editingCampaign.id);
            await updateDoc(campaignRef, { ...payload, last_updated: serverTimestamp() });
            toast({ title: t('toasts.updateSuccess') });
        } else {
            await addDoc(campaignsCollectionRef, { ...payload, createdAt: serverTimestamp() });
            toast({ title: t('toasts.createSuccess') });
        }
        onClose();
    } catch (error: any) {
        console.error("Error saving campaign: ", error);
        toast({ title: t('toasts.saveError'), description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-[80vh]">
            <DialogHeader className="px-6 pt-6 shrink-0">
              <DialogTitle>{editingCampaign ? t('dialog.editTitle') : t('dialog.createTitle')}</DialogTitle>
              <DialogDescription>{t('dialog.description')}</DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto px-6 py-4">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3 shrink-0">
                  <TabsTrigger value="details">{t('tabs.details')}</TabsTrigger>
                  <TabsTrigger value="content">{t('tabs.content')}</TabsTrigger>
                  <TabsTrigger value="audience">{t('tabs.audience')}</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <ScrollArea className="h-full p-1">
                    <div className="space-y-4 py-4 pr-4">
                        <FormField control={form.control} name="campaignName" render={({ field }) => (<FormItem><FormLabel>{t('form.name')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>{t('form.description')}</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <DatePickerInput name="startDate" label={t('form.startDate')} />
                        <DatePickerInput name="endDate" label={t('form.endDate')} />
                        <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>{t('form.status')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="active">{t('status.active')}</SelectItem><SelectItem value="inactive">{t('status.inactive')}</SelectItem><SelectItem value="draft">{t('status.draft')}</SelectItem><SelectItem value="archived">{t('status.archived')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="birthdayCampaign" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>{t('form.birthdayCampaign')}</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="content">
                  <ScrollArea className="h-full p-1">
                    <div className="space-y-4 py-4 pr-4">
                      <FormField control={form.control} name="settings.mainElementType" render={({ field }) => (<FormItem><FormLabel>{t('form.mainElementType')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="image">{t('form.mainElementTypes.image')}</SelectItem><SelectItem value="video">{t('form.mainElementTypes.video')}</SelectItem><SelectItem value="text">{t('form.mainElementTypes.text')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="settings.mainElementSource" render={({ field }) => (<FormItem><FormLabel>{t('form.mainElementSource')}</FormLabel><FormControl><ImageUploadField value={field.value || ''} onChange={field.onChange} aihint="campaign element" contextPath="splash_screen_assets" /></FormControl><FormMessage /></FormItem>)} />
                      <Separator />
                      <FormField control={form.control} name="settings.backgroundType" render={({ field }) => (<FormItem><FormLabel>{t('form.backgroundType')}</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center gap-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="color" /></FormControl><Label className="font-normal">{t('form.backgroundTypes.color')}</Label></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="gradient" /></FormControl><Label className="font-normal">{t('form.backgroundTypes.gradient')}</Label></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="image" /></FormControl><Label className="font-normal">{t('form.backgroundTypes.image')}</Label></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="video" /></FormControl><Label className="font-normal">{t('form.backgroundTypes.video')}</Label></FormItem></RadioGroup><FormMessage /></FormItem>)} />
                      
                      {watchedBackgroundType === 'color' && <FormField control={form.control} name="settings.backgroundColor" render={({ field }) => (<FormItem><FormLabel>{t('form.backgroundColor')}</FormLabel><FormControl><Input type="color" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />}
                      {watchedBackgroundType === 'gradient' && (<div className="grid grid-cols-2 gap-2"><FormField control={form.control} name="settings.backgroundGradientFrom" render={({ field }) => (<FormItem><FormLabel>{t('form.gradientFrom')}</FormLabel><FormControl><Input type="color" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="settings.backgroundGradientTo" render={({ field }) => (<FormItem><FormLabel>{t('form.gradientTo')}</FormLabel><FormControl><Input type="color" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} /></div>)}
                      {(watchedBackgroundType === 'image' || watchedBackgroundType === 'video') && <FormField control={form.control} name="settings.backgroundImageUrl" render={({ field }) => (<FormItem><FormLabel>{t('form.backgroundSourceUrl')}</FormLabel><FormControl><ImageUploadField value={field.value || ''} onChange={field.onChange} aihint="campaign background" contextPath="splash_screen_assets" /></FormControl><FormMessage /></FormItem>)} />}
                      
                      <Separator />
                      <FormField control={form.control} name="settings.totalDurationSeconds" render={({ field }) => (<FormItem><FormLabel>{t('form.totalDuration')}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="settings.destinationPageDefault" render={({ field }) => (<FormItem><FormLabel>{t('form.destinationPage')}</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="audience">
                    <ScrollArea className="h-full p-1">
                        <div className="space-y-4 py-4 pr-4">
                            <FormField control={form.control} name="targetAudience.type" render={({ field }) => (<FormItem><FormLabel>{t('form.audienceType')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="public">{t('form.audienceTypes.public')}</SelectItem><SelectItem value="all_logged_in">{t('form.audienceTypes.allLoggedIn')}</SelectItem><SelectItem value="specific_groups">{t('form.audienceTypes.specificGroups')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            {watchedTargetAudienceType === 'specific_groups' && (<FormItem><FormLabel>{t('form.accessLevels')}</FormLabel><div>{accessLevels.map(level => (<FormField key={level.docId} control={form.control} name="targetAudience.accessLevelIds" render={({ field }) => { return (<FormItem key={level.docId} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(level.docId)} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), level.docId]) : field.onChange(field.value?.filter((value) => value !== level.docId))}} /></FormControl><FormLabel className="font-normal">{level.templateName}</FormLabel></FormItem>)}} />))}</div><FormMessage /></FormItem>)}
                        </div>
                    </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 px-6 pb-6 pt-4 border-t shrink-0">
                <DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isSaving}>{tCommon('cancel')}</Button></DialogClose>
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{tCommon('save')}</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
