import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SpeakersPage from './page';
import * as apiClient from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { UserProfileResponse } from '@/server/dtos/auth.dto';
import { SpeakerDirectoryResponse, SpeakerSummaryDTO } from '@/server/dtos/workspace.dto';
import { toast } from 'sonner';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SpeakersPage Component', () => {
  const mockUser: UserProfileResponse = {
    id: 'usr-123',
    email: 'developer@example.com',
    full_name: 'Developer Youten',
    status: 'active',
    daily_quota: 5,
    quota_used_today: 1,
    quota_remaining: 4,
    email_verified: true,
    created_at: '2026-10-01T00:00:00Z',
  };

  const mockSpeakers: SpeakerSummaryDTO[] = [
    {
      name: 'Alice Johnson',
      total_meetings: 14,
      total_talk_time: 18450.0,
      last_active: '2026-10-06T00:00:00.000Z',
    },
    {
      name: 'Bob Smith',
      total_meetings: 12,
      total_talk_time: 14200.0,
      last_active: '2026-10-06T00:00:00.000Z',
    },
    {
      name: 'Charlie Brown',
      total_meetings: 8,
      total_talk_time: 5600.0,
      last_active: '2026-10-05T00:00:00.000Z',
    },
  ];

  const mockDirectoryResponse: SpeakerDirectoryResponse = {
    count: mockSpeakers.length,
    speakers: mockSpeakers,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects to /login?redirect=/speakers when user is not authenticated', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValue(new Error('Unauthorized'));

    render(<SpeakersPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=/speakers');
    });
  });

  it('renders user profile, header, and speaker cards on successful data load', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/auth/me') {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockUser,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      if (url === '/api/speakers') {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockDirectoryResponse,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      return {} as ApiResponse<never>;
    });

    render(<SpeakersPage />);

    // Check user info rendered
    expect(await screen.findByText('Developer Youten')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Direktori Pembicara' })).toBeInTheDocument();

    // Check summary statistics rendered (async data fetch)
    expect(await screen.findByText('Total Pembicara Unik')).toBeInTheDocument();
    expect(await screen.findByText('3')).toBeInTheDocument(); // 3 speakers
    expect(await screen.findByText('Total Sesi Kehadiran')).toBeInTheDocument();
    expect(await screen.findByText('34')).toBeInTheDocument(); // 14 + 12 + 8 = 34

    // Check speaker cards rendered
    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
  });

  it('filters speakers by search query and allows resetting search', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/auth/me') {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockUser,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      if (url === '/api/speakers') {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockDirectoryResponse,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      return {} as ApiResponse<never>;
    });

    render(<SpeakersPage />);

    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument();

    // Filter by "Charlie"
    const searchInput = screen.getByPlaceholderText('Cari nama pembicara...');
    fireEvent.change(searchInput, { target: { value: 'Charlie' } });

    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();

    // Filter with no match
    fireEvent.change(searchInput, { target: { value: 'Zack' } });
    expect(await screen.findByText('Pembicara Tidak Ditemukan')).toBeInTheDocument();

    // Reset search
    const resetButton = screen.getByRole('button', { name: /Reset Pencarian/i });
    fireEvent.click(resetButton);

    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
  });

  it('sorts speakers by talk_time descending on initial render', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/auth/me') {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockUser,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      if (url === '/api/speakers') {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: {
            count: 3,
            speakers: [
              mockSpeakers[2], // Charlie: 5600s
              mockSpeakers[0], // Alice: 18450s
              mockSpeakers[1], // Bob: 14200s
            ],
          },
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      return {} as ApiResponse<never>;
    });

    render(<SpeakersPage />);

    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument();
    const names = screen.getAllByTestId('speaker-name').map((el) => el.textContent);
    expect(names).toEqual(['Alice Johnson', 'Bob Smith', 'Charlie Brown']);
  });

  it('renders empty state when workspace has 0 indexed speakers', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/auth/me') {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockUser,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      if (url === '/api/speakers') {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: { count: 0, speakers: [] },
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      return {} as ApiResponse<never>;
    });

    render(<SpeakersPage />);

    expect(await screen.findByText('Belum Ada Pembicara Terindeks')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buka Dashboard Rekaman/i })).toBeInTheDocument();
  });

  it('renders error state and retries on failure', async () => {
    let callCount = 0;
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/auth/me') {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockUser,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      if (url === '/api/speakers') {
        callCount++;
        if (callCount === 1) {
          throw new Error('Database connection failed');
        }
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockDirectoryResponse,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      return {} as ApiResponse<never>;
    });

    render(<SpeakersPage />);

    expect(await screen.findByText('Terjadi Kesalahan')).toBeInTheDocument();
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();

    // Click retry
    const retryBtn = screen.getByRole('button', { name: /Coba Lagi/i });
    fireEvent.click(retryBtn);

    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument();
  });

  it('handles user logout successfully', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/auth/me') {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockUser,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      if (url === '/api/speakers') {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockDirectoryResponse,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      if (url === '/api/auth/logout') {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
        } as unknown as ApiResponse<never>;
      }
      return {} as ApiResponse<never>;
    });

    render(<SpeakersPage />);

    expect(await screen.findByText('Developer Youten')).toBeInTheDocument();

    const logoutButton = screen.getByRole('button', { name: /Keluar/i });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('handles logout error gracefully', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/auth/me') {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockUser,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      if (url === '/api/speakers') {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockDirectoryResponse,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      if (url === '/api/auth/logout') {
        throw new Error('Logout failed');
      }
      return {} as ApiResponse<never>;
    });

    render(<SpeakersPage />);

    expect(await screen.findByText('Developer Youten')).toBeInTheDocument();

    const logoutButton = screen.getByRole('button', { name: /Keluar/i });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Gagal keluar dari sesi. Silakan coba kembali.');
    });
  });
});
