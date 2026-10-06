'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
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
    <Card className="border-border/70 shadow-lg bg-card/90 backdrop-blur-sm" data-testid="forgot-password-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight" data-testid="forgot-password-title">
          Lupa Kata Sandi
        </CardTitle>
        <CardDescription>
          Masukkan alamat email Anda untuk menerima instruksi pemulihan kata sandi.
        </CardDescription>
      </CardHeader>

      {isSubmitted ? (
        <CardContent className="space-y-4">
          <div
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300 flex items-start gap-3"
            data-testid="forgot-success-alert"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Tautan Pemulihan Dikirim!</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kami telah mengirimkan tautan untuk mengatur ulang kata sandi ke{' '}
                <span className="font-medium text-foreground">{email}</span> jika terdaftar di sistem kami.
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Link href="/login" className="w-full inline-block">
              <Button variant="outline" className="w-full" data-testid="back-to-login-btn">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Masuk
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
              <Label htmlFor="forgot-email">Email Terdaftar</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
                data-testid="forgot-email-input"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full h-10 font-semibold"
              disabled={isLoading}
              data-testid="forgot-submit-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengirim Instruksi...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Kirim Instruksi Reset
                </>
              )}
            </Button>

            <Link
              href="/login"
              className="text-center text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
              data-testid="to-login-link"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke halaman masuk
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
