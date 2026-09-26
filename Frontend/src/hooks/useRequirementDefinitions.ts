import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import logger from '../utils/logger';
import type {
  RequirementDefinition,
  RequirementDefinitionsResponse,
  UseRequirementDefinitionsOptions,
  UseRequirementDefinitionsResult,
  PaginationInfo,
} from '../types/requirementDefinition';

function buildQueryString(options: UseRequirementDefinitionsOptions): string {
  const params = new URLSearchParams();
  if (options.sortBy) params.append('sort_by', options.sortBy);
  if (options.isActive !== undefined) params.append('is_active', options.isActive ? 'true' : 'false');
  if (options.page !== undefined) params.append('page', String(options.page));
  if (options.limit !== undefined) params.append('limit', String(options.limit));
  return params.toString();
}

export function useRequirementDefinitions(
  options: UseRequirementDefinitionsOptions = {}
): UseRequirementDefinitionsResult {
  const { enabled = true, ...queryOptions } = options;
  const queryString = buildQueryString(queryOptions);
  const [data, setData] = useState<RequirementDefinition[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: queryOptions.page || 1,
    limit: queryOptions.limit || 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const url = `/requirement-definitions${queryString ? `?${queryString}` : ''}`;

    try {
      logger.info('[useRequirementDefinitions] Fetching from API', { url, options: queryOptions });
      const response = await api.get<RequirementDefinitionsResponse>(url);
      const definitions = response.data;
      const responsePagination = response.pagination || {};
      setData(definitions);
      setPagination({
        page: responsePagination.page || queryOptions.page || 1,
        limit: responsePagination.limit || queryOptions.limit || 20,
        total: responsePagination.total || definitions.length,
        totalPages: responsePagination.totalPages || 1,
        hasNextPage: (responsePagination.totalPages || 1) > (responsePagination.page || queryOptions.page || 1),
        hasPreviousPage: (responsePagination.page || queryOptions.page || 1) > 1,
      });
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Failed to load requirement definitions');
      logger.error('[useRequirementDefinitions] Fetch failed', { error: fetchError.message, options: queryOptions });
      setError(fetchError);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, queryString, queryOptions.page, queryOptions.limit, queryOptions.sortBy, queryOptions.isActive]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    data,
    isLoading,
    isError: error !== null,
    error,
    pagination,
    refetch,
  };
}
