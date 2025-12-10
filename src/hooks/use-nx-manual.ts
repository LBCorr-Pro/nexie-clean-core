
import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, Unsubscribe, DocumentData, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';
import { refs } from '@/lib/firestore-refs';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useInstanceActingContext } from '@/contexts/instance-acting-context';

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

export function useNxManual() {
  const [articles, setArticles] = useState<ManualArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hasPermission, activeModuleStatuses } = useUserPermissions();

  // O manual é um recurso global, então a lógica de contexto é desnecessária.
  useEffect(() => {
    const masterQuery = query(refs.master.manualArticles(), orderBy('order'));

    const unsubscribe: Unsubscribe = onSnapshot(masterQuery, (snapshot: QuerySnapshot<DocumentData>) => {
        const masterArticles = snapshot.docs.map((doc: DocumentSnapshot<DocumentData>) => ({ 
            id: doc.id, 
            ...(doc.data() as object) 
        } as ManualArticle));

        const filteredArticles = masterArticles.filter(article => {
            const hasPerm = !article.requiredPermission || hasPermission(article.requiredPermission as any);
            const moduleActive = !article.requiredModule || activeModuleStatuses.get(article.requiredModule);
            return hasPerm && moduleActive;
        });

        setArticles(filteredArticles.sort((a, b) => a.order - b.order));
        setIsLoading(false);
    });

    return () => unsubscribe();

  }, [hasPermission, activeModuleStatuses]);

  const articleTree = useMemo(() => {
    const tree: ManualArticle[] = [];
    const map = new Map<string, ManualArticle>();

    articles.forEach(article => {
      map.set(article.id, { ...article, subItems: [] });
    });

    articles.forEach(article => {
      if (article.parentSlug && map.has(article.parentSlug)) {
        const parent = map.get(article.parentSlug)!;
        if (parent.subItems) { // Garantir que subItems existe
          parent.subItems.push(map.get(article.id)!);
        }
      } else {
        tree.push(map.get(article.id)!);
      }
    });

    return tree;
  }, [articles]);

  return { articleTree, articles, isLoading };
}
