import { publicApi } from '@/lib/axios';
import type { LoginCredentials, TokenResponse } from '@/types/auth';

export async function loginAdmin(credentials: LoginCredentials): Promise<TokenResponse> {
  const res = await publicApi.post<TokenResponse>('/auth/login', credentials);
  return res.data;
}

export async function logoutAdmin(refreshToken: string): Promise<void> {
  await publicApi.post('/auth/logout', { refresh_token: refreshToken });
}
