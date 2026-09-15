import { useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { TraineeStatusTable } from '../components/trainee/TraineeStatusTable';
import TraineeStatusModal from '../components/TraineeStatusModal';
import { useTraineeStatuses, useResetPaginationOnFilterChange } from '../hooks/useTraineeStatuses';
import type { TraineeStatusRecord, TraineeStatusFilters, TraineeStatusSort } from '../types/traineeStatus';
import { logger } from '../utils/logger';
import { toast } from 'sonner';

/**
 * TraineeStatusTablePage Component
 * 
 * Displays trainee status records in a table view for bulk analysis.
 * Supports filtering by employment status, skills match, and graduation status.
 * Supports sorting on all columns.
 * Includes pagination with configurable limit.
 * 
 * **Validates: Requirement 3.0**
 */
export default function TraineeStatusTablePage() {
  // State for filters, sort, and pagination
  const [filters, setFilters] = useState<TraineeStatusFilters>({});
  const [sort, setSort] = useState<TraineeStatusSort>({ column: 'recorded_at', direction: 'desc' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  // Modal state
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<TraineeStatusRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch trainee statuses with current filters, sort, and pagination
  const { records, isLoading, error, pagination: serverPagination, refetch } = useTraineeStatuses(
    filters,
    sort,
    pagination
  );

  // Reset pagination to page 1 when filters or sort changes
  useResetPaginationOnFilterChange(filters, sort, () => {
    setPagination({ ...pagination, page: 1 });
  });

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: TraineeStatusFilters) => {
    logger.info('[TraineeStatusTablePage] Filters changed', { newFilters });
    setFilters(newFilters);
  }, []);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: TraineeStatusSort) => {
    logger.info('[TraineeStatusTablePage] Sort changed', { newSort });
    setSort(newSort);
  }, []);

  // Handle page changes
  const handlePageChange = useCallback((newPage: number) => {
    logger.info('[TraineeStatusTablePage] Page changed', { newPage });
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  // Handle limit changes
  const handleLimitChange = useCallback((newLimit: number) => {
    logger.info('[TraineeStatusTablePage] Limit changed', { newLimit });
    setPagination({ page: 1, limit: newLimit });
  }, []);

  // Handle view record (open modal)
  const handleViewRecord = useCallback((recordId: string) => {
    const record = records.find(r => r.id === recordId);
    if (record) {
      setSelectedRecordId(recordId);
      setSelectedRecord(record);
      setIsModalOpen(true);
      logger.info('[TraineeStatusTablePage] Opened modal for record', { recordId });
    } else {
      logger.warn('[TraineeStatusTablePage] Record not found', { recordId });
      toast.error('Record not found');
    }
  }, [records]);

  // Handle modal close
  const handleModalClose = useCallback((open: boolean) => {
    if (!open) {
      setIsModalOpen(false);
      setSelectedRecordId(null);
      setSelectedRecord(null);
      // Refetch records to get updated data
      refetch();
      logger.info('[TraineeStatusTablePage] Closed modal and refetched records');
    }
  }, [refetch]);

  // Handle status saved in modal
  const handleStatusSaved = useCallback(() => {
    setIsModalOpen(false);
    setSelectedRecordId(null);
    setSelectedRecord(null);
    // Refetch records to refresh table with updated data
    refetch();
    logger.info('[TraineeStatusTablePage] Status saved, refetching records');
  }, [refetch]);

  return (
    <DashboardLayout title="Trainee Status Analysis">
      <main className="w-full max-w-full">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Trainee Status Analysis</h1>
            <p className="text-muted-foreground">
              View and analyze post-graduation outcomes for all trainees
            </p>
          </div>

          {/* Status Table */}
          <TraineeStatusTable
            records={records}
            isLoading={isLoading}
            error={error?.message}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            sort={sort}
            onSortChange={handleSortChange}
            pagination={serverPagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onViewRecord={handleViewRecord}
          />
        </div>
      </main>

      {/* Status Modal for editing selected record */}
      {selectedRecord && (
        <TraineeStatusModal
          open={isModalOpen}
          onOpenChange={handleModalClose}
          recordId={selectedRecord.id}
          enrollmentId={selectedRecord.enrollment_id}
          traineeId={selectedRecord.trainee_id}
          traineeName={`${selectedRecord.trainee?.first_name || ''} ${selectedRecord.trainee?.last_name || ''}`.trim()}
          existingStatus={selectedRecord}
          onStatusCreated={handleStatusSaved}
        />
      )}
    </DashboardLayout>
  );
}
