import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SpeakerRenameDialog } from './SpeakerRenameDialog';

describe('SpeakerRenameDialog Component', () => {
  it('renders input with current speaker name when open', () => {
    render(
      <SpeakerRenameDialog
        isOpen={true}
        onClose={vi.fn()}
        speakerId="Speaker 0"
        onSave={vi.fn()}
      />
    );

    const input = screen.getByTestId('speaker-name-input') as HTMLInputElement;
    expect(input.value).toBe('Speaker 0');
    expect(screen.getByText('Ubah Nama Pembicara')).toBeDefined();
  });

  it('validates empty name input on submit', async () => {
    render(
      <SpeakerRenameDialog
        isOpen={true}
        onClose={vi.fn()}
        speakerId="Speaker 1"
        onSave={vi.fn()}
      />
    );

    const input = screen.getByTestId('speaker-name-input');
    fireEvent.change(input, { target: { value: '   ' } });

    const submitBtn = screen.getByTestId('submit-rename-button');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByTestId('rename-error-message').textContent).toContain('tidak boleh kosong');
  });

  it('submits new speaker label and triggers onSave and onClose', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <SpeakerRenameDialog
        isOpen={true}
        onClose={onClose}
        speakerId="Speaker 0"
        onSave={onSave}
      />
    );

    const input = screen.getByTestId('speaker-name-input');
    fireEvent.change(input, { target: { value: 'Bayu Anugerah' } });

    const submitBtn = screen.getByTestId('submit-rename-button');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(onSave).toHaveBeenCalledWith('Speaker 0', 'Bayu Anugerah');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles onSave failure and displays error message', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Network connection failed'));

    render(
      <SpeakerRenameDialog
        isOpen={true}
        onClose={vi.fn()}
        speakerId="Speaker 0"
        onSave={onSave}
      />
    );

    const submitBtn = screen.getByTestId('submit-rename-button');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByTestId('rename-error-message').textContent).toBe('Network connection failed');
  });
});
