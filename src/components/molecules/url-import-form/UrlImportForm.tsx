'use client';

import React, { useState } from 'react';
import { TemplateKey, DefaultTemplateKey } from '@/server/constants/template.constant';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import {
  Link as LinkIcon,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UrlImportFormProps {
  onSubmit: (values: {
    url: string;
    title?: string;
    templateCategory: TemplateKey;
    language?: string;
  }) => Promise<void> | void;
  isLoading?: boolean;
  className?: string;
}

export function isValidMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const isPrivateHost =
      hostname === 'localhost' ||
      hostname === '::1' ||
      /^127\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && !isPrivateHost;
  } catch {
    return false;
  }
}

export function UrlImportForm({
  onSubmit,
  isLoading = false,
  className,
}: UrlImportFormProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [templateCategory, setTemplateCategory] = useState<TemplateKey>(DefaultTemplateKey);
  const [language, setLanguage] = useState('id');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setValidationError('Silakan masukkan tautan media.');
      return;
    }

    if (!isValidMediaUrl(trimmedUrl)) {
      setValidationError('Tautan harus berupa URL web yang valid dengan protokol http:// atau https://.');
      return;
    }

    await onSubmit({
      url: trimmedUrl,
      title: title.trim() || undefined,
      templateCategory,
      language,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="url-import-form"
      className={cn(
        'w-full max-w-xl mx-auto rounded-2xl border border-border/80 bg-card/60 p-6 backdrop-blur-md shadow-md space-y-4 text-foreground',
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
        <LinkIcon className="h-4 w-4" />
        <span>Impor dari Tautan Web (Direct Audio/Video Link)</span>
      </div>

      {/* URL Input */}
      <div className="space-y-1.5">
        <Label htmlFor="media-url" className="text-xs font-semibold text-foreground">
          URL File Media:
        </Label>
        <Input
          id="media-url"
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (validationError) setValidationError(null);
          }}
          disabled={isLoading}
          placeholder="https://example.com/audio/meeting-record.mp3"
          className="text-xs"
          data-testid="media-url-input"
        />
      </div>

      {/* Title (Optional) */}
      <div className="space-y-1.5">
        <Label htmlFor="import-title" className="text-xs font-semibold text-foreground">
          Judul Rekaman (Opsional):
        </Label>
        <Input
          id="import-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
          placeholder="Contoh: Rapat Koordinasi Tim Q4"
          className="text-xs"
          data-testid="import-title-input"
        />
      </div>

      {/* Template & Language Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="url-template-select" className="text-xs font-semibold text-foreground">
            Kerangka Ringkasan:
          </Label>
          <select
            id="url-template-select"
            value={templateCategory}
            onChange={(e) => setTemplateCategory(e.target.value as TemplateKey)}
            disabled={isLoading}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            data-testid="url-template-select"
          >
            <option value={TemplateKey.GENERAL} className="bg-popover text-foreground">
              Ringkasan Umum (Cornell)
            </option>
            <option value={TemplateKey.MOM} className="bg-popover text-foreground">
              Notula Rapat (MOM)
            </option>
            <option value={TemplateKey.ONE_ON_ONE} className="bg-popover text-foreground">
              Percakapan 1-on-1
            </option>
            <option value={TemplateKey.INTERVIEW} className="bg-popover text-foreground">
              Wawancara Kandidat
            </option>
            <option value={TemplateKey.TECH_REVIEW} className="bg-popover text-foreground">
              Tinjauan Teknis (RFC)
            </option>
            <option value={TemplateKey.SALES_DISCOVERY} className="bg-popover text-foreground">
              Sales Discovery
            </option>
            <option value={TemplateKey.DAILY_STANDUP} className="bg-popover text-foreground">
              Daily Standup
            </option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="url-language-select" className="text-xs font-semibold text-foreground">
            Bahasa Rekaman:
          </Label>
          <select
            id="url-language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            data-testid="url-language-select"
          >
            <option value="id" className="bg-popover text-foreground">
              Bahasa Indonesia (Utama)
            </option>
            <option value="en" className="bg-popover text-foreground">
              English
            </option>
            <option value="auto" className="bg-popover text-foreground">
              Deteksi Otomatis (Auto)
            </option>
          </select>
        </div>
      </div>

      {/* Anti-SSRF Defense Banner */}
      <div className="flex items-start gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-semibold text-foreground">Perhatian Keamanan:</span> Tautan harus merujuk ke file audio/video langsung yang dapat diakses publik. Tautan internal (localhost/IP privat) akan diblokir otomatis.
        </p>
      </div>

      {/* Error Alert */}
      {validationError && (
        <div
          data-testid="url-error-alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 flex items-start gap-2 text-xs text-rose-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || !url.trim()}
        className="w-full text-xs gap-2 pt-2"
        data-testid="submit-url-btn"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Mengunduh & Memproses...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Impor & Transkripsikan Media</span>
          </>
        )}
      </Button>
    </form>
  );
}
