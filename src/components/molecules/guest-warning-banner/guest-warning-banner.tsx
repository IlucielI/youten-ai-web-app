'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { useTranslation } from '@/locales';
import { cn } from '@/lib/utils';

export interface GuestWarningBannerProps {
  recordingId: string;
  isLoggedIn: boolean;
  isClaiming?: boolean;
  onClaim?: () => void;
  className?: string;
}

export const GuestWarningBanner: React.FC<GuestWarningBannerProps> = ({
  recordingId,
  isLoggedIn,
  isClaiming = false,
  onClaim,
  className,
}) => {
  const { t } = useTranslation();

  return (
    <div
      data-testid="guest-warning-banner"
      className={cn(
        'bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>{t('recording.guestBanner.title')}</strong>{' '}
            {t('recording.guestBanner.description')}
          </span>
        </div>
        {isLoggedIn ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isClaiming}
            onClick={onClaim}
            data-testid="claim-account-btn"
            className="text-xs h-7 px-3 shrink-0 border-amber-500/30 hover:bg-amber-500/15"
          >
            {isClaiming
              ? t('recording.guestBanner.claimingButton')
              : t('recording.guestBanner.claimButton')}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            asChild
            data-testid="claim-account-btn"
            className="text-xs h-7 px-3 shrink-0 border-amber-500/30 hover:bg-amber-500/15"
          >
            <Link href={`/login?claim=${recordingId}`}>
              {t('recording.guestBanner.claimButton')}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

