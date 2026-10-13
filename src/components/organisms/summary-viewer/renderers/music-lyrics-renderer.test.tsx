import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MusicLyricsRenderer } from './music-lyrics-renderer';
import type { MusicLyricsStructuredData } from '@/server/schemas/summary.schema';

describe('MusicLyricsRenderer', () => {
  const sampleData: MusicLyricsStructuredData = {
    song_title: 'Baik Hati',
    artist_or_performers: 'Juicy Luicy',
    musical_style:
      'Gaya musik tidak dapat dipastikan hanya dari transkripsi lirik. Berdasarkan struktur lirik, lagu kemungkinan bergenre pop atau pop alternatif dengan penekanan pada vokal emosional, dinamika dramatis, dan aransemen yang mendukung narasi perpisahan.',
    emotional_tone: {
      primary_mood:
        'Patah hati, frustrasi, rasa bersalah, dan konflik batin antara ingin melupakan dan masih mencintai',
      energy_level: 'Sedang hingga tinggi, lagu menyampaikan kondisi emosional intens',
      sentiment_analysis: 'Lirik menggambarkan seseorang yang terluka karena perpisahan.',
    },
    core_message:
      'Lagu menceritakan dilema ketika ingin membenci seseorang demi bisa melupakan cinta, tetapi kebaikan orang tersebut justru membuat perasaan kembali tumbuh.',
    structured_lyrics: [
      {
        section: 'Verse 1',
        lyrics: 'Katanya waktu kan sembuhkan luka\nNamun mengapa bayangmu masih ada',
      },
    ],
    thematic_elements: ['Patah Hati', 'Kenangan', 'Penyesalan'],
  };

  it('renders song title, artist, and long musical style without crashing', () => {
    render(<MusicLyricsRenderer data={sampleData} />);

    expect(screen.getByTestId('music-lyrics-summary-renderer')).toBeInTheDocument();
    expect(screen.getByText('Baik Hati')).toBeInTheDocument();
    expect(screen.getByText('Juicy Luicy')).toBeInTheDocument();
    expect(
      screen.getByText(/Gaya musik tidak dapat dipastikan hanya dari transkripsi lirik/)
    ).toBeInTheDocument();
  });

  it('renders emotional tone badges and core message correctly', () => {
    render(<MusicLyricsRenderer data={sampleData} />);

    expect(screen.getByText(/Patah hati, frustrasi, rasa bersalah/)).toBeInTheDocument();
    expect(
      screen.getByText(/Sedang hingga tinggi, lagu menyampaikan kondisi emosional intens/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Lagu menceritakan dilema ketika ingin membenci seseorang/)
    ).toBeInTheDocument();
  });

  it('renders structured lyrics and thematic elements tags', () => {
    render(<MusicLyricsRenderer data={sampleData} />);

    expect(screen.getByText('Verse 1')).toBeInTheDocument();
    expect(screen.getByText(/Katanya waktu kan sembuhkan luka/)).toBeInTheDocument();
    expect(screen.getByText('#Patah Hati')).toBeInTheDocument();
  });
});
