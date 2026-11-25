'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
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
import { useRegisterForm } from '@/hooks/use-register-form';

export const RegisterTemplate: React.FC = () => {
  const {
    t,
    claimId,
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    errorMessage,
    handleSubmit,
  } = useRegisterForm();

  return (
    <Card
      className="border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 transition-all"
      data-testid="register-card"
    >
      <CardHeader className="p-0 space-y-2 pb-6 text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400 shadow-xs">
          <YoutenLogo size="md" />
        </div>
        <CardTitle
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          data-testid="register-title"
        >
          {t('auth.register.title')}
        </CardTitle>
        <CardDescription className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
          {t('auth.register.subtitle')}
        </CardDescription>
      </CardHeader>

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
            <Label htmlFor="register-name" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              {t('auth.register.fullNameLabel')}
            </Label>
            <Input
              id="register-name"
              type="text"
              placeholder={t('auth.register.fullNamePlaceholder')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="name"
              className="h-12 text-sm sm:text-base px-4 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all placeholder:text-slate-400"
              data-testid="register-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              {t('auth.register.emailLabel')}
            </Label>
            <Input
              id="register-email"
              type="email"
              placeholder={t('auth.register.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="email"
              className="h-12 text-sm sm:text-base px-4 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all placeholder:text-slate-400"
              data-testid="register-email-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              {t('auth.register.passwordLabel')}
            </Label>
            <div className="relative">
              <Input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.register.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="new-password"
                className="h-12 text-sm sm:text-base px-4 pr-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all placeholder:text-slate-400"
                data-testid="register-password-input"
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
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('auth.register.passwordHint')}
            </p>
          </div>
        </CardContent>

        <CardFooter className="p-0 flex flex-col gap-5 pt-6 pb-0">
          <Button
            type="submit"
            className="w-full h-12 text-sm sm:text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer"
            disabled={isLoading}
            data-testid="register-submit-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t('auth.register.submitting')}
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                {t('auth.register.submitButton')}
              </>
            )}
          </Button>

          <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('auth.register.hasAccount')}{' '}
            <Link
              href={claimId ? `/login?claim=${claimId}` : '/login'}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-1"
              data-testid="to-login-link"
            >
              {t('auth.register.loginLink')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};

