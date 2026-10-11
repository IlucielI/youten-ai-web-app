'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { AuthResponse } from '@/server/dtos/auth.dto';
import { claimGuestRecordings, claimSingleRecording } from '@/lib/claim';
import { useTokenStore } from '@/stores/token.store';
import { useAuthStore } from '@/stores/auth.store';
import { YoutenLogo } from '@/components/atoms/youten-logo';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimId = searchParams.get('claim');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Prevent authenticated users from seeing the registration screen again
  useEffect(() => {
    const hasRedirect = searchParams.get('redirect') || searchParams.get('from');
    if (hasRedirect) {
      // If user was redirected to registration with a target query param, clear any stale user store state
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
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Mohon lengkapi seluruh formulir pendaftaran.');
      return;
    }

    if (password.length < 8 || !/\d/.test(password)) {
      setErrorMessage('Kata sandi minimal 8 karakter dan harus mengandung setidaknya 1 angka.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const anonToken = useTokenStore.getState().getAnonToken();
      const response = await apiFetch<ApiResponse<AuthResponse>>('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          anon_token: anonToken,
        }),
      });

      if (response && response.status === 'success') {
        // Clear anonymous session on successful registration
        useTokenStore.getState().clearAnonSession();

        // Auto-claim any guest recordings stored in localStorage
        await claimGuestRecordings();

        // If specific recording was requested via ?claim=<id>, claim it and navigate there
        if (claimId) {
          await claimSingleRecording(claimId);
          router.push(`/recordings/${claimId}`);
        } else {
          router.push('/');
        }
      } else {
        setErrorMessage(response?.message || 'Pendaftaran gagal. Silakan coba kembali.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kendala saat mendaftar.';
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className="border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 transition-all"
      data-testid="register-card"
    >
      <CardHeader className="p-0 space-y-2 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400 shadow-xs">
          <YoutenLogo size="md" />
        </div>
        <CardTitle
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          data-testid="register-title"
        >
          Mulai Gratis dengan Youten
        </CardTitle>
        <CardDescription className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          Buat akun untuk mencatat dan merangkum setiap rapat penting Anda.
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
              Nama Lengkap
            </Label>
            <Input
              id="register-name"
              type="text"
              placeholder="Bayu Anugerah"
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
              Email
            </Label>
            <Input
              id="register-email"
              type="email"
              placeholder="nama@perusahaan.com"
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
              Kata Sandi
            </Label>
            <div className="relative">
              <Input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 8 karakter & 1 angka"
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
            data-testid="register-submit-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Mendaftarkan Akun...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                Daftar Akun Baru
              </>
            )}
          </Button>

          <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Sudah memiliki akun?{' '}
            <Link
              href={claimId ? `/login?claim=${claimId}` : '/login'}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-1"
              data-testid="to-login-link"
            >
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Card className="border border-slate-200/90 shadow-2xl shadow-slate-900/5 bg-white/95 backdrop-blur-md rounded-3xl p-8" data-testid="register-card-loading">
          <div className="h-60 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </Card>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
