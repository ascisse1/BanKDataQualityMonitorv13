import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { logger } from '../services/logger';

/**
 * Extracts CSRF token from cookie (set by Spring Security).
 */
function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Shared axios instance for all API calls.
 *
 * Uses relative URLs so that:
 * - In dev: requests are proxied by Vite (see vite.config.ts proxy rules)
 * - In production: requests go to the same origin
 *
 * No hardcoded backend URLs needed.
 */
const apiClient: AxiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: add CSRF token for state-changing requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const method = config.method?.toUpperCase();
    if (method && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const csrfToken = getCsrfTokenFromCookie();
      if (csrfToken) {
        config.headers['X-XSRF-TOKEN'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401/403
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logger.warning('security', 'Session expired, redirecting to login');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      logger.warning('security', 'Access denied', { url: error.config?.url });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
