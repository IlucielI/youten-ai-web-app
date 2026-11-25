'use client';

import React, { Suspense } from 'react';
import { Card } from '@/components/atoms/card';
import { Loader2 } from 'lucide-react';
import { LoginTemplate } from '@/components/templates/auth';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="border border-border shadow-2xl bg-card/95 text-card-foreground backdrop-blur-md rounded-3xl p-8" data-testid="login-card-loading">
          <div className="h-60 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </Card>
      }
    >
      <LoginTemplate />
    </Suspense>
  );
}
