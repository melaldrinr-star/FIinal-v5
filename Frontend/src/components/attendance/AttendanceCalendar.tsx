/**
 * AttendanceCalendar
 *
 * Custom 7-column monthly grid with:
 *   - 9 color-coded status types (all include icon + text, never color alone)
 *   - Today's cell highlighted with a ring; shows Take Attendance / Completed button
 *   - Past completed cells are clickable (onDateClick)
 *   - Future cells are non-interactive
 *   - Hover tooltip on completed cells (Time In, Time Out, Status, Late Duration)
 *   - Month navigation (next disabled at current month)
 *   - adminMode prop: shows completion ratio per cell instead of Take Attendance
 *   - ADAPTIVE (not responsive): detects device size once and scales accordingly
 *   - Mobile: optimized touch targets, larger text, compact spacing
 *   - Desktop: full header text, compact grid
 */
import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type {
  CalendarDayData,
  CalendarDayStatus,
  AttendanceWindowStatus,
} from '../../services/attendanceService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AttendanceCalendarProps {
  calendarData: CalendarDayData[];
  windowStatus: AttendanceWindowStatus | null;
  onTakeAttendance: () => void;
  onDateClick: (date: string) => void;
  month: Date;
  onMonthChange: (month: Date) => void;
  /** Admin mode: show completion ratio per cell, hide Take Attendance button */
  adminMode?: boolean;
  /** For adminMode: total enrolled trainees per day to show X/total */
  totalEnrolled?: number;
}

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------

interface StatusConfig {
  bg: string;
  text: string;
  border: string;
  icon: string;
  label: string;
}

const STATUS_CONFIG: Record<CalendarDayStatus, StatusConfig> = {
  present: {
    bg:     'bg-green-100 dark:bg-green-900/30',
    text:   'text-green-800 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    icon:   '✔',
    label:  'Present',
  },
  late: {
    bg:     'bg-orange-100 dark:bg-orange-900/30',
    text:   'text-orange-800 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    icon:   '⏰',
    label:  'Late',
  },
  absent: {
    bg:     'bg-red-100 dark:bg-red-900/30',
    text:   'text-red-800 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    icon:   '✖',
    label:  'Absent',
  },
  pending: {
    bg:     'bg-blue-100 dark:bg-blue-900/30',
    text:   'text-blue-800 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon:   '⏳',
    label:  'Pending',
  },
  excused: {
    bg:     'bg-purple-100 dark:bg-purple-900/30',
    text:   'text-purple-800 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    icon:   '📄',
    label:  'Excused',
  },
  holiday: {
    bg:     'bg-yellow-100 dark:bg-yellow-900/30',
    text:   'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon:   '★',
    label:  'Holiday',
  },
  weekend: {
    bg:     'bg-gray-100 dark:bg-gray-800/50',
    text:   'text-gray-500 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
    icon:   '📅',
    label:  'Weekend',
  },
  future: {
    bg:     'bg-muted/40',
    text:   'text-muted-foreground/50',
    border: 'border-transparent',
    icon:   '',
    label:  '',
  },
  no_session: {
    bg:     'bg-muted/20',
    text:   'text-muted-foreground/40',
    border: 'border-transparent',
    icon:   '',
    label:  '',
  },
};

const CLICKABLE_STATUSES: CalendarDayStatus[] = [
  'present', 'late', 'absent', 'excused', 'pending',
];

// ---------------------------------------------------------------------------
// Device detection (adaptive, not responsive)
// ---------------------------------------------------------------------------

type DeviceSize = 'mobile' | 'tablet' | 'desktop';

