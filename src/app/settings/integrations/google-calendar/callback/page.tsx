'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCalendarStore } from '@/stores/calendar.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

function GoogleCalendarCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handleCallback = useCalendarStore((s) => s.handleCallback);

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
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
          router.push('/settings?tab=integrations');
        }, 1500);
      })
      .catch((err: unknown) => {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to finalize Google Calendar connection');
      });
  }, [searchParams, handleCallback, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
            {status === 'error' && <AlertCircle className="h-6 w-6 text-destructive" />}
            Google Calendar Integration
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Connecting your Google account and syncing meeting schedule...'}
            {status === 'success' && 'Connection confirmed! Redirecting to settings...'}
            {status === 'error' && 'Encountered an issue during account connection.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === 'error' && (
            <>
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg text-left">
                {errorMessage}
              </div>
              <Button
                onClick={() => router.push('/settings?tab=integrations')}
                className="w-full"
              >
                Back to Settings
              </Button>
            </>
          )}
          {status === 'success' && (
            <p className="text-xs text-muted-foreground">
              Your calendar is now connected. Upcoming meetings with Google Meet and Zoom links will be auto-scheduled.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function GoogleCalendarCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <GoogleCalendarCallbackContent />
    </Suspense>
  );
}

