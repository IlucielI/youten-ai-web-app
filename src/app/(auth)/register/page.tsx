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
    <Card className="border-border/70 shadow-lg bg-card/90 backdrop-blur-sm" data-testid="register-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight" data-testid="register-title">
          Mulai Gratis dengan Youten
        </CardTitle>
        <CardDescription>
          Buat akun untuk mencatat dan merangkum setiap rapat penting Anda.
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
            <Label htmlFor="register-name">Nama Lengkap</Label>
            <Input
              id="register-name"
              type="text"
              placeholder="Bayu Anugerah"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="name"
              data-testid="register-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              type="email"
              placeholder="nama@perusahaan.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="email"
              data-testid="register-email-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password">Kata Sandi</Label>
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
                className="pr-10"
                data-testid="register-password-input"
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
            data-testid="register-submit-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mendaftarkan Akun...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Daftar Akun Baru
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Sudah memiliki akun?{' '}
            <Link
              href={claimId ? `/login?claim=${claimId}` : '/login'}
              className="text-primary font-semibold hover:underline"
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
        <Card className="border-border/70 shadow-lg bg-card/90 backdrop-blur-sm p-6" data-testid="register-card-loading">
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </Card>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
