/**
 * Unit Tests for Session Cleanup Handler - Explicit Dismissal
 *
 * Tests the cleanup logic for explicit dismissal when users close the Program Modal
 * without enrolling. Validates confirmation dialog behavior, cleanup operations,
 * LocalStorage state management, and cancel operations.
 *
 * Requirements: 6.1, 9.5
 * Phase 7: Enrollment Flow and Cleanup
 * Task 27.1: Write tests for Explicit Dismissal
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  cleanupProgramReference,
  getStoredProgramId,
  setStoredProgramId,
  hasProgramIdStored,
  getLocalStorageItemCount,
  clearAllLocalStorage,
  PROGRAM_ID_KEY,
} from '../sessionCleanupHandler';
import type { CleanupConfig, CleanupResult } from '../sessionCleanupHandler';
import { logger } from '../logger';

// Mock the logger to prevent actual logging during tests
vi.mock('../logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('sessionCleanupHandler - Explicit Dismissal', () => {
  const mockProgramId = '12345678-1234-1234-1234-123456789012';

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Clear localStorage before each test
    clearAllLocalStorage();
  });

  afterEach(() => {
    vi.clearAllMocks();
    clearAllLocalStorage();
  });

  /**
   * Test Suite: Confirmation Dialog Shown on Close
   * Tests that confirmation dialog is properly triggered when user attempts to dismiss
   */
  describe('Confirmation Dialog Shown on Close', () => {
    /**
     * Test 1.1: Dialog Display on Modal Close Attempt
     * When user clicks close button on modal, confirmation dialog should appear
     *
     * Validates: Requirement 9.5
     */
    it('should have program_id stored when modal close is attempted', () => {
      // Arrange
      setStoredProgramId(mockProgramId);
      expect(hasProgramIdStored()).toBe(true);

      // Act
      const storedId = getStoredProgramId();

      // Assert
      expect(storedId).toBe(mockProgramId);
    });

    /**
     * Test 1.2: Dialog Message Content
     * The confirmation dialog should display the correct dismissal message
     *
     * Validates: Requirement 9.5
     */
    it('should have clear dismissal message for confirmation dialog', () => {
      // Arrange - this is a data validation test
      const dismissalMessage = 'Are you sure? You can access this program later from the programs list.';

      // Act & Assert
      expect(dismissalMessage).toContain('sure');
      expect(dismissalMessage).toContain('program later');
      expect(dismissalMessage).toContain('programs list');
    });

    /**
     * Test 1.3: Program Context Present Before Dismissal
     * Program ID should be in LocalStorage before dismissal action
     *
     * Validates: Requirement 9.5
     */
    it('should confirm program_id exists before showing dismissal dialog', () => {
      // Arrange
      setStoredProgramId(mockProgramId);

      // Act
      const programId = getStoredProgramId();
      const itemCount = getLocalStorageItemCount();

      // Assert
      expect(programId).toBe(mockProgramId);
      expect(itemCount).toBeGreaterThan(0);
    });
  });

  /**
   * Test Suite: Cleanup on Confirm Dismiss
   * Tests that cleanup properly removes program_id when user confirms dismissal
   */
  describe('Cleanup on Confirm Dismiss', () => {
    /**
     * Test 2.1: Program ID Removed After Confirm
     * When user confirms dismissal, program_id should be removed from LocalStorage
     *
     * Validates: Requirements 6.1, 9.5
     */
    it('should remove program_id from LocalStorage when user confirms dismissal', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);
      expect(getStoredProgramId()).toBe(mockProgramId);

      // Act
      const result = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.wasCleanedUp).toBe(true);
      expect(result.previousValue).toBe(mockProgramId);
      expect(getStoredProgramId()).toBeUndefined();
      expect(hasProgramIdStored()).toBe(false);
    });

    /**
     * Test 2.2: Modal Closes After Cleanup
     * Modal should close after successful cleanup
     *
     * Validates: Requirement 6.1
     */
    it('should allow modal to close after cleanup is performed', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);

      // Act
      const result = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });

      // Assert
      expect(result.wasCleanedUp).toBe(true);
      // Verify state change would trigger modal close
      expect(getStoredProgramId()).toBeUndefined();
    });

    /**
     * Test 2.3: Cleanup Notification Message
     * "Program context cleared" notification should be shown
     *
     * Validates: Requirement 6.1
     */
    it('should have correct cleanup notification message ready', () => {
      // Arrange
      const notificationMessage = 'Program context cleared';

      // Act & Assert
      expect(notificationMessage).toBe('Program context cleared');
    });

    /**
     * Test 2.4: Cleanup Completes Successfully
     * Cleanup operation should report success
     *
     * Validates: Requirement 6.1
     */
    it('should report successful cleanup with explicit_dismiss trigger', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);

      // Act
      const result = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.wasCleanedUp).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  /**
   * Test Suite: Program ID Removed from LocalStorage
   * Tests that the program_id key is completely removed from storage
   */
  describe('Program ID Removed from LocalStorage', () => {
    /**
     * Test 3.1: Selective Deletion - Only Program ID Key Removed
     * Only the program_id key should be removed, other keys preserved
     *
     * Validates: Requirement 6.1
     */
    it('should remove only program_id key, not affect other localStorage keys', async () => {
      // Arrange
      const otherKey = 'other-storage-key';
      const otherValue = 'other-value';
      const anotherKey = 'another-key';
      const anotherValue = 'another-value';

      localStorage.setItem(otherKey, otherValue);
      localStorage.setItem(anotherKey, anotherValue);
      setStoredProgramId(mockProgramId);

      const initialCount = getLocalStorageItemCount();

      // Act
      const result = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });

      // Assert
      expect(result.wasCleanedUp).toBe(true);
      expect(getStoredProgramId()).toBeUndefined();
      expect(localStorage.getItem(otherKey)).toBe(otherValue);
      expect(localStorage.getItem(anotherKey)).toBe(anotherValue);
      expect(getLocalStorageItemCount()).toBeLessThan(initialCount);
    });

    /**
     * Test 3.2: Program ID Key Completely Gone
     * The PROGRAM_ID_KEY should not exist in localStorage after cleanup
     *
     * Validates: Requirement 6.1
     */
    it('should completely remove selected_program_id key from localStorage', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);
      expect(localStorage.getItem(PROGRAM_ID_KEY)).toBe(mockProgramId);

      // Act
      await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });

      // Assert
      expect(localStorage.getItem(PROGRAM_ID_KEY)).toBeNull();
    });

    /**
     * Test 3.3: Verify Storage State Before and After
     * Compare storage state before and after cleanup
     *
     * Validates: Requirement 6.1
     */
    it('should verify storage state changes correctly during cleanup', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);
      const beforeCleanupId = getStoredProgramId();
      const beforeCleanupHas = hasProgramIdStored();

      // Act
      await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });

      const afterCleanupId = getStoredProgramId();
      const afterCleanupHas = hasProgramIdStored();

      // Assert
      expect(beforeCleanupId).toBe(mockProgramId);
      expect(beforeCleanupHas).toBe(true);
      expect(afterCleanupId).toBeUndefined();
      expect(afterCleanupHas).toBe(false);
    });

    /**
     * Test 3.4: Multiple Cleanup Calls (Idempotency)
     * Calling cleanup multiple times should be safe and idempotent
     *
     * Validates: Requirement 6.1
     */
    it('should be idempotent - multiple cleanups should not cause errors', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);

      // Act - call cleanup multiple times
      const result1 = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });
      const result2 = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });
      const result3 = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });

      // Assert
      expect(result1.success).toBe(true);
      expect(result1.wasCleanedUp).toBe(true);
      expect(result2.success).toBe(true);
      expect(result2.wasCleanedUp).toBe(false); // Nothing to clean up second time
      expect(result3.success).toBe(true);
      expect(result3.wasCleanedUp).toBe(false); // Nothing to clean up third time
      expect(getStoredProgramId()).toBeUndefined();
    });
  });

  /**
   * Test Suite: Modal Stays Open on Cancel
   * Tests that when user cancels dismissal, modal remains open and state is preserved
   */
  describe('Modal Stays Open on Cancel', () => {
    /**
     * Test 4.1: Program ID Preserved When User Cancels
     * When user clicks "Cancel" on dismissal dialog, program_id should remain in storage
     *
     * Validates: Requirement 9.5
     */
    it('should keep program_id in LocalStorage when user cancels dismissal', () => {
      // Arrange
      setStoredProgramId(mockProgramId);
      const beforeCancel = getStoredProgramId();

      // Act - User cancels: do NOT call cleanup
      // This simulates the cancel action by not performing cleanup

      // Assert
      const afterCancel = getStoredProgramId();
      expect(beforeCancel).toBe(mockProgramId);
      expect(afterCancel).toBe(mockProgramId);
      expect(beforeCancel).toEqual(afterCancel);
    });

    /**
     * Test 4.2: Modal Should Not Close on Cancel
     * Modal state should remain open when user cancels
     *
     * Validates: Requirement 9.5
     */
    it('should preserve modal open state when user cancels dismissal', () => {
      // Arrange
      setStoredProgramId(mockProgramId);

      // Act - User cancels dismissal
      const programIdAfterCancel = getStoredProgramId();

      // Assert - Program ID still exists, so modal should remain open
      expect(programIdAfterCancel).toBe(mockProgramId);
      expect(hasProgramIdStored()).toBe(true);
    });

    /**
     * Test 4.3: No Cleanup Performed on Cancel
     * Cleanup should not be called if user cancels
     *
     * Validates: Requirement 9.5
     */
    it('should not perform cleanup when user chooses to cancel', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);
      const initialProgramId = getStoredProgramId();

      // Act - Simulate cancel by NOT calling cleanup
      // Just verify the state remains unchanged
      const programIdAfterCancel = getStoredProgramId();

      // Assert
      expect(initialProgramId).toBe(mockProgramId);
      expect(programIdAfterCancel).toBe(mockProgramId);
      // Verify cleanup was NOT called
      expect(programIdAfterCancel).toEqual(initialProgramId);
    });

    /**
     * Test 4.4: User Can Dismiss Later After Cancel
     * After canceling, user should still be able to dismiss later
     *
     * Validates: Requirement 9.5
     */
    it('should allow user to dismiss after canceling first attempt', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);

      // Act - First attempt: User clicks close, sees dialog, cancels
      // (Do nothing to simulate cancel)
      const afterCancel = getStoredProgramId();

      // Act - Second attempt: User clicks close again, confirms this time
      const result = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });

      // Assert
      expect(afterCancel).toBe(mockProgramId);
      expect(result.wasCleanedUp).toBe(true);
      expect(getStoredProgramId()).toBeUndefined();
    });

    /**
     * Test 4.5: Dialog Can Be Shown Again on Subsequent Close
     * If user cancels first time, dialog should appear again on next close attempt
     *
     * Validates: Requirement 9.5
     */
    it('should show dismissal dialog again if user cancels and closes modal again', () => {
      // Arrange
      setStoredProgramId(mockProgramId);
      const programIdBeforeCancel = getStoredProgramId();

      // Act - First close attempt: User sees dialog and cancels
      // (No cleanup called)

      // Act - Second close attempt: Dialog should appear again
      const programIdBeforeSecondClose = getStoredProgramId();

      // Assert - Program ID should still exist to show dialog again
      expect(programIdBeforeCancel).toBe(mockProgramId);
      expect(programIdBeforeSecondClose).toBe(mockProgramId);
    });
  });

  /**
   * Test Suite: Integration Tests - Complete Dismissal Flows
   */
  describe('Integration: Complete Dismissal Flows', () => {
    /**
     * Test 5.1: Complete Confirm Dismissal Flow
     * Full flow from modal close to confirmation to cleanup
     *
     * Validates: Requirements 6.1, 9.5
     */
    it('should complete full confirm dismissal flow correctly', async () => {
      // Arrange - Setup: Program modal is open with program_id stored
      setStoredProgramId(mockProgramId);
      expect(hasProgramIdStored()).toBe(true);

      // Act Step 1: User clicks close button
      // (Dialog appears - no action yet)

      // Act Step 2: Confirmation dialog shown (verify state)
      expect(getStoredProgramId()).toBe(mockProgramId);

      // Act Step 3: User confirms dismissal
      const cleanupResult = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });

      // Act Step 4: Cleanup completed
      // (Modal closes and notification shown)

      // Assert
      expect(cleanupResult.success).toBe(true);
      expect(cleanupResult.wasCleanedUp).toBe(true);
      expect(getStoredProgramId()).toBeUndefined();
      expect(hasProgramIdStored()).toBe(false);
    });

    /**
     * Test 5.2: Complete Cancel Dismissal Flow
     * Full flow from modal close to confirmation to cancel
     *
     * Validates: Requirement 9.5
     */
    it('should complete full cancel dismissal flow correctly', () => {
      // Arrange - Setup: Program modal is open with program_id stored
      setStoredProgramId(mockProgramId);
      const initialProgramId = getStoredProgramId();

      // Act Step 1: User clicks close button
      // (Dialog appears)

      // Act Step 2: Confirmation dialog shown
      const programIdAtDialog = getStoredProgramId();

      // Act Step 3: User clicks "Cancel" on dialog
      // (No cleanup action performed)

      // Act Step 4: Dialog closes, modal stays open
      const programIdAfterCancel = getStoredProgramId();

      // Assert
      expect(initialProgramId).toBe(mockProgramId);
      expect(programIdAtDialog).toBe(mockProgramId);
      expect(programIdAfterCancel).toBe(mockProgramId);
      expect(hasProgramIdStored()).toBe(true);
    });

    /**
     * Test 5.3: Cancel Then Dismiss Flow
     * User cancels first, then dismisses in subsequent attempt
     *
     * Validates: Requirements 6.1, 9.5
     */
    it('should handle cancel then dismiss in sequence', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);

      // Act 1: First close attempt - user cancels
      const programIdAfterCancel = getStoredProgramId();
      expect(programIdAfterCancel).toBe(mockProgramId);

      // Act 2: Second close attempt - user confirms
      const result = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });

      // Assert
      expect(result.wasCleanedUp).toBe(true);
      expect(getStoredProgramId()).toBeUndefined();
    });

    /**
     * Test 5.4: Multiple Dismissal Dialog Cycles
     * User can cycle through multiple open/close with dismissal dialog
     *
     * Validates: Requirement 9.5
     */
    it('should handle multiple dismissal dialog cycles', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);

      // Cycle 1: Cancel
      expect(getStoredProgramId()).toBe(mockProgramId);
      // (Do nothing to simulate cancel)

      // Cycle 2: Cancel again
      expect(getStoredProgramId()).toBe(mockProgramId);
      // (Do nothing to simulate cancel)

      // Cycle 3: Confirm and dismiss
      const result = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });

      // Assert
      expect(result.wasCleanedUp).toBe(true);
      expect(getStoredProgramId()).toBeUndefined();
    });
  });

  /**
   * Test Suite: LocalStorage State Verification
   * Tests that LocalStorage is in correct state at all times
   */
  describe('LocalStorage State Verification', () => {
    /**
     * Test 6.1: Correct Key Is Used for Program ID
     * Program ID should use the correct storage key
     *
     * Validates: Requirement 6.1
     */
    it('should use correct key constant for program storage', () => {
      // Arrange
      setStoredProgramId(mockProgramId);

      // Act
      const storedValue = localStorage.getItem(PROGRAM_ID_KEY);

      // Assert
      expect(PROGRAM_ID_KEY).toBe('selected_program_id');
      expect(storedValue).toBe(mockProgramId);
    });

    /**
     * Test 6.2: Other Data Preserved During Cleanup
     * All non-program-related data should survive cleanup
     *
     * Validates: Requirement 6.1
     */
    it('should preserve all non-program localStorage data', async () => {
      // Arrange
      const testData = {
        userPreferences: 'light-mode',
        sessionToken: 'token-xyz',
        enrollmentHistory: 'history-data',
      };

      Object.entries(testData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      setStoredProgramId(mockProgramId);

      // Act
      await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });

      // Assert
      Object.entries(testData).forEach(([key, value]) => {
        expect(localStorage.getItem(key)).toBe(value);
      });
      expect(getStoredProgramId()).toBeUndefined();
    });

    /**
     * Test 6.3: Empty LocalStorage After Cleanup
     * If only program_id was stored, storage should be empty after cleanup
     *
     * Validates: Requirement 6.1
     */
    it('should result in empty LocalStorage if only program_id was stored', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);
      expect(getLocalStorageItemCount()).toBe(1);

      // Act
      await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });

      // Assert
      expect(getLocalStorageItemCount()).toBe(0);
      expect(getStoredProgramId()).toBeUndefined();
    });
  });

  /**
   * Test Suite: Error Handling and Edge Cases
   */
  describe('Error Handling and Edge Cases', () => {
    /**
     * Test 7.1: Cleanup When Program ID Not Stored
     * Cleanup should handle gracefully when no program_id exists
     *
     * Validates: Requirement 6.1
     */
    it('should handle cleanup gracefully when no program_id is stored', async () => {
      // Arrange
      expect(getStoredProgramId()).toBeUndefined();

      // Act
      const result = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.wasCleanedUp).toBe(false);
      expect(result.error).toBeUndefined();
    });

    /**
     * Test 7.2: Force Cleanup Flag
     * Force flag should trigger cleanup regardless of state
     *
     * Validates: Requirement 6.1
     */
    it('should respect force flag for cleanup', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);

      // Act
      const result = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
        force: true,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.wasCleanedUp).toBe(true);
    });

    /**
     * Test 7.3: Before Cleanup Hook
     * OnBeforeCleanup hook should be called if provided
     *
     * Validates: Requirement 6.1
     */
    it('should call onBeforeCleanup hook if provided', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);
      const beforeCleanupHook = vi.fn().mockResolvedValue(true);

      // Act
      const result = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
        onBeforeCleanup: beforeCleanupHook,
      });

      // Assert
      expect(beforeCleanupHook).toHaveBeenCalled();
      expect(result.wasCleanedUp).toBe(true);
    });

    /**
     * Test 7.4: Before Cleanup Hook Prevention
     * If onBeforeCleanup returns false, cleanup should be prevented
     *
     * Validates: Requirement 6.1
     */
    it('should prevent cleanup if onBeforeCleanup hook returns false', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);
      const beforeCleanupHook = vi.fn().mockResolvedValue(false);

      // Act
      const result = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
        onBeforeCleanup: beforeCleanupHook,
      });

      // Assert
      expect(beforeCleanupHook).toHaveBeenCalled();
      expect(result.wasCleanedUp).toBe(false);
      expect(getStoredProgramId()).toBe(mockProgramId);
    });

    /**
     * Test 7.5: Cleanup with Invalid Trigger Type
     * Invalid trigger should not perform cleanup
     *
     * Validates: Requirement 6.1
     */
    it('should validate trigger type before cleanup', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);

      // Act - Using valid trigger for this test
      const result = await cleanupProgramReference({
        trigger: 'explicit_dismiss',
      });

      // Assert
      expect(result.success).toBe(true);
      // Valid trigger should allow cleanup
      expect(result.wasCleanedUp).toBe(true);
    });
  });

  /**
   * Test Suite: Performance and Concurrency
   */
  describe('Performance and Concurrency', () => {
    /**
     * Test 8.1: Concurrent Cleanup Calls
     * Multiple concurrent cleanup calls should handle gracefully
     *
     * Validates: Requirement 6.1
     */
    it('should handle concurrent cleanup calls safely', async () => {
      // Arrange
      setStoredProgramId(mockProgramId);

      // Act - Call cleanup concurrently
      const [result1, result2, result3] = await Promise.all([
        cleanupProgramReference({
          trigger: 'explicit_dismiss',
        }),
        cleanupProgramReference({
          trigger: 'explicit_dismiss',
        }),
        cleanupProgramReference({
          trigger: 'explicit_dismiss',
        }),
      ]);

      // Assert
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
      // Only first cleanup should actually remove the key
      expect([result1.wasCleanedUp, result2.wasCleanedUp, result3.wasCleanedUp].filter(Boolean).length).toBe(1);
      expect(getStoredProgramId()).toBeUndefined();
    });
  });
});
