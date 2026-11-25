import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { AuthResponse } from '@/server/dtos/auth.dto';
import { useTokenStore } from '@/stores/token.store';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/locales';
import { toast } from 'sonner';

function getSafeRedirectUrl(target: string | null | undefined, fallback = '/dashboard'): string {
  if (target && target.startsWith('/') && !target.startsWith('//')) {
    return target;
  }
  return fallback;
}

export function useRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimId = searchParams.get('claim');
  const { t } = useTranslation();

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
      if (!fullName.trim() || !email.trim() || !password) {
        setErrorMessage(t('auth.register.fillRequired'));
        return;
      }

      if (password.length < 8 || !/\d/.test(password)) {
        setErrorMessage(t('auth.register.passwordComplexity'));
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
          toast.success(t('auth.register.registrationSuccess'));
          const redirectUrl = `/verify-email?email=${encodeURIComponent(email.trim())}${
            claimId ? `&claim=${claimId}` : ''
          }`;
          router.push(redirectUrl);
        } else {
          setErrorMessage(response?.message || t('auth.register.registrationFailed'));
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : t('auth.register.registrationFailed');
        setErrorMessage(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [fullName, email, password, claimId, router, t]
  );

  return {
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
  };
}
