'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { YoutenLogo } from '@/components/atoms/youten-logo';
import { useTranslation } from '@/locales';

export interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({
  className,
}) => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      data-testid="app-footer"
      className={cn(
        'w-full border-t border-border/60 bg-background/80 backdrop-blur-md text-xs text-muted-foreground transition-colors',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-opacity hover:opacity-90"
            data-testid="footer-brand-link"
          >
            <YoutenLogo size="sm" className="group-hover:scale-105 transition-transform" />
            <span className="font-extrabold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
              Youten AI
            </span>
          </Link>
          <span className="hidden sm:inline text-border">•</span>
          <p className="text-muted-foreground/80 text-[11px] sm:text-xs">
            {t('footer.tagline')}
          </p>
        </div>

        {/* Copyright */}
        <div className="flex items-center justify-center sm:justify-end">
          <p className="text-[11px] sm:text-xs text-muted-foreground/70">
            {t('footer.copyright', { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
};
