import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { UserProfileResponse } from '@/server/dtos/auth.dto';

export interface AuthState {
  user: UserProfileResponse | null;
  isLoading: boolean;
  isInitialized: boolean;
}

export interface AuthActions {
  fetchUser: () => Promise<UserProfileResponse | null>;
  setUser: (user: UserProfileResponse | null) => void;
  logout: () => Promise<void>;
  reset: () => void;
}

export type AuthStore = AuthState & AuthActions;

const initialAuthState: AuthState = {
  user: null,
  isLoading: false,
  isInitialized: false,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      ...initialAuthState,
      fetchUser: async () => {
        set({ isLoading: true }, false, 'auth/fetchUserStart');
        try {
          const res = await apiFetch<ApiResponse<UserProfileResponse>>('/api/auth/me');
          if (res && (res.status === 'success' || (res.status as string) === 'SUCCESS') && res.data) {
            set({ user: res.data, isLoading: false, isInitialized: true }, false, 'auth/fetchUserSuccess');
            return res.data;
          }
          set({ user: null, isLoading: false, isInitialized: true }, false, 'auth/fetchUserEmpty');
          return null;
        } catch {
          set({ user: null, isLoading: false, isInitialized: true }, false, 'auth/fetchUserError');
          return null;
        }
      },
      setUser: (user) => set({ user, isInitialized: true }, false, 'auth/setUser'),
      logout: async () => {
        try {
          await apiFetch('/api/auth/logout', { method: 'POST' });
        } catch {
          // ignore logout network errors
        } finally {
          set({ user: null, isInitialized: true }, false, 'auth/logout');
        }
      },
      reset: () => set(initialAuthState, false, 'auth/reset'),
    }),
    { name: 'AuthStore' }
  )
);
