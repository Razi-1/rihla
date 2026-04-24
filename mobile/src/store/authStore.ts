import { create } from 'zustand';
import { AccountType } from '../types/common';
import { TokenResponse } from '../types/auth';
import { AccountResponse } from '../types/account';
import {
  setAccessToken,
  setRefreshToken,
  setAccountId,
  setAccountType,
  getAccessToken,
  getAccountId,
  getAccountType,
  clearAll,
} from '../lib/secureStore';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  accountId: string | null;
  accountType: AccountType | null;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  isEmailVerified: boolean;
  isAgeRestricted: boolean;
  isRestricted: boolean;

  hydrate: () => Promise<void>;
  setAuthFromToken: (token: TokenResponse, refreshToken?: string) => Promise<void>;
  setAccountData: (account: AccountResponse) => void;
  updateProfilePicture: (url: string) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  accountId: null,
  accountType: null,
  firstName: null,
  lastName: null,
  profilePictureUrl: null,
  isEmailVerified: false,
  isAgeRestricted: false,
  isRestricted: false,

  hydrate: async () => {
    try {
      const [token, id, type] = await Promise.all([
        getAccessToken(),
        getAccountId(),
        getAccountType(),
      ]);
      if (token && id && type) {
        set({
          isAuthenticated: true,
          accountId: id,
          accountType: type as AccountType,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setAuthFromToken: async (token: TokenResponse, refreshToken?: string) => {
    await Promise.all([
      setAccessToken(token.access_token),
      refreshToken ? setRefreshToken(refreshToken) : Promise.resolve(),
      setAccountId(token.account_id),
      setAccountType(token.account_type),
    ]);

    set({
      isAuthenticated: true,
      accountId: token.account_id,
      accountType: token.account_type,
      firstName: token.first_name,
      lastName: token.last_name,
      isEmailVerified: token.is_email_verified,
      isAgeRestricted: token.is_age_restricted,
      isLoading: false,
    });
  },

  setAccountData: (account: AccountResponse) => {
    set({
      firstName: account.first_name,
      lastName: account.last_name,
      profilePictureUrl: account.profile_picture_url,
      isEmailVerified: account.is_email_verified,
      isAgeRestricted: account.is_age_restricted,
      isRestricted: account.is_restricted,
    });
  },

  updateProfilePicture: (url: string) => {
    set({ profilePictureUrl: url });
  },

  logout: async () => {
    await clearAll();
    set({
      isAuthenticated: false,
      accountId: null,
      accountType: null,
      firstName: null,
      lastName: null,
      profilePictureUrl: null,
      isEmailVerified: false,
      isAgeRestricted: false,
      isRestricted: false,
      isLoading: false,
    });
  },
}));
