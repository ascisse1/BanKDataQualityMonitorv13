import { describe, it, expect, vi, beforeEach } from 'vitest';
import { correctionService, CorrectionRequest } from './correctionService';

// Mock apiClient
vi.mock('../lib/apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

// Mock log
vi.mock('./log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

import apiClient from '../lib/apiClient';

describe('correctionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitCorrection', () => {
    const mockRequest: CorrectionRequest = {
      cli: 'CLI001',
      fieldName: 'nom',
      oldValue: 'old',
      newValue: 'new',
      structureCode: 'AG001',
      action: 'FIX',
      priority: 'MEDIUM',
    };

    it('submits correction successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            correctionId: 1,
            ticketId: 100,
            ticketNumber: 'TK-001',
            cli: 'CLI001',
            fieldName: 'nom',
            ticketStatus: 'OPEN',
            incidentStatus: 'PENDING',
            createdAt: '2026-04-04',
            message: 'Correction submitted',
            requiresValidation: true,
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await correctionService.submitCorrection(mockRequest);

      expect(apiClient.post).toHaveBeenCalledWith('/api/corrections', mockRequest);
      expect(result.ticketNumber).toBe('TK-001');
      expect(result.requiresValidation).toBe(true);
    });

    it('throws on API failure response', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: false, message: 'Validation failed' },
      });

      await expect(correctionService.submitCorrection(mockRequest)).rejects.toThrow(
        'Validation failed'
      );
    });

    it('throws on network error', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      await expect(correctionService.submitCorrection(mockRequest)).rejects.toThrow(
        'Network error'
      );
    });
  });
});
