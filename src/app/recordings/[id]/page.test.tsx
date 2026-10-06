import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecordingDetailPage from './page';
import * as apiClient from '@/lib/api-client';
import { RecordingStatus } from '@/server/constants';
import { usePlayerStore } from '@/stores/player.store';

const mockPush = vi.fn();
let mockParams = { id: 'rec-detail-123' };

const mockRouter = { push: mockPush };

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => mockParams,
}));

const mockRecordingData = {
  id: 'rec-detail-123',
  title: 'Sprint Planning Q4 & Product Roadmap',
  original_filename: 'sprint_planning.mp3',
  file_size_bytes: 15420000,
  duration_seconds: 185,
  audio_url: 'https://cdn.example.com/audio/sprint_planning.mp3',
  playback_url: 'https://cdn.example.com/audio/sprint_planning.mp3',
  source_type: 'UPLOAD',
  status: RecordingStatus.COMPLETED,
  selected_template: 'GENERAL',
  output_language: 'id',
  is_guest: true,
  consent_given: true,
  consent_version: 'v1.0',
  created_at: '2026-10-06T09:00:00Z',
  updated_at: '2026-10-06T09:05:00Z',
  active_summary: {
    id: 'sum-ver-1',
    recording_id: 'rec-detail-123',
    version: 1,
    template_category: 'GENERAL',
    structured_data: {
      executive_summary: 'Tim menyepakati fokus Q4 pada skalabilitas pipeline dan optimasi latensi.',
      key_takeaways: ['Migrasi SSE progress telah rampung', 'Optimasi Redis caching diterapkan'],
    },
    markdown_content: '# Ringkasan Eksekutif\nFokus Q4 disepakati pada skalabilitas.',
    created_at: '2026-10-06T09:05:00Z',
  },
  segments: [
    {
      id: 'seg-1',
      recording_id: 'rec-detail-123',
      speaker_id: 'speaker_0',
      start_time: 0,
      end_time: 12.5,
      text: 'Selamat pagi rekan-rekan, mari kita mulai agenda perencanaan sprint.',
      words: [
        { word: 'Selamat', start_time: 0, end_time: 1.0 },
        { word: 'pagi', start_time: 1.1, end_time: 2.0 },
      ],
    },
    {
      id: 'seg-2',
      recording_id: 'rec-detail-123',
      speaker_id: 'speaker_1',
      start_time: 13.0,
      end_time: 25.0,
      text: 'Dari sisi backend, arsitektur SSE progress sudah selesai diuji dan siap diintegrasikan.',
      words: [],
    },
  ],
  chapters: [
    {
      id: 'chap-1',
      recording_id: 'rec-detail-123',
      sequence_order: 1,
      start_time: 0,
      end_time: 120,
      title: 'Pembukaan & Penyelarasan Agenda',
      summary: 'Perkenalan dan tujuan utama dari pertemuan.',
    },
  ],
  highlights: [
    {
      id: 'hl-1',
      recording_id: 'rec-detail-123',
      start_time: 15,
      end_time: 25,
      title: 'Kesiapan Backend SSE',
      quote: 'Arsitektur SSE progress sudah selesai diuji.',
      importance_score: 95,
    },
  ],
  analytics_data: {
    total_duration_seconds: 185,
    total_words: 450,
    words_per_minute: 145,
    talk_ratio: { speaker_0: 0.6, speaker_1: 0.4 },
    speakers: [
      { speaker_id: 'speaker_0', speaker_name: 'speaker_0', duration_seconds: 110, percentage: 60, words_count: 270 },
      { speaker_id: 'speaker_1', speaker_name: 'speaker_1', duration_seconds: 75, percentage: 40, words_count: 180 },
    ],
  },
};

