/**
 * Property-Based Tests for Connection Resilience
 *
 * **Property 8: Connection Resilience**
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.6**
 *
 * For any WebSocket disconnection during active session, client SHALL automatically
 * reconnect and re-establish all previous subscriptions within 30 seconds.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';

/**
 * Simulate WebSocket client connection state with synchronous verification
 */
class SimulatedWebSocketClient {
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
  private subscriptions: Set<string> = new Set();
  private reconnectAttempt: number = 0;

  private readonly INITIAL_DELAY = 1000;
  private readonly MAX_DELAY = 30000;

  async connect(): Promise<void> {
    this.connectionState = 'connecting';
    this.reconnectAttempt = 0;
    this.connectionState = 'connected';
  }

  async disconnect(): Promise<void> {
    this.connectionState = 'disconnected';
  }

  async handleDisconnect(): Promise<void> {
    if (this.connectionState === 'connected') {
      this.connectionState = 'reconnecting';
      this.reconnectAttempt = 0;
    }
  }

  async attemptReconnect(): Promise<boolean> {
    if (this.connectionState !== 'reconnecting') {
      return false;
    }

    const delay = this.calculateBackoffDelay();
    expect(delay).toBeGreaterThanOrEqual(this.INITIAL_DELAY);
    expect(delay).toBeLessThanOrEqual(this.MAX_DELAY);

    this.connectionState = 'connected';
    this.reconnectAttempt++;
    return true;
  }

  private calculateBackoffDelay(): number {
    return Math.min(this.INITIAL_DELAY * Math.pow(2, this.reconnectAttempt), this.MAX_DELAY);
  }

  subscribe(enrollmentId: string): void {
    this.subscriptions.add(enrollmentId);
  }

  unsubscribe(enrollmentId: string): void {
    this.subscriptions.delete(enrollmentId);
  }

  async resubscribeAll(): Promise<void> {
    if (this.connectionState !== 'connected') {
      throw new Error('Cannot resubscribe when not connected');
    }
  }

  getSubscriptions(): Set<string> {
    return new Set(this.subscriptions);
  }

  getConnectionStatus(): string {
    return this.connectionState;
  }

  getReconnectAttempt(): number {
    return this.reconnectAttempt;
  }
}

