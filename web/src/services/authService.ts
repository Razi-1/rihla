import api from '@/lib/axios';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  PasswordResetRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  Account,
  AccountSettings,
} from '@/types/auth';
import type { SuccessResponse, ApiResponse } from '@/types/common';

export const authService = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<RegisterResponse>('/auth/register', data),

  logout: () =>
    api.post<SuccessResponse>('/auth/logout'),

  refresh: () =>
    api.post<{ data: { access_token: string } }>('/auth/refresh'),

  verifyEmail: (token: string) =>
    api.post<SuccessResponse>('/auth/verify-email', { token }),

  resendVerification: () =>
    api.post<SuccessResponse>('/auth/resend-verification'),

  forgotPassword: (data: PasswordResetRequest) =>
    api.post<SuccessResponse>('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<SuccessResponse>('/auth/reset-password', data),

  recoverEmail: (data: { government_id: string; password: string; account_type: string }) =>
    api.post<ApiResponse<{ masked_email: string }>>('/auth/recover-email', data),

  getMe: () =>
    api.get<ApiResponse<Account>>('/accounts/me'),

  updateMe: (data: Partial<Pick<Account, 'first_name' | 'last_name' | 'phone_number' | 'phone_country_code'>>) =>
    api.put<ApiResponse<Account>>('/accounts/me', data),

  changePassword: (data: ChangePasswordRequest) =>
    api.put<SuccessResponse>('/accounts/me/password', data),

  deleteAccount: () =>
    api.delete<SuccessResponse>('/accounts/me'),

  cancelDeletion: () =>
    api.post<SuccessResponse>('/accounts/me/cancel-deletion'),

  getSettings: () =>
    api.get<ApiResponse<AccountSettings>>('/accounts/me/settings'),

  updateSettings: (data: Partial<AccountSettings>) =>
    api.put<ApiResponse<AccountSettings>>('/accounts/me/settings', data),
};
