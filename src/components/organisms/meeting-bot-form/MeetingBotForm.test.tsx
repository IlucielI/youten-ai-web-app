import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MeetingBotForm } from './MeetingBotForm';
import { useMeetingBotStore } from '@/stores/meeting-bot.store';

describe('MeetingBotForm', () => {
  beforeEach(() => {
    useMeetingBotStore.getState().resetSession();
    vi.restoreAllMocks();
  });

  it('renders form inputs for Google Meet by default', () => {
    render(<MeetingBotForm />);

    expect(screen.getByTestId('meeting-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('meeting-bot-submit-btn')).toHaveTextContent('Undang Bot ke Rapat');
  });

  it('switches to Discord inputs when Discord is selected', () => {
    render(<MeetingBotForm />);

    fireEvent.click(screen.getByTestId('provider-option-discord'));

    expect(screen.getByTestId('discord-inputs-container')).toBeInTheDocument();
    expect(screen.getByTestId('discord-guild-id-input')).toBeInTheDocument();
    expect(screen.getByTestId('discord-channel-id-input')).toBeInTheDocument();
    expect(screen.getByTestId('meeting-bot-submit-btn')).toHaveTextContent('Kirim Bot ke Voice Channel');
  });

  it('shows validation error when meeting URL is empty', async () => {
    render(<MeetingBotForm />);

    fireEvent.click(screen.getByTestId('meeting-bot-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('meeting-bot-error-alert')).toHaveTextContent('Tautan rapat (Meeting URL) wajib diisi');
    });
  });

  it('shows validation error when Google Meet URL is not meet.google.com', async () => {
    render(<MeetingBotForm />);

    fireEvent.change(screen.getByTestId('meeting-url-input'), {
      target: { value: 'https://example.com/some-room' },
    });
    fireEvent.click(screen.getByTestId('meeting-bot-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('meeting-bot-error-alert')).toHaveTextContent('meet.google.com');
    });
  });

  it('calls dispatchBot and onSuccess on valid submit', async () => {
    const onSuccess = vi.fn();
    const dispatchSpy = vi.spyOn(useMeetingBotStore.getState(), 'dispatchBot').mockResolvedValueOnce('sess-test-123');

    render(<MeetingBotForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByTestId('meeting-url-input'), {
      target: { value: 'https://meet.google.com/abc-defg-hij' },
    });
    fireEvent.click(screen.getByTestId('meeting-bot-submit-btn'));

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith('sess-test-123');
    });
  });
});
