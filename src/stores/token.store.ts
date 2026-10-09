import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { AnonTokenResponse } from '@/server/dtos/auth.dto';

/**
 * Guest Ownership Token Item.
 * 
 * SECURITY INVARIANT:
 * Authenticated JWTs (access & refresh tokens) MUST NEVER be stored in localStorage.
 * JWT auth tokens are strictly encapsulated in HTTP-only, Secure SameSite cookies.
 * This store ONLY retains guest unauthenticated ownership tokens for recordings
 * created before user registration/login and the anonymous handshake session token.
 */
export interface GuestTokenItem {
  id: string;
  ownership_token: string;
  title: string;
  created_at: string;
}

export interface AnonSessionItem {
  anon_token: string;
  session_id: string;
  client_id: string;
  expires_at: number;
}

export interface TokenState {
  guestTokens: GuestTokenItem[];
  anonSession: AnonSessionItem | null;
}

export interface TokenActions {
  addGuestToken: (item: GuestTokenItem) => void;
  removeGuestToken: (recordingId: string) => void;
  getGuestToken: (recordingId: string) => string | undefined;
  getGuestTokens: () => GuestTokenItem[];
  clearGuestTokens: () => void;
  setGuestTokens: (tokens: GuestTokenItem[]) => void;
  setAnonSession: (session: AnonSessionItem | null) => void;
  getAnonToken: () => string | undefined;
  clearAnonSession: () => void;
  ensureAnonSession: () => Promise<string | null>;
}

export type TokenStore = TokenState & TokenActions;

const initialTokenState: TokenState = {
  guestTokens: [],
  anonSession: null,
};

export const useTokenStore = create<TokenStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialTokenState,
        addGuestToken: (item: GuestTokenItem) =>
          set(
            (state) => ({
              guestTokens: [
                item,
                ...state.guestTokens.filter((t) => t.id !== item.id && t.ownership_token !== item.ownership_token),
              ],
            }),
            false,
            'token/addGuestToken'
          ),
        removeGuestToken: (recordingId: string) =>
          set(
            (state) => ({
              guestTokens: state.guestTokens.filter((t) => t.id !== recordingId),
            }),
            false,
            'token/removeGuestToken'
          ),
        getGuestToken: (recordingId: string) => {
          const item = get().guestTokens.find((t) => t.id === recordingId);
          return item?.ownership_token;
        },
        getGuestTokens: () => get().guestTokens,
        clearGuestTokens: () => set((state) => ({ ...state, guestTokens: [] }), false, 'token/clearGuestTokens'),
        setGuestTokens: (tokens: GuestTokenItem[]) => set({ guestTokens: tokens }, false, 'token/setGuestTokens'),
        setAnonSession: (session: AnonSessionItem | null) =>
          set({ anonSession: session }, false, 'token/setAnonSession'),
        getAnonToken: () => {
          const session = get().anonSession;
          if (session && Date.now() < session.expires_at) {
            return session.anon_token;
          }
          return undefined;
        },
        clearAnonSession: () =>
          set({ anonSession: null }, false, 'token/clearAnonSession'),
        ensureAnonSession: async () => {
          const current = get().anonSession;
          if (current && Date.now() < current.expires_at - 60000) {
            return current.anon_token;
          }
          try {
            const res = await apiFetch<ApiResponse<AnonTokenResponse>>('/api/auth/anon', {
              method: 'POST',
            });
            if (res && res.status === 'success' && res.data) {
              const session: AnonSessionItem = {
                anon_token: res.data.anon_token,
                session_id: res.data.session_id,
                client_id: res.data.client_id,
                expires_at: Date.now() + (res.data.expires_in || 604800) * 1000,
              };
              set({ anonSession: session }, false, 'token/setAnonSession');
              return session.anon_token;
            }
          } catch (err) {
            console.error('Failed to initialize anonymous handshake session:', err);
          }
          return null;
        },
      }),
      {
        name: 'youten_guest_tokens',
      }
    ),
    { name: 'TokenStore' }
  )
);

