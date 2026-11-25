import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TranscriptCanvas } from './transcript-canvas';
import type { TranscriptSegmentDTO } from '@/server/dtos/recording.dto';

vi.mock('@/locales', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'recording.transcript.searchPlaceholder': 'Cari percakapan transkrip...',
        'recording.transcript.emptySearch': 'Tidak ada segmen transkrip yang cocok.',
        'recording.transcript.askAiPrompt': 'Jelaskan konteks ini: {text}',
      };
      return translations[key] || key;
    },
  }),
}));

const mockSegments: TranscriptSegmentDTO[] = [
  {
    id: 'seg-1',
    speaker_label: 'spk-0',
    speaker_name: 'Alfan',
    start_time: 0,
    end_time: 10,
    text: 'Halo selamat pagi semuanya',
    sequence_order: 1,
  },
  {
    id: 'seg-2',
    speaker_label: 'spk-1',
    speaker_name: 'Bayu',
    start_time: 11,
    end_time: 20,
    text: 'Pagi juga, kita mulai review sprint hari ini',
    sequence_order: 2,
  },
];

describe('TranscriptCanvas', () => {
  it('renders all segments and searches correctly', () => {
    const onSeek = vi.fn();
    const onRename = vi.fn();
    const onComment = vi.fn();
    const onAskAI = vi.fn();
    const onSave = vi.fn();

    render(
      <TranscriptCanvas
        segments={mockSegments}
        speakerLabels={{ 'spk-0': 'Alfan', 'spk-1': 'Bayu' }}
        currentTime={5}
        onSeek={onSeek}
        onRenameSpeaker={onRename}
        onAddComment={onComment}
        onAskAI={onAskAI}
        onSaveText={onSave}
      />
    );

    expect(screen.getByText('Halo selamat pagi semuanya')).toBeInTheDocument();
    expect(screen.getByText('Pagi juga, kita mulai review sprint hari ini')).toBeInTheDocument();

    // Search filter
    const input = screen.getByTestId('transcript-search-input');
    fireEvent.change(input, { target: { value: 'review' } });

    expect(screen.queryByText('Halo selamat pagi semuanya')).not.toBeInTheDocument();
    expect(screen.getByText('Pagi juga, kita mulai review sprint hari ini')).toBeInTheDocument();

    // No results
    fireEvent.change(input, { target: { value: 'notfoundquery123' } });
    expect(screen.getByText('Tidak ada segmen transkrip yang cocok.')).toBeInTheDocument();
  });
});
