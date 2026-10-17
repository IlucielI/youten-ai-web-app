'use client';

import React, { useState, useMemo } from 'react';
import { TemplateKey, DefaultTemplateKey } from '@/server/constants/template.constant';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { SearchableSelect, SearchableSelectOption } from '@/components/molecules/searchable-select';
import {
  Link as LinkIcon,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTemplates } from '@/hooks';
import { useTranslation } from '@/locales';

export interface UrlImportFormProps {
  onSubmit: (values: {
    url: string;
    title?: string;
    templateCategory: TemplateKey;
    language?: string;
  }) => Promise<void> | void;
  isLoading?: boolean;
  maxSizeMB?: number;
  className?: string;
}

export function isValidMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const normalizedHostname = hostname.replace(/^\[|\]$/g, '');
    const isPrivateHost =
      normalizedHostname === 'localhost' ||
      /^127\./.test(normalizedHostname) ||
      /^10\./.test(normalizedHostname) ||
      /^192\.168\./.test(normalizedHostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(normalizedHostname) ||
      /^::1$/.test(normalizedHostname) ||
      /^fc00:/i.test(normalizedHostname) ||
      /^fd00:/i.test(normalizedHostname) ||
      /^fe80:/i.test(normalizedHostname) ||
      /^::ffff:(?:127\.|10\.|192\.168\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.)/i.test(normalizedHostname);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && !isPrivateHost;
  } catch {
    return false;
  }
}

export function UrlImportForm({
  onSubmit,
  isLoading = false,
  maxSizeMB = 500,
  className,
}: UrlImportFormProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [templateCategory, setTemplateCategory] = useState<TemplateKey>(DefaultTemplateKey);
  const [language, setLanguage] = useState('id');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { templates } = useTemplates();

  const templateOptions: SearchableSelectOption[] = useMemo(
    () =>
      templates.map((tmpl) => ({
        value: tmpl.key,
        label: tmpl.label,
        description: tmpl.description,
        icon: tmpl.icon,
      })),
    [templates]
  );

  const languageOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: 'id', label: t('ingestion.url.languageId'), description: 'Bahasa Indonesia' },
      { value: 'en', label: t('ingestion.url.languageEn'), description: 'English (Global)' },
      { value: 'auto', label: t('ingestion.url.languageAuto'), description: 'Deteksi Otomatis' },
    ],
    [t]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setValidationError(t('ingestion.url.emptyUrl'));
      return;
    }

    if (!isValidMediaUrl(trimmedUrl)) {
      setValidationError(t('ingestion.url.invalidUrl'));
      return;
    }

    try {
      await onSubmit({
        url: trimmedUrl,
        title: title.trim() || undefined,
        templateCategory,
        language,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('ingestion.url.importFailed');
      setValidationError(msg);
    }
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
        <span>{t('ingestion.url.badge')}</span>
      </div>

      {/* URL Input */}
      <div className="space-y-1.5">
        <Label htmlFor="media-url" className="text-xs font-semibold text-foreground">
          {t('ingestion.url.urlLabel')}
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
          placeholder={t('ingestion.url.urlPlaceholder')}
          className="text-xs"
          data-testid="media-url-input"
        />
      </div>

      {/* Title (Optional) */}
      <div className="space-y-1.5">
        <Label htmlFor="import-title" className="text-xs font-semibold text-foreground">
          {t('ingestion.url.titleLabel')}
        </Label>
        <Input
          id="import-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
          placeholder={t('ingestion.url.titlePlaceholder')}
          className="text-xs"
          data-testid="import-title-input"
        />
      </div>

      {/* Template & Language Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="url-template-select" className="text-xs font-semibold text-foreground">
            {t('ingestion.url.templateLabel')}
          </Label>
          <SearchableSelect
            id="url-template-select"
            data-testid="url-template-select"
            value={templateCategory}
            onValueChange={(val) => setTemplateCategory(val as TemplateKey)}
            options={templateOptions}
            disabled={isLoading}
            placeholder={t('ingestion.url.templateLabel')}
            searchPlaceholder="Cari template..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="url-language-select" className="text-xs font-semibold text-foreground">
            {t('ingestion.url.languageLabel')}
          </Label>
          <SearchableSelect
            id="url-language-select"
            data-testid="url-language-select"
            value={language}
            onValueChange={setLanguage}
            options={languageOptions}
            disabled={isLoading}
            placeholder={t('ingestion.url.languageLabel')}
            searchPlaceholder="Cari bahasa..."
          />
        </div>
      </div>

      {/* Anti-SSRF Defense Banner & Max Size Notice */}
      <div className="flex items-start gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
        <div className="space-y-1">
          <p className="leading-relaxed">
            <span className="font-semibold text-foreground">{t('ingestion.url.securityNoticeTitle')}</span>{' '}
            {t('ingestion.url.securityNoticeDesc')}
          </p>
          <p className="font-medium text-foreground/80">
            {t('ingestion.url.maxSizeHint', { size: maxSizeMB })}
          </p>
        </div>
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
            <span>{t('ingestion.url.downloading')}</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>{t('ingestion.url.submit')}</span>
          </>
        )}
      </Button>
    </form>
  );
}
