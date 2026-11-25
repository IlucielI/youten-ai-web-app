'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCalendarCallback } from '@/hooks/use-calendar-callback';

export const GoogleCalendarCallbackTemplate: React.FC = () => {
  const { router, status, errorMessage } = useCalendarCallback();

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
              <Button onClick={() => router.push('/settings')} className="w-full">
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
};

