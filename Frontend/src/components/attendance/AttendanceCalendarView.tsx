import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AttendanceStatusDot } from './AttendanceStatusBadge';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type AttendanceStatus = 'present' | 'late' | 'absent' | 'pending';

interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  timeIn?: string;
  timeOut?: string;
  duration?: number;
  location?: string;
}

interface AttendanceCalendarViewProps {
  records?: AttendanceRecord[];
  onDateClick?: (date: string) => void;
  isLoading?: boolean;
}

export function AttendanceCalendarView({
  records = [],
  onDateClick,
  isLoading = false,
}: AttendanceCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const recordsByDate = new Map<string, AttendanceRecord>();
  records.forEach((record) => {
    recordsByDate.set(record.date, record);
  });

  const days = [];
  const firstDay = firstDayOfMonth(currentDate);
  const totalDays = daysInMonth(currentDate);

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    days.push({
      day,
      date: dateStr,
      record: recordsByDate.get(dateStr),
    });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Hide on mobile by default
  return (
    <div className="hidden lg:block">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Click dates to view details</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-40 text-center">{monthYear}</span>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 w-full rounded bg-muted" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <div
                    key={index}
                    className={`aspect-square flex items-center justify-center rounded border text-xs ${
                      day
                        ? 'cursor-pointer hover:bg-accent border-border'
                        : 'border-transparent bg-muted/30'
                    }`}
                    onClick={() => day && day.record && onDateClick?.(day.date)}
                  >
                    {day ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">{day.day}</span>
                        {day.record && (
                          <AttendanceStatusDot status={day.record.status} />
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="border-t pt-3 mt-4">
                <p className="text-xs font-semibold mb-2 text-muted-foreground">Status Legend:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <AttendanceStatusDot status="present" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AttendanceStatusDot status="late" />
                    <span>Late</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AttendanceStatusDot status="absent" />
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AttendanceStatusDot status="pending" />
                    <span>Pending</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
