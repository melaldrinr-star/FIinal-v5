/**
 * Integration Examples for ConnectionStatusIndicator Component
 *
 * This file demonstrates how to integrate the ConnectionStatusIndicator component
 * into your application to display WebSocket connection status.
 *
 * **Validates: Requirements 6.5, 13.2**
 */

import React from 'react';
import { useEnrollmentUpdates } from '../../hooks/useEnrollmentUpdates';
import ConnectionStatusIndicator from '../ConnectionStatusIndicator';

/**
 * Example 1: Basic Usage in Header
 *
 * Display the connection status indicator in the application header.
 * Uses default styling and shows the label.
 */
export function HeaderWithConnectionStatus() {
  const { connectionStatus } = useEnrollmentUpdates('trainee-123');

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b">
      <h1 className="text-2xl font-bold">Enrollment Dashboard</h1>
      <div className="flex items-center gap-4">
        <ConnectionStatusIndicator
          connectionStatus={connectionStatus}
          showLabel={true}
          size="sm"
        />
      </div>
    </header>
  );
}

/**
 * Example 2: Compact Icon-Only Status in Top Right
 *
 * Display only the icon (no label) for a compact appearance in the top right corner.
 * Ideal for header/navbar integration.
 */
export function CompactConnectionIndicator() {
  const { connectionStatus } = useEnrollmentUpdates('trainee-123');

  return (
    <div className="fixed top-4 right-4">
      <ConnectionStatusIndicator
        connectionStatus={connectionStatus}
        showLabel={false}
        size="sm"
      />
    </div>
  );
}

/**
 * Example 3: With Status Text in Dashboard
 *
 * Display connection status with label and optional message based on status.
 * Useful for prominently showing connection quality.
 */
export function DashboardWithConnectionStatus() {
  const { connectionStatus, enrollments, loading, error } = useEnrollmentUpdates('trainee-123');

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Enrollments</h2>
        <div className="flex items-center gap-4">
          <ConnectionStatusIndicator
            connectionStatus={connectionStatus}
            showLabel={true}
            size="md"
          />
          {connectionStatus === 'disconnected' && (
            <p className="text-sm text-gray-500">
              Using offline mode - updates may be delayed
            </p>
          )}
        </div>
      </div>

      {loading && <div>Loading enrollments...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      {enrollments && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrollments.map((enrollment) => (
            <div key={enrollment.id} className="p-4 border rounded">
              <div>{enrollment.program_id}</div>
              <div className="text-sm text-gray-600">{enrollment.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: In a Navbar/TopBar Component
 *
 * Integrate the indicator into your existing navbar component.
 */
export function TopNavbarWithStatus() {
  const { connectionStatus } = useEnrollmentUpdates('trainee-123');

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">BMDC Portal</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Other nav items would go here */}

          {/* Connection Status Indicator */}
          <div className="inline-flex items-center px-3 py-1 bg-blue-500 rounded-full">
            <ConnectionStatusIndicator
              connectionStatus={connectionStatus}
              showLabel={true}
              size="sm"
              className="!bg-transparent !border-0 !px-0"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

/**
 * Example 5: Conditional Display Based on Status
 *
 * Show different UI elements depending on the connection status.
 */
export function EnrollmentCardWithStatusAwareness() {
  const { connectionStatus } = useEnrollmentUpdates('trainee-123');

  return (
    <div className="p-4 border rounded">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">Program Name</h3>
          <p className="text-sm text-gray-600">Status: Active</p>
        </div>

        {connectionStatus === 'connected' && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
            Live Updates
          </span>
        )}

        {connectionStatus === 'reconnecting' && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
            Reconnecting...
          </span>
        )}

        {connectionStatus === 'disconnected' && (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
            Offline Mode
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Example 6: Minimal Status Badge
 *
 * Display connection status as a small badge in corners or edges.
 */
export function MinimalStatusBadge() {
  const { connectionStatus } = useEnrollmentUpdates('trainee-123');

  return (
    <div className="relative">
      {/* Your main content goes here */}
      <div className="p-8 border rounded bg-gray-50">Main Content Area</div>

      {/* Connection status badge in corner */}
      <div className="absolute bottom-4 right-4">
        <ConnectionStatusIndicator
          connectionStatus={connectionStatus}
          showLabel={false}
          size="sm"
        />
      </div>
    </div>
  );
}

/**
 * Example 7: Status with Manual Refresh Button
 *
 * Combine connection status with a manual refresh action.
 */
export function StatusWithRefreshAction() {
  const { connectionStatus, forceRefresh } = useEnrollmentUpdates('trainee-123');

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded">
      <div>
        <ConnectionStatusIndicator
          connectionStatus={connectionStatus}
          showLabel={true}
          size="md"
        />
      </div>

      {connectionStatus === 'disconnected' && (
        <button
          onClick={forceRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Now
        </button>
      )}

      {connectionStatus !== 'connected' && (
        <p className="text-sm text-gray-600">
          Real-time updates are {connectionStatus === 'connecting' ? 'initializing' : 'unavailable'}
        </p>
      )}
    </div>
  );
}

/**
 * Example 8: Status in List Item or Table Row
 *
 * Include status indicator in a list or table to show which items have live updates.
 */
export function TableWithConnectionStatus() {
  const { connectionStatus, enrollments } = useEnrollmentUpdates('trainee-123');

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Program</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Sync Status</th>
          </tr>
        </thead>
        <tbody>
          {enrollments?.map((enrollment) => (
            <tr key={enrollment.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{enrollment.program_id}</td>
              <td className="px-4 py-2">{enrollment.status}</td>
              <td className="px-4 py-2">
                <ConnectionStatusIndicator
                  connectionStatus={connectionStatus}
                  showLabel={false}
                  size="sm"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Integration Guidelines:
 *
 * 1. PLACEMENT:
 *    - Top-right corner of header (compact, no label)
 *    - Navbar/topbar area (with label)
 *    - Dashboard status panel (prominent display)
 *
 * 2. SIZING:
 *    - Header: use size="sm" (compact)
 *    - Dashboard overview: use size="md"
 *    - Status page detail: use size="lg"
 *
 * 3. LABEL DISPLAY:
 *    - Compact spaces: showLabel={false} (icon only)
 *    - Status sections: showLabel={true}
 *    - Settings/info pages: showLabel={true}
 *
 * 4. ACCESSIBILITY:
 *    - Component includes full ARIA labels
 *    - Use role="status" for automatic screen reader announcements
 *    - aria-live="polite" ensures updates are announced
 *
 * 5. STYLING:
 *    - Component uses Tailwind classes
 *    - Accepts custom className prop for integration
 *    - Colors are semantic (green=connected, amber=reconnecting, gray=disconnected)
 *
 * 6. STATE TRANSITIONS:
 *    - connected: Green - real-time updates active
 *    - connecting: Blue - establishing connection
 *    - reconnecting: Amber - attempting to restore
 *    - disconnected: Gray - using fallback REST API
 */
