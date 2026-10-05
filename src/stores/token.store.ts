import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Guest Ownership Token Item.
 * 
 * SECURITY INVARIANT:
 * Authenticated JWTs (access & refresh tokens) MUST NEVER be stored in localStorage.
 * JWT auth tokens are strictly encapsulated in HTTP-only, Secure SameSite cookies.
 * This store ONLY retains guest unauthenticated ownership tokens for recordings
 * created before user registration/login.
 */
export interface GuestTokenItem {
  id: string;
  ownership_token: string;
  title: string;
  created_at: string;
}

export interface TokenState {
  guestTokens: GuestTokenItem[];
}

export interface TokenActions {
  addGuestToken: (item: GuestTokenItem) => void;
  removeGuestToken: (recordingId: string) => void;
  getGuestToken: (recordingId: string) => string | undefined;
  getGuestTokens: () => GuestTokenItem[];
  clearGuestTokens: () => void;
  setGuestTokens: (tokens: GuestTokenItem[]) => void;
}

export type TokenStore = TokenState & TokenActions;

const initialTokenState: TokenState = {
  guestTokens: [],
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
        clearGuestTokens: () => set(initialTokenState, false, 'token/clearGuestTokens'),
        setGuestTokens: (tokens: GuestTokenItem[]) => set({ guestTokens: tokens }, false, 'token/setGuestTokens'),
      }),
      {
        name: 'youten_guest_tokens',
      }
    ),
    { name: 'TokenStore' }
  )
);
