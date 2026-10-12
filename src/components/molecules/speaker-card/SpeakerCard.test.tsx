import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  SpeakerCard,
  getSpeakerInitials,
  formatTalkDuration,
  formatLastActiveDate,
} from './SpeakerCard';
import { SpeakerSummaryDTO } from '@/server/dtos/workspace.dto';
import { useLocaleStore } from '@/stores/locale.store';

describe('SpeakerCard component and utilities', () => {
  const mockSpeaker: SpeakerSummaryDTO = {
    name: 'Alice Johnson',
    total_meetings: 14,
    total_talk_time: 18450.0, // 5 hours, 7 mins, 30 secs -> "5h 7m" (en) or "5 jam 7 mnt" (id)
    last_active: '2026-10-06T10:00:00.000Z',
  };

  beforeEach(() => {
    useLocaleStore.setState({ locale: 'en' });
  });

  it('correctly calculates speaker initials', () => {
    expect(getSpeakerInitials('Alice Johnson')).toBe('AJ');
    expect(getSpeakerInitials('Bob')).toBe('BO');
    expect(getSpeakerInitials('')).toBe('SP');
  });

  it('correctly formats talk durations in both languages', () => {
    // Indonesian
    expect(formatTalkDuration(18450, 'id')).toBe('5 jam 7 mnt');
    expect(formatTalkDuration(3600, 'id')).toBe('1 jam');
    expect(formatTalkDuration(125, 'id')).toBe('2 mnt 5 dtk');
    expect(formatTalkDuration(120, 'id')).toBe('2 mnt');
    expect(formatTalkDuration(45, 'id')).toBe('45 dtk');
    expect(formatTalkDuration(0, 'id')).toBe('0 dtk');
    expect(formatTalkDuration(-5, 'id')).toBe('0 dtk');

    // English
    expect(formatTalkDuration(18450, 'en')).toBe('5h 7m');
    expect(formatTalkDuration(3600, 'en')).toBe('1h');
    expect(formatTalkDuration(125, 'en')).toBe('2m 5s');
    expect(formatTalkDuration(120, 'en')).toBe('2m');
    expect(formatTalkDuration(45, 'en')).toBe('45s');
    expect(formatTalkDuration(0, 'en')).toBe('0s');
    expect(formatTalkDuration(-5, 'en')).toBe('0s');
  });

  it('formats last active date safely', () => {
    expect(formatLastActiveDate('')).toBe('-');
    expect(formatLastActiveDate('invalid-date')).toBe('-');
    expect(formatLastActiveDate('2026-10-06T10:00:00.000Z', 'en')).toContain('2026');
    expect(formatLastActiveDate('2026-10-06T10:00:00.000Z', 'id')).toContain('2026');
  });

  it('renders speaker details in English by default', () => {
    render(<SpeakerCard speaker={mockSpeaker} />);

    expect(screen.getByTestId('speaker-card')).toBeInTheDocument();
    expect(screen.getByTestId('speaker-name')).toHaveTextContent('Alice Johnson');
    expect(screen.getByTestId('speaker-avatar')).toHaveTextContent('AJ');
    expect(screen.getByText('14 Meetings')).toBeInTheDocument();
    expect(screen.getByText('5h 7m')).toBeInTheDocument();
    expect(screen.getByText('14 Sessions')).toBeInTheDocument();
  });

  it('renders speaker details in Indonesian when locale is id', () => {
    useLocaleStore.setState({ locale: 'id' });
    render(<SpeakerCard speaker={mockSpeaker} />);

    expect(screen.getByTestId('speaker-card')).toBeInTheDocument();
    expect(screen.getByText('14 Rapat')).toBeInTheDocument();
    expect(screen.getByText('5 jam 7 mnt')).toBeInTheDocument();
    expect(screen.getByText('14 Pertemuan')).toBeInTheDocument();
  });

  it('handles click callback when search button is clicked', () => {
    const handleClick = vi.fn();
    render(<SpeakerCard speaker={mockSpeaker} onClick={handleClick} />);

    const searchButton = screen.getByRole('button', { name: /Search Quotes/i });
    fireEvent.click(searchButton);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockSpeaker);
  });
});
