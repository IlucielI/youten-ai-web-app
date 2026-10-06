import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResetPasswordPage from './page';
import * as apiClient from '@/lib/api-client';
import { ResponseStatus, ResponseCode } from '@/server/constants';

let mockTokenParam: string | null = 'test-token-123';

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'token' ? mockTokenParam : null),
  }),
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTokenParam = 'test-token-123';
  });

  it('renders elements and pre-populates token from URL search parameter', () => {
    render(<ResetPasswordPage />);

    expect(screen.getByTestId('reset-password-title')).toHaveTextContent('Atur Ulang Kata Sandi');
    expect(screen.getByTestId('reset-token-input')).toHaveValue('test-token-123');
    expect(screen.getByTestId('reset-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('reset-submit-button')).toBeInTheDocument();
    expect(screen.getByTestId('to-login-link')).toBeInTheDocument();
  });

  it('validates password requirements before submission', async () => {
    render(<ResetPasswordPage />);

    // Password with no digit and < 8 chars
    fireEvent.change(screen.getByTestId('reset-password-input'), {
      target: { value: 'short' },
    });

    fireEvent.click(screen.getByTestId('reset-submit-button'));

    expect(await screen.findByTestId('auth-error-alert')).toBeInTheDocument();
    expect(
      screen.getByText(/Kata sandi baru minimal 8 karakter dan harus mengandung setidaknya 1 angka/i)
    ).toBeInTheDocument();
  });

  it('submits reset request and displays success confirmation banner', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Password reset successfully',
      timestamp: new Date().toISOString(),
    });

    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByTestId('reset-password-input'), {
      target: { value: 'NewSecurePassword123' },
    });

    fireEvent.click(screen.getByTestId('reset-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('reset-success-alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/Kata Sandi Berhasil Diperbarui!/i)).toBeInTheDocument();
    expect(screen.getByTestId('to-login-btn')).toBeInTheDocument();
  });

  it('displays error alert when reset API fails', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValueOnce(
      new Error('Token pemulihan kedaluwarsa atau tidak valid.')
    );

    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByTestId('reset-password-input'), {
      target: { value: 'NewSecurePassword123' },
    });

    fireEvent.click(screen.getByTestId('reset-submit-button'));

    expect(await screen.findByTestId('auth-error-alert')).toBeInTheDocument();
    expect(screen.getByText(/Token pemulihan kedaluwarsa atau tidak valid/i)).toBeInTheDocument();
  });
});
