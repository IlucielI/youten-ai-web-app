import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchResultCard, getScoreBadgeConfig } from './SearchResultCard';
import { SearchResultItemDTO } from '@/server/dtos/workspace.dto';

describe('SearchResultCard Component', () => {
  const mockResult: SearchResultItemDTO = {
    recording_id: 'rec-1234',
    recording_title: 'All Hands Engineering Q4',
    chunk_index: 2,
    snippet: 'Target peluncuran v2 dijadwalkan pada akhir bulan Oktober 2026.',
    start_time: 125,
    end_time: 180,
    score: 0.92,
  };

  it('renders meeting title, snippet, time range, and chunk index correctly', () => {
    render(<SearchResultCard result={mockResult} />);

    expect(screen.getByText('All Hands Engineering Q4')).toBeInTheDocument();
    expect(screen.getByText(/Target peluncuran v2 dijadwalkan/i)).toBeInTheDocument();
    expect(screen.getByText('Bagian #3')).toBeInTheDocument();
    expect(screen.getByText('02:05 - 03:00')).toBeInTheDocument();
    expect(screen.getByText('92% Relevan')).toBeInTheDocument();
  });

  it('calculates score badge colors properly based on relevance threshold', () => {
    expect(getScoreBadgeConfig(0.95).label).toBe('95% Relevan');
    expect(getScoreBadgeConfig(0.95).className).toContain('emerald');

    expect(getScoreBadgeConfig(0.75).label).toBe('75% Relevan');
    expect(getScoreBadgeConfig(0.75).className).toContain('blue');

    expect(getScoreBadgeConfig(0.55).label).toBe('55% Relevan');
    expect(getScoreBadgeConfig(0.55).className).toContain('amber');
  });

  it('triggers onClick callback when meeting title or open button is clicked', () => {
    const handleClick = vi.fn();
    render(<SearchResultCard result={mockResult} onClick={handleClick} />);

    const link = screen.getByText('All Hands Engineering Q4');
    fireEvent.click(link);
    expect(handleClick).toHaveBeenCalledWith(mockResult);

    const button = screen.getByText('Buka di Rekaman');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
