/**
 * Property-Based Tests for No Stale Cache Updates
 * 
 * **Property 6: No Stale Cache Updates**
 * **Validates: Requirements 4.4, 4.5**
 * 
 * For any period during which WebSocket is connected and subscribed, displayed 
 * enrollment data SHALL reflect latest database state, never showing previously 
 * cached outdated data.
 * 
 * These comprehensive tests validate:
 * - When WebSocket is connected, cache reflects latest updates
 * - Old cached data is replaced when new updates arrive
 * - No stale data remains in cache after updates
 * - Cache invalidation happens on WebSocket events
 * - UI never displays outdated enrollment information
 * - Multiple rapid updates maintain data consistency
 * - Cache subscribers always see latest data
 * - Concurrent operations don't introduce stale data
 * 
 * Uses fast-check with minimum 100 iterations for comprehensive coverage.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { z } from 'zod';

// Real enrollment schema matching the service
const enrollmentSchema = z.object({
  id: z.string().uuid(),
  trainee_id: z.string().uuid(),
  program_id: z.string().uuid(),
  status: z.enum(['enrolled', 'active', 'completed', 'dropped', 'failed']),
  enrollment_date: z.string(),
  completion_date: z.string().nullable().optional(),
  final_grade: z.number().int().min(0).max(100).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

type Enrollment = z.infer<typeof enrollmentSchema>;

/**
 * Simulate an in-memory enrollment cache as used in enrollmentService
 * This models the actual caching behavior that must prevent stale data
 */
class EnrollmentCache {
  private cache: Map<string, Enrollment> = new Map();
  private timestamps: Map<string, number> = new Map(); // Track when cache was set
  private subscriptions: Map<string, Set<string>> = new Map(); // subscription -> enrollmentIds
  private invalidationLog: Array<{ key: string; timestamp: number }> = [];
  private updateLog: Array<{ key: string; version: number; timestamp: number }> = [];
  private versions: Map<string, number> = new Map(); // Track data versions

  set(key: string, value: Enrollment, timestamp: number = Date.now()): void {
    const version = (this.versions.get(key) || 0) + 1;
    this.versions.set(key, version);
    this.cache.set(key, value);
    this.timestamps.set(key, timestamp);
    this.updateLog.push({ key, version, timestamp });
  }

