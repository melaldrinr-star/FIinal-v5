'use client';

import React, { useMemo } from 'react';
import { Wifi, WifiOff, Loader } from 'lucide-react';
import { ConnectionStatus } from '../services/enrollmentService';

/**
 * Props for ConnectionStatusIndicator component
 */
interface ConnectionStatusIndicatorProps {
  /** Current connection status */
  connectionStatus: ConnectionStatus;
  /** Optional CSS class name for styling */
  className?: string;
  /** Whether to show text label (default: true) */
  showLabel?: boolean;
  /** Size of the indicator - 'sm', 'md', 'lg' (default: 'sm') */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ConnectionStatusIndicator Component
 *
 * Displays a small, subtle indicator showing WebSocket connection status.
 * Features:
 * - Shows connection status icon and optional label
 * - Color-coded for different states (green connected, amber reconnecting, gray disconnected)
 * - Configurable size and styling
 * - Accessible with ARIA labels
 *
 * **Validates: Requirements 6.5, 13.2**
 *
 * @param props - Component props including status and optional styling
 * @returns React component displaying connection status
 *
 * @example
 * ```tsx
 * const { connectionStatus } = useEnrollment();
 * return (
 *   <div className="flex items-center gap-2">
 *     <ConnectionStatusIndicator
 *       connectionStatus={connectionStatus}
 *       showLabel={true}
 *       size="sm"
 *     />
 *   </div>
 * );
 * ```
 */
export default function ConnectionStatusIndicator({
  connectionStatus,
  className = '',
  showLabel = true,
  size = 'sm',
}: ConnectionStatusIndicatorProps) {
  /**
   * Get styling based on connection status
   * Returns icon, color, text, and accessibility label
   */
  const statusConfig = useMemo(() => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: Wifi,
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          labelText: 'Connected',
          ariaLabel: 'WebSocket connected - real-time updates enabled',
          tooltipText: 'Connected - Real-time updates active',
        };
      case 'reconnecting':
        return {
          icon: Loader,
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200',
          labelText: 'Reconnecting',
          ariaLabel: 'WebSocket reconnecting - attempting to restore connection',
          tooltipText: 'Reconnecting - Please wait',
        };
      case 'connecting':
        return {
          icon: Loader,
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          labelText: 'Connecting',
          ariaLabel: 'WebSocket connecting - establishing connection',
          tooltipText: 'Connecting - Please wait',
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200',
          labelText: 'Offline',
          ariaLabel: 'WebSocket disconnected - using REST API fallback',
          tooltipText: 'Offline - Using fallback updates',
        };
      default:
        return {
          icon: WifiOff,
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200',
          labelText: 'Unknown',
          ariaLabel: 'Connection status unknown',
          tooltipText: 'Connection status unknown',
        };
    }
  }, [connectionStatus]);

  /**
   * Get icon size based on size prop
   */
  const iconSizeClasses = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'md':
        return 'h-5 w-5';
      case 'lg':
        return 'h-6 w-6';
      default:
        return 'h-4 w-4';
    }
  }, [size]);

  /**
   * Get text size based on size prop
   */
  const textSizeClasses = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'md':
        return 'text-sm';
      case 'lg':
        return 'text-base';
      default:
        return 'text-xs';
    }
  }, [size]);

  /**
   * Get padding based on size prop
   */
  const paddingClasses = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1';
      case 'md':
        return 'px-3 py-1.5';
      case 'lg':
        return 'px-4 py-2';
      default:
        return 'px-2 py-1';
    }
  }, [size]);

  const Icon = statusConfig.icon;
  const isAnimating = connectionStatus === 'connecting' || connectionStatus === 'reconnecting';

  return (
    <div
      className={`
        inline-flex items-center gap-1.5
        ${paddingClasses}
        ${statusConfig.bgColor}
        border ${statusConfig.borderColor}
        rounded-md
        ${className}
      `}
      title={statusConfig.tooltipText}
      role="status"
      aria-label={statusConfig.ariaLabel}
      aria-live="polite"
    >
      <Icon
        className={`
          ${iconSizeClasses}
          ${statusConfig.textColor}
          ${isAnimating ? 'animate-spin' : ''}
        `}
        aria-hidden="true"
      />

      {showLabel && (
        <span
          className={`
            font-medium
            ${textSizeClasses}
            ${statusConfig.textColor}
          `}
        >
          {statusConfig.labelText}
        </span>
      )}
    </div>
  );
}
