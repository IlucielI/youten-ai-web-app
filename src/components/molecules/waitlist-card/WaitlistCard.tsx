'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { WaitlistRequest, WaitlistResponse } from '@/server/dtos/waitlist.dto';
import { cn } from '@/lib/utils';
import {
  Bot,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Video,
  Building2,
  Mail,
} from 'lucide-react';

export interface WaitlistCardProps {
  onSubmit: (payload: WaitlistRequest) => Promise<WaitlistResponse | void>;
  isLoading?: boolean;
  className?: string;
  initialPlatform?: string;
}

export const PLATFORM_OPTIONS = [
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'zoom', label: 'Zoom Meetings' },
  { value: 'microsoft_teams', label: 'Microsoft Teams' },
  { value: 'discord', label: 'Discord Voice' },
];

export const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1 - 10 Orang (Startup / Tim Kecil)' },
  { value: '11-50', label: '11 - 50 Orang (Berkembang)' },
  { value: '51-200', label: '51 - 200 Orang (Mid-market)' },
  { value: '201+', label: 'Lebih dari 200 Orang (Enterprise)' },
];

export const WaitlistCard: React.FC<WaitlistCardProps> = ({
  onSubmit,
  isLoading = false,
  className = '',
  initialPlatform = 'google_meet',
}) => {
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState(initialPlatform);
  const [companySize, setCompanySize] = useState('1-10');
  const [clientError, setClientError] = useState<string | null>(null);
  const [successResponse, setSuccessResponse] = useState<WaitlistResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setClientError('Email wajib diisi.');
      return;
    }
    // Basic email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setClientError('Format alamat email tidak valid.');
      return;
    }

    try {
      const res = await onSubmit({
        email: trimmedEmail,
        platform,
        company_size: companySize,
      });
      if (res) {
        setSuccessResponse(res);
      } else {
        setSuccessResponse({
          email: trimmedEmail,
          platform,
          company_size: companySize,
          status: 'PENDING',
          message: 'Berhasil bergabung ke waitlist bot!',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim pendaftaran waitlist.';
      setClientError(msg);
    }
  };

  const handleReset = () => {
    setEmail('');
    setClientError(null);
    setSuccessResponse(null);
  };

  return (
    <Card
      data-testid="waitlist-card"
      className={cn(
        'border border-slate-200/90 bg-white shadow-xl rounded-3xl overflow-hidden transition-all',
        className
      )}
    >
      {/* Decorative Top Accent */}
      <div className="h-2 w-full bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600" />

      {successResponse ? (
        /* Success Confirmation View */
        <CardContent className="p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 mx-auto flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold px-3 py-1"
            >
              Pendaftaran Diterima
            </Badge>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Anda Masuk ke Antrean Beta!
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Terima kasih telah mendaftar. Kami telah mencatat preferensi bot untuk email{' '}
              <span className="font-semibold text-slate-900">{successResponse.email}</span>.
            </p>
          </div>

          {/* Submission Details Recap */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Platform Pilihan</span>
              <span className="font-bold text-slate-900 capitalize">
                {successResponse.platform.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Ukuran Tim</span>
              <span className="font-bold text-slate-900">{successResponse.company_size} Orang</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Status</span>
              <span className="font-bold text-blue-600">{successResponse.status}</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="text-xs border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors"
            >
              Daftarkan Email Lain
            </Button>
          </div>
        </CardContent>
      ) : (
        /* Form View */
        <>
          <CardHeader className="p-6 sm:p-8 pb-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                <Sparkles className="w-3.5 h-3.5" />
                Private Beta Access
              </span>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Bot className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Gabung Waitlist Voice Bot
              </h2>
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 leading-relaxed">
              Bot cerdas yang otomatis bergabung ke ruang rapat virtual Anda, merekam audio secara
              real-time, dan menyusun ringkasan serta notulen instan.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 pt-2">
            <form noValidate onSubmit={handleSubmit} className="space-y-5" data-testid="waitlist-form">
              {/* Email Field */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="waitlist-email"
                  className="block text-xs font-bold text-slate-700 flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Kerja atau Pribadi</span>
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (clientError) setClientError(null);
                  }}
                  placeholder="nama@perusahaan.com"
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Platform Selector */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-slate-400" />
                  <span>Platform Rapat Utama</span>
                </label>
                <Select value={platform} onValueChange={setPlatform} disabled={isLoading}>
                  <SelectTrigger className="w-full h-10 text-sm border-slate-200 bg-white">
                    <SelectValue placeholder="Pilih platform rapat" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Company Size Selector */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Jumlah Anggota Tim / Perusahaan</span>
                </label>
                <Select value={companySize} onValueChange={setCompanySize} disabled={isLoading}>
                  <SelectTrigger className="w-full h-10 text-sm border-slate-200 bg-white">
                    <SelectValue placeholder="Pilih ukuran tim" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Error Alert */}
              {clientError && (
                <div
                  data-testid="waitlist-error-alert"
                  className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{clientError}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-11 rounded-xl shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mendaftarkan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Minta Akses Beta</span>
                  </>
                )}
              </Button>

              {/* Security & Privacy Footnote */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tanpa komitmen biaya. Data Anda dijamin kerahasiaannya.</span>
              </div>
            </form>
          </CardContent>
        </>
      )}
    </Card>
  );
};
