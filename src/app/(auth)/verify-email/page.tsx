'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
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
import { ApiResponse } from '@/server/dtos/response.dto';
import { AuthResponse, UserProfileResponse } from '@/server/dtos/auth.dto';
import { claimGuestRecordings, claimSingleRecording } from '@/lib/claim';
import { useTokenStore } from '@/stores/token.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawToken = searchParams.get('token');
  const initialEmail = searchParams.get('email') || '';
  const claimId = searchParams.get('claim');

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(Boolean(rawToken));
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Magic link auto-verification when ?token= query param is present
  useEffect(() => {
    if (!rawToken) return;

    let isMounted = true;
    const verifyMagicToken = async () => {
      setIsVerifyingToken(true);
      setErrorMessage(null);
      try {
        const response = await apiFetch<ApiResponse<AuthResponse>>('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: rawToken.trim() }),
        });

        if (response && response.status === 'success' && response.data) {
          if (!isMounted) return;
          setIsSuccess(true);
          toast.success('Email berhasil diverifikasi!');

          // Update auth store and clear guest session
          useTokenStore.getState().clearAnonSession();
          if (response.data.user) {
            useAuthStore.getState().setUser(response.data.user as unknown as UserProfileResponse);
          }

          // Auto-claim recordings
          await claimGuestRecordings();
          if (claimId) {
            await claimSingleRecording(claimId);
          }

          setTimeout(() => {
            if (claimId) {
              router.push(`/recordings/${claimId}`);
            } else {
              router.push('/dashboard');
            }
          }, 1500);
        } else {
          if (!isMounted) return;
          setErrorMessage(
            response?.message || 'Tautan verifikasi tidak valid atau telah kedaluwarsa.'
          );
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Tautan verifikasi tidak valid atau telah kedaluwarsa.';
        setErrorMessage(msg);
      } finally {
        if (isMounted) {
          setIsVerifyingToken(false);
        }
      }
    };

    verifyMagicToken();
    return () => {
      isMounted = false;
    };
  }, [rawToken, router, claimId]);

  // Handle digit inputs
  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric characters
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    const char = cleanValue.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = char;
    setDigits(nextDigits);

    // Auto-focus next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits are filled, auto-submit
    if (index === 5 || nextDigits.every((d) => d !== '')) {
      const fullCode = nextDigits.join('');
      if (fullCode.length === 6 && email.trim()) {
        handleSubmitCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const nextDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = pastedData[i] || '';
    }
    setDigits(nextDigits);

    const targetFocusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[targetFocusIndex]?.focus();

    if (pastedData.length === 6 && email.trim()) {
      handleSubmitCode(pastedData);
    }
  };

  const handleSubmitCode = async (codeToSubmit?: string) => {
    const code = codeToSubmit || digits.join('');
    if (code.length !== 6) {
      setErrorMessage('Mohon masukkan 6 digit kode verifikasi dengan lengkap.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Mohon masukkan alamat email Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiFetch<ApiResponse<AuthResponse>>('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code,
        }),
      });

      if (response && response.status === 'success' && response.data) {
        setIsSuccess(true);
        toast.success('Email berhasil diverifikasi!');

        useTokenStore.getState().clearAnonSession();
        if (response.data.user) {
          useAuthStore.getState().setUser(response.data.user as unknown as UserProfileResponse);
        }

        await claimGuestRecordings();
        if (claimId) {
          await claimSingleRecording(claimId);
        }

        setTimeout(() => {
          if (claimId) {
            router.push(`/recordings/${claimId}`);
          } else {
            router.push('/dashboard');
          }
        }, 1500);
      } else {
        setErrorMessage(
          response?.message || 'Kode verifikasi tidak valid atau telah kedaluwarsa.'
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Kode verifikasi tidak valid atau telah kedaluwarsa.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim() || resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage(null);

    try {
      const res = await apiFetch<ApiResponse<null>>('/api/auth/verify-email/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res && (res.status === 'success' || (res.status as string) === 'SUCCESS')) {
        toast.success('Kode verifikasi baru telah dikirim ke email Anda.');
        setResendCooldown(60);
      } else {
        setErrorMessage(res?.message || 'Gagal mengirim ulang kode verifikasi.');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal mengirim ulang kode verifikasi.';
      setErrorMessage(msg);
    } finally {
      setIsResending(false);
    }
  };

  // State: Token verification loading
  if (isVerifyingToken) {
    return (
      <Card
        className="border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 text-center transition-all"
        data-testid="verify-email-loading-card"
      >
        <CardHeader className="p-0 space-y-3 pb-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Memverifikasi Email...
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
            Mohon tunggu sebentar, kami sedang memvalidasi token verifikasi Anda.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // State: Verification Success
  if (isSuccess) {
    return (
      <Card
        className="border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 text-center transition-all"
        data-testid="verify-email-success-card"
      >
        <CardHeader className="p-0 space-y-3 pb-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Email Berhasil Diverifikasi!
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
            Akun Anda kini telah aktif sepenuhnya. Mengalihkan Anda ke dashboard...
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-2 flex justify-center">
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full sm:w-auto px-8"
          >
            Buka Dashboard <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // State: Code input form
  return (
    <Card
      className="border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 transition-all"
      data-testid="verify-email-card"
    >
      <CardHeader className="p-0 space-y-2 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400 shadow-xs">
          <Mail className="w-7 h-7" />
        </div>
        <CardTitle
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          data-testid="verify-email-title"
        >
          Verifikasi Email Anda
        </CardTitle>
        <CardDescription className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          Masukkan 6 digit kode OTP yang telah dikirimkan ke kotak masuk email Anda.
        </CardDescription>
      </CardHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitCode();
        }}
      >
        <CardContent className="p-0 space-y-6">
          {errorMessage && (
            <Alert
              variant="destructive"
              data-testid="verify-email-error"
              className="py-3 px-4 rounded-xl"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm font-medium">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Email field if not prefilled or editable */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="verify-email" className="text-xs sm:text-sm font-semibold">
                Alamat Email
              </Label>
            </div>
            <Input
              id="verify-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@perusahaan.com"
              disabled={isLoading || isResending}
              className="h-11 rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-sm"
              data-testid="verify-email-input"
            />
          </div>

          {/* 6-Digit OTP Code Inputs */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-semibold block text-center sm:text-left">
              Kode Verifikasi (6 Digit)
            </Label>
            <div
              className="flex items-center justify-between gap-1.5 sm:gap-2.5"
              data-testid="otp-inputs-container"
            >
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  disabled={isLoading}
                  className="w-11 h-13 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono tracking-widest rounded-xl border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-slate-50/80 dark:bg-slate-950/80 text-slate-900 dark:text-white transition-all outline-none"
                  data-testid={`otp-digit-${idx}`}
                  autoFocus={idx === 0}
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || digits.join('').length !== 6 || !email.trim()}
            className="w-full h-12 text-sm sm:text-base font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            data-testid="verify-submit-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                Verifikasi Email Saya <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          {/* Resend section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <span>Tidak menerima kode?</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending || !email.trim()}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto cursor-pointer"
              data-testid="resend-verification-button"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Mengirim...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Kirim ulang dalam {resendCooldown}s
                </>
              ) : (
                'Kirim Ulang Kode'
              )}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="p-0 pt-6 flex flex-col gap-3 text-center border-t border-slate-100 dark:border-slate-800/80 mt-6">
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Sudah selesai verifikasi?{' '}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              data-testid="back-to-login-link"
            >
              Masuk ke akun Anda
            </Link>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">
            Bukan email Anda?{' '}
            <Link
              href="/register"
              className="underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Daftar dengan email lain
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
