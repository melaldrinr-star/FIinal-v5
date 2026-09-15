import { formatDistanceToNow, parseISO, format } from 'date-fns';

/**
 * Date formatting utilities for Trainee Status Module
 *
 * These functions format dates in human-readable formats as specified in the design:
 * - "Month Day, Year" format (e.g., "Jan 15, 2024")
 * - "Recorded on [Date]" format
 * - "Created by [User] on [Date]" format
 * - Handle null dates gracefully
 */

/**
 * Format a date string as "Month Day, Year" (e.g., "Jan 15, 2024")
 *
 * Handles:
 * - ISO 8601 date strings (YYYY-MM-DD)
 * - ISO 8601 timestamps (YYYY-MM-DDTHH:MM:SSZ)
 * - null/undefined inputs -> returns "Not recorded"
 *
 * @param dateString - ISO 8601 date or timestamp string
 * @returns Formatted date string (e.g., "Jan 15, 2024") or "Not recorded"
 *
 * **Validates: Requirement 19.0**
 */
export function formatDateDisplay(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'Not recorded';
  }

  try {
    // Parse the ISO date/timestamp
    const date = parseISO(dateString);

    // Format as "MMM d, yyyy" (e.g., "Jan 15, 2024")
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Format a timestamp as "Recorded on [Date]"
 *
 * Example output: "Recorded on Jan 15, 2024"
 *
 * Handles:
 * - ISO 8601 timestamps
 * - null/undefined inputs -> returns "Not recorded"
 *
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted string (e.g., "Recorded on Jan 15, 2024") or "Not recorded"
 *
 * **Validates: Requirement 19.0**
 */
export function formatRecordedOnDate(timestamp: string | null | undefined): string {
  const formattedDate = formatDateDisplay(timestamp);
  if (formattedDate === 'Not recorded') {
    return 'Not recorded';
  }
  return `Recorded on ${formattedDate}`;
}

/**
 * Format a timestamp as "Created by [User] on [Date]"
 *
 * Example output: "Created by Admin on Jan 15, 2024"
 *
 * Handles:
 * - ISO 8601 timestamps
 * - null/undefined user or timestamp -> returns appropriate message
 *
 * @param userName - Name or ID of the user who created the record
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted string or fallback message
 *
 * **Validates: Requirement 13.0**
 */
export function formatCreatedByDate(
  userName: string | null | undefined,
  timestamp: string | null | undefined
): string {
  if (!userName) {
    return 'Created by Unknown user';
  }

  const formattedDate = formatDateDisplay(timestamp);
  return `Created by ${userName} on ${formattedDate}`;
}

/**
 * Format a timestamp as "Last updated by [User] on [Date]"
 *
 * Example output: "Last updated by Manager on Jan 21, 2024"
 *
 * Handles:
 * - ISO 8601 timestamps
 * - null/undefined user or timestamp -> returns appropriate message
 *
 * @param userName - Name or ID of the user who last updated the record
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted string or fallback message
 *
 * **Validates: Requirement 13.0**
 */
export function formatLastUpdatedByDate(
  userName: string | null | undefined,
  timestamp: string | null | undefined
): string {
  if (!userName || !timestamp) {
    return '';
  }

  const formattedDate = formatDateDisplay(timestamp);
  return `Last updated by ${userName} on ${formattedDate}`;
}

/**
 * Format a date as relative time from now (e.g., "2 months ago")
 *
 * Useful for displaying how long ago a record was recorded.
 *
 * Handles:
 * - ISO 8601 dates/timestamps
 * - null/undefined inputs -> returns "Unknown"
 *
 * @param dateString - ISO 8601 date or timestamp string
 * @returns Relative time string (e.g., "2 months ago") or "Unknown"
 */
export function formatRelativeDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'Unknown';
  }

  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Format a date string as ISO 8601 date (YYYY-MM-DD)
 *
 * Useful for date input fields in forms.
 *
 * Handles:
 * - ISO 8601 date strings -> returns as-is
 * - ISO 8601 timestamps -> extracts date portion
 * - null/undefined -> returns empty string
 *
 * @param dateString - Date or timestamp string
 * @returns ISO date string (YYYY-MM-DD) or empty string
 */
export function toISODateString(dateString: string | null | undefined): string {
  if (!dateString) {
    return '';
  }

  // Already matches YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // ISO timestamp or longer string — extract date portion
  return dateString.slice(0, 10);
}
