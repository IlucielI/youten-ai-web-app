'use client';

import React from 'react';
import Link from 'next/link';
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
import { YoutenLogo } from '@/components/atoms/youten-logo';
import { useLoginForm } from '@/hooks/use-login-form';

export const LoginTemplate: React.FC = () => {
  const {
    t,
    claimId,
    isVerifiedParam,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    errorMessage,
    isUnverified,
    setIsUnverified,
    handleSubmit,
  } = useLoginForm();

  return (
    <Card
      className="border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 transition-all"
      data-testid="login-card"
    >
      <CardHeader className="p-0 space-y-2 pb-6 text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400 shadow-xs">
          <YoutenLogo size="md" />
        </div>
        <CardTitle
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          data-testid="login-title"
        >
          {t('auth.login.title')}
        </CardTitle>
        <CardDescription className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
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
};

