import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { BaseResponse } from '@/server/dtos/response.dto';
import { useTranslation } from '@/locales';

export function useResetPassword() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const { t } = useTranslation();

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!token.trim()) {
        setErrorMessage(t('auth.resetPassword.tokenRequired'));
        return;
      }

      if (newPassword.length < 8 || !/\d/.test(newPassword)) {
        setErrorMessage(t('auth.resetPassword.passwordComplexity'));
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        await apiFetch<BaseResponse>('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token.trim(),
            new_password: newPassword,
          }),
        });

        setIsSuccess(true);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : t('auth.resetPassword.errorFailed');
        setErrorMessage(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [token, newPassword, t]
  );

  return {
    t,
    token,
    setToken,
    newPassword,
    setNewPassword,
    showPassword,
    setShowPassword,
    isLoading,
    isSuccess,
    errorMessage,
    handleSubmit,
  };
}

