'use client';

import React from 'react';
import Link from 'next/link';
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
import { useVerifyEmail } from '@/hooks/use-verify-email';

export const VerifyEmailTemplate: React.FC = () => {
  const {
    t,
    router,
    email,
    setEmail,
    digits,
    inputRefs,
    isLoading,
    isVerifyingToken,
    isSuccess,
    errorMessage,
    resendCooldown,
    isResending,
    handleDigitChange,
    handleKeyDown,
    handlePaste,
    handleSubmitCode,
    handleResend,
  } = useVerifyEmail();

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
            {t('auth.verification.verifyingTitle')}
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
            {t('auth.verification.verifyingDesc')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

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
            {t('auth.verification.successTitle')}
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
            {t('auth.verification.successDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-2 flex justify-center">
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full sm:w-auto px-8"
          >
            {t('auth.verification.openDashboard')} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 transition-all"
      data-testid="verify-email-card"
    >
      <CardHeader className="p-0 space-y-2 pb-6 text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400 shadow-xs">
          <Mail className="w-7 h-7" />
        </div>
        <CardTitle
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          data-testid="verify-email-title"
        >
          {t('auth.verification.title')}
        </CardTitle>
        <CardDescription className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
          {t('auth.verification.subtitle')}
        </CardDescription>
      </CardHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmitCode();
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="verify-email" className="text-xs sm:text-sm font-semibold">
                {t('auth.verification.emailLabel')}
              </Label>
            </div>
            <Input
              id="verify-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.verification.emailPlaceholder')}
              disabled={isLoading || isResending}
              className="h-11 rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-sm"
              data-testid="verify-email-input"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-semibold block text-center sm:text-left">
              {t('auth.verification.codeLabel')}
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
                {t('auth.verification.submitting')}
              </>
            ) : (
              <>
                {t('auth.verification.submitButton')} <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <span>{t('auth.verification.notReceived')}</span>
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
                  {t('auth.verification.resending')}
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  {t('auth.verification.resendCooldown', { seconds: resendCooldown })}
                </>
              ) : (
                t('auth.verification.resendButton')
              )}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="p-0 pt-6 flex flex-col gap-3 text-center border-t border-slate-100 dark:border-slate-800/80 mt-6">
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('auth.verification.alreadyDone')}{' '}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              data-testid="back-to-login-link"
            >
              {t('auth.verification.loginLink')}
            </Link>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">
            {t('auth.verification.notYourEmail')}{' '}
            <Link
              href="/register"
              className="underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {t('auth.verification.registerAnother')}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

