import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCreateRequirementDefinition } from './useCreateRequirementDefinition';
import api from '../services/api';
import type {
  RequirementDefinition,
  CreateRequirementPayload,
} from '../types/requirementDefinition';

// Mock the API service
vi.mock('../services/api');

// Mock the logger
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Create a wrapper for React Query
const createTestWrapper = () => {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: 0 },
    },
  });

  const wrapper = ({ children }: any) =>
    React.createElement(QueryClientProvider, { client: testQueryClient }, children);

  return { wrapper, testQueryClient };
};

// Mock requirement definition for testing
const mockCreatedRequirement: RequirementDefinition = {
  id: 'req-new-123',
  tenant_id: 'tenant-1',
  requirement_type: 'birth_certificate',
  display_name: 'Birth Certificate',
  description: 'NSO/PSA Birth Certificate',
  is_mandatory: true,
  is_active: true,
  applicability_rules: null,
  display_order: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deleted_at: null,
};

describe('useCreateRequirementDefinition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful creation', () => {
    it('should create requirement definition with all fields', async () => {
      const { wrapper, testQueryClient } = createTestWrapper();

      (api.post as any).mockResolvedValueOnce({
        success: true,
        data: mockCreatedRequirement,
      });

      const { result } = renderHook(() => useCreateRequirementDefinition(), {
        wrapper,
      });

      const createPayload: CreateRequirementPayload = {
        displayName: 'Birth Certificate',
        description: 'NSO/PSA Birth Certificate',
        isMandatory: true,
        isActive: true,
        applicabilityRules: null,
      };

      result.current.mutate(createPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual(mockCreatedRequirement);
      expect(api.post).toHaveBeenCalledWith(
        '/requirement-definitions',
        {
          display_name: 'Birth Certificate',
          description: 'NSO/PSA Birth Certificate',
          is_mandatory: true,
          is_active: true,
        }
      );
    });

    it('should create requirement with default isActive=true if not specified', async () => {
      const { wrapper } = createTestWrapper();

      (api.post as any).mockResolvedValueOnce({
        success: true,
        data: mockCreatedRequirement,
      });

      const { result } = renderHook(() => useCreateRequirementDefinition(), {
        wrapper,
      });

      const createPayload: CreateRequirementPayload = {
        displayName: 'Birth Certificate',
        description: 'NSO/PSA Birth Certificate',
        isMandatory: true,
      };

      result.current.mutate(createPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.data).toEqual(mockCreatedRequirement);
      expect(api.post).toHaveBeenCalledWith(
        '/requirement-definitions',
        {
          display_name: 'Birth Certificate',
          description: 'NSO/PSA Birth Certificate',
          is_mandatory: true,
          is_active: true,
        }
      );
    });

    it('should create requirement with applicability rules', async () => {
      const { wrapper } = createTestWrapper();

      const applicabilityRules = { marital_status: 'married' };
      const requirementWithRules = {
        ...mockCreatedRequirement,
        applicability_rules: applicabilityRules,
      };

      (api.post as any).mockResolvedValueOnce({
        success: true,
        data: requirementWithRules,
      });

      const { result } = renderHook(() => useCreateRequirementDefinition(), {
        wrapper,
      });

      const createPayload: CreateRequirementPayload = {
        displayName: 'Marriage Certificate',
        description: 'PSA/NSO Marriage Certificate (for married women only)',
        isMandatory: false,
        applicabilityRules,
      };

      result.current.mutate(createPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.data).toEqual(requirementWithRules);
      expect(api.post).toHaveBeenCalledWith(
        '/requirement-definitions',
        {
          display_name: 'Marriage Certificate',
          description: 'PSA/NSO Marriage Certificate (for married women only)',
          is_mandatory: false,
          is_active: true,
          applicability_rules: applicabilityRules,
        }
      );
    });

    it('should convert camelCase to snake_case in API payload', async () => {
      const { wrapper } = createTestWrapper();

      (api.post as any).mockResolvedValueOnce({
        success: true,
        data: mockCreatedRequirement,
      });

      const { result } = renderHook(() => useCreateRequirementDefinition(), {
        wrapper,
      });

      const createPayload: CreateRequirementPayload = {
        displayName: 'Birth Certificate',
        description: 'NSO/PSA Birth Certificate',
        isMandatory: true,
        isActive: false,
      };

      result.current.mutate(createPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(api.post).toHaveBeenCalledWith(
        '/requirement-definitions',
        {
          display_name: 'Birth Certificate',
          description: 'NSO/PSA Birth Certificate',
          is_mandatory: true,
          is_active: false,
        }
      );
    });

    it('should invalidate requirement queries on success', async () => {
      const { wrapper, testQueryClient } = createTestWrapper();
      const invalidateQueriesSpy = vi.spyOn(
        testQueryClient,
        'invalidateQueries'
      );

      (api.post as any).mockResolvedValueOnce({
        success: true,
        data: mockCreatedRequirement,
      });

      const { result } = renderHook(() => useCreateRequirementDefinition(), {
        wrapper,
      });

      const createPayload: CreateRequirementPayload = {
        displayName: 'Birth Certificate',
        description: 'NSO/PSA Birth Certificate',
        isMandatory: true,
      };

      result.current.mutate(createPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['requirementDefinitions'],
          refetchType: 'stale',
        })
      );

      expect(invalidateQueriesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['requirementDefinitions', 'analytics'],
          refetchType: 'stale',
        })
      );

      invalidateQueriesSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should handle 403 Forbidden (admin-only) error', async () => {
      const { wrapper } = createTestWrapper();

      const error = new Error('403 Forbidden');
      (api.post as any).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCreateRequirementDefinition(), {
        wrapper,
      });

      const createPayload: CreateRequirementPayload = {
        displayName: 'Birth Certificate',
        description: 'NSO/PSA Birth Certificate',
        isMandatory: true,
      };

      result.current.mutate(createPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toContain(
        'You do not have permission to create requirements'
      );
    });

    it('should handle 409 Conflict (duplicate requirement type) error', async () => {
      const { wrapper } = createTestWrapper();

      const error = new Error('409 Conflict');
      (api.post as any).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCreateRequirementDefinition(), {
        wrapper,
      });

      const createPayload: CreateRequirementPayload = {
        displayName: 'Birth Certificate',
        description: 'NSO/PSA Birth Certificate',
        isMandatory: true,
      };

      result.current.mutate(createPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toContain(
        'A requirement with this type already exists'
      );
    });

    it('should handle 400 Bad Request (invalid payload) error', async () => {
      const { wrapper } = createTestWrapper();

      const error = new Error('400 Bad Request');
      (api.post as any).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCreateRequirementDefinition(), {
        wrapper,
      });

      const createPayload: CreateRequirementPayload = {
        displayName: 'Birth Certificate',
        description: 'NSO/PSA Birth Certificate',
        isMandatory: true,
      };

      result.current.mutate(createPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toContain('Invalid requirement data');
    });

    it('should handle generic API errors', async () => {
      const { wrapper } = createTestWrapper();

      const error = new Error('Network error');
      (api.post as any).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCreateRequirementDefinition(), {
        wrapper,
      });

      const createPayload: CreateRequirementPayload = {
        displayName: 'Birth Certificate',
        description: 'NSO/PSA Birth Certificate',
        isMandatory: true,
      };

      result.current.mutate(createPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe('Network error');
    });

    it('should not retry failed mutations', async () => {
      const { wrapper } = createTestWrapper();

      const error = new Error('API Error');
      (api.post as any).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCreateRequirementDefinition(), {
        wrapper,
      });

      const createPayload: CreateRequirementPayload = {
        displayName: 'Birth Certificate',
        description: 'NSO/PSA Birth Certificate',
        isMandatory: true,
      };

      result.current.mutate(createPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      // Should only call api.post once, not retry
      expect(api.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('Input validation', () => {
    it('should throw error if displayName is empty', async () => {
      const { wrapper } = createTestWrapper();

      (api.post as any).mockResolvedValueOnce({
        success: true,
        data: mockCreatedRequirement,
      });

      const { result } = renderHook(() => useCreateRequirementDefinition(), {
        wrapper,
      });

      const createPayload: CreateRequirementPayload = {
        displayName: '',
        description: 'NSO/PSA Birth Certificate',
        isMandatory: true,
      };

      result.current.mutate(createPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toContain('Display name is required');
      expect(api.post).not.toHaveBeenCalled();
    });

    it('should throw error if description is empty', async () => {
      const { wrapper } = createTestWrapper();

      (api.post as any).mockResolvedValueOnce({
        success: true,
        data: mockCreatedRequirement,
      });

      const { result } = renderHook(() => useCreateRequirementDefinition(), {
        wrapper,
      });

      const createPayload: CreateRequirementPayload = {
        displayName: 'Birth Certificate',
        description: '',
        isMandatory: true,
      };

      result.current.mutate(createPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toContain('Description is required');
      expect(api.post).not.toHaveBeenCalled();
    });

    it('should throw error if isMandatory is undefined', async () => {
      const { wrapper } = createTestWrapper();

      (api.post as any).mockResolvedValueOnce({
        success: true,
        data: mockCreatedRequirement,
      });

      const { result } = renderHook(() => useCreateRequirementDefinition(), {
        wrapper,
      });

      const createPayload = {
        displayName: 'Birth Certificate',
        description: 'NSO/PSA Birth Certificate',
      } as any;

      result.current.mutate(createPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toContain(
        'Is mandatory flag is required'
      );
      expect(api.post).not.toHaveBeenCalled();
    });
  });

  describe('Loading and error states', () => {
    it('should have correct initial state', () => {
      const { wrapper } = createTestWrapper();

      const { result } = renderHook(() => useCreateRequirementDefinition(), {
        wrapper,
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeUndefined();
    });

    it('should update state after successful mutation', async () => {
      const { wrapper } = createTestWrapper();

      (api.post as any).mockResolvedValueOnce({
        success: true,
        data: mockCreatedRequirement,
      });

      const { result } = renderHook(() => useCreateRequirementDefinition(), {
        wrapper,
      });

      const createPayload: CreateRequirementPayload = {
        displayName: 'Birth Certificate',
        description: 'NSO/PSA Birth Certificate',
        isMandatory: true,
      };

      result.current.mutate(createPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.data).toEqual(mockCreatedRequirement);
      expect(result.current.isError).toBe(false);
    });
  });
});
