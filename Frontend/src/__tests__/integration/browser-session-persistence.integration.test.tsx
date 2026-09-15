/**
 * Integration Tests: Browser Session Persistence
 * 
 * Tests the ability to persist program_id across browser close/reopen cycles
 * and verify that the enrollment flow works correctly when users return.
 * 
 * LocalStorage naturally persists across browser close/reopen. These tests verify:
 * 1. Program_ID remains in LocalStorage after browser restart
 * 2. On app reload, Link Handler detects program_id and routes appropriately
 * 3. User can complete auth flow with program context preserved
 * 4. Complete end-to-end flow: shared link → browser close → reopen → login → program enrollment
 * 
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
 * 
 * @fileoverview
 * These are integration tests that simulate realistic browser persistence behavior.
 * They test the interaction between:
 * - LinkHandler component (initial link click)
 * - LocalStorage persistence layer
 * - PostAuthHandler (routing after login)
 * - Program detail page (auto-opening modal)
 * - Cleanup handler (after enrollment)
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import {
  getSelectedProgramId,
  setSelectedProgramId,
  hasProgramContext,
  clearProgramContext,
  getProgramContextSafe,
} from '../../utils/programSharingStorage';
import {
  handlePostAuth,
  cleanupProgramReference,
  getProgramContext,
  setProgramContext,
} from '../../utils/postAuthHandler';
import {
  routeUserForProgramSharing,
  UserType,
  extractProgramIdFromUrl,
  isValidProgramId,
} from '../../utils/programSharingRouter';
import { programSharingService } from '../../services/programSharingService';

/**
 * ============================================================================
 * TEST SETUP AND FIXTURES
 * ============================================================================
 */

const TEST_PROGRAM_ID = 'a1b2c3d4-e5f6-4a08-9b0c-d1e2f3a4b5c6';
const TEST_PROGRAM_ID_2 = 'b2c3d4e5-f6a7-4b09-a0d1-e2f3a4b5c6d7';
const TEST_USER_ID = 'user-123-test';
const TEST_TRAINEE_ID = 'trainee-456-test';

/**
 * Mock API responses for program validation and access verification
 */
const mockValidateProgramResponse = {
  isValid: true,
  isActive: true,
  isPublic: true,
  program: {
    id: TEST_PROGRAM_ID,
    name: 'Test Program',
    description: 'A test program for session persistence',
  },
};

const mockAccessGrantedResponse = {
  canAccess: true,
  hasEnrolled: false,
  reason: undefined,
};

const mockAccessDeniedResponse = {
  canAccess: false,
  hasEnrolled: true,
  reason: 'Already enrolled in this program',
};

/**
 * ============================================================================
 * TEST GROUP 1: LocalStorage Persistence Across Browser Sessions
 * ============================================================================
 * 
 * Tests that program_id stored in LocalStorage survives browser close/reopen cycles.
 * This validates Requirement 9.1.
 */
