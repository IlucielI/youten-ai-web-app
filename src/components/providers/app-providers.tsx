'use client';

import * as React from 'react';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/atoms/tooltip';
import { Toaster } from '@/components/atoms/sonner';
import { useAuthStore } from '@/stores/auth.store';

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
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
