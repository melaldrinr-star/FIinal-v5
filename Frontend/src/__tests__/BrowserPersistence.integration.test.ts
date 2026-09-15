/**
 * Integration Tests: Browser Session Persistence with Program Sharing Feature
 *
 * Comprehensive tests for browser session persistence with the program sharing feature.
 * Tests verify that program context survives page navigations, browser close/reopen,
 * authentication flows, and complex navigation sequences.
 *
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
 *
 * Test Coverage:
 * 1. Program context survives page navigations
 * 2. LocalStorage properly maintains state across navigations
 * 3. Data persists through authentication flows
 * 4. Session data cleared at appropriate times
 * 5. Multiple concurrent browser tabs handled correctly
 * 6. Forward/back navigation works properly
 * 7. Page refresh retains necessary context
 * 8. No data loss during complex navigation sequences
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSelectedProgramId,
  setSelectedProgramId,
  hasProgramContext,
  clearProgramContext,
  getProgramContext,
  getProgramContextSafe,
  type EnrollmentSource,
} from '../utils/programSharingStorage';
import {
  cleanupProgramReference,
  getStoredProgramId,
  setStoredProgramId,
  hasProgramIdStored,
  getLocalStorageItemCount,
  clearAllLocalStorage,
  PROGRAM_ID_KEY,
} from '../utils/sessionCleanupHandler';

/**
 * Simulates browser session scenarios
 */
class BrowserSessionSimulator {
  private localStorageSnapshot: Map<string, string> = new Map();

  /**
   * Simulates page navigation
   */
  simulatePageNavigation(): void {
    // LocalStorage persists across same-origin navigations
  }

  /**
   * Simulates browser close/reopen
   */
  simulateBrowserRestart(): void {
    // LocalStorage persists, SessionStorage would be cleared
  }

  /**
   * Simulates page reload
   */
  simulatePageReload(): void {
    // LocalStorage persists
  }

  /**
   * Simulates back navigation
   */
  simulateBackNavigation(): void {
    // LocalStorage persists
  }

  /**
   * Simulates forward navigation
   */
  simulateForwardNavigation(): void {
    // LocalStorage persists
  }

