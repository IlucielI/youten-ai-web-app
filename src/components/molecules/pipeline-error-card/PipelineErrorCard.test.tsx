import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PipelineErrorCard } from './PipelineErrorCard';
import { PipelineErrorCode } from '@/server/constants';
import { useLocaleStore } from '@/stores/locale.store';

describe('PipelineErrorCard Component', () => {
  beforeEach(() => {
    useLocaleStore.getState().setLocale('id');
  });

  it('renders default error information when no errorCode is passed', () => {
    render(<PipelineErrorCard errorMessage="Gagal memproses pipeline" />);

    expect(screen.getByTestId('error-card-title').textContent).toBe('Pemrosesan Rekaman Terkendala');
    expect(screen.getByTestId('error-card-description').textContent).toBe('Gagal memproses pipeline');
  });

  it('renders taxonomy details for ERR_AUDIO_CORRUPT and hides retry button', () => {
    render(
      <PipelineErrorCard
        errorCode={PipelineErrorCode.ERR_AUDIO_CORRUPT}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByTestId('error-code-badge').textContent).toBe(PipelineErrorCode.ERR_AUDIO_CORRUPT);
    expect(screen.getByTestId('error-card-title').textContent).toBe('Berkas Audio Tidak Valid atau Rusak');
    // Cannot retry corrupt audio
    expect(screen.queryByTestId('retry-stage-button')).toBeNull();
  });

  it('renders retry button for retryable errors and calls onRetry on click', async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);

    render(
      <PipelineErrorCard
        errorCode={PipelineErrorCode.ERR_TRANSCRIPTION_FAILED}
        onRetry={onRetry}
      />
    );

    const retryBtn = screen.getByTestId('retry-stage-button');
    expect(retryBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(retryBtn);
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('handles 409 conflict error message gracefully', async () => {
    const onRetry = vi.fn().mockRejectedValue(new Error('HTTP 409 Conflict'));

    render(
      <PipelineErrorCard
        errorCode={PipelineErrorCode.ERR_SUMMARIZATION_FAILED}
        onRetry={onRetry}
      />
    );

    const retryBtn = screen.getByTestId('retry-stage-button');
    await act(async () => {
      fireEvent.click(retryBtn);
    });

    const conflictAlert = await screen.findByTestId('retry-conflict-alert');
    expect(conflictAlert.textContent).toContain('Pipeline sedang diproses kembali');
  });

  it('renders error title and retry button in English when locale is en', () => {
    useLocaleStore.getState().setLocale('en');

    render(
      <PipelineErrorCard
        errorCode={PipelineErrorCode.ERR_TRANSCRIPTION_FAILED}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByTestId('error-card-title').textContent).toBe('Speech-to-Text Transcription Issue');
    expect(screen.getByTestId('retry-stage-button').textContent).toContain('Retry from Last Stage');
  });

  it('renders taxonomy details for ERR_GDRIVE_ACCESS_DENIED and disables retry', () => {
    render(
      <PipelineErrorCard
        errorCode={PipelineErrorCode.ERR_GDRIVE_ACCESS_DENIED}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByTestId('error-code-badge').textContent).toBe(PipelineErrorCode.ERR_GDRIVE_ACCESS_DENIED);
    expect(screen.getByTestId('error-card-title').textContent).toBe('Akses Google Drive Ditolak / Berkas Privat');
    expect(screen.getByTestId('error-card-description').textContent).toContain('Siapa saja yang memiliki link');
    expect(screen.queryByTestId('retry-stage-button')).toBeNull();
  });

  it('sanitizes raw vendor error messages from appearing in technical block', () => {
    render(
      <PipelineErrorCard
        errorMessage='stt transcription failed: primary STT (groq/whisper-large-v3) failed: stt api returned status 400: {"error":{"message":"could not process file - is it a valid media file?","code":400}}'
      />
    );

    expect(screen.getByTestId('error-card-description').textContent).not.toContain('groq');
    expect(screen.getByTestId('error-card-description').textContent).not.toContain('whisper-large-v3');
    expect(screen.getByTestId('error-card-description').textContent).toContain('The media file could not be processed');
  });
});
