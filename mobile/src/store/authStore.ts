import { create } from 'zustand';
import { AccountType } from '../types/common';
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

interface AccountLike {
  id: string;
  account_type: AccountType;
  first_name: string;
  last_name: string;
  profile_picture_url?: string | null;
  is_email_verified?: boolean;
  is_age_restricted?: boolean;
}

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
  setAuthFromLogin: (account: AccountLike, accessToken: string, refreshToken?: string) => Promise<void>;
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

  setAuthFromLogin: async (account: AccountLike, accessToken: string, refreshToken?: string) => {
    await Promise.all([
      setAccessToken(accessToken),
      refreshToken ? setRefreshToken(refreshToken) : Promise.resolve(),
      setAccountId(account.id),
      setAccountType(account.account_type),
    ]);

    set({
      isAuthenticated: true,
      accountId: account.id,
      accountType: account.account_type,
      firstName: account.first_name,
      lastName: account.last_name,
      profilePictureUrl: account.profile_picture_url ?? null,
      isEmailVerified: account.is_email_verified ?? false,
      isAgeRestricted: account.is_age_restricted ?? false,
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
