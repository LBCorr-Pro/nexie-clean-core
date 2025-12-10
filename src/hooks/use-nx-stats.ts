
// src/hooks/use-nx-stats.ts
"use client";

import * as React from 'react';
import { useUserPermissions, PermissionId } from './use-user-permissions';
import { Icon } from '@/components/ui/icon';
import { ChartConfig } from '@/components/ui/chart';

// Mock data - will be replaced with actual data fetching
const recentActivityDataMock = [
  { date: 'Seg', logins: 50, newUsers: 5, actions: 120 },
  { date: 'Ter', logins: 75, newUsers: 8, actions: 150 },
  { date: 'Qua', logins: 60, newUsers: 3, actions: 110 },
  { date: 'Qui', logins: 90, newUsers: 12, actions: 200 },
  { date: 'Sex', logins: 110, newUsers: 10, actions: 240 },
  { date: 'Sáb', logins: 40, newUsers: 2, actions: 90 },
  { date: 'Dom', logins: 30, newUsers: 1, actions: 70 },
];

const statsCardsDataMock = {
    activeUsers: {
        value: "1,234",
        label: "Últimos 30 dias",
        percentage: "+20.1% desde o mês passado",
    },
    createdInstances: {
        value: "57",
        label: "Total de instâncias no sistema",
    },
    activeModules: {
        value: "8",
        label: "Módulos habilitados globalmente",
    }
};

const chartConfig: ChartConfig = {
  logins: {
    label: "Logins",
    color: "hsl(var(--primary))",
    icon: () => React.createElement(Icon, { name: "LogIn", className: "h-4 w-4" }),
  },
  newUsers: {
    label: "Novos Usuários",
    color: "hsl(var(--secondary-foreground))",
    icon: () => React.createElement(Icon, { name: "UserPlus", className: "h-4 w-4" }),
  },
  actions: {
    label: "Ações Totais",
    color: "hsl(var(--accent-foreground))",
    icon: () => React.createElement(Icon, { name: "MousePointerClick", className: "h-4 w-4" }),
  },
};

export const useNxStats = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [statsCards, setStatsCards] = React.useState<any>(null);

  const { currentUser, isLoadingPermissions, hasPermission } = useUserPermissions();

  // REVIEW: A permission 'master.stats.view_general' não existe.
  // Usando 'master.instance.view_all' como substituto temporário.
  const canViewStats = hasPermission('master.instance.view_all');

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (canViewStats) {
        setRecentActivity(recentActivityDataMock);
        setStatsCards(statsCardsDataMock);
      }
      
      setIsLoading(false);
    };

    if (!isLoadingPermissions) {
        fetchData();
    }
  }, [canViewStats, isLoadingPermissions]);

  return {
    isLoading: isLoading || isLoadingPermissions,
    canViewStats,
    recentActivity,
    statsCards,
    chartConfig
  };
};
