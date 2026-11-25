'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { RecordingProcessingTemplate } from '@/components/templates/recording-processing';

/**
 * Recording Processing Stepper Route Page.
 * Conforms strictly to the Thin Page Invariant (< 20 lines) by delegating presentation to RecordingProcessingTemplate.
 */
export default function RecordingProcessingPage() {
  const params = useParams();
  const recordingId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || '';

  return <RecordingProcessingTemplate recordingId={recordingId} />;
}
