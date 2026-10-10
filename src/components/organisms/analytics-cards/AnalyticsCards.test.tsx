import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyticsCards } from './AnalyticsCards';
import { RecordingAnalyticsDTO } from '@/server/dtos/analytics.dto';

describe('AnalyticsCards', () => {
  const mockAnalytics: RecordingAnalyticsDTO = {
    total_duration_seconds: 300, // 5 minutes
    total_words: 600, // 120 WPM
    speakers: [
      {
        name: 'Bayu Anugerah',
        total_seconds: 180,
        word_count: 360,
        share_percent: 60,
      },
      {
        name: 'Iluciel Team',
        total_seconds: 120,
        word_count: 240,
        share_percent: 40,
      },
    ],
  };

  it('renders empty state when analytics is null or empty', () => {
    render(<AnalyticsCards analytics={null} />);
    expect(screen.getByTestId('empty-analytics-state')).toBeInTheDocument();
    expect(screen.getByText('Data Analitik Belum Tersedia')).toBeInTheDocument();
  });

  it('renders top 4 metric cards correctly', () => {
    render(<AnalyticsCards analytics={mockAnalytics} />);

    // Total Duration: 300s -> 05:00
    expect(screen.getByTestId('metric-duration-card')).toHaveTextContent('05:00');

    // Total Words: 600
    expect(screen.getByTestId('metric-words-card')).toHaveTextContent('600');

    // Speaking Pace: 600 / 300 * 60 = 120 WPM
    expect(screen.getByTestId('metric-wpm-card')).toHaveTextContent('120 WPM');

    // Partisipan: 2 Pembicara
    expect(screen.getByTestId('metric-speakers-card')).toHaveTextContent('2 Pembicara');
  });

  it('renders speaker distribution rows with talk-time and progress bar', () => {
    render(<AnalyticsCards analytics={mockAnalytics} />);

    const row0 = screen.getByTestId('speaker-row-0');
    expect(row0).toHaveTextContent('Bayu Anugerah');
    expect(row0).toHaveTextContent('60%');
    expect(row0).toHaveTextContent('03:00');

    const progressBar0 = screen.getByTestId('speaker-progress-bar-0');
    expect(progressBar0).toHaveAttribute('aria-valuenow', '60');
    expect(progressBar0).toHaveStyle({ width: '60%' });

    const row1 = screen.getByTestId('speaker-row-1');
    expect(row1).toHaveTextContent('Iluciel Team');
    expect(row1).toHaveTextContent('40%');
    expect(row1).toHaveTextContent('02:00');
  });

  it('unifies split speakers when speakerLabels maps generic label to canonical name', () => {
    const splitAnalytics: RecordingAnalyticsDTO = {
      total_duration_seconds: 300,
      total_words: 600,
      speakers: [
        {
          name: 'Putri Deski Patok Fatimah',
          total_seconds: 150,
          word_count: 300,
          share_percent: 50,
        },
        {
          name: 'Speaker 0',
          total_seconds: 50,
          word_count: 100,
          share_percent: 17,
        },
        {
          name: 'Speaker 1',
          total_seconds: 100,
          word_count: 200,
          share_percent: 33,
        },
      ],
    };

    const speakerLabels = {
      'Speaker 0': 'Putri Deski Patok Fatimah',
    };

    render(
      <AnalyticsCards
        analytics={splitAnalytics}
        speakerLabels={speakerLabels}
      />
    );

    // Should unify Speaker 0 into Putri Deski Patok Fatimah, resulting in exactly 2 Pembicara
    expect(screen.getByTestId('metric-speakers-card')).toHaveTextContent('2 Pembicara');

    const row0 = screen.getByTestId('speaker-row-0');
    expect(row0).toHaveTextContent('Putri Deski Patok Fatimah');
    // Combined share: 50% + 17% = 67%
    expect(row0).toHaveTextContent('67%');

    const row1 = screen.getByTestId('speaker-row-1');
    expect(row1).toHaveTextContent('Speaker 1');
    expect(row1).toHaveTextContent('33%');
  });
});
