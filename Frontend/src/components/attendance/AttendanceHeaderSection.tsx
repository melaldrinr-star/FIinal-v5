import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';

interface AttendanceSummary {
  present: number;
  late: number;
  absent: number;
  pending: number;
}

interface AttendanceHeaderSectionProps {
  month: Date;
  onMonthChange: (date: Date) => void;
  summary: AttendanceSummary;
  onFilterClick?: () => void;
}

export function AttendanceHeaderSection({
  month,
  onMonthChange,
  summary,
}: AttendanceHeaderSectionProps) {
  const monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const total = summary.present + summary.late + summary.absent + summary.pending;

  const handlePrevMonth = () => {
    const newDate = new Date(month);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(month);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg">Attendance</CardTitle>
            <Badge variant="secondary">{total} records</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-40 text-center text-sm font-medium">{monthName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Present</p>
            <p className="text-2xl font-bold text-green-600">{summary.present}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Late</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.late}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Absent</p>
            <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-gray-600">{summary.pending}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AttendanceFilterBarProps {
  selectedStatus?: string | null;
  onStatusChange?: (status: string | null) => void;
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
}

export function AttendanceFilterBar({
  selectedStatus,
  onStatusChange,
}: AttendanceFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const statuses = [
    { value: 'present', label: 'Present' },
    { value: 'late', label: 'Late' },
    { value: 'absent', label: 'Absent' },
    { value: 'pending', label: 'Pending' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
        {selectedStatus && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange?.(null)}
            className="text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="rounded-lg border bg-card p-4">
          <div className="space-y-3">
            <p className="text-sm font-medium">Filter by Status</p>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <Button
                  key={status.value}
                  variant={selectedStatus === status.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onStatusChange?.(status.value)}
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
