'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
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
import { YoutenLogo } from '@/components/atoms/youten-logo';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setErrorMessage('Token pemulihan kata sandi diperlukan.');
      return;
    }

    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      setErrorMessage('Kata sandi baru minimal 8 karakter dan harus mengandung setidaknya 1 angka.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await apiFetch<BaseResponse>('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          new_password: newPassword,
        }),
      });

      setIsSuccess(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal mengatur ulang kata sandi. Tautan mungkin telah kedaluwarsa.';
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className="border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 transition-all"
      data-testid="reset-password-card"
    >
      <CardHeader className="p-0 space-y-2 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400 shadow-xs">
          <YoutenLogo size="md" />
        </div>
        <CardTitle
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          data-testid="reset-password-title"
        >
          Atur Ulang Kata Sandi
        </CardTitle>
        <CardDescription className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          Masukkan kata sandi baru Anda untuk mengamankan akun.
        </CardDescription>
      </CardHeader>

      {isSuccess ? (
        <CardContent className="p-0 space-y-5 pt-2">
          <div
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-800 dark:text-emerald-300 flex items-start gap-3.5"
            data-testid="reset-success-alert"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div className="space-y-1.5 text-sm">
              <p className="font-bold text-base">Kata Sandi Berhasil Diperbarui!</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Kata sandi baru Anda telah berhasil disimpan. Silakan masuk menggunakan kata sandi baru Anda.
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Link href="/login" className="w-full inline-block">
              <Button
                className="w-full h-12 text-sm sm:text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer"
                data-testid="to-login-btn"
              >
                Masuk ke Akun Sekarang
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
              <Label htmlFor="reset-token" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                Token Pemulihan
              </Label>
              <Input
                id="reset-token"
                type="text"
                placeholder="Masukkan kode token pemulihan"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isLoading}
                required
                className="h-12 text-sm sm:text-base px-4 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all placeholder:text-slate-400"
                data-testid="reset-token-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-new-password" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                Kata Sandi Baru
              </Label>
              <div className="relative">
                <Input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 8 karakter & 1 angka"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="new-password"
                  className="h-12 text-sm sm:text-base px-4 pr-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all placeholder:text-slate-400"
                  data-testid="reset-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.
              </p>
            </div>
          </CardContent>

          <CardFooter className="p-0 flex flex-col gap-5 pt-6 pb-0">
            <Button
              type="submit"
              className="w-full h-12 text-sm sm:text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer"
              disabled={isLoading}
              data-testid="reset-submit-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Menyimpan Kata Sandi...
                </>
              ) : (
                <>
                  <KeyRound className="w-5 h-5 mr-2" />
                  Simpan Kata Sandi Baru
                </>
              )}
            </Button>

            <Link
              href="/login"
              className="text-center text-xs sm:text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors font-medium"
              data-testid="to-login-link"
            >
              <ArrowLeft className="w-4 h-4" />
              Batal dan kembali ke masuk
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card className="border border-slate-200/90 shadow-2xl shadow-slate-900/5 bg-white/95 backdrop-blur-md rounded-3xl p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </Card>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
