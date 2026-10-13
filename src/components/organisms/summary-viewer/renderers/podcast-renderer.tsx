import React from 'react';
import type { PodcastStructuredData } from '@/server/schemas/summary.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Mic, User, Clock, CheckCircle2, Quote, BookOpen, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PodcastRendererProps {
  data: PodcastStructuredData;
  className?: string;
}

export function PodcastRenderer({ data, className }: PodcastRendererProps) {
  return (
    <div
      data-testid="podcast-summary-renderer"
      className={cn('space-y-6 text-foreground max-w-full min-w-0', className)}
    >
      {/* Episode Header & Banner */}
      <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-card/80 to-pink-500/5 p-5 backdrop-blur-sm shadow-sm space-y-3 max-w-full min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
          <Radio className="h-4 w-4 text-purple-400 animate-pulse shrink-0" />
          <span>Podcast & Talkshow Show Notes</span>
        </div>
        <h2 className="text-xl font-bold text-foreground md:text-2xl tracking-tight break-words min-w-0">
          {data.episode_title}
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90 pt-1 whitespace-pre-line break-words">
          {data.show_notes}
        </p>

        {/* Guest Overview Card */}
        {data.guest_overview && (data.guest_overview.guest_name || data.guest_overview.bio_or_background) && (
          <div className="mt-4 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3.5 flex items-start gap-3 max-w-full min-w-0">
            <div className="h-9 w-9 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              <User className="h-4 w-4" />
            </div>
            <div className="space-y-1 text-xs min-w-0 max-w-full">
              <div className="flex items-center gap-2 flex-wrap max-w-full">
                <span className="font-semibold text-foreground text-sm break-words min-w-0">
                  {data.guest_overview.guest_name || 'Bintang Tamu'}
                </span>
                {data.guest_overview.guest_title && (
                  <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/30 whitespace-normal break-words max-w-full text-left h-auto py-0.5 px-2">
                    {data.guest_overview.guest_title}
                  </Badge>
                )}
              </div>
              {data.guest_overview.bio_or_background && (
                <p className="text-muted-foreground leading-relaxed break-words">
                  {data.guest_overview.bio_or_background}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Topic Chapters Timeline */}
      {data.topic_chapters && data.topic_chapters.length > 0 && (
        <div className="space-y-3 max-w-full min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-400 shrink-0" />
            <span>Babak & Linimasa Topik ({data.topic_chapters.length})</span>
          </h3>
          <div className="space-y-3 max-w-full">
            {data.topic_chapters.map((chapter, idx) => (
              <Card key={idx} className="border-border/60 bg-card/40 hover:bg-card/60 transition-colors max-w-full overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 min-w-0 break-words">
                      <span className="h-2 w-2 rounded-full bg-purple-400 shrink-0" />
                      <span className="break-words min-w-0">{chapter.topic}</span>
                    </CardTitle>
                    <Badge variant="secondary" className="font-mono text-[11px] bg-purple-500/10 text-purple-300 border-purple-500/20 shrink-0">
                      {chapter.timestamp}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-foreground/90 leading-relaxed break-words">
                    {chapter.summary}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Key Takeaways */}
      {data.key_takeaways && data.key_takeaways.length > 0 && (
        <Card className="border-border/60 bg-card/50 max-w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Poin Penting & Wawasan Kunci ({data.key_takeaways.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs">
              {data.key_takeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed break-words">{takeaway}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Golden Quotes */}
      {data.golden_quotes && data.golden_quotes.length > 0 && (
        <div className="space-y-3 max-w-full min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Quote className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Kutipan Emas (Golden Quotes) ({data.golden_quotes.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-full">
            {data.golden_quotes.map((q, idx) => (
              <Card key={idx} className="border-border/60 bg-card/40 border-l-2 border-l-amber-500 min-w-0 max-w-full overflow-hidden">
                <CardContent className="p-3.5 space-y-2 text-xs">
                  <p className="italic text-foreground/90 leading-relaxed break-words">
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/40 min-w-0">
                    <span className="font-semibold text-amber-400 flex items-center gap-1 min-w-0 break-words">
                      <Mic className="h-3 w-3 shrink-0" />
                      <span>{q.speaker}</span>
                    </span>
                    {q.context && <span className="text-[10px] text-muted-foreground truncate max-w-[150px] shrink-0 text-right">{q.context}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Referenced Resources */}
      {data.referenced_resources && data.referenced_resources.length > 0 && (
        <Card className="border-border/60 bg-card/40 max-w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-400">
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>Referensi & Rekomendasi Sumber ({data.referenced_resources.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs max-w-full">
              {data.referenced_resources.map((res, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-border/40 bg-card/50 space-y-1 min-w-0 max-w-full overflow-hidden break-words">
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <span className="font-semibold text-foreground break-words min-w-0">{res.title || 'Sumber'}</span>
                    {res.type && (
                      <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 shrink-0">
                        {res.type}
                      </Badge>
                    )}
                  </div>
                  {res.description && (
                    <p className="text-muted-foreground text-[11px] leading-relaxed break-words">
                      {res.description}
                    </p>
                  )}
                  {res.url && (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-[11px] inline-flex items-center gap-1 pt-0.5 break-all"
                    >
                      Buka tautan &rarr;
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
