import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TranscriptSegment } from './TranscriptSegment';
import { usePlayerStore } from '@/stores/player.store';
import type { TranscriptSegmentDTO } from '@/server/dtos/recording.dto';

describe('TranscriptSegment Component', () => {
  const mockSegment: TranscriptSegmentDTO = {
    id: 'seg-101',
    speaker_label: 'Speaker 0',
    speaker_name: 'Speaker 0',
    start_time: 75.5,
    end_time: 82.0,
    text: 'Kita perlu menyelesaikan arsitektur BFF sebelum deployment.',
    sequence_order: 1,
    words_data: [
      { word: 'Kita', start: 75.5, end: 76.0, probability: 0.99 },
      { word: 'perlu', start: 76.1, end: 76.5, probability: 0.98 },
      { word: 'menyelesaikan', start: 76.6, end: 77.5, probability: 0.95 },
    ],
  };

  beforeEach(() => {
    usePlayerStore.getState().resetPlayer();
  });

  it('renders speaker display name, avatar initials, and formatted timestamp', () => {
    render(<TranscriptSegment segment={mockSegment} />);

    expect(screen.getByTestId('speaker-display-name').textContent).toBe('Speaker 0');
    expect(screen.getByText('01:15')).toBeDefined();
    expect(screen.getByText('Kita')).toBeDefined();
  });

  it('renders custom speaker name if provided', () => {
    render(
      <TranscriptSegment
        segment={mockSegment}
        speakerName="Bambang Pamungkas"
      />
    );

    expect(screen.getByTestId('speaker-display-name').textContent).toBe('Bambang Pamungkas');
  });

  it('seeks audio player when timestamp button is clicked', () => {
    const onSeek = vi.fn();

    render(
      <TranscriptSegment
        segment={mockSegment}
        onSeek={onSeek}
      />
    );

    const tsBtn = screen.getByTestId('timestamp-badge');
    fireEvent.click(tsBtn);

    expect(onSeek).toHaveBeenCalledWith(75.5);
  });

  it('triggers onRenameSpeaker when rename icon is clicked', () => {
    const onRename = vi.fn();

    render(
      <TranscriptSegment
        segment={mockSegment}
        onRenameSpeaker={onRename}
      />
    );

    const renameBtn = screen.getByTestId('rename-speaker-trigger');
    fireEvent.click(renameBtn);

    expect(onRename).toHaveBeenCalledWith('Speaker 0');
  });

  it('triggers onCopyQuote and copies to clipboard when copy button is clicked', async () => {
    const onCopy = vi.fn();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <TranscriptSegment
        segment={mockSegment}
        onCopyQuote={onCopy}
      />
    );

    const copyBtn = screen.getByTestId('copy-quote-button');
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith(mockSegment.text);
    expect(onCopy).toHaveBeenCalledWith(mockSegment.text);
  });

  it('triggers onAddComment and onAskAI callbacks when buttons are clicked', () => {
    const onComment = vi.fn();
    const onAskAI = vi.fn();

    render(
      <TranscriptSegment
        segment={mockSegment}
        onAddComment={onComment}
        onAskAI={onAskAI}
      />
    );

    const commentBtn = screen.getByTestId('add-comment-button');
    fireEvent.click(commentBtn);
    expect(onComment).toHaveBeenCalledWith(mockSegment);

    const askBtn = screen.getByTestId('ask-ai-button');
    fireEvent.click(askBtn);
    expect(onAskAI).toHaveBeenCalledWith(mockSegment);
  });
});
