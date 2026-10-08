import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LandingPage from './page';
import { useTokenStore } from '@/stores/token.store';
import * as apiClient from '@/lib/api-client';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTokenStore.setState({
      guestTokens: [],
      anonSession: {
        anon_token: 'mock-anon-jwt',
        session_id: 'mock-session-id',
        client_id: 'client-app',
        expires_at: Date.now() + 3600000,
      },
    });
  });

  it('renders hero title and subtitle', () => {
    render(<LandingPage />);

    expect(screen.getByText('Youten — Inti dari Setiap Percakapan')).toBeInTheDocument();
    expect(
      screen.getByText(/Transkripsi cerdas, intisari keputusan, dan tanya jawab bertenaga AI/i)
    ).toBeInTheDocument();
  });

  it('renders guest quota banner with login link', () => {
    render(<LandingPage />);

    expect(screen.getByTestId('guest-quota-banner')).toBeInTheDocument();
    expect(screen.getByText(/1 unggahan gratis per hari/i)).toBeInTheDocument();
  });

  it('renders 4 ingestion tabs and defaults to upload dropzone', () => {
    render(<LandingPage />);

    expect(screen.getByTestId('tab-upload')).toBeInTheDocument();
    expect(screen.getByTestId('tab-url')).toBeInTheDocument();
    expect(screen.getByTestId('tab-record')).toBeInTheDocument();
    expect(screen.getByTestId('tab-bot')).toBeInTheDocument();

    expect(screen.getByTestId('upload-dropzone')).toBeInTheDocument();
  });

  it('switches to URL import tab when clicked', () => {
    render(<LandingPage />);

    fireEvent.click(screen.getByTestId('tab-url'));
    expect(screen.getByTestId('url-import-form')).toBeInTheDocument();
  });

  it('switches to browser recorder tab when clicked', () => {
    render(<LandingPage />);

    fireEvent.click(screen.getByTestId('tab-record'));
    expect(screen.getByTestId('browser-recorder')).toBeInTheDocument();
  });

  it('switches to meeting bot preview tab and shows waitlist CTA', () => {
    render(<LandingPage />);

    fireEvent.click(screen.getByTestId('tab-bot'));
    expect(screen.getByTestId('voice-bot-tab-content')).toBeInTheDocument();
    expect(screen.getByTestId('bot-waitlist-btn')).toBeInTheDocument();
    expect(screen.getByText('Asisten Bot Notula Otomatis')).toBeInTheDocument();
  });

  it('handles URL import successfully and saves guest token before redirect', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: 'success',
      code: 'CREATED',
      message: 'Success',
      data: {
        id: 'rec-test-123',
        title: 'Podcast Episode 1',
        original_filename: 'podcast.mp3',
        file_size_bytes: 4096,
        status: 'QUEUED',
        selected_template: 'GENERAL',
        output_language: 'id',
        is_guest: true,
        ownership_token: 'token-guest-podcast',
        created_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    render(<LandingPage />);

    fireEvent.click(screen.getByTestId('tab-url'));

    const urlInput = screen.getByTestId('media-url-input');
    fireEvent.change(urlInput, { target: { value: 'https://example.com/audio.mp3' } });

    const submitBtn = screen.getByTestId('submit-url-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/recordings/rec-test-123/processing');
    });

    const storedTokens = useTokenStore.getState().guestTokens;
    expect(storedTokens).toHaveLength(1);
    expect(storedTokens[0].id).toBe('rec-test-123');
    expect(storedTokens[0].ownership_token).toBe('token-guest-podcast');
  });

  it('displays quota exhaustion alert when API returns HTTP 429', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValueOnce(
      new apiClient.ApiClientError(429, 'ERR_RATE_LIMIT_EXCEEDED', 'Daily quota reached')
    );

    render(<LandingPage />);

    fireEvent.click(screen.getByTestId('tab-url'));

    const urlInput = screen.getByTestId('media-url-input');
    fireEvent.change(urlInput, { target: { value: 'https://example.com/audio.mp3' } });

    const submitBtn = screen.getByTestId('submit-url-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('quota-alert')).toBeInTheDocument();
      expect(screen.getByText(/Batas Kuota Tamu Tercapai/i)).toBeInTheDocument();
    });
  });
});
