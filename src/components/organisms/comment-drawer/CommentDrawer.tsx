'use client';

import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  X,
  Send,
  CornerDownRight,
  Trash2,
  Quote,
  Loader2,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Textarea } from '@/components/atoms/textarea';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { formatTime } from '@/lib/time';
import type { CommentResponse, CreateCommentRequest } from '@/server/dtos/comment.dto';

export interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comments: CommentResponse[];
  currentTimestampSec?: number;
  currentUserId?: string | null;
  defaultAuthorName?: string;
  onSeek?: (timestampSec: number) => void;
  onCreateComment?: (payload: CreateCommentRequest) => Promise<void> | void;
  onReplyComment?: (parentId: string, payload: CreateCommentRequest) => Promise<void> | void;
  onDeleteComment?: (commentId: string) => Promise<void> | void;
  className?: string;
}

function getInitials(name: string): string {
  if (!name.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase() || 'U';
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'baru saja';
    const diffMs = Date.now() - date.getTime();
    if (diffMs <= 0) return 'baru saja';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m lalu`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}j lalu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}h lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return 'baru saja';
  }
}

export function CommentDrawer({
  isOpen,
  onClose,
  comments,
  currentTimestampSec = 0,
  currentUserId,
  defaultAuthorName = '',
  onSeek,
  onCreateComment,
  onReplyComment,
  onDeleteComment,
  className,
}: CommentDrawerProps) {
  const [sortBy, setSortBy] = useState<'timeline' | 'recent'>('timeline');
  const [customAuthorName, setCustomAuthorName] = useState<string | null>(null);
  const authorName = customAuthorName ?? defaultAuthorName;
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  // Count total comments including nested replies
  const totalCount = useMemo(() => {
    let count = 0;
    const countNodes = (items: CommentResponse[]) => {
      for (const item of items) {
        count++;
        if (item.replies && item.replies.length > 0) {
          countNodes(item.replies);
        }
      }
    };
    countNodes(comments);
    return count;
  }, [comments]);

  // Sort top-level comments
  const sortedComments = useMemo(() => {
    const list = [...comments];
    if (sortBy === 'timeline') {
      return list.sort((a, b) => a.timestamp_sec - b.timestamp_sec);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [comments, sortBy]);

  if (!isOpen) return null;

  const handleCreateNewComment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSubmittingNew) return;
    const text = newCommentText.trim();
    if (!text || !onCreateComment) return;

    setIsSubmittingNew(true);
    setDrawerError(null);

    try {
      await onCreateComment({
        timestamp_sec: currentTimestampSec,
        comment_text: text,
        author_name: authorName.trim() || 'Tamu / Guest',
      });
      setNewCommentText('');
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Gagal menambahkan komentar.';
      setDrawerError(msg);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleSendReply = async (parentComment: CommentResponse) => {
    if (isSubmittingReply) return;
    const text = replyText.trim();
    if (!text || !onReplyComment) return;

    setIsSubmittingReply(true);
    setDrawerError(null);

    try {
      await onReplyComment(parentComment.id, {
        timestamp_sec: parentComment.timestamp_sec,
        comment_text: text,
        author_name: authorName.trim() || 'Tamu / Guest',
        parent_id: parentComment.id,
      });
      setReplyText('');
      setReplyingToId(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Gagal membalas komentar.';
      setDrawerError(msg);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!onDeleteComment) return;
    setDeletingId(commentId);
    setDrawerError(null);

    try {
      await onDeleteComment(commentId);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Gagal menghapus komentar.';
      setDrawerError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const renderCommentCard = (comment: CommentResponse, isReply = false) => {
    const isDeleting = deletingId === comment.id;
    const canDelete =
      Boolean(onDeleteComment) &&
      (comment.user_id
        ? Boolean(currentUserId && comment.user_id === currentUserId)
        : !currentUserId);

    return (
      <div
        key={comment.id}
        data-testid={`comment-card-${comment.id}`}
        className={cn(
          'group relative rounded-xl border border-border/60 bg-card/70 p-3.5 transition-all text-card-foreground',
          'hover:border-border hover:shadow-sm',
          isReply && 'bg-secondary/20 ml-5 border-border/40 mt-2'
        )}
      >
        {/* Author Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 text-[10px] font-bold">
              <AvatarFallback className="bg-primary/20 text-primary">
                {getInitials(comment.author_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-semibold text-foreground">
                {comment.author_name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatRelativeTime(comment.created_at)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Timestamp Seeker Pill */}
            <button
              type="button"
              onClick={() => onSeek?.(comment.timestamp_sec)}
              title="Putar dari detik ini"
              data-testid={`seek-comment-${comment.id}`}
              className="flex items-center gap-1 rounded-md bg-secondary/80 hover:bg-primary/10 hover:text-primary px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground transition-colors"
            >
              <Clock className="h-2.5 w-2.5" />
              <span>{formatTime(comment.timestamp_sec)}</span>
            </button>

            {/* Delete button */}
            {canDelete && (
              <button
                type="button"
                onClick={() => handleDelete(comment.id)}
                disabled={isDeleting}
                title="Hapus komentar"
                data-testid={`delete-comment-${comment.id}`}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin text-destructive" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quoted Text Preview */}
        {comment.selected_text && (
          <div
            className="mt-2 flex items-start gap-1.5 rounded-md bg-secondary/40 p-2 text-xs italic text-muted-foreground border-l-2 border-primary"
            data-testid={`quoted-text-${comment.id}`}
          >
            <Quote className="h-3 w-3 shrink-0 text-primary mt-0.5" />
            <p className="line-clamp-2">{comment.selected_text}</p>
          </div>
        )}

        {/* Comment Body */}
        <p className="mt-2 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
          {comment.comment_text}
        </p>

        {/* Action: Reply button (only on top-level or when replying supported) */}
        {onReplyComment && !isReply && (
          <div className="mt-2.5 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setReplyingToId(replyingToId === comment.id ? null : comment.id);
                setReplyText('');
              }}
              data-testid={`reply-btn-${comment.id}`}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <CornerDownRight className="h-3 w-3" />
              <span>{replyingToId === comment.id ? 'Tutup Balasan' : 'Balas'}</span>
            </button>
          </div>
        )}

        {/* Inline Reply Form */}
        {replyingToId === comment.id && (
          <div
            className="mt-3 rounded-lg border border-border/80 bg-background/90 p-2.5 space-y-2 animate-in fade-in-0 duration-150"
            data-testid={`reply-form-${comment.id}`}
          >
            <Textarea
              placeholder={`Balas ${comment.author_name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={isSubmittingReply}
              data-testid={`reply-input-${comment.id}`}
              className="min-h-[50px] text-xs resize-none"
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setReplyingToId(null)}
                disabled={isSubmittingReply}
                className="h-6 px-2 text-xs text-muted-foreground"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSubmittingReply || !replyText.trim()}
                onClick={() => handleSendReply(comment)}
                data-testid={`submit-reply-${comment.id}`}
                className="h-6 px-2.5 text-xs gap-1"
              >
                {isSubmittingReply ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <Send className="h-2.5 w-2.5" />
                )}
                <span>Kirim Balasan</span>
              </Button>
            </div>
          </div>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2" data-testid={`replies-list-${comment.id}`}>
            {comment.replies.map((reply) => renderCommentCard(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      data-testid="comment-drawer"
      className={cn(
        'fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-background/95 border-l border-border/80 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-right',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Komentar & Catatan
          </h2>
          <span
            data-testid="comment-count-badge"
            className="flex h-5 items-center justify-center rounded-full bg-primary/10 px-2 text-[10px] font-bold text-primary"
          >
            {totalCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Switcher */}
          <button
            type="button"
            onClick={() => setSortBy(sortBy === 'timeline' ? 'recent' : 'timeline')}
            data-testid="sort-toggle-btn"
            title={sortBy === 'timeline' ? 'Urutkan Waktu Rekaman' : 'Urutkan Terbaru'}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <ArrowUpDown className="h-3 w-3" />
            <span>{sortBy === 'timeline' ? 'Timeline' : 'Terbaru'}</span>
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            data-testid="close-drawer-btn"
            aria-label="Tutup Panel Komentar"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Drawer Error Alert */}
      {drawerError && (
        <div
          data-testid="drawer-error-alert"
          className="mx-4 mt-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive flex items-center justify-between"
        >
          <span>{drawerError}</span>
          <button
            type="button"
            onClick={() => setDrawerError(null)}
            className="text-destructive/80 hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top-Level Add Comment Section */}
      {onCreateComment && (
        <div className="border-b border-border/60 p-4 bg-secondary/10">
          <form onSubmit={handleCreateNewComment} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-foreground">
                Tambah Catatan Baru
              </span>
              <span
                data-testid="current-timestamp-indicator"
                className="font-mono text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded"
              >
                Pada [{formatTime(currentTimestampSec)}]
              </span>
            </div>

            <Input
              placeholder="Nama Anda"
              value={authorName}
              onChange={(e) => setCustomAuthorName(e.target.value)}
              disabled={isSubmittingNew}
              data-testid="drawer-author-input"
              className="h-7 text-xs bg-background/80"
            />

            <Textarea
              placeholder="Ketik catatan atau pertanyaan Anda di sini..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              disabled={isSubmittingNew}
              data-testid="drawer-comment-input"
              className="min-h-[60px] text-xs resize-none bg-background/80"
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingNew || !newCommentText.trim()}
                data-testid="drawer-submit-comment-btn"
                className="h-7 px-3 text-xs gap-1.5"
              >
                {isSubmittingNew ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                <span>Kirim</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Comment List */}
      <div
        data-testid="comments-scroll-area"
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {sortedComments.length === 0 ? (
          <div
            data-testid="empty-comments-state"
            className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-2"
          >
            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs font-medium">Belum ada komentar</p>
            <p className="text-[11px] max-w-xs text-muted-foreground/80">
              Sorot teks pada transkrip atau tambahkan catatan menggunakan form di atas.
            </p>
          </div>
        ) : (
          sortedComments.map((comment) => renderCommentCard(comment))
        )}
      </div>
    </div>
  );
}
