import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest, apiService } from './apiService';

// Mock apiClient
vi.mock('../lib/apiClient', () => ({
  default: {
    request: vi.fn(),
  },
}));

// Mock log service
vi.mock('./log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import apiClient from '../lib/apiClient';

describe('apiRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('makes GET requests with correct URL prefix', async () => {
    const mockData = { id: 1, name: 'test' };
    vi.mocked(apiClient.request).mockResolvedValue({ data: mockData });

    const result = await apiRequest('/users');

    expect(apiClient.request).toHaveBeenCalledWith({
      url: '/api/users',
      method: 'GET',
      data: undefined,
      headers: undefined,
    });
    expect(result).toEqual(mockData);
  });

  it('makes POST requests with data', async () => {
    const payload = { name: 'test' };
    const mockResponse = { success: true };
    vi.mocked(apiClient.request).mockResolvedValue({ data: mockResponse });

    const result = await apiRequest('/users', 'POST', payload);

    expect(apiClient.request).toHaveBeenCalledWith({
      url: '/api/users',
      method: 'POST',
      data: payload,
      headers: undefined,
    });
    expect(result).toEqual(mockResponse);
  });

  it('passes custom headers', async () => {
    vi.mocked(apiClient.request).mockResolvedValue({ data: {} });

    await apiRequest('/test', 'GET', undefined, { 'X-Custom': 'value' });

    expect(apiClient.request).toHaveBeenCalledWith(
      expect.objectContaining({ headers: { 'X-Custom': 'value' } })
    );
  });

  it('throws on API error', async () => {
    vi.mocked(apiClient.request).mockRejectedValue(new Error('Network error'));

    await expect(apiRequest('/fail')).rejects.toThrow('Network error');
  });
});

describe('apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides get shorthand', async () => {
    vi.mocked(apiClient.request).mockResolvedValue({ data: [] });
    await apiService.get('/items');
    expect(apiClient.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'GET' }));
  });

  it('provides post shorthand', async () => {
    vi.mocked(apiClient.request).mockResolvedValue({ data: {} });
    await apiService.post('/items', { name: 'test' });
    expect(apiClient.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', data: { name: 'test' } })
    );
  });

  it('provides put shorthand', async () => {
    vi.mocked(apiClient.request).mockResolvedValue({ data: {} });
    await apiService.put('/items/1', { name: 'updated' });
    expect(apiClient.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PUT', data: { name: 'updated' } })
    );
  });

  it('provides delete shorthand', async () => {
    vi.mocked(apiClient.request).mockResolvedValue({ data: {} });
    await apiService.delete('/items/1');
    expect(apiClient.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('provides patch shorthand', async () => {
    vi.mocked(apiClient.request).mockResolvedValue({ data: {} });
    await apiService.patch('/items/1', { status: 'active' });
    expect(apiClient.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PATCH', data: { status: 'active' } })
    );
  });
});
