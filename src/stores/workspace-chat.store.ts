import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { fetchWithAuth } from '@/lib/api-client';
import { MeetingSourceCitationDTO, WorkspaceChatMessageDTO, WorkspaceChatSessionDTO } from '../server/dtos';

export interface ChatScope {
  type: 'workspace' | 'folder';
  folderId?: string;
  folderName?: string;
}

export interface WorkspaceChatState {
  isOpen: boolean;
  scope: ChatScope;
  sessions: WorkspaceChatSessionDTO[];
  currentSessionId: string | null;
  messages: WorkspaceChatMessageDTO[];
  isStreaming: boolean;
  streamingContent: string;
  streamingCitations: MeetingSourceCitationDTO[];
  isLoadingSessions: boolean;
  isLoadingHistory: boolean;
  error: string | null;
}

export interface WorkspaceChatActions {
  openDrawer: (scope?: ChatScope) => void;
  closeDrawer: () => void;
  setScope: (scope: ChatScope) => void;
  fetchSessions: (folderId?: string) => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  createNewSession: (title?: string) => Promise<string | null>;
  deleteSession: (sessionId: string) => Promise<void>;
  sendMessage: (query: string) => Promise<void>;
  reset: () => void;
}

export type WorkspaceChatStore = WorkspaceChatState & WorkspaceChatActions;

const defaultScope: ChatScope = { type: 'workspace' };

const initialState: WorkspaceChatState = {
  isOpen: false,
  scope: defaultScope,
  sessions: [],
  currentSessionId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  streamingCitations: [],
  isLoadingSessions: false,
  isLoadingHistory: false,
  error: null,
};

