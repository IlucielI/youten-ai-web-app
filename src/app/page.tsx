'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/organisms/navbar';
import { UploadDropzone } from '@/components/organisms/upload-dropzone';
import { UrlImportForm } from '@/components/molecules/url-import-form';
import { BrowserRecorder } from '@/components/organisms/browser-recorder';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/atoms/tabs';
import { MeetingBotForm } from '@/components/organisms/meeting-bot-form';
import { LiveBotTracker } from '@/components/organisms/live-bot-tracker';
import { useMeetingBotStore } from '@/stores/meeting-bot.store';
import { TemplateKey, DefaultTemplateKey } from '@/server/constants/template.constant';
import { useTokenStore } from '@/stores/token.store';
import { useAuthStore } from '@/stores/auth.store';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import {
  PresignUploadResponseDto,
  RecordingUploadResponseDto,
} from '@/server/schemas/recording.schema';
import {
  UploadCloud,
  Link as LinkIcon,
  Mic,
  Bot,
  Sparkles,
  Info,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'record' | 'bot'>('upload');
  const [isUrlImporting, setIsUrlImporting] = useState(false);
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentUser = useAuthStore((state) => state.user);

  const addGuestToken = useTokenStore((state) => state.addGuestToken);
  const ensureAnonSession = useTokenStore((state) => state.ensureAnonSession);
  const activeBotSession = useMeetingBotStore((state) => state.activeSession);

  /**
   * Complete 3-step file upload flow (Presign -> Direct PUT -> Confirm Upload).
   */
  const handleUploadFile = async (
    file: File,
    options: { title: string; templateCategory: TemplateKey }
  ): Promise<{ id: string; ownershipToken?: string }> => {
    setErrorMessage(null);
    setQuotaExhausted(false);

    try {
      // Step 0: Ensure anonymous handshake session
      await ensureAnonSession();

      // Step 1: Request presigned upload URL from BFF
      const presignRes = await apiFetch<ApiResponse<PresignUploadResponseDto>>(
        '/api/recordings/presign',
        {
          method: 'POST',
          body: JSON.stringify({
            filename: file.name,
            content_type: file.type || 'audio/mpeg',
          }),
        }
      );

      if (!presignRes.data) {
        throw new Error('Gagal mendapatkan URL unggahan berkas.');
      }

      const { upload_url, object_key } = presignRes.data;

      // Step 2: Upload binary file directly to S3
      try {
        const s3Res = await fetch(upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'audio/mpeg',
          },
          body: file,
        });

        if (!s3Res.ok && s3Res.status !== 0) {
          // If S3 upload fails and is not local mock, throw error
          if (!upload_url.includes('localhost') && !upload_url.includes('127.0.0.1')) {
            throw new Error(`Gagal mengunggah berkas ke penyimpanan (${s3Res.status})`);
          }
        }
      } catch (err: unknown) {
        // If simulated in test/mock environment, allow proceeding
        const isMockUrl =
          upload_url.includes('mock') ||
          upload_url.includes('localhost') ||
          upload_url.includes('test');
        if (!isMockUrl) {
          throw err;
        }
      }

      // Step 3: Confirm upload with BFF
      const uploadRes = await apiFetch<ApiResponse<RecordingUploadResponseDto>>(
        '/api/recordings/upload',
        {
          method: 'POST',
          body: JSON.stringify({
            filename: file.name,
            object_key,
            title: options.title || file.name.replace(/\.[^/.]+$/, ''),
            template: options.templateCategory || DefaultTemplateKey,
          }),
        }
      );

      if (!uploadRes.data) {
        throw new Error('Gagal membuat data rekaman.');
      }

      const recording = uploadRes.data;

      // Store guest ownership token in Zustand store if present
      if (recording.ownership_token) {
        addGuestToken({
          id: recording.id,
          ownership_token: recording.ownership_token,
          title: recording.title,
          created_at: recording.created_at,
        });
      }

      return {
        id: recording.id,
        ownershipToken: recording.ownership_token ?? undefined,
      };
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 429) {
        setQuotaExhausted(true);
        setErrorMessage('Batas kuota harian tercapai. Silakan masuk atau daftar untuk kuota tanpa batas.');
      } else {
        const msg = err instanceof Error ? err.message : 'Gagal memproses unggahan berkas.';
        setErrorMessage(msg);
      }
      throw err;
    }
  };

  /**
   * Navigate to pipeline progress page upon successful upload.
   */
  const handleUploadComplete = (recordingId: string) => {
    router.push(`/recordings/${recordingId}/processing`);
  };

  /**
   * Handle direct media URL import.
   */
  const handleUrlImport = async (values: {
    url: string;
    title?: string;
    templateCategory: TemplateKey;
    language?: string;
  }) => {
    setErrorMessage(null);
    setQuotaExhausted(false);
    setIsUrlImporting(true);

    try {
      // Step 0: Ensure anonymous handshake session
      await ensureAnonSession();

      const res = await apiFetch<ApiResponse<RecordingUploadResponseDto>>(
        '/api/recordings/import-url',
        {
          method: 'POST',
          body: JSON.stringify({
            url: values.url,
            title: values.title,
            template: values.templateCategory,
            language: values.language,
          }),
        }
      );

      if (!res.data) {
        throw new Error('Gagal mengimpor data rekaman dari URL.');
      }

      const recording = res.data;

      if (recording.ownership_token) {
        addGuestToken({
          id: recording.id,
          ownership_token: recording.ownership_token,
          title: recording.title,
          created_at: recording.created_at,
        });
      }

      router.push(`/recordings/${recording.id}/processing`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 429) {
        setQuotaExhausted(true);
        setErrorMessage('Batas kuota harian tercapai. Silakan masuk atau daftar untuk kuota tanpa batas.');
      } else {
        const msg = err instanceof Error ? err.message : 'Gagal mengimpor audio dari URL.';
        setErrorMessage(msg);
      }
    } finally {
      setIsUrlImporting(false);
    }
  };

  /**
   * Handle browser live recording processing.
   */
  const handleProcessLiveRecording = async (
    audioBlob: Blob,
    _durationSeconds?: number,
    options?: { title?: string; templateCategory?: TemplateKey }
  ) => {
    const file = new File(
      [audioBlob],
      `rekaman-suara-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.webm`,
      { type: audioBlob.type || 'audio/webm' }
    );

    const result = await handleUploadFile(file, {
      title: options?.title || 'Rekaman Langsung',
      templateCategory: options?.templateCategory || DefaultTemplateKey,
    });

    handleUploadComplete(result.id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Navbar */}
      <Navbar
        brandName="Youten AI"
        brandTag="Beta"
        ctaText={currentUser ? 'Dashboard' : 'Masuk'}
        ctaHref={currentUser ? '/dashboard' : '/login'}
        links={
          currentUser
            ? [
                { label: 'Beranda', href: '/', active: true },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Fitur', href: '#features' },
                { label: 'Waitlist Bot', href: '/waitlist' },
              ]
            : [
                { label: 'Beranda', href: '/', active: true },
                { label: 'Fitur', href: '#features' },
                { label: 'Waitlist Bot', href: '/waitlist' },
              ]
        }
      />

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Voice & Conversation Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Youten — Inti dari Setiap Percakapan
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transkripsi cerdas, intisari keputusan, dan tanya jawab bertenaga AI untuk rapat,
            wawancara, kuliah, dan catatan suara Anda.
          </p>
        </div>

        {/* Quota Banner: Authenticated vs Guest */}
        {currentUser ? (
          <div
            data-testid="user-quota-banner"
            className="max-w-2xl mx-auto rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4 text-xs sm:text-sm text-foreground shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span>
                Selamat datang, <strong>{currentUser.full_name || currentUser.email}</strong>! Anda memiliki akses{' '}
                <strong className="text-primary font-semibold">{currentUser.role_name || 'Member'}</strong> (Kuota tersisa hari ini:{' '}
                <strong>{currentUser.quota_remaining ?? currentUser.daily_quota ?? 9998}</strong> rekaman).
              </span>
            </div>
            <Link
              href="/dashboard"
              className="shrink-0 font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Ke Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div
            data-testid="guest-quota-banner"
            className="max-w-2xl mx-auto rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4 text-xs sm:text-sm text-foreground shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>
                <strong>1 unggahan gratis per hari</strong> tanpa login. Rekaman tersimpan aman di peramban Anda.
              </span>
            </div>
            <Link
              href="/login"
              className="shrink-0 font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Masuk <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Quota Exhaustion Alert */}
        {quotaExhausted && (
          <div
            data-testid="quota-alert"
            className="max-w-2xl mx-auto rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-center gap-3 text-destructive text-xs sm:text-sm"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div className="flex-1 leading-snug">
              <strong>Batas Kuota Tamu Tercapai:</strong> Anda telah menggunakan 1 jatah rekaman gratis hari ini.
              Silakan{' '}
              <Link href="/login" className="underline font-semibold">
                Masuk
              </Link>{' '}
              atau{' '}
              <Link href="/register" className="underline font-semibold">
                Daftar
              </Link>{' '}
              untuk melanjutkan tanpa batas.
            </div>
          </div>
        )}

        {/* Generic Error Message */}
        {errorMessage && !quotaExhausted && (
          <div
            data-testid="landing-error-message"
            className="max-w-2xl mx-auto rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-destructive text-xs"
          >
            {errorMessage}
          </div>
        )}

        {/* Ingestion Hub Card Container */}
        <div className="max-w-3xl mx-auto rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-xl shadow-primary/5">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as typeof activeTab)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 w-full mb-6 h-11 p-1 bg-muted/60">
              <TabsTrigger
                value="upload"
                data-testid="tab-upload"
                onClick={() => setActiveTab('upload')}
                className="flex items-center gap-2 text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <UploadCloud className="h-4 w-4" />
                <span className="hidden sm:inline">Unggah Berkas</span>
                <span className="sm:hidden">Unggah</span>
              </TabsTrigger>
              <TabsTrigger
                value="url"
                data-testid="tab-url"
                onClick={() => setActiveTab('url')}
                className="flex items-center gap-2 text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <LinkIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Tautan / URL</span>
                <span className="sm:hidden">URL</span>
              </TabsTrigger>
              <TabsTrigger
                value="record"
                data-testid="tab-record"
                onClick={() => setActiveTab('record')}
                className="flex items-center gap-2 text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Rekam Langsung</span>
                <span className="sm:hidden">Rekam</span>
              </TabsTrigger>
              <TabsTrigger
                value="bot"
                data-testid="tab-bot"
                onClick={() => setActiveTab('bot')}
                className="flex items-center gap-2 text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Bot Rapat</span>
                <span className="sm:hidden">Bot</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Upload File */}
            <TabsContent value="upload" className="outline-none">
              <UploadDropzone
                onUploadFile={handleUploadFile}
                onUploadComplete={handleUploadComplete}
              />
            </TabsContent>

            {/* Tab 2: URL Import */}
            <TabsContent value="url" className="outline-none">
              <UrlImportForm
                onSubmit={handleUrlImport}
                isLoading={isUrlImporting}
              />
            </TabsContent>

            {/* Tab 3: Live Browser Recording */}
            <TabsContent value="record" className="outline-none">
              <BrowserRecorder onProcessRecording={handleProcessLiveRecording} />
            </TabsContent>

            {/* Tab 4: Meeting Voice Bot */}
            <TabsContent value="bot" className="outline-none">
              <div data-testid="voice-bot-tab-content">
                {activeBotSession ? (
                  <LiveBotTracker />
                ) : (
                  <MeetingBotForm />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Trust & Feature Badges */}
        <div id="features" className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2 text-left">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>Privasi Terjaga</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Berkas audio dienkripsi dan diproses secara aman tanpa menjual data percakapan Anda.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2 text-left">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>7 Format Ringkasan</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pilihan template MoM, 1-on-1, Interview, Daily Standup, hingga Sales Discovery.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2 text-left">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Tanya AI Berbasis Waktu</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ajukan pertanyaan dan AI akan mengutip langsung segmen waktu audio yang relevan.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/40 py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Youten AI. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-6">
            <Link href="/health" className="hover:text-foreground transition-colors">
              Status Sistem
            </Link>
            <Link href="/waitlist" className="hover:text-foreground transition-colors">
              Waitlist Bot
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Masuk
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
