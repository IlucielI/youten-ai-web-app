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
    <Card className="border-border/70 shadow-lg bg-card/90 backdrop-blur-sm" data-testid="reset-password-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight" data-testid="reset-password-title">
          Atur Ulang Kata Sandi
        </CardTitle>
        <CardDescription>
          Masukkan kata sandi baru Anda untuk mengamankan akun.
        </CardDescription>
      </CardHeader>

      {isSuccess ? (
        <CardContent className="space-y-4">
          <div
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300 flex items-start gap-3"
            data-testid="reset-success-alert"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Kata Sandi Berhasil Diperbarui!</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kata sandi baru Anda telah berhasil disimpan. Silakan masuk menggunakan kata sandi baru Anda.
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Link href="/login" className="w-full inline-block">
              <Button className="w-full h-10 font-semibold" data-testid="to-login-btn">
                Masuk ke Akun Sekarang
              </Button>
            </Link>
          </div>
        </CardContent>
      ) : (
        <form noValidate onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive" data-testid="auth-error-alert" className="py-2.5">
                <AlertDescription className="text-xs font-medium">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="reset-token">Token Pemulihan</Label>
              <Input
                id="reset-token"
                type="text"
                placeholder="Masukkan kode token pemulihan"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isLoading}
                required
                data-testid="reset-token-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-new-password">Kata Sandi Baru</Label>
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
                  className="pr-10"
                  data-testid="reset-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full h-10 font-semibold"
              disabled={isLoading}
              data-testid="reset-submit-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan Kata Sandi...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Simpan Kata Sandi Baru
                </>
              )}
            </Button>

            <Link
              href="/login"
              className="text-center text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
              data-testid="to-login-link"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
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
        <Card className="border-border/70 shadow-lg p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </Card>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
