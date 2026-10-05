import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PipelineStepper } from './PipelineStepper';
import { RecordingStatus, PipelineErrorCode } from '@/server/constants';
import { usePipelineStore } from '@/stores/pipeline.store';

describe('PipelineStepper Component', () => {
  beforeEach(() => {
    usePipelineStore.getState().resetPipeline();
  });

  it('renders all 4 stages correctly during initial extraction', () => {
    render(
      <PipelineStepper
        status={RecordingStatus.EXTRACTING}
        progress={30}
        message="Mengekstrak track audio..."
      />
    );

    expect(screen.getByTestId('pipeline-step-extraction')).toBeDefined();
    expect(screen.getByTestId('pipeline-step-transcription')).toBeDefined();
    expect(screen.getByTestId('pipeline-step-intelligence')).toBeDefined();
    expect(screen.getByTestId('pipeline-step-completed')).toBeDefined();

    expect(screen.getByTestId('progress-percentage-badge').textContent).toBe('30%');
    expect(screen.getByTestId('pipeline-current-message').textContent).toBe('Mengekstrak track audio...');
  });

  it('highlights transcription stage when status is TRANSCRIBING', () => {
    render(
      <PipelineStepper
        status={RecordingStatus.TRANSCRIBING}
        progress={55}
        message="Mentranskripsikan suara pembicara..."
      />
    );

    const stepExtraction = screen.getByTestId('pipeline-step-extraction');
    const stepTranscription = screen.getByTestId('pipeline-step-transcription');

    // Extraction should be marked passed
    expect(stepExtraction.className).toContain('bg-emerald-500');
    // Transcription should be current active
    expect(stepTranscription.className).toContain('ring-2 ring-primary/20');
  });

  it('displays completion state when status is COMPLETED', () => {
    render(
      <PipelineStepper
        status={RecordingStatus.COMPLETED}
        progress={100}
        message="Semua tahapan selesai."
      />
    );

    expect(screen.getByTestId('pipeline-headline').textContent).toBe('Pemrosesan Selesai');
    expect(screen.getByTestId('progress-percentage-badge').textContent).toBe('100%');
    expect(screen.getByTestId('pipeline-step-completed').className).toContain('bg-emerald-500');
  });

  it('renders error card and retry button when pipeline status is FAILED', async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);

    render(
      <PipelineStepper
        status={RecordingStatus.FAILED}
        progress={60}
        errorCode={PipelineErrorCode.ERR_TRANSCRIPTION_FAILED}
        errorMessage="Speech service failure"
        onRetry={onRetry}
      />
    );

    expect(screen.getByTestId('pipeline-headline').textContent).toBe('Pemrosesan Terhenti');
    expect(screen.getByTestId('pipeline-error-card')).toBeDefined();

    const retryBtn = screen.getByTestId('retry-stage-button');
    await act(async () => {
      fireEvent.click(retryBtn);
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
