import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCalendarStore } from '@/stores/calendar.store';
import { toast } from 'sonner';

export type CalendarCallbackStatus = 'processing' | 'success' | 'error';

export function useCalendarCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handleCallback = useCalendarStore((s) => s.handleCallback);

  const [status, setStatus] = useState<CalendarCallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setErrorMessage(`Google authorization denied: ${errorParam}`);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setErrorMessage('Missing authorization code or state parameter from Google OAuth.');
      return;
    }

    handleCallback(code, state)
      .then(() => {
        setStatus('success');
        toast.success('Google Calendar successfully connected!');
        setTimeout(() => {
          router.push('/settings');
        }, 1500);
      })
      .catch((err: unknown) => {
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Failed to finalize Google Calendar connection'
        );
      });
  }, [searchParams, handleCallback, router]);

  return {
    router,
    status,
    errorMessage,
  };
}

