import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRecorder } from './BrowserRecorder';

interface MockMediaRecorderType {
  state: string;
  ondataavailable: ((e: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

describe('BrowserRecorder Organism', () => {
  let mockMediaRecorderInstance: MockMediaRecorderType | null = null;

  const setMockInstance = (instance: MockMediaRecorderType) => {
    mockMediaRecorderInstance = instance;
  };

  beforeEach(() => {
    class MockMediaRecorder implements MockMediaRecorderType {
      static isTypeSupported = vi.fn().mockReturnValue(true);
      state = 'inactive';
      ondataavailable: ((e: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start = vi.fn(() => {
        this.state = 'recording';
      });
      stop = vi.fn(() => {
        this.state = 'inactive';
        if (this.ondataavailable) {
          this.ondataavailable({ data: new Blob(['audio-sample'], { type: 'audio/webm' }) });
        }
        if (this.onstop) {
          this.onstop();
        }
      });
      pause = vi.fn(() => {
        this.state = 'paused';
      });
      resume = vi.fn(() => {
        this.state = 'recording';
      });

      constructor() {
        setMockInstance(this);
      }
    }

    Object.defineProperty(window, 'MediaRecorder', {
      value: MockMediaRecorder,
      writable: true,
      configurable: true,
    });

    const mockStream = {
      getTracks: vi.fn().mockReturnValue([
        { stop: vi.fn() },
      ]),
    };

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial idle state with Start Recording button', () => {
    render(<BrowserRecorder />);

    expect(screen.getByTestId('browser-recorder')).toBeInTheDocument();
    expect(screen.getByTestId('start-record-btn')).toBeInTheDocument();
    expect(screen.getByTestId('recorder-timer').textContent).toBe('00:00');
  });

  it('starts recording and updates UI controls', async () => {
    render(<BrowserRecorder />);

    const startBtn = screen.getByTestId('start-record-btn');
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(screen.getByTestId('pause-record-btn')).toBeInTheDocument();
      expect(screen.getByTestId('stop-record-btn')).toBeInTheDocument();
      expect(screen.getByText('Merekam Audio...')).toBeInTheDocument();
    });
  });

  it('pauses and resumes recording', async () => {
    render(<BrowserRecorder />);

    fireEvent.click(screen.getByTestId('start-record-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('pause-record-btn')).toBeInTheDocument();
    });

    const pauseBtn = screen.getByTestId('pause-record-btn');
    fireEvent.click(pauseBtn);

    expect(screen.getByText('Perekaman Dijeda')).toBeInTheDocument();
    expect(mockMediaRecorderInstance?.pause).toHaveBeenCalled();

    // Resume
    fireEvent.click(pauseBtn);
    expect(screen.getByText('Merekam Audio...')).toBeInTheDocument();
    expect(mockMediaRecorderInstance?.resume).toHaveBeenCalled();
  });

  it('stops recording and submits recorded blob on process', async () => {
    const handleProcess = vi.fn();
    render(<BrowserRecorder onProcessRecording={handleProcess} />);

    fireEvent.click(screen.getByTestId('start-record-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('stop-record-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('stop-record-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('process-record-btn')).toBeInTheDocument();
      expect(screen.getByTestId('reset-record-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('process-record-btn'));

    await waitFor(() => {
      expect(handleProcess).toHaveBeenCalled();
    });
  });

  it('displays error message when onProcessRecording fails', async () => {
    const handleProcess = vi.fn().mockRejectedValue(new Error('Network error saat upload'));
    render(<BrowserRecorder onProcessRecording={handleProcess} />);

    fireEvent.click(screen.getByTestId('start-record-btn'));
    await waitFor(() => expect(screen.getByTestId('stop-record-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('stop-record-btn'));
    await waitFor(() => expect(screen.getByTestId('process-record-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('process-record-btn'));

    await waitFor(() => {
      expect(screen.getByText('Network error saat upload')).toBeInTheDocument();
    });
  });

  it('resets recorder state and returns to idle when reset button is clicked', async () => {
    render(<BrowserRecorder />);

    fireEvent.click(screen.getByTestId('start-record-btn'));
    await waitFor(() => expect(screen.getByTestId('stop-record-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('stop-record-btn'));
    await waitFor(() => expect(screen.getByTestId('reset-record-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('reset-record-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('start-record-btn')).toBeInTheDocument();
      expect(screen.queryByTestId('reset-record-btn')).not.toBeInTheDocument();
    });
  });
});
