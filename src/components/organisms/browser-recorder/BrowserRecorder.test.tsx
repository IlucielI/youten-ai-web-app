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

  it('stops media stream tracks when MediaRecorder fails to initialize', async () => {
    const mockTrackStop = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: vi.fn().mockReturnValue([{ stop: mockTrackStop }]),
        }),
      },
      writable: true,
      configurable: true,
    });

    // Make MediaRecorder throw
    Object.defineProperty(window, 'MediaRecorder', {
      value: class {
        static isTypeSupported = vi.fn().mockReturnValue(true);
        constructor() {
          throw new Error('MIME type not supported by hardware encoder');
        }
      },
      writable: true,
      configurable: true,
    });

    render(<BrowserRecorder />);
    fireEvent.click(screen.getByTestId('start-record-btn'));

    await waitFor(() => {
      expect(mockTrackStop).toHaveBeenCalled();
      expect(screen.getByText('MIME type not supported by hardware encoder')).toBeInTheDocument();
      expect(screen.getByTestId('start-record-btn')).toBeInTheDocument();
    });
  });

  it('displays error when no supported recording MIME types are available', async () => {
    Object.defineProperty(window, 'MediaRecorder', {
      value: class {
        static isTypeSupported = vi.fn().mockReturnValue(false);
      },
      writable: true,
      configurable: true,
    });

    render(<BrowserRecorder />);
    fireEvent.click(screen.getByTestId('start-record-btn'));

    await waitFor(() => {
      expect(screen.getByText('Format perekaman audio tidak didukung oleh browser Anda.')).toBeInTheDocument();
      expect(screen.getByTestId('start-record-btn')).toBeInTheDocument();
    });
  });

  it('displays fallback error message when thrown Error has an empty message string', async () => {
    const mockTrackStop = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: vi.fn().mockReturnValue([{ stop: mockTrackStop }]),
        }),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'MediaRecorder', {
      value: class {
        static isTypeSupported = vi.fn().mockReturnValue(true);
        constructor() {
          throw new Error('   ');
        }
      },
      writable: true,
      configurable: true,
    });

    render(<BrowserRecorder />);
    fireEvent.click(screen.getByTestId('start-record-btn'));

    await waitFor(() => {
      expect(mockTrackStop).toHaveBeenCalled();
      expect(screen.getByText('Izin akses mikrofon ditolak atau mikrofon tidak ditemukan.')).toBeInTheDocument();
    });
  });

  it('displays user-friendly guidance when microphone permission is denied', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError')),
      },
      writable: true,
      configurable: true,
    });

    render(<BrowserRecorder />);
    fireEvent.click(screen.getByTestId('start-record-btn'));

    await waitFor(() => {
      expect(screen.getByText(/Akses mikrofon diblokir atau ditolak oleh browser/i)).toBeInTheDocument();
      expect(screen.getByTestId('retry-permission-btn')).toBeInTheDocument();
      expect(screen.getByTestId('reload-page-btn')).toBeInTheDocument();
      expect(screen.getByTestId('dismiss-error-btn')).toBeInTheDocument();
    });

    // Dismiss error alert
    fireEvent.click(screen.getByTestId('dismiss-error-btn'));
    expect(screen.queryByTestId('recorder-error-alert')).not.toBeInTheDocument();
  });

  it('displays permissions policy specific message when blocked by permissions policy', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(
          new DOMException('Access to the feature "microphone" is disallowed by permissions policy', 'NotAllowedError')
        ),
      },
      writable: true,
      configurable: true,
    });

    render(<BrowserRecorder />);
    fireEvent.click(screen.getByTestId('start-record-btn'));

    await waitFor(() => {
      expect(screen.getByText(/Izin mikrofon terhalang oleh cache dokumen browser/i)).toBeInTheDocument();
      expect(screen.getByTestId('reload-page-btn')).toBeInTheDocument();
    });
  });

  it('allows retrying recording from error banner after permission issue is fixed', async () => {
    const mockGetUserMedia = vi.fn()
      .mockRejectedValueOnce(new DOMException('Permission denied', 'NotAllowedError'))
      .mockResolvedValueOnce({
        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
      });

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
      },
      writable: true,
      configurable: true,
    });

    render(<BrowserRecorder />);
    fireEvent.click(screen.getByTestId('start-record-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('retry-permission-btn')).toBeInTheDocument();
    });

    // User clicks Coba Lagi button
    fireEvent.click(screen.getByTestId('retry-permission-btn'));

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Merekam Audio...')).toBeInTheDocument();
    });
  });
});

