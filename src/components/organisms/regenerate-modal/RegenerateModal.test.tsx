import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegenerateModal } from './RegenerateModal';
import { TemplateKey } from '@/server/constants/template.constant';

describe('RegenerateModal Organism', () => {
  it('renders modal content when open is true', () => {
    render(
      <RegenerateModal
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        currentVersionsCount={2}
      />
    );

    expect(screen.getByText('Generate Versi Ringkasan Baru')).toBeInTheDocument();
    expect(screen.getByText('2 dari 5 versi terpakai')).toBeInTheDocument();
    expect(screen.getByTestId('template-option-MOM')).toBeInTheDocument();
    expect(screen.getByTestId('custom-angle-input')).toBeInTheDocument();
  });

  it('allows selecting a template and submitting form with custom angle', async () => {
    const handleSubmit = vi.fn();
    render(
      <RegenerateModal
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={handleSubmit}
        currentVersionsCount={1}
        defaultTemplate={TemplateKey.GENERAL}
      />
    );

    // Click MOM template option
    fireEvent.click(screen.getByTestId('template-option-MOM'));

    // Fill custom angle
    const textarea = screen.getByTestId('custom-angle-input');
    fireEvent.change(textarea, { target: { value: 'Sorot aksi P0' } });

    // Submit
    fireEvent.click(screen.getByTestId('submit-regenerate-btn'));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        template_category: TemplateKey.MOM,
        custom_angle: 'Sorot aksi P0',
      });
    });
  });

  it('disables submit button and shows alert when currentVersionsCount reaches 5', () => {
    render(
      <RegenerateModal
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        currentVersionsCount={5}
      />
    );

    expect(screen.getByText('Batas Maksimal Tercapai!')).toBeInTheDocument();
    expect(screen.getByTestId('submit-regenerate-btn')).toBeDisabled();
    expect(screen.getByTestId('custom-angle-input')).toBeDisabled();
  });

  it('displays character counter and validates when exceeding 2000 characters', () => {
    render(
      <RegenerateModal
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        currentVersionsCount={1}
      />
    );

    const textarea = screen.getByTestId('custom-angle-input');
    const longText = 'a'.repeat(2005);
    fireEvent.change(textarea, { target: { value: longText } });

    expect(screen.getByText('2005 / 2000 karakter')).toBeInTheDocument();
    expect(screen.getByText('Instruksi khusus tidak boleh melebihi 2000 karakter.')).toBeInTheDocument();
    expect(screen.getByTestId('submit-regenerate-btn')).toBeDisabled();
  });
});
