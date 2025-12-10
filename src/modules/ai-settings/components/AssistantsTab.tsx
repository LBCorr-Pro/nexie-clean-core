// src/modules/ai-settings/components/AssistantsTab.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Edit, Trash2, Loader2, Bot, Copy, MessageSquare, Image as ImageIcon, Video, Voicemail } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { refs } from '@/lib/firestore-refs';
import { useToast } from '@/hooks/nx-use-toast';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AssistantFormDialog } from './AssistantFormDialog';
import type { AIAssistant, AIProviderConfig } from '../types';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';

export function AssistantsTab() {
  const t = useTranslations('aiSettings.assistantsTab');
  const { toast } = useToast();
  const { hasPermission } = useUserPermissions();

  const [assistants, setAssistants] = useState<AIAssistant[]>([]);
  const [configurations, setConfigurations] = useState<AIProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Partial<AIAssistant> | null>(null);
  const [assistantToDelete, setAssistantToDelete] = useState<AIAssistant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = hasPermission('master.ia_integrations.manage');

  const assistantTypeConfig = {
    text: { icon: MessageSquare, label: t('typeLabels.text') },
    image: { icon: ImageIcon, label: t('typeLabels.image') },
    video: { icon: Video, label: t('typeLabels.video') },
    speech: { icon: Voicemail, label: t('typeLabels.speech') },
  };
  
  useEffect(() => {
    const qConfigs = query(refs.master.aiProviderConfigurations());
    const unsubConfigs = onSnapshot(qConfigs, (snapshot) => {
        setConfigurations(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as AIProviderConfig)));
    });

    const qAssistants = query(refs.master.aiAssistants(), orderBy("name"));
    const unsubAssistants = onSnapshot(qAssistants, (snapshot) => {
        setAssistants(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AIAssistant)));
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching AI assistants:", error);
        toast({ title: t('toasts.loadingError'), variant: "destructive" });
        setIsLoading(false);
    });

    return () => { unsubConfigs(); unsubAssistants(); };
  }, [toast, t]);

  const handleOpenDialog = (assistant?: AIAssistant) => {
    if (!canManage) return;
    setEditingAssistant(assistant || null);
    setShowDialog(true);
  };
  
  const handleDuplicateAssistant = (assistant: AIAssistant) => {
    if (!canManage) return;
    const { id, ...restOfAssistant } = assistant;
    const duplicatedData = {
      ...restOfAssistant,
      name: `${assistant.name} (Cópia)`,
    };
    setEditingAssistant(duplicatedData);
    setShowDialog(true);
    toast({ title: t('toasts.duplicatingTitle'), description: t('toasts.duplicatingDescription', { name: assistant.name }) });
  };

  const handleDelete = async () => {
    if (!assistantToDelete || !canManage) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(refs.master.aiAssistants(), assistantToDelete.id));
      toast({ title: t('deleteDialog.title'), description: t('deleteDialog.description', { name: assistantToDelete.name }) });
      setAssistantToDelete(null);
    } catch (error: any) {
      toast({ title: t('toasts.deleteErrorTitle'), description: error.message, variant: "destructive"});
    } finally {
      setIsDeleting(false);
    }
  };

  const configMap = new Map(configurations.map(c => [c.id, c.name]));

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                  <CardTitle>{t('title')}</CardTitle>
                  <CardDescription>{t('description')}</CardDescription>
              </div>
              <Button onClick={() => handleOpenDialog()} className="w-full md:w-auto shrink-0" disabled={!canManage}>
                  <PlusCircle className="mr-2 h-4 w-4" /> {t('addButton')}
              </Button>
          </div>
        </CardHeader>
        <CardContent>
           <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">{t('table.headerIcon')}</TableHead>
                            <TableHead>{t('table.headerNameType')}</TableHead>
                            <TableHead>{t('table.headerEngine')}</TableHead>
                            <TableHead className="text-right">{t('table.headerActions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                        ) : assistants.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t('table.noResults')}</TableCell></TableRow>
                        ) : (
                            assistants.map(assistant => {
                                const typeConfig = assistantTypeConfig[assistant.assistantType] || assistantTypeConfig.text;
                                return (
                                <TableRow key={assistant.id}>
                                    <TableCell>
                                        <Avatar>
                                            <AvatarFallback>{getInitials(assistant.name)}</AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{assistant.name}</div>
                                        <Badge variant="outline" className="text-xs mt-1">
                                            <Icon name={typeConfig.icon} className="mr-1.5 h-3 w-3" />
                                            {typeConfig.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{configMap.get(assistant.configurationId) || t('table.undefinedConfig')}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canManage}><MoreVertical className="h-4 w-4"/></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(assistant)} disabled={!canManage}><Edit className="mr-2 h-4 w-4"/>{t('actions.edit')}</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDuplicateAssistant(assistant)} disabled={!canManage}>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    <span>{t('actions.duplicate')}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => setAssistantToDelete(assistant)} className="text-destructive" disabled={!canManage}><Trash2 className="mr-2 h-4 w-4"/>{t('actions.delete')}</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )})
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>

      {showDialog && (
          <AssistantFormDialog 
            isOpen={showDialog}
            onClose={() => { setShowDialog(false); setEditingAssistant(null); }}
            editingAssistant={editingAssistant as AIAssistant | null}
            configurations={configurations}
          />
      )}

      <AlertDialog open={!!assistantToDelete} onOpenChange={() => setAssistantToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
                <AlertDialogDescription>{t('deleteDialog.description', { name: assistantToDelete?.name })}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>{t('deleteDialog.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting || !canManage} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{t('deleteDialog.confirm')}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
