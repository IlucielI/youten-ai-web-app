'use client';

import React, { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { useTranslation } from '@/locales';

export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

const emptySubscribe = () => () => {};

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  size = 'sm',
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const { locale } = useTranslation();

  const isSmall = size === 'sm';

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={cn(
          'inline-flex items-center justify-center rounded-lg border border-border/70 bg-muted/40 p-1.5 text-muted-foreground select-none transition-colors opacity-70',
          isSmall ? 'h-8 w-8' : 'h-9 w-9',
          className
        )}
      >
        <Sun className={isSmall ? 'h-4 w-4' : 'h-4.5 w-4.5'} />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="theme-toggle-trigger"
          aria-label={locale === 'en' ? 'Select theme' : 'Pilih tema'}
          className={cn(
            'inline-flex items-center justify-center rounded-lg border border-border/70 bg-muted/40 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 select-none transition-all cursor-pointer active:scale-95',
            isSmall ? 'h-8 w-8' : 'h-9 w-9',
            className
          )}
        >
          {isDark ? (
            <Moon className={cn('text-primary transition-transform', isSmall ? 'h-4 w-4' : 'h-4.5 w-4.5')} />
          ) : (
            <Sun className={cn('text-amber-500 transition-transform', isSmall ? 'h-4 w-4' : 'h-4.5 w-4.5')} />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 p-1 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
        <DropdownMenuItem
          data-testid="theme-light-btn"
          onClick={() => setTheme('light')}
          className={cn(
            'flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors',
            theme === 'light' ? 'bg-primary/10 text-primary font-bold' : 'text-foreground hover:bg-muted'
          )}
        >
          <Sun className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span>{locale === 'en' ? 'Light' : 'Terang'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="theme-dark-btn"
          onClick={() => setTheme('dark')}
          className={cn(
            'flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors',
            theme === 'dark' ? 'bg-primary/10 text-primary font-bold' : 'text-foreground hover:bg-muted'
          )}
        >
          <Moon className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{locale === 'en' ? 'Dark' : 'Gelap'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="theme-system-btn"
          onClick={() => setTheme('system')}
          className={cn(
            'flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors',
            theme === 'system' ? 'bg-primary/10 text-primary font-bold' : 'text-foreground hover:bg-muted'
          )}
        >
          <Monitor className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>{locale === 'en' ? 'System' : 'Sistem'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