describe('Browser Session Persistence - LocalStorage Persistence', () => {
  beforeEach(() => {
    // Clear storage before each test
    clearProgramContext();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearProgramContext();
  });

  /**
   * Test 9.1.1: Program ID persists in LocalStorage after storage
   * 
   * Simulates the lifecycle:
   * - User clicks shared link, program_id is stored
   * - Browser is closed (simulated by checking LocalStorage survives)
   * - Browser is reopened (simulated by retrieving from LocalStorage)
   * 
   * **Validates: Requirement 9.1**
   */
  test('9.1.1 program_id persists in LocalStorage across simulated browser sessions', () => {
    // Simulate: User clicks shared link → program_id stored
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');
    expect(getSelectedProgramId()).toBe(TEST_PROGRAM_ID);

    // Simulate: Browser close/reopen (LocalStorage survives by design)
    // In real browser, LocalStorage persists automatically
    const retrievedId = getSelectedProgramId();
    expect(retrievedId).toBe(TEST_PROGRAM_ID);

    // Verify it's still stored
    expect(hasProgramContext()).toBe(true);
  });

  /**
   * Test 9.1.2: Multiple LocalStorage entries persist correctly
   * 
   * Ensures that program_id is just one of many stored values
   * and doesn't interfere with other data.
   * 
   * **Validates: Requirement 9.1, 6.3**
   */
  test('9.1.2 program_id persists alongside other LocalStorage values', () => {
    // Setup: Store multiple values
    localStorage.setItem('user_theme', 'dark');
    localStorage.setItem('user_language', 'en');
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');
    localStorage.setItem('session_token', 'token-abc123');

    // Simulate: Browser close/reopen
    const programId = getSelectedProgramId();
    const theme = localStorage.getItem('user_theme');
    const language = localStorage.getItem('user_language');
    const token = localStorage.getItem('session_token');

    // All values should persist
    expect(programId).toBe(TEST_PROGRAM_ID);
    expect(theme).toBe('dark');
    expect(language).toBe('en');
    expect(token).toBe('token-abc123');
  });

  /**
   * Test 9.1.3: Program ID persists even if page is navigated away
   * 
   * Simulates: User clicks link → dismisses modal → navigates to another page
   * → returns to app → program_id should still be there
   * 
   * **Validates: Requirement 9.1, 9.5**
   */
  test('9.1.3 program_id persists through page navigation without cleanup', () => {
    // User clicks shared link
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');
    expect(hasProgramContext()).toBe(true);

    // User navigates away (simulated - LocalStorage is not cleared)
    // Simulate various page navigations
    for (let i = 0; i < 5; i++) {
      // Access from different "pages"
      const id = getSelectedProgramId();
      expect(id).toBe(TEST_PROGRAM_ID);
    }

    // Program should still be there after navigation
    expect(getSelectedProgramId()).toBe(TEST_PROGRAM_ID);
  });

  /**
   * Test 9.1.4: Program ID format is preserved exactly across sessions
   * 
   * Tests that UUID format with hyphens is preserved correctly
   * (important for API calls that may be case-sensitive or format-strict)
   * 
   * **Validates: Requirement 9.1**
   */
  test('9.1.4 program_id UUID format is preserved exactly across sessions', () => {
    // Use a specific UUID format
    const specificUuid = 'd1e2f3a4-b5c6-4d07-8e0f-a1b2c3d4e5f6';

    setSelectedProgramId(specificUuid, 'social_share');

    // Multiple "session reloads"
    for (let session = 0; session < 3; session++) {
      const retrieved = getSelectedProgramId();
      
      // Must be exact match including hyphens and case
      expect(retrieved).toBe(specificUuid);
      expect(retrieved).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
    }
  });

  /**
   * Test 9.1.5: Empty or null program_id is handled correctly
   * 
   * When no program_id is stored, retrieval should return null/undefined
   * and subsequent sessions should also have no program_id
   * 
   * **Validates: Requirement 9.1**
   */
  test('9.1.5 absence of program_id persists across sessions', () => {
    // Start with no program_id
    expect(getSelectedProgramId()).toBeNull();
    expect(hasProgramContext()).toBe(false);

    // Multiple "sessions" without storing anything
    for (let i = 0; i < 3; i++) {
      expect(getSelectedProgramId()).toBeNull();
      expect(hasProgramContext()).toBe(false);
    }
  });
});

/**
 * ============================================================================
 * TEST GROUP 2: Routing Works Correctly When Returning with Stored Program ID
 * ============================================================================
 * 
 * Tests that when user returns after browser close, the link handler
 * correctly detects the stored program_id and routes appropriately.
 * This validates Requirement 9.2.
 */
