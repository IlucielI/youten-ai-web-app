'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { YoutenLogo } from '@/components/atoms/youten-logo';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/atoms/card';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Button } from '@/components/atoms/button';
import { Alert, AlertDescription } from '@/components/atoms/alert';
import { apiFetch } from '@/lib/api-client';
import { BaseResponse } from '@/server/dtos/response.dto';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Mohon masukkan alamat email Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await apiFetch<BaseResponse>('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      setIsSubmitted(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal mengirim instruksi reset kata sandi.';
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className="border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 transition-all"
      data-testid="forgot-password-card"
    >
      <CardHeader className="p-0 space-y-2 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400 shadow-xs">
          <YoutenLogo size="md" />
        </div>
        <CardTitle
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          data-testid="forgot-password-title"
        >
          Lupa Kata Sandi
        </CardTitle>
        <CardDescription className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          Masukkan alamat email Anda untuk menerima instruksi pemulihan kata sandi.
        </CardDescription>
      </CardHeader>

      {isSubmitted ? (
        <CardContent className="p-0 space-y-5 pt-2">
          <div
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-800 dark:text-emerald-300 flex items-start gap-3.5"
            data-testid="forgot-success-alert"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div className="space-y-1.5 text-sm">
              <p className="font-bold text-base">Tautan Pemulihan Dikirim!</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Kami telah mengirimkan tautan untuk mengatur ulang kata sandi ke{' '}
                <span className="font-semibold text-slate-900 dark:text-white">{email}</span> jika terdaftar di sistem kami.
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Link href="/login" className="w-full inline-block">
              <Button
                variant="outline"
                className="w-full h-12 text-sm sm:text-base font-bold rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                data-testid="back-to-login-btn"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Masuk
              </Button>
            </Link>
          </div>
        </CardContent>
      ) : (
        <form noValidate onSubmit={handleSubmit}>
          <CardContent className="p-0 space-y-5">
            {errorMessage && (
              <Alert variant="destructive" data-testid="auth-error-alert" className="py-3 px-4 rounded-xl">
                <AlertDescription className="text-xs sm:text-sm font-medium">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                Email Terdaftar
              </Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
                className="h-12 text-sm sm:text-base px-4 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all placeholder:text-slate-400"
                data-testid="forgot-email-input"
              />
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 p-3.5 flex items-start gap-3">
              <span className="text-base select-none">💡</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pastikan alamat email sesuai dengan yang Anda daftarkan. Tautan pemulihan akan berlaku selama 15 menit demi keamanan akun Anda.
              </p>
            </div>
          </CardContent>

          <CardFooter className="p-0 flex flex-col gap-5 pt-6 pb-0">
            <Button
              type="submit"
              className="w-full h-12 text-sm sm:text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer"
              disabled={isLoading}
              data-testid="forgot-submit-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Mengirim Instruksi...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Kirim Instruksi Reset
                </>
              )}
            </Button>

            <Link
              href="/login"
              className="text-center text-xs sm:text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors font-medium"
              data-testid="to-login-link"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke halaman masuk
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