describe('RecordingDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePlayerStore.getState().resetPlayer();
    mockParams = { id: 'rec-detail-123' };

    vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
      status: 'SUCCESS',
      code: 'OK',
      message: 'Success',
      data: mockRecordingData,
      timestamp: new Date().toISOString(),
    } as never);
  });

  it('renders recording title, duration badge, and guest warning banner', async () => {
    render(<RecordingDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('recording-title')).toHaveTextContent(
        'Sprint Planning Q4 & Product Roadmap'
      );
    });

    expect(screen.getByTestId('guest-warning-banner')).toBeInTheDocument();
    expect(screen.getByTestId('claim-account-btn')).toBeInTheDocument();
    expect(screen.getByTestId('open-share-dialog-btn')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-chat-panel-btn')).toBeInTheDocument();
    expect(screen.getByTestId('sticky-audio-player-container')).toBeInTheDocument();
  });

  it('redirects to processing screen if recording status is not COMPLETED or FAILED', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: 'SUCCESS',
      code: 'OK',
      message: 'Processing',
      data: {
        ...mockRecordingData,
        status: RecordingStatus.TRANSCRIBING,
      },
      timestamp: new Date().toISOString(),
    } as never);

    render(<RecordingDetailPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/recordings/rec-detail-123/processing');
    });
  });

  it('renders summary tab by default and switches to other tabs on click', async () => {
    render(<RecordingDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('summary-tab-content')).toBeInTheDocument();
    });

    // Switch to Transcript Tab
    fireEvent.click(screen.getByTestId('tab-trigger-transcript'));
    expect(screen.getByTestId('transcript-tab-content')).toBeInTheDocument();
    expect(screen.getByTestId('transcript-segments-list')).toBeInTheDocument();
    expect(screen.getByText(/mari kita mulai agenda perencanaan sprint/i)).toBeInTheDocument();

    // Switch to Chapters & Highlights Tab
    fireEvent.click(screen.getByTestId('tab-trigger-chapters'));
    expect(screen.getByTestId('chapters-tab-content')).toBeInTheDocument();
    expect(screen.getByText('Pembukaan & Penyelarasan Agenda')).toBeInTheDocument();

    // Switch to Analytics Tab
    fireEvent.click(screen.getByTestId('tab-trigger-analytics'));
    expect(screen.getByTestId('analytics-tab-content')).toBeInTheDocument();
  });

  it('filters transcript segments based on search query', async () => {
    render(<RecordingDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('summary-tab-content')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-trigger-transcript'));

    const searchInput = screen.getByTestId('transcript-search-input');
    fireEvent.change(searchInput, { target: { value: 'backend' } });

    // Segment 2 matches 'backend', Segment 1 does not
    expect(screen.getByText(/arsitektur SSE progress sudah selesai/i)).toBeInTheDocument();
    expect(screen.queryByText(/mari kita mulai agenda perencanaan/i)).not.toBeInTheDocument();
  });

  it('toggles AI chat panel when Tanya AI button is clicked', async () => {
    render(<RecordingDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('recording-title')).toBeInTheDocument();
    });

    // Initially closed
    expect(screen.queryByTestId('recording-chat-panel')).not.toBeInTheDocument();

    // Click toggle button
    fireEvent.click(screen.getByTestId('toggle-chat-panel-btn'));
    expect(screen.getByTestId('recording-chat-panel')).toBeInTheDocument();

    // Click again to close
    fireEvent.click(screen.getByTestId('toggle-chat-panel-btn'));
    expect(screen.queryByTestId('recording-chat-panel')).not.toBeInTheDocument();
  });

  it('seeks audio player when a transcript segment is clicked', async () => {
    const seekSpy = vi.spyOn(usePlayerStore.getState(), 'seek');

    render(<RecordingDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('recording-title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-trigger-transcript'));

    // Find and click segment seek action
    const seekButtons = screen.getAllByRole('button', { name: /dengarkan segmen/i });
    if (seekButtons.length > 0) {
      fireEvent.click(seekButtons[0]);
      expect(seekSpy).toHaveBeenCalledWith(0);
    }
  });

  it('renders error view when recording fetch fails', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValueOnce(new Error('Network error'));

    render(<RecordingDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('recording-detail-error')).toBeInTheDocument();
      expect(screen.getByText(/Rekaman Tidak Ditemukan/i)).toBeInTheDocument();
    });
  });
});