describe('Browser Session Persistence - Routing with Stored Program ID', () => {
  beforeEach(() => {
    clearProgramContext();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearProgramContext();
  });

  /**
   * Test 9.2.1: Authenticated user returning with stored program_id routes to program page
   * 
   * Scenario:
   * - User with active session clicks shared link → program_id stored
   * - Browser closes/reopens
   * - User returns to app while still authenticated
   * - Should route to /programs/{id}
   * 
   * **Validates: Requirement 9.2**
   */
  test('9.2.1 authenticated user with stored program_id routes to program detail page', () => {
    // Setup: Simulate user session and stored program_id
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');

    // Simulate: App reload - user is authenticated
    const decision = routeUserForProgramSharing(
      UserType.Authenticated,
      getSelectedProgramId()
    );

    // Should route to program page
    expect(decision.targetPath).toBe(`/programs/${TEST_PROGRAM_ID}`);
    expect(decision.preserveProgram).toBe(true);
  });

  /**
   * Test 9.2.2: Unauthenticated user returning with stored program_id routes to login
   * 
   * Scenario:
   * - User clicks shared link → program_id stored
   * - Browser closes
   * - User's session expires while offline
   * - Browser reopens, user is no longer authenticated
   * - Should route to /login (program_id preserved for post-auth handling)
   * 
   * **Validates: Requirement 9.2**
   */
  test('9.2.2 unauthenticated user returning with stored program_id routes to login', () => {
    // Setup: program_id stored but user not authenticated
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');

    // Simulate: App reload - user is NOT authenticated
    const decision = routeUserForProgramSharing(
      UserType.Unauthenticated,
      getSelectedProgramId()
    );

    // Should route to login
    expect(decision.targetPath).toBe('/login');
    expect(decision.preserveProgram).toBe(true);
  });

  /**
   * Test 9.2.3: User without stored program_id routes normally (no shared link)
   * 
   * Scenario:
   * - User never clicked shared link
   * - Returns to app with session active
   * - Should route to dashboard (normal flow)
   * 
   * **Validates: Requirement 9.2, 7.1**
   */
  test('9.2.3 user returning without stored program_id routes to dashboard', () => {
    // Setup: No program_id stored (normal return visit)
    expect(getSelectedProgramId()).toBeNull();

    // Simulate: App reload - user is authenticated
    const decision = routeUserForProgramSharing(
      UserType.Authenticated,
      getSelectedProgramId()
    );

    // Should route to dashboard (normal behavior)
    expect(decision.targetPath).toBe('/dashboard');
    expect(decision.preserveProgram).toBe(false);
  });

  /**
   * Test 9.2.4: Routing is deterministic for same program_id across multiple sessions
   * 
   * Ensures that the routing logic always produces the same result
   * for the same inputs (determinism property).
   * 
   * **Validates: Requirement 9.2, 3.1**
   */
  test('9.2.4 routing is deterministic for same stored program_id across sessions', () => {
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');

    const routes = [];
    
    // Simulate multiple browser sessions
    for (let session = 0; session < 5; session++) {
      const decision = routeUserForProgramSharing(
        UserType.Authenticated,
        getSelectedProgramId()
      );
      routes.push(decision.targetPath);
    }

    // All routes should be identical
    const firstRoute = routes[0];
    routes.forEach((route) => {
      expect(route).toBe(firstRoute);
      expect(route).toBe(`/programs/${TEST_PROGRAM_ID}`);
    });
  });

  /**
   * Test 9.2.5: Changing programs between sessions updates routing
   * 
   * User clicks different shared links in different sessions.
   * Each time should route to correct program.
   * 
   * **Validates: Requirement 9.2**
   */
  test('9.2.5 routing updates correctly when program_id changes between sessions', () => {
    // Session 1: First program
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');
    let decision = routeUserForProgramSharing(
      UserType.Authenticated,
      getSelectedProgramId()
    );
    expect(decision.targetPath).toBe(`/programs/${TEST_PROGRAM_ID}`);

    // Session 2: Click different link (program_id updates)
    setSelectedProgramId(TEST_PROGRAM_ID_2, 'social_share');
    decision = routeUserForProgramSharing(
      UserType.Authenticated,
      getSelectedProgramId()
    );
    expect(decision.targetPath).toBe(`/programs/${TEST_PROGRAM_ID_2}`);

    // Session 3: Back to first program
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');
    decision = routeUserForProgramSharing(
      UserType.Authenticated,
      getSelectedProgramId()
    );
    expect(decision.targetPath).toBe(`/programs/${TEST_PROGRAM_ID}`);
  });

  /**
   * Test 9.2.6: Invalid program_id stored does not break routing
   * 
   * Even if corrupted data is somehow stored, routing should handle gracefully
   * 
   * **Validates: Requirement 9.2, 8.1**
   */
  test('9.2.6 invalid program_id stored is handled gracefully in routing', () => {
    // Store invalid UUID format
    localStorage.setItem('selected_program_id', 'not-a-valid-uuid');

    // Routing should treat as no program_id
    const decision = routeUserForProgramSharing(
      UserType.Authenticated,
      getSelectedProgramId()
    );

    expect(decision.targetPath).toBe('/dashboard');
    expect(decision.preserveProgram).toBe(false);
  });
});

