import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account } from '@/types/auth';
import type { AccountType } from '@/types/common';

interface AuthState {
  account: Account | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (account: Account, token: string) => void;
  setAccessToken: (token: string) => void;
  setAccount: (account: Account) => void;
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

      setAccessToken: (token) =>
        set({ accessToken: token }),

      setAccount: (account) =>
        set({ account }),

      logout: () =>
        set({ account: null, accessToken: null, isAuthenticated: false, isLoading: false }),

      setLoading: (loading) =>
        set({ isLoading: loading }),
    }),
    {
      name: 'rihla-auth',
      partialize: (state) => ({
        account: state.account,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export function useAccountType(): AccountType | null {
  return useAuthStore((s) => s.account?.account_type ?? null);
}
