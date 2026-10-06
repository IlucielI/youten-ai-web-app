import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadDropzone, formatFileSize } from './UploadDropzone';
import { TemplateKey } from '@/server/constants/template.constant';

describe('UploadDropzone Organism', () => {
  it('formats file sizes safely for valid and edge cases', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(-100)).toBe('0 B');
    expect(formatFileSize(NaN)).toBe('0 B');
    expect(formatFileSize(Infinity)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1024 * 1024 * 5)).toBe('5.0 MB');
    expect(formatFileSize(Number.MAX_VALUE)).toContain('GB');
  });
  it('renders dropzone target with supported extensions', () => {
    render(<UploadDropzone />);

    expect(screen.getByTestId('upload-dropzone')).toBeInTheDocument();
    expect(screen.getByText('Tarik & Lepas File Rekaman di Sini')).toBeInTheDocument();
    expect(screen.getByText('.mp3')).toBeInTheDocument();
    expect(screen.getByText('.mp4')).toBeInTheDocument();
  });

  it('rejects unsupported file formats with error message', () => {
    render(<UploadDropzone />);

    const file = new File(['dummy'], 'document.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByTestId('upload-error-alert')).toBeInTheDocument();
    expect(screen.getByText(/Format file tidak didukung/)).toBeInTheDocument();
  });

  it('accepts valid media file, populates title, and allows changing template', () => {
    render(<UploadDropzone />);

    const file = new File(['fake audio'], 'meeting-audio.mp3', { type: 'audio/mp3' });
    const fileInput = screen.getByTestId('file-input');

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('meeting-audio.mp3')).toBeInTheDocument();
    const titleInput = screen.getByTestId('recording-title-input') as HTMLInputElement;
    expect(titleInput.value).toBe('meeting-audio');

    // Change template to MOM
    const templateSelect = screen.getByTestId('template-select') as HTMLSelectElement;
    fireEvent.change(templateSelect, { target: { value: TemplateKey.MOM } });
    expect(templateSelect.value).toBe(TemplateKey.MOM);
  });

  it('clears selected file when clear button is clicked', () => {
    render(<UploadDropzone />);

    const file = new File(['audio'], 'team-sync.m4a', { type: 'audio/m4a' });
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('team-sync.m4a')).toBeInTheDocument();

    const clearBtn = screen.getByTestId('clear-file-btn');
    fireEvent.click(clearBtn);

    expect(screen.getByText('Tarik & Lepas File Rekaman di Sini')).toBeInTheDocument();
  });

  it('submits file calling onUploadFile and onUploadComplete', async () => {
    const handleUploadFile = vi.fn().mockResolvedValue({
      id: 'rec-123',
      ownershipToken: 'guest-tok-abc',
    });
    const handleComplete = vi.fn();

    render(
      <UploadDropzone
        onUploadFile={handleUploadFile}
        onUploadComplete={handleComplete}
      />
    );

    const file = new File(['content'], 'interview.wav', { type: 'audio/wav' });
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    const startBtn = screen.getByTestId('start-upload-btn');
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(handleUploadFile).toHaveBeenCalledWith(file, {
        title: 'interview',
        templateCategory: TemplateKey.GENERAL,
      });
      expect(handleComplete).toHaveBeenCalledWith('rec-123', 'guest-tok-abc');
    });
  });

  it('does not show upload failure when onUploadComplete throws an error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handleUploadFile = vi.fn().mockResolvedValue({
      id: 'rec-456',
      ownershipToken: 'tok-xyz',
    });
    const handleComplete = vi.fn().mockImplementation(() => {
      throw new Error('Callback routing failure');
    });

    render(
      <UploadDropzone
        onUploadFile={handleUploadFile}
        onUploadComplete={handleComplete}
      />
    );

    const file = new File(['data'], 'presentation.mp3', { type: 'audio/mp3' });
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } });
    fireEvent.click(screen.getByTestId('start-upload-btn'));

    await waitFor(() => {
      expect(handleUploadFile).toHaveBeenCalled();
      expect(handleComplete).toHaveBeenCalled();
    });

    expect(screen.queryByText('Callback routing failure')).not.toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('triggers file picker on Enter or Space key press', () => {
    render(<UploadDropzone />);

    const dropArea = screen.getByTestId('drop-target-area');
    const fileInput = screen.getByTestId('file-input');
    const clickSpy = vi.spyOn(fileInput, 'click');

    // Press Enter
    fireEvent.keyDown(dropArea, { key: 'Enter', code: 'Enter' });
    expect(clickSpy).toHaveBeenCalledTimes(1);

    // Press Space
    fireEvent.keyDown(dropArea, { key: ' ', code: 'Space' });
    expect(clickSpy).toHaveBeenCalledTimes(2);

    clickSpy.mockRestore();
  });

  it('resets input value after file selection to allow selecting the same file again', () => {
    render(<UploadDropzone />);

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
    const file = new File(['content'], 'sample.mp3', { type: 'audio/mp3' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('sample.mp3')).toBeInTheDocument();
    expect(fileInput.value).toBe('');
  });
});
