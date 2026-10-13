import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatChips, DEFAULT_CHAT_PROMPTS } from './ChatChips';

describe('ChatChips Molecule', () => {
  it('renders default prompt chips', () => {
    render(<ChatChips onSelectPrompt={vi.fn()} />);

    expect(screen.getByTestId('chat-chips')).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_CHAT_PROMPTS[0])).toBeInTheDocument();
  });

  it('renders custom prompt list when provided', () => {
    const custom = ['Pertanyaan satu?', 'Pertanyaan dua?'];
    render(<ChatChips prompts={custom} onSelectPrompt={vi.fn()} />);

    expect(screen.getByText('Pertanyaan satu?')).toBeInTheDocument();
    expect(screen.getByText('Pertanyaan dua?')).toBeInTheDocument();
  });

  it('triggers onSelectPrompt when a chip is clicked', () => {
    const handleSelect = vi.fn();
    render(<ChatChips onSelectPrompt={handleSelect} />);

    const firstChip = screen.getByTestId('chat-chip-0');
    fireEvent.click(firstChip);
    expect(handleSelect).toHaveBeenCalledWith(DEFAULT_CHAT_PROMPTS[0]);
  });

  it('disables chip buttons when disabled prop is true', () => {
    render(<ChatChips onSelectPrompt={vi.fn()} disabled={true} />);

    const firstChip = screen.getByTestId('chat-chip-0');
    expect(firstChip).toBeDisabled();
  });

  it('renders template-specific prompt chips when template is INTERVIEW', () => {
    render(<ChatChips template="INTERVIEW" onSelectPrompt={vi.fn()} />);

    expect(screen.getByTestId('chat-chips')).toBeInTheDocument();
    expect(
      screen.getByText('Bagaimana evaluasi kualifikasi dan kompetensi kandidat?')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Apa kelebihan utama dan area perhatian (red flags) kandidat?')
    ).toBeInTheDocument();
  });

  it('handles lowercase or dash template keys like interview or 1-on-1', () => {
    const { rerender } = render(<ChatChips template="interview" onSelectPrompt={vi.fn()} />);
    expect(
      screen.getByText('Bagaimana evaluasi kualifikasi dan kompetensi kandidat?')
    ).toBeInTheDocument();

    rerender(<ChatChips template="1-on-1" onSelectPrompt={vi.fn()} />);
    expect(
      screen.getByText('Apa topik diskusi dan umpan balik utama dalam sesi 1-on-1 ini?')
    ).toBeInTheDocument();
  });

  it('gracefully falls back to default prompts when template is unknown or general', () => {
    render(<ChatChips template="UNKNOWN_CUSTOM" onSelectPrompt={vi.fn()} />);
    expect(screen.getByText(DEFAULT_CHAT_PROMPTS[0])).toBeInTheDocument();
  });
});
