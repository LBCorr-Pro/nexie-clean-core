
// src/app/[locale]/(app)/settings/campaigns/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/nx-use-toast";
import { useInstanceActingContext } from "@/contexts/instance-acting-context";
import { useSearchParams } from 'next/navigation';
import { refs } from '@/lib/firestore-refs';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Presentation, PlusCircle, Edit, Trash2, BarChart2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CampaignFormDialog } from './components/CampaignFormDialog';
import { BackButton } from '@/components/ui/back-button';
import type { Campaign, CampaignView } from './types';
import { fetchCampaignReport } from './actions';
import { ReportDialog } from './components/ReportDialog';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useTranslations, useFormatter } from 'next-intl';
import { AccessDenied } from '@/components/ui/access-denied';

// Fron-end specific type to ensure dates are JS Date objects
interface CampaignForPage extends Omit<Campaign, 'startDate' | 'endDate' | 'createdAt' | 'last_updated'> {
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt?: Date;
  last_updated?: Date;
}

// Helper to convert Firestore Timestamps to JS Dates in a campaign object
const toCampaignForPage = (campaignData: any): CampaignForPage => {
    const data = { ...campaignData };
    for (const key of ['startDate', 'endDate', 'createdAt', 'last_updated']) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate();
        }
    }
    return data as CampaignForPage;
}

export default function CampaignsPage() {
  // CORREÇÃO: Carrega os dois namespaces necessários em variáveis separadas
  const t = useTranslations('campaigns');
  const tCommon = useTranslations('common');
  
  const format = useFormatter();
  const { toast } = useToast();
  const { actingAsInstanceId } = useInstanceActingContext();
  const { hasPermission } = useUserPermissions();
  const searchParams = useSearchParams();
  const subInstanceId = searchParams.get('subInstanceId');

  const [campaigns, setCampaigns] = useState<CampaignForPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignForPage | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<CampaignForPage | null>(null);

  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportData, setReportData] = useState<CampaignView[]>([]);
  const [viewingReportFor, setViewingReportFor] = useState<CampaignForPage | null>(null);

  const canManageCampaigns = hasPermission('master.instance.edit_details'); // Usando uma permissão existente como placeholder

  const getCampaignsRef = useCallback(() => {
    if (actingAsInstanceId && subInstanceId) return refs.subinstance.splashScreenCampaigns(actingAsInstanceId, subInstanceId);
    if (actingAsInstanceId) return refs.instance.splashScreenCampaigns(actingAsInstanceId);
    return refs.master.splashScreenCampaigns();
  }, [actingAsInstanceId, subInstanceId]);

  useEffect(() => {
    const campaignsRef = getCampaignsRef();
    const q = query(campaignsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCampaigns = snapshot.docs.map(docSnap => 
        toCampaignForPage({ id: docSnap.id, ...docSnap.data() })
      );
      setCampaigns(fetchedCampaigns);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching campaigns:", error);
      toast({ title: t('toasts.loadError'), variant: "destructive" });
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [toast, getCampaignsRef, t]);
  
  const handleOpenDialog = (campaign?: CampaignForPage) => {
    setEditingCampaign(campaign || null);
    setShowDialog(true);
  };
  
  const handleDeleteCampaign = async () => {
    if (!campaignToDelete || !canManageCampaigns) return;
    setIsProcessing(true);
    try {
      const campaignsRef = getCampaignsRef();
      await deleteDoc(doc(campaignsRef, campaignToDelete.id));
      toast({ title: t('toasts.deleteSuccess') });
    } catch (error) {
      toast({ title: t('toasts.deleteError'), variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setCampaignToDelete(null);
    }
  };
  
  const handleOpenReport = async (campaign: CampaignForPage) => {
    setViewingReportFor(campaign);
    setIsReportLoading(true);
    setReportData([]);
    try {
        const result = await fetchCampaignReport(campaign.id, getCampaignsRef());
        if (result.success && result.data) {
            setReportData(result.data);
        } else {
            throw new Error(result.error || t('toasts.reportGenericError'));
        }
    } catch(e: any) {
        toast({ title: t('toasts.reportErrorTitle'), description: e.message, variant: "destructive" });
    }
    setIsReportLoading(false);
  };

  const getStatusVariant = (status: string) => {
    switch(status) {
        case 'active': return 'success';
        case 'inactive': return 'secondary';
        case 'draft': return 'outline';
        default: return 'secondary';
    }
  };

  if (!canManageCampaigns) {
    return <AccessDenied />;
  }

  return (
    <>
      <Card>
        <CardHeader className="relative">
            <BackButton className="absolute right-6 top-3"/>
             <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pt-2"> 
              <div>
                  <CardTitle className="section-title !border-none !pb-0">
                      <Presentation className="section-title-icon"/>
                      {t('title')}
                  </CardTitle>
                  <CardDescription>{t('description')}</CardDescription>
              </div>
              <Button onClick={() => handleOpenDialog()} disabled={isLoading || !canManageCampaigns} className="shrink-0 w-full md:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> {t('createButton')}
              </Button>
            </div>
        </CardHeader>
          <CardContent>
            {isLoading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div> :
             <div className="border rounded-md">
                <Table>
                    <TableHeader><TableRow><TableHead>{t('table.campaign')}</TableHead><TableHead>{t('table.type')}</TableHead><TableHead>{t('table.status')}</TableHead><TableHead>{t('table.period')}</TableHead><TableHead className="text-right">{t('table.actions')}</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {campaigns.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t('noCampaigns')}</TableCell></TableRow>
                    ) : (
                        campaigns.map(campaign => (
                            <TableRow key={campaign.id}>
                                <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                                <TableCell><Badge variant="outline">{t(`types.${campaign.campaignType}`)}</Badge></TableCell>
                                <TableCell><Badge variant={getStatusVariant(campaign.status)}>{t(`status.${campaign.status}`)}</Badge></TableCell>
                                <TableCell className="text-sm">
                                    {campaign.startDate ? format.dateTime(campaign.startDate, { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'} - {campaign.endDate ? format.dateTime(campaign.endDate, { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenReport(campaign)}><BarChart2 className="h-4 w-4 mr-1"/>{t('actions.report')}</Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(campaign)}><Edit className="h-4 w-4 mr-1"/>{t('actions.edit')}</Button>
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setCampaignToDelete(campaign)}><Trash2 className="h-4 w-4 mr-1"/>{t('actions.delete')}</Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                    </TableBody>
                </Table>
             </div>
            }
          </CardContent>
      </Card>
      
      {showDialog && (
        <CampaignFormDialog
            isOpen={showDialog}
            onClose={() => { setShowDialog(false); setEditingCampaign(null); }}
            editingCampaign={editingCampaign}
        />
      )}

      <AlertDialog open={!!campaignToDelete} onOpenChange={(open) => !open && setCampaignToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {/* CORREÇÃO DEFINITIVA: Usando a chave correta. */}
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDialog.description', { campaignName: campaignToDelete?.campaignName || '' })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCampaign} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">{isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{t('actions.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {viewingReportFor && (
         <ReportDialog
            isOpen={!!viewingReportFor}
            onClose={() => setViewingReportFor(null)}
            campaignName={viewingReportFor.campaignName}
            reportData={reportData}
            isLoading={isReportLoading}
         />
      )}
    </>
  );
}
