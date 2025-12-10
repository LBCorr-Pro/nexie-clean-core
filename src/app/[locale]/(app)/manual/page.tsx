// src/app/[locale]/(app)/manual/page.tsx
"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, BookOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNxManual } from '@/hooks/use-nx-manual';
import { Skeleton } from '@/components/ui/skeleton';

interface ManualArticle {
  id: string;
  title: string;
  content?: string;
  order: number;
  parentSlug?: string;
  requiredPermission?: string;
  requiredModule?: string;
  subItems?: ManualArticle[];
}

export default function ManualPage() {
  const t = useTranslations('manual');
  const { articleTree, articles, isLoading } = useNxManual();
  const [activeArticle, setActiveArticle] = useState<ManualArticle | null>(null);

  // Efeito para definir o primeiro artigo como ativo quando os dados carregam
  React.useEffect(() => {
    if (!isLoading && articles.length > 0 && !activeArticle) {
      const firstArticle = articles.find(a => !a.parentSlug);
      setActiveArticle(firstArticle || articles[0]);
    }
  }, [isLoading, articles, activeArticle]);

  const renderArticleTree = (nodes: ManualArticle[], level = 0) => {
    return (
      <ul className={cn(level > 0 && "pl-4")}>
        {nodes.map(node => (
          <li key={node.id}>
            <button
              onClick={() => setActiveArticle(node)}
              className={cn(
                "flex items-center w-full text-left p-2 rounded-md text-sm hover:bg-muted",
                activeArticle?.id === node.id && "bg-muted font-semibold"
              )}
            >
              <ChevronRight className={cn("h-4 w-4 mr-2 transition-transform", node.subItems && node.subItems.length > 0 && "rotate-90")}/>
              {node.title}
            </button>
            {node.subItems && node.subItems.length > 0 && renderArticleTree(node.subItems, level + 1)}
          </li>
        ))}
      </ul>
    );
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
        <Card className="md:col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>{t('topicsCardTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {articleTree.length > 0 ? renderArticleTree(articleTree) : <p className="text-muted-foreground text-sm">{t('noTopics')}</p>}
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center"><BookOpen className="mr-2"/>
            {activeArticle ? activeArticle.title : t('initialStateTitle')}
          </CardTitle>
          <CardDescription>
            {activeArticle ? t('articleDescription', { articleTitle: activeArticle.title }) : t('initialStateDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeArticle ? (
            <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: activeArticle.content || '' }} />
          ) : (
            <p>{t('initialStateDescription')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
