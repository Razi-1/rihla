import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import type { LoginRequest, RegisterRequest } from '@/types/auth';

export function useAuth() {
  const { account, isAuthenticated, isLoading, setAuth, logout: clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authService.login(data);
    setAuth(res.data.data.account, res.data.data.access_token);
    const role = res.data.data.account.account_type;
    navigate(`/${role}/dashboard`);
  }, [setAuth, navigate]);

  const register = useCallback(async (data: RegisterRequest) => {
    await authService.register(data);
    navigate('/login?registered=true');
  }, [navigate]);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  const initAuth = useCallback(async () => {
    if (!isAuthenticated) {
      useAuthStore.getState().setLoading(false);
      return;
    }
    try {
      const res = await authService.getMe();
      useAuthStore.getState().setAccount(res.data.data);
      useAuthStore.getState().setLoading(false);
    } catch {
      clearAuth();
    }
  }, [isAuthenticated, clearAuth]);

  return { account, isAuthenticated, isLoading, login, register, logout, initAuth };
}
