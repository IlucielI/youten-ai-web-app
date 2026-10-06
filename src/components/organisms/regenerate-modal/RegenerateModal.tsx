import React, { useState } from 'react';
import {
  TemplateKey,
  DefaultTemplateKey,
} from '@/server/constants/template.constant';
import { DomainLimits } from '@/server/constants/recording.constant';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/atoms/dialog';
import { Button } from '@/components/atoms/button';
import { Textarea } from '@/components/atoms/textarea';
import { Label } from '@/components/atoms/label';
import {
  Sparkles,
  AlertTriangle,
  Loader2,
  FileText,
  HeartHandshake,
  UserCheck,
  Cpu,
  TrendingUp,
  Activity,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TemplateOption {
  key: TemplateKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    key: TemplateKey.GENERAL,
    label: 'Ringkasan Umum (Cornell Notes)',
    description: 'Ikhtisar eksekutif, tema inti, poin pembelajaran penting, dan kutipan berkesan.',
    icon: FileText,
  },
  {
    key: TemplateKey.MOM,
    label: 'Notula Rapat (MOM)',
    description: 'Agenda, keputusan penting, matriks dinamika, dan tabel tindak lanjut berprioritas.',
    icon: Activity,
  },
  {
    key: TemplateKey.ONE_ON_ONE,
    label: 'Percakapan 1-on-1',
    description: 'Asesmen wellbeing, pencapaian, blocker, dan komitmen pertumbuhan 2 arah.',
    icon: HeartHandshake,
  },
  {
    key: TemplateKey.INTERVIEW,
    label: 'Wawancara Kandidat',
    description: 'STAR scorecard, rekomendasi perekrutan, dan evaluasi kompetensi.',
    icon: UserCheck,
  },
  {
    key: TemplateKey.TECH_REVIEW,
    label: 'Tinjauan Teknis (RFC / ADR)',
    description: 'Konteks arsitektur, keputusan yang diadopsi, alternatif ditolak, dan asesmen NFR.',
    icon: Cpu,
  },
  {
    key: TemplateKey.SALES_DISCOVERY,
    label: 'Sales Discovery (MEDDPICC)',
    description: 'Kerangka MEDDPICC, pain points, cost of inaction, dan langkah selanjutnya.',
    icon: TrendingUp,
  },
  {
    key: TemplateKey.DAILY_STANDUP,
    label: 'Daily Standup / Scrum',
    description: 'Status sprint, pembaruan kemarin/hari ini/blocker, dan parking lot.',
    icon: Activity,
  },
];

export interface RegenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { template_category: TemplateKey; custom_angle?: string }) => Promise<void> | void;
  currentVersionsCount: number;
  defaultTemplate?: TemplateKey;
  isLoading?: boolean;
}

interface RegenerateFormProps {
  onSubmit: (values: { template_category: TemplateKey; custom_angle?: string }) => Promise<void> | void;
  onCancel: () => void;
  currentVersionsCount: number;
  defaultTemplate: TemplateKey;
  isLoading: boolean;
}

function RegenerateForm({
  onSubmit,
  onCancel,
  currentVersionsCount,
  defaultTemplate,
  isLoading,
}: RegenerateFormProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>(defaultTemplate);
  const [customAngle, setCustomAngle] = useState('');
  const maxVersions = DomainLimits.MAX_SUMMARY_VERSIONS;
  const isCapReached = currentVersionsCount >= maxVersions;
  const isTooLong = customAngle.length > 2000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCapReached || isTooLong || isLoading) return;

    await onSubmit({
      template_category: selectedTemplate,
      custom_angle: customAngle.trim() ? customAngle.trim() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="regenerate-summary-form">
      {/* Cap Warning Banner */}
      {isCapReached ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-3 text-xs text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <span className="font-semibold text-rose-200">Batas Maksimal Tercapai!</span>
            <p className="mt-0.5">
              Rekaman ini sudah mencapai batas kuota {maxVersions} versi ringkasan. Anda tidak dapat membuat versi baru lagi.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-secondary/30 rounded-lg p-2.5 border border-border/40">
          <span>Kapasitas Versi Ringkasan:</span>
          <span className="font-medium text-foreground">
            {currentVersionsCount} dari {maxVersions} versi terpakai
          </span>
        </div>
      )}

      {/* Template Selector */}
      <div className="space-y-2.5">
        <Label className="text-xs font-semibold text-foreground">
          Pilih Kerangka Templat Ringkasan:
        </Label>
        <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
          {TEMPLATE_OPTIONS.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.key;
            const Icon = tmpl.icon;
            return (
              <button
                key={tmpl.key}
                type="button"
                onClick={() => setSelectedTemplate(tmpl.key)}
                disabled={isCapReached}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-2.5 text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border/60 bg-card/40 hover:bg-secondary/40 hover:border-border'
                )}
                data-testid={`template-option-${tmpl.key}`}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
                    isSelected
                      ? 'border-primary/40 bg-primary/20 text-primary'
                      : 'border-border/60 bg-secondary/60 text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {tmpl.label}
                    </span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {tmpl.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Angle / Perspective */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="custom-angle" className="text-xs font-semibold text-foreground">
            Sudut Pandang / Instruksi Khusus (Opsional):
          </Label>
          <span
            className={cn(
              'text-[10px] font-medium',
              isTooLong ? 'text-rose-400 font-bold' : 'text-muted-foreground'
            )}
          >
            {customAngle.length} / 2000 karakter
          </span>
        </div>
        <Textarea
          id="custom-angle"
          value={customAngle}
          onChange={(e) => setCustomAngle(e.target.value)}
          disabled={isCapReached || isLoading}
          placeholder="Contoh: Fokuskan ringkasan pada komitmen anggaran dan mitigasi risiko migrasi cloud..."
          rows={3}
          maxLength={2100}
          className="text-xs resize-none"
          data-testid="custom-angle-input"
        />
        {isTooLong && (
          <p className="text-[11px] text-rose-400 font-medium">
            Instruksi khusus tidak boleh melebihi 2000 karakter.
          </p>
        )}
      </div>

      <DialogFooter className="pt-2 sm:justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
          className="text-xs"
        >
          Batal
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isCapReached || isTooLong || isLoading}
          className="text-xs gap-1.5"
          data-testid="submit-regenerate-btn"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate Ringkasan Baru</span>
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function RegenerateModal({
  open,
  onOpenChange,
  onSubmit,
  currentVersionsCount,
  defaultTemplate = DefaultTemplateKey,
  isLoading = false,
}: RegenerateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/80 bg-background/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Generate Versi Ringkasan Baru
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Pilih kerangka templat dan tentukan sudut pandang khusus untuk menganalisis rekaman ini kembali.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <RegenerateForm
            key={`${open}-${defaultTemplate}`}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            currentVersionsCount={currentVersionsCount}
            defaultTemplate={defaultTemplate}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
