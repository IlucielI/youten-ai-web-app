import { DomainLimits } from '@/server/constants/recording.constant';
import { Button } from '@/components/atoms/button';
import { Check, Sparkles, History, Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SummaryVersionItem {
  id: string;
  version: number;
  template_category: string;
  is_active: boolean;
  created_at?: string;
}

export interface SummaryVersionTabsProps {
  versions: SummaryVersionItem[];
  selectedVersionId: string;
  onSelectVersion: (versionId: string) => void;
  onActivateVersion?: (versionId: string) => void;
  onOpenRegenerate?: () => void;
  isActivating?: boolean;
  className?: string;
}

export function SummaryVersionTabs({
  versions,
  selectedVersionId,
  onSelectVersion,
  onActivateVersion,
  onOpenRegenerate,
  isActivating = false,
  className,
}: SummaryVersionTabsProps) {
  const currentVersion = versions.find((v) => v.id === selectedVersionId) || versions[0];
  const maxVersions = DomainLimits.MAX_SUMMARY_VERSIONS;
  const isCapReached = versions.length >= maxVersions;

  if (!versions || versions.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="summary-version-tabs"
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      {/* Scrollable Version List */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1.5 shrink-0">
          <History className="h-3.5 w-3.5" />
          <span className="font-semibold">Versi:</span>
        </div>

        {versions.map((ver) => {
          const isSelected = ver.id === selectedVersionId;
          return (
            <button
              key={ver.id}
              type="button"
              onClick={() => onSelectVersion(ver.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all shrink-0',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
              aria-selected={isSelected}
              role="tab"
              data-testid={`version-tab-${ver.version}`}
            >
              <span>v{ver.version}</span>
              <span className="text-[10px] opacity-80">({ver.template_category})</span>
              {ver.is_active && (
                <Star className={cn('h-3 w-3 fill-current', isSelected ? 'text-amber-300' : 'text-amber-400')} />
              )}
            </button>
          );
        })}
      </div>

      {/* Action Controls & Cap Indicator */}
      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 border-t border-border/40 sm:pt-0 sm:border-t-0">
        {/* Version Cap Counter */}
        <span data-testid="version-cap-counter" className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">{versions.length}</span>/{maxVersions} versi
        </span>

        {/* Set Active Button (when selected version is not active) */}
        {currentVersion && !currentVersion.is_active && onActivateVersion && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onActivateVersion(currentVersion.id)}
            disabled={isActivating}
            className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
            data-testid="activate-version-btn"
          >
            {isActivating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Mengaktifkan...</span>
              </>
            ) : (
              <>
                <Check className="h-3 w-3" />
                <span>Jadikan Aktif</span>
              </>
            )}
          </Button>
        )}

        {/* Regenerate Trigger Button */}
        {onOpenRegenerate && (
          <Button
            type="button"
            variant={isCapReached ? 'secondary' : 'default'}
            size="sm"
            onClick={onOpenRegenerate}
            disabled={isCapReached}
            className="h-7 text-xs gap-1"
            data-testid="open-regenerate-modal-btn"
            title={isCapReached ? `Batas maksimal ${maxVersions} versi telah tercapai` : 'Buat versi ringkasan baru'}
          >
            <Sparkles className="h-3 w-3" />
            <span>Generate Baru</span>
          </Button>
        )}
      </div>
    </div>
  );
}
