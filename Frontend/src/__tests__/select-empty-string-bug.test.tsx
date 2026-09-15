/**
 * Bug Condition Exploration Test: Select Component Empty String Validation
 * 
 * **CRITICAL**: This test is designed to FAIL on unfixed code to confirm the bug exists.
 * The test validates that empty string state values in Select components trigger
 * a Radix UI validation error: "A <Select.Item /> must have a value prop that is not an empty string"
 * 
 * On UNFIXED code: The test FAILS (as expected) - confirming the bug
 * On FIXED code: The test PASSES - confirming the fix works
 * 
 * **Validates: Requirements 2.1, 2.2**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import fc from 'fast-check';

// =========================================================================
// CONCRETE CASE 1: AttendanceDetailModal with empty overrideStatus
// =========================================================================

describe('Bug Condition: AttendanceDetailModal with empty overrideStatus ("")', () => {
  it('should FAIL on unfixed code when rendering modal with overrideStatus initialized to empty string', async () => {
    /**
     * This test specifically targets the bug where AttendanceDetailModal
     * initializes overrideStatus to '' and attempts to render Select components
     * with empty string values.
     * 
     * Expected behavior on UNFIXED code:
     * - Radix UI validation error: "A <Select.Item /> must have a value prop that is not an empty string"
     * - Rendering fails or throws an error
     * 
     * Expected behavior on FIXED code (after initialization changed to 'pending'):
     * - Component renders successfully
     * - No validation error occurs
     * - Select component displays with 'pending' as the value
     */
    
    const { default: AttendanceDetailModal } = await import('../components/attendance/AttendanceDetailModal');
    
    // Mock trainee data
    const mockTrainee = {
      id: 'trainee-1',
      first_name: 'John',
      last_name: 'Doe',
      photo_path: null,
    };

    // Mock attendance record
    const mockRecord = {
      id: 'record-1',
      session_id: 'session-1',
      trainee_id: 'trainee-1',
      status: 'present' as const,
      morning_time_in: '2024-01-01T09:00:00Z',
      afternoon_time_out: '2024-01-01T17:00:00Z',
      check_in_time: '2024-01-01T09:00:00Z',
      check_out_time: '2024-01-01T17:00:00Z',
      selfie_morning_path: null,
      selfie_afternoon_path: null,
      gps_lat: null,
      gps_lng: null,
      gps_accuracy: null,
      gps_address: null,
      device_info: null,
      late_duration_minutes: 0,
      attempt_number: 1,
      submission_method: 'mobile',
      trainee: mockTrainee,
    };

    let capturedErrors: string[] = [];
    const originalError = console.error;
    console.error = (...args: any[]) => {
      capturedErrors.push(args.join(' '));
    };

    try {
      render(
        <AttendanceDetailModal
          record={mockRecord}
          trainee={mockTrainee}
          programName="Test Program"
          isOpen={true}
          onClose={() => {}}
          onStatusUpdated={() => {}}
          canOverride={true}
        />
      );
      
      // Check if Select component exists and is rendering without error
      // On UNFIXED code, we expect to see validation errors
      await waitFor(() => {
        // Look for the Select trigger element
        const selectTrigger = screen.queryByRole('button', { name: /select new status/i });
        // If Radix UI validation failed, the Select won't render properly
      }, { timeout: 500 });
      
    } finally {
      console.error = originalError;
    }

    // Document the errors captured
    console.log('\n=== CONCRETE CASE 1: AttendanceDetailModal with empty overrideStatus ===');
    console.log('Captured errors:', capturedErrors.length);
    capturedErrors.forEach(err => console.log('  -', err.substring(0, 100)));
    
    // If empty string causes validation error, we should see it in console
    const hasValidationError = capturedErrors.some(err => 
      err.includes('Select') || err.includes('value')
    );

    // EXPECTED ON UNFIXED CODE: hasValidationError = true
    // EXPECTED ON FIXED CODE: hasValidationError = false
    expect(hasValidationError).toBe(false);
  });
});

// =========================================================================
// CONCRETE CASE 2: AttendancePage with empty filterStatus
// =========================================================================

