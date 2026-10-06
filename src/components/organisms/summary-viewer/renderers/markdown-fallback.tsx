import { Card, CardContent } from '@/components/atoms/card';
import { FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MarkdownFallbackProps {
  content: string;
  templateCategory?: string;
  className?: string;
}

export function MarkdownFallback({
  content,
  templateCategory,
  className,
}: MarkdownFallbackProps) {
  return (
    <div
      data-testid="markdown-summary-fallback"
      className={cn('space-y-4 text-foreground', className)}
    >
      <div className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <FileText className="h-4 w-4" />
          <span>Ringkasan {templateCategory ? `(${templateCategory})` : ''}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-amber-400" />
          Format Teks Naratif
        </div>
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardContent className="p-6">
          <div className="prose prose-invert prose-sm max-w-none text-foreground/90 whitespace-pre-line leading-relaxed font-sans">
            {content || 'Tidak ada konten ringkasan yang tersedia.'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
