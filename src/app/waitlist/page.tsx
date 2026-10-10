'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { WaitlistRequest, WaitlistResponse } from '@/server/dtos/waitlist.dto';
import { Button } from '@/components/atoms/button';
import { YoutenLogo } from '@/components/atoms/youten-logo';
import { WaitlistCard } from '@/components/molecules/waitlist-card';
import { toast } from 'sonner';
import {
  Sparkles,
  ArrowLeft,
  Shield,
  Zap,
  CheckCircle,
  Headphones,
  FileText,
} from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: Zap,
    title: 'Hadir Otomatis Tanpa Ribet',
    description:
      'Cukup tempel tautan rapat atau tautkan kalender kerja Anda. Bot akan bergabung otomatis tepat waktu.',
  },
  {
    icon: Headphones,
    title: 'Audio Jernih & Multi-Speaker',
    description:
      'Diarisasi pembicara mutakhir yang secara akurat mengenali siapa berbicara apa di ruang rapat.',
  },
  {
    icon: FileText,
    title: 'MoM & Action Items Instan',
    description:
      'Rapat selesai, notulen langsung siap dalam hitungan detik dengan 7 format template profesional.',
  },
  {
    icon: Shield,
    title: 'Privasi & Enkripsi Tingkat Enterprise',
    description:
      'Rekaman audio dienkripsi end-to-end dan tidak pernah digunakan untuk melatih model publik.',
  },
];

const FAQS = [
  {
    question: 'Kapan program Private Beta akan dimulai?',
    answer:
      'Gelombang pertama undangan beta akan dikirimkan secara bertahap dalam beberapa minggu ke depan kepada pendaftar di daftar antrean teratas.',
  },
  {
    question: 'Platform rapat apa saja yang didukung?',
    answer:
      'Fase beta mendukung Google Meet, Zoom Meetings, Microsoft Teams, dan Discord Voice Channel.',
  },
  {
    question: 'Apakah ada biaya untuk bergabung ke beta?',
    answer:
      'Tidak ada biaya sama sekali. Peserta private beta akan mendapatkan kuota gratis penuh selama periode evaluasi.',
  },
];

export default function WaitlistPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoinWaitlist = async (payload: WaitlistRequest): Promise<WaitlistResponse> => {
    setIsSubmitting(true);
    try {
      const res = await apiFetch<ApiResponse<WaitlistResponse>>('/api/waitlist/bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res && res.data) {
        toast.success('Pendaftaran berhasil! Anda telah masuk antrean beta.');
        return res.data;
      }

      throw new Error('Gagal memproses pendaftaran waitlist.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengirim pendaftaran waitlist.';
      toast.error(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-testid="waitlist-page" className="min-h-screen bg-slate-50/70 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <Link href="/" className="flex items-center gap-2.5 group">
              <YoutenLogo size="sm" className="group-hover:scale-105 transition-transform" />
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  Youten AI
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/50">
                  Voice Bot Beta
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-slate-700 border-slate-200 hover:border-slate-300"
              >
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
        {/* Hero Section & Waitlist Form Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Vision & Value Pitch */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Next-Generation Autonomous Assistant</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Asisten Suara Otomatis di Setiap{' '}
              <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Ruang Rapat Anda
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Fokus penuh pada diskusi dan pengambilan keputusan. Biarkan Youten Voice Bot bergabung
              ke panggilan Anda, mencatat setiap detail, dan mendistribusikan notulen rapat seketika.
            </p>

            {/* Quick Benefits Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Google Meet, Zoom &amp; Teams</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ringkasan Eksekutif Otomatis</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Diarisasi Pembicara Akurat</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Integrasi Kalender &amp; Slack</span>
              </div>
            </div>
          </div>

          {/* Right Column: Waitlist Card */}
          <div className="lg:col-span-5">
            <WaitlistCard onSubmit={handleJoinWaitlist} isLoading={isSubmitting} />
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="space-y-8 pt-6 border-t border-slate-200/80">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Kenapa Memilih Youten Bot?
            </h2>
            <p className="text-sm text-slate-500">
              Dibangun dengan infrastruktur AI terkini untuk efisiensi kolaborasi tim modern.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HIGHLIGHTS.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-3.5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-xs space-y-8">
          <div className="text-center space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Semua hal yang perlu Anda ketahui mengenai program private beta ini.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70 space-y-2">
                <h3 className="font-bold text-sm text-slate-900">{faq.question}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>&copy; 2026 Youten AI. Seluruh hak cipta dilindungi undang-undang.</p>
        </div>
      </footer>
    </div>
  );
}
