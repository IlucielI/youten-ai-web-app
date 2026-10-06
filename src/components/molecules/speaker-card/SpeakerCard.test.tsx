import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  SpeakerCard,
  getSpeakerInitials,
  formatTalkDuration,
  formatLastActiveDate,
} from './SpeakerCard';
import { SpeakerSummaryDTO } from '@/server/dtos/workspace.dto';

describe('SpeakerCard component and utilities', () => {
  const mockSpeaker: SpeakerSummaryDTO = {
    name: 'Alice Johnson',
    total_meetings: 14,
    total_talk_time: 18450.0, // 5 hours, 7 mins, 30 secs -> "5 jam 7 mnt"
    last_active: '2026-10-06T10:00:00.000Z',
  };

  it('correctly calculates speaker initials', () => {
    expect(getSpeakerInitials('Alice Johnson')).toBe('AJ');
    expect(getSpeakerInitials('Bob')).toBe('BO');
    expect(getSpeakerInitials('')).toBe('SP');
  });

  it('correctly formats talk durations', () => {
    expect(formatTalkDuration(18450)).toBe('5 jam 7 mnt');
    expect(formatTalkDuration(3600)).toBe('1 jam');
    expect(formatTalkDuration(125)).toBe('2 mnt 5 dtk');
    expect(formatTalkDuration(120)).toBe('2 mnt');
    expect(formatTalkDuration(45)).toBe('45 dtk');
    expect(formatTalkDuration(0)).toBe('0 dtk');
    expect(formatTalkDuration(-5)).toBe('0 dtk');
  });

  it('formats last active date safely', () => {
    expect(formatLastActiveDate('')).toBe('-');
    expect(formatLastActiveDate('invalid-date')).toBe('-');
    expect(formatLastActiveDate('2026-10-06T10:00:00.000Z')).toContain('2026');
  });

  it('renders speaker details and avatar initials', () => {
    render(<SpeakerCard speaker={mockSpeaker} />);

    expect(screen.getByTestId('speaker-card')).toBeInTheDocument();
    expect(screen.getByTestId('speaker-name')).toHaveTextContent('Alice Johnson');
    expect(screen.getByTestId('speaker-avatar')).toHaveTextContent('AJ');
    expect(screen.getByText('14 Rapat')).toBeInTheDocument();
    expect(screen.getByText('5 jam 7 mnt')).toBeInTheDocument();
    expect(screen.getByText('14 Pertemuan')).toBeInTheDocument();
  });

  it('handles click callback when search button is clicked', () => {
    const handleClick = vi.fn();
    render(<SpeakerCard speaker={mockSpeaker} onClick={handleClick} />);

    const searchButton = screen.getByRole('button', { name: /Cari Kutipan/i });
    fireEvent.click(searchButton);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockSpeaker);
  });
});
