// src/components/ui/back-button.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
}

export const BackButton = ({ className, href, ...props }: BackButtonProps) => {
  const router = useRouter();
  const t = useTranslations('common');

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn('h-auto px-2 py-1 text-xs text-muted-foreground hover:text-primary', className)} 
      aria-label={t('goBackLabel')}
      {...props}
    >
      <ChevronLeft className="mr-1 h-4 w-4" />
      {t('back')}
    </Button>
  );
};

BackButton.displayName = 'BackButton';
