import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TextSelectionCommentPopover } from './TextSelectionCommentPopover';

describe('TextSelectionCommentPopover Molecule Component', () => {
  const defaultProps = {
    selectedText: 'Keputusan arsitektur menggunakan hexagonal pattern.',
    timestampSec: 45,
    segmentId: 'seg-101',
    isOpen: true,
    onClose: vi.fn(),
    onSubmitComment: vi.fn(),
  };

  it('does not render anything when isOpen is false', () => {
    render(<TextSelectionCommentPopover {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('comment-popover')).not.toBeInTheDocument();
  });

  it('renders initial compact button with timestamp preview', () => {
    render(<TextSelectionCommentPopover {...defaultProps} />);
    expect(screen.getByTestId('open-comment-form-btn')).toBeInTheDocument();
    expect(screen.getByText('[00:45]')).toBeInTheDocument();
    expect(screen.getByText('Komentari Kutipan')).toBeInTheDocument();
  });

  it('expands form upon clicking the trigger button and displays quote preview', () => {
    render(<TextSelectionCommentPopover {...defaultProps} />);
    fireEvent.click(screen.getByTestId('open-comment-form-btn'));

    expect(screen.getByTestId('comment-form')).toBeInTheDocument();
    expect(screen.getByTestId('quoted-text-preview')).toHaveTextContent(
      'Keputusan arsitektur menggunakan hexagonal pattern.'
    );
  });

  it('shows error if comment text is empty upon submission', async () => {
    render(<TextSelectionCommentPopover {...defaultProps} />);
    fireEvent.click(screen.getByTestId('open-comment-form-btn'));

    // Try submit with empty text via form submit
    fireEvent.submit(screen.getByTestId('comment-form'));

    expect(
      screen.getByText('Komentar tidak boleh kosong.')
    ).toBeInTheDocument();
    expect(defaultProps.onSubmitComment).not.toHaveBeenCalled();
  });

  it('submits comment with custom author name and payload', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <TextSelectionCommentPopover
        {...defaultProps}
        onSubmitComment={handleSubmit}
        defaultAuthorName="Bayu"
      />
    );

    fireEvent.click(screen.getByTestId('open-comment-form-btn'));

    const authorInput = screen.getByTestId('comment-author-input');
    expect(authorInput).toHaveValue('Bayu');

    const commentInput = screen.getByTestId('comment-text-input');
    fireEvent.change(commentInput, {
      target: { value: 'Setuju, ini mempermudah decoupled testing.' },
    });

    fireEvent.click(screen.getByTestId('submit-comment-btn'));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        selected_text: defaultProps.selectedText,
        timestamp_sec: defaultProps.timestampSec,
        segment_id: defaultProps.segmentId,
        comment_text: 'Setuju, ini mempermudah decoupled testing.',
        author_name: 'Bayu',
      });
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('submits using Ctrl+Enter keyboard shortcut', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <TextSelectionCommentPopover
        {...defaultProps}
        onSubmitComment={handleSubmit}
      />
    );

    fireEvent.click(screen.getByTestId('open-comment-form-btn'));
    const commentInput = screen.getByTestId('comment-text-input');
    fireEvent.change(commentInput, { target: { value: 'Shortcut comment' } });

    fireEvent.keyDown(commentInput, { key: 'Enter', ctrlKey: true });

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        selected_text: defaultProps.selectedText,
        timestamp_sec: defaultProps.timestampSec,
        segment_id: defaultProps.segmentId,
        comment_text: 'Shortcut comment',
        author_name: 'Tamu / Guest',
      });
    });
  });

  it('displays error message when onSubmitComment fails', async () => {
    const handleSubmit = vi
      .fn()
      .mockRejectedValue(new Error('Network error saat mengirim'));
    render(
      <TextSelectionCommentPopover
        {...defaultProps}
        onSubmitComment={handleSubmit}
      />
    );

    fireEvent.click(screen.getByTestId('open-comment-form-btn'));
    const commentInput = screen.getByTestId('comment-text-input');
    fireEvent.change(commentInput, { target: { value: 'Testing error state' } });

    fireEvent.click(screen.getByTestId('submit-comment-btn'));

    await waitFor(() => {
      expect(
        screen.getByText('Network error saat mengirim')
      ).toBeInTheDocument();
    });
  });

  it('closes popover on Escape key press', () => {
    const handleClose = vi.fn();
    render(
      <TextSelectionCommentPopover {...defaultProps} onClose={handleClose} />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });
});
