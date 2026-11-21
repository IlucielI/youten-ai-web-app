import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import {
  WorkspaceDTO,
  WorkspaceMemberDTO,
  FolderDTO,
} from '@/server/dtos/workspace.dto';
import { WORKSPACE_COOKIE_NAME } from '@/server/constants/auth.constant';

export interface WorkspaceState {
  workspaces: WorkspaceDTO[];
  activeWorkspace: WorkspaceDTO | null;
  members: WorkspaceMemberDTO[];
  folders: FolderDTO[];
  activeFolderId: string | null;
  isLoading: boolean;
  isInitialized: boolean;
}

export interface WorkspaceActions {
  fetchWorkspaces: () => Promise<WorkspaceDTO[]>;
  setActiveWorkspace: (ws: WorkspaceDTO | null) => Promise<void>;
  fetchMembers: (workspaceId?: string) => Promise<WorkspaceMemberDTO[]>;
  fetchFolders: () => Promise<FolderDTO[]>;
  setActiveFolderId: (folderId: string | null) => void;
  createWorkspace: (name: string, description?: string) => Promise<WorkspaceDTO | null>;
  createFolder: (name: string, parentId?: string | null) => Promise<FolderDTO | null>;
  reset: () => void;
}

export type WorkspaceStore = WorkspaceState & WorkspaceActions;

const initialWorkspaceState: WorkspaceState = {
  workspaces: [],
  activeWorkspace: null,
  members: [],
  folders: [],
  activeFolderId: null,
  isLoading: false,
  isInitialized: false,
};

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  devtools(
    (set, get) => ({
      ...initialWorkspaceState,

      fetchWorkspaces: async () => {
        set({ isLoading: true }, false, 'workspace/fetchWorkspacesStart');
        try {
          const res = await apiFetch<ApiResponse<WorkspaceDTO[]>>('/api/workspaces');
          if (res && res.data) {
            const workspaces = res.data;
            let current = get().activeWorkspace;

            const cookieWsId = getCookie(WORKSPACE_COOKIE_NAME);
            if (cookieWsId) {
              const matched = workspaces.find((w) => w.id === cookieWsId);
              if (matched) {
                current = matched;
              }
            }

            if (!current && workspaces.length > 0) {
              current = workspaces[0];
            }

            set(
              {
                workspaces,
                activeWorkspace: current,
                isLoading: false,
                isInitialized: true,
              },
              false,
              'workspace/fetchWorkspacesSuccess'
            );

            if (current) {
              await get().setActiveWorkspace(current);
            }
            return workspaces;
          }
          set({ isLoading: false, isInitialized: true }, false, 'workspace/fetchWorkspacesEmpty');
          return [];
        } catch {
          set({ isLoading: false, isInitialized: true }, false, 'workspace/fetchWorkspacesError');
          return [];
        }
      },

      setActiveWorkspace: async (ws: WorkspaceDTO | null) => {
        set({ activeWorkspace: ws, activeFolderId: null }, false, 'workspace/setActiveWorkspace');
        if (typeof document !== 'undefined') {
          if (ws) {
            document.cookie = `${WORKSPACE_COOKIE_NAME}=${ws.id}; path=/; max-age=2592000; SameSite=Lax;`;
          } else {
            document.cookie = `${WORKSPACE_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax;`;
          }
        }
        try {
          await apiFetch('/api/workspaces/active', {
            method: 'POST',
            body: JSON.stringify({ workspace_id: ws ? ws.id : null }),
          });
        } catch {
          // Ignore background sync errors
        }
        if (ws) {
          await Promise.all([get().fetchFolders(), get().fetchMembers(ws.id)]);
        } else {
          set({ folders: [], members: [] }, false, 'workspace/clearScope');
        }
      },

      fetchMembers: async (workspaceId?: string) => {
        const wsId = workspaceId || get().activeWorkspace?.id;
        if (!wsId) {
          set({ members: [] }, false, 'workspace/fetchMembersNoWorkspace');
          return [];
        }
        try {
          const res = await apiFetch<ApiResponse<WorkspaceMemberDTO[]>>(`/api/workspaces/${wsId}/members`);
          if (res && res.data) {
            set({ members: res.data }, false, 'workspace/fetchMembersSuccess');
            return res.data;
          }
          return [];
        } catch {
          return [];
        }
      },

      fetchFolders: async () => {
        try {
          const res = await apiFetch<ApiResponse<FolderDTO[]>>('/api/folders');
          if (res && res.data) {
            set({ folders: res.data }, false, 'workspace/fetchFoldersSuccess');
            return res.data;
          }
          return [];
        } catch {
          return [];
        }
      },

      setActiveFolderId: (folderId: string | null) => {
        set({ activeFolderId: folderId }, false, 'workspace/setActiveFolderId');
      },

      createWorkspace: async (name: string, description?: string) => {
        try {
          const res = await apiFetch<ApiResponse<WorkspaceDTO>>('/api/workspaces', {
            method: 'POST',
            body: JSON.stringify({ name, description }),
          });
          if (res && res.data) {
            const newWs = res.data;
            const updated = [...get().workspaces, newWs];
            set({ workspaces: updated }, false, 'workspace/createWorkspaceSuccess');
            await get().setActiveWorkspace(newWs);
            return newWs;
          }
          return null;
        } catch {
          return null;
        }
      },

      createFolder: async (name: string, parentId?: string | null) => {
        try {
          const res = await apiFetch<ApiResponse<FolderDTO>>('/api/folders', {
            method: 'POST',
            body: JSON.stringify({ name, parent_id: parentId ?? null }),
          });
          if (res && res.data) {
            await get().fetchFolders();
            return res.data;
          }
          return null;
        } catch {
          return null;
        }
      },

      reset: () => set(initialWorkspaceState, false, 'workspace/reset'),
    }),
    { name: 'WorkspaceStore' }
  )
);
