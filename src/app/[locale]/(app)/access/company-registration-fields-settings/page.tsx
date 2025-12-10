
// src/app/[locale]/(app)/access/company-registration-fields-settings/page.tsx
"use client";

import * as React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { useTranslations } from 'next-intl';
import { useNxCompanyRegistrationFields } from '@/hooks/use-nx-company-registration-fields';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Briefcase, PlusCircle, Trash2, GripVertical, ShieldCheck, Eye, Asterisk, MoreVertical, Edit, RefreshCw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription as AlertBoxDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SortableList } from '@/components/shared/dnd/SortableList';
import { BackButton } from "@/components/ui/back-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AccessDenied } from "@/components/ui/access-denied";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const FieldTypeEnumOptions = ["text", "number", "email", "date", "url", "dropdown", "checkbox", "switch", "file", "cnpj", "address_group", "textarea", "social"];

const FieldEditor: React.FC<{ form: UseFormReturn<any>, index: number, isPredefined: boolean, disabled: boolean }> = ({ form, index, isPredefined, disabled }) => {
    const t = useTranslations('companyRegistrationFields.fieldEditor');
    const field = form.watch(`fields.${index}`);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pt-4">
            <FormField control={form.control} name={`fields.${index}.label`} render={({ field }) => ( <FormItem><FormLabel>{t('labelLabel')}</FormLabel><FormControl><Input {...field} disabled={disabled} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name={`fields.${index}.fieldKey`} render={({ field }) => ( <FormItem><FormLabel>{t('fieldKeyLabel')}</FormLabel><FormControl><Input {...field} disabled={isPredefined || disabled} /></FormControl><FormDescription>{t('fieldKeyDescription')}</FormDescription><FormMessage /></FormItem> )} />
            <FormField control={form.control} name={`fields.${index}.fieldType`} render={({ field }) => ( <FormItem><FormLabel>{t('fieldTypeLabel')}</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPredefined || disabled}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{FieldTypeEnumOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
            <FormField control={form.control} name={`fields.${index}.description`} render={({ field }) => ( <FormItem><FormLabel>{t('descriptionLabel')}</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} placeholder={t('descriptionPlaceholder')} rows={2} disabled={disabled}/></FormControl><FormMessage /></FormItem> )} />
            <div className="md:col-span-2 flex flex-wrap items-center gap-4 mt-2">
                <FormField control={form.control} name={`fields.${index}.isVisible`} render={({ field: formField }) => ( <FormItem className="flex items-center space-x-2 p-3 border rounded-md"><FormControl><Switch checked={formField.value} onCheckedChange={formField.onChange} disabled={disabled}/></FormControl><FormLabel className="text-sm mb-0">{t('visibleLabel')}</FormLabel></FormItem> )} />
                <FormField control={form.control} name={`fields.${index}.isRequired`} render={({ field: formField }) => ( <FormItem className="flex items-center space-x-2 p-3 border rounded-md"><FormControl><Switch checked={formField.value} onCheckedChange={formField.onChange} disabled={disabled}/></FormControl><FormLabel className="text-sm mb-0">{t('requiredLabel')}</FormLabel></FormItem> )} />
                <FormField control={form.control} name={`fields.${index}.isUnique`} render={({ field: formField }) => ( <FormItem className="flex items-center space-x-2 p-3 border rounded-md"><FormControl><Switch checked={formField.value} onCheckedChange={formField.onChange} disabled={disabled}/></FormControl><FormLabel className="text-sm mb-0">{t('uniqueLabel')}</FormLabel></FormItem> )} />
                {(field.fieldType === 'cnpj') && (<FormField control={form.control} name={`fields.${index}.validationConfig.active`} render={({ field: formField }) => ( <FormItem className="flex items-center space-x-2 p-3 border rounded-md bg-sky-50 dark:bg-sky-900/30"><FormControl><Switch checked={formField.value} onCheckedChange={formField.onChange} disabled={disabled}/></FormControl><FormLabel className="text-sm mb-0">{t('validationLabel')}</FormLabel></FormItem> )}/>)}
            </div>
        </div>
    );
};

export default function CompanyRegistrationFieldsSettingsPage() {
  const t = useTranslations('companyRegistrationFields');
  const {
    form, fields, isPageEffectivelyDisabled,
    isLoading, isSaving, isReverting, canEdit, isLoadingPermissions,
    contextAlert, isCustom, contextType, editPerm,
    openAccordion, setOpenAccordion,
    onAddNewField, onDeleteField, onSubmit, onRevert, onSortEnd, move
  } = useNxCompanyRegistrationFields();
  
  const [showRevertDialog, setShowRevertDialog] = React.useState(false);

  if (isLoading || isLoadingPermissions) return <Skeleton className="h-64 w-full" />;
  if (contextType !== 'master' && !canEdit) return <AccessDenied />;
  
  if (contextType === 'master' && !canEdit) {
      return (
          <Card>
              <CardHeader>
                  <BackButton />
                  <CardTitle><Briefcase className="mr-2 h-6 w-6 inline-block" />{t('pageTitle')}</CardTitle>
                  <CardDescription>{t('pageDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                  <Alert variant="destructive">
                      <ShieldCheck className="h-4 w-4" />
                      <AlertTitle>{t('permissionNeededAlert.title')}</AlertTitle>
                      <AlertBoxDescription>{t('permissionNeededAlert.description', { permissionId: editPerm })}</AlertBoxDescription>
                  </Alert>
              </CardContent>
          </Card>
      );
  }

  return (
    <Card>
      <CardHeader>
         <BackButton />
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
                <CardTitle><Briefcase className="mr-2 h-6 w-6 inline-block"/>{t('pageTitle')}</CardTitle>
                <CardDescription>{t('pageDescription')}</CardDescription>
            </div>
            <Button onClick={onAddNewField} disabled={isPageEffectivelyDisabled} className="shrink-0 w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" />{t('addNewFieldButton')}</Button>
        </div>
        {contextAlert.title && (
             <Alert variant={isCustom ? "default" : "info"} className="mt-4">
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>{contextAlert.title}</AlertTitle>
                <AlertBoxDescription>{contextAlert.description}</AlertBoxDescription>
            </Alert>
        )}
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <fieldset disabled={isPageEffectivelyDisabled}>
            <CardContent>
              <SortableList
                    items={fields}
                    onSortEnd={onSortEnd}
                    listContainerClassName="w-full space-y-2"
                    renderItem={(field, { attributes, listeners, isDragging }) => {
                        const index = fields.findIndex(f => f.id === field.id);
                        if (index === -1) return null;
                        const isPredefined = field.isPredefinedField;
                        const isVisibleWatcher = form.watch(`fields.${index}.isVisible`);
                        const isRequiredWatcher = form.watch(`fields.${index}.isRequired`);
                        return (
                            <Accordion type="multiple" value={openAccordion} onValueChange={setOpenAccordion} className="w-full">
                                <AccordionItem value={field.id} className={cn("border rounded-md bg-card shadow-sm group", isDragging && "opacity-50")}>
                                    <div className="flex items-center p-2 rounded-t-md data-[state=open]:bg-muted/30">
                                        <div {...attributes} {...listeners} className="drag-handle cursor-grab p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 touch-none sm:touch-auto">
                                            <GripVertical className="h-5 w-5" />
                                        </div>
                                        <AccordionTrigger className="flex-1 p-2 hover:no-underline" onClick={() => setOpenAccordion(prev => prev.includes(field.id) ? prev.filter(id => id !== field.id) : [...prev, field.id])}>
                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                <span className="font-medium text-sm truncate">{field.label}</span>
                                                {isPredefined && (<TooltipProvider><Tooltip><TooltipTrigger asChild><span onClick={(e) => e.stopPropagation()}><ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" /></span></TooltipTrigger><TooltipContent><p>{t('fieldItem.tooltipSystemField')}</p></TooltipContent></Tooltip></TooltipProvider>)}
                                            </div>
                                        </AccordionTrigger>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            <TooltipProvider><Tooltip><TooltipTrigger asChild><button type="button" onClick={(e) => { e.stopPropagation(); form.setValue(`fields.${index}.isRequired`, !isRequiredWatcher, { shouldDirty: true });}} className="p-1.5 rounded-md hover:bg-accent disabled:opacity-50" disabled={!isVisibleWatcher}><Asterisk className={cn("h-4 w-4", isRequiredWatcher ? "text-destructive" : "text-muted-foreground")} /></button></TooltipTrigger><TooltipContent><p>{isRequiredWatcher ? t('fieldItem.tooltipRequired') : t('fieldItem.tooltipOptional')}</p></TooltipContent></Tooltip></TooltipProvider>
                                            <TooltipProvider><Tooltip><TooltipTrigger asChild><button type="button" onClick={(e) => { e.stopPropagation(); form.setValue(`fields.${index}.isVisible`, !isVisibleWatcher, { shouldDirty: true });}} className="p-1.5 rounded-md hover:bg-accent"><Eye className={cn("h-4 w-4", isVisibleWatcher ? "text-green-600" : "text-muted-foreground")} /></button></TooltipTrigger><TooltipContent><p>{isVisibleWatcher ? t('fieldItem.tooltipVisible') : t('fieldItem.tooltipHidden')}</p></TooltipContent></Tooltip></TooltipProvider>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => setOpenAccordion(prev => prev.includes(field.id) ? prev.filter(id => id !== field.id) : [...prev, field.id])}><Edit className="mr-2 h-4 w-4"/>{t('fieldItem.menuEdit')}</DropdownMenuItem>
                                                    <DropdownMenuSeparator/>
                                                    <DropdownMenuItem className="text-destructive" disabled={isPredefined} onClick={() => onDeleteField(index)}><Trash2 className="mr-2 h-4 w-4"/>{t('fieldItem.menuDelete')}</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                    <AccordionContent className="px-4 pb-4 border-t bg-background rounded-b-md">
                                        <FieldEditor form={form} index={index} isPredefined={!!isPredefined} disabled={!!isPageEffectivelyDisabled} />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        )
                    }}
                />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-6">
                 {isCustom && canEdit && (
                    <Button variant="outline" onClick={() => setShowRevertDialog(true)} disabled={isReverting || isSaving}>
                        {isReverting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />} 
                        {t('revertButton')}
                    </Button>
                 )}
                 <div className="flex-1"></div>
                <Button type="submit" disabled={isPageEffectivelyDisabled || !form.formState.isDirty} className="w-full sm:w-auto">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('saveButton')}</Button>
            </CardFooter>
          </fieldset>
        </form>
      </Form>
       <AlertDialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('revertDialog.title')}</AlertDialogTitle>
                <AlertDialogDescription>{t('revertDialog.description')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{t('revertDialog.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => { onRevert(); setShowRevertDialog(false); }}>{t('revertDialog.confirm')}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
