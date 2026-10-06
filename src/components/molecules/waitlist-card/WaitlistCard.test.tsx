import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { WaitlistCard } from './WaitlistCard';
import { WaitlistResponse } from '@/server/dtos/waitlist.dto';

describe('WaitlistCard component', () => {
  it('renders form elements and default values', () => {
    const handleSubmit = vi.fn();
    render(<WaitlistCard onSubmit={handleSubmit} />);

    expect(screen.getByTestId('waitlist-card')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Gabung Waitlist Voice Bot/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('nama@perusahaan.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Minta Akses Beta/i })).toBeInTheDocument();
  });

  it('validates empty email and displays client error message', async () => {
    const handleSubmit = vi.fn();
    render(<WaitlistCard onSubmit={handleSubmit} />);

    const submitBtn = screen.getByRole('button', { name: /Minta Akses Beta/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Email wajib diisi.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('validates invalid email format and displays error message', async () => {
    const handleSubmit = vi.fn();
    render(<WaitlistCard onSubmit={handleSubmit} />);

    const emailInput = screen.getByPlaceholderText('nama@perusahaan.com');
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });

    const submitBtn = screen.getByRole('button', { name: /Minta Akses Beta/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Format alamat email tidak valid.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('submits valid form and transitions to success confirmation view', async () => {
    const mockSuccessResponse: WaitlistResponse = {
      email: 'alex@company.com',
      platform: 'zoom',
      company_size: '11-50',
      status: 'PENDING',
      message: 'Successfully joined waitlist',
    };
    const handleSubmit = vi.fn().mockResolvedValue(mockSuccessResponse);

    render(<WaitlistCard onSubmit={handleSubmit} initialPlatform="zoom" />);

    const emailInput = screen.getByPlaceholderText('nama@perusahaan.com');
    fireEvent.change(emailInput, { target: { value: 'alex@company.com' } });

    const submitBtn = screen.getByRole('button', { name: /Minta Akses Beta/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'alex@company.com',
        platform: 'zoom',
        company_size: '1-10',
      });
    });

    expect(await screen.findByText('Anda Masuk ke Antrean Beta!')).toBeInTheDocument();
    expect(screen.getByText('alex@company.com')).toBeInTheDocument();

    // Reset button returns to form
    const resetBtn = screen.getByRole('button', { name: /Daftarkan Email Lain/i });
    fireEvent.click(resetBtn);

    expect(screen.getByRole('button', { name: /Minta Akses Beta/i })).toBeInTheDocument();
  });

  it('handles submission rejection with error alert', async () => {
    const handleSubmit = vi.fn().mockRejectedValue(new Error('Email already registered'));

    render(<WaitlistCard onSubmit={handleSubmit} />);

    const emailInput = screen.getByPlaceholderText('nama@perusahaan.com');
    fireEvent.change(emailInput, { target: { value: 'existing@company.com' } });

    const submitBtn = screen.getByRole('button', { name: /Minta Akses Beta/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
  });
});
