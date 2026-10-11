import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchPage from './page';
import * as apiClient from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { UserProfileResponse } from '@/server/dtos/auth.dto';
import {
  SemanticSearchResponse,
  WorkspaceAskResponse,
} from '@/server/dtos/workspace.dto';
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

describe('SearchPage Component', () => {
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

  const mockSearchResults: SemanticSearchResponse = {
    query: 'budget',
    count: 1,
    results: [
      {
        recording_id: '11111111-1111-1111-1111-111111111111',
        recording_title: 'Budget Planning Q4',
        chunk_index: 0,
        snippet: 'Alokasi anggaran tim engineering disetujui sebesar 50 juta rupiah.',
        start_time: 120,
        end_time: 180,
        score: 0.94,
      },
    ],
  };

  const mockAskResponse: WorkspaceAskResponse = {
    answer: 'Alokasi anggaran disetujui sebesar 50 juta pada rapat Q4.',
    sources: [
      {
        recording_id: '11111111-1111-1111-1111-111111111111',
        recording_title: 'Budget Planning Q4',
        chunk_index: 0,
        snippet: 'Alokasi anggaran disetujui sebesar 50 juta.',
        start_time: 120,
        end_time: 180,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects to /login?redirect=/search when user is not authenticated', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValue(new Error('Unauthorized'));

    render(<SearchPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=/search');
    });
  });

  it('renders search header, tabs, and user profile when authenticated', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
      status: 'success',
      code: 'SUCCESS',
      message: 'OK',
      data: mockUser,
      timestamp: new Date().toISOString(),
    } as unknown as ApiResponse<never>);

    render(<SearchPage />);

    expect(await screen.findByText('Developer Youten')).toBeInTheDocument();
    expect(screen.getByText('Pencarian Semantik & Memori AI Workspace')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /pencarian semantik/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tanya workspace ai/i })).toBeInTheDocument();
  });

  it('executes semantic search and renders matching results with relevance scores', async () => {
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
      if (url.startsWith('/api/recordings/search')) {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockSearchResults,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      throw new Error(`Unexpected url: ${url}`);
    });

    render(<SearchPage />);
    expect(await screen.findByText('Developer Youten')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/cari berdasarkan makna/i);
    fireEvent.change(searchInput, { target: { value: 'budget' } });

    const searchBtn = screen.getByRole('button', { name: /^cari$/i });
    fireEvent.click(searchBtn);

    expect(await screen.findByText('Budget Planning Q4')).toBeInTheDocument();
    expect(screen.getByText(/Alokasi anggaran tim engineering disetujui/i)).toBeInTheDocument();
    expect(screen.getByText('94% Relevan')).toBeInTheDocument();
    expect(screen.getByText('02:00 - 03:00')).toBeInTheDocument();
  });

  it('triggers search when clicking a quick suggestion chip', async () => {
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
      if (url.startsWith('/api/recordings/search')) {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockSearchResults,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      throw new Error(`Unexpected url: ${url}`);
    });

    render(<SearchPage />);
    expect(await screen.findByText('Developer Youten')).toBeInTheDocument();

    const chip = screen.getByRole('button', { name: 'Sprint Planning' });
    fireEvent.click(chip);

    expect(await screen.findByText('Budget Planning Q4')).toBeInTheDocument();
  });

  it('renders empty state when semantic search returns 0 results', async () => {
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
      if (url.startsWith('/api/recordings/search')) {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: { query: 'nonexistent', count: 0, results: [] },
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      throw new Error(`Unexpected url: ${url}`);
    });

    render(<SearchPage />);
    expect(await screen.findByText('Developer Youten')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/cari berdasarkan makna/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    fireEvent.click(screen.getByRole('button', { name: /^cari$/i }));

    expect(await screen.findByText('Tidak Ada Hasil Ditemukan')).toBeInTheDocument();
  });

  it('renders error state and retries search when query fails', async () => {
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
      if (url.startsWith('/api/recordings/search')) {
        callCount += 1;
        if (callCount === 1) {
          throw new Error('Jaringan terputus saat mencari');
        }
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockSearchResults,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      throw new Error(`Unexpected url: ${url}`);
    });

    render(<SearchPage />);
    expect(await screen.findByText('Developer Youten')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/cari berdasarkan makna/i);
    fireEvent.change(searchInput, { target: { value: 'budget' } });
    fireEvent.click(screen.getByRole('button', { name: /^cari$/i }));

    expect(await screen.findByText('Jaringan terputus saat mencari')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /coba lagi/i });
    fireEvent.click(retryBtn);

    expect(await screen.findByText('Budget Planning Q4')).toBeInTheDocument();
  });

  it('switches to Ask AI tab, submits question and renders answer with citations', async () => {
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
      if (url === '/api/recordings/ask') {
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: mockAskResponse,
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      throw new Error(`Unexpected url: ${url}`);
    });

    render(<SearchPage />);
    expect(await screen.findByText('Developer Youten')).toBeInTheDocument();

    // Switch to Ask AI tab
    const askTab = screen.getByRole('tab', { name: /tanya workspace ai/i });
    fireEvent.click(askTab);

    expect(await screen.findByText(/Asisten Memori AI Workspace/i)).toBeInTheDocument();

    const questionInput = screen.getByPlaceholderText(/tanyakan sesuatu tentang rapat anda/i);
    fireEvent.change(questionInput, { target: { value: 'Berapa anggaran Q4?' } });

    const sendBtn = screen.getByRole('button', { name: /kirim/i });
    fireEvent.click(sendBtn);

    expect(await screen.findByText('Alokasi anggaran disetujui sebesar 50 juta pada rapat Q4.')).toBeInTheDocument();
    expect(screen.getByText('Sumber Rujukan (1 Segmen):')).toBeInTheDocument();
  });

  it('opens command dialog when Cmd+K keyboard shortcut is pressed', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
      status: 'success',
      code: 'SUCCESS',
      message: 'OK',
      data: mockUser,
      timestamp: new Date().toISOString(),
    } as unknown as ApiResponse<never>);

    render(<SearchPage />);
    expect(await screen.findByText('Developer Youten')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    expect(await screen.findByPlaceholderText('Ketik kata kunci untuk mencari...')).toBeInTheDocument();
    expect(screen.getByText('Buka Mode Pencarian Semantik')).toBeInTheDocument();
  });

  it('redirects to /login on successful logout and shows toast on logout failure', async () => {
    let logoutFail = false;
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
      if (url === '/api/auth/logout') {
        if (logoutFail) {
          throw new Error('Logout failed');
        }
        return {
          status: 'success',
          code: 'SUCCESS',
          message: 'OK',
          data: { success: true },
          timestamp: new Date().toISOString(),
        } as unknown as ApiResponse<never>;
      }
      throw new Error(`Unexpected url: ${url}`);
    });

    const { rerender } = render(<SearchPage />);
    expect(await screen.findByText('Developer Youten')).toBeInTheDocument();

    const trigger = await screen.findByTestId('user-nav-dropdown-trigger');
    fireEvent.pointerDown(trigger, { button: 0 });
    fireEvent.click(trigger);
    const logoutBtn = await screen.findByTestId('logout-btn');
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    // Test error case
    logoutFail = true;
    rerender(<SearchPage />);
    const trigger2 = await screen.findByTestId('user-nav-dropdown-trigger');
    fireEvent.pointerDown(trigger2, { button: 0 });
    fireEvent.click(trigger2);
    const logoutBtn2 = await screen.findByTestId('logout-btn');
    fireEvent.click(logoutBtn2);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Gagal keluar dari sesi. Silakan coba kembali.');
    });
  });
});
