import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './page';
import * as apiClient from '@/lib/api-client';
import { ResponseStatus, ResponseCode } from '@/server/constants';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form elements, title, and links', () => {
    render(<LoginPage />);

    expect(screen.getByTestId('login-title')).toHaveTextContent('Masuk ke Akun Anda');
    expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit-button')).toBeInTheDocument();
    expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument();
    expect(screen.getByTestId('to-register-link')).toBeInTheDocument();
  });

  it('toggles password visibility between password and text input types', () => {
    render(<LoginPage />);

    const passwordInput = screen.getByTestId('login-password-input');
    const toggleButton = screen.getByTestId('toggle-password-visibility');

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows error alert if required inputs are empty on submit', async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByTestId('login-submit-button'));

    expect(await screen.findByTestId('auth-error-alert')).toBeInTheDocument();
    expect(screen.getByText(/Mohon isi alamat email dan kata sandi Anda/i)).toBeInTheDocument();
  });

  it('submits valid credentials and redirects to home on success', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Logged in',
      data: {
        access_token: 'acc-123',
        refresh_token: 'ref-123',
        token_type: 'Bearer',
        expires_in: 900,
        refresh_expires_in: 604800,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          full_name: 'Test User',
          status: 'ACTIVE',
          daily_quota: 5,
          email_verified: true,
          created_at: new Date().toISOString(),
        },
      },
      timestamp: new Date().toISOString(),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByTestId('login-email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('login-password-input'), {
      target: { value: 'Password123' },
    });

    fireEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('displays error alert when login credentials fail', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValueOnce(
      new Error('Email atau kata sandi tidak sesuai.')
    );

    render(<LoginPage />);

    fireEvent.change(screen.getByTestId('login-email-input'), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByTestId('login-password-input'), {
      target: { value: 'WrongPass123' },
    });

    fireEvent.click(screen.getByTestId('login-submit-button'));

    expect(await screen.findByTestId('auth-error-alert')).toBeInTheDocument();
    expect(screen.getByText(/Email atau kata sandi tidak sesuai/i)).toBeInTheDocument();
  });
});
