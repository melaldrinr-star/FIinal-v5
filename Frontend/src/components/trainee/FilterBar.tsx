import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import React from 'react';

interface TraineeStatusFilters {
  employmentStatus?: string[];
  skillsMatch?: string[];
  graduationStatus?: string[];
  searchTerm?: string;
}

interface FilterBarProps {
  filters: TraineeStatusFilters;
  onFiltersChange: (filters: TraineeStatusFilters) => void;
  isLoading?: boolean;
}

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'employed', label: 'Employed', color: 'bg-green-100 dark:bg-green-900/30' },
  { value: 'unemployed', label: 'Unemployed', color: 'bg-gray-100 dark:bg-gray-800' },
  { value: 'self_employed', label: 'Self-Employed', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { value: 'pursuing_education', label: 'Pursuing Education', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { value: 'deceased', label: 'Deceased', color: 'bg-slate-100 dark:bg-slate-800' },
];

const SKILLS_MATCH_OPTIONS = [
  { value: 'exact_match', label: 'Exact Match', color: 'bg-green-100 dark:bg-green-900/30' },
  { value: 'partial_match', label: 'Partial Match', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { value: 'no_match', label: 'No Match', color: 'bg-gray-100 dark:bg-gray-800' },
  { value: 'not_applicable', label: 'Not Applicable', color: 'bg-blue-100 dark:bg-blue-900/30' },
];

const GRADUATION_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { value: 'graduated', label: 'Graduated', color: 'bg-green-100 dark:bg-green-900/30' },
  { value: 'not_completed', label: 'Not Completed', color: 'bg-red-100 dark:bg-red-900/30' },
  { value: 'suspended', label: 'Suspended', color: 'bg-orange-100 dark:bg-orange-900/30' },
];

/**
 * Memoized FilterOption Component
 * 
 * Renders a single checkbox option in a filter dropdown.
 * **Optimization:** Memoized to prevent re-renders of individual options
 * when parent filter state changes but this option's props remain the same.
 * This is beneficial when there are many options and filters change frequently.
 */
const MemoizedFilterOption = React.memo<{
  value: string;
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
}>(({ value, label, checked, onCheckedChange }) => (
  <DropdownMenuCheckboxItem
    checked={checked}
    onCheckedChange={onCheckedChange}
  >
    {label}
  </DropdownMenuCheckboxItem>
), (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  return (
    prevProps.value === nextProps.value &&
    prevProps.label === nextProps.label &&
    prevProps.checked === nextProps.checked
  );
});

MemoizedFilterOption.displayName = 'MemoizedFilterOption';

/**
 * Memoized SelectAll Option Component
 * 
 * Renders the "Select All / Deselect All" checkbox at the top of filter dropdowns.
 * **Optimization:** Memoized to prevent unnecessary re-renders.
 */
const MemoizedSelectAllOption = React.memo<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}>(({ checked, onCheckedChange }) => (
  <DropdownMenuCheckboxItem
    checked={checked}
    onCheckedChange={onCheckedChange}
    className="font-semibold"
  >
    All
  </DropdownMenuCheckboxItem>
), (prevProps, nextProps) => {
  return prevProps.checked === nextProps.checked;
});

MemoizedSelectAllOption.displayName = 'MemoizedSelectAllOption';

