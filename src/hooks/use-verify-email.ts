import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { AuthResponse, UserProfileResponse } from '@/server/dtos/auth.dto';
import { claimGuestRecordings, claimSingleRecording } from '@/lib/claim';
import { useTokenStore } from '@/stores/token.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { useTranslation } from '@/locales';

export function useVerifyEmail() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawToken = searchParams.get('token');
  const initialEmail = searchParams.get('email') || '';
  const claimId = searchParams.get('claim');

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(Boolean(rawToken));
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Magic link auto-verification when ?token= query param is present
  useEffect(() => {
    if (!rawToken) return;

    let isMounted = true;
    const verifyMagicToken = async () => {
      setIsVerifyingToken(true);
      setErrorMessage(null);
      try {
        const response = await apiFetch<ApiResponse<AuthResponse>>('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: rawToken.trim() }),
        });

        if (response && response.status === 'success' && response.data) {
          if (!isMounted) return;
          setIsSuccess(true);
          toast.success(t('notifications.success.emailVerified'));

          useTokenStore.getState().clearAnonSession();
          if (response.data.user) {
            useAuthStore.getState().setUser(response.data.user as unknown as UserProfileResponse);
          }

          await claimGuestRecordings();
          if (claimId) {
            await claimSingleRecording(claimId);
          }

          setTimeout(() => {
            if (claimId) {
              router.push(`/recordings/${claimId}`);
            } else {
              router.push('/dashboard');
            }
          }, 1500);
        } else {
          if (!isMounted) return;
          setErrorMessage(response?.message || t('auth.verification.invalidOrExpiredToken'));
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg =
          err instanceof Error ? err.message : t('auth.verification.invalidOrExpiredToken');
        setErrorMessage(msg);
      } finally {
        if (isMounted) {
          setIsVerifyingToken(false);
        }
      }
    };

    verifyMagicToken();
    return () => {
      isMounted = false;
    };
  }, [rawToken, router, claimId, t]);

  const handleSubmitCode = useCallback(
    async (codeToSubmit?: string) => {
      const code = codeToSubmit || digits.join('');
      if (code.length !== 6) {
        setErrorMessage(t('auth.verification.codeIncomplete'));
        return;
      }

      if (!email.trim()) {
        setErrorMessage(t('auth.verification.emailRequired'));
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await apiFetch<ApiResponse<AuthResponse>>('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            code,
          }),
        });

        if (response && response.status === 'success' && response.data) {
          setIsSuccess(true);
          toast.success(t('notifications.success.emailVerified'));

          useTokenStore.getState().clearAnonSession();
          if (response.data.user) {
            useAuthStore.getState().setUser(response.data.user as unknown as UserProfileResponse);
          }

          await claimGuestRecordings();
          if (claimId) {
            await claimSingleRecording(claimId);
          }

          setTimeout(() => {
            if (claimId) {
              router.push(`/recordings/${claimId}`);
            } else {
              router.push('/dashboard');
            }
          }, 1500);
        } else {
          setErrorMessage(response?.message || t('auth.verification.invalidOrExpired'));
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : t('auth.verification.invalidOrExpired');
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [digits, email, claimId, router, t]
  );

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      const cleanValue = value.replace(/\D/g, '');
      if (!cleanValue) {
        const nextDigits = [...digits];
        nextDigits[index] = '';
        setDigits(nextDigits);
        return;
      }

      const char = cleanValue.slice(-1);
      const nextDigits = [...digits];
      nextDigits[index] = char;
      setDigits(nextDigits);

      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      if (index === 5 || nextDigits.every((d) => d !== '')) {
        const fullCode = nextDigits.join('');
        if (fullCode.length === 6 && email.trim()) {
          void handleSubmitCode(fullCode);
        }
      }
    },
    [digits, email, handleSubmitCode]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      if (!pastedData) return;

      const nextDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        nextDigits[i] = pastedData[i] || '';
      }
      setDigits(nextDigits);

      const targetFocusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[targetFocusIndex]?.focus();

      if (pastedData.length === 6 && email.trim()) {
        void handleSubmitCode(pastedData);
      }
    },
    [digits, email, handleSubmitCode]
  );

  const handleResend = useCallback(async () => {
    if (!email.trim() || resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage(null);

    try {
      const res = await apiFetch<ApiResponse<null>>('/api/auth/verify-email/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res && (res.status === 'success' || (res.status as string) === 'SUCCESS')) {
        toast.success(t('notifications.success.verificationCodeSent'));
        setResendCooldown(60);
      } else {
        setErrorMessage(res?.message || t('auth.verification.resendFailed'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.verification.resendFailed');
      setErrorMessage(msg);
    } finally {
      setIsResending(false);
    }
  }, [email, resendCooldown, isResending, t]);

  return {
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
  };
}

