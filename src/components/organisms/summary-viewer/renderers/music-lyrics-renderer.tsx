import React from 'react';
import type { MusicLyricsStructuredData } from '@/server/schemas/summary.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Music2, Heart, Sparkles, Disc, Mic2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MusicLyricsRendererProps {
  data: MusicLyricsStructuredData;
  className?: string;
}

export function MusicLyricsRenderer({ data, className }: MusicLyricsRendererProps) {
  return (
    <div
      data-testid="music-lyrics-summary-renderer"
      className={cn('space-y-6 text-foreground', className)}
    >
      {/* Song Header Banner */}
      <div className="rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-card/80 to-purple-500/5 p-5 backdrop-blur-sm shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
          <Music2 className="h-4 w-4 text-rose-400 animate-pulse" />
          <span>Komposisi & Transkrip Lirik Musik</span>
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-xl font-bold text-foreground md:text-2xl tracking-tight">
            {data.song_title}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {data.artist_or_performers && (
              <Badge variant="outline" className="text-xs bg-rose-500/10 text-rose-300 border-rose-500/30 flex items-center gap-1">
                <Mic2 className="h-3 w-3" />
                {data.artist_or_performers}
              </Badge>
            )}
            {data.musical_style && (
              <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-300 border-purple-500/20 flex items-center gap-1">
                <Disc className="h-3 w-3" />
                {data.musical_style}
              </Badge>
            )}
          </div>
        </div>

        {/* Emotional Tone & Energy Assessment */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border/40">
          <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 space-y-1 text-xs">
            <span className="font-semibold text-rose-400 flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" />
              Suasana Hati & Energi (Mood & Energy)
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <Badge className="bg-rose-500 text-white text-[10px]">{data.emotional_tone.primary_mood}</Badge>
              <Badge variant="outline" className="text-[10px]">{data.emotional_tone.energy_level}</Badge>
            </div>
            {data.emotional_tone.sentiment_analysis && (
              <p className="text-muted-foreground text-[11px] leading-relaxed pt-1">
                {data.emotional_tone.sentiment_analysis}
              </p>
            )}
          </div>

          <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 space-y-1 text-xs">
            <span className="font-semibold text-purple-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Makna & Pesan Inti (Core Message)
            </span>
            <p className="text-foreground/90 text-xs leading-relaxed pt-0.5">
              {data.core_message}
            </p>
          </div>
        </div>
      </div>

      {/* Structured Lyrics per Section */}
      {data.structured_lyrics && data.structured_lyrics.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Disc className="h-4 w-4 text-rose-400" />
            Lirik Berdasarkan Bagian Lagu ({data.structured_lyrics.length})
          </h3>
          <div className="space-y-3">
            {data.structured_lyrics.map((sec, idx) => (
              <Card key={idx} className="border-border/60 bg-card/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    {sec.section}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line font-serif italic pl-4 border-l-2 border-rose-500/30">
                    {sec.lyrics}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Thematic Elements */}
      {data.thematic_elements && data.thematic_elements.length > 0 && (
        <Card className="border-border/60 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-400">
              <Tag className="h-4 w-4" />
              Elemen Tematik ({data.thematic_elements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.thematic_elements.map((theme, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs px-2.5 py-1 bg-primary/10 text-primary border-primary/20">
                  #{theme}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