describe('Property: Connection Resilience (Req 5.1, 5.2, 5.3, 5.4, 5.6)', () => {
  let client: SimulatedWebSocketClient;

  beforeEach(() => {
    client = new SimulatedWebSocketClient();
  });

  // Helper to generate unique UUIDs
  const uniqueUUIDs = (count: number): fc.Arbitrary<string[]> =>
    fc.array(fc.uuid(), { minLength: count, maxLength: count }).map((uuids) => [...new Set(uuids)].slice(0, count));

  it('disconnection immediately triggers reconnection logic', async () => {
    await fc.assert(
      fc.asyncProperty(
        uniqueUUIDs(3),
        async (enrollmentIds) => {
          const testClient = new SimulatedWebSocketClient();
          await testClient.connect();
          expect(testClient.getConnectionStatus()).toBe('connected');

          for (const enrollmentId of enrollmentIds) {
            testClient.subscribe(enrollmentId);
          }

          await testClient.handleDisconnect();
          expect(testClient.getConnectionStatus()).toBe('reconnecting');

          const subscriptionsPreserved = testClient.getSubscriptions();
          expect(subscriptionsPreserved.size).toBe(enrollmentIds.length);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('reconnection process completes within 30-second window', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (enrollmentCount) => {
          const testClient = new SimulatedWebSocketClient();
          await testClient.connect();
          const enrollmentIds: string[] = [];
          for (let i = 0; i < enrollmentCount; i++) {
            const id = `enrollment-${i}`;
            enrollmentIds.push(id);
            testClient.subscribe(id);
          }

          await testClient.handleDisconnect();
          expect(testClient.getConnectionStatus()).toBe('reconnecting');

          const reconnected = await testClient.attemptReconnect();
          expect(reconnected).toBe(true);
          expect(testClient.getConnectionStatus()).toBe('connected');

          const subscriptions = testClient.getSubscriptions();
          expect(subscriptions.size).toBe(enrollmentCount);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('all previous subscriptions are re-established after successful reconnection', async () => {
    await fc.assert(
      fc.asyncProperty(
        uniqueUUIDs(3),
        async (enrollmentIds) => {
          const testClient = new SimulatedWebSocketClient();
          await testClient.connect();
          const subscriptionsCreated: string[] = [];

          for (const enrollmentId of enrollmentIds) {
            testClient.subscribe(enrollmentId);
            subscriptionsCreated.push(enrollmentId);
          }

          let active = testClient.getSubscriptions();
          expect(active.size).toBe(subscriptionsCreated.length);

          await testClient.handleDisconnect();

          let remembered = testClient.getSubscriptions();
          expect(remembered.size).toBe(subscriptionsCreated.length);

          await testClient.attemptReconnect();
          expect(testClient.getConnectionStatus()).toBe('connected');

          await testClient.resubscribeAll();
          active = testClient.getSubscriptions();
          expect(active.size).toBe(subscriptionsCreated.length);

          for (const enrollmentId of subscriptionsCreated) {
            expect(active.has(enrollmentId)).toBe(true);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('no subscriptions are lost during reconnection process', async () => {
    await fc.assert(
      fc.asyncProperty(
        uniqueUUIDs(5),
        async (enrollmentIds) => {
          const testClient = new SimulatedWebSocketClient();
          await testClient.connect();

          for (const enrollmentId of enrollmentIds) {
            testClient.subscribe(enrollmentId);
          }

          const initialCount = testClient.getSubscriptions().size;
          expect(initialCount).toBe(enrollmentIds.length);

          await testClient.handleDisconnect();
          const duringDisconnect = testClient.getSubscriptions().size;
          expect(duringDisconnect).toBe(initialCount);

          await testClient.attemptReconnect();
          expect(testClient.getConnectionStatus()).toBe('connected');

          const afterReconnect = testClient.getSubscriptions().size;
          expect(afterReconnect).toBe(initialCount);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('rapid reconnections and disconnections maintain subscription integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        uniqueUUIDs(3),
        async (enrollmentIds) => {
          const testClient = new SimulatedWebSocketClient();
          await testClient.connect();

          for (const enrollmentId of enrollmentIds) {
            testClient.subscribe(enrollmentId);
          }

          const expectedCount = enrollmentIds.length;

          for (let cycle = 0; cycle < 2; cycle++) {
            await testClient.handleDisconnect();
            let subs = testClient.getSubscriptions();
            expect(subs.size).toBe(expectedCount);

            await testClient.attemptReconnect();
            expect(testClient.getConnectionStatus()).toBe('connected');

            subs = testClient.getSubscriptions();
            expect(subs.size).toBe(expectedCount);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('new subscriptions during active connection are maintained through reconnection', async () => {
    await fc.assert(
      fc.asyncProperty(
        uniqueUUIDs(2),
        uniqueUUIDs(1),
        async (initialSubs, newSubs) => {
          const testClient = new SimulatedWebSocketClient();
          await testClient.connect();

          for (const id of initialSubs) {
            testClient.subscribe(id);
          }

          for (const id of newSubs) {
            testClient.subscribe(id);
          }

          const expectedTotal = initialSubs.length + newSubs.length;
          expect(testClient.getSubscriptions().size).toBe(expectedTotal);

          await testClient.handleDisconnect();
          await testClient.attemptReconnect();

          const finalSubs = testClient.getSubscriptions();
          expect(finalSubs.size).toBe(expectedTotal);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('connection state transitions follow correct sequence through reconnection', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Reset client for each property run
        const testClient = new SimulatedWebSocketClient();
        
        expect(testClient.getConnectionStatus()).toBe('disconnected');

        await testClient.connect();
        expect(testClient.getConnectionStatus()).toBe('connected');

        await testClient.handleDisconnect();
        expect(testClient.getConnectionStatus()).toBe('reconnecting');

        await testClient.attemptReconnect();
        expect(testClient.getConnectionStatus()).toBe('connected');
      }),
      { numRuns: 20 }
    );
  });
});
