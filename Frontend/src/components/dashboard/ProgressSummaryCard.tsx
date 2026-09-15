import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { TrendingUp, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface AttendanceStats {
  total_sessions: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  attendance_rate: number;
}

interface ProgramSession {
  id: string;
  [key: string]: any;
}

interface ProgressSummaryCardProps {
  attendanceStats?: AttendanceStats | null;
  upcomingSessions?: ProgramSession[];
}

export default function ProgressSummaryCard({
  attendanceStats,
  upcomingSessions = [],
}: ProgressSummaryCardProps) {
  const present = attendanceStats?.present_count || 0;
  const late = attendanceStats?.late_count || 0;
  const absent = attendanceStats?.absent_count || 0;
  const total = attendanceStats?.total_sessions || 0;
  const attendanceRate = attendanceStats?.attendance_rate || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Your Progress</CardTitle>
        <CardDescription>Training performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Attendance Rate */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Attendance Rate</span>
            <span className="text-2xl font-bold text-primary">{attendanceRate}%</span>
          </div>
          <Progress value={attendanceRate} />
          <p className="text-sm text-muted-foreground">
            {present + late} attended out of {total} sessions
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs font-semibold text-muted-foreground">Present</span>
            </div>
            <p className="text-2xl font-bold">{present}</p>
          </div>
          <div className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-semibold text-muted-foreground">Late</span>
            </div>
            <p className="text-2xl font-bold">{late}</p>
          </div>
          <div className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-semibold text-muted-foreground">Absent</span>
            </div>
            <p className="text-2xl font-bold">{absent}</p>
          </div>
          <div className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold text-muted-foreground">Upcoming</span>
            </div>
            <p className="text-2xl font-bold">{upcomingSessions.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