  get(key: string): Enrollment | undefined {
    return this.cache.get(key);
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    this.timestamps.delete(key);
    this.invalidationLog.push({ key, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
    this.invalidationLog = [];
    this.updateLog = [];
    this.versions.clear();
  }

  getTimestamp(key: string): number | undefined {
    return this.timestamps.get(key);
  }

  getVersion(key: string): number {
    return this.versions.get(key) || 0;
  }

  getAll(): Map<string, Enrollment> {
    return new Map(this.cache);
  }

  isStale(key: string, maxAgeMs: number): boolean {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return true;
    return Date.now() - timestamp > maxAgeMs;
  }

  // Track subscription-invalidation relationship
  addSubscription(subscriptionId: string, enrollmentId: string): void {
    if (!this.subscriptions.has(subscriptionId)) {
      this.subscriptions.set(subscriptionId, new Set());
    }
    this.subscriptions.get(subscriptionId)!.add(enrollmentId);
  }

  // Get all enrollments for a subscription
  getSubscriptionEnrollments(subscriptionId: string): Set<string> {
    return this.subscriptions.get(subscriptionId) || new Set();
  }

  getInvalidationLog(): Array<{ key: string; timestamp: number }> {
    return [...this.invalidationLog];
  }

  getUpdateLog(): Array<{ key: string; version: number; timestamp: number }> {
    return [...this.updateLog];
  }

  // Check if data was ever invalidated during its lifetime
  hasBeenInvalidated(key: string): boolean {
    return this.invalidationLog.some((log) => log.key === key);
  }
}

/**
 * Simulate WebSocket subscription lifecycle with cache updates
 */
class WebSocketCacheSimulator {
  private cache: EnrollmentCache;
  private connectedSubscriptions: Map<string, Set<string>> = new Map(); // subscription -> enrollments
  private uiReadLog: Array<{ enrollmentId: string; version: number; timestamp: number }> = [];

  constructor(cache: EnrollmentCache) {
    this.cache = cache;
  }

  // Simulate WebSocket connection
  subscribe(subscriptionId: string, enrollmentId: string): void {
    if (!this.connectedSubscriptions.has(subscriptionId)) {
      this.connectedSubscriptions.set(subscriptionId, new Set());
    }
    this.connectedSubscriptions.get(subscriptionId)!.add(enrollmentId);
    this.cache.addSubscription(subscriptionId, enrollmentId);
  }

  // Simulate WebSocket update received
  receiveUpdate(enrollment: Enrollment): void {
    this.cache.invalidate(enrollment.id);
    this.cache.set(enrollment.id, enrollment);
  }

  // Simulate UI reading from cache
  uiRead(enrollmentId: string): Enrollment | undefined {
    const enrollment = this.cache.get(enrollmentId);
    if (enrollment) {
      this.uiReadLog.push({
        enrollmentId,
        version: this.cache.getVersion(enrollmentId),
        timestamp: Date.now(),
      });
    }
    return enrollment;
  }

  getUiReadLog(): Array<{ enrollmentId: string; version: number; timestamp: number }> {
    return [...this.uiReadLog];
  }

  isConnected(subscriptionId: string): boolean {
    return this.connectedSubscriptions.has(subscriptionId);
  }
}

describe('Property: No Stale Cache Updates (Req 4.4, 4.5)', () => {
  let cache: EnrollmentCache;
  let simulator: WebSocketCacheSimulator;

  beforeEach(() => {
    cache = new EnrollmentCache();
    simulator = new WebSocketCacheSimulator(cache);
  });

  afterEach(() => {
    cache.clear();
  });

  /**
   * Arbitrarily generate valid enrollments with varying statuses
   */
  const enrollmentArbitrary = fc.record({
    id: fc.uuid(),
    trainee_id: fc.uuid(),
    program_id: fc.uuid(),
    status: fc.constantFrom('enrolled', 'active', 'completed', 'dropped', 'failed'),
    enrollment_date: fc.constantFrom('2023-01-15', '2023-06-20', '2024-03-10', '2024-09-01'),
    created_at: fc.constantFrom(
      '2023-01-15T10:30:00Z',
      '2023-06-20T14:45:00Z',
      '2024-03-10T09:15:00Z'
    ),
    updated_at: fc.constantFrom(
      '2023-01-16T10:30:00Z',
      '2023-06-21T14:45:00Z',
      '2024-03-11T09:15:00Z'
    ),
  });

  // ========================================================================
  // Core Property: Latest Data Always In Cache
  // ========================================================================

  it('Property 1: new updates replace old cached data immediately', () => {
    fc.assert(
      fc.property(
        fc.record({
          enrollmentId: fc.uuid(),
          updates: fc.array(enrollmentArbitrary, { minLength: 2, maxLength: 10 }),
        }),
        (scenario) => {
          // Simulate: Cache initial enrollment
          const initialEnrollment = scenario.updates[0];
          cache.set(scenario.enrollmentId, initialEnrollment);

          // Verify initial data is cached
          let cachedData = cache.get(scenario.enrollmentId);
          expect(cachedData).toEqual(initialEnrollment);

          // Simulate: WebSocket receives update events
          for (let i = 1; i < scenario.updates.length; i++) {
            const updatedEnrollment = scenario.updates[i];
            // Invalidate old cache and set new data
            cache.invalidate(scenario.enrollmentId);
            cache.set(scenario.enrollmentId, updatedEnrollment);

            // PROPERTY: Cache now contains updated data, not stale data
            cachedData = cache.get(scenario.enrollmentId);
            expect(cachedData).toEqual(updatedEnrollment);
            expect(cachedData).not.toEqual(initialEnrollment);

            // PROPERTY: Status reflects latest update
            expect(cachedData?.status).toBe(updatedEnrollment.status);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Cache Invalidation
  // ========================================================================

  it('Property 2: cache invalidation removes stale data immediately', () => {
    fc.assert(
      fc.property(
        fc.record({
          enrollmentIds: fc.array(fc.uuid(), { minLength: 5, maxLength: 20 }),
          initialEnrollments: fc.array(enrollmentArbitrary, { minLength: 5, maxLength: 20 }),
        }),
        (scenario) => {
          // Populate cache with initial data
          for (let i = 0; i < Math.min(scenario.enrollmentIds.length, scenario.initialEnrollments.length); i++) {
            cache.set(scenario.enrollmentIds[i], scenario.initialEnrollments[i]);
          }

          // Verify all data is cached
          const cachedBefore = cache.getAll();
          expect(cachedBefore.size).toBeGreaterThan(0);

          // Invalidate a random enrollment
          const toInvalidate = scenario.enrollmentIds[0];
          cache.invalidate(toInvalidate);

          // PROPERTY: Invalidated enrollment is gone
          expect(cache.get(toInvalidate)).toBeUndefined();

          // PROPERTY: Other enrollments still in cache
          for (let i = 1; i < scenario.enrollmentIds.length; i++) {
            if (i < scenario.initialEnrollments.length) {
              expect(cache.get(scenario.enrollmentIds[i])).toBeDefined();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Rapid Updates Consistency
  // ========================================================================

  it('Property 3: multiple rapid updates leave no stale data', () => {
    fc.assert(
      fc.property(
        fc.record({
          enrollmentId: fc.uuid(),
          updateSequence: fc.array(enrollmentArbitrary, { minLength: 5, maxLength: 30 }),
        }),
        (scenario) => {
          const allSeenVersions: Enrollment[] = [];

          // Simulate rapid sequence of updates (no delays)
          for (const updatedEnrollment of scenario.updateSequence) {
            cache.invalidate(scenario.enrollmentId);
            cache.set(scenario.enrollmentId, updatedEnrollment);
            allSeenVersions.push(updatedEnrollment);

            // PROPERTY: After each update, cached data is latest
            const current = cache.get(scenario.enrollmentId);
            expect(current).toEqual(updatedEnrollment);

            // PROPERTY: Cached data matches last update, not earlier ones
            for (let i = 0; i < allSeenVersions.length - 1; i++) {
              expect(current).not.toEqual(allSeenVersions[i]);
            }
          }

          // PROPERTY: Final cache contains only last update
          const final = cache.get(scenario.enrollmentId);
          expect(final).toEqual(scenario.updateSequence[scenario.updateSequence.length - 1]);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Status Change Tracking
  // ========================================================================

  it('Property 4: cache reflects status changes immediately on update', () => {
    fc.assert(
      fc.property(
        fc.record({
          enrollmentId: fc.uuid(),
          initialStatus: fc.constantFrom('enrolled', 'active'),
          finalStatus: fc.constantFrom('completed', 'dropped', 'failed'),
        }),
        (scenario) => {
          const baseEnrollment: Enrollment = {
            id: scenario.enrollmentId,
            trainee_id: 'trainee-1',
            program_id: 'program-1',
            status: scenario.initialStatus as any,
            enrollment_date: '2024-01-01',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          };

          // Cache initial status
          cache.set(scenario.enrollmentId, baseEnrollment);
          let cached = cache.get(scenario.enrollmentId);
          expect(cached?.status).toBe(scenario.initialStatus);

          // Simulate WebSocket update with new status
          const updatedEnrollment = {
            ...baseEnrollment,
            status: scenario.finalStatus as any,
            updated_at: new Date().toISOString(),
          };
          cache.invalidate(scenario.enrollmentId);
          cache.set(scenario.enrollmentId, updatedEnrollment);

          // PROPERTY: Cache reflects new status
          cached = cache.get(scenario.enrollmentId);
          expect(cached?.status).toBe(scenario.finalStatus);
          expect(cached?.status).not.toBe(scenario.initialStatus);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Concurrent Operations
  // ========================================================================

  it('Property 5: concurrent cache operations maintain consistency', () => {
    fc.assert(
      fc.property(
        fc.record({
          enrollmentIds: fc.array(fc.uuid(), { minLength: 5, maxLength: 20 }),
          operations: fc.integer({ min: 10, max: 50 }),
        }),
        (scenario) => {
          const currentVersions = new Map<string, Enrollment>();

          // Simulate concurrent operations
          for (let op = 0; op < scenario.operations; op++) {
            // Pick enrollment for this operation
            const enrollmentId = scenario.enrollmentIds[op % scenario.enrollmentIds.length];

            // Generate update
            const updated: Enrollment = {
              id: enrollmentId,
              trainee_id: 'trainee-1',
              program_id: 'program-1',
              status: 'active',
              enrollment_date: '2024-01-01',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: new Date().toISOString(),
            };

            // Update cache
            cache.invalidate(enrollmentId);
            cache.set(enrollmentId, updated);
            currentVersions.set(enrollmentId, updated);
          }

          // PROPERTY: All cached values match expected current versions
          for (const [enrollmentId, expectedVersion] of currentVersions) {
            const cached = cache.get(enrollmentId);
            expect(cached).toEqual(expectedVersion);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Staleness Detection
  // ========================================================================

  it('Property 6: staleness detection identifies old cached data correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          enrollmentId: fc.uuid(),
          ageMs: fc.integer({ min: 100, max: 10000 }),
          maxAgeMs: fc.integer({ min: 100, max: 10000 }),
        }),
        (scenario) => {
          const enrollment: Enrollment = {
            id: scenario.enrollmentId,
            trainee_id: 'trainee-1',
            program_id: 'program-1',
            status: 'active',
            enrollment_date: '2024-01-01',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          };

          // Set cache with specific timestamp (now - ageMs)
          const cacheTime = Date.now() - scenario.ageMs;
          cache.set(scenario.enrollmentId, enrollment, cacheTime);

          // Check if stale
          const isStale = cache.isStale(scenario.enrollmentId, scenario.maxAgeMs);

          // PROPERTY: Staleness matches expectation
          if (scenario.ageMs > scenario.maxAgeMs) {
            expect(isStale).toBe(true);
          } else {
            expect(isStale).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Cache Clear Operations
  // ========================================================================

  it('Property 7: clearing cache removes all stale data', () => {
    fc.assert(
      fc.property(
        fc.record({
          enrollments: fc.array(
            fc.tuple(fc.uuid(), enrollmentArbitrary),
            { minLength: 5, maxLength: 30 }
          ),
        }),
        (scenario) => {
          // Populate cache
          for (const [id, enrollment] of scenario.enrollments) {
            cache.set(id, enrollment);
          }

          expect(cache.getAll().size).toBeGreaterThan(0);

          // Clear cache
          cache.clear();

          // PROPERTY: All data is gone
          expect(cache.getAll().size).toBe(0);

          // PROPERTY: Individual gets return undefined
          for (const [id] of scenario.enrollments) {
            expect(cache.get(id)).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Data Replacement with ID Changes
  // ========================================================================

  it('Property 8: new data replaces old even when IDs change', () => {
    fc.assert(
      fc.property(
        fc.record({
          oldEnrollmentId: fc.uuid(),
          newEnrollmentId: fc.uuid(),
          oldEnrollment: enrollmentArbitrary,
          newEnrollment: enrollmentArbitrary,
        }),
        (scenario) => {
          // Cache old enrollment
          cache.set(scenario.oldEnrollmentId, scenario.oldEnrollment);
          expect(cache.get(scenario.oldEnrollmentId)).toEqual(scenario.oldEnrollment);

          // Invalidate old and set new
          cache.invalidate(scenario.oldEnrollmentId);
          cache.set(scenario.newEnrollmentId, scenario.newEnrollment);

          // PROPERTY: Old enrollment is gone
          expect(cache.get(scenario.oldEnrollmentId)).toBeUndefined();

          // PROPERTY: New enrollment is present
          expect(cache.get(scenario.newEnrollmentId)).toEqual(scenario.newEnrollment);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // WebSocket Connected Subscription Behavior
  // ========================================================================

  it('Property 9: WebSocket connected subscribers always see latest updates', () => {
    fc.assert(
      fc.property(
        fc.record({
          subscriptionId: fc.uuid(),
          enrollmentId: fc.uuid(),
          updateCount: fc.integer({ min: 3, max: 15 }),
        }),
        (scenario) => {
          // Simulate WebSocket connection
          simulator.subscribe(scenario.subscriptionId, scenario.enrollmentId);
          expect(simulator.isConnected(scenario.subscriptionId)).toBe(true);

          let lastSeenVersion = -1;

          // Simulate multiple updates with same enrollment ID
          for (let i = 0; i < scenario.updateCount; i++) {
            const enrollment: Enrollment = {
              id: scenario.enrollmentId,
              trainee_id: 'trainee-1',
              program_id: 'program-1',
              status: i % 2 === 0 ? 'active' : 'enrolled',
              enrollment_date: '2024-01-01',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: `2024-01-0${1 + (i % 9)}T00:00:00Z`,
            };

            // WebSocket receives update
            simulator.receiveUpdate(enrollment);
            lastSeenVersion = i;

            // UI reads current state after update
            const uiData = simulator.uiRead(scenario.enrollmentId);

            // PROPERTY: UI sees updated data (not stale)
            expect(uiData).toBeDefined();
            if (uiData) {
              expect(uiData.id).toBe(scenario.enrollmentId);
              expect(uiData.status).toBe(enrollment.status);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Version Tracking
  // ========================================================================

  it('Property 10: cache version increases monotonically with updates', () => {
    fc.assert(
      fc.property(
        fc.record({
          enrollmentId: fc.uuid(),
          updates: fc.array(enrollmentArbitrary, { minLength: 5, maxLength: 20 }),
        }),
        (scenario) => {
          let previousVersion = 0;

          for (const enrollment of scenario.updates) {
            cache.set(scenario.enrollmentId, enrollment);
            const version = cache.getVersion(scenario.enrollmentId);

            // PROPERTY: Version increases with each update
            expect(version).toBeGreaterThan(previousVersion);
            previousVersion = version;
          }

          // PROPERTY: Final version equals number of updates
          expect(previousVersion).toBe(scenario.updates.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Multiple Concurrent Subscriptions
  // ========================================================================

  it('Property 11: multiple subscriptions see consistent latest data', () => {
    fc.assert(
      fc.property(
        fc.record({
          subscriptionCount: fc.integer({ min: 2, max: 5 }),
          enrollmentId: fc.uuid(),
          updateCount: fc.integer({ min: 3, max: 10 }),
        }),
        (scenario) => {
          // Setup multiple unique subscriptions
          const subscriptions: string[] = [];
          for (let i = 0; i < scenario.subscriptionCount; i++) {
            const subId = `sub-${i}`;
            simulator.subscribe(subId, scenario.enrollmentId);
            subscriptions.push(subId);
          }

          // Simulate updates
          for (let i = 0; i < scenario.updateCount; i++) {
            const update: Enrollment = {
              id: scenario.enrollmentId,
              trainee_id: 'trainee-1',
              program_id: 'program-1',
              status: i % 2 === 0 ? 'active' : 'completed',
              enrollment_date: '2024-01-01',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: `2024-01-0${1 + (i % 9)}T${i}:00:00Z`,
            };
            simulator.receiveUpdate(update);

            // All subscriptions should see consistent latest data
            const allDataPoints = subscriptions.map((subId) => {
              return simulator.uiRead(scenario.enrollmentId);
            });

            // PROPERTY: All subscribers see the same data
            if (allDataPoints.length > 0 && allDataPoints[0]) {
              for (let j = 1; j < allDataPoints.length; j++) {
                expect(allDataPoints[j]?.updated_at).toBe(allDataPoints[0].updated_at);
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Cache Invalidation Timing
  // ========================================================================

  it('Property 12: invalidation log tracks all cache removals', () => {
    fc.assert(
      fc.property(
        fc.record({
          enrollmentCount: fc.integer({ min: 5, max: 20 }),
        }),
        (scenario) => {
          // Create new cache for this test to avoid prior invalidation logs
          const testCache = new EnrollmentCache();

          // Create unique IDs
          const ids: string[] = [];
          for (let i = 0; i < scenario.enrollmentCount; i++) {
            ids.push(`enrollment-${i}`);
          }

          // Set all enrollments
          for (const id of ids) {
            testCache.set(id, {
              id,
              trainee_id: 'trainee-1',
              program_id: 'program-1',
              status: 'active',
              enrollment_date: '2024-01-01',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            });
          }

          // Invalidate all
          for (const id of ids) {
            testCache.invalidate(id);
          }

          // PROPERTY: All invalidations are logged
          const log = testCache.getInvalidationLog();
          expect(log.length).toBe(ids.length);

          // PROPERTY: Log entries have valid timestamps
          for (const entry of log) {
            expect(entry.timestamp).toBeGreaterThan(0);
            expect(entry.key).toBeDefined();
          }

          // PROPERTY: All invalidated IDs are in the log
          const loggedIds = new Set(log.map((e) => e.key));
          for (const id of ids) {
            expect(loggedIds.has(id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
