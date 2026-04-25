import api from '../lib/axios';
import {
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  RecoverEmailRequest,
} from '../types/auth';
import { SuccessResponse } from '../types/common';
import { getRefreshToken } from '../lib/secureStore';

export const authService = {
  register(data: RegisterRequest) {
    return api.post('/auth/register', data);
  },

  login(data: LoginRequest) {
    return api.post('/auth/login', data);
  },

  async logout() {
    const refreshToken = await getRefreshToken();
    return api.post<SuccessResponse>('/auth/logout', refreshToken ? { refresh_token: refreshToken } : {});
  },

  refresh(refreshToken: string) {
    return api.post('/auth/refresh', { refresh_token: refreshToken });
  },

  verifyEmail(data: VerifyEmailRequest) {
    return api.post<SuccessResponse>('/auth/verify-email', data);
  },

  resendVerification() {
    return api.post<SuccessResponse>('/auth/resend-verification');
  },

  forgotPassword(data: ForgotPasswordRequest) {
    return api.post<SuccessResponse>('/auth/forgot-password', data);
  },

  resetPassword(data: ResetPasswordRequest) {
    return api.post<SuccessResponse>('/auth/reset-password', data);
  },

  recoverEmail(data: RecoverEmailRequest) {
    return api.post<SuccessResponse<{ masked_email: string }>>('/auth/recover-email', data);
  },
};
