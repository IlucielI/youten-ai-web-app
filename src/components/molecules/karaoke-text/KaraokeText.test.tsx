import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KaraokeText } from './KaraokeText';
import { usePlayerStore } from '@/stores/player.store';

describe('KaraokeText Component', () => {
  beforeEach(() => {
    usePlayerStore.getState().resetPlayer();
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders simple text when no words are provided', () => {
    render(<KaraokeText segmentId="seg-1" text="Halo dunia, ini pertemuan penting." />);
    expect(screen.getByText('Halo dunia, ini pertemuan penting.')).toBeDefined();
    expect(screen.getByTestId('karaoke-segment-seg-1')).toBeDefined();
  });

  it('renders words and highlights active word based on currentTime', () => {
    const mockWords = [
      { word: 'Selamat', start: 0.0, end: 0.5, confidence: 0.98 },
      { word: 'pagi', start: 0.6, end: 1.2, confidence: 0.95 },
      { word: 'semuanya', start: 1.3, end: 2.0, confidence: 0.92 },
    ];

    render(
      <KaraokeText
        segmentId="seg-1"
        text="Selamat pagi semuanya"
        words={mockWords}
        currentTime={0.8}
        isActiveSegment={true}
      />
    );

    const morningWord = screen.getByTestId('karaoke-word-1');
    expect(morningWord.textContent).toBe('pagi');
    // Expect active word to have active styling classes
    expect(morningWord.className).toContain('bg-primary');
  });

  it('calls onWordClick callback when a word is clicked', () => {
    const mockWords = [
      { word: 'First', start: 1.0, end: 1.5, confidence: 0.9 },
      { word: 'Second', start: 1.6, end: 2.2, confidence: 0.9 },
    ];
    const onWordClick = vi.fn();

    render(
      <KaraokeText
        segmentId="seg-2"
        text="First Second"
        words={mockWords}
        onWordClick={onWordClick}
      />
    );

    fireEvent.click(screen.getByTestId('karaoke-word-1'));
    expect(onWordClick).toHaveBeenCalledTimes(1);
    expect(onWordClick).toHaveBeenCalledWith(mockWords[1]);
  });

  it('falls back to seeking player store directly when onWordClick is not passed', () => {
    const mockWords = [
      { word: 'Jump', start: 5.5, end: 6.0, confidence: 0.95 },
    ];

    render(
      <KaraokeText
        segmentId="seg-3"
        text="Jump"
        words={mockWords}
      />
    );

    fireEvent.click(screen.getByTestId('karaoke-word-0'));
    expect(usePlayerStore.getState().currentTime).toBe(5.5);
  });

  it('triggers scrollIntoView when segment is active and autoScroll is enabled', () => {
    const scrollMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollMock;

    render(
      <KaraokeText
        segmentId="seg-4"
        text="Auto scroll test"
        isActiveSegment={true}
        autoScroll={true}
      />
    );

    expect(scrollMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'nearest',
    });
  });
});
