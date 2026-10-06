import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import RecordingProcessingPage from './page';
import { usePipelineStore } from '@/stores/pipeline.store';
import { RecordingStatus } from '@/server/constants';
import * as apiClient from '@/lib/api-client';

const mockPush = vi.fn();
let mockParams = { id: 'rec-123-abc' };

const mockRouter = { push: mockPush };

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => mockParams,
}));

class MockEventSource {
  url: string;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 1;
  static instances: MockEventSource[] = [];

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close = vi.fn(() => {
    this.readyState = 2;
  });

  emitMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  emitError() {
    if (this.onerror) {
      this.onerror();
    }
  }
}

describe('RecordingProcessingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.instances = [];
    (global as unknown as { EventSource: typeof MockEventSource }).EventSource = MockEventSource;
    usePipelineStore.getState().resetPipeline();
    mockParams = { id: 'rec-123-abc' };

    // Default mock for recording detail API fetch
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url.includes('/api/recordings/rec-123-abc/retry')) {
        return {
          status: 'SUCCESS',
          code: 'OK',
          message: 'Retry initiated',
          data: {
            id: 'rec-123-abc',
            status: RecordingStatus.TRANSCRIBING,
            stage: 'transcription',
            message: 'Pipeline resumed',
            updated_at: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        } as never;
      }

      return {
        status: 'SUCCESS',
        code: 'OK',
        message: 'Success',
        data: {
          id: 'rec-123-abc',
          title: 'Weekly Sync Engineering',
          status: RecordingStatus.PENDING,
          created_at: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      } as never;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial state with title, ID badge, and pipeline stepper', async () => {
    render(<RecordingProcessingPage />);

    expect(screen.getByTestId('processing-page-container')).toBeInTheDocument();
    expect(screen.getByTestId('recording-id-badge')).toHaveTextContent('ID: rec-123-abc');
    expect(screen.getByTestId('back-to-home-link')).toHaveAttribute('href', '/');

    await waitFor(() => {
      expect(screen.getByTestId('recording-title-display')).toHaveTextContent('Weekly Sync Engineering');
    });

    expect(screen.getByTestId('pipeline-stepper-container')).toBeInTheDocument();
  });

  it('initiates EventSource connection to the progress endpoint', async () => {
    render(<RecordingProcessingPage />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1);
    });

    const es = MockEventSource.instances[0];
    expect(es.url).toBe('/api/recordings/rec-123-abc/progress');
  });

  it('updates stepper progress when SSE message arrives', async () => {
    render(<RecordingProcessingPage />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1);
    });

    const es = MockEventSource.instances[0];

    act(() => {
      es.emitMessage({

        status: RecordingStatus.TRANSCRIBING,
        stage: 'transcription',
        progress: 60,
        message: 'Mentranskripsi ujaran pembicara...',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('pipeline-current-message')).toHaveTextContent('Mentranskripsi ujaran pembicara...');
      expect(screen.getByTestId('progress-percentage-badge')).toHaveTextContent('60%');
    });
  });

  it('handles COMPLETED event and automatically redirects to recording review', async () => {
    render(<RecordingProcessingPage />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1);
    });

    const es = MockEventSource.instances[0];

    act(() => {
      es.emitMessage({
        status: RecordingStatus.COMPLETED,
        stage: 'completed',
        progress: 100,
        message: 'Pemrosesan rekaman selesai',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('pipeline-headline')).toHaveTextContent('Pemrosesan Selesai');
      expect(es.close).toHaveBeenCalled();
    });

    // Wait for redirect transition
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/recordings/rec-123-abc');
      },
      { timeout: 2000 }
    );
  });

  it('handles FAILED event, mounts error card, and allows retry', async () => {
    render(<RecordingProcessingPage />);

    // Ensure initial API fetch is resolved
    await waitFor(() => {
      expect(screen.getByTestId('recording-title-display')).toHaveTextContent('Weekly Sync Engineering');
      expect(MockEventSource.instances.length).toBe(1);
    });

    const es = MockEventSource.instances[0];

    act(() => {
      es.emitMessage({
        status: RecordingStatus.FAILED,
        stage: 'failed',
        progress: 45,
        message: 'Gagal mentranskripsi audio',
        errorCode: 'ERR_TRANSCRIPTION_FAILED',
        errorMessage: 'Koneksi ke mesin transkripsi AI terputus',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('pipeline-headline')).toHaveTextContent('Pemrosesan Terhenti');
    });

    expect(screen.getByTestId('pipeline-error-card')).toBeInTheDocument();
    expect(
      screen.getAllByText(/Koneksi ke mesin transkripsi AI terputus/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(es.close).toHaveBeenCalled();

    // Click retry button on error card
    const retryBtn = screen.getByTestId('retry-stage-button');
    expect(retryBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(retryBtn);
    });

    // Verify retry API call and new SSE instance created
    await waitFor(() => {
      expect(apiClient.apiFetch).toHaveBeenCalledWith(
        '/api/recordings/rec-123-abc/retry',
        { method: 'POST' }
      );
      expect(MockEventSource.instances.length).toBe(2);
    });
  });

  it('redirects directly if initial detail is already COMPLETED', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: 'SUCCESS',
      code: 'OK',
      message: 'Already completed',
      data: {
        id: 'rec-123-abc',
        title: 'Already Completed Recording',
        status: RecordingStatus.COMPLETED,
        created_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    } as never);

    render(<RecordingProcessingPage />);

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/recordings/rec-123-abc');
      },
      { timeout: 1500 }
    );
  });
});
