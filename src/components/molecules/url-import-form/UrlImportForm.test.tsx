import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UrlImportForm } from './UrlImportForm';
import { TemplateKey } from '@/server/constants/template.constant';

describe('UrlImportForm Molecule', () => {
  it('renders form inputs with default state', () => {
    render(<UrlImportForm onSubmit={vi.fn()} />);

    expect(screen.getByTestId('url-import-form')).toBeInTheDocument();
    expect(screen.getByTestId('media-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('url-template-select')).toBeInTheDocument();
    expect(screen.getByTestId('url-language-select')).toBeInTheDocument();
  });

  it('validates URL protocol and prevents submission of invalid URLs', async () => {
    const handleSubmit = vi.fn();
    render(<UrlImportForm onSubmit={handleSubmit} />);

    const urlInput = screen.getByTestId('media-url-input');
    fireEvent.change(urlInput, { target: { value: 'ftp://files.example.com/audio.mp3' } });

    const submitBtn = screen.getByTestId('submit-url-btn');
    fireEvent.click(submitBtn);

    expect(screen.getByTestId('url-error-alert')).toBeInTheDocument();
    expect(screen.getByText(/Tautan harus berupa URL web yang valid/)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('rejects localhost and private IP addresses to prevent SSRF', async () => {
    const handleSubmit = vi.fn();
    render(<UrlImportForm onSubmit={handleSubmit} />);

    const urlInput = screen.getByTestId('media-url-input');
    const submitBtn = screen.getByTestId('submit-url-btn');

    // Test localhost
    fireEvent.change(urlInput, { target: { value: 'http://localhost:3000/test.mp3' } });
    fireEvent.click(submitBtn);
    expect(screen.getByTestId('url-error-alert')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();

    // Test private IP
    fireEvent.change(urlInput, { target: { value: 'http://192.168.1.100/secret.mp3' } });
    fireEvent.click(submitBtn);
    expect(screen.getByTestId('url-error-alert')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('submits valid media URL with selected template and language', async () => {
    const handleSubmit = vi.fn();
    render(<UrlImportForm onSubmit={handleSubmit} />);

    const urlInput = screen.getByTestId('media-url-input');
    fireEvent.change(urlInput, { target: { value: 'https://cdn.example.com/recordings/demo.mp4' } });

    const titleInput = screen.getByTestId('import-title-input');
    fireEvent.change(titleInput, { target: { value: 'Rapat Demo Produk' } });

    const templateSelect = screen.getByTestId('url-template-select');
    fireEvent.change(templateSelect, { target: { value: TemplateKey.TECH_REVIEW } });

    const langSelect = screen.getByTestId('url-language-select');
    fireEvent.change(langSelect, { target: { value: 'en' } });

    const submitBtn = screen.getByTestId('submit-url-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        url: 'https://cdn.example.com/recordings/demo.mp4',
        title: 'Rapat Demo Produk',
        templateCategory: TemplateKey.TECH_REVIEW,
        language: 'en',
      });
    });
  });
});