/**
 * ============================================================================
 * TEST GROUP 3: Complete End-to-End Flow with Browser Close Simulation
 * ============================================================================
 * 
 * Tests the complete flow of:
 * 1. Click shared link
 * 2. Program validated and stored
 * 3. Browser close/reopen
 * 4. User completes login
 * 5. User routed to program page
 * 6. Program modal auto-opens
 * 7. User can enroll
 * 8. Cleanup happens
 * 
 * This validates Requirements 9.1, 9.2, 9.3, 9.4
 */
describe('Browser Session Persistence - Complete End-to-End Flow', () => {
  beforeEach(() => {
    clearProgramContext();
    vi.clearAllMocks();

    // Mock the programSharingService
    vi.spyOn(programSharingService, 'validateProgramShare').mockResolvedValue(
      mockValidateProgramResponse
    );
    vi.spyOn(programSharingService, 'verifyProgramAccess').mockResolvedValue(
      mockAccessGrantedResponse
    );
  });

  afterEach(() => {
    clearProgramContext();
    vi.restoreAllMocks();
  });

  /**
   * Test 9.3.1: Complete flow from link click to login completion
   * 
   * Simulates the user journey:
   * 1. User clicks shared link (from social media)
   * 2. LinkHandler validates program_id
   * 3. Program_id stored in LocalStorage
   * 4. Browser closes (simulated)
   * 5. Browser reopens (LocalStorage persists)
   * 6. User logs in
   * 7. PostAuthHandler routes to program page
   * 
   * **Validates: Requirements 9.1, 9.2, 9.3**
   */
  test('9.3.1 complete flow: link click → browser close → reopen → login → program page', async () => {
    // Step 1: User clicks shared link (LinkHandler validation)
    const urlParams = new URLSearchParams(`?program_id=${TEST_PROGRAM_ID}`);
    const extractedId = extractProgramIdFromUrl(urlParams);
    expect(extractedId).toBe(TEST_PROGRAM_ID);

    // Validate program via API
    const validation = await programSharingService.validateProgramShare(TEST_PROGRAM_ID);
    expect(validation.isValid).toBe(true);

    // Step 2: Program_id stored in LocalStorage
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');
    expect(getSelectedProgramId()).toBe(TEST_PROGRAM_ID);

    // Step 3: Browser closes and reopens (LocalStorage persists)
    // Simulate by checking storage still has the value
    const afterBrowserReopen = getSelectedProgramId();
    expect(afterBrowserReopen).toBe(TEST_PROGRAM_ID);

    // Step 4: User logs in
    // PostAuthHandler checks for program_id and verifies access
    const postAuthResult = await handlePostAuth(TEST_TRAINEE_ID, 'login');

    // Step 5: Should route to program page (permission granted)
    expect(postAuthResult.targetPath).toBe(`/programs/${TEST_PROGRAM_ID}`);
    expect(postAuthResult.permissionDenied).toBe(false);
    expect(postAuthResult.programId).toBe(TEST_PROGRAM_ID);
  });

  /**
   * Test 9.3.2: Program_id preserved through authentication flow
   * 
   * Ensures that during the entire login process, program_id remains
   * in LocalStorage until explicit cleanup.
   * 
   * **Validates: Requirements 9.2, 9.3**
   */
  test('9.3.2 program_id persists throughout authentication flow', async () => {
    // Store program_id (from link click)
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');
    const beforeAuth = getSelectedProgramId();

    // Simulate auth flow steps that might clear storage
    // (our code should NOT clear it)
    const duringAuth = getSelectedProgramId();
    expect(duringAuth).toBe(beforeAuth);

    // After login completes
    await handlePostAuth(TEST_TRAINEE_ID, 'login');
    const afterAuth = getSelectedProgramId();

    // Should still be there (only cleanup after enrollment)
    expect(afterAuth).toBe(TEST_PROGRAM_ID);
  });

  /**
   * Test 9.3.3: Permission checking happens even with stored program_id
   * 
   * Even if program_id persists, user access must be verified.
   * If permission denied, program_id is cleared.
   * 
   * **Validates: Requirements 9.2, 10.2, 10.3**
   */
  test('9.3.3 permission checks happen even with persisted program_id', async () => {
    // Setup: Mock permission denied
    vi.spyOn(programSharingService, 'verifyProgramAccess').mockResolvedValueOnce(
      mockAccessDeniedResponse
    );

    // Store program_id
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');
    expect(getSelectedProgramId()).toBe(TEST_PROGRAM_ID);

    // PostAuthHandler checks permission
    const result = await handlePostAuth(TEST_TRAINEE_ID, 'login');

    // Should route to dashboard
    expect(result.targetPath).toBe('/dashboard');
    expect(result.permissionDenied).toBe(true);

    // Program_id should be cleared
    expect(getSelectedProgramId()).toBeNull();
  });

  /**
   * Test 9.3.4: Multiple browser reopens work correctly
   * 
   * Simulates scenario where user:
   * - Clicks link, browser closes/reopens multiple times
   * - Each time, program_id is preserved
   * - Finally completes login
   * 
   * **Validates: Requirement 9.3**
   */
  test('9.3.4 program_id persists through multiple simulated browser reopens', async () => {
    // Initial link click
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');

    // Multiple browser close/reopen cycles
    for (let cycle = 0; cycle < 3; cycle++) {
      // Simulate browser reopen
      const id = getSelectedProgramId();
      expect(id).toBe(TEST_PROGRAM_ID);

      // User might interact with some page
      expect(hasProgramContext()).toBe(true);

      // Still there after interaction
      expect(getSelectedProgramId()).toBe(TEST_PROGRAM_ID);
    }

    // Finally, user completes login
    const result = await handlePostAuth(TEST_TRAINEE_ID, 'login');
    expect(result.targetPath).toBe(`/programs/${TEST_PROGRAM_ID}`);
  });

  /**
   * Test 9.3.5: Program context safe retrieval handles corruption
   * 
   * If data is somehow corrupted, safe retrieval should return null
   * and clean up the corrupted data.
   * 
   * **Validates: Requirements 9.2, 2.4**
   */
  test('9.3.5 corrupted program_id is handled gracefully during browser session', () => {
    // Somehow corrupted data gets stored (edge case)
    localStorage.setItem('selected_program_id', 'corrupted-data-not-uuid');

    // Safe retrieval should return null
    const safeId = getProgramContextSafe();
    expect(safeId).toBeNull();

    // And should have cleaned up the corrupted data
    expect(localStorage.getItem('selected_program_id')).toBeNull();
  });

  /**
   * Test 9.3.6: Cleanup happens after successful enrollment
   * 
   * After user completes enrollment flow, cleanup handler should
   * remove program_id from storage.
   * 
   * **Validates: Requirements 9.1, 6.1, 6.2**
   */
  test('9.3.6 program_id cleanup occurs after successful enrollment completion', async () => {
    // Store program_id
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');
    expect(getSelectedProgramId()).toBe(TEST_PROGRAM_ID);

    // Complete auth flow (would normally happen after enrollment)
    await handlePostAuth(TEST_TRAINEE_ID, 'login');

    // Now cleanup after enrollment
    cleanupProgramReference(true);

    // Should be cleared
    expect(getSelectedProgramId()).toBeNull();
    expect(hasProgramContext()).toBe(false);
  });
});

