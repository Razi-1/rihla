import { useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { accountService } from '../services/accountService';
import { LoginRequest, RegisterRequest } from '../types/auth';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuthFromLogin, setAccountData, logout: storeLogout } = useAuthStore();

  const login = useCallback(
    async (data: LoginRequest) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.login(data);
        const body = response.data as any;
        const loginData = body.data || body;
        await setAuthFromLogin(
          loginData.account,
          loginData.access_token,
          loginData.refresh_token,
        );
        return loginData.account;
      } catch (err: any) {
        const message = err.response?.data?.detail || 'Login failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setAuthFromLogin],
  );

  const register = useCallback(
    async (data: RegisterRequest): Promise<{ autoLoggedIn: boolean }> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.register(data);
        const body = response.data as any;
        const regData = body.data || body;

        if (regData?.access_token && regData?.account) {
          await setAuthFromLogin(
            regData.account,
            regData.access_token,
            regData.refresh_token,
          );
          return { autoLoggedIn: true };
        }
        return { autoLoggedIn: false };
      } catch (err: any) {
        const message = err.response?.data?.detail || 'Registration failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setAuthFromLogin],
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
