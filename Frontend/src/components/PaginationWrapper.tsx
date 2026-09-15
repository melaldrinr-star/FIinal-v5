import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';

interface PaginationWrapperProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showWhenSinglePage?: boolean;
  className?: string;
  itemsCount?: number;
  itemsPerPage?: number;
}

/**
 * Standardized Pagination Component
 * 
 * Provides consistent pagination layout across all pages.
 * Shows first page, last page, current page ±1, and ellipsis for gaps.
 */
export const PaginationWrapper: React.FC<PaginationWrapperProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showWhenSinglePage = false,
  className = '',
  itemsCount,
  itemsPerPage,
}) => {
  // Don't show pagination if only 1 page (unless explicitly requested)
  if (totalPages <= 1 && !showWhenSinglePage) {
    return null;
  }

  const handlePrevious = () => {
    onPageChange(Math.max(1, currentPage - 1));
  };

  const handleNext = () => {
    onPageChange(Math.min(totalPages, currentPage + 1));
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Optional: Show item count info */}
      {itemsCount !== undefined && itemsPerPage !== undefined && (
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
          {itemsCount > 0 && ` · ${itemsCount} item${itemsCount !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Pagination Controls */}
      <Pagination>
        <PaginationContent>
          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              onClick={handlePrevious}
              className={
                currentPage === 1
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // Show first page, last page, current page, and pages adjacent to current
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => onPageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            }

            // Show ellipsis for gaps
            if (page === currentPage - 2 || page === currentPage + 2) {
              return (
                <PaginationItem key={`ellipsis-${page}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            return null;
          })}

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              onClick={handleNext}
              className={
                currentPage === totalPages
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default PaginationWrapper;
