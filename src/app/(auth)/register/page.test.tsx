import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RegisterPage from './page';
import * as apiClient from '@/lib/api-client';
import { ResponseStatus, ResponseCode } from '@/server/constants';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form elements, title, and login link', () => {
    render(<RegisterPage />);

    expect(screen.getByTestId('register-title')).toHaveTextContent('Mulai Gratis dengan Youten');
    expect(screen.getByTestId('register-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-submit-button')).toBeInTheDocument();
    expect(screen.getByTestId('to-login-link')).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    render(<RegisterPage />);

    const passwordInput = screen.getByTestId('register-password-input');
    const toggleButton = screen.getByTestId('toggle-password-visibility');

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows error alert when password does not meet complexity requirements', async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByTestId('register-name-input'), {
      target: { value: 'Budi Santoso' },
    });
    fireEvent.change(screen.getByTestId('register-email-input'), {
      target: { value: 'budi@example.com' },
    });
    // Password shorter than 8 chars and no digit
    fireEvent.change(screen.getByTestId('register-password-input'), {
      target: { value: 'short' },
    });

    fireEvent.click(screen.getByTestId('register-submit-button'));

    expect(await screen.findByTestId('auth-error-alert')).toBeInTheDocument();
    expect(
      screen.getByText(/Kata sandi minimal 8 karakter dan harus mengandung setidaknya 1 angka/i)
    ).toBeInTheDocument();
  });

  it('submits registration form successfully and redirects', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Registered successfully',
      data: {
        access_token: 'acc-new',
        refresh_token: 'ref-new',
        token_type: 'Bearer',
        expires_in: 900,
        refresh_expires_in: 604800,
        user: {
          id: 'user-new',
          email: 'budi@example.com',
          full_name: 'Budi Santoso',
          status: 'ACTIVE',
          daily_quota: 5,
          email_verified: true,
          created_at: new Date().toISOString(),
        },
      },
      timestamp: new Date().toISOString(),
    });

    render(<RegisterPage />);

    fireEvent.change(screen.getByTestId('register-name-input'), {
      target: { value: 'Budi Santoso' },
    });
    fireEvent.change(screen.getByTestId('register-email-input'), {
      target: { value: 'budi@example.com' },
    });
    fireEvent.change(screen.getByTestId('register-password-input'), {
      target: { value: 'Secret123' },
    });

    fireEvent.click(screen.getByTestId('register-submit-button'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('displays error alert when registration API fails', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValueOnce(
      new Error('Email sudah terdaftar.')
    );

    render(<RegisterPage />);

    fireEvent.change(screen.getByTestId('register-name-input'), {
      target: { value: 'Budi Santoso' },
    });
    fireEvent.change(screen.getByTestId('register-email-input'), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByTestId('register-password-input'), {
      target: { value: 'Secret123' },
    });

    fireEvent.click(screen.getByTestId('register-submit-button'));

    expect(await screen.findByTestId('auth-error-alert')).toBeInTheDocument();
    expect(screen.getByText(/Email sudah terdaftar/i)).toBeInTheDocument();
  });
});
