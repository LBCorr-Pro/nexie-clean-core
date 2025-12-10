// src/components/layout/ActingBar.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe, Building, Network, Loader2 } from 'lucide-react';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useDebugMenu } from '@/contexts/DebugMenuContext';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { onSnapshot, query, orderBy } from 'firebase/firestore';
import { refs } from '@/lib/firestore-refs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/nx-use-toast';
import '@/styles/acting-bar.css';

interface InstanceInfo { id: string; name: string; type: 'dev' | 'master' | 'default'; }
interface SubInstanceInfo { id: string; name: string; type: 'dev' | 'master' | 'default'; }

export function ActingBar() {
    const { isActingBarVisible } = useDebugMenu();
    const { toast } = useToast();
    const { actingAsInstanceId, isActingAsMaster, setActingAs } = useInstanceActingContext();
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const subInstanceId = useSearchParams().get('subInstanceId');

    const [instances, setInstances] = useState<InstanceInfo[] | null>(null);
    const [subInstances, setSubInstances] = useState<SubInstanceInfo[]>([]);
    
    const isLoading = isActingBarVisible && instances === null;

    useEffect(() => {
        if (!isActingBarVisible) return;

        const instancesQuery = query(refs.instances());
        const unsubInstances = onSnapshot(instancesQuery, (snapshot) => {
            const fetchedInstances = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().instanceName || `Instância ${doc.id.substring(0, 4)}`,
                type: doc.data().instanceType || 'default',
            })).sort((a,b) => a.name.localeCompare(b.name));
            setInstances(fetchedInstances);
        }, (err) => {
            console.error("Failed to fetch instances for acting bar", err);
            toast({ title: "Erro", description: "Não foi possível carregar as instâncias.", variant: "destructive" });
            setInstances([]);
        });

        return () => unsubInstances();
    }, [isActingBarVisible, toast]);

    useEffect(() => {
        if (!actingAsInstanceId) {
            if (subInstances.length > 0) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSubInstances([]);
            }
            return;
        }

        const subInstancesQuery = query(refs.instance.subinstances(actingAsInstanceId), orderBy('subInstanceName'));
        const unsubSubInstances = onSnapshot(subInstancesQuery, (snapshot) => {
            const fetchedSubInstances = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().subInstanceName || `Sub-instância ${doc.id.substring(0, 4)}`,
                type: doc.data().instanceType || 'default',
            }));
            setSubInstances(fetchedSubInstances);
        }, (err) => {
             console.error("Failed to fetch sub-instances for acting bar", err);
             setSubInstances([]);
        });

        return () => unsubSubInstances();
    }, [actingAsInstanceId, subInstances.length]);

    const handleSetActingAs = (id: string | null, name: string | null) => {
        setActingAs(id, name);
        const newPath = id ? `/${locale}/dashboard/${id}` : `/${locale}/dashboard`;
        router.push(newPath);
    };
    
    const handleSetSubInstance = (subId: string) => {
        const url = new URL(window.location.href);
        url.pathname = `/${locale}/dashboard/${actingAsInstanceId}/${subId}`;
        router.push(url.toString());
    };

    const currentInstanceType = useMemo(() => instances?.find(inst => inst.id === actingAsInstanceId)?.type || 'default', [instances, actingAsInstanceId]);
    const currentSubInstanceType = useMemo(() => subInstances.find(sub => sub.id === subInstanceId)?.type || 'default', [subInstances, subInstanceId]);

    if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true' || !isActingBarVisible) {
        return null;
    }
    
    return (
        <TooltipProvider>
            <div className="flex items-center gap-1 p-1 border rounded-lg bg-background/50">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn("h-7 w-7 acting-bar-btn acting-bar-btn-global", isActingAsMaster ? "active" : "inactive")} onClick={() => handleSetActingAs(null, null)} disabled={isActingAsMaster}>
                             <Globe className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Atuar como Master Global</p></TooltipContent>
                </Tooltip>

                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className={cn("h-7 w-7 acting-bar-btn acting-bar-btn-instance", !!actingAsInstanceId ? `active-${currentInstanceType}` : "inactive")} disabled={isLoading || !instances || instances.length === 0}>
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Building className="h-4 w-4" />}
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent><p>Atuar como Instância</p></TooltipContent>
                    </Tooltip>
                    {instances && instances.length > 0 && (
                        <DropdownMenuContent>
                            {instances.map(inst => (
                                <DropdownMenuItem key={inst.id} onClick={() => handleSetActingAs(inst.id, inst.name)}>{inst.name}</DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    )}
                </DropdownMenu>

                <DropdownMenu>
                     <Tooltip>
                        <TooltipTrigger asChild>
                             <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className={cn("h-7 w-7 acting-bar-btn acting-bar-btn-sub", !!subInstanceId ? `active-${currentSubInstanceType}` : "inactive")} disabled={!actingAsInstanceId || subInstances.length === 0}>
                                    <Network className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent><p>Atuar como Sub-instância</p></TooltipContent>
                    </Tooltip>
                    {subInstances.length > 0 && (
                        <DropdownMenuContent>
                            {subInstances.map(sub => (
                                <DropdownMenuItem key={sub.id} onClick={() => handleSetSubInstance(sub.id)}>
                                    {sub.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    )}
                </DropdownMenu>
            </div>
        </TooltipProvider>
    );
}
