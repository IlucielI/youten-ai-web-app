'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { RecordingDetailTemplate } from '@/components/templates/recording-detail';

export default function RecordingDetailPage() {
  const params = useParams();
  const recordingId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || '';

  return <RecordingDetailTemplate recordingId={recordingId} />;
}
