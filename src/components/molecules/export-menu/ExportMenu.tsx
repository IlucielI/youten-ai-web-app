'use client';

import React, { useState } from 'react';
import { ExportFormat } from '@/server/constants/recording.constant';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import {
  Download,
  FileText,
  FileCode,
  FileJson,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from '@/locales';

export interface ExportMenuProps {
  recordingId?: string;
  currentVersion?: number;
  onExport?: (format: ExportFormat) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isPro?: boolean;
  onUpgradePrompt?: () => void;
}

export function ExportMenu({
  recordingId,
  currentVersion,
  onExport,
  disabled = false,
  className,
  open,
  onOpenChange,
  isPro,
  onUpgradePrompt,
}: ExportMenuProps) {
  const { t } = useTranslation();
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  const exportOptions = [
    {
      format: ExportFormat.PDF,
      label: t('recording.exportMenu.formats.pdf.label'),
      description: t('recording.exportMenu.formats.pdf.description'),
      icon: FileText,
      extension: '.pdf',
    },
    {
      format: ExportFormat.MARKDOWN,
      label: t('recording.exportMenu.formats.markdown.label'),
      description: t('recording.exportMenu.formats.markdown.description'),
      icon: FileCode,
      extension: '.md',
    },
    {
      format: ExportFormat.TXT,
      label: t('recording.exportMenu.formats.txt.label'),
      description: t('recording.exportMenu.formats.txt.description'),
      icon: FileText,
      extension: '.txt',
    },
    {
      format: ExportFormat.JSON,
      label: t('recording.exportMenu.formats.json.label'),
      description: t('recording.exportMenu.formats.json.description'),
      icon: FileJson,
      extension: '.json',
    },
  ];

  const handleSelectFormat = async (format: ExportFormat) => {
    if (exportingFormat || disabled) return;

    if (format === ExportFormat.PDF && isPro === false) {
      if (onUpgradePrompt) {
        onUpgradePrompt();
      }
      return;
    }

    try {
      setExportingFormat(format);
      if (onExport) {
        await onExport(format);
      } else if (recordingId) {
        // Direct browser download trigger via BFF route
        const downloadUrl = `/api/recordings/${recordingId}/export?format=${format}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `recording-${recordingId}.${format === ExportFormat.MARKDOWN ? 'md' : format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setExportingFormat(null);
    }
  };

  const isBusy = exportingFormat !== null;

  return (
    <div className={cn('inline-block', className)}>
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isBusy}
            data-testid="export-menu-trigger"
            className="gap-2 text-xs font-medium"
          >
            {isBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : (
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span>
              {isBusy
                ? t('recording.exportMenu.exportingLabel')
                : t('recording.exportMenu.buttonLabel')}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 p-1.5 space-y-0.5 bg-popover text-popover-foreground shadow-2xl border border-border z-50">
          <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground px-2 py-1">
            {currentVersion
              ? t('recording.exportMenu.selectFormatVersionHeader', { version: currentVersion })
              : t('recording.exportMenu.selectFormatHeader')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {exportOptions.map((item) => {
            const IconComponent = item.icon;
            const isCurrentExporting = exportingFormat === item.format;

            return (
              <DropdownMenuItem
                key={item.format}
                data-testid={`export-option-${item.format}`}
                disabled={isBusy}
                onClick={() => handleSelectFormat(item.format)}
                className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors focus:bg-accent"
              >
                <div className="h-7 w-7 rounded-md bg-secondary/80 flex items-center justify-center text-foreground shrink-0 mt-0.5">
                  {isCurrentExporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : (
                    <IconComponent className="h-3.5 w-3.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                      {item.extension}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
