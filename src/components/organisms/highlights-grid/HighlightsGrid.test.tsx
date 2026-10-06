import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HighlightsGrid } from './HighlightsGrid';
import { HighlightDTO } from '@/server/dtos/recording.dto';

describe('HighlightsGrid', () => {
  const mockHighlights: HighlightDTO[] = [
    {
      id: 'hl-2',
      start_time: 150,
      end_time: 180,
      title: 'Keputusan Migrasi Cloud',
      note: 'Semua pipeline transkripsi akan dialihkan ke cluster GPU baru.',
      source: 'ai',
      clip_url: 'https://cdn.example.com/clips/hl-2.mp3',
      created_at: new Date().toISOString(),
    },
    {
      id: 'hl-1',
      start_time: 30,
      end_time: 60,
      title: 'Catatan Pribadi PM',
      note: 'Perlu sinkronisasi dengan tim frontend terkait skema enum.',
      source: 'manual',
      clip_url: null,
      created_at: new Date().toISOString(),
    },
  ];

  it('renders empty state when highlights list is empty', () => {
    render(<HighlightsGrid highlights={[]} />);
    expect(screen.getByTestId('empty-highlights-state')).toBeInTheDocument();
    expect(screen.getByText('Belum Ada Sorotan')).toBeInTheDocument();
  });

  it('sorts highlights chronologically by start_time', () => {
    render(<HighlightsGrid highlights={mockHighlights} />);
    const cards = screen.getAllByTestId(/highlight-card-/);
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('Catatan Pribadi PM');
    expect(cards[1]).toHaveTextContent('Keputusan Migrasi Cloud');
  });

  it('displays correct source badge for AI and manual highlights', () => {
    render(<HighlightsGrid highlights={mockHighlights} />);
    expect(screen.getByText('Manual Bookmark')).toBeInTheDocument();
    expect(screen.getByText('AI Insight')).toBeInTheDocument();
  });

  it('triggers onSeek with start_time when play button is clicked', () => {
    const handleSeek = vi.fn();
    render(<HighlightsGrid highlights={mockHighlights} onSeek={handleSeek} />);

    const seekBtn = screen.getByTestId('seek-highlight-btn-hl-2');
    fireEvent.click(seekBtn);

    expect(handleSeek).toHaveBeenCalledWith(150);
  });

  it('renders clip download link when clip_url is provided', () => {
    render(<HighlightsGrid highlights={mockHighlights} />);
    const clipLink = screen.getByTestId('highlight-clip-link-hl-2');
    expect(clipLink).toHaveAttribute('href', 'https://cdn.example.com/clips/hl-2.mp3');
  });
});
