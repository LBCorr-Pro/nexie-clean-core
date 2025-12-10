// src/components/shared/form/CompanyForm.tsx
"use client";

import React from 'react';
import { FormProvider } from "react-hook-form";
import { useTranslations } from 'next-intl';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, MapPin } from "lucide-react";
import { CnpjInput } from '@/components/shared/form/CnpjInput';
import { ImageUploadField } from '@/components/shared/form/ImageUploadField';
import { Switch } from '@/components/ui/switch';
import { useNxCompanyForm } from '@/hooks/use-nx-company-form';
import { CardFooter } from '@/components/ui/card';

export function CompanyForm({ isEditMode }: { isEditMode: boolean }) {
  const t = useTranslations('companyManagement');
  const { 
    form, 
    onSubmit,
    isLoading,
    isSaving,
    visibleFields, 
    addressGroupConfig,
    visibleAddressSubFields
  } = useNxCompanyForm(isEditMode);

  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleFields.map(config => (
                <FormField
                  key={config.fieldKey}
                  control={form.control}
                  name={config.fieldKey}
                  render={({ field }) => (
                    <FormItem className={config.fieldType === 'switch' ? 'flex flex-row items-center justify-between rounded-lg border p-4 col-span-full' : ''}>
                      <div className="space-y-1">
                        <FormLabel>{config.label} {config.isRequired && <span className="text-destructive">*</span>}</FormLabel>
                        {config.description && <FormDescription>{config.description}</FormDescription>}
                      </div>
                      <FormControl>
                        {config.fieldType === 'textarea' ? <Textarea {...field} />
                         : config.fieldType === 'cnpj' ? <CnpjInput {...field} value={field.value || ''} onChange={field.onChange} />
                         : config.fieldType === 'file' ? <ImageUploadField contextPath={`company_assets/logos`} {...field} aihint="company logo" />
                         : config.fieldType === 'switch' ? <Switch checked={field.value} onCheckedChange={field.onChange} />
                         : config.fieldType === 'dropdown' && config.options ? (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue placeholder={`Selecione ${config.label.toLowerCase()}`} /></SelectTrigger>
                                <SelectContent>{config.options.map((opt: any) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                            </Select>
                         ) : (
                          <Input
                            type={config.fieldType === 'email' ? 'email' : config.fieldType === 'number' ? 'number' : config.fieldType === 'url' ? 'url' : 'text'}
                            placeholder={`Digite ${config.label.toLowerCase()}`}
                            {...field}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            ))}
        </div>

        {addressGroupConfig && visibleAddressSubFields.length > 0 && (
            <div className="space-y-4 pt-6 mt-6 border-t">
              <h3 className="text-md font-medium flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary/80" />{addressGroupConfig.label} {addressGroupConfig.isRequired && <span className="text-destructive ml-1">*</span>}</h3>
              {addressGroupConfig.description && <p className="text-sm text-muted-foreground -mt-3 mb-3">{addressGroupConfig.description}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleAddressSubFields.map(config => {
                       const subKey = config.fieldKey.replace('address','').charAt(0).toLowerCase() + config.fieldKey.replace('address','').slice(1);
                       return (
                           <FormField
                             key={config.fieldKey}
                             control={form.control}
                             name={`address.${subKey}`}
                             render={({ field }) => (
                               <FormItem>
                                 <FormLabel>{config.label} {config.isRequired && <span className="text-destructive">*</span>}</FormLabel>
                                 <FormControl><Input placeholder={`Digite ${config.label.toLowerCase()}`} {...field} value={field.value || ''} /></FormControl>
                                 <FormMessage/>
                               </FormItem>
                             )}
                           />
                       )
                  })}
              </div>
            </div>
        )}
        
        <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-end px-0 pt-6">
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                {isEditMode ? t('saveChangesButton') : t('saveCompanyButton')}
            </Button>
        </CardFooter>
      </form>
    </FormProvider>
  );
}
