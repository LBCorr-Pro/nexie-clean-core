import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc, Unsubscribe } from 'firebase/firestore';
import { useToast } from '@/hooks/nx-use-toast';
import { refs } from '@/lib/firestore-refs';
import { useUserPermissions, availablePermissions, PermissionId } from '@/hooks/use-user-permissions';
import { useMenuData } from '@/hooks/use-menu-data'; // Atualizado
import { useInstanceActingContext } from '@/contexts/instance-acting-context';
import { useTranslations } from 'next-intl';

// Schema de validação com traduções
const getArticleFormSchema = (t: Function) => z.object({
  title: z.string().min(3, t('validation.titleRequired')),
  slug: z.string().min(3, t('validation.slugRequired')).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('validation.slugPattern')),
  content: z.string().optional(),
  order: z.coerce.number().default(0),
  parentSlug: z.string().optional(),
  requiredPermission: z.string().optional(),
  requiredModule: z.string().optional(),
});

type ArticleFormData = z.infer<ReturnType<typeof getArticleFormSchema>>;

interface ManualArticle extends ArticleFormData {
  id: string;
}

export function useNxManageManual() {
  const t = useTranslations('manageManual');
  const { toast } = useToast();
  const { hasPermission, isLoadingPermissions } = useUserPermissions();
  const { allManagedModules } = useMenuData(); // Atualizado
  const { actingAsInstanceId, subInstanceId } = useInstanceActingContext();

  const [articles, setArticles] = useState<ManualArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ManualArticle | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<ManualArticle | null>(null);

  // CORRIGIDO: Apenas 'master.manual.manage' é uma permissão válida.
  // O hook hasPermission é responsável por avaliar o contexto (master/instance/sub-instance).
  const canManage = useMemo(() => {
    return hasPermission('master.manual.manage');
  }, [hasPermission]);

  const ArticleFormSchema = getArticleFormSchema(t);
  const form = useForm<ArticleFormData>({
    resolver: zodResolver(ArticleFormSchema),
    defaultValues: { title: '', slug: '', content: '', order: 0, parentSlug: '', requiredPermission: '', requiredModule: '' },
  });

  const collectionRef = useMemo(() => {
    if (actingAsInstanceId && subInstanceId) {
      return refs.subinstance.manualArticles(actingAsInstanceId, subInstanceId);
    }
    if (actingAsInstanceId) {
      return refs.instance.manualArticles(actingAsInstanceId);
    }
    return refs.master.manualArticles();
  }, [actingAsInstanceId, subInstanceId]);

  useEffect(() => {
    if (!canManage) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const q = query(collectionRef, orderBy("order"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedArticles = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() || {}) } as ManualArticle));
      setArticles(fetchedArticles);
      setIsLoading(false);
    }, (error) => {
      toast({ title: t('toasts.loadError'), description: error.message, variant: "destructive" });
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [toast, canManage, collectionRef, t]);

  const generateSlug = (title: string) => title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'title' && !form.formState.dirtyFields.slug) {
        form.setValue('slug', generateSlug(value.title || ''));
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleOpenDialog = (article?: ManualArticle) => {
    if (article) {
      setEditingArticle(article);
      form.reset(article);
    } else {
      setEditingArticle(null);
      form.reset({ title: '', slug: '', content: '', order: articles.length * 10, parentSlug: '', requiredPermission: '', requiredModule: '' });
    }
    setShowDialog(true);
  };

  const onSubmit = async (data: ArticleFormData) => {
    setIsSaving(true);
    const docId = data.slug;
    const docRef = doc(collectionRef, docId);

    try {
      if (!editingArticle) {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          form.setError("slug", { type: "manual", message: t('toasts.slugInUse') });
          setIsSaving(false);
          return;
        }
      }
      
      const dataToSave = { ...data, updatedAt: serverTimestamp() };
      if (!editingArticle) {
        (dataToSave as any).createdAt = serverTimestamp();
      }

      await setDoc(docRef, dataToSave, { merge: true });
      toast({ title: t('toasts.saveSuccess') });
      setShowDialog(false);
    } catch (error) {
      toast({ title: t('toasts.saveError'), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    setIsSaving(true);
    try {
      await deleteDoc(doc(collectionRef, articleToDelete.id));
      toast({ title: t('toasts.deleteSuccess') });
    } catch (error) {
      toast({ title: t('toasts.deleteError'), variant: "destructive" });
    } finally {
      setIsSaving(false);
      setArticleToDelete(null);
    }
  };

  return {
    form, 
    articles, 
    isLoading: isLoading || isLoadingPermissions,
    isSaving, 
    showDialog, setShowDialog,
    editingArticle,
    articleToDelete, setArticleToDelete,
    canManage,
    handleOpenDialog, 
    onSubmit, 
    handleDeleteArticle,
    allManagedModules,
    availablePermissions,
  };
}
