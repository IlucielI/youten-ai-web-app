import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CitationCard } from './CitationCard';
import { MeetingSourceCitationDTO } from '@/server/dtos';

describe('CitationCard', () => {
  const citation: MeetingSourceCitationDTO = {
    recording_id: '123e4567-e89b-12d3-a456-426614174000',
    recording_title: 'Sprint Planning Meeting',
    folder_name: 'Engineering',
    chunk_index: 0,
    snippet: 'We agreed on delivering the multi-meeting chat feature by next week.',
    start_time: 75.0,
    end_time: 135.0,
  };

  it('should render meeting title, time range, folder name, and snippet', () => {
    render(<CitationCard citation={citation} />);

    expect(screen.getByText('Sprint Planning Meeting')).toBeDefined();
    expect(screen.getByText('01:15 - 02:15')).toBeDefined();
    expect(screen.getByText('Engineering')).toBeDefined();
    expect(
      screen.getByText(/We agreed on delivering the multi-meeting chat feature by next week/i)
    ).toBeDefined();
  });

  it('should provide link to recording with timestamp anchor', () => {
    render(<CitationCard citation={citation} />);

    const link = screen.getByTitle('Sprint Planning Meeting');
    expect(link.getAttribute('href')).toBe('/recordings/123e4567-e89b-12d3-a456-426614174000?t=75');
  });
});

