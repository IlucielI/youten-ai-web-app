import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPasswordPage from './page';
import * as apiClient from '@/lib/api-client';
import { ResponseStatus, ResponseCode } from '@/server/constants';

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders forgot password elements and back link', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByTestId('forgot-password-title')).toHaveTextContent('Lupa Kata Sandi');
    expect(screen.getByTestId('forgot-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('forgot-submit-button')).toBeInTheDocument();
    expect(screen.getByTestId('to-login-link')).toBeInTheDocument();
  });

  it('shows error if email input is empty on submit', async () => {
    render(<ForgotPasswordPage />);

    fireEvent.click(screen.getByTestId('forgot-submit-button'));

    expect(await screen.findByTestId('auth-error-alert')).toBeInTheDocument();
    expect(screen.getByText(/Mohon masukkan alamat email Anda/i)).toBeInTheDocument();
  });

  it('submits email and switches to success confirmation state', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Reset instructions sent',
      timestamp: new Date().toISOString(),
    });

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByTestId('forgot-email-input'), {
      target: { value: 'user@example.com' },
    });

    fireEvent.click(screen.getByTestId('forgot-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('forgot-success-alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/Tautan Pemulihan Dikirim!/i)).toBeInTheDocument();
    expect(screen.getByTestId('back-to-login-btn')).toBeInTheDocument();
  });

  it('displays error alert when reset request fails', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValueOnce(
      new Error('Email tidak ditemukan dalam sistem.')
    );

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByTestId('forgot-email-input'), {
      target: { value: 'unknown@example.com' },
    });

    fireEvent.click(screen.getByTestId('forgot-submit-button'));

    expect(await screen.findByTestId('auth-error-alert')).toBeInTheDocument();
    expect(screen.getByText(/Email tidak ditemukan dalam sistem/i)).toBeInTheDocument();
  });
});
