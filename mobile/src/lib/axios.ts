import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearAll } from './secureStore';
import { TokenResponse } from '../types/auth';

const API_BASE_URL = __DEV__
  ? 'http://10.11.17.209:8000'
  : 'https://api.rihla.app';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      !Array.isArray(response.data) &&
      !('data' in response.data)
    ) {
      response.data = { data: response.data };
    }
    if (Array.isArray(response.data)) {
      response.data = { data: response.data };
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    if (error.response?.status === 401 && !(originalRequest as any)._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      (originalRequest as any)._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          await clearAll();
          processQueue(new Error('No refresh token'), null);
          return Promise.reject(error);
        }

        const { data: rawData } = await axios.post<{ data: TokenResponse }>(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
        );
        const tokenData = rawData.data;

        await setAccessToken(tokenData.access_token);
        if (tokenData.refresh_token) {
          await setRefreshToken(tokenData.refresh_token);
        }

        processQueue(null, tokenData.access_token);
        originalRequest.headers.Authorization = `Bearer ${tokenData.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        await clearAll();
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
export { API_BASE_URL };
