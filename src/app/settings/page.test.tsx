import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from './page';
import * as apiClient from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserStatus } from '@/server/constants/recording.constant';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SettingsPage', () => {
  const mockPush = vi.fn();
  const mockUser = {
    id: 'user-123',
    email: 'bayu@example.com',
    full_name: 'Bayu Wicaksono',
    status: UserStatus.ACTIVE,
    daily_quota: 5,
    quota_used_today: 2,
    quota_remaining: 3,
    email_verified: true,
    created_at: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(() => new Promise(() => {}));
    render(<SettingsPage />);
    expect(screen.getByTestId('settings-loading')).toBeInTheDocument();
  });

  it('redirects to /login?redirect=/settings when session check fails', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValue(new Error('Unauthorized'));
    render(<SettingsPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=/settings');
    });
  });

  it('renders profile and quota data when user is authenticated', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
      status: 'SUCCESS',
      code: 'SUCCESS',
      message: 'OK',
      data: mockUser,
      timestamp: new Date().toISOString(),
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Pengaturan Akun' })).toBeInTheDocument();
    expect(screen.getByTestId('input-full-name')).toHaveValue('Bayu Wicaksono');
    expect(screen.getByTestId('input-email')).toHaveValue('bayu@example.com');
    expect(screen.getByTestId('input-email')).toBeDisabled();

    // Check quota stats
    expect(screen.getByTestId('quota-card')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // remaining
    expect(screen.getByText('/ 5')).toBeInTheDocument(); // total
    expect(screen.getByText('Terpakai: 2 rapat')).toBeInTheDocument();
  });

  it('allows user to edit and save full_name', async () => {
    const apiFetchSpy = vi.spyOn(apiClient, 'apiFetch').mockImplementation((url, options) => {
      if (url === '/api/auth/me' && !options?.method) {
        return Promise.resolve({
          status: 'SUCCESS',
          code: 'SUCCESS',
          message: 'OK',
          data: mockUser,
          timestamp: new Date().toISOString(),
        });
      }
      if (url === '/api/auth/me' && options?.method === 'PUT') {
        return Promise.resolve({
          status: 'SUCCESS',
          code: 'SUCCESS',
          message: 'Profile updated',
          data: { ...mockUser, full_name: 'Bayu Perkasa' },
          timestamp: new Date().toISOString(),
        });
      }
      return Promise.reject(new Error('Unhandled'));
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('input-full-name')).toBeInTheDocument();
    });

    const nameInput = screen.getByTestId('input-full-name');
    fireEvent.change(nameInput, { target: { value: 'Bayu Perkasa' } });

    const saveButton = screen.getByTestId('button-save-profile');
    expect(saveButton).not.toBeDisabled();
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: 'Bayu Perkasa' }),
      });
      expect(toast.success).toHaveBeenCalledWith('Profil berhasil diperbarui!');
    });
  });

  it('validates minimum length on full_name update', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
      status: 'SUCCESS',
      code: 'SUCCESS',
      message: 'OK',
      data: mockUser,
      timestamp: new Date().toISOString(),
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('input-full-name')).toBeInTheDocument();
    });

    const nameInput = screen.getByTestId('input-full-name');
    fireEvent.change(nameInput, { target: { value: 'A' } });

    const saveButton = screen.getByTestId('button-save-profile');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Nama lengkap minimal harus terdiri dari 2 karakter.');
    });
  });

  it('switches to security tab and changes password successfully', async () => {
    const apiFetchSpy = vi.spyOn(apiClient, 'apiFetch').mockImplementation((url, options) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          status: 'SUCCESS',
          code: 'SUCCESS',
          message: 'OK',
          data: mockUser,
          timestamp: new Date().toISOString(),
        });
      }
      if (url === '/api/auth/change-password' && options?.method === 'PUT') {
        return Promise.resolve({
          status: 'SUCCESS',
          code: 'SUCCESS',
          message: 'Password changed successfully',
          timestamp: new Date().toISOString(),
        });
      }
      return Promise.reject(new Error('Unhandled'));
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('tab-security')).toBeInTheDocument();
    });

    // Switch to Security tab
    fireEvent.click(screen.getByTestId('tab-security'));

    expect(screen.getByTestId('input-old-password')).toBeInTheDocument();
    expect(screen.getByTestId('input-new-password')).toBeInTheDocument();
    expect(screen.getByTestId('input-confirm-password')).toBeInTheDocument();

    // Fill password form
    fireEvent.change(screen.getByTestId('input-old-password'), { target: { value: 'OldPassword123' } });
    fireEvent.change(screen.getByTestId('input-new-password'), { target: { value: 'NewSecurePassword456' } });
    fireEvent.change(screen.getByTestId('input-confirm-password'), { target: { value: 'NewSecurePassword456' } });

    const changeBtn = screen.getByTestId('button-change-password');
    expect(changeBtn).not.toBeDisabled();
    fireEvent.click(changeBtn);

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_password: 'OldPassword123',
          new_password: 'NewSecurePassword456',
        }),
      });
      expect(toast.success).toHaveBeenCalledWith('Kata sandi berhasil diperbarui!');
    });

    // Inputs should be cleared
    expect(screen.getByTestId('input-old-password')).toHaveValue('');
    expect(screen.getByTestId('input-new-password')).toHaveValue('');
    expect(screen.getByTestId('input-confirm-password')).toHaveValue('');
  });

  it('rejects password change if confirmation does not match', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
      status: 'SUCCESS',
      code: 'SUCCESS',
      message: 'OK',
      data: mockUser,
      timestamp: new Date().toISOString(),
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('tab-security')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-security'));

    fireEvent.change(screen.getByTestId('input-old-password'), { target: { value: 'OldPassword123' } });
    fireEvent.change(screen.getByTestId('input-new-password'), { target: { value: 'NewSecurePassword456' } });
    fireEvent.change(screen.getByTestId('input-confirm-password'), { target: { value: 'MismatchPassword789' } });

    fireEvent.click(screen.getByTestId('button-change-password'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Konfirmasi kata sandi tidak cocok.');
    });
  });

  it('rejects password change if new password lacks numbers', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
      status: 'SUCCESS',
      code: 'SUCCESS',
      message: 'OK',
      data: mockUser,
      timestamp: new Date().toISOString(),
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('tab-security')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-security'));

    fireEvent.change(screen.getByTestId('input-old-password'), { target: { value: 'OldPassword123' } });
    fireEvent.change(screen.getByTestId('input-new-password'), { target: { value: 'NoDigitsInThisPassword' } });
    fireEvent.change(screen.getByTestId('input-confirm-password'), { target: { value: 'NoDigitsInThisPassword' } });

    fireEvent.click(screen.getByTestId('button-change-password'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Kata sandi baru harus mengandung minimal satu angka (0-9).');
    });
  });

  it('logs out and redirects to /login when logout button is clicked', async () => {
    const apiFetchSpy = vi.spyOn(apiClient, 'apiFetch').mockImplementation((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          status: 'SUCCESS',
          code: 'SUCCESS',
          message: 'OK',
          data: mockUser,
          timestamp: new Date().toISOString(),
        });
      }
      if (url === '/api/auth/logout') {
        return Promise.resolve({
          status: 'SUCCESS',
          code: 'SUCCESS',
          message: 'Logged out',
          timestamp: new Date().toISOString(),
        });
      }
      return Promise.reject(new Error('Unhandled'));
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
