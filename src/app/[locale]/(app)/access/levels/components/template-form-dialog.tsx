
// src/app/[locale]/(app)/access/levels/components/template-form-dialog.tsx
"use client";

import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations } from 'next-intl';
import { AccessLevelTemplate } from '../types';
import { availablePermissions, Permission } from '@/lib/permissions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createTemplate, updateTemplate } from '../actions';
import { Loader2 } from 'lucide-react';

// Create a schema for permissions
const permissionsSchema = z.record(z.boolean());

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  permissions: permissionsSchema,
});

type FormValues = z.infer<typeof formSchema>;

interface TemplateFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  template?: AccessLevelTemplate | null;
  onSuccess: () => void;
}

// Helper to group permissions by category
const groupPermissionsByCategory = (permissions: readonly Permission[]) => {
  return permissions.reduce((acc, permission) => {
    const category = permission.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
};

export function TemplateFormDialog({ isOpen, onOpenChange, template, onSuccess }: TemplateFormDialogProps) {
  const t = useTranslations('AccessLevels.form');
  const tPermissions = useTranslations('Permissions');
  const tToast = useTranslations('Toast');

  const groupedPermissions = useMemo(() => groupPermissionsByCategory(availablePermissions), []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  // Effect to reset form when template changes or dialog opens/closes
  useEffect(() => {
    const defaultValues = {
      name: template?.name || '',
      description: template?.description || '',
      permissions: availablePermissions.reduce((acc, perm) => {
        acc[perm.id] = template ? perm.id in template.permissions : false;
        return acc;
      }, {} as Record<string, boolean>),
    };
    form.reset(defaultValues);
  }, [template, isOpen, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const selectedPermissions = Object.entries(values.permissions)
        .filter(([_, isSelected]) => isSelected)
        .map(([permissionId, _]) => permissionId);

      const payload = {
        name: values.name,
        description: values.description,
        permissions: selectedPermissions,
      };

      const action = template ? updateTemplate.bind(null, template.id) : createTemplate;
      const result = await action(payload);

      if (result.errors) {
        throw new Error(Object.values(result.errors).flat().join(', '));
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(template ? tToast('updateSuccess') : tToast('createSuccess'));
      onSuccess(); // invalidate queries and refresh data
      onOpenChange(false); // close dialog
    },
    onError: (error) => {
      toast.error(tToast('error'), {
        description: error.message,
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template ? t('editTitle') : t('createTitle')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <fieldset disabled={mutation.isPending} className="space-y-4">
                <div className='flex gap-4'>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className='flex-1'>
                          <FormLabel>{t('nameLabel')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('namePlaceholder')} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className='flex-1'>
                          <FormLabel>{t('descriptionLabel')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('descriptionPlaceholder')} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                </div>
                
                <h3 className="text-lg font-medium">{t('permissionsTitle')}</h3>
                <ScrollArea className="h-72 w-full rounded-md border p-4">
                    <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([category, permissions]) => (
                        <fieldset key={category} className="border p-4 rounded-lg">
                            <legend className="text-md font-semibold px-2">{tPermissions(`categories.${category}`)}</legend>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                            {permissions.map((permission) => (
                                <FormField
                                key={permission.id}
                                control={form.control}
                                name={`permissions.${permission.id}`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 h-full">
                                        <FormControl>
                                            <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel title={tPermissions(`${permission.id}.description`)}>
                                                {tPermissions(`${permission.id}.name`)}
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                                />
                            ))}
                            </div>
                        </fieldset>
                    ))}
                    </div>
                </ScrollArea>
            </fieldset>
            <DialogFooter>
              <Button type="button" variant='outline' onClick={() => onOpenChange(false)} disabled={mutation.isPending}>{t('cancelButton')}</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('saveButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
