// src/app/[locale]/(app)/settings/campaigns/components/ReportDialog.tsx
"use client";

import React from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from 'lucide-react';
import { isValid } from 'date-fns';
import type { CampaignView } from '../types';
import { useFormatter, useTranslations } from 'next-intl';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  reportData: CampaignView[];
  isLoading: boolean;
}

export function ReportDialog({ isOpen, onClose, campaignName, reportData, isLoading }: ReportDialogProps) {
  const t = useTranslations('campaigns.reportDialog');
  const tCommon = useTranslations('common');
  const format = useFormatter();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description', { campaignName })}</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin" /></div>
          ) : reportData.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-4">{t('noViews')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.user')}</TableHead>
                  <TableHead className="text-right">{t('table.viewedAt')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map(view => (
                  <TableRow key={view.id}>
                    <TableCell className="font-medium">{view.userName}</TableCell>
                    <TableCell className="text-right text-xs">
                        {/* CORREÇÃO: Usa a função de formatação correta (dateTime) do objeto format */}
                        {view.viewedAt && isValid(new Date(view.viewedAt)) ? format.dateTime(new Date(view.viewedAt), { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">{tCommon('cancel')}</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
