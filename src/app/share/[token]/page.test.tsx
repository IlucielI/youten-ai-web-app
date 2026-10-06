import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SharedRecordingPage from './page';
import * as apiClient from '@/lib/api-client';
import { usePlayerStore } from '@/stores/player.store';
import type { SharedRecordingResponse } from '@/server/dtos/recording.dto';
import { ResponseStatus, ResponseCode } from '@/server/constants';

// Stable next/navigation mocks
const mockParams = { token: 'token-shared-xyz' };
vi.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: vi.fn() }),
}));

const mockSharedData: SharedRecordingResponse = {
  id: 'rec-shared-777',
  title: 'All-Hands Meeting Q4 2026',
  duration_seconds: 360,
  audio_url: 'https://example.com/audio/meeting.mp3',
  playback_url: 'https://example.com/audio/meeting.mp3',
  selected_template: 'GENERAL',
  detected_language: 'id',
  output_language: 'id',
  created_at: '2026-10-06T10:00:00Z',
  active_summary: {
    id: 'sum-1',
    template_category: 'GENERAL',
    version: 1,
    is_active: true,
    markdown_content: '## Ringkasan Eksekutif\nDiskusi target pencapaian Q4.',
    structured_data: {
      executive_summary: 'Diskusi target pencapaian Q4.',
      core_themes: ['Ekspansi regional', 'Inovasi AI'],
    },
    created_at: '2026-10-06T10:05:00Z',
    updated_at: '2026-10-06T10:05:00Z',
  },
  segments: [
    {
      id: 'seg-1',
      speaker_label: 'speaker_0',
      speaker_name: 'Budi Santoso',
      start_time: 0,
      end_time: 15,
      text: 'Selamat pagi rekan-rekan sekalian, mari kita mulai.',
      sequence_order: 1,
    },
    {
      id: 'seg-2',
      speaker_label: 'speaker_1',
      speaker_name: 'Siti Rahma',
      start_time: 16,
      end_time: 30,
      text: 'Laporan roadmap backend Q4 sudah siap untuk dipresentasikan.',
      sequence_order: 2,
    },
  ],
  chapters: [
    {
      id: 'chap-1',
      title: 'Pembukaan & Absensi',
      start_time: 0,
      end_time: 15,
      summary: 'Salam pembuka tim.',
      sequence_order: 1,
      created_at: '2026-10-06T10:00:00Z',
    },
  ],
  highlights: [
    {
      id: 'high-1',
      title: 'Kesiapan Roadmap Q4',
      start_time: 16,
      end_time: 30,
      source: 'ai',
      created_at: '2026-10-06T10:00:00Z',
    },
  ],
};

describe('SharedRecordingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePlayerStore.getState().resetPlayer();

    vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'OK',
      data: mockSharedData,
      timestamp: new Date().toISOString(),
    });
  });

  it('renders title, metadata badges, and powered by banner with CTA', async () => {
    render(<SharedRecordingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('shared-recording-title')).toHaveTextContent('All-Hands Meeting Q4 2026');
    });

    // Check Duration badge
    expect(screen.getByTestId('shared-duration-badge')).toBeInTheDocument();

    // Check promotional CTA
    expect(screen.getByTestId('try-free-cta-btn')).toBeInTheDocument();
    expect(screen.getByText(/Tautan Berbagi Publik \(Hanya Lihat\)/i)).toBeInTheDocument();
  });

  it('renders summary tab by default and allows switching between tabs', async () => {
    render(<SharedRecordingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('summary-tab-content')).toBeInTheDocument();
    });

    expect(screen.getByText(/Ringkasan Eksekutif/i)).toBeInTheDocument();

    // Switch to Transcript Tab
    fireEvent.click(screen.getByTestId('tab-trigger-transcript'));
    expect(screen.getByTestId('transcript-tab-content')).toBeInTheDocument();
    expect(screen.getByText(/Selamat pagi rekan-rekan sekalian/i)).toBeInTheDocument();

    // Switch to Chapters Tab
    fireEvent.click(screen.getByTestId('tab-trigger-chapters'));
    expect(screen.getByTestId('chapters-tab-content')).toBeInTheDocument();
    expect(screen.getByText('Pembukaan & Absensi')).toBeInTheDocument();
  });

  it('filters transcript segments by search query', async () => {
    render(<SharedRecordingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('shared-recording-title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-trigger-transcript'));

    const searchInput = screen.getByTestId('shared-transcript-search');
    fireEvent.change(searchInput, { target: { value: 'roadmap' } });

    // Segment 2 matches 'roadmap', Segment 1 does not
    expect(screen.getByText(/Laporan roadmap backend Q4/i)).toBeInTheDocument();
    expect(screen.queryByText(/Selamat pagi rekan-rekan sekalian/i)).not.toBeInTheDocument();
  });

  it('ensures mutation controls are strictly absent (read-only enforcement)', async () => {
    render(<SharedRecordingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('shared-recording-title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-trigger-transcript'));

    // Speaker rename triggers must NOT exist
    expect(screen.queryByTestId('rename-speaker-trigger')).not.toBeInTheDocument();

    // Add comment buttons must NOT exist
    expect(screen.queryByTestId('add-comment-button')).not.toBeInTheDocument();

    // Ask AI buttons must NOT exist
    expect(screen.queryByTestId('ask-ai-button')).not.toBeInTheDocument();

    // Chat panel must NOT exist
    expect(screen.queryByTestId('recording-chat-panel')).not.toBeInTheDocument();
  });

  it('seeks audio player when a timestamp button is clicked', async () => {
    const seekSpy = vi.spyOn(usePlayerStore.getState(), 'seek');

    render(<SharedRecordingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('shared-recording-title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-trigger-transcript'));

    const timestampButtons = screen.getAllByTestId('timestamp-badge');
    expect(timestampButtons.length).toBeGreaterThan(0);
    fireEvent.click(timestampButtons[0]);

    expect(seekSpy).toHaveBeenCalledWith(0);
  });

  it('renders friendly error screen when public share token fetch fails', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValueOnce(new Error('Tautan tidak ditemukan'));

    render(<SharedRecordingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('shared-recording-error')).toBeInTheDocument();
      expect(screen.getByText(/Tautan Tidak Tersedia/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('back-to-home-btn')).toBeInTheDocument();
  });
});
