// src/app/[locale]/(app)/settings/campaigns/actions.ts
"use server";

import { getDoc, collection, query, orderBy, getDocs, doc, CollectionReference, Timestamp } from "firebase/firestore";
import type { CampaignView } from './types';
import { refs } from '@/lib/firestore-refs';

export async function fetchCampaignReport(
    campaignId: string, 
    campaignsRef: CollectionReference
): Promise<{ success: boolean; data?: CampaignView[]; error?: string; }> {
  try {
    const campaignDocRef = doc(campaignsRef, campaignId);
    const viewsRef = collection(campaignDocRef, 'views');
    const viewsQuery = query(viewsRef, orderBy("viewedAt", "desc"));
    const viewsSnapshot = await getDocs(viewsQuery);
    
    const reportData = await Promise.all(viewsSnapshot.docs.map(async (viewDoc) => {
      const viewData = viewDoc.data();
      
      // CORREÇÃO: Acessa a coleção de usuários através de refs.users() e então o documento específico
      const userDocRef = doc(refs.users(), viewData.userId);
      const userSnap = await getDoc(userDocRef);
      
      let userName = 'Usuário Desconhecido';
      if (userSnap.exists()) {
          const userData = userSnap.data();
          userName = userData.displayName || userData.fullName || 'Usuário Desconhecido';
      }
      
      const viewedAtTimestamp = viewData.viewedAt as Timestamp;

      return {
        id: viewDoc.id,
        userId: viewData.userId,
        userName: userName,
        // CORREÇÃO: Garante a conversão segura de Timestamp para Date
        viewedAt: viewedAtTimestamp ? viewedAtTimestamp.toDate() : new Date(),
      };
    }));

    return { success: true, data: reportData };
  } catch (error: any) {
    console.error("Error fetching campaign report:", error);
    return { success: false, error: error.message };
  }
}
