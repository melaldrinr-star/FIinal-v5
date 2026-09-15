/**
 * RequirementDefinitionsList Component
 *
 * Displays a list of requirement definitions in a table format with:
 * - Columns: displayName, description, isMandatory, isActive, completionRate
 * - Filtering by isActive status
 * - Sorting by name, mandatory flag, completion rate
 * - Pagination with page/limit controls
 * - Submission statistics display
 * - Loading skeletons and error states
 * - Action buttons to view details, edit, or delete (soft delete)
 *
 * **Validates: Requirements 4.1, Admin requirements management components**
 *
 * Example usage:
 * ```typescript
 * import { RequirementDefinitionsList } from '@/components/RequirementDefinitionsList';
 *
 * export default function RequirementsPage() {
 *   return (
 *     <RequirementDefinitionsList
 *       onRequirementSelect={(id) => router.push(`/requirements/${id}`)}
 *     />
 *   );
 * }
 * ```
 */

import { useState, useMemo } from 'react';
import { useRequirementDefinitions } from '../hooks/useRequirementDefinitions';
import { RequirementDefinition } from '../types/requirementDefinition';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import {
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import logger from '../utils/logger';

/**
 * Props for RequirementDefinitionsList component
 */
export interface RequirementDefinitionsListProps {
  /**
   * Optional callback when a requirement is selected/clicked
   * Useful for navigation to detail page
   * @param id - The ID of the selected requirement definition
   */
  onRequirementSelect?: (id: string) => void;
}

/**
 * RequirementDefinitionsList Component
 *
 * A full-featured list component for requirement definitions management.
 * Provides table view with filtering, sorting, and pagination.
 *
 * Features:
 * - Table view with requirement details and stats
 * - Filter by active status (Active/Inactive/All)
 * - Sort by name, mandatory flag, or completion rate
 * - Pagination controls
 * - Status badges (mandatory, active)
 * - Submission stats display
 * - Loading skeletons during data fetch
 * - Error states with retry capability
 * - Action buttons for detail, edit, delete operations
 *
 * Data fetching:
 * - Uses useRequirementDefinitions hook
 * - Automatically handles tenant isolation
 * - Implements React Query caching (5-min stale time)
 * - Supports refetch on window focus
 *
 * UI/UX:
 * - Responsive table with horizontal scroll on mobile
 * - Color-coded badges for status
 * - Empty state message when no results
 * - Loading skeleton during fetch
 */
export function RequirementDefinitionsList({
  onRequirementSelect,
}: RequirementDefinitionsListProps) {
  // State for filtering and pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<'name' | 'mandatory' | 'completion_rate'>(
    'name'
  );
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>(
    'all'
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Determine isActive query parameter based on filter
  const isActiveQuery =
    activeFilter === 'all' ? undefined : activeFilter === 'active';

  // Fetch requirement definitions from API
  const { data, isLoading, isError, error, pagination, refetch } =
    useRequirementDefinitions({
      page,
      limit,
      sortBy,
      isActive: isActiveQuery,
    });

  // Filter data by search term (client-side filtering on display_name and description)
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return data;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return data.filter(
      (req) =>
        req.display_name.toLowerCase().includes(lowerSearchTerm) ||
        req.description.toLowerCase().includes(lowerSearchTerm)
    );
  }, [data, searchTerm]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    logger.info('[RequirementDefinitionsList] Page changed', { newPage });
  };

  // Handle limit change
  const handleLimitChange = (newLimit: string) => {
    const limit = parseInt(newLimit, 10);
    setLimit(limit);
    setPage(1); // Reset to first page when changing limit
    logger.info('[RequirementDefinitionsList] Limit changed', { limit });
  };

  // Handle sort change
  const handleSortChange = (newSort: string) => {
    setSortBy(newSort as 'name' | 'mandatory' | 'completion_rate');
    setPage(1); // Reset to first page when changing sort
    logger.info('[RequirementDefinitionsList] Sort changed', { sortBy: newSort });
  };

  // Handle filter change
  const handleFilterChange = (newFilter: string) => {
    setActiveFilter(newFilter as 'all' | 'active' | 'inactive');
    setPage(1); // Reset to first page when changing filter
    logger.info('[RequirementDefinitionsList] Filter changed', { filter: newFilter });
  };

  // Handle requirement selection/details view
  const handleViewDetails = (requirement: RequirementDefinition) => {
    logger.info('[RequirementDefinitionsList] View details clicked', {
      requirementId: requirement.id,
      displayName: requirement.display_name,
    });
    onRequirementSelect?.(requirement.id);
  };

  // Handle edit action (stub for integration with edit form)
  const handleEdit = (requirement: RequirementDefinition) => {
    logger.info('[RequirementDefinitionsList] Edit clicked', {
      requirementId: requirement.id,
    });
    // TODO: Navigate to edit page or open edit modal
  };

  // Handle delete action (stub for integration with delete confirmation)
  const handleDelete = (requirement: RequirementDefinition) => {
    logger.info('[RequirementDefinitionsList] Delete clicked', {
      requirementId: requirement.id,
    });
    // TODO: Show delete confirmation modal and soft delete via API
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items: React.ReactNode[] = [];
    const maxVisiblePages = 5;
    const totalPages = pagination.totalPages;

    // Always show first page
    items.push(
      <PaginationItem key="page-1">
        <PaginationLink
          onClick={() => handlePageChange(1)}
          isActive={page === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Show ellipsis if needed
    if (page > maxVisiblePages) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Show middle pages
    for (
      let i = Math.max(2, page - 2);
      i <= Math.min(totalPages - 1, page + 2);
      i++
    ) {
      items.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Show ellipsis if needed
    if (page < totalPages - maxVisiblePages) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page if total > 1
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={page === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // Loading state: show skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-muted rounded w-48"></div>
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse flex gap-4 p-4 border border-border rounded-lg"
              >
                <div className="h-12 bg-muted rounded flex-1"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state: show error message with retry button
  if (isError) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {error?.message || 'Failed to load requirement definitions'}
                </p>
              </div>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state: no requirements found
  if (filteredData.length === 0 && !searchTerm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Requirement Definitions</CardTitle>
          <CardDescription>
            Manage training requirement definitions for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">No Requirements Found</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                No requirement definitions have been created yet. Create one to get
                started.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty search results state
  if (filteredData.length === 0 && searchTerm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Requirement Definitions</CardTitle>
          <CardDescription>
            Manage training requirement definitions for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Select value={activeFilter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">No Results Found</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  No requirements match &quot;{searchTerm}&quot;. Try adjusting your search or filters.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Requirement Definitions</CardTitle>
          <CardDescription>
            Manage training requirement definitions for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters and Search */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                <Select value={activeFilter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="mandatory">Mandatory</SelectItem>
                    <SelectItem value="completion_rate">
                      Completion Rate
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Display Name</TableHead>
                    <TableHead className="w-[250px]">Description</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="text-center w-[80px]">
                      Mandatory
                    </TableHead>
                    <TableHead className="text-center w-[80px]">Active</TableHead>
                    <TableHead className="text-center w-[120px]">
                      Completion
                    </TableHead>
                    <TableHead className="text-center w-[200px]">Stats</TableHead>
                    <TableHead className="text-center w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((requirement) => (
                    <TableRow
                      key={requirement.id}
                      className="hover:bg-muted/50 cursor-pointer"
                    >
                      <TableCell className="font-semibold">
                        <button
                          onClick={() => handleViewDetails(requirement)}
                          className="hover:underline text-left"
                        >
                          {requirement.display_name}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[250px]">
                        {requirement.description}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {requirement.requirement_type}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {requirement.is_mandatory ? (
                          <Badge variant="default" className="mx-auto">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="mx-auto">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {requirement.is_active ? (
                          <Badge
                            variant="default"
                            className="mx-auto bg-green-600 hover:bg-green-700"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="mx-auto text-gray-500"
                          >
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {requirement.submission_stats ? (
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-12 h-6 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all"
                                style={{
                                  width: `${requirement.submission_stats.completion_rate}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs font-semibold">
                              {requirement.submission_stats.completion_rate}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No data
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1 text-xs">
                          {requirement.submission_stats && (
                            <>
                              <div className="flex items-center gap-0.5">
                                <Clock className="h-3 w-3 text-yellow-500" />
                                <span>{requirement.submission_stats.pending_count}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span>{requirement.submission_stats.verified_count}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                                <span>{requirement.submission_stats.rejected_count}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              ⋮
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(requirement)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(requirement)}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(requirement)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <Select value={String(limit)} onValueChange={handleLimitChange}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to{' '}
                {Math.min(page * limit, pagination.total)} of{' '}
                {pagination.total} requirements
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        pagination.hasPreviousPage && handlePageChange(page - 1)
                      }
                      className={
                        !pagination.hasPreviousPage
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                  {getPaginationItems()}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        pagination.hasNextPage && handlePageChange(page + 1)
                      }
                      className={
                        !pagination.hasNextPage
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
