import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedbackDialog } from './FeedbackDialog';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import * as apiClient from '@/lib/api-client';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('FeedbackDialog Organism', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isInitialized: true });
    useUiStore.setState({ activeModal: null });
  });

  it('renders modal when open prop is true', () => {
    render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByTestId('feedback-dialog')).toBeInTheDocument();
    expect(screen.getByText('Kirim Masukan & Feedback')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-category-bug')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-message-input')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-submit-btn')).toBeDisabled();
  });

  it('renders modal when triggered via useUiStore activeModal', () => {
    useUiStore.setState({ activeModal: 'feedback' });
    render(<FeedbackDialog />);

    expect(screen.getByTestId('feedback-dialog')).toBeInTheDocument();
  });

  it('allows user to change category and rate with stars', () => {
    render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);

    // Click bug category
    fireEvent.click(screen.getByTestId('feedback-category-bug'));
    expect(screen.getByTestId('feedback-category-bug')).toHaveClass('text-rose-600');

    // Click 4-star rating
    fireEvent.click(screen.getByTestId('feedback-rating-star-4'));
    expect(screen.getByText('Puas')).toBeInTheDocument();
  });

  it('validates min length on title and message before enabling submit', () => {
    render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);

    const submitBtn = screen.getByTestId('feedback-submit-btn');
    const titleInput = screen.getByTestId('feedback-title-input');
    const messageInput = screen.getByTestId('feedback-message-input');

    expect(submitBtn).toBeDisabled();

    // Fill short title (< 4)
    fireEvent.change(titleInput, { target: { value: 'abc' } });
    expect(screen.getByText('Judul minimal 4 karakter.')).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Fill valid title (>= 4)
    fireEvent.change(titleInput, { target: { value: 'Fitur Bagus' } });
    expect(screen.queryByText('Judul minimal 4 karakter.')).not.toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Fill short message (< 10)
    fireEvent.change(messageInput, { target: { value: 'pendek' } });
    expect(screen.getByText('Pesan minimal 10 karakter.')).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Fill valid message (>= 10)
    fireEvent.change(messageInput, { target: { value: 'Pesan ini cukup panjang dan detail.' } });
    expect(screen.queryByText('Pesan minimal 10 karakter.')).not.toBeInTheDocument();
    expect(submitBtn).toBeEnabled();
  });

  it('submits feedback successfully and resets form', async () => {
    const apiSpy = vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: 'success',
      data: { id: 'fb-test-123' },
    });
    const handleOpenChange = vi.fn();

    render(<FeedbackDialog open={true} onOpenChange={handleOpenChange} />);

    fireEvent.click(screen.getByTestId('feedback-category-praise'));
    fireEvent.click(screen.getByTestId('feedback-rating-star-5'));
    fireEvent.change(screen.getByTestId('feedback-title-input'), {
      target: { value: 'Platform Sangat Membantu' },
    });
    fireEvent.change(screen.getByTestId('feedback-message-input'), {
      target: { value: 'Transkripsi audio sangat cepat dan akurasi tinggi.' },
    });
    fireEvent.change(screen.getByTestId('feedback-name-input'), {
      target: { value: 'Budi Santoso' },
    });
    fireEvent.change(screen.getByTestId('feedback-email-input'), {
      target: { value: 'budi@example.com' },
    });

    fireEvent.click(screen.getByTestId('feedback-submit-btn'));

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith(
        '/api/feedback',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Idempotency-Key': expect.any(String),
          }),
        })
      );
      expect(toast.success).toHaveBeenCalledWith(
        'Terima Kasih atas Masukan Anda!',
        expect.any(Object)
      );
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    apiSpy.mockRestore();
  });

  it('displays user profile info when logged in and allows anonymous toggle', async () => {
    useAuthStore.setState({
      user: {
        id: 'u-1',
        email: 'user@example.com',
        full_name: 'John Doe',
        status: 'active',
        created_at: new Date().toISOString(),
        role_name: 'Member',
        role_code: 'member',
        daily_quota: 10,
        quota_used_today: 5,
        quota_remaining: 5,
        email_verified: true,
      },
      isInitialized: true,
    });

    const apiSpy = vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: 'success',
      data: { id: 'fb-user-123' },
    });

    render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-anonymous-toggle')).toBeInTheDocument();

    // Toggle anonymous
    fireEvent.click(screen.getByTestId('feedback-anonymous-toggle'));

    fireEvent.change(screen.getByTestId('feedback-title-input'), {
      target: { value: 'Saran tampilan baru' },
    });
    fireEvent.change(screen.getByTestId('feedback-message-input'), {
      target: { value: 'Bisa tolong tambahkan dark mode kontras tinggi?' },
    });

    fireEvent.click(screen.getByTestId('feedback-submit-btn'));

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledTimes(1);
      const call = apiSpy.mock.calls[0];
      const parsedBody = JSON.parse(call[1]?.body as string);
      expect(parsedBody.user_name).toBeUndefined();
      expect(parsedBody.user_email).toBeUndefined();
    });

    apiSpy.mockRestore();
  });

  it('handles rate limit 429 error gracefully', async () => {
    const apiSpy = vi.spyOn(apiClient, 'apiFetch').mockRejectedValueOnce(
      new apiClient.ApiClientError(429, 'TOO_MANY_REQUESTS', 'Rate limit exceeded')
    );

    render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);

    fireEvent.change(screen.getByTestId('feedback-title-input'), {
      target: { value: 'Test Rate Limit' },
    });
    fireEvent.change(screen.getByTestId('feedback-message-input'), {
      target: { value: 'Mencoba mengirim feedback berulang kali.' },
    });

    fireEvent.click(screen.getByTestId('feedback-submit-btn'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mengirim feedback lagi.'
      );
    });

    apiSpy.mockRestore();
  });

  it('supports image attachment upload and attaches it to submission payload', async () => {
    // 1. Mock presign call
    const presignMock = vi.fn().mockResolvedValue({
      status: 'success',
      data: {
        upload_url: 'https://s3.example.com/recordings/feedbacks/uuid/test.png?sig=abc',
        object_key: 'feedbacks/uuid/test.png',
        download_url: 'https://s3.example.com/recordings/feedbacks/uuid/test.png',
        filename: 'test.png',
        content_type: 'image/png',
        file_size_bytes: 1024,
      },
    });

    // 2. Mock submit call
    const submitMock = vi.fn().mockResolvedValue({
      status: 'success',
      data: { id: 'fb-att-123' },
    });

    const apiSpy = vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (url) => {
      if (url === '/api/feedback/presign') {
        return presignMock();
      }
      return submitMock();
    });

    // 3. Mock S3 direct PUT fetch
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 })
    );

    // Mock URL.createObjectURL
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-preview-url');
    }

    render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);

    // Select file
    const file = new File(['mock content'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('feedback-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for S3 upload and UI attachment list item
    await waitFor(() => {
      expect(screen.getByText('test.png')).toBeInTheDocument();
    });

    // Fill required fields
    fireEvent.change(screen.getByTestId('feedback-title-input'), {
      target: { value: 'Bug with attachment' },
    });
    fireEvent.change(screen.getByTestId('feedback-message-input'), {
      target: { value: 'Detailed description of the issue with screenshot.' },
    });

    // Submit
    fireEvent.click(screen.getByTestId('feedback-submit-btn'));

    await waitFor(() => {
      expect(submitMock).toHaveBeenCalledTimes(1);
      const submitCall = apiSpy.mock.calls.find((call) => call[0] === '/api/feedback');
      expect(submitCall).toBeDefined();
      const body = JSON.parse(submitCall![1]?.body as string);
      expect(body.attachments).toEqual([
        expect.objectContaining({
          filename: 'test.png',
          content_type: 'image/png',
          url: 'https://s3.example.com/recordings/feedbacks/uuid/test.png',
        }),
      ]);
    });

    apiSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it('allows removing an uploaded attachment', async () => {
    const apiSpy = vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
      status: 'success',
      data: {
        upload_url: 'https://s3.example.com/recordings/feedbacks/uuid/remove.png?sig=abc',
        download_url: 'https://s3.example.com/recordings/feedbacks/uuid/remove.png',
        filename: 'remove.png',
        content_type: 'image/png',
      },
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 })
    );

    render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);

    const file = new File(['content'], 'remove.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('feedback-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('remove.png')).toBeInTheDocument();
    });

    // Find remove button
    const removeBtn = screen.getByRole('button', { name: 'Hapus lampiran' });
    fireEvent.click(removeBtn);

    expect(screen.queryByText('remove.png')).not.toBeInTheDocument();

    apiSpy.mockRestore();
    fetchSpy.mockRestore();
  });
});