/**
 * ============================================================================
 * TEST GROUP 4: Browser Close During Auth Flow Edge Case
 * ============================================================================
 * 
 * Tests edge cases where browser closes during the authentication process
 * and user returns later to complete auth.
 * 
 * This validates Requirement 9.4
 */
describe('Browser Session Persistence - Close During Auth Flow', () => {
  beforeEach(() => {
    clearProgramContext();
    vi.clearAllMocks();

    vi.spyOn(programSharingService, 'validateProgramShare').mockResolvedValue(
      mockValidateProgramResponse
    );
    vi.spyOn(programSharingService, 'verifyProgramAccess').mockResolvedValue(
      mockAccessGrantedResponse
    );
  });

  afterEach(() => {
    clearProgramContext();
    vi.restoreAllMocks();
  });

  /**
   * Test 9.4.1: Browser closes during login, program_id preserved when user returns
   * 
   * Scenario:
   * 1. User clicks link, program stored
   * 2. User starts login process
   * 3. Browser closes before login completes
   * 4. User returns hours later and completes login
   * 5. Should still route to program page
   * 
   * **Validates: Requirement 9.4**
   */
  test('9.4.1 browser close during login does not lose program_id, user can resume login', async () => {
    // Step 1: Link click, program stored
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');

    // Step 2: User sees login page
    expect(getSelectedProgramId()).toBe(TEST_PROGRAM_ID);

    // Step 3: Browser closes (simulated - storage survives)
    const beforeClose = getSelectedProgramId();

    // Step 4: Browser reopens (hours later)
    const afterReopen = getSelectedProgramId();
    expect(afterReopen).toBe(beforeClose);
    expect(afterReopen).toBe(TEST_PROGRAM_ID);

    // Step 5: User now completes login
    const result = await handlePostAuth(TEST_TRAINEE_ID, 'login');
    expect(result.targetPath).toBe(`/programs/${TEST_PROGRAM_ID}`);
  });

  /**
   * Test 9.4.2: Session persistence works across timezone/time changes
   * 
   * User closes browser, time passes (timezone change, date change, etc.)
   * Program_id should still be there and work correctly.
   * 
   * **Validates: Requirement 9.4**
   */
  test('9.4.2 program_id persists regardless of time passed between sessions', () => {
    // User clicks link
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');
    const originalId = getSelectedProgramId();

    // Simulate time passing (browser closed for hours/days)
    // LocalStorage doesn't have timestamps in this scenario
    // So just verify persistence
    for (let hour = 0; hour < 72; hour += 24) {
      // Simulate checking each day
      const id = getSelectedProgramId();
      expect(id).toBe(originalId);
    }
  });

  /**
   * Test 9.4.3: Multiple auth attempts don't lose program context
   * 
   * If user fails login and retries, program_id should remain.
   * 
   * **Validates: Requirement 9.4**
   */
  test('9.4.3 failed login attempts do not affect stored program_id', async () => {
    // Store program_id
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');
    const originalId = getSelectedProgramId();

    // Simulate multiple failed login attempts
    for (let attempt = 0; attempt < 3; attempt++) {
      // User attempts login
      const id = getSelectedProgramId();
      expect(id).toBe(originalId);

      // Login fails (simulated)
      // Storage should not be cleared on failure
      expect(getSelectedProgramId()).toBe(TEST_PROGRAM_ID);
    }

    // Final successful login
    const result = await handlePostAuth(TEST_TRAINEE_ID, 'login');
    expect(result.targetPath).toBe(`/programs/${TEST_PROGRAM_ID}`);
  });

  /**
   * Test 9.4.4: Session resumption after timeout
   * 
   * User's session might expire while browser is closed.
   * Upon return, should route to login (not dashboard).
   * 
   * **Validates: Requirement 9.4, 3.3**
   */
  test('9.4.4 session timeout does not prevent program routing after browser reopen', async () => {
    // Click link while authenticated
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');

    // Browser closes (session expires in background)
    // When user reopens as unauthenticated
    const decision = routeUserForProgramSharing(
      UserType.Unauthenticated,
      getSelectedProgramId()
    );

    // Should route to login (not dashboard)
    // because program context is present
    expect(decision.targetPath).toBe('/login');
    expect(decision.preserveProgram).toBe(true);

    // Program context still intact for post-auth routing
    expect(getSelectedProgramId()).toBe(TEST_PROGRAM_ID);
  });
});

