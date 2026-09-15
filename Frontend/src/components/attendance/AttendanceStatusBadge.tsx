import { BadgeCheck, AlertCircle, XCircle, Clock } from 'lucide-react';

type AttendanceStatus = 'present' | 'late' | 'absent' | 'pending';

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  present: {
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: BadgeCheck,
    label: 'Present',
  },
  late: {
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    icon: Clock,
    label: 'Late',
  },
  absent: {
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: XCircle,
    label: 'Absent',
  },
  pending: {
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    icon: AlertCircle,
    label: 'Pending',
  },
};

export function AttendanceStatusBadge({ status, size = 'md' }: AttendanceStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]}`}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </div>
  );
}

export function AttendanceStatusIndicator({ status }: { status: AttendanceStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div className={`rounded-full ${config.bgColor} ${config.textColor} p-2`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className={`text-sm font-medium ${config.textColor}`}>{config.label}</span>
    </div>
  );
}

export function AttendanceStatusDot({ status, size = 'md' }: { status: AttendanceStatus; size?: 'sm' | 'md' | 'lg' }) {
  const colors: Record<AttendanceStatus, string> = {
    present: 'bg-green-500',
    late: 'bg-yellow-500',
    absent: 'bg-red-500',
    pending: 'bg-gray-400',
  };

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-5 w-5',
  };

  // Use fallback to 'pending' if status is invalid or undefined
  const validStatus: AttendanceStatus = (status && status in statusConfig) ? status : 'pending';
  const config = statusConfig[validStatus];

  return (
    <div
      className={`rounded-full ${colors[validStatus]} ${sizeClasses[size]}`}
      title={config.label}
    />
  );
}
