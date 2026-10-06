'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore } from '@/stores/chat.store';
import { usePlayerStore } from '@/stores/player.store';
import { ChatChips } from '@/components/molecules/chat-chips';
import { CitationBadge } from '@/components/atoms/citation-badge';
import { parseTimestamp } from '@/lib/time';
import { Button } from '@/components/atoms/button';
import { Textarea } from '@/components/atoms/textarea';
import {
  Sparkles,
  Bot,
  User,
  Send,
  Trash2,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatPanelProps {
  recordingId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onSendMessage?: (message: string) => Promise<void> | void;
  onSeekAudio?: (timestamp: number) => void;
  className?: string;
}

/**
 * Transforms timestamp patterns like [01:06] or [01:06 - 01:24] into special markdown links
 * e.g. [01:06](timestamp:01:06?label=%5B01%3A06%5D) or [01:06 - 01:24](timestamp:01:06?label=%5B01%3A06+-+01%3A24%5D)
 * while preserving code fences and inline code.
 */
export function linkifyTimestamps(content: string): string {
  if (!content) return '';

  const codeBlocks: string[] = [];
  const placeholder = (idx: number) => `___CODE_BLOCK_${idx}___`;

  // Protect code blocks and inline code from timestamp substitution
  let preserved = content.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    codeBlocks.push(match);
    return placeholder(codeBlocks.length - 1);
  });

  const timestampRegex = /\[(\d{1,2}:\d{2}(?::\d{2})?)(?:\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?))?\](?!\()/g;

  preserved = preserved.replace(timestampRegex, (fullMatch, startTimeStr, endTimeStr) => {
    const label = fullMatch.slice(1, -1).trim();
    const endQuery = endTimeStr ? `&end=${encodeURIComponent(endTimeStr)}` : '';
    return `[${label}](timestamp:${startTimeStr}?label=${encodeURIComponent(fullMatch)}${endQuery})`;
  });

  return preserved.replace(/___CODE_BLOCK_(\d+)___/g, (_, idx) => codeBlocks[Number(idx)] || '');
}

/**
 * Sanitizes URLs in markdown while preserving custom timestamp: protocols.
 */
export function safeUrlTransform(url: string): string {
  if (url.startsWith('timestamp:')) return url;
  if (/^(https?|mailto|tel):/i.test(url) || url.startsWith('/') || url.startsWith('#')) return url;
  return '';
}

/**
 * Parses markdown message content (including bold, italics, lists, code) and renders
 * inline timestamp citations like [01:06] or [01:06 - 01:24] as interactive CitationBadge components.
 */
