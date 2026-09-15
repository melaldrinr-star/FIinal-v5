import { describe, it, expect } from 'vitest';
import {
  formatDateDisplay,
  formatRecordedOnDate,
  formatCreatedByDate,
  formatLastUpdatedByDate,
  formatRelativeDate,
  toISODateString,
} from './dateFormat';

/**
 * Unit Tests for Date Formatting Utilities
 *
 * **Validates: Requirement 19.0**
 *
 * These tests verify that all date formatting functions handle:
 * - Valid ISO 8601 dates (YYYY-MM-DD)
 * - Valid ISO 8601 timestamps (YYYY-MM-DDTHH:MM:SSZ)
 * - Null/undefined values
 * - Invalid date strings
 * - Edge cases (boundary dates, month boundaries)
 */

describe('dateFormat utilities', () => {
  describe('formatDateDisplay', () => {
    it('should format valid ISO date string as "Month Day, Year"', () => {
      expect(formatDateDisplay('2024-01-15')).toBe('Jan 15, 2024');
    });

    it('should format ISO timestamp string as "Month Day, Year"', () => {
      expect(formatDateDisplay('2024-01-15T10:30:00Z')).toBe('Jan 15, 2024');
    });

    it('should handle different months correctly', () => {
      expect(formatDateDisplay('2024-02-29')).toBe('Feb 29, 2024');
      expect(formatDateDisplay('2024-12-31')).toBe('Dec 31, 2024');
    });

    it('should handle single-digit days', () => {
      expect(formatDateDisplay('2024-03-05')).toBe('Mar 5, 2024');
    });

    it('should handle month abbreviations correctly for all months', () => {
      const months = [
        '01', '02', '03', '04', '05', '06',
        '07', '08', '09', '10', '11', '12',
      ];
      const expectedAbbr = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      months.forEach((month, idx) => {
        const result = formatDateDisplay(`2024-${month}-15`);
        expect(result).toContain(expectedAbbr[idx]);
      });
    });

    it('should return "Not recorded" for null input', () => {
      expect(formatDateDisplay(null)).toBe('Not recorded');
    });

    it('should return "Not recorded" for undefined input', () => {
      expect(formatDateDisplay(undefined)).toBe('Not recorded');
    });

    it('should return "Not recorded" for empty string', () => {
      expect(formatDateDisplay('')).toBe('Not recorded');
    });

    it('should return "Invalid date" for malformed date string', () => {
      expect(formatDateDisplay('not-a-date')).toBe('Invalid date');
    });

    it('should return "Invalid date" for invalid date like 2024-13-01', () => {
      expect(formatDateDisplay('2024-13-01')).toBe('Invalid date');
    });

    it('should handle leap year correctly', () => {
      expect(formatDateDisplay('2024-02-29')).toBe('Feb 29, 2024');
    });

    it('should handle year boundaries', () => {
      expect(formatDateDisplay('2024-01-01')).toBe('Jan 1, 2024');
      expect(formatDateDisplay('2024-12-31')).toBe('Dec 31, 2024');
    });

    it('should handle ISO timestamp with milliseconds', () => {
      expect(formatDateDisplay('2024-01-15T10:30:00.123Z')).toBe('Jan 15, 2024');
    });
  });

  describe('formatRecordedOnDate', () => {
    it('should format timestamp as "Recorded on Month Day, Year"', () => {
      expect(formatRecordedOnDate('2024-01-15')).toBe('Recorded on Jan 15, 2024');
    });

    it('should format ISO timestamp correctly', () => {
      expect(formatRecordedOnDate('2024-01-20T10:00:00Z')).toBe('Recorded on Jan 20, 2024');
    });

    it('should return "Not recorded" for null input', () => {
      expect(formatRecordedOnDate(null)).toBe('Not recorded');
    });

    it('should return "Not recorded" for undefined input', () => {
      expect(formatRecordedOnDate(undefined)).toBe('Not recorded');
    });

    it('should return "Not recorded" for empty string', () => {
      expect(formatRecordedOnDate('')).toBe('Not recorded');
    });

    it('should handle various date formats', () => {
      expect(formatRecordedOnDate('2024-03-05')).toBe('Recorded on Mar 5, 2024');
      expect(formatRecordedOnDate('2024-12-25')).toBe('Recorded on Dec 25, 2024');
    });
  });

  describe('formatCreatedByDate', () => {
    it('should format user and timestamp as "Created by [User] on [Date]"', () => {
      expect(formatCreatedByDate('Admin', '2024-01-15')).toBe('Created by Admin on Jan 15, 2024');
    });

    it('should format with ISO timestamp', () => {
      expect(formatCreatedByDate('Manager', '2024-01-20T10:00:00Z')).toBe('Created by Manager on Jan 20, 2024');
    });

    it('should handle different user names', () => {
      expect(formatCreatedByDate('John Doe', '2024-02-10')).toBe('Created by John Doe on Feb 10, 2024');
      expect(formatCreatedByDate('jane.smith', '2024-03-15')).toBe('Created by jane.smith on Mar 15, 2024');
    });

    it('should return "Created by Unknown user" when user is null', () => {
      expect(formatCreatedByDate(null, '2024-01-15')).toBe('Created by Unknown user');
    });

    it('should return "Created by Unknown user" when user is undefined', () => {
      expect(formatCreatedByDate(undefined, '2024-01-15')).toBe('Created by Unknown user');
    });

    it('should return fallback message when user is empty string', () => {
      expect(formatCreatedByDate('', '2024-01-15')).toBe('Created by Unknown user');
    });

    it('should handle null timestamp with valid user', () => {
      expect(formatCreatedByDate('Admin', null)).toBe('Created by Admin on Not recorded');
    });

    it('should handle undefined timestamp with valid user', () => {
      expect(formatCreatedByDate('Admin', undefined)).toBe('Created by Admin on Not recorded');
    });
  });

  describe('formatLastUpdatedByDate', () => {
    it('should format user and timestamp as "Last updated by [User] on [Date]"', () => {
      expect(formatLastUpdatedByDate('Manager', '2024-01-21')).toBe('Last updated by Manager on Jan 21, 2024');
    });

    it('should format with ISO timestamp', () => {
      expect(formatLastUpdatedByDate('Manager', '2024-01-21T15:00:00Z')).toBe(
        'Last updated by Manager on Jan 21, 2024'
      );
    });

    it('should handle different user names', () => {
      expect(formatLastUpdatedByDate('John Doe', '2024-02-15')).toBe('Last updated by John Doe on Feb 15, 2024');
      expect(formatLastUpdatedByDate('jane.smith', '2024-03-20')).toBe('Last updated by jane.smith on Mar 20, 2024');
    });

    it('should return empty string when user is null', () => {
      expect(formatLastUpdatedByDate(null, '2024-01-21')).toBe('');
    });

    it('should return empty string when user is undefined', () => {
      expect(formatLastUpdatedByDate(undefined, '2024-01-21')).toBe('');
    });

    it('should return empty string when timestamp is null', () => {
      expect(formatLastUpdatedByDate('Manager', null)).toBe('');
    });

    it('should return empty string when timestamp is undefined', () => {
      expect(formatLastUpdatedByDate('Manager', undefined)).toBe('');
    });

    it('should return empty string when both user and timestamp are null', () => {
      expect(formatLastUpdatedByDate(null, null)).toBe('');
    });

    it('should return empty string when user is empty string', () => {
      expect(formatLastUpdatedByDate('', '2024-01-21')).toBe('');
    });
  });

  describe('formatRelativeDate', () => {
    it('should format recent date as relative time (e.g., "less than a minute ago")', () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
      expect(formatRelativeDate(recentDate.toISOString())).toContain('ago');
    });

    it('should format older date with proper relative format', () => {
      expect(formatRelativeDate('2024-01-15')).toContain('ago');
    });

    it('should return "Unknown" for null input', () => {
      expect(formatRelativeDate(null)).toBe('Unknown');
    });

    it('should return "Unknown" for undefined input', () => {
      expect(formatRelativeDate(undefined)).toBe('Unknown');
    });

    it('should handle ISO timestamp with time', () => {
      expect(formatRelativeDate('2024-01-15T10:00:00Z')).toContain('ago');
    });

    it('should handle invalid date string gracefully', () => {
      expect(formatRelativeDate('invalid-date')).toBe('Unknown');
    });
  });

  describe('toISODateString', () => {
    it('should return ISO date string as-is when already in YYYY-MM-DD format', () => {
      expect(toISODateString('2024-01-15')).toBe('2024-01-15');
    });

    it('should extract date portion from ISO timestamp', () => {
      expect(toISODateString('2024-01-15T10:30:00Z')).toBe('2024-01-15');
    });

    it('should extract date portion from ISO timestamp with milliseconds', () => {
      expect(toISODateString('2024-01-15T10:30:00.123Z')).toBe('2024-01-15');
    });

    it('should return empty string for null input', () => {
      expect(toISODateString(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(toISODateString(undefined)).toBe('');
    });

    it('should return empty string for empty string input', () => {
      expect(toISODateString('')).toBe('');
    });

    it('should handle various date formats', () => {
      expect(toISODateString('2024-02-29')).toBe('2024-02-29');
      expect(toISODateString('2024-12-31T23:59:59Z')).toBe('2024-12-31');
    });

    it('should preserve correct date even with edge case timestamps', () => {
      expect(toISODateString('2024-01-01T00:00:00Z')).toBe('2024-01-01');
    });
  });

  describe('Integration tests - formatting across different date scenarios', () => {
    it('should handle multiple formats for the same date consistently', () => {
      const isoDate = '2024-01-15';
      const isoTimestamp = '2024-01-15T10:30:00Z';

      const display1 = formatDateDisplay(isoDate);
      const display2 = formatDateDisplay(isoTimestamp);

      expect(display1).toBe(display2);
      expect(display1).toBe('Jan 15, 2024');
    });

    it('should maintain audit trail formatting in sequence', () => {
      const createdDate = '2024-01-15T10:00:00Z';
      const updatedDate = '2024-01-21T15:00:00Z';

      const created = formatCreatedByDate('Admin', createdDate);
      const updated = formatLastUpdatedByDate('Manager', updatedDate);

      expect(created).toContain('Jan 15, 2024');
      expect(updated).toContain('Jan 21, 2024');
      expect(created).toContain('Admin');
      expect(updated).toContain('Manager');
    });

    it('should handle edge case where record has null timestamps', () => {
      const recorded = formatRecordedOnDate(null);
      const created = formatCreatedByDate('Admin', null);
      const updated = formatLastUpdatedByDate('Manager', null);

      expect(recorded).toBe('Not recorded');
      expect(created).toContain('Not recorded');
      expect(updated).toBe('');
    });

    it('should correctly format card view scenario (trainee status card)', () => {
      const recordedAt = '2024-01-20T10:00:00Z';

      const recordedDisplay = formatRecordedOnDate(recordedAt);
      const displayDate = formatDateDisplay(recordedAt);

      expect(recordedDisplay).toBe('Recorded on Jan 20, 2024');
      expect(displayDate).toBe('Jan 20, 2024');
    });

    it('should correctly format modal audit trail scenario', () => {
      const createdAt = '2024-01-15T10:00:00Z';
      const updatedAt = '2024-01-21T15:00:00Z';

      const createdDisplay = formatCreatedByDate('Admin', createdAt);
      const updatedDisplay = formatLastUpdatedByDate('Manager', updatedAt);

      expect(createdDisplay).toBe('Created by Admin on Jan 15, 2024');
      expect(updatedDisplay).toBe('Last updated by Manager on Jan 21, 2024');
    });
  });

  describe('Edge cases and boundary testing', () => {
    it('should handle leap year boundary correctly', () => {
      expect(formatDateDisplay('2024-02-29')).toBe('Feb 29, 2024');
      expect(formatDateDisplay('2023-02-28')).toBe('Feb 28, 2023');
    });

    it('should handle month boundaries', () => {
      expect(formatDateDisplay('2024-01-31')).toBe('Jan 31, 2024');
      expect(formatDateDisplay('2024-04-30')).toBe('Apr 30, 2024');
      expect(formatDateDisplay('2024-02-29')).toBe('Feb 29, 2024');
    });

    it('should handle year boundaries', () => {
      expect(formatDateDisplay('2024-01-01')).toBe('Jan 1, 2024');
      expect(formatDateDisplay('2024-12-31')).toBe('Dec 31, 2024');
      expect(formatDateDisplay('2025-01-01')).toBe('Jan 1, 2025');
    });

    it('should handle century boundaries', () => {
      expect(formatDateDisplay('1999-12-31')).toBe('Dec 31, 1999');
      expect(formatDateDisplay('2000-01-01')).toBe('Jan 1, 2000');
    });

    it('should handle very old dates', () => {
      expect(formatDateDisplay('1900-01-01')).toBe('Jan 1, 1900');
    });

    it('should handle future dates', () => {
      expect(formatDateDisplay('2099-12-31')).toBe('Dec 31, 2099');
    });
  });

  describe('Error handling and graceful degradation', () => {
    it('should not throw on malformed inputs', () => {
      expect(() => formatDateDisplay('2024-13-32')).not.toThrow();
      expect(() => formatDateDisplay('invalid')).not.toThrow();
      expect(() => formatDateDisplay('2024/01/15')).not.toThrow();
    });

    it('should handle whitespace in inputs gracefully', () => {
      // Whitespace is treated as a truthy value but fails date parsing
      expect(formatDateDisplay(' ')).toBe('Invalid date');
    });

    it('should handle all null/undefined combinations in user functions', () => {
      expect(() => formatCreatedByDate(null, null)).not.toThrow();
      expect(() => formatCreatedByDate(undefined, undefined)).not.toThrow();
      expect(() => formatLastUpdatedByDate(null, null)).not.toThrow();
      expect(() => formatLastUpdatedByDate(undefined, undefined)).not.toThrow();
    });
  });

  describe('Specific requirements validation', () => {
    it('should format dates exactly as "Month Day, Year" per Requirement 19', () => {
      // Examples from requirements
      expect(formatDateDisplay('2024-01-15')).toBe('Jan 15, 2024');
      expect(formatRecordedOnDate('2024-01-20')).toBe('Recorded on Jan 20, 2024');
    });

    it('should handle null dates by returning "Not recorded" per Requirement 19', () => {
      expect(formatDateDisplay(null)).toBe('Not recorded');
      expect(formatDateDisplay(undefined)).toBe('Not recorded');
    });

    it('should format audit trail as required per Requirement 13', () => {
      const createdBy = formatCreatedByDate('Admin', '2024-01-20T10:00:00Z');
      const lastUpdatedBy = formatLastUpdatedByDate('Manager', '2024-01-21T15:00:00Z');

      expect(createdBy).toMatch(/Created by Admin on/);
      expect(lastUpdatedBy).toMatch(/Last updated by Manager on/);
    });

    it('should support all date formats mentioned in requirements', () => {
      // ISO 8601 date (YYYY-MM-DD)
      expect(formatDateDisplay('2024-01-15')).not.toBe('Invalid date');

      // ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SSZ)
      expect(formatDateDisplay('2024-01-15T10:30:00Z')).not.toBe('Invalid date');

      // Null handling
      expect(formatDateDisplay(null)).toBe('Not recorded');
    });
  });
});
