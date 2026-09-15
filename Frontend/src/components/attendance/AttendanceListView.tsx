import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';
import { Button } from '../ui/button';
import { ChevronDown, Calendar, Clock, MapPin } from 'lucide-react';

type AttendanceStatus = 'present' | 'late' | 'absent' | 'pending';

interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  timeIn?: string;
  timeOut?: string;
  duration?: number; // in minutes
  location?: string;
  notes?: string;
}

interface AttendanceListViewProps {
  records?: AttendanceRecord[];
  filterStatus?: AttendanceStatus | 'all';
  sortBy?: 'date-asc' | 'date-desc';
  isLoading?: boolean;
}

export function AttendanceListView({
  records = [],
  filterStatus = 'all',
  sortBy = 'date-desc',
  isLoading = false,
}: AttendanceListViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // Filter records
  let filtered = records;
  if (filterStatus !== 'all') {
    filtered = filtered.filter((r) => r.status === filterStatus);
  }

  // Sort records
  filtered = [...filtered].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortBy === 'date-desc' ? dateB - dateA : dateA - dateB;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>View your attendance history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 w-full rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!filtered || filtered.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>View your attendance history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {filterStatus === 'all'
                ? 'No attendance records found.'
                : `No records found for status: ${filterStatus}`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Records</CardTitle>
        <CardDescription>View your attendance history in chronological order</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filtered.map((record) => {
            const isExpanded = expandedIds.has(record.id);
            return (
              <div
                key={record.id}
                className="rounded-lg border border-border overflow-hidden hover:border-foreground/20 transition-colors"
              >
                {/* Collapsed view */}
                <button
                  onClick={() => toggleExpanded(record.id)}
                  className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-accent text-left sm:py-4"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <AttendanceStatusBadge status={record.status} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{formatDate(record.date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.timeIn || 'No time recorded'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="border-t bg-muted/30 px-4 py-3 space-y-2 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Time In</p>
                          <p className="font-medium">{record.timeIn || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Time Out</p>
                          <p className="font-medium">{record.timeOut || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {record.duration && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="font-medium">{formatDuration(record.duration)}</p>
                        </div>
                      </div>
                    )}

                    {record.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="font-medium">{record.location}</p>
                        </div>
                      </div>
                    )}

                    {record.notes && (
                      <div className="flex items-start gap-2">
                        <div className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Notes</p>
                          <p className="font-medium">{record.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
