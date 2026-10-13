import React from 'react';
import type { LectureStructuredData } from '@/server/schemas/summary.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { GraduationCap, BookOpen, Lightbulb, Bookmark, HelpCircle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LectureRendererProps {
  data: LectureStructuredData;
  className?: string;
}

export function LectureRenderer({ data, className }: LectureRendererProps) {
  return (
    <div
      data-testid="lecture-summary-renderer"
      className={cn('space-y-6 text-foreground max-w-full min-w-0', className)}
    >
      {/* Lecture Header Banner */}
      <div className="rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-card/80 to-indigo-500/5 p-5 backdrop-blur-sm shadow-sm space-y-3 max-w-full min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
          <GraduationCap className="h-4 w-4 text-sky-400 shrink-0" />
          <span>Materi Kuliah & Webinar Akademis</span>
        </div>
        <h2 className="text-xl font-bold text-foreground md:text-2xl tracking-tight break-words min-w-0">
          {data.lecture_title}
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line pt-1 break-words">
          {data.course_summary}
        </p>

        {/* Learning Objectives */}
        {data.learning_objectives && data.learning_objectives.length > 0 && (
          <div className="mt-4 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3.5 space-y-2 max-w-full min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
              <Target className="h-4 w-4 shrink-0" />
              <span>Tujuan Pembelajaran (Learning Objectives)</span>
            </div>
            <ul className="space-y-1.5 text-xs">
              {data.learning_objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed break-words">{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Core Concepts */}
      {data.core_concepts && data.core_concepts.length > 0 && (
        <div className="space-y-3 max-w-full min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Konsep & Teori Utama ({data.core_concepts.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-full">
            {data.core_concepts.map((concept, idx) => (
              <Card key={idx} className="border-border/60 bg-card/40 hover:bg-card/60 transition-colors min-w-0 max-w-full overflow-hidden break-words">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30 shrink-0">
                      Konsep {idx + 1}
                    </Badge>
                    <span className="break-words min-w-0">{concept.concept}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p className="text-foreground/90 leading-relaxed break-words">
                    {concept.explanation}
                  </p>
                  {concept.examples && (
                    <div className="rounded border border-border/40 bg-muted/30 p-2 text-[11px] text-muted-foreground break-words">
                      <span className="font-semibold text-foreground">Contoh: </span>
                      {concept.examples}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Technical Glossary */}
      {data.technical_glossary && data.technical_glossary.length > 0 && (
        <Card className="border-border/60 bg-card/40 max-w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-400">
              <Bookmark className="h-4 w-4 shrink-0" />
              <span>Glosarium Istilah Teknis ({data.technical_glossary.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs max-w-full">
              {data.technical_glossary.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-border/40 bg-card/60 space-y-1 min-w-0 max-w-full overflow-hidden break-words">
                  <span className="font-semibold text-foreground font-mono text-[11px] text-primary break-words block">
                    {item.term}
                  </span>
                  <p className="text-muted-foreground text-[11px] leading-relaxed break-words">
                    {item.definition}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topic Notes */}
      {data.topic_notes && data.topic_notes.length > 0 && (
        <div className="space-y-3 max-w-full min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Catatan Per Topik Bahasan ({data.topic_notes.length})</span>
          </h3>
          <div className="space-y-3 max-w-full">
            {data.topic_notes.map((topicNote, idx) => (
              <Card key={idx} className="border-border/60 bg-card/40 max-w-full overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-foreground break-words">
                    {topicNote.topic}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-xs text-foreground/90 list-disc list-inside">
                    {topicNote.key_points.map((pt, pIdx) => (
                      <li key={pIdx} className="leading-relaxed break-words">{pt}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Exam Review Questions */}
      {data.exam_review_questions && data.exam_review_questions.length > 0 && (
        <Card className="border-border/60 bg-card/50 max-w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-purple-400">
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>Pertanyaan Ujian & Latihan Diskusi ({data.exam_review_questions.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {data.exam_review_questions.map((q, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-border/40 bg-card/40 space-y-2 min-w-0 max-w-full overflow-hidden break-words">
                <div className="flex items-start gap-2 min-w-0">
                  <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0.5 shrink-0">
                    Q{idx + 1}
                  </Badge>
                  <p className="font-semibold text-foreground leading-relaxed break-words min-w-0">
                    {q.question}
                  </p>
                </div>
                <div className="pl-6 border-l-2 border-primary/30 text-[11px] text-muted-foreground leading-relaxed break-words">
                  <span className="font-semibold text-primary">Petunjuk Jawaban: </span>
                  {q.hint_or_key_answer}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
