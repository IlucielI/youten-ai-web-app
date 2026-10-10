'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Activity,
  HeartHandshake,
  UserCheck,
  Cpu,
  TrendingUp,
  Mic,
  BookOpen,
  Music,
  Sparkles,
} from 'lucide-react';
import { apiFetchData } from '@/lib/api-client';
import { TemplateListResponse } from '@/server/dtos';
import { TemplateKey } from '@/server/constants';

export interface DynamicTemplateOption {
  key: string;
  name: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const FALLBACK_TEMPLATES: DynamicTemplateOption[] = [
  {
    key: TemplateKey.GENERAL,
    name: 'Executive Briefing & General Discussion',
    label: 'Ringkasan Umum (Cornell Notes)',
    description: 'Ikhtisar eksekutif, tema inti, poin pembelajaran penting, dan kutipan berkesan.',
    icon: FileText,
  },
  {
    key: TemplateKey.MOM,
    name: 'Minutes of Meeting (MOM)',
    label: 'Notula Rapat (MOM)',
    description: 'Agenda, keputusan penting, matriks dinamika, dan tabel tindak lanjut berprioritas.',
    icon: Activity,
  },
  {
    key: TemplateKey.ONE_ON_ONE,
    name: '1-on-1 Performance & Growth',
    label: 'Percakapan 1-on-1',
    description: 'Asesmen wellbeing, pencapaian, blocker, dan komitmen pertumbuhan 2 arah.',
    icon: HeartHandshake,
  },
  {
    key: TemplateKey.INTERVIEW,
    name: 'Technical & Behavioral Interview Scorecard',
    label: 'Wawancara Kandidat (STAR)',
    description: 'STAR scorecard, rekomendasi perekrutan, dan evaluasi kompetensi.',
    icon: UserCheck,
  },
  {
    key: TemplateKey.TECH_REVIEW,
    name: 'Engineering RFC & Tech Review',
    label: 'Tinjauan Teknis (RFC / ADR)',
    description: 'Konteks arsitektur, keputusan yang diadopsi, alternatif ditolak, dan asesmen NFR.',
    icon: Cpu,
  },
  {
    key: TemplateKey.SALES_DISCOVERY,
    name: 'B2B Sales Discovery & MEDDPICC',
    label: 'Sales Discovery (MEDDPICC)',
    description: 'Kerangka MEDDPICC, pain points, cost of inaction, dan langkah selanjutnya.',
    icon: TrendingUp,
  },
  {
    key: TemplateKey.DAILY_STANDUP,
    name: 'Agile Daily Standup & Scrum',
    label: 'Daily Standup / Scrum',
    description: 'Status sprint, pembaruan kemarin/hari ini/blocker, dan tindak lanjut cepat.',
    icon: Activity,
  },
  {
    key: TemplateKey.PODCAST,
    name: 'Podcast & Talkshow',
    label: 'Podcast & Talkshow',
    description: 'Catatan episode, ikhtisar narasumber, chapter waktu, takeaways, dan kutipan emas.',
    icon: Mic,
  },
  {
    key: TemplateKey.LECTURE,
    name: 'Lecture, Class & Webinar',
    label: 'Kuliah & Webinar',
    description: 'Ringkasan materi inti, konsep penting, glosarium teknis, dan bahan review ujian.',
    icon: BookOpen,
  },
  {
    key: TemplateKey.MUSIC_LYRICS,
    name: 'Music Lyrics & Composition',
    label: 'Lirik Musik & Komposisi',
    description: 'Transkripsi lirik berdasarkan struktur lagu (Verse, Chorus), analisis nada emosional dan makna.',
    icon: Music,
  },
  {
    key: TemplateKey.RESEARCH_DEEPDIVE,
    name: 'Academic Research & Deep Dive',
    label: 'Riset Akademik & Deep Dive',
    description: 'Sintesis tinjauan pustaka, metodologi penelitian, dan analisis hasil eksperimental.',
    icon: Sparkles,
  },
];

export function getTemplateIcon(key: string): React.ComponentType<{ className?: string }> {
  switch (key) {
    case TemplateKey.MOM:
      return Activity;
    case TemplateKey.ONE_ON_ONE:
      return HeartHandshake;
    case TemplateKey.INTERVIEW:
      return UserCheck;
    case TemplateKey.TECH_REVIEW:
      return Cpu;
    case TemplateKey.SALES_DISCOVERY:
      return TrendingUp;
    case TemplateKey.DAILY_STANDUP:
      return Activity;
    case TemplateKey.PODCAST:
      return Mic;
    case TemplateKey.LECTURE:
      return BookOpen;
    case TemplateKey.MUSIC_LYRICS:
      return Music;
    case TemplateKey.RESEARCH_DEEPDIVE:
      return Sparkles;
    case TemplateKey.GENERAL:
    default:
      return FileText;
  }
}

// In-memory cache across hook instances
let cachedTemplates: DynamicTemplateOption[] | null = null;
let fetchPromise: Promise<DynamicTemplateOption[]> | null = null;

export function _resetTemplateCache(): void {
  cachedTemplates = null;
  fetchPromise = null;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<DynamicTemplateOption[]>(
    cachedTemplates || FALLBACK_TEMPLATES
  );
  const [isLoading, setIsLoading] = useState(!cachedTemplates);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (cachedTemplates) {
      return;
    }

    const load = async () => {
      try {
        if (!fetchPromise) {
          fetchPromise = apiFetchData<TemplateListResponse>('/api/templates')
            .then((res) => {
              if (res?.items && Array.isArray(res.items) && res.items.length > 0) {
                const active = res.items.filter((item) => item.is_active);
                const mapped: DynamicTemplateOption[] = active.map((item) => {
                  const fallback = FALLBACK_TEMPLATES.find((f) => f.key === item.category_key);
                  return {
                    key: item.category_key,
                    name: item.name,
                    label: fallback?.label || item.name,
                    description: item.description || fallback?.description || '',
                    icon: getTemplateIcon(item.category_key),
                  };
                });
                cachedTemplates = mapped;
                return mapped;
              }
              return FALLBACK_TEMPLATES;
            })
            .catch(() => {
              return FALLBACK_TEMPLATES;
            })
            .finally(() => {
              fetchPromise = null;
            });
        }

        const result = await fetchPromise;
        if (isMounted) {
          setTemplates(result);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      cachedTemplates = null;
      fetchPromise = null;

      const res = await apiFetchData<TemplateListResponse>('/api/templates');
      if (res?.items && Array.isArray(res.items) && res.items.length > 0) {
        const active = res.items.filter((item) => item.is_active);
        const mapped: DynamicTemplateOption[] = active.map((item) => {
          const fallback = FALLBACK_TEMPLATES.find((f) => f.key === item.category_key);
          return {
            key: item.category_key,
            name: item.name,
            label: fallback?.label || item.name,
            description: item.description || fallback?.description || '',
            icon: getTemplateIcon(item.category_key),
          };
        });
        cachedTemplates = mapped;
        setTemplates(mapped);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTemplateLabel = useCallback(
    (key: string): string => {
      const match = templates.find((t) => t.key === key);
      if (match) return match.label || match.name;
      const fallback = FALLBACK_TEMPLATES.find((f) => f.key === key);
      return fallback?.label || key;
    },
    [templates]
  );

  return {
    templates,
    isLoading,
    error,
    refresh,
    getTemplateLabel,
  };
}
