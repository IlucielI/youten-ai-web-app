import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LiveBotTracker } from './LiveBotTracker';
import { useMeetingBotStore } from '@/stores/meeting-bot.store';

describe('LiveBotTracker', () => {
  beforeEach(() => {
    useMeetingBotStore.getState().resetSession();
    vi.restoreAllMocks();
  });

  it('renders nothing when activeSession is null', () => {
    const { container } = render(<LiveBotTracker />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders active session in recording state', () => {
    useMeetingBotStore.setState({
      activeSession: {
        sessionId: 'sess-123',
        recordingId: 'rec-123',
        provider: 'google_meet',
        status: 'RECORDING',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
      },
    });

    render(<LiveBotTracker />);

    expect(screen.getByTestId('live-bot-tracker')).toBeInTheDocument();
    expect(screen.getByTestId('live-bot-status-pill')).toHaveTextContent('Sedang Merekam');
    expect(screen.getByTestId('stop-bot-btn')).toHaveTextContent('Hentikan & Proses Notula Sekarang');
  });

  it('triggers stopSession when clicking stop button', async () => {
    const stopSpy = vi.fn().mockResolvedValue(undefined);
    useMeetingBotStore.setState({
      activeSession: {
        sessionId: 'sess-123',
        recordingId: 'rec-123',
        provider: 'google_meet',
        status: 'RECORDING',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
      },
      stopSession: stopSpy,
    });

    render(<LiveBotTracker />);

    fireEvent.click(screen.getByTestId('stop-bot-btn'));
    expect(stopSpy).toHaveBeenCalledWith('sess-123');
  });

  it('renders completed state with link to recording', () => {
    useMeetingBotStore.setState({
      activeSession: {
        sessionId: 'sess-123',
        recordingId: 'rec-123',
        provider: 'google_meet',
        status: 'COMPLETED',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
      },
    });

    render(<LiveBotTracker />);

    expect(screen.getByTestId('live-bot-status-pill')).toHaveTextContent('Selesai');
    expect(screen.getByTestId('view-notula-btn')).toHaveAttribute('href', '/recordings/rec-123');
  });
});
