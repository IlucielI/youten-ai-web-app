'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/atoms/dialog';
import { Switch } from '@/components/atoms/switch';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import {
  Share2,
  Copy,
  Check,
  ShieldAlert,
  Loader2,
  Globe,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/locales';

export interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isShared: boolean;
  shareToken?: string | null;
  onToggleShare: (enable: boolean) => Promise<void> | void;
  isGuest?: boolean;
  onClaim?: () => void;
  claimUrl?: string;
  isClaiming?: boolean;
  className?: string;
}

export function ShareDialog({
  isOpen,
  onClose,
  isShared,
  shareToken,
  onToggleShare,
  isGuest = false,
  onClaim,
  claimUrl,
  isClaiming = false,
  className,
}: ShareDialogProps) {
  const { t } = useTranslation();
  const [isToggling, setIsToggling] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Derive full URL
  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://youten.ai';
  const shareUrl = shareToken ? `${origin}/share/${shareToken}` : '';

  const handleToggle = async (checked: boolean) => {
    if (isGuest || isToggling) return;
    setIsToggling(true);
    setErrorMessage(null);

    try {
      await onToggleShare(checked);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.trim()
          ? err.message
          : t('recording.shareDialog.toggleError');
      setErrorMessage(msg);
    } finally {
      setIsToggling(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        setErrorMessage(t('recording.shareDialog.clipboardUnsupported'));
      }
    } catch {
      setErrorMessage(t('recording.shareDialog.copyError'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-testid="share-dialog"
        className={cn('sm:max-w-md', className)}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Share2 className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-semibold">
              {t('recording.shareDialog.title')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {t('recording.shareDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Guest Warning Notice */}
          {isGuest && (
            <div
              data-testid="guest-share-banner"
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-900 dark:text-amber-200 space-y-2.5"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold leading-tight">
                    {t('recording.shareDialog.guestNoticeTitle')}
                  </h4>
                  <p className="text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-300/90">
                    {t('recording.shareDialog.guestNoticeDesc')}
                  </p>
                </div>
              </div>

              {(onClaim || claimUrl) && (
                <div className="pl-6.5">
                  {onClaim ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isClaiming}
                      onClick={onClaim}
                      data-testid="guest-claim-btn"
                      className="h-7 text-xs px-3 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-amber-950 font-medium transition-colors"
                    >
                      {isClaiming && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                      {t('recording.shareDialog.guestClaimButton')}
                    </Button>
                  ) : claimUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      asChild
                      data-testid="guest-claim-btn"
                      className="h-7 text-xs px-3 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-amber-950 font-medium transition-colors"
                    >
                      <Link href={claimUrl}>{t('recording.shareDialog.guestClaimButton')}</Link>
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Toggle Section */}
          <div
            className={cn(
              'flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-3.5 transition-colors',
              isGuest && 'opacity-70 bg-muted/30 cursor-not-allowed'
            )}
          >
            <div className="space-y-0.5 pr-4">
              <Label
                htmlFor="share-toggle"
                className={cn(
                  'text-xs font-semibold flex items-center gap-1.5',
                  isGuest ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground cursor-pointer'
                )}
              >
                {isShared ? (
                  <Globe className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {t('recording.shareDialog.publicLinkLabel')}
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {isGuest
                  ? t('recording.shareDialog.guestToggleDisabledHelp')
                  : isShared
                    ? t('recording.shareDialog.publicLinkActiveDesc')
                    : t('recording.shareDialog.publicLinkInactiveDesc')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isToggling && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
              <Switch
                id="share-toggle"
                data-testid="share-toggle-switch"
                checked={isShared}
                onCheckedChange={handleToggle}
                disabled={isGuest || isToggling}
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              data-testid="share-error-message"
              className="text-[11px] text-destructive bg-destructive/10 rounded-md p-2"
            >
              {errorMessage}
            </div>
          )}

          {/* Share URL Input & Copy Button (When Shared) */}
          {isShared && shareToken ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  {t('recording.shareDialog.accessLinkLabel')}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={shareUrl}
                    data-testid="share-url-input"
                    className="h-8 text-xs font-mono bg-muted/50 select-all"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={isCopied ? 'default' : 'secondary'}
                    onClick={handleCopyLink}
                    data-testid="copy-share-url-btn"
                    className="h-8 px-3 text-xs gap-1.5 shrink-0 transition-all"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                        <span>{t('recording.shareDialog.copiedButton')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{t('recording.shareDialog.copyButton')}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Read-Only Notice Warning */}
              <div
                data-testid="read-only-banner"
                className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400"
              >
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-semibold">{t('recording.shareDialog.readOnlyTitle')}</span>{' '}
                  {t('recording.shareDialog.readOnlyDesc')}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            data-testid="close-share-dialog-btn"
            className="text-xs h-8"
          >
            {t('common.actions.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
