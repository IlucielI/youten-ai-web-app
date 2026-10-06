'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChatStore, ChatMessage } from '@/stores/chat.store';
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
  StopCircle,
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
 * Parses inline timestamp tags like [12:45] or [01:15:30] and replaces them with CitationBadge components.
 */
function renderMessageContent(content: string, onSeek?: (timestamp: number) => void) {
  const timestampRegex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = timestampRegex.exec(content)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(content.substring(lastIndex, matchIndex));
    }

    const timeStr = match[1];
    if (timeStr) {
      const seconds = parseTimestamp(timeStr);
      parts.push(
        <CitationBadge
          key={`citation-${matchIndex}-${timeStr}`}
          timestamp={seconds}
          onClick={onSeek}
          className="mx-0.5 inline-flex align-middle"
        />
      );
    }
    lastIndex = timestampRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

export function ChatPanel({
  recordingId,
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
            {messages.map((msg) => {
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
                    <div className="whitespace-pre-line">
                      {isUser ? msg.content : renderMessageContent(msg.content, seek)}
                    </div>

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
                  <div className="whitespace-pre-line">
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
