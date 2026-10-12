'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent } from '@/components/atoms/card';
import { FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/locales';

export interface MarkdownFallbackProps {
  content: string;
  templateCategory?: string;
  className?: string;
}

/**
 * Formats a raw JSON object into clean, readable Markdown sections
 * so that raw JSON never leaks to the end user.
 */
export function formatJSONAsMarkdown(data: Record<string, unknown>): string {
  const parts: string[] = [];

  // Title
  const title =
    data.episode_title ||
    data.meeting_title ||
    data.lecture_title ||
    data.song_title ||
    data.research_title ||
    data.title;
  if (typeof title === 'string' && title.trim()) {
    parts.push(`# ${title.trim()}\n`);
  }

  // Overview / Executive Summary / Show Notes
  const overview =
    data.executive_overview ||
    data.executive_summary ||
    data.show_notes ||
    data.course_summary ||
    data.abstract_or_summary ||
    data.summary;
  if (typeof overview === 'string' && overview.trim()) {
    parts.push(`## Ringkasan Eksekutif\n\n${overview.trim()}\n`);
  }

  // Key Takeaways / Poin Utama
  const takeaways = data.key_takeaways || data.takeaways;
  if (Array.isArray(takeaways) && takeaways.length > 0) {
    parts.push(`## Poin-Poin Utama\n`);
    for (const item of takeaways) {
      if (typeof item === 'string' && item.trim()) {
        parts.push(`- ${item.trim()}`);
      }
    }
    parts.push('');
  }

  // Core Themes
  if (Array.isArray(data.core_themes) && data.core_themes.length > 0) {
    parts.push(`## Pembahasan Utama\n`);
    for (const theme of data.core_themes) {
      if (typeof theme === 'object' && theme !== null) {
        const t = theme as { theme?: string; summary_points?: unknown[] };
        if (t.theme) parts.push(`### ${t.theme}`);
        if (Array.isArray(t.summary_points)) {
          for (const sp of t.summary_points) {
            if (typeof sp === 'string' && sp.trim()) {
              parts.push(`- ${sp.trim()}`);
            }
          }
        }
        parts.push('');
      }
    }
  }

  // Topic Chapters
  if (Array.isArray(data.topic_chapters) && data.topic_chapters.length > 0) {
    parts.push(`## Babak Pembahasan\n`);
    for (const ch of data.topic_chapters) {
      if (typeof ch === 'object' && ch !== null) {
        const c = ch as { timestamp?: string; topic?: string; summary?: string };
        const timeHeader = c.timestamp ? `[${c.timestamp}] ` : '';
        if (c.topic) parts.push(`### ${timeHeader}${c.topic}`);
        if (c.summary) parts.push(`${c.summary}\n`);
      }
    }
  }

  // Quotes
  const quotes = data.golden_quotes || data.notable_quotes || data.quotes;
  if (Array.isArray(quotes) && quotes.length > 0) {
    parts.push(`## Kutipan Penting\n`);
    for (const q of quotes) {
      if (typeof q === 'object' && q !== null) {
        const quoteObj = q as { quote?: string; speaker?: string; context?: string };
        if (quoteObj.quote) {
          const speakerInfo = quoteObj.speaker ? ` — **${quoteObj.speaker}**` : '';
          const contextInfo = quoteObj.context ? ` *(${quoteObj.context})*` : '';
          parts.push(`> "${quoteObj.quote}"${speakerInfo}${contextInfo}\n`);
        }
      }
    }
  }

  // Referenced Resources
  if (Array.isArray(data.referenced_resources) && data.referenced_resources.length > 0) {
    parts.push(`## Referensi & Sumber Daya\n`);
    for (const r of data.referenced_resources) {
      if (typeof r === 'string') {
        parts.push(`- ${r}`);
      } else if (typeof r === 'object' && r !== null) {
        const res = r as { title?: string; type?: string; description?: string };
        const typeBadge = res.type ? `*[${res.type}]* ` : '';
        const titleStr = res.title ? `**${res.title}**` : '';
        const descStr = res.description ? ` — ${res.description}` : '';
        parts.push(`- ${typeBadge}${titleStr}${descStr}`);
      }
    }
    parts.push('');
  }

  // If parts only has title or is empty, extract remaining keys as readable markdown sections
  const handledKeys = new Set([
    'episode_title',
    'meeting_title',
    'lecture_title',
    'song_title',
    'research_title',
    'title',
    'executive_overview',
    'executive_summary',
    'show_notes',
    'course_summary',
    'abstract_or_summary',
    'summary',
    'key_takeaways',
    'takeaways',
    'core_themes',
    'topic_chapters',
    'golden_quotes',
    'notable_quotes',
    'quotes',
    'referenced_resources',
    'markdown_content',
  ]);

  for (const [key, val] of Object.entries(data)) {
    if (handledKeys.has(key) || !val) continue;
    const formattedKey = key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    if (typeof val === 'string' && val.trim()) {
      parts.push(`## ${formattedKey}\n\n${val.trim()}\n`);
    } else if (Array.isArray(val) && val.length > 0) {
      parts.push(`## ${formattedKey}\n`);
      for (const item of val) {
        if (typeof item === 'string') {
          parts.push(`- ${item}`);
        } else if (typeof item === 'object' && item !== null) {
          const formattedItem = Object.entries(item as Record<string, unknown>)
            .map(([itemKey, itemVal]) => `${itemKey.replace(/_/g, ' ')}: ${String(itemVal)}`)
            .join(', ');
          parts.push(`- ${formattedItem}`);
        }
      }
      parts.push('');
    }
  }

  return parts.join('\n').trim();
}

/**
 * Strips raw AI artifact wrapper directives (such as :::writing{...} and closing :::)
 * commonly outputted by OpenAI / OmniRoute Canvas models.
 * Automatically converts raw JSON payloads into human-readable Markdown.
 */
export function cleanMarkdownContent(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();

  // Failsafe: if raw string is JSON, format it cleanly as Markdown
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('```json') && trimmed.includes('{')) ||
    (trimmed.startsWith('```') && trimmed.includes('{'))
  ) {
    try {
      const jsonStr = trimmed.startsWith('```')
        ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
        : trimmed;
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const formatted = formatJSONAsMarkdown(parsed as Record<string, unknown>);
        if (formatted) return formatted;
      }
    } catch {
      // ignore JSON parse error, proceed to standard cleaning
    }
  }

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
  const { t } = useTranslation();
  const cleanedContent = useMemo(() => cleanMarkdownContent(content), [content]);

  return (
    <div
      data-testid="markdown-summary-fallback"
      className={cn('space-y-4 text-foreground', className)}
    >
      <div className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <FileText className="h-4 w-4" />
          <span>{t('recording.templates.markdown.badge', { category: templateCategory ? `(${templateCategory})` : '' }).trim()}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>{t('recording.templates.markdown.structuredAiFormat')}</span>
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
