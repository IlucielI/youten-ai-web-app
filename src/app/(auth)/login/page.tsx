'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, LogIn, ArrowRight, CheckCircle2, MailCheck } from 'lucide-react';
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
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { AuthResponse, UserProfileResponse } from '@/server/dtos/auth.dto';
import { claimGuestRecordings, claimSingleRecording } from '@/lib/claim';
import { useTokenStore } from '@/stores/token.store';
import { useAuthStore } from '@/stores/auth.store';
import { YoutenLogo } from '@/components/atoms/youten-logo';
import { useTranslation } from '@/locales';

function LoginForm() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const claimId = searchParams.get('claim');
  const isVerifiedParam = searchParams.get('verified') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);

  // Prevent authenticated users from seeing the login screen again
  useEffect(() => {
    const hasRedirect = searchParams.get('redirect') || searchParams.get('from');
    if (hasRedirect) {
      // If user was redirected to login with a target query param, clear any stale user store state
      useAuthStore.getState().setUser(null);
      return;
    }

    const user = useAuthStore.getState().user;
    if (user) {
      if (typeof router.replace === 'function') {
        router.replace('/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage(t('auth.login.fillRequired'));
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const anonToken = useTokenStore.getState().getAnonToken();
      const response = await apiFetch<ApiResponse<AuthResponse>>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          anon_token: anonToken,
        }),
      });

      if (response && response.status === 'success') {
        // Clear anonymous session on successful login
        useTokenStore.getState().clearAnonSession();

        // Update global auth store with logged-in user profile
        if (response.data?.user) {
          useAuthStore.getState().setUser(response.data.user as unknown as UserProfileResponse);
        }

        // Auto-claim any guest recordings stored in localStorage
        await claimGuestRecordings();

        // If specific recording was requested via ?claim=<id>, claim it and navigate there
        if (claimId) {
          await claimSingleRecording(claimId);
          router.push(`/recordings/${claimId}`);
        } else {
          const redirectTo = searchParams.get('redirect') || searchParams.get('from');
          router.push(redirectTo || '/');
        }
      } else {
        setErrorMessage(
          response?.message ||
            (locale === 'en'
              ? 'Failed to sign in. Please check your email and password.'
              : 'Gagal masuk. Periksa kembali email dan kata sandi Anda.')
        );
      }
    } catch (err: unknown) {
      const isUnverifiedErr =
        (err instanceof ApiClientError && (err.code === 'ERR_EMAIL_NOT_VERIFIED' || (err.details as Record<string, unknown>)?.code === 'ERR_EMAIL_NOT_VERIFIED')) ||
        (err instanceof Error && (err.message.toLowerCase().includes('not been verified') || err.message.toLowerCase().includes('belum diverifikasi')));

      if (isUnverifiedErr) {
        setIsUnverified(true);
        setErrorMessage(
          locale === 'en'
            ? 'Your account has not been verified yet. Please enter the 6-digit verification code from your email or click the button below.'
            : 'Akun Anda belum diverifikasi. Silakan masukkan kode verifikasi 6-digit dari email Anda atau klik tombol di bawah.'
        );
      } else {
        setIsUnverified(false);
        const errorMsg =
          err instanceof Error
            ? err.message
            : locale === 'en'
            ? 'Invalid email or password.'
            : 'Email atau kata sandi tidak sesuai.';
        setErrorMessage(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className="border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 transition-all"
      data-testid="login-card"
    >
      <CardHeader className="p-0 space-y-2 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400 shadow-xs">
          <YoutenLogo size="md" />
        </div>
        <CardTitle
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          data-testid="login-title"
        >
          {t('auth.login.title')}
        </CardTitle>
        <CardDescription className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('auth.login.subtitle')}
        </CardDescription>
      </CardHeader>

      <form noValidate onSubmit={handleSubmit}>
        <CardContent className="p-0 space-y-5">
          {isVerifiedParam && !errorMessage && !isUnverified && (
            <Alert className="py-3 px-4 rounded-xl border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription className="text-xs sm:text-sm font-medium">
                {t('auth.login.verifiedSuccess')}
              </AlertDescription>
            </Alert>
          )}

          {isUnverified ? (
            <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 space-y-3">
              <div className="flex items-start gap-3">
                <MailCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="text-xs sm:text-sm space-y-1">
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    {t('auth.login.unverifiedTitle')}
                  </p>
                  <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    {t('auth.login.unverifiedDesc', { email })}
                  </p>
                </div>
              </div>
              <Link
                href={`/verify-email?email=${encodeURIComponent(email.trim())}`}
                className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-[0.99]"
                data-testid="verify-email-cta-button"
              >
                {t('auth.login.verifyCta')}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          ) : errorMessage ? (
            <Alert variant="destructive" data-testid="auth-error-alert" className="py-3 px-4 rounded-xl">
              <AlertDescription className="text-xs sm:text-sm font-medium">
                {errorMessage}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              {t('auth.login.emailLabel')}
            </Label>
            <Input
              id="login-email"
              type="email"
              placeholder={t('auth.login.emailPlaceholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (isUnverified) setIsUnverified(false);
              }}
              required
              autoComplete="email"
              className="h-12 text-sm sm:text-base px-4 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all placeholder:text-slate-400"
              data-testid="login-email-input"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('auth.login.passwordLabel')}
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
                data-testid="forgot-password-link"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-12 text-sm sm:text-base px-4 pr-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all placeholder:text-slate-400"
                data-testid="login-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                data-testid="toggle-password-visibility"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-0 flex flex-col gap-5 pt-6 pb-0">
          <Button
            type="submit"
            className="w-full h-12 text-sm sm:text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer"
            disabled={isLoading}
            data-testid="login-submit-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t('auth.login.submitting')}
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                {t('auth.login.submitButton')}
              </>
            )}
          </Button>

          <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('auth.login.noAccount')}{' '}
            <Link
              href={claimId ? `/register?claim=${claimId}` : '/register'}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-1"
              data-testid="to-register-link"
            >
              {t('auth.login.registerLink')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="border border-slate-200/90 shadow-2xl shadow-slate-900/5 bg-white/95 backdrop-blur-md rounded-3xl p-8" data-testid="login-card-loading">
          <div className="h-60 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
