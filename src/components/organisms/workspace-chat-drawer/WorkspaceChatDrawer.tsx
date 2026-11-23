'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceChatStore } from '@/stores/workspace-chat.store';
import { CitationCard } from '@/components/molecules/citation-card';
import {
  Bot,
  User,
  Sparkles,
  Send,
  Plus,
  Trash2,
  X,
  Folder,
  Layers,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STARTER_PROMPTS = [
  'What action items were assigned across these meetings?',
  'What were the key decisions made recently?',
  'Summarize the progress discussed across meetings.',
  'What blockers or risks were mentioned by the team?',
];

export function WorkspaceChatDrawer() {
  const {
    isOpen,
    scope,
    sessions,
    currentSessionId,
    messages,
    isStreaming,
    streamingContent,
    streamingCitations,
    isLoadingHistory,
    error,
    closeDrawer,
    selectSession,
    createNewSession,
    deleteSession,
    sendMessage,
  } = useWorkspaceChatStore();

  const [input, setInput] = useState('');
  const [showSessionsDropdown, setShowSessionsDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, streamingContent, isOpen]);

  if (!isOpen) return null;

  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeMessages = Array.isArray(messages) ? messages : [];
  const currentSession = safeSessions.find((s) => s.id === currentSessionId);
  const drawerTitle =
    scope.type === 'folder'
      ? `Ask Folder AI (${scope.folderName || 'Folder'})`
      : 'Ask Workspace AI';

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const query = input;
    setInput('');
    await sendMessage(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Workspace AI Chat"
      data-testid="workspace-chat-drawer"
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-background shadow-2xl transition-all duration-300 sm:max-w-md md:max-w-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/40">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
              scope.type === 'folder'
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'bg-primary/10 text-primary'
            )}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {scope.type === 'folder' ? (
                <>
                  <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span
                    className="truncate font-semibold text-amber-600 dark:text-amber-400"
                    data-testid="workspace-chat-drawer-title"
                  >
                    {drawerTitle}
                  </span>
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span
                    className="truncate font-semibold text-primary"
                    data-testid="workspace-chat-drawer-title"
                  >
                    {drawerTitle}
                  </span>
                </>
              )}
            </div>
            {/* Session selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSessionsDropdown(!showSessionsDropdown)}
                className="flex items-center gap-1 font-semibold text-sm text-foreground hover:text-primary transition-colors truncate max-w-[220px]"
              >
                <span className="truncate">{currentSession?.title || 'New Conversation'}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
              </button>

              {showSessionsDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-64 rounded-md border border-border bg-popover p-1 shadow-lg z-50">
                  <div className="mb-1 flex items-center justify-between px-2 py-1 text-xs text-muted-foreground border-b border-border/50">
                    <span>Recent Sessions</span>
                    <button
                      type="button"
                      data-testid="new-chat-session-btn"
                      onClick={() => {
                        setShowSessionsDropdown(false);
                        void createNewSession();
                      }}
                      className="flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      <Plus className="h-3 w-3" /> New
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {safeSessions.map((sess) => (
                      <div
                        key={sess.id}
                        className={cn(
                          'flex items-center justify-between rounded px-2 py-1.5 text-xs cursor-pointer hover:bg-accent transition-colors group',
                          sess.id === currentSessionId && 'bg-accent/70 font-medium'
                        )}
                        onClick={() => {
                          setShowSessionsDropdown(false);
                          void selectSession(sess.id);
                        }}
                      >
                        <div className="flex items-center gap-1.5 truncate flex-1 mr-1">
                          {sess.folder_id ? (
                            <Folder className="h-3 w-3 text-amber-500 shrink-0" />
                          ) : (
                            <Layers className="h-3 w-3 text-primary shrink-0" />
                          )}
                          <span className="truncate">{sess.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void deleteSession(sess.id);
                          }}
                          className="ml-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {safeSessions.length === 0 && (
                      <div className="p-2 text-center text-xs text-muted-foreground">
                        No previous chats in this scope
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid="new-chat-session-btn"
            onClick={() => void createNewSession()}
            title="Start new chat"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            data-testid="close-chat-drawer-btn"
            onClick={closeDrawer}
            title="Close"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-history-list">
        {isLoadingHistory ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground text-xs gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Loading conversation...
          </div>
        ) : safeMessages.length === 0 && !isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Multi-Meeting Intelligence</h3>
            <p className="text-xs text-muted-foreground mb-6 max-w-xs">
              Ask questions across all meetings in this {scope.type === 'folder' ? 'folder' : 'workspace'} with verified timestamps and source citations.
            </p>

            <div className="w-full space-y-2" data-testid="chat-starter-chips">
              <p className="text-[11px] font-medium text-muted-foreground text-left">Suggested inquiries:</p>
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInput(prompt);
                    void sendMessage(prompt);
                  }}
                  className="w-full text-left rounded-lg border border-border/70 bg-card p-2 text-xs hover:border-primary/50 hover:bg-accent/40 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {safeMessages.map((msg) => (
              <div
                key={msg.id}
                data-testid={msg.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}
                className={cn(
                  'flex gap-2.5 max-w-[90%]',
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                  <div
                    className={cn(
                      'rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-muted/80 text-foreground rounded-tl-none border border-border/50'
                    )}
                  >
                    {msg.content}
                  </div>

                  {msg.citations && msg.citations.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Source Evidence ({msg.citations.length})
                      </p>
                      <div className="grid grid-cols-1 gap-1.5" data-testid="citations-grid">
                        {msg.citations.map((c, i) => (
                          <CitationCard key={i} citation={c} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isStreaming && (
              <div className="flex gap-2.5 mr-auto max-w-[90%]" data-testid="chat-message-assistant">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-foreground text-xs">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="rounded-2xl rounded-tl-none bg-muted/80 border border-border/50 px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap">
                    {streamingContent || (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        Searching across meeting transcripts...
                      </span>
                    )}
                  </div>

                  {streamingCitations.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Identified Sources ({streamingCitations.length})
                      </p>
                      <div className="grid grid-cols-1 gap-1.5" data-testid="citations-grid">
                        {streamingCitations.map((c, i) => (
                          <CitationCard key={i} citation={c} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Input Form */}
      <div className="border-t border-border p-3 bg-muted/20">
        <form onSubmit={handleSend} className="relative flex items-end gap-2">
          <textarea
            data-testid="workspace-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={2}
            placeholder={
              scope.type === 'folder'
                ? `Ask about meetings in ${scope.folderName || 'this folder'}...`
                : 'Ask across all workspace meetings...'
            }
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="submit"
            data-testid="send-workspace-chat-btn"
            disabled={!input.trim() || isStreaming}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

