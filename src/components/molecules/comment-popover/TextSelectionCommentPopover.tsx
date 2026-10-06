'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquarePlus, X, Send, Loader2, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Textarea } from '@/components/atoms/textarea';
import { formatTime } from '@/lib/time';

export interface CommentSubmissionPayload {
  selected_text: string;
  timestamp_sec: number;
  segment_id?: string | null;
  comment_text: string;
  author_name: string;
}

export interface TextSelectionCommentPopoverProps {
  selectedText: string;
  timestampSec: number;
  segmentId?: string | null;
  position?: { top: number; left: number } | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitComment: (payload: CommentSubmissionPayload) => Promise<void> | void;
  defaultAuthorName?: string;
  className?: string;
}

export function TextSelectionCommentPopover({
  selectedText,
  timestampSec,
  segmentId,
  position,
  isOpen,
  onClose,
  onSubmitComment,
  defaultAuthorName = '',
  className,
}: TextSelectionCommentPopoverProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customAuthorName, setCustomAuthorName] = useState<string | null>(null);
  const authorName = customAuthorName ?? defaultAuthorName;
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isExpanded) {
      textareaRef.current?.focus();
    }
  }, [isExpanded]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSubmitting) return;

    const trimmedText = commentText.trim();
    if (!trimmedText) {
      setErrorMessage('Komentar tidak boleh kosong.');
      return;
    }

    const trimmedAuthor = authorName.trim() || 'Tamu / Guest';

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmitComment({
        selected_text: selectedText,
        timestamp_sec: timestampSec,
        segment_id: segmentId,
        comment_text: trimmedText,
        author_name: trimmedAuthor,
      });
      setCommentText('');
      setCustomAuthorName(null);
      setIsExpanded(false);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Gagal mengirim komentar.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stylePosition: React.CSSProperties = position
    ? {
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px',
      }
    : {};

  return (
    <div
      ref={containerRef}
      style={stylePosition}
      data-testid="comment-popover"
      className={cn('z-50 animate-in fade-in-0 zoom-in-95 duration-150', className)}
    >
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          data-testid="open-comment-form-btn"
          className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          <span>Komentari Kutipan</span>
          <span className="font-mono text-[10px] opacity-80">
            [{formatTime(timestampSec)}]
          </span>
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          data-testid="comment-form"
          className="w-80 rounded-xl border border-border/80 bg-popover/95 p-3.5 text-popover-foreground shadow-xl backdrop-blur-md space-y-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <MessageSquarePlus className="h-4 w-4 text-primary" />
              <span>Tambah Komentar</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                [{formatTime(timestampSec)}]
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-testid="close-comment-popover-btn"
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quoted Text Preview */}
          {selectedText && (
            <div
              className="flex items-start gap-2 rounded-lg bg-secondary/50 p-2 text-xs text-muted-foreground border-l-2 border-primary"
              data-testid="quoted-text-preview"
            >
              <Quote className="h-3 w-3 shrink-0 text-primary mt-0.5" />
              <p className="line-clamp-2 italic">{selectedText}</p>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-2">
            <div>
              <Input
                placeholder="Nama Anda (opsional jika sudah login)"
                value={authorName}
                onChange={(e) => setCustomAuthorName(e.target.value)}
                disabled={isSubmitting}
                data-testid="comment-author-input"
                className="h-8 text-xs bg-background/80"
              />
            </div>
            <div>
              <Textarea
                ref={textareaRef}
                placeholder="Tulis tanggapan atau catatan Anda di sini..."
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isSubmitting}
                data-testid="comment-text-input"
                className="min-h-[70px] text-xs resize-none bg-background/80"
              />
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div
              className="text-[11px] text-destructive bg-destructive/10 rounded-md px-2 py-1"
              data-testid="comment-error-alert"
            >
              {errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-muted-foreground">
              Ctrl+Enter untuk kirim
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !commentText.trim()}
                data-testid="submit-comment-btn"
                className="h-7 px-3 text-xs gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    <span>Kirim</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
