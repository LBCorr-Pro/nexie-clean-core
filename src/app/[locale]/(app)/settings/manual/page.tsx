// src/app/[locale]/(app)/settings/manual/page.tsx
"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { useNxManageManual } from '@/hooks/use-nx-manage-manual';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Edit, Trash2, BookOpen, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

const permissionId = 'master.manual.manage';

const ManualSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-4 w-2/3 mt-2" />
    </CardHeader>
    <CardContent>
      <div className="border rounded-md mt-4">
        <div className="p-3 border-b last:border-b-0"><Skeleton className="h-6 w-full" /></div>
        <div className="p-3 border-b last:border-b-0"><Skeleton className="h-6 w-full" /></div>
        <div className="p-3 border-b last:border-b-0"><Skeleton className="h-6 w-full" /></div>
      </div>
    </CardContent>
  </Card>
);

export default function ManageManualPage() {
  const t = useTranslations('manageManual');
  const hook = useNxManageManual();

  if (hook.isLoading) {
    return <ManualSkeleton />;
  }

  if (!hook.canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="mr-2" />
            {t('accessDenied.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t('accessDenied.description', { permissionId })}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2" />
              {t('pageTitle')}
            </CardTitle>
            <Button onClick={() => hook.handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4"/>{t('createArticleButton')}</Button>
          </div>
          <CardDescription>{t('pageDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md mt-4">
            {hook.articles.length === 0 
              ? <p className="p-4 text-center text-muted-foreground">{t('noArticles')}</p> 
              : hook.articles.map(article => (
                  <div key={article.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                    <span className="font-medium">{article.title}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => hook.handleOpenDialog(article)}><Edit className="h-3 w-3 mr-1"/>{t('editButton')}</Button>
                      <Button variant="destructive" size="sm" onClick={() => hook.setArticleToDelete(article)}><Trash2 className="h-3 w-3 mr-1"/>{t('deleteButton')}</Button>
                    </div>
                  </div>
                ))
            }
          </div>
        </CardContent>
      </Card>

      <Dialog open={hook.showDialog} onOpenChange={hook.setShowDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{hook.editingArticle ? t('form.editTitle') : t('form.createTitle')}</DialogTitle>
            <DialogDescription>{t('form.description')}</DialogDescription>
          </DialogHeader>
          <Form {...hook.form}>
            <form onSubmit={hook.form.handleSubmit(hook.onSubmit)} className="flex-grow overflow-hidden flex flex-col">
              <ScrollArea className="flex-grow pr-6 -mr-6">
                <div className="space-y-4 py-4">
                  <FormField control={hook.form.control} name="title" render={({ field }) => (<FormItem><FormLabel>{t('form.titleLabel')}</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>)}/>
                  <FormField control={hook.form.control} name="slug" render={({ field }) => (<FormItem><FormLabel>{t('form.slugLabel')}</FormLabel><FormControl><Input {...field} disabled={!!hook.editingArticle}/></FormControl><FormMessage/></FormItem>)}/>
                  <FormField control={hook.form.control} name="content" render={({ field }) => (<FormItem><FormLabel>{t('form.contentLabel')}</FormLabel><FormControl><Textarea {...field} rows={15}/></FormControl><FormMessage/></FormItem>)}/>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={hook.form.control} name="order" render={({ field }) => (<FormItem><FormLabel>{t('form.orderLabel')}</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={hook.form.control} name="parentSlug" render={({ field }) => (<FormItem><FormLabel>{t('form.parentSlugLabel')}</FormLabel><FormControl><Input {...field} placeholder={t('form.parentSlugPlaceholder')}/></FormControl><FormMessage/></FormItem>)}/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={hook.form.control} name="requiredPermission" render={({ field }) => (<FormItem><FormLabel>{t('form.requiredPermissionLabel')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('form.requiredPermissionPlaceholder')}/></SelectTrigger></FormControl><SelectContent><SelectItem value="">{t('form.requiredPermissionPlaceholder')}</SelectItem>{hook.availablePermissions.map(p => <SelectItem key={p.id} value={p.id}>{p.id}</SelectItem>)}</SelectContent></Select></FormItem>)}/>
                    <FormField control={hook.form.control} name="requiredModule" render={({ field }) => (<FormItem><FormLabel>{t('form.requiredModuleLabel')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('form.requiredModulePlaceholder')}/></SelectTrigger></FormControl><SelectContent><SelectItem value="">{t('form.requiredModulePlaceholder')}</SelectItem>{hook.allManagedModules.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></FormItem>)}/>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter className="mt-4 shrink-0">
                <DialogClose asChild><Button type="button" variant="outline">{t('form.cancel')}</Button></DialogClose>
                <Button type="submit" disabled={hook.isSaving}>{hook.isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{t('form.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!hook.articleToDelete} onOpenChange={() => hook.setArticleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDialog.description', { title: hook.articleToDelete?.title })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={hook.handleDeleteArticle} disabled={hook.isSaving} className="bg-destructive hover:bg-destructive/90">{t('deleteDialog.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
