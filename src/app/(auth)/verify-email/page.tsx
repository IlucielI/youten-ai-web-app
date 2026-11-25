'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { VerifyEmailTemplate } from '@/components/templates/auth';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <VerifyEmailTemplate />
    </Suspense>
  );
}