export const useWorkspaceChatStore = create<WorkspaceChatStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      openDrawer: (scope?: ChatScope) => {
        const nextScope = scope || get().scope;
        set(
          {
            isOpen: true,
            scope: nextScope,
            currentSessionId: null,
            messages: [],
            streamingContent: '',
            streamingCitations: [],
            error: null,
          },
          false,
          'workspaceChat/openDrawer'
        );
        void get().fetchSessions(nextScope.folderId);
      },

      closeDrawer: () => {
        set(
          {
            isOpen: false,
            currentSessionId: null,
            messages: [],
            streamingContent: '',
            streamingCitations: [],
            error: null,
          },
          false,
          'workspaceChat/closeDrawer'
        );
      },

      setScope: (scope: ChatScope) => {
        set(
          {
            scope,
            currentSessionId: null,
            messages: [],
            streamingContent: '',
            streamingCitations: [],
            error: null,
          },
          false,
          'workspaceChat/setScope'
        );
        void get().fetchSessions(scope.folderId);
      },

      fetchSessions: async (folderId?: string) => {
        set({ isLoadingSessions: true, error: null }, false, 'workspaceChat/fetchSessions/start');
        try {
          const query = folderId ? `?folder_id=${encodeURIComponent(folderId)}` : '';
          const res = await fetchWithAuth(`/api/chat/sessions${query}`);
          if (!res.ok) {
            throw new Error('Gagal memuat sesi chat');
          }
          const json = await res.json();
          const raw = json.data;
          const sessions: WorkspaceChatSessionDTO[] = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.sessions)
            ? raw.sessions
            : [];
          set(
            {
              sessions,
              isLoadingSessions: false,
            },
            false,
            'workspaceChat/fetchSessions/success'
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Gagal memuat sesi chat';
          set({ isLoadingSessions: false, error: msg }, false, 'workspaceChat/fetchSessions/error');
        }
      },

      selectSession: async (sessionId: string) => {
        set({ currentSessionId: sessionId, isLoadingHistory: true, error: null }, false, 'workspaceChat/selectSession/start');
        try {
          const res = await fetchWithAuth(`/api/chat/sessions/${sessionId}`);
          if (!res.ok) {
            throw new Error('Gagal memuat riwayat percakapan');
          }
          const json = await res.json();
          const raw = json.data;
          const messages: WorkspaceChatMessageDTO[] = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.messages)
            ? raw.messages
            : [];
          set(
            {
              messages,
              isLoadingHistory: false,
            },
            false,
            'workspaceChat/selectSession/success'
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Gagal memuat riwayat percakapan';
          set({ isLoadingHistory: false, error: msg }, false, 'workspaceChat/selectSession/error');
        }
      },

      createNewSession: async (title?: string) => {
        const { scope } = get();
        try {
          const res = await fetchWithAuth('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: title || (scope.type === 'folder' ? `Chat ${scope.folderName || 'Folder'}` : 'New Workspace Chat'),
              folder_id: scope.folderId || null,
            }),
          });
          if (!res.ok) {
            throw new Error('Gagal membuat sesi chat baru');
          }
          const json = await res.json();
          const newSession: WorkspaceChatSessionDTO = json.data;
          set(
            (state) => ({
              sessions: [newSession, ...state.sessions],
              currentSessionId: newSession.id,
              messages: [],
              error: null,
            }),
            false,
            'workspaceChat/createNewSession/success'
          );
          return newSession.id;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Gagal membuat sesi chat baru';
          set({ error: msg }, false, 'workspaceChat/createNewSession/error');
          return null;
        }
      },

      deleteSession: async (sessionId: string) => {
        try {
          const res = await fetchWithAuth(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' });
          if (!res.ok) {
            throw new Error('Gagal menghapus sesi chat');
          }
          set(
            (state) => {
              const updatedSessions = state.sessions.filter((s) => s.id !== sessionId);
              const nextSelectedId =
                state.currentSessionId === sessionId
                  ? updatedSessions.length > 0
                    ? updatedSessions[0].id
                    : null
                  : state.currentSessionId;

              return {
                sessions: updatedSessions,
                currentSessionId: nextSelectedId,
                messages: nextSelectedId ? state.messages : [],
              };
            },
            false,
            'workspaceChat/deleteSession/success'
          );

          if (get().currentSessionId) {
            void get().selectSession(get().currentSessionId!);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Gagal menghapus sesi chat';
          set({ error: msg }, false, 'workspaceChat/deleteSession/error');
        }
      },

      sendMessage: async (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;

        const { currentSessionId, scope, messages } = get();

        // 1. Optimistic User Message
        const userMsg: WorkspaceChatMessageDTO = {
          id: `temp-${Date.now()}`,
          session_id: currentSessionId || '',
          role: 'user',
          content: trimmed,
          created_at: new Date().toISOString(),
        };

        set(
          {
            messages: [...messages, userMsg],
            isStreaming: true,
            streamingContent: '',
            streamingCitations: [],
            error: null,
          },
          false,
          'workspaceChat/sendMessage/start'
        );

        try {
          const res = await fetchWithAuth('/api/chat/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: trimmed,
              question: trimmed,
              session_id: currentSessionId || undefined,
              folder_id: scope.folderId || undefined,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Gagal memulai streaming chat');
          }

          if (!res.body) {
            throw new Error('Readable stream not supported');
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';
          let capturedCitations: MeetingSourceCitationDTO[] = [];
          let activeSessionId = currentSessionId;
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop() || '';

            for (const eventBlock of events) {
              const lines = eventBlock.split('\n');
              let eventType = '';
              let dataStr = '';

              for (const line of lines) {
                if (line.startsWith('event: ')) {
                  eventType = line.slice(7).trim();
                } else if (line.startsWith('data: ')) {
                  dataStr = line.slice(6).trim();
                }
              }

              if (!dataStr) continue;

              try {
                const parsed = JSON.parse(dataStr);
                if (eventType === 'citations') {
                  capturedCitations = Array.isArray(parsed) ? parsed : [];
                  set({ streamingCitations: capturedCitations }, false, 'workspaceChat/citations');
                } else if (eventType === 'token') {
                  fullContent += parsed.token || '';
                  set({ streamingContent: fullContent }, false, 'workspaceChat/token');
                } else if (eventType === 'done') {
                  if (parsed.session_id) {
                    activeSessionId = parsed.session_id;
                  }
                }
              } catch {
                // Ignore parse error on partial chunks
              }
            }
          }

          // Finalize Assistant Message
          const assistantMsg: WorkspaceChatMessageDTO = {
            id: `asst-${Date.now()}`,
            session_id: activeSessionId || '',
            role: 'assistant',
            content: fullContent,
            citations: capturedCitations,
            created_at: new Date().toISOString(),
          };

          set(
            (state) => ({
              messages: [...state.messages, assistantMsg],
              isStreaming: false,
              streamingContent: '',
              streamingCitations: [],
              currentSessionId: activeSessionId || state.currentSessionId,
            }),
            false,
            'workspaceChat/sendMessage/complete'
          );

          // Refresh sessions list to update message count / title
          void get().fetchSessions(scope.folderId);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Gagal mengirim pesan';
          set(
            {
              isStreaming: false,
              streamingContent: '',
              streamingCitations: [],
              error: msg,
            },
            false,
            'workspaceChat/sendMessage/error'
          );
        }
      },

      reset: () => {
        set(initialState, false, 'workspaceChat/reset');
      },
    }),
    { name: 'workspace-chat-store' }
  )
);