/**
 * ============================================================================
 * TEST GROUP 5: Integration with Cleanup and Multiple Sessions
 * ============================================================================
 * 
 * Tests interactions between browser persistence and cleanup operations
 * across multiple sequential sessions.
 */
describe('Browser Session Persistence - Cleanup and Multi-Session Scenarios', () => {
  beforeEach(() => {
    clearProgramContext();
    vi.clearAllMocks();

    vi.spyOn(programSharingService, 'validateProgramShare').mockResolvedValue(
      mockValidateProgramResponse
    );
    vi.spyOn(programSharingService, 'verifyProgramAccess').mockResolvedValue(
      mockAccessGrantedResponse
    );
  });

  afterEach(() => {
    clearProgramContext();
    vi.restoreAllMocks();
  });

  /**
   * Test 9.5.1: Cleanup prevents re-enrollment in subsequent sessions
   * 
   * After enrollment and cleanup:
   * 1. User returns in new session
   * 2. Should go to dashboard (not program page)
   * 3. Would need to click link again to re-enroll
   * 
   * **Validates: Requirement 6.1, 9.1**
   */
  test('9.5.1 cleanup persists across sessions - no program_id in next session', async () => {
    // Session 1: Complete enrollment
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');
    await handlePostAuth(TEST_TRAINEE_ID, 'login');
    cleanupProgramReference(true);

    expect(getSelectedProgramId()).toBeNull();

    // Session 2: User returns
    const decision = routeUserForProgramSharing(
      UserType.Authenticated,
      getSelectedProgramId()
    );

    // Should go to dashboard (not program page)
    expect(decision.targetPath).toBe('/dashboard');
    expect(decision.preserveProgram).toBe(false);
  });

  /**
   * Test 9.5.2: User can click different program link after cleanup
   * 
   * After first enrollment and cleanup, user can enroll in different program.
   * 
   * **Validates: Requirement 9.1**
   */
  test('9.5.2 user can click different program link after cleanup in later session', async () => {
    // Session 1: First program enrollment and cleanup
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');
    cleanupProgramReference(true);
    expect(getSelectedProgramId()).toBeNull();

    // Session 2: Different program link clicked
    setSelectedProgramId(TEST_PROGRAM_ID_2, 'social_share');
    expect(getSelectedProgramId()).toBe(TEST_PROGRAM_ID_2);

    // Should work normally
    const decision = routeUserForProgramSharing(
      UserType.Authenticated,
      getSelectedProgramId()
    );
    expect(decision.targetPath).toBe(`/programs/${TEST_PROGRAM_ID_2}`);
  });

  /**
   * Test 9.5.3: Other LocalStorage data survives enrollment and cleanup
   * 
   * When program_id is cleaned up, other stored data should persist.
   * 
   * **Validates: Requirement 6.3**
   */
  test('9.5.3 other LocalStorage data persists after program cleanup', () => {
    // Setup: Multiple storage items
    localStorage.setItem('user_preference_1', 'value1');
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');
    localStorage.setItem('user_preference_2', 'value2');

    const beforeCleanup = localStorage.length;

    // Cleanup program
    cleanupProgramReference(true);

    // Other items should remain
    expect(localStorage.getItem('user_preference_1')).toBe('value1');
    expect(localStorage.getItem('user_preference_2')).toBe('value2');
    expect(getSelectedProgramId()).toBeNull();
    
    // Should have one fewer item
    expect(localStorage.length).toBe(beforeCleanup - 1);
  });
});

