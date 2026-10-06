import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from './page';
import * as apiClient from '@/lib/api-client';
import { ApiResponse, PaginatedResponse } from '@/server/dtos/response.dto';
import { UserProfileResponse } from '@/server/dtos/auth.dto';
import { RecordingListItemDTO } from '@/server/dtos/recording.dto';
import { RecordingStatus } from '@/server/constants/recording.constant';
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

describe('DashboardPage', () => {
  const mockUser: UserProfileResponse = {
    id: 'usr-123',
    email: 'bayu@example.com',
    full_name: 'Bayu Anugerah',
    status: 'active',
    daily_quota: 5,
    quota_used_today: 2,
    quota_remaining: 3,
    email_verified: true,
    created_at: '2026-10-01T00:00:00Z',
  };

  const mockRecordings: RecordingListItemDTO[] = [
    {
      id: 'rec-1',
      title: 'Weekly Standup Engineering',
      original_filename: 'standup.mp3',
      file_size_bytes: 5242880,
      duration_seconds: 900,
      source_type: 'UPLOAD',
      status: RecordingStatus.COMPLETED,
      selected_template: 'DAILY_STANDUP',
      detected_language: 'id',
      output_language: 'id',
      created_at: '2026-10-06T08:00:00Z',
      updated_at: '2026-10-06T08:15:00Z',
    },
    {
      id: 'rec-2',
      title: 'Product Discovery Sprint',
      original_filename: 'discovery.m4a',
      file_size_bytes: 15728640,
      duration_seconds: 3600,
      source_type: 'LINK',
      status: RecordingStatus.QUEUED,
      selected_template: 'GENERAL',
      detected_language: 'en',
      output_language: 'id',
      created_at: '2026-10-06T09:00:00Z',
      updated_at: '2026-10-06T09:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects to /login if user is unauthenticated', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValue(new Error('Unauthorized'));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=/dashboard');
    });
  });

  it('renders user welcome banner, quota widget, and recording list', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/auth/me') {
        const res: ApiResponse<UserProfileResponse> = {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockUser,
          timestamp: new Date().toISOString(),
        };
        return res as unknown as ApiResponse<never>;
      }
      if (url.startsWith('/api/recordings')) {
        const res: PaginatedResponse<RecordingListItemDTO> = {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockRecordings,
          pagination: {
            page: 1,
            limit: 12,
            totalItems: 2,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
          timestamp: new Date().toISOString(),
        };
        return res as unknown as ApiResponse<never>;
      }
      return null as unknown as ApiResponse<never>;
    });

    render(<DashboardPage />);

    expect(await screen.findByText(/Halo, Bayu Anugerah/)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/dari 5 rekaman tersisa/)).toBeInTheDocument();

    expect(await screen.findByText('Weekly Standup Engineering')).toBeInTheDocument();
    expect(screen.getByText('Product Discovery Sprint')).toBeInTheDocument();
    expect(screen.getAllByText('Daily Standup').length).toBeGreaterThanOrEqual(1);
  });

  it('filters recordings by search query after debounce', async () => {
    const apiSpy = vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/auth/me') {
        const res: ApiResponse<UserProfileResponse> = {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockUser,
          timestamp: new Date().toISOString(),
        };
        return res as unknown as ApiResponse<never>;
      }
      const res: PaginatedResponse<RecordingListItemDTO> = {
        status: 'success',
        code: 'SUCCESS',
        message: 'OK',
        data: [mockRecordings[0]],
        pagination: {
          page: 1,
          limit: 12,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        timestamp: new Date().toISOString(),
      };
      return res as unknown as ApiResponse<never>;
    });

    render(<DashboardPage />);
    await screen.findByText('Weekly Standup Engineering');

    const searchInput = screen.getByTestId('dashboard-search-input');
    fireEvent.change(searchInput, { target: { value: 'Weekly' } });

    await waitFor(
      () => {
        expect(apiSpy).toHaveBeenCalledWith(expect.stringContaining('search=Weekly'));
      },
      { timeout: 1000 }
    );
  });

  it('switches between grid and table view mode', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/auth/me') {
        const res: ApiResponse<UserProfileResponse> = {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockUser,
          timestamp: new Date().toISOString(),
        };
        return res as unknown as ApiResponse<never>;
      }
      const res: PaginatedResponse<RecordingListItemDTO> = {
        status: 'success',
        code: 'SUCCESS',
        message: 'OK',
        data: mockRecordings,
        pagination: {
          page: 1,
          limit: 12,
          totalItems: 2,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        timestamp: new Date().toISOString(),
      };
      return res as unknown as ApiResponse<never>;
    });

    render(<DashboardPage />);
    await screen.findByText('Weekly Standup Engineering');

    // Switch to table view
    const listViewBtn = screen.getByTestId('list-view-btn');
    fireEvent.click(listViewBtn);

    // Verify table elements render
    expect(screen.getByText('Judul Rekaman')).toBeInTheDocument();
    expect(screen.getByText('Template')).toBeInTheDocument();

    // Switch back to grid view
    const gridViewBtn = screen.getByTestId('grid-view-btn');
    fireEvent.click(gridViewBtn);
    expect(screen.getByTestId('recording-card-rec-1')).toBeInTheDocument();
  });

  it('handles delete recording flow with confirmation dialog', async () => {
    const deleteApiSpy = vi.fn().mockResolvedValue({
      status: 'success',
      message: 'Deleted',
    });

    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string, opts?: RequestInit) => {
      if (url === '/api/auth/me') {
        const res: ApiResponse<UserProfileResponse> = {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockUser,
          timestamp: new Date().toISOString(),
        };
        return res as unknown as ApiResponse<never>;
      }
      if (url.startsWith('/api/recordings/rec-1') && opts?.method === 'DELETE') {
        return deleteApiSpy() as unknown as ApiResponse<never>;
      }
      const res: PaginatedResponse<RecordingListItemDTO> = {
        status: 'success',
        code: 'SUCCESS',
        message: 'OK',
        data: mockRecordings,
        pagination: {
          page: 1,
          limit: 12,
          totalItems: 2,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        timestamp: new Date().toISOString(),
      };
      return res as unknown as ApiResponse<never>;
    });

    render(<DashboardPage />);
    await screen.findByText('Weekly Standup Engineering');

    // Switch to table view where Delete button is directly clickable
    const listViewBtn = screen.getByTestId('list-view-btn');
    fireEvent.click(listViewBtn);

    const deleteBtns = screen.getAllByLabelText('Hapus rekaman');
    fireEvent.click(deleteBtns[0]);

    // Check dialog opens
    expect(await screen.findByText('Hapus Rekaman?')).toBeInTheDocument();

    // Confirm deletion
    const confirmBtn = screen.getByTestId('delete-confirm-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteApiSpy).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Weekly Standup Engineering')
      );
    });
  });

  it('displays empty state when no recordings match filters', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url: string) => {
      if (url === '/api/auth/me') {
        const res: ApiResponse<UserProfileResponse> = {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockUser,
          timestamp: new Date().toISOString(),
        };
        return res as unknown as ApiResponse<never>;
      }
      const res: PaginatedResponse<RecordingListItemDTO> = {
        status: 'success',
        code: 'SUCCESS',
        message: 'OK',
        data: [],
        pagination: {
          page: 1,
          limit: 12,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        timestamp: new Date().toISOString(),
      };
      return res as unknown as ApiResponse<never>;
    });

    render(<DashboardPage />);
    expect(await screen.findByText('Belum Ada Rekaman')).toBeInTheDocument();
  });
});
