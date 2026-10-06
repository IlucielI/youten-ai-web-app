import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordingCard, getStatusPillConfig } from './RecordingCard';
import { RecordingListItemDTO } from '@/server/dtos/recording.dto';
import { RecordingStatus } from '@/server/constants/recording.constant';

describe('RecordingCard Component', () => {
  const mockRecording: RecordingListItemDTO = {
    id: 'rec-1234',
    title: 'Sprint Planning Meeting',
    original_filename: 'sprint_planning.mp3',
    file_size_bytes: 10485760, // 10MB
    duration_seconds: 1800, // 30 mins
    source_type: 'UPLOAD',
    status: RecordingStatus.COMPLETED,
    selected_template: 'DAILY_STANDUP',
    detected_language: 'id',
    output_language: 'id',
    created_at: '2026-10-06T10:00:00Z',
    updated_at: '2026-10-06T10:30:00Z',
  };

  it('renders recording title, template badge, and metadata correctly', () => {
    render(<RecordingCard recording={mockRecording} />);

    expect(screen.getByText('Sprint Planning Meeting')).toBeInTheDocument();
    expect(screen.getByText('sprint_planning.mp3')).toBeInTheDocument();
    expect(screen.getByText('Daily Standup')).toBeInTheDocument();
    expect(screen.getByText('30:00')).toBeInTheDocument();
    expect(screen.getByText('10.0 MB')).toBeInTheDocument();
    expect(screen.getByText('Selesai')).toBeInTheDocument();
  });

  it('correctly maps various recording statuses to pill configs', () => {
    expect(getStatusPillConfig(RecordingStatus.COMPLETED).label).toBe('Selesai');
    expect(getStatusPillConfig(RecordingStatus.FAILED).label).toBe('Gagal');
    expect(getStatusPillConfig(RecordingStatus.QUEUED).label).toBe('Antrean');
    expect(getStatusPillConfig('TRANSCRIBING').label).toBe('Memproses');
  });

  it('invokes onShare and onDelete callbacks when actions are clicked', () => {
    const onShare = vi.fn();
    const onDelete = vi.fn();

    const { rerender } = render(
      <RecordingCard
        recording={mockRecording}
        onShare={onShare}
        onDelete={onDelete}
        open={true}
      />
    );

    // Click share
    const shareBtn = screen.getByText('Bagikan');
    fireEvent.click(shareBtn);
    expect(onShare).toHaveBeenCalledWith(mockRecording);

    // Re-render open and click delete
    rerender(
      <RecordingCard
        recording={mockRecording}
        onShare={onShare}
        onDelete={onDelete}
        open={true}
      />
    );
    const deleteBtn = screen.getByText('Hapus Rekaman');
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(mockRecording);
  });
});
