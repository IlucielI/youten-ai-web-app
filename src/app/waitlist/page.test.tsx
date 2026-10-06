import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WaitlistPage from './page';
import * as apiClient from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { WaitlistResponse } from '@/server/dtos/waitlist.dto';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('WaitlistPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders hero title, highlights, and FAQ items', () => {
    render(<WaitlistPage />);

    expect(screen.getByTestId('waitlist-page')).toBeInTheDocument();
    expect(screen.getByText('Asisten Suara Otomatis di Setiap')).toBeInTheDocument();
    expect(screen.getByText('Kenapa Memilih Youten Bot?')).toBeInTheDocument();
    expect(screen.getByText('Pertanyaan yang Sering Diajukan')).toBeInTheDocument();
    expect(screen.getByText('Hadir Otomatis Tanpa Ribet')).toBeInTheDocument();
  });

  it('submits waitlist form successfully and shows success toast', async () => {
    const mockSuccessData: WaitlistResponse = {
      email: 'lead@enterprise.com',
      platform: 'google_meet',
      company_size: '51-200',
      status: 'PENDING',
      message: 'Successfully joined meeting voice bot beta waitlist',
    };

    const apiSpy = vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
      status: 'success',
      code: 'SUCCESS',
      message: 'OK',
      data: mockSuccessData,
      timestamp: new Date().toISOString(),
    } as unknown as ApiResponse<never>);

    render(<WaitlistPage />);

    const emailInput = screen.getByPlaceholderText('nama@perusahaan.com');
    fireEvent.change(emailInput, { target: { value: 'lead@enterprise.com' } });

    const submitBtn = screen.getByRole('button', { name: /Minta Akses Beta/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith(
        '/api/waitlist/bot',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    expect(toast.success).toHaveBeenCalledWith(
      'Pendaftaran berhasil! Anda telah masuk antrean beta.'
    );
    expect(await screen.findByText('Anda Masuk ke Antrean Beta!')).toBeInTheDocument();
    expect(screen.getByText('lead@enterprise.com')).toBeInTheDocument();
  });

  it('handles submission error and shows error toast', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValue(new Error('Email already in waitlist'));

    render(<WaitlistPage />);

    const emailInput = screen.getByPlaceholderText('nama@perusahaan.com');
    fireEvent.change(emailInput, { target: { value: 'duplicate@enterprise.com' } });

    const submitBtn = screen.getByRole('button', { name: /Minta Akses Beta/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already in waitlist');
    });

    expect(await screen.findByText('Email already in waitlist')).toBeInTheDocument();
  });
});
