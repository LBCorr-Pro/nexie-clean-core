'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/nx-use-toast';
import { useRouter } from 'next/navigation';

import { Instance } from '@/app/[locale]/(app)/access/instances/types';
import { EditInstanceForm } from './instance-form';
// Placeholder for the server action
// import { updateInstanceAction } from '@/lib/actions/instance-actions';

// Schema for form validation
const instanceSchema = z.object({
  instanceName: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  instanceType: z.enum(['default', 'dev', 'master']),
  status: z.boolean(),
});

type InstanceFormValues = z.infer<typeof instanceSchema>;

interface InstanceEditClientProps {
  instance: Instance;
}

export function InstanceEditClient({ instance }: InstanceEditClientProps) {
  const t = useTranslations('instanceManagement');
  const { toast } = useToast();
  const router = useRouter();

  const formMethods = useForm<InstanceFormValues>({
    resolver: zodResolver(instanceSchema),
    defaultValues: {
      instanceName: instance.instanceName || '',
      instanceType: instance.instanceType || 'default',
      status: instance.status,
    },
  });

  const onSubmit = async (data: InstanceFormValues) => {
    toast({ title: 'Salvando...', description: 'As alterações da instância estão sendo salvas.' });
    console.log("Form data to be submitted:", data);
    // TODO: Implement server action call
    // const result = await updateInstanceAction(instance.id, data);
    // if (result.success) {
    //   toast({ title: 'Sucesso!', description: 'Instância atualizada com sucesso.' });
    //   router.refresh();
    // } else {
    //   toast({ variant: 'destructive', title: 'Erro', description: result.error });
    // }
  };

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-8">
        <EditInstanceForm isSubmitting={formMethods.formState.isSubmitting} />
      </form>
    </FormProvider>
  );
}
