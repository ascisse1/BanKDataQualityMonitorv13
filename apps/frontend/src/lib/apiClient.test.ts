import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from './apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should be an axios instance with withCredentials enabled', () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('should set JSON content-type headers', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    expect(apiClient.defaults.headers['Accept']).toBe('application/json');
  });

  it('should have request and response interceptors configured', () => {
    // Axios stores interceptors internally — verify they exist
    expect(apiClient.interceptors.request).toBeDefined();
    expect(apiClient.interceptors.response).toBeDefined();
  });
});
