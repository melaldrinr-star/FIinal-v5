import { describe, it, expect, vi, beforeEach } from 'vitest';
import tenantService, { Tenant } from '../tenantService';

// Mock the api module
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from '../api';

describe('TenantService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActiveTenants', () => {
    it('should fetch active tenants successfully', async () => {
      const mockTenants: Tenant[] = [
        {
          id: '123',
          name: 'Test Tenant',
          status: 'active',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: '456',
          name: 'Another Tenant',
          status: 'active',
          created_at: '2024-01-02',
          updated_at: '2024-01-02',
        },
      ];

      vi.mocked(api.get).mockResolvedValueOnce({
        success: true,
        data: mockTenants,
      });

      const result = await tenantService.getActiveTenants();

      expect(api.get).toHaveBeenCalledWith('/tenants');
      expect(result).toEqual(mockTenants);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no tenants exist', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        success: true,
        data: [],
      });

      const result = await tenantService.getActiveTenants();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should return empty array when data is null', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        success: true,
        data: null,
      });

      const result = await tenantService.getActiveTenants();

      expect(result).toEqual([]);
    });

    it('should throw error with meaningful message on API failure', async () => {
      const apiError = new Error('Network error');

      vi.mocked(api.get).mockRejectedValueOnce(apiError);

      await expect(tenantService.getActiveTenants()).rejects.toThrow('Network error');
    });

    it('should throw error with fallback message when error message is missing', async () => {
      const apiError = {};

      vi.mocked(api.get).mockRejectedValueOnce(apiError);

      await expect(tenantService.getActiveTenants()).rejects.toThrow(
        'Failed to load organizations'
      );
    });
  });
});
