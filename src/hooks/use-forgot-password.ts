import { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';
import { BaseResponse } from '@/server/dtos/response.dto';
import { useTranslation } from '@/locales';

export function useForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim()) {
        setErrorMessage(t('auth.forgotPassword.fillRequired'));
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        await apiFetch<BaseResponse>('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });

        setIsSubmitted(true);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : t('auth.forgotPassword.errorFailed');
        setErrorMessage(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [email, t]
  );

  return {
    t,
    email,
    setEmail,
    isLoading,
    isSubmitted,
    errorMessage,
    handleSubmit,
  };
}

