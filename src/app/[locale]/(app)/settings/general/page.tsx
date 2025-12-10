// src/app/[locale]/(app)/settings/general/page.tsx
"use client";

import * as React from "react";
import { FormProvider } from "react-hook-form";
import { useTranslations } from 'next-intl';
import { useNxGeneralSettingsForm } from '@/hooks/use-nx-general-settings-form';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { LanguageSelect } from '@/components/shared/form/LanguageSelect';
import { TimezoneSelect } from '@/components/shared/form/TimezoneSelect';
import { CurrencySelect } from '@/components/shared/form/CurrencySelect';
import { SocialLinksInput } from '@/components/shared/form/SocialLinksInput';
import { BackButton } from "@/components/ui/back-button";
import { ImageUploadField } from '@/components/shared/form/ImageUploadField';
import { AccessDenied } from '@/components/ui/access-denied';
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";

const SettingsSkeleton = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3 mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-10 w-full" /></div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6 flex justify-end">
        <Skeleton className="h-10 w-24" />
      </CardFooter>
    </Card>
  </div>
);

export default function GeneralSettingsPage() {
  const t = useTranslations('generalSettings');
  const tCommon = useTranslations('common');
  const {
    formMethods,
    isMultiLingual,
    handleSubmit,
    isLoading,
    canEdit,
    isSaving,
    isFormEffectivelyDisabled,
    isDirty,
  } = useNxGeneralSettingsForm();

  if (isLoading) {
    return <SettingsSkeleton />;
  }
  
  if (!canEdit) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
        <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit} className="space-y-8">
                <Card>
                    <CardHeader className="relative">
                        <BackButton className="absolute right-6 top-3"/>
                        <div className="pt-2"> 
                          <CardTitle className="section-title !border-none !pb-0">
                              <Icon name="Settings" className="section-title-icon"/>
                              {t('title')}
                          </CardTitle>
                          <CardDescription>{t('description')}</CardDescription>
                        </div>
                    </CardHeader>
                    <fieldset disabled={isFormEffectivelyDisabled}>
                        <CardContent className="space-y-6">
                            <h3 className="section-title"><Icon name="Building" className="section-title-icon"/>{t('identitySection.title')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={formMethods.control} name="systemName" render={({ field }) => (<FormItem><FormLabel>{t('identitySection.systemNameLabel')}<span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={formMethods.control} name="nickname" render={({ field }) => (<FormItem><FormLabel>{t('identitySection.nicknameLabel')}</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                            <FormField control={formMethods.control} name="systemDescription" render={({ field }) => (<FormItem><FormLabel>{t('identitySection.systemDescriptionLabel')}</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                            
                            <Separator />

                            <h3 className="section-title"><Icon name="Image" className="section-title-icon"/>{t('logoSection.title')}</h3>
                            <div className="space-y-6">
                                <FormField control={formMethods.control} name="logoUrl" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('logoSection.mainLogoLabel')}</FormLabel>
                                        <FormControl><ImageUploadField value={field.value} onChange={field.onChange} aihint="logo application" contextPath="identity_assets/logos" disabled={isFormEffectivelyDisabled} /></FormControl>
                                        <FormDescription>{t('logoSection.mainLogoDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={formMethods.control} name="logoCollapsedUrl" render={({ field }) => (
                                     <FormItem>
                                        <FormLabel>{t('logoSection.collapsedLogoLabel')}</FormLabel>
                                        <FormControl><ImageUploadField value={field.value} onChange={field.onChange} aihint="logo icon" contextPath="identity_assets/logos" disabled={isFormEffectivelyDisabled} /></FormControl>
                                        <FormDescription>{t('logoSection.collapsedLogoDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={formMethods.control} name="faviconUrl" render={({ field }) => (
                                     <FormItem>
                                        <FormLabel>{t('logoSection.faviconLabel')}</FormLabel>
                                        <FormControl><ImageUploadField value={field.value} onChange={field.onChange} aihint="favicon" contextPath="identity_assets/favicons" disabled={isFormEffectivelyDisabled} /></FormControl>
                                        <FormDescription>{t('logoSection.faviconDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>

                            <Separator />
                            
                            <h3 className="section-title"><Icon name="Contact" className="section-title-icon"/>{t('contactSection.title')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={formMethods.control} name="defaultContactEmail" render={({ field }) => (<FormItem><FormLabel>{t('contactSection.defaultEmailLabel')}<span className="text-destructive">*</span></FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={formMethods.control} name="defaultWhatsapp" render={({ field }) => (<FormItem><FormLabel>{t('contactSection.defaultWhatsappLabel')}</FormLabel><FormControl><Input type="tel" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                            <FormField control={formMethods.control} name="institutionalSite" render={({ field }) => (<FormItem><FormLabel>{t('contactSection.institutionalSiteLabel')}</FormLabel><FormControl><Input type="url" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={formMethods.control} name="addressCep" render={({ field }) => (<FormItem><FormLabel>{t('contactSection.cepLabel')}</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={formMethods.control} name="addressStreet" render={({ field }) => (<FormItem><FormLabel>{t('contactSection.streetLabel')}</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={formMethods.control} name="addressNumber" render={({ field }) => (<FormItem><FormLabel>{t('contactSection.numberLabel')}</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={formMethods.control} name="addressComplement" render={({ field }) => (<FormItem><FormLabel>{t('contactSection.complementLabel')}</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={formMethods.control} name="addressDistrict" render={({ field }) => (<FormItem><FormLabel>{t('contactSection.districtLabel')}</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={formMethods.control} name="addressCity" render={({ field }) => (<FormItem><FormLabel>{t('contactSection.cityLabel')}</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={formMethods.control} name="addressState" render={({ field }) => (<FormItem><FormLabel>{t('contactSection.stateLabel')}</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={formMethods.control} name="addressCountry" render={({ field }) => (<FormItem><FormLabel>{t('contactSection.countryLabel')}</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                            
                            <Separator />

                            <h3 className="section-title"><Icon name="Link2" className="section-title-icon"/>{t('socialSection.title')}</h3>
                            <FormField control={formMethods.control} name="socialLinks" render={({ field }) => (<FormItem><FormControl><SocialLinksInput {...field} disabled={isFormEffectivelyDisabled} /></FormControl><FormMessage /></FormItem>)}/>

                            <Separator />
                            
                            <h3 className="section-title"><Icon name="Globe" className="section-title-icon"/>{t('regionalizationSection.title')}</h3>
                            <div className="space-y-4 rounded-lg border p-4">
                                <FormField control={formMethods.control} name="multilingual_system_enabled" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between">
                                        <div className="space-y-0.5">
                                            <FormLabel className="flex items-center"><Icon name="Languages" className="mr-2 h-4 w-4"/>{t('regionalizationSection.multilingualLabel')}</FormLabel>
                                            <FormDescription>{t('regionalizationSection.multilingualDescription')}</FormDescription>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )}/>
                                {!isMultiLingual && (
                                    <div className="pt-4 border-t border-dashed">
                                       <FormField control={formMethods.control} name="single_language_code" render={({ field }) => (<FormItem><FormLabel>{t('regionalizationSection.singleLanguageLabel')}</FormLabel><FormControl><LanguageSelect {...field} disabled={isFormEffectivelyDisabled} /></FormControl><FormMessage /></FormItem>)}/>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField control={formMethods.control} name="defaultLanguage" render={({ field }) => (<FormItem><FormLabel>{t('regionalizationSection.defaultLanguageLabel')}<span className="text-destructive">*</span></FormLabel><FormControl><LanguageSelect {...field} disabled={isFormEffectivelyDisabled} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={formMethods.control} name="defaultTimezone" render={({ field }) => (<FormItem><FormLabel>{t('regionalizationSection.defaultTimezoneLabel')}<span className="text-destructive">*</span></FormLabel><FormControl><TimezoneSelect {...field} disabled={isFormEffectivelyDisabled} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={formMethods.control} name="defaultCurrency" render={({ field }) => (<FormItem><FormLabel>{t('regionalizationSection.defaultCurrencyLabel')}<span className="text-destructive">*</span></FormLabel><FormControl><CurrencySelect {...field} disabled={isFormEffectivelyDisabled} /></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <div className="flex w-full justify-end">
                                <Button type="submit" disabled={isFormEffectivelyDisabled || !isDirty}>
                                    {(isSaving || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    {tCommon('save')}
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
