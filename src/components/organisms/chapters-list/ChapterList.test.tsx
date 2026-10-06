import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChapterList } from './ChapterList';
import { ChapterDTO } from '@/server/dtos/recording.dto';

describe('ChapterList', () => {
  const mockChapters: ChapterDTO[] = [
    {
      id: 'chap-2',
      title: 'Pembahasan Solusi Arsitektur',
      start_time: 120,
      end_time: 300,
      summary: 'Tim mendiskusikan integrasi BFF dan decoupled ports.',
      sequence_order: 2,
      created_at: new Date().toISOString(),
    },
    {
      id: 'chap-1',
      title: 'Pembukaan & Penyelarasan Masalah',
      start_time: 0,
      end_time: 120,
      summary: 'Identifikasi bottleneck latency dan requirements sistem.',
      sequence_order: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'chap-3',
      title: 'Rencana Eksekusi & Penugasan',
      start_time: 300,
      end_time: 450,
      summary: 'Pembagian fase implementasi dan timeline rilis.',
      sequence_order: 3,
      created_at: new Date().toISOString(),
    },
  ];

  it('renders empty state when chapters list is empty', () => {
    render(<ChapterList chapters={[]} />);
    expect(screen.getByTestId('empty-chapters-state')).toBeInTheDocument();
    expect(screen.getByText('Belum Ada Bab')).toBeInTheDocument();
  });

  it('sorts chapters in ascending sequence order', () => {
    render(<ChapterList chapters={mockChapters} />);
    const chapterItems = screen.getAllByTestId(/chapter-item-/);
    expect(chapterItems).toHaveLength(3);
    expect(chapterItems[0]).toHaveTextContent('Pembukaan & Penyelarasan Masalah');
    expect(chapterItems[1]).toHaveTextContent('Pembahasan Solusi Arsitektur');
    expect(chapterItems[2]).toHaveTextContent('Rencana Eksekusi & Penugasan');
  });

  it('displays formatted timestamps and duration', () => {
    render(<ChapterList chapters={mockChapters} />);
    expect(screen.getByText('00:00 - 02:00')).toBeInTheDocument();
    expect(screen.getByText('02:00 - 05:00')).toBeInTheDocument();
    expect(screen.getByText('05:00 - 07:30')).toBeInTheDocument();
  });

  it('highlights the active chapter based on currentTime', () => {
    render(<ChapterList chapters={mockChapters} currentTime={150} />);
    // At 150 seconds, chap-2 (120 to 300) should be active
    const activeBadge = screen.getByTestId('active-chapter-indicator');
    expect(activeBadge).toBeInTheDocument();
    expect(activeBadge).toHaveTextContent('Sedang Diputar');

    const activeItem = screen.getByTestId('chapter-item-chap-2');
    expect(activeItem).toContainElement(activeBadge);
  });

  it('triggers onSeek with chapter start_time when play button is clicked', () => {
    const handleSeek = vi.fn();
    render(<ChapterList chapters={mockChapters} onSeek={handleSeek} />);

    const seekBtn = screen.getByTestId('seek-chapter-btn-chap-2');
    fireEvent.click(seekBtn);

    expect(handleSeek).toHaveBeenCalledWith(120);
  });

  it('renders without play button when onSeek is omitted', () => {
    render(<ChapterList chapters={mockChapters} />);
    expect(screen.queryByTestId('seek-chapter-btn-chap-1')).not.toBeInTheDocument();
  });
});