export default function FilterBar({ filters, onFiltersChange, isLoading }: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.searchTerm || '');

  /**
   * Memoized callback for handling search changes.
   * useCallback prevents function recreation on each render, enabling
   * child components using this callback to properly memoize.
   */
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    onFiltersChange({ ...filters, searchTerm: value || undefined });
  }, [filters, onFiltersChange]);

  /**
   * Memoized callback for toggling employment status filter.
   * Prevents unnecessary re-creation when parent component re-renders.
   */
  const toggleEmploymentStatus = useCallback((status: string) => {
    const current = filters.employmentStatus || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    onFiltersChange({ ...filters, employmentStatus: updated.length > 0 ? updated : undefined });
  }, [filters, onFiltersChange]);

  /**
   * Memoized callback for toggling skills match filter.
   */
  const toggleSkillsMatch = useCallback((match: string) => {
    const current = filters.skillsMatch || [];
    const updated = current.includes(match)
      ? current.filter(m => m !== match)
      : [...current, match];
    onFiltersChange({ ...filters, skillsMatch: updated.length > 0 ? updated : undefined });
  }, [filters, onFiltersChange]);

  /**
   * Memoized callback for toggling graduation status filter.
   */
  const toggleGraduationStatus = useCallback((status: string) => {
    const current = filters.graduationStatus || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    onFiltersChange({ ...filters, graduationStatus: updated.length > 0 ? updated : undefined });
  }, [filters, onFiltersChange]);

  /**
   * Memoized callback for clearing all filters.
   */
  const clearAllFilters = useCallback(() => {
    setSearchInput('');
    onFiltersChange({});
  }, [onFiltersChange]);

  /**
   * Memoized computation of active filter count.
   * useMemo prevents recalculation when filters object hasn't changed.
   */
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.employmentStatus?.length) count += filters.employmentStatus.length;
    if (filters.skillsMatch?.length) count += filters.skillsMatch.length;
    if (filters.graduationStatus?.length) count += filters.graduationStatus.length;
    if (filters.searchTerm) count += 1;
    return count;
  }, [filters.employmentStatus, filters.skillsMatch, filters.graduationStatus, filters.searchTerm]);

  const hasActiveFilters = activeCount > 0;

  const getLabelForValue = useCallback((value: string, options: typeof EMPLOYMENT_STATUS_OPTIONS) => {
    return options.find(o => o.value === value)?.label || value;
  }, []);

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Search and Filter Row */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search Box */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, job title..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10"
                disabled={isLoading}
              />
              {searchInput && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  disabled={isLoading}
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
              {/* Employment Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="gap-2"
                    disabled={isLoading}
                  >
                    <span>Employment</span>
                    {filters.employmentStatus?.length ? (
                      <Badge variant="secondary" className="ml-1 px-1.5 h-5 text-xs">
                        {filters.employmentStatus.length}
                      </Badge>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Employment Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Select All / Deselect All */}
                  <MemoizedSelectAllOption
                    checked={
                      filters.employmentStatus?.length === EMPLOYMENT_STATUS_OPTIONS.length
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onFiltersChange({
                          ...filters,
                          employmentStatus: EMPLOYMENT_STATUS_OPTIONS.map(o => o.value),
                        });
                      } else {
                        onFiltersChange({
                          ...filters,
                          employmentStatus: undefined,
                        });
                      }
                    }}
                  />

                  <DropdownMenuSeparator />

                  {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
                    <MemoizedFilterOption
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      checked={filters.employmentStatus?.includes(option.value) || false}
                      onCheckedChange={() => toggleEmploymentStatus(option.value)}
                    />
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Skills Match Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="gap-2"
                    disabled={isLoading}
                  >
                    <span>Skills Match</span>
                    {filters.skillsMatch?.length ? (
                      <Badge variant="secondary" className="ml-1 px-1.5 h-5 text-xs">
                        {filters.skillsMatch.length}
                      </Badge>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Skills Match</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Select All / Deselect All */}
                  <MemoizedSelectAllOption
                    checked={filters.skillsMatch?.length === SKILLS_MATCH_OPTIONS.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onFiltersChange({
                          ...filters,
                          skillsMatch: SKILLS_MATCH_OPTIONS.map(o => o.value),
                        });
                      } else {
                        onFiltersChange({
                          ...filters,
                          skillsMatch: undefined,
                        });
                      }
                    }}
                  />

                  <DropdownMenuSeparator />

                  {SKILLS_MATCH_OPTIONS.map((option) => (
                    <MemoizedFilterOption
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      checked={filters.skillsMatch?.includes(option.value) || false}
                      onCheckedChange={() => toggleSkillsMatch(option.value)}
                    />
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Graduation Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="gap-2"
                    disabled={isLoading}
                  >
                    <span>Graduation</span>
                    {filters.graduationStatus?.length ? (
                      <Badge variant="secondary" className="ml-1 px-1.5 h-5 text-xs">
                        {filters.graduationStatus.length}
                      </Badge>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Graduation Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Select All / Deselect All */}
                  <MemoizedSelectAllOption
                    checked={
                      filters.graduationStatus?.length === GRADUATION_STATUS_OPTIONS.length
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onFiltersChange({
                          ...filters,
                          graduationStatus: GRADUATION_STATUS_OPTIONS.map(o => o.value),
                        });
                      } else {
                        onFiltersChange({
                          ...filters,
                          graduationStatus: undefined,
                        });
                      }
                    }}
                  />

                  <DropdownMenuSeparator />

                  {GRADUATION_STATUS_OPTIONS.map((option) => (
                    <MemoizedFilterOption
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      checked={filters.graduationStatus?.includes(option.value) || false}
                      onCheckedChange={() => toggleGraduationStatus(option.value)}
                    />
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear All Button */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="default"
                  onClick={clearAllFilters}
                  disabled={isLoading}
                  className="gap-2"
                  title={`Clear all ${activeCount} filter${activeCount !== 1 ? 's' : ''}`}
                >
                  <X className="size-4" />
                  <span className="hidden sm:inline">Clear All</span>
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {/* Employment Status Tags */}
              {filters.employmentStatus?.map((status) => (
                <Badge
                  key={`emp-${status}`}
                  variant="secondary"
                  className="gap-2 pl-2 pr-1 flex items-center"
                >
                  <span>{getLabelForValue(status, EMPLOYMENT_STATUS_OPTIONS)}</span>
                  <button
                    onClick={() => toggleEmploymentStatus(status)}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors"
                    disabled={isLoading}
                    aria-label={`Remove ${status} filter`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}

              {/* Skills Match Tags */}
              {filters.skillsMatch?.map((match) => (
                <Badge
                  key={`skill-${match}`}
                  variant="outline"
                  className="gap-2 pl-2 pr-1 flex items-center"
                >
                  <span>{getLabelForValue(match, SKILLS_MATCH_OPTIONS)}</span>
                  <button
                    onClick={() => toggleSkillsMatch(match)}
                    className="ml-1 hover:bg-muted p-0.5 transition-colors"
                    disabled={isLoading}
                    aria-label={`Remove ${match} filter`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}

              {/* Graduation Status Tags */}
              {filters.graduationStatus?.map((status) => (
                <Badge
                  key={`grad-${status}`}
                  variant="outline"
                  className="gap-2 pl-2 pr-1 flex items-center"
                >
                  <span>{getLabelForValue(status, GRADUATION_STATUS_OPTIONS)}</span>
                  <button
                    onClick={() => toggleGraduationStatus(status)}
                    className="ml-1 hover:bg-muted p-0.5 transition-colors"
                    disabled={isLoading}
                    aria-label={`Remove ${status} filter`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}

              {/* Search Term Tag */}
              {filters.searchTerm && (
                <Badge
                  key="search"
                  variant="outline"
                  className="gap-2 pl-2 pr-1 flex items-center"
                >
                  <span className="truncate max-w-xs">Search: "{filters.searchTerm}"</span>
                  <button
                    onClick={() => handleSearchChange('')}
                    className="ml-1 hover:bg-muted p-0.5 transition-colors"
                    disabled={isLoading}
                    aria-label="Remove search filter"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Info text for mobile */}
          <p className="text-xs text-muted-foreground lg:hidden">
            {activeCount > 0 ? `${activeCount} filter${activeCount !== 1 ? 's' : ''} applied` : 'No filters applied'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
