import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWorkspaceChatStore } from './workspace-chat.store';

describe('useWorkspaceChatStore', () => {
  beforeEach(() => {
    useWorkspaceChatStore.getState().reset();
    vi.restoreAllMocks();
  });

  it('should initialize with closed drawer and default workspace scope', () => {
    const state = useWorkspaceChatStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.scope.type).toBe('workspace');
    expect(state.sessions).toEqual([]);
    expect(state.currentSessionId).toBeNull();
    expect(state.messages).toEqual([]);
    expect(state.isStreaming).toBe(false);
  });

  it('should open and close drawer with scope', () => {
    const store = useWorkspaceChatStore.getState();
    store.openDrawer({ type: 'folder', folderId: 'f-123', folderName: 'Engineering' });

    expect(useWorkspaceChatStore.getState().isOpen).toBe(true);
    expect(useWorkspaceChatStore.getState().scope).toEqual({
      type: 'folder',
      folderId: 'f-123',
      folderName: 'Engineering',
    });

    useWorkspaceChatStore.getState().closeDrawer();
    expect(useWorkspaceChatStore.getState().isOpen).toBe(false);
  });

  it('should fetch and set sessions', async () => {
    const mockSessions = [
      {
        id: 'sess-1',
        workspace_id: 'ws-1',
        title: 'Project Kickoff',
        user_id: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockSessions }),
    });

    await useWorkspaceChatStore.getState().fetchSessions();

    expect(useWorkspaceChatStore.getState().sessions).toEqual(mockSessions);
    // Initial fetch keeps currentSessionId null for a clean new chat session
    expect(useWorkspaceChatStore.getState().currentSessionId).toBeNull();
  });

  it('should select session and load message history', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        session_id: 'sess-1',
        role: 'user' as const,
        content: 'What were the action items?',
        created_at: new Date().toISOString(),
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockMessages }),
    });

    await useWorkspaceChatStore.getState().selectSession('sess-1');

    expect(useWorkspaceChatStore.getState().currentSessionId).toBe('sess-1');
    expect(useWorkspaceChatStore.getState().messages).toEqual(mockMessages);
  });
});

