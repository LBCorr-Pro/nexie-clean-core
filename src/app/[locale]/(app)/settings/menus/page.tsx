// src/app/[locale]/(app)/settings/menus/page.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@/components/ui/icon';
import { BackButton } from "@/components/ui/back-button";
import { useTranslations } from 'next-intl';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { AccessDenied } from '@/components/ui/access-denied';
import { useParams } from 'next/navigation'; // Importa o useParams

interface SubSectionProps {
  title: string;
  description: string;
  href: string;
  linkText: string;
  icon: string; 
}

const SubSectionCard: React.FC<SubSectionProps> = ({ title, description, href, linkText, icon }) => {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Icon name={icon as any} className="mr-3 h-6 w-6 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter>
        <Link href={href}>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            {linkText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default function MenusOverviewPage() {
  const t = useTranslations('menus');
  const { hasPermission } = useUserPermissions();
  const params = useParams(); // Obtém os parâmetros da URL
  const locale = params.locale as string; // Extrai o locale

  if (!hasPermission('master.settings.menu.edit')) {
      return <AccessDenied />;
  }

  // CORREÇÃO: Adiciona o prefixo do locale a todos os links
  const sections: SubSectionProps[] = [
    {
      title: t('presets.title'),
      description: t('presets.description'),
      href: `/${locale}/settings/menus/presets`,
      linkText: t('presets.link'),
      icon: "MenuSquare",
    },
    {
      title: t('groups.title'),
      description: t('groups.description'),
      href: `/${locale}/settings/menus/groups`,
      linkText: t('groups.link'),
      icon: "LayoutGrid",
    },
    {
      title: t('items.title'),
      description: t('items.description'),
      href: `/${locale}/settings/menus/items`,
      linkText: t('items.link'),
      icon: "ListChecks",
    },
    {
      title: t('bottomBar.title'),
      description: t('bottomBar.description'),
      href: `/${locale}/settings/menus/bottom-bar`,
      linkText: t('bottomBar.link'),
      icon: "PanelBottom",
    }
  ];

  return (
    <Card>
        <CardHeader className="relative">
            <BackButton className="absolute right-6 top-3"/>
            <div className="pt-2"> 
                <CardTitle className="section-title !border-none !pb-0">
                    <Icon name="Menu" className="section-title-icon"/>
                    {t('title')}
                </CardTitle>
                <CardDescription>
                {t('description')}
                </CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <p className="mb-6 text-sm">
                {t('subheading')}
            </p>
            <Separator className="mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section) => (
                <SubSectionCard
                    key={section.title}
                    title={section.title}
                    description={section.description}
                    href={section.href}
                    linkText={section.linkText}
                    icon={section.icon}
                />
                ))}
            </div>
        </CardContent>
    </Card>
  );
}
