'use client';

import React from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/locales';
import { useUiStore } from '@/stores/ui.store';

export interface FeedbackButtonProps {
  className?: string;
  onClick?: () => void;
  variant?: 'floating' | 'inline';
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({
  className,
  onClick,
  variant = 'floating',
}) => {
  const { t } = useTranslation();
  const openModal = useUiStore((s) => s.openModal);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      openModal('feedback');
    }
  };

  const isFloating = variant === 'floating';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t('feedback.triggerAriaLabel')}
      data-testid="feedback-trigger-btn"
      className={cn(
        'group inline-flex items-center gap-2 rounded-full font-semibold text-xs transition-all duration-200 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isFloating
          ? 'fixed bottom-6 right-6 z-40 px-3.5 py-2.5 bg-primary/95 hover:bg-primary text-primary-foreground shadow-lg shadow-primary/25 backdrop-blur-md border border-primary/40 hover:scale-105 active:scale-95'
          : 'px-3 py-1.5 bg-secondary/80 hover:bg-secondary text-secondary-foreground border border-border/60 hover:border-border',
        className
      )}
    >
      <MessageSquarePlus className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      <span className={cn(isFloating && 'hidden sm:inline')}>{t('feedback.buttonLabel')}</span>
    </button>
  );
};
