import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminAccount } from '@/types/auth';

interface AuthState {
  account: AdminAccount | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (account: AdminAccount, token: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      account: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (account, token) =>
        set({ account, accessToken: token, isAuthenticated: true, isLoading: false }),

      setAccessToken: (token) => set({ accessToken: token }),

      logout: () =>
        set({
          account: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'rihla-admin-auth',
      partialize: (state) => ({
        account: state.account,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
