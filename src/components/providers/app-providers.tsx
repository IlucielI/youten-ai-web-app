'use client';

import * as React from 'react';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/atoms/tooltip';
import { Toaster } from '@/components/atoms/sonner';
import { useAuthStore } from '@/stores/auth.store';
import { FeedbackButton } from '@/components/molecules/feedback-button';
import { FeedbackDialog } from '@/components/organisms/feedback-dialog';

export interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !useAuthStore.getState().isInitialized) {
      useAuthStore.getState().fetchUser();
    }
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={200}>
        {children}
        <FeedbackButton />
        <FeedbackDialog />
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
