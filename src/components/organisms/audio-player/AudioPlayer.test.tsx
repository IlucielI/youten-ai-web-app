import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioPlayer } from './AudioPlayer';
import { usePlayerStore } from '@/stores/player.store';

describe('AudioPlayer Component', () => {
  beforeEach(() => {
    usePlayerStore.getState().resetPlayer();
    // Mock HTMLMediaElement methods for JSDOM
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  it('renders audio player layout and displays time properly', () => {
    usePlayerStore.getState().setDuration(120);
    usePlayerStore.getState().setCurrentTime(45);

    render(<AudioPlayer title="Daily Standup Meeting" />);

    expect(screen.getByText('Daily Standup Meeting')).toBeDefined();
    expect(screen.getByTestId('current-time-display').textContent).toBe('00:45');
    expect(screen.getByTestId('duration-display').textContent).toBe('02:00');
    expect(screen.getByTestId('waveform-scrubber')).toBeDefined();
  });

  it('toggles play/pause state when play button is clicked', () => {
    render(<AudioPlayer />);

    const playPauseBtn = screen.getByTestId('play-pause-button');
    expect(usePlayerStore.getState().isPlaying).toBe(false);

    fireEvent.click(playPauseBtn);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('skips backward and forward by 10 seconds', () => {
    usePlayerStore.getState().setDuration(100);
    usePlayerStore.getState().setCurrentTime(30);

    render(<AudioPlayer />);

    // Skip backward
    const skipBackBtn = screen.getByTitle('Skip backward 10s');
    fireEvent.click(skipBackBtn);
    expect(usePlayerStore.getState().currentTime).toBe(20);

    // Skip forward
    const skipFwdBtn = screen.getByTitle('Skip forward 10s');
    fireEvent.click(skipFwdBtn);
    expect(usePlayerStore.getState().currentTime).toBe(30);
  });

  it('toggles mute when mute button is clicked', () => {
    render(<AudioPlayer />);

    const muteBtn = screen.getByTestId('mute-toggle-button');
    expect(usePlayerStore.getState().isMuted).toBe(false);

    fireEvent.click(muteBtn);
    expect(usePlayerStore.getState().isMuted).toBe(true);
  });

  it('seeks to target time on waveform scrubber click', () => {
    usePlayerStore.getState().setDuration(200);

    render(<AudioPlayer />);

    const scrubber = screen.getByTestId('waveform-scrubber');
    // Mock getBoundingClientRect
    vi.spyOn(scrubber, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 48,
      bottom: 48,
      right: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // Click at 50% width (x = 250)
    fireEvent.click(scrubber, { clientX: 250 });
    // Expected time is 50% of 200s = 100s
    expect(usePlayerStore.getState().currentTime).toBe(100);
  });

  it('toggles auto-scroll setting', () => {
    render(<AudioPlayer />);

    const autoScrollBtn = screen.getByTitle('Auto-scroll enabled');
    expect(usePlayerStore.getState().isAutoScrollEnabled).toBe(true);

    fireEvent.click(autoScrollBtn);
    expect(usePlayerStore.getState().isAutoScrollEnabled).toBe(false);
  });
});