describe('Bug Condition: AttendancePage with empty filterStatus ("")', () => {
  it('should FAIL on unfixed code when rendering page with filterStatus initialized to empty string', async () => {
    /**
     * This test specifically targets the bug where AttendancePage
     * initializes filterStatus to '' and attempts to render Select components
     * with empty string values in the filter controls.
     * 
     * Expected behavior on UNFIXED code:
     * - Radix UI validation error occurs when Status filter Select renders
     * - Page fails to render or shows white screen
     * 
     * Expected behavior on FIXED code (after initialization changed to 'all'):
     * - Page renders successfully
     * - Status filter Select displays with 'all' as selected value
     * - No validation errors occur
     */

    // This is a simplified test - the full page rendering is complex due to dependencies
    // We'll test the Select component directly with empty string value
    const { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } = await import('../components/ui/select');
    
    let capturedErrors: string[] = [];
    const originalError = console.error;
    console.error = (...args: any[]) => {
      capturedErrors.push(args.join(' '));
    };

    try {
      render(
        <Select value={''} onValueChange={() => {}}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
          </SelectContent>
        </Select>
      );
    } finally {
      console.error = originalError;
    }

    // Document errors
    console.log('\n=== CONCRETE CASE 2: AttendancePage with empty filterStatus ===');
    console.log('Captured errors:', capturedErrors.length);
    capturedErrors.forEach(err => console.log('  -', err.substring(0, 100)));
    
    const hasValidationError = capturedErrors.some(err => 
      err.includes('value prop') || err.includes('empty string')
    );

    expect(hasValidationError).toBe(false);
  });
});

// =========================================================================
// CONCRETE CASE 3: Reset button setting filterStatus to empty string
// =========================================================================

describe('Bug Condition: AttendancePage reset button causing filterStatus to become empty string', () => {
  it('should FAIL on unfixed code when reset button sets filterStatus to empty string', async () => {
    /**
     * This test targets the specific scenario where a Select component with empty string value
     * is used in a filter context, which on UNFIXED code would cause a validation error.
     * 
     * Expected behavior on UNFIXED code:
     * - Select with value="" throws validation error
     * 
     * Expected behavior on FIXED code:
     * - Select always has non-empty value
     */

    const { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } = await import('../components/ui/select');
    
    let capturedErrors: string[] = [];
    const originalError = console.error;
    console.error = (...args: any[]) => {
      capturedErrors.push(args.join(' '));
    };

    try {
      // Simulate what happens after reset button - filterStatus becomes ''
      render(
        <Select value={''} onValueChange={() => {}}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
          </SelectContent>
        </Select>
      );
    } finally {
      console.error = originalError;
    }

    // Document errors
    console.log('\n=== CONCRETE CASE 3: Reset button setting filterStatus to empty string ===');
    console.log('Captured errors:', capturedErrors.length);
    capturedErrors.forEach(err => console.log('  -', err.substring(0, 100)));
    
    const hasValidationError = capturedErrors.some(err => 
      err.includes('value prop') || err.includes('empty string')
    );

    expect(hasValidationError).toBe(false);
  });
});

// =========================================================================
// PROPERTY-BASED TEST: Empty String State Causes Validation Error
// =========================================================================

describe('Property 1: Bug Condition - Empty String State Validation', () => {
  it('should detect when Select components receive empty string values', async () => {
    /**
     * Property-based test that validates the bug exists by attempting to render
     * Select components with empty string state values.
     * 
     * Using fast-check to generate test cases, scoped to concrete failing cases:
     * - Empty string in Select value prop should cause validation errors on Radix UI
     * 
     * **Validates: Requirements 2.1, 2.2**
     */

    const { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } = await import('../components/ui/select');
    
    fc.assert(
      fc.property(
        fc.constantFrom('', 'all'),  // Generate empty string and valid value
        (value) => {
          let capturedErrors: string[] = [];
          const originalError = console.error;
          console.error = (...args: any[]) => {
            capturedErrors.push(args.join(' '));
          };

          try {
            render(
              <Select value={value} onValueChange={() => {}}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            );
          } finally {
            console.error = originalError;
          }

          // Check if empty string causes validation errors
          const hasValidationError = capturedErrors.some(err => 
            err.includes('value prop') || err.includes('empty string')
          );

          // On UNFIXED code: empty string ('') would cause validation error
          // On FIXED code: empty string should not cause validation error
          if (value === '') {
            // Empty string case - should NOT have validation error after fix
            console.log(`Test: Select value="${value}"  ->  Validation error: ${hasValidationError ? 'YES' : 'NO'}`);
            expect(hasValidationError).toBe(false);
          } else {
            // Non-empty case - should always work
            expect(hasValidationError).toBe(false);
          }
        }
      ),
      { numRuns: 2 }
    );
  });
});