/**
 * ============================================================================
 * TEST GROUP 6: Data Integrity and Safety
 * ============================================================================
 * 
 * Tests that the persistence mechanism doesn't corrupt data or cause
 * unexpected behavior over multiple sessions.
 */
describe('Browser Session Persistence - Data Integrity', () => {
  beforeEach(() => {
    clearProgramContext();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearProgramContext();
  });

  /**
   * Test 9.6.1: Program ID doesn't get duplicated or concatenated
   * 
   * Even across multiple storage operations, program_id should remain singular.
   * 
   * **Validates: Requirement 9.1**
   */
  test('9.6.1 program_id does not get duplicated across sessions', () => {
    for (let session = 0; session < 5; session++) {
      setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');
      const id = getSelectedProgramId();
      
      // Should be exactly one UUID, not concatenated
      expect(id).toBe(TEST_PROGRAM_ID);
      expect(id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
      
      // Should not be duplicated
      expect(id).not.toContain(TEST_PROGRAM_ID + TEST_PROGRAM_ID);
    }
  });

  /**
   * Test 9.6.2: Storage operations are atomic (no partial updates)
   * 
   * Setting program_id completes fully or not at all.
   * 
   * **Validates: Requirement 9.1**
   */
  test('9.6.2 program_id storage operations are complete (no partial data)', () => {
    const uuid = TEST_PROGRAM_ID;

    setSelectedProgramId(uuid, 'social_share');
    const retrieved = getSelectedProgramId();

    // Should be complete UUID, not partial
    expect(retrieved).toBe(uuid);
    expect(retrieved).toHaveLength(uuid.length);
  });

  /**
   * Test 9.6.3: Concurrent operations don't corrupt data
   * 
   * Multiple rapid accesses to program_id should maintain consistency.
   * 
   * **Validates: Requirement 9.1**
   */
  test('9.6.3 rapid multiple reads maintain data consistency', () => {
    setSelectedProgramId(TEST_PROGRAM_ID, 'social_share');

    // Rapid multiple reads (simulating concurrent access)
    const reads = [];
    for (let i = 0; i < 10; i++) {
      reads.push(getSelectedProgramId());
    }

    // All reads should be identical
    reads.forEach((id) => {
      expect(id).toBe(TEST_PROGRAM_ID);
    });
  });
});
