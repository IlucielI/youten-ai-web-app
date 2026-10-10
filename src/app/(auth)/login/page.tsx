'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimId = searchParams.get('claim');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Prevent authenticated users from seeing the login screen again
  useEffect(() => {
    const user = useAuthStore.getState().user;
    if (user) {
      const redirectTo = searchParams.get('redirect') || searchParams.get('from');
      if (typeof router.replace === 'function') {
        router.replace(redirectTo || '/dashboard');
      } else {
        router.push(redirectTo || '/dashboard');
      }
    }
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Mohon isi alamat email dan kata sandi Anda.');
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
        setErrorMessage(response?.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Email atau kata sandi tidak sesuai.';
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/70 shadow-lg bg-card/90 backdrop-blur-sm" data-testid="login-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight" data-testid="login-title">
          Masuk ke Akun Anda
        </CardTitle>
        <CardDescription>
          Akses ringkasan notula cerdas dan transkripsi rekaman Anda.
        </CardDescription>
      </CardHeader>

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
            <Label htmlFor="login-email" className="text-xs font-semibold">
              Alamat Email
            </Label>
            <Input
              id="login-email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              data-testid="login-email-input"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" className="text-xs font-semibold">
                Kata Sandi
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary font-medium hover:underline"
                data-testid="forgot-password-link"
              >
                Lupa kata sandi?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
                data-testid="login-password-input"
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
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full h-10 font-semibold"
            disabled={isLoading}
            data-testid="login-submit-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Masuk Sekarang
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Belum memiliki akun?{' '}
            <Link
              href={claimId ? `/register?claim=${claimId}` : '/register'}
              className="text-primary font-semibold hover:underline"
              data-testid="to-register-link"
            >
              Daftar gratis
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
        <Card className="border-border/70 shadow-lg bg-card/90 backdrop-blur-sm p-6" data-testid="login-card-loading">
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