function detectDeviceSize(): DeviceSize {
  // Detect once based on current viewport and never change
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

interface AdaptiveStyles {
  cellMinHeight: string;
  cellPadding: string;
  headerPadding: string;
  textSize: 'xs' | 'sm' | 'base';
  dateSize: string;
  labelSize: string;
  buttonSize: 'xs' | 'sm';
  headerText: boolean; // show full day names vs single letter
}

function getAdaptiveStyles(device: DeviceSize): AdaptiveStyles {
  switch (device) {
    case 'mobile':
      return {
        cellMinHeight: '72px', // h-18
        cellPadding: '0.5rem',
        headerPadding: '0.5rem',
        textSize: 'xs',
        dateSize: '16px',
        labelSize: '9px',
        buttonSize: 'xs',
        headerText: false, // single letter
      };
    case 'tablet':
      return {
        cellMinHeight: '100px',
        cellPadding: '0.75rem',
        headerPadding: '0.75rem',
        textSize: 'sm',
        dateSize: '24px',
        labelSize: '12px',
        buttonSize: 'sm',
        headerText: true, // full names
      };
    case 'desktop':
      return {
        cellMinHeight: '112px',
        cellPadding: '0.75rem',
        headerPadding: '0.75rem',
        textSize: 'sm',
        dateSize: '28px',
        labelSize: '12px',
        buttonSize: 'sm',
        headerText: true, // full names
      };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], {
    hour:   '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return '—';
  return `${minutes} min`;
}

const DAY_HEADERS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_HEADERS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Returns YYYY-MM-DD for a given Date object */
function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

/** Today as YYYY-MM-DD */
function todayStr(): string {
  return toDateString(new Date());
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AttendanceCalendar({
  calendarData,
  windowStatus,
  onTakeAttendance,
  onDateClick,
  month,
  onMonthChange,
  adminMode = false,
  totalEnrolled,
}: AttendanceCalendarProps) {
  // Detect device size once on mount - stays fixed for this render
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop');
  const adaptiveStyles = useMemo(() => getAdaptiveStyles(deviceSize), [deviceSize]);

  useEffect(() => {
    // Set device size on mount only
    setDeviceSize(detectDeviceSize());
  }, []);

  // Force re-render at midnight to update "today"
  const [, setMidnightTrigger] = useState(0);
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    const timeout = setTimeout(() => {
      setMidnightTrigger(prev => prev + 1);
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  const today = todayStr();
  const currentMonthDate = new Date();
  currentMonthDate.setDate(1);
  currentMonthDate.setHours(0, 0, 0, 0);

  const displayMonthDate = new Date(month);
  displayMonthDate.setDate(1);
  displayMonthDate.setHours(0, 0, 0, 0);

  const isCurrentMonth =
    displayMonthDate.getFullYear() === currentMonthDate.getFullYear() &&
    displayMonthDate.getMonth() === currentMonthDate.getMonth();

  // Build a map of date → CalendarDayData for fast lookup
  const dataMap = useMemo(() => {
    const m = new Map<string, CalendarDayData>();
    for (const d of calendarData) m.set(d.date, d);
    
    console.log('[AttendanceCalendar] Calendar data map created:', {
      totalDays: calendarData.length,
      dates: calendarData.slice(0, 10).map(d => ({ date: d.date, status: d.status })),
      sample: calendarData.length > 10 ? '... and ' + (calendarData.length - 10) + ' more' : '',
    });
    
    return m;
  }, [calendarData]);

  // Build the full calendar grid (including padding days from prev/next month)
  const { gridDays, monthLabel } = useMemo(() => {
    const year  = month.getFullYear();
    const mon   = month.getMonth();
    const label = month.toLocaleString('default', { month: 'long', year: 'numeric' });

    const firstDay  = new Date(year, mon, 1).getDay();  // 0=Sun
    const daysInMon = new Date(year, mon + 1, 0).getDate();

    const days: Array<{ date: string | null; day: number | null }> = [];

    // Padding before first day
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, day: null });
    }
    // Actual days
    for (let d = 1; d <= daysInMon; d++) {
      const dateStr = `${year}-${String(mon + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d });
    }
    // Padding after last day to complete last row
    while (days.length % 7 !== 0) {
      days.push({ date: null, day: null });
    }

    return { gridDays: days, monthLabel: label };
  }, [month]);

  // Check today's submission state for the Take Attendance / Completed logic
  const todayData = dataMap.get(today);
  const morningDone    = todayData?.record?.morning_status === 'present' ||
                         todayData?.record?.morning_status === 'late';
  const afternoonDone  = todayData?.record?.afternoon_status === 'present' ||
                         todayData?.record?.afternoon_status === 'late';
  const bothDone       = morningDone && afternoonDone;
  const currentSession = windowStatus?.session_label;

  const sessionDone =
    (currentSession === 'morning' && morningDone) ||
    (currentSession === 'afternoon' && afternoonDone);

  function handlePrevMonth() {
    const d = new Date(month);
    d.setMonth(d.getMonth() - 1);
    onMonthChange(d);
  }

  function handleNextMonth() {
    if (isCurrentMonth) return;
    const d = new Date(month);
    d.setMonth(d.getMonth() + 1);
    onMonthChange(d);
  }

  // Get status color and label
  function getStatusDisplay(status: CalendarDayStatus): { bg: string; text: string; label: string } {
    switch (status) {
      case 'present':
        return { bg: 'bg-green-500', text: 'text-white', label: 'PRESENT' };
      case 'late':
        return { bg: 'bg-orange-500', text: 'text-white', label: 'LATE' };
      case 'absent':
        return { bg: 'bg-red-500', text: 'text-white', label: 'ABSENT' };
      case 'excused':
        return { bg: 'bg-blue-500', text: 'text-white', label: 'EXCUSED' };
      case 'pending':
        return { bg: 'bg-gray-400 dark:bg-gray-600', text: 'text-white', label: 'PENDING' };
      case 'holiday':
        return { bg: 'bg-yellow-500', text: 'text-white', label: 'HOLIDAY' };
      case 'weekend':
        return { bg: 'bg-gray-200 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: 'WEEKEND' };
      default:
        return { bg: 'bg-white dark:bg-slate-900', text: 'text-gray-900 dark:text-gray-200', label: '' };
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="select-none space-y-3 sm:space-y-4">

        {/* ── Title Section: Course Name ── */}
        <div className="px-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">{monthLabel}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Attendance Calendar</p>
        </div>

        {/* ── Month Navigation ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-200">
            {isCurrentMonth ? '📅 Current Month' : '📋 Past Records'}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="gap-1 flex-1 sm:flex-none"
            >
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline text-xs">Prev</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              aria-label="Next month"
              className="gap-1 flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline text-xs">Next</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* ── Day-of-week headers (adaptive) ── */}
        <div className="sticky lg:top-16 z-10 grid gap-0 border border-gray-300 rounded-t-lg overflow-x-auto bg-background" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAY_HEADERS_FULL.map((day, i) => {
            // Calculate dominant status color for this day of week across the month
            const dayStatuses = gridDays
              .filter((cell, idx) => idx % 7 === i && cell.date && cell.day !== null)
              .map((cell) => {
                const dayData = dataMap.get(cell.date!);
                return dayData?.status ?? 'no_session';
              });
            
            // Get the most significant status (present > absent > late > excused > pending)
            let headerBg = 'bg-gray-100 dark:bg-gray-800';
            if (dayStatuses.some(s => s === 'absent')) {
              headerBg = 'bg-red-100 dark:bg-red-900/30';
            } else if (dayStatuses.some(s => s === 'present')) {
              headerBg = 'bg-green-100 dark:bg-green-900/30';
            } else if (dayStatuses.some(s => s === 'late')) {
              headerBg = 'bg-orange-100 dark:bg-orange-900/30';
            } else if (dayStatuses.some(s => s === 'excused')) {
              headerBg = 'bg-blue-100 dark:bg-blue-900/30';
            } else if (dayStatuses.some(s => s === 'pending')) {
              headerBg = 'bg-gray-200 dark:bg-gray-700/30';
            }

            return (
              <div
                key={day}
                className={`text-center font-bold text-foreground border-gray-300 dark:border-gray-700 ${
                  i < 6 ? 'border-r' : ''
                } ${headerBg}`}
                style={{
                  padding: adaptiveStyles.headerPadding,
                  fontSize: `max(${adaptiveStyles.headerText ? '12px' : '10px'}, ${adaptiveStyles.headerText ? '1em' : '0.75em'})`,
                  minHeight: deviceSize === 'mobile' ? '32px' : '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {adaptiveStyles.headerText ? day : day.charAt(0)}
              </div>
            );
          })}
        </div>

        {/* ── Calendar grid (adaptive) ── */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 border border-t-0 border-gray-300 dark:border-gray-700 rounded-b-lg" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minWidth: deviceSize === 'mobile' ? '100%' : 'auto' }}>
          {gridDays.map((cell, idx) => {
            const col = idx % 7;
            const isLastCol = col === 6;
            const isLastRow = idx >= gridDays.length - 7;

            if (!cell.date || cell.day === null) {
              return (
                <div
                  key={`pad-${idx}`}
                  className={`bg-gray-50 dark:bg-gray-900 flex items-center justify-center ${
                    !isLastCol ? 'border-r' : ''
                  } ${!isLastRow ? 'border-b' : ''} border-gray-300 dark:border-gray-700`}
                  style={{ minHeight: adaptiveStyles.cellMinHeight }}
                />
              );
            }

            const dateStr  = cell.date;
            const dayData  = dataMap.get(dateStr);
            const status   = dayData?.status ?? 'no_session';
            const display  = getStatusDisplay(status);
            const isToday  = dateStr === today;
            // Allow clicking on any date that has attendance data (any valid status) OR any date in the past
            // This allows trainees to view details even if no session is scheduled
            const isPastDate = dateStr < today;
            const isClickable = CLICKABLE_STATUSES.includes(status) || isPastDate;

            // Build background color with inline styles - darker for dark mode
            const bgColor = (() => {
              const isDarkMode = document.documentElement.classList.contains('dark');
              
              switch (status) {
                case 'present':
                  return isDarkMode ? '#059669' : '#22c55e';
                case 'absent':
                  return isDarkMode ? '#dc2626' : '#ef4444';
                case 'late':
                  return isDarkMode ? '#d97706' : '#f97316';
                case 'excused':
                  return isDarkMode ? '#2563eb' : '#3b82f6';
                case 'pending':
                  return isDarkMode ? '#6b7280' : '#9ca3af';
                case 'holiday':
                  return isDarkMode ? '#ca8a04' : '#eab308';
                case 'weekend':
                  return isDarkMode ? '#374151' : 'rgb(229 231 235)';
                default:
                  return isDarkMode ? '#1f2937' : 'white';
              }
            })();

            // Build text color based on background
            const textColor = (() => {
              if (['present', 'absent', 'late', 'excused', 'pending', 'holiday'].includes(status)) {
                return '#ffffff';
              } else if (status === 'weekend') {
                return document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937';
              } else {
                return document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827';
              }
            })();

            // Ensure label is always visible with high contrast
            const labelColor = (() => {
              if (['present', 'absent', 'late', 'excused'].includes(status)) {
                return '#ffffff';
              } else if (status === 'pending') {
                return '#ffffff';
              } else if (status === 'holiday') {
                return '#000000';
              }
              return '#ffffff';
            })();

            const availableForAttendance = isToday && windowStatus?.isOpen && !sessionDone;

            return (
              <Tooltip key={dateStr}>
                <TooltipTrigger asChild>
                  {availableForAttendance ? (
                    // When available for attendance, entire cell is a button
                    <button
                      onClick={(e) => { e.stopPropagation(); onTakeAttendance(); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onTakeAttendance();
                        }
                      }}
                      aria-label={`Take attendance for ${dateStr}`}
                      className={`flex flex-col items-start justify-start transition-all ${
                        !isLastCol ? 'border-r' : ''
                      } ${!isLastRow ? 'border-b' : ''} border-gray-300 dark:border-gray-700 ring-inset ring-2 ring-blue-500 cursor-pointer hover:opacity-90 active:opacity-75 w-full h-full`}
                      style={{
                        backgroundColor: bgColor,
                        padding: adaptiveStyles.cellPadding,
                        minHeight: adaptiveStyles.cellMinHeight,
                        WebkitUserSelect: 'none',
                        userSelect: 'none',
                        pointerEvents: 'auto',
                      }}
                    >
                      {/* Date number */}
                      <span
                        className="font-bold"
                        style={{
                          fontSize: adaptiveStyles.dateSize,
                          color: textColor,
                        }}
                      >
                        {cell.day}
                      </span>

                      {/* Status label */}
                      {status !== 'no_session' && status !== 'weekend' && (
                        <span
                          style={{
                            fontSize: adaptiveStyles.labelSize,
                            color: labelColor,
                            fontWeight: 'bold',
                            marginTop: adaptiveStyles.cellPadding === '0.5rem' ? '0.25rem' : '0.5rem',
                          }}
                        >
                          {display.label}
                        </span>
                      )}

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* "Punch" indicator for entire button cell */}
                      <span
                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 w-full text-center"
                        style={{
                          fontSize: adaptiveStyles.buttonSize === 'xs' ? '10px' : '14px',
                        }}
                      >
                        Punch
                      </span>
                    </button>
                  ) : (
                    // Regular non-attendance-capturing cell
                    <div
                      role={isClickable ? 'button' : undefined}
                      tabIndex={isClickable ? 0 : undefined}
                      aria-label={`${dateStr}${display.label ? `: ${display.label}` : ''}`}
                      onClick={(e) => {
                        if (isClickable) {
                          console.log('[AttendanceCalendar] Cell clicked, date:', dateStr, 'isClickable:', isClickable);
                          e.preventDefault();
                          e.stopPropagation();
                          onDateClick(dateStr);
                        } else {
                          console.log('[AttendanceCalendar] Cell clicked but NOT clickable, date:', dateStr, 'status:', status);
                        }
                      }}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
                          e.preventDefault();
                          onDateClick(dateStr);
                        }
                      }}
                      className={`flex flex-col items-start justify-start transition-all ${
                        !isLastCol ? 'border-r' : ''
                      } ${!isLastRow ? 'border-b' : ''} border-gray-300 dark:border-gray-700 ${
                        isToday && !availableForAttendance ? 'ring-inset ring-2 ring-blue-500' : ''
                      } ${isClickable ? 'cursor-pointer hover:opacity-90 active:opacity-75' : ''}`}
                      style={{
                        backgroundColor: bgColor,
                        padding: adaptiveStyles.cellPadding,
                        minHeight: adaptiveStyles.cellMinHeight,
                        WebkitUserSelect: 'none',
                        userSelect: 'none',
                        pointerEvents: 'auto',
                      }}
                    >
                      {/* Date number */}
                      <span
                        className="font-bold"
                        style={{
                          fontSize: adaptiveStyles.dateSize,
                          color: textColor,
                        }}
                      >
                        {cell.day}
                      </span>

                      {/* Status label */}
                      {status !== 'no_session' && status !== 'weekend' && (
                        <span
                          style={{
                            fontSize: adaptiveStyles.labelSize,
                            color: labelColor,
                            fontWeight: 'bold',
                            marginTop: adaptiveStyles.cellPadding === '0.5rem' ? '0.25rem' : '0.5rem',
                          }}
                        >
                          {display.label}
                        </span>
                      )}

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Completed badge for today */}
                      {isToday && bothDone && (
                        <span
                          style={{
                            fontSize: adaptiveStyles.labelSize === 'xs' ? '9px' : '12px',
                            color: '#16a34a',
                            fontWeight: 'bold',
                          }}
                        >
                          ✔ Done
                        </span>
                      )}
                    </div>
                  )}
                </TooltipTrigger>

                {/* Hover tooltip for completed cells */}
                {dayData?.record && CLICKABLE_STATUSES.includes(status) && (
                  <TooltipContent side="top" className="text-xs space-y-1">
                    <p className="font-semibold">{display.label}</p>
                    <p>Time In: {formatTime(dayData.record.morning_time_in ?? dayData.record.check_in_time)}</p>
                    <p>Time Out: {formatTime(dayData.record.afternoon_time_out ?? dayData.record.check_out_time)}</p>
                    {dayData.record.late_duration_minutes != null &&
                     dayData.record.late_duration_minutes > 0 && (
                      <p className="text-orange-500">
                        Late: {formatDuration(dayData.record.late_duration_minutes)}
                      </p>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-muted px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-green-500" />
            <span className="font-medium text-xs">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-red-500" />
            <span className="font-medium text-xs">Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-orange-500" />
            <span className="font-medium text-xs">Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-purple-500" />
            <span className="font-medium text-xs">Excused</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-blue-500" />
            <span className="font-medium text-xs">Pending</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
