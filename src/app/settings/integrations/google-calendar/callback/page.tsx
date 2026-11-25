'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { GoogleCalendarCallbackTemplate } from '@/components/templates/calendar';

export default function GoogleCalendarCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <GoogleCalendarCallbackTemplate />
    </Suspense>
  );
}
