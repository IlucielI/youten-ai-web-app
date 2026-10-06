import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommentDrawer } from './CommentDrawer';
import type { CommentResponse } from '@/server/dtos/comment.dto';

describe('CommentDrawer Organism Component', () => {
  const mockComments: CommentResponse[] = [
    {
      id: 'c-1',
      author_name: 'Bayu',
      timestamp_sec: 15,
      comment_text: 'Bahas integrasi Redis adapter di sini.',
      selected_text: 'Redis adapter fallback store',
      created_at: new Date(Date.now() - 60000).toISOString(), // 1m ago
      replies: [
        {
          id: 'c-1-r1',
          parent_id: 'c-1',
          author_name: 'QA Engineer',
          timestamp_sec: 15,
          comment_text: 'Sudah diverifikasi dengan in-memory fallback.',
          created_at: new Date(Date.now() - 30000).toISOString(),
        },
      ],
    },
    {
      id: 'c-2',
      author_name: 'Tech Lead',
      timestamp_sec: 45,
      comment_text: 'Pastikan boundary BFF tetap terjaga.',
      created_at: new Date(Date.now() - 120000).toISOString(),
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    comments: mockComments,
    currentTimestampSec: 30,
    onSeek: vi.fn(),
    onCreateComment: vi.fn(),
    onReplyComment: vi.fn(),
    onDeleteComment: vi.fn(),
  };

  it('does not render when isOpen is false', () => {
    render(<CommentDrawer {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('comment-drawer')).not.toBeInTheDocument();
  });

  it('renders total comment count including replies in badge', () => {
    render(<CommentDrawer {...defaultProps} />);
    const badge = screen.getByTestId('comment-count-badge');
    expect(badge).toHaveTextContent('3'); // 2 top-level + 1 reply
  });

  it('renders empty state when comments list is empty', () => {
    render(<CommentDrawer {...defaultProps} comments={[]} />);
    expect(screen.getByTestId('empty-comments-state')).toBeInTheDocument();
    expect(screen.getByText('Belum ada komentar')).toBeInTheDocument();
  });

  it('renders comment cards, author names, quoted text, and replies', () => {
    render(<CommentDrawer {...defaultProps} />);

    expect(screen.getByText('Bayu')).toBeInTheDocument();
    expect(screen.getByText('Bahas integrasi Redis adapter di sini.')).toBeInTheDocument();
    expect(screen.getByText('Redis adapter fallback store')).toBeInTheDocument();

    // Reply
    expect(screen.getByText('QA Engineer')).toBeInTheDocument();
    expect(
      screen.getByText('Sudah diverifikasi dengan in-memory fallback.')
    ).toBeInTheDocument();

    // Second comment
    expect(screen.getByText('Tech Lead')).toBeInTheDocument();
    expect(screen.getByText('Pastikan boundary BFF tetap terjaga.')).toBeInTheDocument();
  });

  it('calls onSeek when a comment timestamp button is clicked', () => {
    render(<CommentDrawer {...defaultProps} />);

    const seekBtn = screen.getByTestId('seek-comment-c-1');
    fireEvent.click(seekBtn);

    expect(defaultProps.onSeek).toHaveBeenCalledWith(15);
  });

  it('submits a new top-level comment', async () => {
    const handleCreate = vi.fn().mockResolvedValue(undefined);
    render(
      <CommentDrawer
        {...defaultProps}
        onCreateComment={handleCreate}
        defaultAuthorName="Product Owner"
      />
    );

    const commentInput = screen.getByTestId('drawer-comment-input');
    fireEvent.change(commentInput, {
      target: { value: 'Catatan tambahan dari sprint review.' },
    });

    const submitBtn = screen.getByTestId('drawer-submit-comment-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleCreate).toHaveBeenCalledWith({
        timestamp_sec: 30,
        comment_text: 'Catatan tambahan dari sprint review.',
        author_name: 'Product Owner',
      });
    });
  });

  it('opens reply form and submits reply to a comment', async () => {
    const handleReply = vi.fn().mockResolvedValue(undefined);
    render(<CommentDrawer {...defaultProps} onReplyComment={handleReply} />);

    const replyBtn = screen.getByTestId('reply-btn-c-1');
    fireEvent.click(replyBtn);

    const replyInput = screen.getByTestId('reply-input-c-1');
    fireEvent.change(replyInput, {
      target: { value: 'Terima kasih informasinya.' },
    });

    const submitReplyBtn = screen.getByTestId('submit-reply-c-1');
    fireEvent.click(submitReplyBtn);

    await waitFor(() => {
      expect(handleReply).toHaveBeenCalledWith('c-1', {
        timestamp_sec: 15,
        comment_text: 'Terima kasih informasinya.',
        author_name: 'Tamu / Guest',
        parent_id: 'c-1',
      });
    });
  });

  it('deletes a comment when delete button is clicked', async () => {
    const handleDelete = vi.fn().mockResolvedValue(undefined);
    render(<CommentDrawer {...defaultProps} onDeleteComment={handleDelete} />);

    const deleteBtn = screen.getByTestId('delete-comment-c-2');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(handleDelete).toHaveBeenCalledWith('c-2');
    });
  });

  it('hides delete button when unauthenticated user views a comment owned by a registered user', () => {
    const ownedComment: CommentResponse = {
      id: 'c-owned',
      author_name: 'Registered Member',
      timestamp_sec: 10,
      comment_text: 'Private note',
      user_id: 'user-registered-123',
      created_at: new Date().toISOString(),
    };

    render(
      <CommentDrawer
        {...defaultProps}
        comments={[ownedComment]}
        currentUserId={undefined}
      />
    );

    expect(screen.queryByTestId('delete-comment-c-owned')).not.toBeInTheDocument();
  });

  it('shows delete button when authenticated user views their own comment', () => {
    const ownedComment: CommentResponse = {
      id: 'c-owned',
      author_name: 'Registered Member',
      timestamp_sec: 10,
      comment_text: 'Private note',
      user_id: 'user-registered-123',
      created_at: new Date().toISOString(),
    };

    render(
      <CommentDrawer
        {...defaultProps}
        comments={[ownedComment]}
        currentUserId="user-registered-123"
      />
    );

    expect(screen.getByTestId('delete-comment-c-owned')).toBeInTheDocument();
  });

  it('switches sort order between timeline and recent', () => {
    render(<CommentDrawer {...defaultProps} />);

    const sortBtn = screen.getByTestId('sort-toggle-btn');
    expect(sortBtn).toHaveTextContent('Timeline');

    fireEvent.click(sortBtn);
    expect(sortBtn).toHaveTextContent('Terbaru');
  });

  it('calls onClose when close button is clicked', () => {
    render(<CommentDrawer {...defaultProps} />);

    const closeBtn = screen.getByTestId('close-drawer-btn');
    fireEvent.click(closeBtn);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('displays drawer error alert when action throws', async () => {
    const handleCreate = vi
      .fn()
      .mockRejectedValue(new Error('Koneksi database bermasalah'));
    render(
      <CommentDrawer {...defaultProps} onCreateComment={handleCreate} />
    );

    const commentInput = screen.getByTestId('drawer-comment-input');
    fireEvent.change(commentInput, { target: { value: 'Test crash' } });

    const submitBtn = screen.getByTestId('drawer-submit-comment-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Koneksi database bermasalah')
      ).toBeInTheDocument();
    });
  });

  it('updates authorName input when defaultAuthorName prop changes after initial mount', () => {
    const { rerender } = render(
      <CommentDrawer {...defaultProps} defaultAuthorName="Initial User" />
    );
    expect(screen.getByTestId('drawer-author-input')).toHaveValue('Initial User');

    rerender(
      <CommentDrawer {...defaultProps} defaultAuthorName="Updated User" />
    );
    expect(screen.getByTestId('drawer-author-input')).toHaveValue('Updated User');
  });
});
