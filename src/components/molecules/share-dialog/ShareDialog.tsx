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
} from 'lucide-react';

export interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isShared: boolean;
  shareToken?: string | null;
  onToggleShare: (enable: boolean) => Promise<void> | void;
  className?: string;
}

export function ShareDialog({
  isOpen,
  onClose,
  isShared,
  shareToken,
  onToggleShare,
  className,
}: ShareDialogProps) {
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
    if (isToggling) return;
    setIsToggling(true);
    setErrorMessage(null);

    try {
      await onToggleShare(checked);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Gagal memperbarui pengaturan tautan publik.';
      setErrorMessage(msg);
    } finally {
      setIsToggling(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch {
      setErrorMessage('Gagal menyalin tautan ke papan klip.');
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
              Bagikan Rekaman
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Kelola akses publik untuk melihat transkrip, ringkasan, dan pemutaran audio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Toggle Section */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-3.5">
            <div className="space-y-0.5 pr-4">
              <Label
                htmlFor="share-toggle"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer"
              >
                {isShared ? (
                  <Globe className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                Tautan Publik (Read-Only)
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {isShared
                  ? 'Siapa saja dengan tautan ini dapat melihat rekaman'
                  : 'Tautan saat ini tidak aktif dan terproteksi'}
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
                disabled={isToggling}
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
                  Tautan Akses
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
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Salin</span>
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
                  <span className="font-semibold">Izin Terbatas:</span> Pengunjung tautan
                  ini hanya dapat membaca transkrip, ringkasan, dan mendengarkan audio.
                  Aksi seperti mengganti nama pembicara, hapus komentar, atau tanya AI dinonaktifkan.
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
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
