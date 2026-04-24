import { useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { accountService } from '../services/accountService';
import { LoginRequest, RegisterRequest } from '../types/auth';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuthFromToken, setAccountData, logout: storeLogout } = useAuthStore();

  const login = useCallback(
    async (data: LoginRequest) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.login(data);
        const { access_token, ...tokenData } = response.data;
        await setAuthFromToken(response.data, (response.data as any).refresh_token);
        return tokenData;
      } catch (err: any) {
        const message = err.response?.data?.detail || 'Login failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setAuthFromToken],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.register(data);
        await setAuthFromToken(response.data, (response.data as any).refresh_token);
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.detail || 'Registration failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setAuthFromToken],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore errors on logout
    } finally {
      await storeLogout();
    }
  }, [storeLogout]);

  const fetchAccount = useCallback(async () => {
    try {
      const response = await accountService.getMe();
      setAccountData(response.data.data);
    } catch {
      // silently fail
    }
  }, [setAccountData]);

  return { login, register, logout, fetchAccount, isLoading, error, setError };
}