export function renderMessageContent(content: string, onSeek?: (timestamp: number) => void) {
  if (!content) return null;

  const processed = linkifyTimestamps(content);

  return (
    <div className="prose prose-xs dark:prose-invert max-w-none text-foreground leading-relaxed font-sans break-words space-y-1.5 [&>p]:mb-1.5 [&>p:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={safeUrlTransform}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith('timestamp:')) {
              const url = href.replace('timestamp:', '');
              const [timePart, queryPart] = url.split('?');
              const startSeconds = timePart.includes(':')
                ? parseTimestamp(timePart)
                : Number(timePart) || 0;

              let label: string | undefined;
              if (queryPart) {
                const params = new URLSearchParams(queryPart);
                label = params.get('label') || undefined;
              }
              const displayLabel =
                label || (typeof children === 'string' ? `[${children}]` : undefined);

              return (
                <CitationBadge
                  timestamp={startSeconds}
                  label={displayLabel}
                  onClick={onSeek}
                  className="mx-0.5 inline-flex align-middle"
                />
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                {children}
              </a>
            );
          },
          p: ({ children }) => (
            <p className="leading-relaxed mb-1.5 last:mb-0">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/90">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 space-y-1 my-1 marker:text-primary/70">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 space-y-1 my-1 marker:text-primary/70">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          code: ({ children, className }) => {
            const isInline = !className?.includes('language-');
            if (isInline) {
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground border border-border/40">
                  {children}
                </code>
              );
            }
            return <code className={className}>{children}</code>;
          },
          pre: ({ children }) => (
            <pre className="rounded-lg bg-muted/80 p-2 my-1.5 overflow-x-auto text-[11px] font-mono border border-border/50">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/60 pl-2.5 italic my-1 text-muted-foreground">
              {children}
            </blockquote>
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

export function ChatPanel({
  isOpen = true,
  onClose,
  onSendMessage,
  onSeekAudio,
  className,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Zustand Chat Store
  const {
    messages,
    isStreaming,
    streamingContent,
    streamingCitations,
    error,
    addUserMessage,
    clearChat,
  } = useChatStore();

  const seek = onSeekAudio || ((sec: number) => usePlayerStore.getState().seek(sec));

  // Auto-scroll to bottom on messages change or stream update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isStreaming) return;

    setInputValue('');
    addUserMessage(text);

    if (onSendMessage) {
      await onSendMessage(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <aside
      data-testid="chat-panel"
      className={cn(
        'flex flex-col h-full w-full max-w-md rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xl shadow-2xl transition-all',
        className
      )}
      aria-label="AI Chat Panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/30">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>Asisten AI Rekaman</span>
              <Sparkles className="h-3 w-3 text-amber-400" />
            </h3>
            <p className="text-[11px] text-muted-foreground">Tanya jawab kontekstual (RAG)</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={clearChat}
              disabled={isStreaming}
              title="Bersihkan Percakapan"
              className="text-muted-foreground hover:text-rose-400"
              data-testid="clear-chat-btn"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}

          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              title="Tutup Panel Chat"
              className="text-muted-foreground hover:text-foreground"
              data-testid="close-chat-btn"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
        data-testid="chat-message-list"
      >
        {messages.length === 0 && !isStreaming ? (
          <div
            data-testid="chat-empty-state"
            className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground space-y-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 border border-border/60">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">
                Tanyakan Apa Saja Tentang Rapat Ini
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Asisten AI menggunakan transkrip dan ringkasan rekaman untuk memberikan jawaban yang akurat beserta kutipan waktu.
              </p>
            </div>

            <div className="w-full pt-4 border-t border-border/40">
              <ChatChips onSelectPrompt={(prompt) => void handleSend(prompt)} />
            </div>
          </div>
        ) : (
          <>
            {messages
              .filter((msg) => !msg.isStreaming)
              .map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={cn('flex gap-2.5 text-xs', isUser ? 'justify-end' : 'justify-start')}
                  data-testid={`chat-message-${msg.id}`}
                >
                  {!isUser && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary mt-0.5">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed space-y-1.5 shadow-sm',
                      isUser
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-secondary/70 text-foreground border border-border/50 rounded-tl-sm'
                    )}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    ) : (
                      renderMessageContent(msg.content, seek)
                    )}

                    {/* Attached Citations if any */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1.5 border-t border-border/30">
                        <span className="text-[10px] text-muted-foreground mr-1">Sumber:</span>
                        {msg.citations.map((cite, cIdx) => (
                          <CitationBadge
                            key={cIdx}
                            timestamp={cite.start_time}
                            snippet={cite.snippet}
                            recordingTitle={cite.recording_title}
                            onClick={seek}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground mt-0.5">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Active Streaming Response Turn */}
            {isStreaming && (
              <div
                className="flex gap-2.5 text-xs justify-start"
                data-testid="chat-streaming-indicator"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary mt-0.5">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-secondary/70 text-foreground border border-border/50 px-3.5 py-2.5 leading-relaxed space-y-1.5 shadow-sm">
                  <div className="relative">
                    {renderMessageContent(streamingContent, seek)}
                    <span className="inline-block animate-pulse text-primary font-bold ml-0.5">▍</span>
                  </div>

                  {streamingCitations.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground mr-1">Sumber:</span>
                      {streamingCitations.map((cite, cIdx) => (
                        <CitationBadge
                          key={cIdx}
                          timestamp={cite.start_time}
                          snippet={cite.snippet}
                          recordingTitle={cite.recording_title}
                          onClick={seek}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mb-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span className="flex-1 truncate">{error}</span>
        </div>
      )}

      {/* Input Box Footer */}
      <div className="border-t border-border/60 p-3 bg-card/40">
        <div className="flex items-end gap-2 rounded-xl border border-border/80 bg-background/60 p-1.5 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40 transition-all">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Tanyakan sesuatu tentang rapat... (Enter untuk kirim)"
            rows={1}
            className="min-h-[38px] max-h-24 resize-none border-0 bg-transparent text-xs p-2 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/70"
            data-testid="chat-input-textarea"
          />

          <Button
            type="button"
            size="icon-sm"
            onClick={() => void handleSend()}
            disabled={!inputValue.trim() || isStreaming}
            className="shrink-0 h-8 w-8 rounded-lg"
            data-testid="send-chat-btn"
            title="Kirim Pesan"
          >
            {isStreaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
