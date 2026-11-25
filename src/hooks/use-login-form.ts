import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { AuthResponse, UserProfileResponse } from '@/server/dtos/auth.dto';
import { claimGuestRecordings, claimSingleRecording } from '@/lib/claim';
import { useTokenStore } from '@/stores/token.store';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/locales';

function getSafeRedirectUrl(target: string | null | undefined, fallback = '/dashboard'): string {
  if (target && target.startsWith('/') && !target.startsWith('//')) {
    return target;
  }
  return fallback;
}

export function useLoginForm() {
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
    const user = useAuthStore.getState().user;
    if (user) {
      const destination = getSafeRedirectUrl(
        searchParams.get('redirect') || searchParams.get('from'),
        '/dashboard'
      );
      if (typeof router.replace === 'function') {
        router.replace(destination);
      } else {
        router.push(destination);
      }
    }
  }, [router, searchParams]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
          useTokenStore.getState().clearAnonSession();

          if (response.data?.user) {
            useAuthStore.getState().setUser(response.data.user as unknown as UserProfileResponse);
          }

          await claimGuestRecordings();

          if (claimId) {
            await claimSingleRecording(claimId);
            router.push(`/recordings/${claimId}`);
          } else {
            const rawRedirect = searchParams.get('redirect') || searchParams.get('from');
            const safeDestination = getSafeRedirectUrl(rawRedirect, '/');
            router.push(safeDestination);
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
          (err instanceof ApiClientError &&
            (err.code === 'ERR_EMAIL_NOT_VERIFIED' ||
              (err.details as Record<string, unknown>)?.code === 'ERR_EMAIL_NOT_VERIFIED')) ||
          (err instanceof Error &&
            (err.message.toLowerCase().includes('not been verified') ||
              err.message.toLowerCase().includes('belum diverifikasi')));

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
    },
    [email, password, claimId, locale, router, searchParams, t]
  );

  return {
    t,
    locale,
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
  };
}
