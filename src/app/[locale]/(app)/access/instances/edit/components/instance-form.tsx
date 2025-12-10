'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Supondo que você tenha um hook para buscar listas de planos e instâncias
// import { usePlans } from '@/hooks/use-nx-plans'; 
// import { useInstances } from '@/hooks/use-nx-manage-instances';

interface EditInstanceFormProps {
  isSubmitting: boolean;
  // Adicionar props para receber as listas de planos e instâncias
  // plans: any[];
  // instances: any[];
}

export function EditInstanceForm({ isSubmitting }: EditInstanceFormProps) {
  const { control } = useFormContext();
  const t = useTranslations('instanceManagement.form');
  const tCommon = useTranslations('common');

  // Hooks para carregar os dados necessários para os seletores
  // const { plans } = usePlans(); 
  // const { instances } = useInstances();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={control}
            name="instanceName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('name.label')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('name.placeholder')} {...field} />
                </FormControl>
                <FormDescription>{t('name.description')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="instanceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('type.label')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('type.placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="default">{t('type.options.default')}</SelectItem>
                    <SelectItem value="dev">{t('type.options.dev')}</SelectItem>
                    <SelectItem value="master">{t('type.options.master')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>{t('type.description')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* NOVO CAMPO: Seletor de Plano */}
          <FormField
            control={control}
            name="planId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('plan.label')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('plan.placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Exemplo de como os planos seriam renderizados */}
                    {/* {plans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                    ))} */}
                    <SelectItem value="plan_basic_123">Plano Básico</SelectItem>
                    <SelectItem value="plan_pro_456">Plano Pro</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>{t('plan.description')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* NOVO CAMPO: Seletor de Instância Master do Plano */}
          <FormField
            control={control}
            name="planMasterInstanceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('planMaster.label')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('planMaster.placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                     {/* A lista de instâncias seria filtrada para mostrar apenas as masters */}
                    <SelectItem value="master_pro_abc">Master do Plano Pro</SelectItem>
                    <SelectItem value="master_basic_def">Master do Plano Básico</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>{t('planMaster.description')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>{t('status.label')}</FormLabel>
                  <FormDescription>{t('status.description')}</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? tCommon('saving') : tCommon('saveChanges')}
      </Button>
    </div>
  );
}