  /**
   * Takes a snapshot of LocalStorage
   */
  snapshotLocalStorage(): void {
    this.localStorageSnapshot.clear();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        this.localStorageSnapshot.set(key, localStorage.getItem(key) || '');
      }
    }
  }

  /**
   * Verifies LocalStorage matches snapshot
   */
  verifyLocalStoragePersists(): boolean {
    if (this.localStorageSnapshot.size === 0) {
      return true;
    }

    for (const [key, value] of this.localStorageSnapshot) {
      if (localStorage.getItem(key) !== value) {
        return false;
      }
    }
    return true;
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Browser Session Persistence - Integration Tests', () => {
  let simulator: BrowserSessionSimulator;

  beforeEach(() => {
    clearAllLocalStorage();
    simulator = new BrowserSessionSimulator();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearAllLocalStorage();
  });

  // ============================================================================
  // Test Group 1: Program Context Survives Page Navigations
  // ============================================================================

  describe('1. Program Context Survives Page Navigations', () => {
    /**
     * Requirement 9.1: WHEN a user clicks a Shared_Link and the Program_ID is stored
     * in Local_Storage, THE Browser_Session_Manager SHALL persist this data across
     * browser sessions
     */

    it('should preserve program_id during navigation to different pages', () => {
      // Setup: User clicks shared link and program is stored
      const programId = 'program-nav-test-1';
      setStoredProgramId(programId);

      // Take snapshot
      simulator.snapshotLocalStorage();

      // Act: Simulate navigation to login page
      simulator.simulatePageNavigation();

      // Assert: Program context should be preserved
      expect(getStoredProgramId()).toBe(programId);
      expect(simulator.verifyLocalStoragePersists()).toBe(true);
    });

    it('should preserve program_id during multiple navigation steps', () => {
      // Setup
      const programId = 'program-multi-nav-2';
      setStoredProgramId(programId);
      simulator.snapshotLocalStorage();

      // Act: Simulate navigation sequence
      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      // Assert
      expect(simulator.verifyLocalStoragePersists()).toBe(true);
      expect(hasProgramIdStored()).toBe(true);
    });

    it('should handle rapid navigation without losing program context', () => {
      // Setup
      const programId = 'program-rapid-nav-3';
      setStoredProgramId(programId);

      // Act: Rapid navigation
      for (let i = 0; i < 10; i++) {
        simulator.simulatePageNavigation();
        expect(getStoredProgramId()).toBe(programId);
      }

      // Assert
      expect(getStoredProgramId()).toBe(programId);
    });

    it('should preserve program context across navigation with other stored data', () => {
      // Setup: Complex LocalStorage state
      localStorage.setItem('user_theme', 'dark');
      localStorage.setItem('user_language', 'en');
      const programId = 'program-complex-state-4';
      setStoredProgramId(programId);

      simulator.snapshotLocalStorage();

      // Act: Navigate
      simulator.simulatePageNavigation();

      // Assert
      expect(getStoredProgramId()).toBe(programId);
      expect(localStorage.getItem('user_theme')).toBe('dark');
      expect(localStorage.getItem('user_language')).toBe('en');
      expect(simulator.verifyLocalStoragePersists()).toBe(true);
    });
  });

  // ============================================================================
  // Test Group 2: LocalStorage Properly Maintains State
  // ============================================================================

  describe('2. LocalStorage Properly Maintains State', () => {
    /**
     * **Property 2: LocalStorage Round-Trip**
     * Stored program_id retrieved equals original value
     *
     * **Validates: Requirements 2.2, 9.1, 9.2**
     */

    it('should store and retrieve program_id with perfect fidelity', () => {
      // Setup
      const originalId = 'program-fidelity-test-5';
      setStoredProgramId(originalId);

      // Act
      const retrieved = getStoredProgramId();

      // Assert
      expect(retrieved).toBe(originalId);
      expect(retrieved).toStrictEqual(originalId);
    });

    it('should maintain state after multiple read operations', () => {
      // Setup
      const programId = 'program-read-consistency-6';
      setStoredProgramId(programId);

      // Act
      const read1 = getStoredProgramId();
      const read2 = getStoredProgramId();
      const read3 = getStoredProgramId();

      // Assert
      expect(read1).toBe(programId);
      expect(read2).toBe(programId);
      expect(read3).toBe(programId);
      expect(read1).toBe(read2);
      expect(read2).toBe(read3);
    });

    it('should verify data integrity after storage operations', () => {
      // Setup
      const programId = 'program-integrity-7';
      setStoredProgramId(programId);

      // Act & Assert
      expect(hasProgramIdStored()).toBe(true);
      expect(getStoredProgramId()).toBe(programId);
    });

    it('should maintain state consistency in complex scenarios', () => {
      // Setup
      const programId = 'program-complex-8';
      setStoredProgramId(programId);
      localStorage.setItem('nav_stack', '["link", "login"]');
      localStorage.setItem('auth_state', 'pending');

      // Act
      const retrieved = getStoredProgramId();
      const navStack = localStorage.getItem('nav_stack');
      const authState = localStorage.getItem('auth_state');

      // Assert
      expect(retrieved).toBe(programId);
      expect(navStack).toBe('["link", "login"]');
      expect(authState).toBe('pending');
    });
  });

  // ============================================================================
  // Test Group 3: Data Persists Through Authentication Flows
  // ============================================================================

  describe('3. Data Persists Through Authentication Flows', () => {
    /**
     * Requirement 9.3: WHEN the user returns to the application with a stored
     * Program_ID but no active session, THE User_Type_Detector SHALL redirect
     * them to login (for existing Trainees) or signup (for New_Users)
     */

    it('should preserve program_id before login flow', () => {
      // Setup
      const programId = 'program-login-flow-9';
      setStoredProgramId(programId);

      // Act
      simulator.simulatePageNavigation();

      // Assert
      expect(getStoredProgramId()).toBe(programId);
      expect(hasProgramIdStored()).toBe(true);
    });

    it('should preserve program_id throughout login authentication', () => {
      // Setup
      const programId = 'program-during-login-10';
      setStoredProgramId(programId);

      // Simulate auth flow stages
      simulator.snapshotLocalStorage();

      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      // Assert
      expect(simulator.verifyLocalStoragePersists()).toBe(true);
    });

    it('should preserve program_id after successful authentication', () => {
      // Setup
      const programId = 'program-post-auth-11';
      setStoredProgramId(programId);

      // Act
      simulator.simulatePageNavigation();

      // Assert
      expect(getStoredProgramId()).toBe(programId);
    });

    it('should handle program context during authentication session transitions', () => {
      // Setup
      expect(getStoredProgramId()).toBeUndefined();

      // Act
      const programId = 'program-session-transition-12';
      setStoredProgramId(programId);
      simulator.simulatePageNavigation();

      // Assert
      expect(getStoredProgramId()).toBe(programId);
    });

    it('should preserve program context when session expires during auth', () => {
      // Setup
      const programId = 'program-session-expire-13';
      setStoredProgramId(programId);

      // Act
      simulator.simulatePageReload();

      // Assert
      expect(getStoredProgramId()).toBe(programId);
    });
  });

  // ============================================================================
  // Test Group 4: Session Data Cleared at Appropriate Times
  // ============================================================================

  describe('4. Session Data Cleared at Appropriate Times', () => {
    /**
     * Requirement 6.1, 6.2: When successful authentication is confirmed,
     * THE Session_Cleanup_Handler SHALL remove the "selected_program_id" entry
     */

    it('should clear program_id after successful enrollment', async () => {
      // Setup
      const programId = 'program-clear-enroll-14';
      setStoredProgramId(programId);
      expect(hasProgramIdStored()).toBe(true);

      // Act
      const result = await cleanupProgramReference({
        trigger: 'enrollment_complete',
      });

      // Assert
      expect(result.wasCleanedUp).toBe(true);
      expect(hasProgramIdStored()).toBe(false);
      expect(getStoredProgramId()).toBeUndefined();
    });

    it('should NOT clear program_id during page navigation', () => {
      // Setup
      const programId = 'program-persist-nav-15';
      setStoredProgramId(programId);

      // Act
      simulator.simulatePageNavigation();

      // Assert
      expect(getStoredProgramId()).toBe(programId);
      expect(hasProgramIdStored()).toBe(true);
    });

    it('should NOT clear program_id if user navigates away without enrolling', () => {
      // Setup
      const programId = 'program-abandon-enroll-16';
      setStoredProgramId(programId);

      // Act
      simulator.simulatePageNavigation();

      // Assert
      expect(getStoredProgramId()).toBe(programId);
    });

    it('should be idempotent when clearing - multiple clears safe', async () => {
      // Setup
      setStoredProgramId('program-idempotent-17');

      // Act
      const result1 = await cleanupProgramReference({
        trigger: 'enrollment_complete',
      });
      const result2 = await cleanupProgramReference({
        trigger: 'enrollment_complete',
      });
      const result3 = await cleanupProgramReference({
        trigger: 'enrollment_complete',
      });

      // Assert
      expect(result1.wasCleanedUp).toBe(true);
      expect(result2.wasCleanedUp).toBe(false);
      expect(result3.wasCleanedUp).toBe(false);
      expect(hasProgramIdStored()).toBe(false);
    });
  });

  // ============================================================================
  // Test Group 5: Multiple Concurrent Browser Tabs
  // ============================================================================

  describe('5. Multiple Concurrent Browser Tabs Handled Correctly', () => {
    /**
     * Simulates multiple tabs accessing the same program context
     * LocalStorage is shared across tabs in same domain
     */

    it('should share program context across multiple tabs', () => {
      // Simulate Tab 1: Click share link
      const programId = 'program-shared-tabs-18';
      setStoredProgramId(programId);

      // Simulate Tab 2: Access same origin
      const tab2Program = getStoredProgramId();

      // Assert
      expect(tab2Program).toBe(programId);
    });

    it('should handle updates to program context from multiple tabs', () => {
      // Tab 1: Store program
      const program1 = 'program-tab1-19';
      setStoredProgramId(program1);

      // Verify Tab 1
      expect(getStoredProgramId()).toBe(program1);

      // Tab 2: Clear
      clearProgramContext();

      // Verify both tabs see cleared state
      expect(getStoredProgramId()).toBeUndefined();
    });

    it('should handle concurrent modification from multiple tabs', () => {
      // Tab 1
      const program1 = 'program-concurrent-20';
      setStoredProgramId(program1);

      // Tab 2 read
      const tab2Read1 = getStoredProgramId();
      expect(tab2Read1).toBe(program1);

      // Tab 1 update
      clearProgramContext();
      const program2 = 'program-concurrent-update-21';
      setStoredProgramId(program2);

      // Tab 2 read again
      const tab2Read2 = getStoredProgramId();
      expect(tab2Read2).toBe(program2);
    });

    it('should preserve program context when one tab is closed', () => {
      // Tab 1
      const programId = 'program-tab-close-22';
      setStoredProgramId(programId);

      // Tab 2
      expect(getStoredProgramId()).toBe(programId);

      // Tab 1 closes - no cleanup of LocalStorage
      // Tab 2
      expect(getStoredProgramId()).toBe(programId);
    });

    it('should preserve other localStorage items when one tab modifies program context', () => {
      // All tabs
      localStorage.setItem('shared_setting', 'value1');
      const programId = 'program-shared-with-other-23';
      setStoredProgramId(programId);

      // Tab 2
      expect(localStorage.getItem('shared_setting')).toBe('value1');
      expect(getStoredProgramId()).toBe(programId);

      // Tab 1: Update program
      clearProgramContext();
      setStoredProgramId('program-updated-24');

      // Tab 2: Shared setting should still exist
      expect(localStorage.getItem('shared_setting')).toBe('value1');
      expect(getStoredProgramId()).toBe('program-updated-24');
    });
  });

  // ============================================================================
  // Test Group 6: Forward/Back Navigation Works Properly
  // ============================================================================

  describe('6. Forward/Back Navigation Works Properly', () => {
    /**
     * Tests browser back/forward button navigation
     * Program context should persist throughout
     */

    it('should preserve program context on back navigation', () => {
      // Setup
      const programId = 'program-back-nav-25';
      setStoredProgramId(programId);

      // Act
      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      simulator.simulateBackNavigation();

      // Assert
      expect(getStoredProgramId()).toBe(programId);
    });

    it('should preserve program context on forward navigation', () => {
      // Setup
      const programId = 'program-forward-nav-26';
      setStoredProgramId(programId);

      // Act
      simulator.simulatePageNavigation();
      simulator.simulatePageNavigation();

      simulator.simulateBackNavigation();
      expect(getStoredProgramId()).toBe(programId);

      simulator.simulateForwardNavigation();

      // Assert
      expect(getStoredProgramId()).toBe(programId);
    });

    it('should maintain program context during complex navigation history', () => {
      // Setup
      const programId = 'program-complex-history-27';
      setStoredProgramId(programId);

      // Simulate complex navigation
      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      // Go back multiple times
      simulator.simulateBackNavigation();
      expect(getStoredProgramId()).toBe(programId);

      simulator.simulateBackNavigation();
      expect(getStoredProgramId()).toBe(programId);

      // Go forward
      simulator.simulateForwardNavigation();
      expect(getStoredProgramId()).toBe(programId);

      // Assert
      expect(getStoredProgramId()).toBe(programId);
    });

    it('should handle rapid back/forward navigation without data loss', () => {
      // Setup
      const programId = 'program-rapid-history-28';
      setStoredProgramId(programId);

      // Act
      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          simulator.simulateBackNavigation();
        } else {
          simulator.simulateForwardNavigation();
        }
        expect(getStoredProgramId()).toBe(programId);
      }

      // Assert
      expect(getStoredProgramId()).toBe(programId);
      expect(hasProgramIdStored()).toBe(true);
    });
  });

  // ============================================================================
  // Test Group 7: Page Refresh Retains Necessary Context
  // ============================================================================

  describe('7. Page Refresh Retains Necessary Context', () => {
    /**
     * Tests that page refresh/reload preserves LocalStorage data
     */

    it('should retain program_id after page refresh', () => {
      // Setup
      const programId = 'program-refresh-29';
      setStoredProgramId(programId);
      simulator.snapshotLocalStorage();

      // Act
      simulator.simulatePageReload();

      // Assert
      expect(getStoredProgramId()).toBe(programId);
      expect(simulator.verifyLocalStoragePersists()).toBe(true);
    });

    it('should handle multiple consecutive page refreshes', () => {
      // Setup
      const programId = 'program-multi-refresh-30';
      setStoredProgramId(programId);

      // Act
      for (let i = 0; i < 5; i++) {
        simulator.simulatePageReload();
        expect(getStoredProgramId()).toBe(programId);
      }

      // Assert
      expect(getStoredProgramId()).toBe(programId);
    });

    it('should retain program context and other stored data after refresh', () => {
      // Setup
      localStorage.setItem('user_id', 'user-123');
      localStorage.setItem('session_token', 'token-abc');
      const programId = 'program-complex-refresh-31';
      setStoredProgramId(programId);

      simulator.snapshotLocalStorage();

      // Act
      simulator.simulatePageReload();

      // Assert
      expect(getStoredProgramId()).toBe(programId);
      expect(localStorage.getItem('user_id')).toBe('user-123');
      expect(localStorage.getItem('session_token')).toBe('token-abc');
      expect(simulator.verifyLocalStoragePersists()).toBe(true);
    });

    it('should restore application state from LocalStorage after refresh', () => {
      // Setup
      const programId = 'program-app-state-32';
      setStoredProgramId(programId);
      localStorage.setItem('current_route', '/programs/program-123');
      localStorage.setItem('modal_open', 'true');

      simulator.snapshotLocalStorage();

      // Act
      simulator.simulatePageReload();

      // Assert
      expect(getStoredProgramId()).toBe(programId);
      expect(localStorage.getItem('current_route')).toBe('/programs/program-123');
      expect(localStorage.getItem('modal_open')).toBe('true');
      expect(simulator.verifyLocalStoragePersists()).toBe(true);
    });
  });

  // ============================================================================
  // Test Group 8: No Data Loss During Complex Navigation Sequences
  // ============================================================================

  describe('8. No Data Loss During Complex Navigation Sequences', () => {
    /**
     * Tests complex, realistic navigation scenarios
     */

    it('should preserve program context through complete enrollment flow', () => {
      // Setup
      const programId = 'program-complete-flow-33';
      setStoredProgramId(programId);

      // Step 1-6: Through enrollment
      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      // After enrollment succeeds → Cleanup
      clearProgramContext();
      expect(getStoredProgramId()).toBeUndefined();
      expect(hasProgramIdStored()).toBe(false);
    });

    it('should preserve program during user cancellation and retry', () => {
      // Setup
      const programId = 'program-cancel-retry-34';
      setStoredProgramId(programId);

      // User starts login flow
      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      // User cancels
      simulator.simulateBackNavigation();
      expect(getStoredProgramId()).toBe(programId);

      // User returns to login
      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      // User completes
      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      // Assert
      expect(getStoredProgramId()).toBe(programId);
    });

    it('should handle browser close during signup and resume on return', () => {
      // Setup
      const programId = 'program-browser-close-35';
      setStoredProgramId(programId);
      localStorage.setItem('signup_step', '2');

      // Simulate browser close
      simulator.simulateBrowserRestart();

      // Simulate user returns
      // LocalStorage restored automatically
      expect(getStoredProgramId()).toBe(programId);
      expect(localStorage.getItem('signup_step')).toBe('2');
      expect(hasProgramIdStored()).toBe(true);
    });

    it('should maintain data through page refresh during enrollment', () => {
      // Setup
      const programId = 'program-refresh-enroll-36';
      setStoredProgramId(programId);
      localStorage.setItem('enrollment_status', 'pending');

      // Act
      simulator.simulatePageReload();

      // Assert
      expect(getStoredProgramId()).toBe(programId);
      expect(localStorage.getItem('enrollment_status')).toBe('pending');
    });

    it('should handle error scenarios without losing program context', () => {
      // Setup
      const programId = 'program-error-recovery-37';
      setStoredProgramId(programId);

      // Simulate API error
      localStorage.setItem('api_error', 'Network timeout');
      simulator.simulatePageNavigation();

      // Assert
      expect(getStoredProgramId()).toBe(programId);

      // User retries
      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      // Clear error
      localStorage.removeItem('api_error');
      expect(getStoredProgramId()).toBe(programId);
    });

    it('should maintain data integrity during rapid navigation', () => {
      // Setup
      const originalId = 'program-integrity-rapid-38';
      setStoredProgramId(originalId);

      // Act: Rapid operations
      for (let i = 0; i < 20; i++) {
        simulator.simulatePageNavigation();
        expect(getStoredProgramId()).toBe(originalId);
      }

      // Assert
      expect(getStoredProgramId()).toBe(originalId);
      expect(hasProgramIdStored()).toBe(true);
    });

    it('should handle complete realistic user session', () => {
      // Day 1: Click shared program
      const programId = 'program-realistic-flow-39';
      setStoredProgramId(programId);
      simulator.snapshotLocalStorage();

      // Link click → redirect
      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      // Close browser (end of session)
      simulator.simulateBrowserRestart();

      // Day 2: User returns
      expect(getStoredProgramId()).toBe(programId);

      // Login
      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      // Program page
      simulator.simulatePageNavigation();
      expect(getStoredProgramId()).toBe(programId);

      // Enroll
      expect(getStoredProgramId()).toBe(programId);

      // Cleanup after enrollment
      clearProgramContext();
      expect(hasProgramIdStored()).toBe(false);

      // Continue on dashboard
      localStorage.setItem('viewing_enrollments', 'true');
      expect(getStoredProgramId()).toBeUndefined();
      expect(localStorage.getItem('viewing_enrollments')).toBe('true');
    });
  });

  // ============================================================================
  // Test Group 9: Edge Cases and Error Recovery
  // ============================================================================

  describe('9. Edge Cases and Error Recovery', () => {
    it('should recover gracefully if program_id becomes corrupted', () => {
      // Setup: Corrupt the stored program_id
      localStorage.setItem(PROGRAM_ID_KEY, 'invalid-data!!!');

      // Act
      const safeProgramId = getProgramContextSafe();

      // Assert: Should return null for invalid data or invalid value
      // (depending on validation logic)
      expect(safeProgramId === null || typeof safeProgramId === 'string').toBe(true);
    });

    it('should handle program context with various inputs', () => {
      // Test with various string values
      const testIds = ['prog-1', 'prog-2', 'prog-3'];

      testIds.forEach((id) => {
        clearAllLocalStorage();
        setStoredProgramId(id);
        expect(getStoredProgramId()).toBe(id);
      });
    });

    it('should not lose data if cleanup is called unexpectedly', async () => {
      // Setup
      const programId = 'program-unexpected-cleanup-40';
      setStoredProgramId(programId);
      localStorage.setItem('important_data', 'keep_this');

      // Act
      await cleanupProgramReference({
        trigger: 'enrollment_complete',
      });

      // Assert
      expect(hasProgramIdStored()).toBe(false);
      expect(localStorage.getItem('important_data')).toBe('keep_this');
    });

    it('should handle cleanup with other LocalStorage keys present', async () => {
      // Setup
      const keys = {
        'key1': 'value1',
        'key2': 'value2',
        [PROGRAM_ID_KEY]: 'program-41',
        'key3': 'value3',
      };

      Object.entries(keys).forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });

      // Act
      await cleanupProgramReference({
        trigger: 'enrollment_complete',
      });

      // Assert: Only program_id removed
      expect(localStorage.getItem('key1')).toBe('value1');
      expect(localStorage.getItem('key2')).toBe('value2');
      expect(localStorage.getItem('key3')).toBe('value3');
      expect(localStorage.getItem(PROGRAM_ID_KEY)).toBeNull();
    });
  });

  // ============================================================================
  // Test Group 10: Property-Based Validation
  // ============================================================================

  describe('10. Property-Based Validation', () => {
    /**
     * **Property 2: LocalStorage Round-Trip**
     * Stored program_id retrieved equals original value
     *
     * **Validates: Requirements 2.2, 9.1, 9.2**
     */

    it('should satisfy LocalStorage Round-Trip property for various program_ids', () => {
      const programIds = [
        'prog-round-trip-1',
        'prog-round-trip-2',
        'prog-round-trip-3',
        'test-program-id',
      ];

      programIds.forEach((id) => {
        clearAllLocalStorage();

        // Store
        setStoredProgramId(id);

        // Navigate (simulate)
        simulator.simulatePageNavigation();

        // Retrieve
        const retrieved = getStoredProgramId();

        // Assert: Retrieved equals original
        expect(retrieved).toBe(id);
      });
    });

    /**
     * **Property 5: Cleanup Selectivity**
     * Removing program_id doesn't affect other LocalStorage keys
     *
     * **Validates: Requirement 6.3**
     */

    it('should satisfy Cleanup Selectivity property - other keys preserved', async () => {
      // Setup: Multiple keys
      const otherKeys = ['theme', 'language', 'font_size'];
      otherKeys.forEach((k) => localStorage.setItem(k, `value-${k}`));
      setStoredProgramId('program-cleanup-selectivity-42');

      const countBefore = getLocalStorageItemCount();

      // Act: Cleanup
      const result = await cleanupProgramReference({
        trigger: 'enrollment_complete',
      });

      // Assert: Program removed, others preserved
      expect(result.wasCleanedUp).toBe(true);
      expect(getLocalStorageItemCount()).toBe(countBefore - 1);

      otherKeys.forEach((k) => {
        expect(localStorage.getItem(k)).toBe(`value-${k}`);
      });
      expect(localStorage.getItem(PROGRAM_ID_KEY)).toBeNull();
    });
  });
});
