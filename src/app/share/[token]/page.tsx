'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { SharedRecordingTemplate } from '@/components/templates/shared-recording';

/**
 * Public Read-Only Share Viewer Page.
 * Conforms to Thin Page Invariant (< 20 lines) by delegating to SharedRecordingTemplate.
 */
export default function SharedRecordingPage() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';

  return <SharedRecordingTemplate token={token} />;
}
