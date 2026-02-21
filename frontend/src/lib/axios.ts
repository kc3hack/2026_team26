/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';

const baseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8080/';

const apiClient: AxiosInstance = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// Separate client for refresh calls to avoid interceptor loops
const refreshClient = axios.create({ baseURL: baseUrl, withCredentials: true, timeout: 10000 });

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (_value?: unknown) => void;
  reject: (_reason?: any) => void;
  config: AxiosRequestConfig;
}> = [];

const processQueue = (error: any) => {
  failedQueue.forEach(({ reject }) => reject(error));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError & { config?: AxiosRequestConfig }) => {
    const originalConfig = err.config as AxiosRequestConfig & { _retry?: boolean };

    if (err.response?.status === 401 && !originalConfig?._retry) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw err;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalConfig });
        });
      }

      originalConfig._retry = true;
      isRefreshing = true;

      try {
        await refreshClient.post('/auth/refresh', { refresh_token: refreshToken });
        isRefreshing = false;

        // retry queued requests
        const queuedRequests = failedQueue;
        failedQueue = [];
        queuedRequests.forEach(({ resolve, reject, config }) => {
          apiClient(config).then(resolve).catch(reject);
        });

        return apiClient(originalConfig);
      } catch (error_) {
        isRefreshing = false;
        processQueue(error_);
        throw error_;
      }
    }

    throw err;
  },
);

export default apiClient;
