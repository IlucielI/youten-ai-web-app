'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation, Locale } from '@/locales';

export interface LanguageSwitcherProps {
  className?: string;
  variant?: 'pill' | 'compact';
  size?: 'sm' | 'md';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className,
  variant = 'pill',
  size = 'sm',
}) => {
  const { locale, setLocale } = useTranslation();

  const handleSelectLocale = (nextLocale: Locale) => {
    if (nextLocale !== locale) {
      setLocale(nextLocale);
    }
  };

  const isSmall = size === 'sm';

  if (variant === 'compact') {
    return (
      <button
        type="button"
        data-testid="language-switcher-compact"
        aria-label="Switch language"
        onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 hover:bg-muted/60 transition-all font-semibold cursor-pointer active:scale-95',
          isSmall ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
          className
        )}
      >
        <Globe className={cn('text-muted-foreground', isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        <span className="uppercase text-foreground tracking-wider font-bold">
          {locale}
        </span>
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Language selection"
      data-testid="language-switcher"
      className={cn(
        'inline-flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5 select-none transition-colors',
        className
      )}
    >
      <button
        type="button"
        data-testid="lang-btn-id"
        aria-pressed={locale === 'id'}
        onClick={() => handleSelectLocale('id')}
        className={cn(
          'rounded-md font-bold transition-all cursor-pointer text-center',
          isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
          locale === 'id'
            ? 'bg-background text-primary shadow-xs font-extrabold'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        ID
      </button>
      <button
        type="button"
        data-testid="lang-btn-en"
        aria-pressed={locale === 'en'}
        onClick={() => handleSelectLocale('en')}
        className={cn(
          'rounded-md font-bold transition-all cursor-pointer text-center',
          isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
          locale === 'en'
            ? 'bg-background text-primary shadow-xs font-extrabold'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        EN
      </button>
    </div>
  );
};
