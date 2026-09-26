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
import { useNavigate } from 'react-router-dom';
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
import { toast } from 'sonner';
import { useUpdateRequirementDefinition } from '../hooks/useUpdateRequirementDefinition';
import {
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  Filter,
  MoreHorizontal,
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
  const [sortBy, setSortBy] = useState<'name' | 'mandatory'>('name');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>(
    'all'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { mutateAsync: updateRequirement } = useUpdateRequirementDefinition();

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
    setSortBy(newSort as 'name' | 'mandatory');
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
    navigate(`/admin/requirements/${requirement.id}/edit`);
  };

  // Handle delete action (stub for integration with delete confirmation)
  const handleDelete = (requirement: RequirementDefinition) => {
    logger.info('[RequirementDefinitionsList] Delete clicked', {
      requirementId: requirement.id,
    });
    void (async () => {
      if (!window.confirm(`Delete "${requirement.display_name}"?`)) return;

      try {
        await updateRequirement(requirement.id, { isActive: false });
        toast.success('Requirement deleted successfully');
        await refetch();
      } catch (error) {
        logger.error('[RequirementDefinitionsList] Delete failed', { error });
        toast.error('Failed to delete requirement');
      }
    })();
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block rounded-lg border overflow-x-auto">
              <Table className="min-w-[900px] xl:min-w-0 xl:table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Display Name</TableHead>
                    <TableHead className="w-[250px]">Description</TableHead>
                    <TableHead className="hidden w-[100px] xl:table-cell">Type</TableHead>
                    <TableHead className="text-center w-[80px]">
                      Mandatory
                    </TableHead>
                    <TableHead className="text-center w-[80px]">Active</TableHead>
                    <TableHead className="text-center w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((requirement) => (
                    <TableRow
                      key={requirement.id}
                      className="hover:bg-muted/50 cursor-pointer"
                    >
                      <TableCell className="max-w-[200px] font-semibold">
                        <button
                          onClick={() => handleViewDetails(requirement)}
                          className="block max-w-full truncate text-left hover:underline"
                        >
                          {requirement.display_name}
                        </button>
                      </TableCell>
                      <TableCell className="max-w-[250px] whitespace-normal break-words text-sm text-muted-foreground">
                        {requirement.description}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Actions for ${requirement.display_name}`}>
                              <MoreHorizontal className="h-4 w-4" />
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

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {filteredData.map((requirement) => (
                <article key={requirement.id} className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => handleViewDetails(requirement)}
                      className="min-w-0 text-left font-semibold leading-tight hover:underline"
                    >
                      <span className="break-words">{requirement.display_name}</span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${requirement.display_name}`}
                          className="-mr-2 -mt-2 shrink-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(requirement)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(requirement)}>
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
                  </div>

                  <p className="mt-2 break-words text-sm leading-5 text-muted-foreground">
                    {requirement.description}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="mt-1 break-words font-medium">{requirement.requirement_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant={requirement.is_mandatory ? 'default' : 'outline'}>
                          {requirement.is_mandatory ? 'Mandatory' : 'Optional'}
                        </Badge>
                        <Badge
                          variant={requirement.is_active ? 'default' : 'outline'}
                          className={requirement.is_active ? 'bg-green-600 hover:bg-green-700' : 'text-gray-500'}
                        >
                          {requirement.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                </article>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
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

              <div className="text-center text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to{' '}
                {Math.min(page * limit, pagination.total)} of{' '}
                {pagination.total} requirements
              </div>

              <Pagination>
                <PaginationContent className="flex-wrap justify-center">
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
