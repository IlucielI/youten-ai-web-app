'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent } from '@/components/atoms/card';
import { FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MarkdownFallbackProps {
  content: string;
  templateCategory?: string;
  className?: string;
}

/**
 * Strips raw AI artifact wrapper directives (such as :::writing{...} and closing :::)
 * commonly outputted by OpenAI / OmniRoute Canvas models.
 */
export function cleanMarkdownContent(raw: string): string {
  if (!raw) return '';
  return raw
    // Strip opening :::directive{...} tags
    .replace(/:::[a-zA-Z0-9_-]+(\{[^}]*\})?\s*/g, '')
    // Strip closing ::: tags on their own line
    .replace(/^:::\s*$/gm, '')
    // Strip trailing :::
    .replace(/\n:::\s*$/g, '')
    .trim();
}

export function MarkdownFallback({
  content,
  templateCategory,
  className,
}: MarkdownFallbackProps) {
  const cleanedContent = useMemo(() => cleanMarkdownContent(content), [content]);

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
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Format AI Terstruktur</span>
        </div>
      </div>

      <Card className="border-border/60 bg-card/50 overflow-hidden shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="prose prose-slate dark:prose-invert max-w-none text-foreground/90 leading-relaxed font-sans">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3 mt-6 mb-4 first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground mt-6 mb-3 border-b border-border/40 pb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold text-foreground/95 mt-5 mb-2">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="text-sm md:text-base leading-relaxed text-foreground/85 mb-4">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-outside pl-5 space-y-1.5 mb-4 text-sm md:text-base text-foreground/85 marker:text-primary">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside pl-5 space-y-1.5 mb-4 text-sm md:text-base text-foreground/85 marker:text-primary">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">
                    {children}
                  </li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary bg-primary/5 pl-4 py-3 my-4 rounded-r-xl italic text-sm md:text-base text-foreground/90">
                    {children}
                  </blockquote>
                ),
                hr: () => (
                  <hr className="border-border/60 my-6" />
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-6 rounded-xl border border-border/60 bg-card/40 shadow-sm">
                    <table className="w-full border-collapse text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-muted/70 text-foreground font-semibold border-b border-border/60">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground border border-border/40">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-3 text-sm text-foreground/85 border border-border/40 align-top">
                    {children}
                  </td>
                ),
                tr: ({ children }) => (
                  <tr className="even:bg-muted/20 hover:bg-muted/40 transition-colors">
                    {children}
                  </tr>
                ),
                code: ({ children, className: codeClassName }) => {
                  const isBlock = codeClassName?.includes('language-');
                  if (isBlock) {
                    return (
                      <code className={cn('block font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto my-3 border border-border/50', codeClassName)}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-primary font-medium border border-border/40">
                      {children}
                    </code>
                  );
                },
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">
                    {children}
                  </strong>
                ),
              }}
            >
              {cleanedContent || 'Tidak ada konten ringkasan yang tersedia.'}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
