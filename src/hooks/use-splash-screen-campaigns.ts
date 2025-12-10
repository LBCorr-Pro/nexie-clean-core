// src/hooks/use-splash-screen-campaigns.ts
"use client";

import { useState, useEffect } from 'react';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, getDocs, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { refs } from '@/lib/firestore-refs';
import type { Campaign } from '@/components/splash-screen'; // Ajuste o tipo conforme a localização real

const SPLASH_SCREEN_STORAGE_KEY = "splash_screen_views";

const fetchCampaignsForContext = async (
    isLoggedIn: boolean, 
    userAccessLevelId: string | null,
    instanceId: string | null,
    subInstanceId: string | null
): Promise<Campaign[]> => {
  const now = Timestamp.now();
  const baseConstraints = [
    where('status', '==', 'active'),
    where('startDate', '<=', now),
  ];
  
  const campaignRefs = [
      refs.master.splashScreenCampaigns(),
  ];
  if(instanceId) campaignRefs.unshift(refs.instance.splashScreenCampaigns(instanceId));
  if(instanceId && subInstanceId) campaignRefs.unshift(refs.subinstance.splashScreenCampaigns(instanceId, subInstanceId));

  let finalCampaigns: Campaign[] = [];

  for (const ref of campaignRefs) {
      const q = query(ref, ...baseConstraints);
      const snapshot = await getDocs(q);
      
      const activeCampaigns = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Campaign))
        .filter(campaign => !campaign.endDate || campaign.endDate.toDate() > now.toDate());
      
      finalCampaigns = [...finalCampaigns, ...activeCampaigns];
      if (finalCampaigns.length > 0) break;
  }
  
  return finalCampaigns.filter(campaign => {
    const target = campaign.targetAudience;
    if (!target || target.type === 'public') return true;
    if (target.type === 'all_logged_in') return isLoggedIn;
    if (target.type === 'specific_groups' && target.accessLevelIds) {
      return isLoggedIn && userAccessLevelId && target.accessLevelIds.includes(userAccessLevelId);
    }
    return false;
  });
};

export function useSplashScreenCampaigns() {
  const { currentUser, userAccessLevelId } = useUserPermissions();
  const { actingAsInstanceId } = useInstanceActingContext();
  const searchParams = useSearchParams();
  const subInstanceId = searchParams.get('subInstanceId');

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaignsForContext(!!currentUser, userAccessLevelId, actingAsInstanceId, subInstanceId)
      .then(fetched => {
        if (typeof window !== 'undefined') {
            const viewsData = JSON.parse(localStorage.getItem(SPLASH_SCREEN_STORAGE_KEY) || '{}');
            const sessionViewed = new Set(JSON.parse(sessionStorage.getItem(SPLASH_SCREEN_STORAGE_KEY) || '[]'));
            
            const campaignsToActuallyShow = fetched.filter(c => {
                if (c.displayFrequency === 'once_ever') return !viewsData[c.id];
                if (c.displayFrequency === 'once_per_session') return !sessionViewed.has(c.id);
                return true;
            });

            const appOpening = campaignsToActuallyShow.filter(c => c.campaignType === 'app_opening');
            const banners = campaignsToActuallyShow.filter(c => c.campaignType === 'banner');
            setCampaigns([...appOpening, ...banners]);
        }
      })
      .catch(err => {
        console.error("Error fetching splash screen campaigns:", err);
        setError("Failed to load campaigns.");
      })
      .finally(() => setIsLoading(false));
  }, [currentUser, userAccessLevelId, actingAsInstanceId, subInstanceId]);

  const markCampaignAsViewed = async (campaign: Campaign) => {
    if (typeof window === 'undefined') return;

    const viewsData = JSON.parse(localStorage.getItem(SPLASH_SCREEN_STORAGE_KEY) || '{}');
    if (campaign.displayFrequency === 'once_ever') {
      viewsData[campaign.id] = Date.now();
      localStorage.setItem(SPLASH_SCREEN_STORAGE_KEY, JSON.stringify(viewsData));
    }
    const sessionViewed = new Set(JSON.parse(sessionStorage.getItem(SPLASH_SCREEN_STORAGE_KEY) || '[]'));
    sessionViewed.add(campaign.id);
    sessionStorage.setItem(SPLASH_SCREEN_STORAGE_KEY, JSON.stringify(Array.from(sessionViewed)));

    if (currentUser) {
      try {
        const viewsCollectionRef = refs.master.splashScreenCampaignViews();
        await addDoc(viewsCollectionRef, { userId: currentUser.uid, campaignId: campaign.id, viewedAt: serverTimestamp() });
      } catch (logError) {
        console.error("Error logging campaign view:", logError);
      }
    }
  };

  return { campaigns, isLoading, error, markCampaignAsViewed };
}
