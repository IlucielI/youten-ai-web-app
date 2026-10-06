import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareDialog } from './ShareDialog';

describe('ShareDialog', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    isShared: false,
    shareToken: null,
    onToggleShare: vi.fn(),
  };

  it('renders dialog elements when isOpen is true', () => {
    render(<ShareDialog {...defaultProps} />);
    expect(screen.getByTestId('share-dialog')).toBeInTheDocument();
    expect(screen.getByText('Bagikan Rekaman')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ShareDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('share-dialog')).not.toBeInTheDocument();
  });

  it('calls onToggleShare with true when switch is clicked', async () => {
    const handleToggle = vi.fn().mockResolvedValue(undefined);
    render(<ShareDialog {...defaultProps} isShared={false} onToggleShare={handleToggle} />);

    const toggle = screen.getByTestId('share-toggle-switch');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(handleToggle).toHaveBeenCalledWith(true);
    });
  });

  it('displays share url, copy button, and read-only notice when isShared is true and shareToken is provided', () => {
    render(
      <ShareDialog
        {...defaultProps}
        isShared={true}
        shareToken="token-xyz-123"
      />
    );

    const input = screen.getByTestId('share-url-input');
    expect(input).toHaveValue(`${window.location.origin}/share/token-xyz-123`);

    expect(screen.getByTestId('copy-share-url-btn')).toBeInTheDocument();
    expect(screen.getByTestId('read-only-banner')).toBeInTheDocument();
  });

  it('copies share link to clipboard when Salin is clicked', async () => {
    render(
      <ShareDialog
        {...defaultProps}
        isShared={true}
        shareToken="token-xyz-123"
      />
    );

    const copyBtn = screen.getByTestId('copy-share-url-btn');
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/share/token-xyz-123`
      );
      expect(screen.getByText('Tersalin!')).toBeInTheDocument();
    });
  });

  it('displays error message when clipboard API is unavailable', async () => {
    Object.assign(navigator, { clipboard: undefined });

    render(
      <ShareDialog
        {...defaultProps}
        isShared={true}
        shareToken="token-xyz-123"
      />
    );

    const copyBtn = screen.getByTestId('copy-share-url-btn');
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(screen.getByTestId('share-error-message')).toBeInTheDocument();
      expect(screen.getByText('Fitur papan klip tidak didukung di peramban ini.')).toBeInTheDocument();
    });
  });

  it('calls onClose when Tutup button is clicked', () => {
    const handleClose = vi.fn();
    render(<ShareDialog {...defaultProps} onClose={handleClose} />);

    fireEvent.click(screen.getByTestId('close-share-dialog-btn'));
    expect(handleClose).toHaveBeenCalled();
  });
});
