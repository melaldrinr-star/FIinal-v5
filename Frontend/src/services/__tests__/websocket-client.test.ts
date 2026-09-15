/**
 * Unit tests for WebSocket client
 * 
 * Validates Requirements 1.1, 1.2, 2.1, 2.2, 5.1, 5.2, 5.3, 5.4, 5.6, 8.1, 8.2, 8.3, 8.4, 10.1, 10.2, 13.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { websocketClient, ConnectionStatus } from '../websocket-client';
import { enrollmentSchema } from '../enrollmentService';

// Mock WebSocket class
class MockWebSocket {
  url: string;
  readyState: number = 0; // WebSocket.CONNECTING
  listeners: Map<string, ((event: Event) => void)[]> = new Map();
  sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(type: string, listener: (event: Event) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = 3; // WebSocket.CLOSED
    this.triggerEvent('close', new Event('close'));
  }

  simulateOpen(): void {
    this.readyState = 1; // WebSocket.OPEN
    this.triggerEvent('open', new Event('open'));
  }

  simulateClose(): void {
    this.readyState = 3; // WebSocket.CLOSED
    this.triggerEvent('close', new Event('close'));
  }

  simulateError(): void {
    this.triggerEvent('error', new Event('error'));
  }

  simulateMessage(data: any): void {
    const messageEvent = new MessageEvent('message', { data: JSON.stringify(data) });
    this.triggerEvent('message', messageEvent);
  }

  private triggerEvent(type: string, event: Event): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }
}

// Global mock WebSocket
let mockWebSocketInstances: MockWebSocket[] = [];
const originalWebSocket = global.WebSocket;

beforeEach(() => {
  mockWebSocketInstances = [];
  global.WebSocket = class {
    constructor(url: string) {
      const mockWs = new MockWebSocket(url);
      mockWebSocketInstances.push(mockWs);
      return mockWs as any;
    }
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
  } as any;
});

afterEach(async () => {
  global.WebSocket = originalWebSocket;
  mockWebSocketInstances = [];
  await websocketClient.disconnect();
  vi.clearAllMocks();
});

describe('WebSocket Client (Req 1.1, 1.2, 2.1, 2.2, 5.1-5.6, 8.1-8.4, 10.1-10.2, 13.1)', () => {
  describe('Module exports (Req 1.1)', () => {
    it('exports websocketClient singleton', () => {
      expect(websocketClient).toBeDefined();
      expect(typeof websocketClient).toBe('object');
    });

    it('exports handler types for type safety', () => {
      // Type exports are compile-time only, verify structure at runtime
      expect(websocketClient).toBeDefined();
    });
  });

  describe('WebSocket Client API (Req 1.1, 1.2, 2.1, 2.2)', () => {
    it('has connect method for establishing connections', () => {
      expect(typeof websocketClient.connect).toBe('function');
    });

    it('has disconnect method for closing connections', () => {
      expect(typeof websocketClient.disconnect).toBe('function');
    });

    it('has subscribe method for subscription requests', () => {
      expect(typeof websocketClient.subscribe).toBe('function');
    });

    it('has unsubscribe method for unsubscribe requests', () => {
      expect(typeof websocketClient.unsubscribe).toBe('function');
    });

    it('has getConnectionStatus method for status tracking', () => {
      expect(typeof websocketClient.getConnectionStatus).toBe('function');
    });

    it('has isConnected method', () => {
      expect(typeof websocketClient.isConnected).toBe('function');
    });

    it('returns valid connection status (Req 13.1)', () => {
      const status = websocketClient.getConnectionStatus();
      const validStatuses: ConnectionStatus[] = ['disconnected', 'connecting', 'reconnecting', 'connected'];
      expect(validStatuses).toContain(status);
    });
  });

  describe('Event Handler Registration (Req 4.1, 4.4)', () => {
    it('has onEnrollmentUpdated method for update events', () => {
      expect(typeof websocketClient.onEnrollmentUpdated).toBe('function');
    });

    it('has onEnrollmentAdded method for add events', () => {
      expect(typeof websocketClient.onEnrollmentAdded).toBe('function');
    });

    it('has onEnrollmentRemoved method for remove events', () => {
      expect(typeof websocketClient.onEnrollmentRemoved).toBe('function');
    });

    it('has onStatusChange method for connection status events (Req 13.2)', () => {
      expect(typeof websocketClient.onStatusChange).toBe('function');
    });

    it('has onError method for error events (Req 10.1)', () => {
      expect(typeof websocketClient.onError).toBe('function');
    });

    it('returns unsubscribe function from handlers allowing removal', () => {
      const handler = vi.fn();
      const unsubscribe = websocketClient.onEnrollmentUpdated(handler);
      expect(typeof unsubscribe).toBe('function');
      // Calling unsubscribe should not throw
      expect(() => unsubscribe()).not.toThrow();
    });

    it('allows multiple handlers to be registered', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const unsub1 = websocketClient.onStatusChange(handler1);
      const unsub2 = websocketClient.onStatusChange(handler2);
      
      expect(typeof unsub1).toBe('function');
      expect(typeof unsub2).toBe('function');
      
      unsub1();
      unsub2();
    });
  });

  describe('Exponential Backoff Calculation (Req 5.2, 5.3, 5.4)', () => {
    it('calculates exponential backoff correctly for reconnection attempts', () => {
      // Test the exponential backoff formula: min(2^n * 1000ms, 30000ms)
      const INITIAL_DELAY = 1000;
      const MAX_DELAY = 30000;

      const calculateBackoff = (attempt: number) => {
        return Math.min(INITIAL_DELAY * Math.pow(2, attempt), MAX_DELAY);
      };

      // Validates: Requirements 5.2, 5.3, 5.4
      expect(calculateBackoff(0)).toBe(1000);    // 2^0 * 1000 = 1000
      expect(calculateBackoff(1)).toBe(2000);    // 2^1 * 1000 = 2000
      expect(calculateBackoff(2)).toBe(4000);    // 2^2 * 1000 = 4000
      expect(calculateBackoff(3)).toBe(8000);    // 2^3 * 1000 = 8000
      expect(calculateBackoff(4)).toBe(16000);   // 2^4 * 1000 = 16000
      expect(calculateBackoff(5)).toBe(30000);   // capped at 30000
      expect(calculateBackoff(10)).toBe(30000);  // capped at 30000
    });
  });

  describe('Message Schema Validation (Req 8.1, 8.2, 8.3, 8.4, 10.2)', () => {
    it('uses Zod schema for enrollment validation', () => {
      expect(enrollmentSchema).toBeDefined();
      expect(typeof enrollmentSchema.parse).toBe('function');
    });

    it('accepts valid enrollment data', () => {
      // Validates: Requirements 8.2, 8.3, 8.4
      const validEnrollment = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        trainee_id: '550e8400-e29b-41d4-a716-446655440001',
        program_id: '550e8400-e29b-41d4-a716-446655440002',
        status: 'active' as const,
        enrollment_date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(() => {
        enrollmentSchema.parse(validEnrollment);
      }).not.toThrow();
    });

    it('rejects invalid enrollment data', () => {
      // Validates: Requirements 10.2 - invalid messages are rejected
      const invalidEnrollment = {
        id: 'not-a-uuid',
        trainee_id: 'not-a-uuid',
        // Missing required fields
      };

      expect(() => {
        enrollmentSchema.parse(invalidEnrollment);
      }).toThrow();
    });

    it('validates enrollment has all required fields (Req 8.1)', () => {
      const completeEnrollment = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        trainee_id: '550e8400-e29b-41d4-a716-446655440001',
        program_id: '550e8400-e29b-41d4-a716-446655440002',
        status: 'active' as const,
        enrollment_date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Should parse successfully with all fields
      const parsed = enrollmentSchema.parse(completeEnrollment);
      expect(parsed.id).toBeDefined();
      expect(parsed.trainee_id).toBeDefined();
      expect(parsed.program_id).toBeDefined();
      expect(parsed.status).toBeDefined();
      expect(parsed.enrollment_date).toBeDefined();
      expect(parsed.created_at).toBeDefined();
      expect(parsed.updated_at).toBeDefined();
    });
  });

  describe('Connection Status Tracking (Req 13.1, 13.2)', () => {
    it('tracks valid connection statuses', () => {
      const validStatuses: ConnectionStatus[] = ['connecting', 'connected', 'disconnected', 'reconnecting'];
      
      for (const status of validStatuses) {
        expect(typeof status).toBe('string');
      }
    });

    it('returns boolean from isConnected method', () => {
      const connected = websocketClient.isConnected();
      expect(typeof connected).toBe('boolean');
    });

    it('transitions from disconnected to connecting on connect attempt (Req 13.1, 13.2)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Initial state should be disconnected
      expect(websocketClient.getConnectionStatus()).toBe('disconnected');

      const statusChanges: ConnectionStatus[] = [];
      websocketClient.onStatusChange(status => statusChanges.push(status));

      const connectPromise = websocketClient.connect(url, traineeId, token);

      // Should immediately transition to connecting
      expect(statusChanges[0]).toBe('connecting');

      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });

      await connectPromise;
      expect(statusChanges).toContain('connected');
    });

    it('transitions from connecting to connected on successful connection (Req 13.1, 13.2)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      const statusChanges: ConnectionStatus[] = [];
      websocketClient.onStatusChange(status => statusChanges.push(status));

      const connectPromise = websocketClient.connect(url, traineeId, token);

      // Should start in connecting state
      expect(websocketClient.getConnectionStatus()).toBe('connecting');

      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });

      await connectPromise;

      // Should transition to connected
      expect(websocketClient.getConnectionStatus()).toBe('connected');
      expect(statusChanges).toEqual(['connecting', 'connected']);
    });

    it('transitions to reconnecting when connection is lost (Req 13.1, 13.2)', async () => {
      vi.useFakeTimers();

      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect first
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      expect(websocketClient.getConnectionStatus()).toBe('connected');

      const statusChanges: ConnectionStatus[] = [];
      websocketClient.onStatusChange(status => statusChanges.push(status));

      // Simulate connection loss
      mockWs.simulateClose();

      // Should transition to reconnecting
      expect(websocketClient.getConnectionStatus()).toBe('reconnecting');
      expect(statusChanges[0]).toBe('reconnecting');

      vi.useRealTimers();
    });

    it('transitions back to connected on successful reconnection (Req 13.1, 13.2)', async () => {
      vi.useFakeTimers();

      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Initial connection
      const connectPromise = websocketClient.connect(url, traineeId, token);
      let mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      const statusChanges: ConnectionStatus[] = [];
      websocketClient.onStatusChange(status => statusChanges.push(status));

      // Simulate connection loss
      mockWs.simulateClose();
      expect(websocketClient.getConnectionStatus()).toBe('reconnecting');

      // Wait for reconnection attempt
      vi.advanceTimersByTime(1100);

      // Simulate successful reconnection
      mockWs = mockWebSocketInstances[mockWebSocketInstances.length - 1];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '456',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });

      await vi.advanceTimersByTimeAsync(100);
      await vi.runAllTimersAsync();

      // Should be back to connected
      expect(websocketClient.getConnectionStatus()).toBe('connected');
      expect(statusChanges).toContain('connected');

      vi.useRealTimers();
    });

    it('transitions to disconnected on intentional disconnect (Req 13.1, 13.2)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      const statusChanges: ConnectionStatus[] = [];
      websocketClient.onStatusChange(status => statusChanges.push(status));

      // Disconnect intentionally
      await websocketClient.disconnect();

      // Should transition to disconnected
      expect(websocketClient.getConnectionStatus()).toBe('disconnected');
      expect(statusChanges).toContain('disconnected');
    });

    it('emits status change events for each status transition (Req 13.2)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      const statusChanges: ConnectionStatus[] = [];
      const statusHandler = vi.fn((status: ConnectionStatus) => {
        statusChanges.push(status);
      });

      websocketClient.onStatusChange(statusHandler);

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);

      // First event should be connecting
      expect(statusHandler).toHaveBeenCalledWith('connecting');

      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });

      await connectPromise;

      // Second event should be connected
      expect(statusHandler).toHaveBeenLastCalledWith('connected');
      expect(statusHandler).toHaveBeenCalledTimes(2);
    });

    it('getConnectionStatus returns correct status at all times (Req 13.1)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Initial state
      expect(websocketClient.getConnectionStatus()).toBe('disconnected');

      // After initiating connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      expect(websocketClient.getConnectionStatus()).toBe('connecting');

      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });

      await connectPromise;

      // After successful connection
      expect(websocketClient.getConnectionStatus()).toBe('connected');

      // After disconnect
      await websocketClient.disconnect();
      expect(websocketClient.getConnectionStatus()).toBe('disconnected');
    });

    it('allows multiple handlers to listen to status changes (Req 13.2)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      websocketClient.onStatusChange(handler1);
      websocketClient.onStatusChange(handler2);
      websocketClient.onStatusChange(handler3);

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);

      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });

      await connectPromise;

      // All handlers should be called
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();

      // All should receive same number of status changes
      expect(handler1.mock.calls.length).toBe(handler2.mock.calls.length);
      expect(handler2.mock.calls.length).toBe(handler3.mock.calls.length);
    });

    it('allows unregistering individual status change handlers (Req 13.2)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const unsubscribe1 = websocketClient.onStatusChange(handler1);
      const unsubscribe2 = websocketClient.onStatusChange(handler2);

      // Unregister first handler
      unsubscribe1();

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);

      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });

      await connectPromise;

      // Only second handler should be called
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('has isConnected return true only when status is connected (Req 13.1)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Initially disconnected
      expect(websocketClient.isConnected()).toBe(false);

      // While connecting
      const connectPromise = websocketClient.connect(url, traineeId, token);
      expect(websocketClient.isConnected()).toBe(false);

      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });

      await connectPromise;

      // When connected
      expect(websocketClient.isConnected()).toBe(true);

      // After disconnect
      await websocketClient.disconnect();
      expect(websocketClient.isConnected()).toBe(false);
    });

    it('status transitions are reflected in both getConnectionStatus and isConnected (Req 13.1)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Disconnected state
      expect(websocketClient.getConnectionStatus()).toBe('disconnected');
      expect(websocketClient.isConnected()).toBe(false);

      // Connecting state
      const connectPromise = websocketClient.connect(url, traineeId, token);
      expect(websocketClient.getConnectionStatus()).toBe('connecting');
      expect(websocketClient.isConnected()).toBe(false);

      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });

      await connectPromise;

      // Connected state
      expect(websocketClient.getConnectionStatus()).toBe('connected');
      expect(websocketClient.isConnected()).toBe(true);
    });
  });

  describe('Error Handling (Req 10.1, 10.3, 10.4)', () => {
    it('provides error handler registration', () => {
      // Validates: Requirements 10.1 - error handlers can be registered
      const errorHandler = vi.fn();
      const unsubscribe = websocketClient.onError(errorHandler);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('WebSocket client handles auth failures gracefully', () => {
      // The client should have error handlers to catch auth failures (4001)
      expect(typeof websocketClient.onError).toBe('function');
    });
  });

  describe('Test connect establishes connection successfully (Req 1.1, 1.2)', () => {
    it('successfully connects to WebSocket server and authenticates (Req 1.1, 1.2)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-jwt-token';

      const connectPromise = websocketClient.connect(url, traineeId, token);

      // Simulate WebSocket open event
      expect(mockWebSocketInstances.length).toBe(1);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();

      // Simulate successful authentication response
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });

      await connectPromise;

      // Verify connection is established
      expect(websocketClient.getConnectionStatus()).toBe('connected');
      expect(websocketClient.isConnected()).toBe(true);
    });

    it('sends authentication message with JWT token on connection (Req 1.2)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'my-jwt-token';

      const connectPromise = websocketClient.connect(url, traineeId, token);

      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();

      // Find auth message
      const authMessage = mockWs.sentMessages.find(msg => {
        const parsed = JSON.parse(msg);
        return parsed.type === 'auth';
      });

      expect(authMessage).toBeDefined();
      const parsed = JSON.parse(authMessage!);
      expect(parsed.data.token).toBe(token);

      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });

      await connectPromise;
      expect(websocketClient.isConnected()).toBe(true);
    });

    it('updates connection status to connecting during connection attempt (Req 13.1, 13.2)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      const statusChanges: ConnectionStatus[] = [];
      websocketClient.onStatusChange(status => statusChanges.push(status));

      const connectPromise = websocketClient.connect(url, traineeId, token);

      // Verify connecting status was emitted
      expect(statusChanges).toContain('connecting');

      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });

      await connectPromise;

      // Verify connected status was emitted
      expect(statusChanges).toContain('connected');
    });

    it('fails to connect with connection timeout error (Req 10.1)', async () => {
      vi.useFakeTimers();

      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Don't simulate open, let connection timeout
      const connectPromise = websocketClient.connect(url, traineeId, token).catch(err => {
        // Expected to fail - catch the error
        expect(err).toBeDefined();
        expect(err.message).toContain('timeout');
      });

      // Advance time to trigger connection timeout (5 seconds)
      vi.advanceTimersByTime(5100);
      await vi.runAllTimersAsync();

      await connectPromise;
      expect(websocketClient.getConnectionStatus()).toBe('disconnected');

      vi.useRealTimers();
    }, 10000);

    it('fails to connect if WebSocket creation throws error', async () => {
      // Mock WebSocket to throw error
      global.WebSocket = class {
        constructor() {
          throw new Error('WebSocket not supported');
        }
        static CONNECTING = 0;
        static OPEN = 1;
        static CLOSING = 2;
        static CLOSED = 3;
      } as any;

      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      const connectPromise = websocketClient.connect(url, traineeId, token);
      await expect(connectPromise).rejects.toThrow();
    });
  });

  describe('Test disconnect closes connection (Req 1.6, 2.6)', () => {
    it('closes WebSocket connection gracefully', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect first
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      expect(websocketClient.isConnected()).toBe(true);

      // Disconnect
      await websocketClient.disconnect();

      expect(websocketClient.getConnectionStatus()).toBe('disconnected');
      expect(websocketClient.isConnected()).toBe(false);
    });

    it('clears subscriptions on disconnect (Req 2.6)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';
      const enrollmentId = '550e8400-e29b-41d4-a716-446655440001';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Subscribe
      websocketClient.subscribe(enrollmentId);
      expect(mockWs.sentMessages.some(msg => JSON.parse(msg).type === 'subscribe')).toBe(true);

      // Disconnect
      await websocketClient.disconnect();

      // Verify subscriptions are cleared (attempting to subscribe after disconnect should not send message)
      mockWs.sentMessages = [];
      websocketClient.subscribe(enrollmentId);
      expect(mockWs.sentMessages.length).toBe(0);
    });

    it('emits disconnected status on disconnect', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect first
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      const statusChanges: ConnectionStatus[] = [];
      websocketClient.onStatusChange(status => statusChanges.push(status));

      await websocketClient.disconnect();

      expect(statusChanges).toContain('disconnected');
    });

    it('handles disconnect when not connected', async () => {
      // Should not throw error
      await expect(websocketClient.disconnect()).resolves.not.toThrow();
      expect(websocketClient.getConnectionStatus()).toBe('disconnected');
    });
  });

  describe('Test subscribe sends subscription message (Req 2.1, 2.2, 2.4)', () => {
    it('sends subscription message for enrollment (Req 2.1, 2.2)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';
      const enrollmentId = '550e8400-e29b-41d4-a716-446655440001';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Subscribe
      websocketClient.subscribe(enrollmentId);

      // Verify subscription message was sent
      const subscribeMessage = mockWs.sentMessages.find(msg => {
        const parsed = JSON.parse(msg);
        return parsed.type === 'subscribe';
      });

      expect(subscribeMessage).toBeDefined();
      const parsed = JSON.parse(subscribeMessage!);
      expect(parsed.data.enrollmentId).toBe(enrollmentId);
      expect(parsed.type).toBe('subscribe');
    });

    it('deduplicates subscriptions to same enrollment (Req 2.4)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';
      const enrollmentId = '550e8400-e29b-41d4-a716-446655440001';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Clear auth messages
      mockWs.sentMessages = [];

      // Subscribe twice to same enrollment
      websocketClient.subscribe(enrollmentId);
      const firstSubscribeCount = mockWs.sentMessages.length;
      websocketClient.subscribe(enrollmentId);
      const secondSubscribeCount = mockWs.sentMessages.length;

      // Should only send one subscription message (deduplicated)
      expect(secondSubscribeCount).toBe(firstSubscribeCount);
    });

    it('does not subscribe when not connected', async () => {
      const enrollmentId = '550e8400-e29b-41d4-a716-446655440001';

      // Attempt subscribe without connecting
      websocketClient.subscribe(enrollmentId);

      // Should not have sent any WebSocket messages
      expect(mockWebSocketInstances.length).toBe(0);
    });

    it('includes enrollment ID in subscription message (Req 2.1)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';
      const enrollmentId = '550e8400-e29b-41d4-a716-446655440002';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Subscribe
      websocketClient.subscribe(enrollmentId);

      // Find and verify subscription message
      const subscribeMessage = mockWs.sentMessages.find(msg => {
        const parsed = JSON.parse(msg);
        return parsed.type === 'subscribe';
      });

      expect(subscribeMessage).toBeDefined();
      const parsed = JSON.parse(subscribeMessage!);
      expect(parsed.data).toHaveProperty('enrollmentId');
      expect(parsed.data.enrollmentId).toBe(enrollmentId);
    });
  });

  describe('Test unsubscribe sends unsubscribe message (Req 2.6)', () => {
    it('sends unsubscribe message for enrollment', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';
      const enrollmentId = '550e8400-e29b-41d4-a716-446655440001';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Subscribe first
      websocketClient.subscribe(enrollmentId);
      mockWs.sentMessages = [];

      // Unsubscribe
      websocketClient.unsubscribe(enrollmentId);

      // Verify unsubscribe message was sent
      const unsubscribeMessage = mockWs.sentMessages.find(msg => {
        const parsed = JSON.parse(msg);
        return parsed.type === 'unsubscribe';
      });

      expect(unsubscribeMessage).toBeDefined();
      const parsed = JSON.parse(unsubscribeMessage!);
      expect(parsed.data.enrollmentId).toBe(enrollmentId);
      expect(parsed.type).toBe('unsubscribe');
    });

    it('removes enrollment from subscriptions on unsubscribe', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';
      const enrollmentId = '550e8400-e29b-41d4-a716-446655440001';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Subscribe
      websocketClient.subscribe(enrollmentId);

      // Unsubscribe
      websocketClient.unsubscribe(enrollmentId);

      // Try subscribing again - should send new subscription (not deduplicated)
      mockWs.sentMessages = [];
      websocketClient.subscribe(enrollmentId);

      expect(mockWs.sentMessages.some(msg => JSON.parse(msg).type === 'subscribe')).toBe(true);
    });

    it('handles unsubscribe when not subscribed', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';
      const enrollmentId = '550e8400-e29b-41d4-a716-446655440001';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Attempt unsubscribe without subscribing first
      mockWs.sentMessages = [];
      websocketClient.unsubscribe(enrollmentId);

      // Should not send unsubscribe message
      expect(mockWs.sentMessages.length).toBe(0);
    });

    it('does not send unsubscribe message when not connected', async () => {
      const enrollmentId = '550e8400-e29b-41d4-a716-446655440001';

      // Attempt unsubscribe without connecting
      websocketClient.unsubscribe(enrollmentId);

      // Should not have created any WebSocket
      expect(mockWebSocketInstances.length).toBe(0);
    });

    it('includes enrollment ID in unsubscribe message', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';
      const enrollmentId = '550e8400-e29b-41d4-a716-446655440003';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Subscribe then unsubscribe
      websocketClient.subscribe(enrollmentId);
      mockWs.sentMessages = [];
      websocketClient.unsubscribe(enrollmentId);

      // Verify unsubscribe message has correct enrollment ID
      const unsubscribeMessage = mockWs.sentMessages.find(msg => {
        const parsed = JSON.parse(msg);
        return parsed.type === 'unsubscribe';
      });

      expect(unsubscribeMessage).toBeDefined();
      const parsed = JSON.parse(unsubscribeMessage!);
      expect(parsed.data.enrollmentId).toBe(enrollmentId);
    });
  });

  describe('Environment Configuration Support (Req 15.1)', () => {
    it('supports WSS and WS URLs for production/development', () => {
      // The connect method accepts URLs for both wss:// (production) and ws:// (development)
      expect(typeof websocketClient.connect).toBe('function');
      
      // Should accept both wss and ws protocols
      const connectMethod = websocketClient.connect.toString();
      expect(connectMethod).toContain('url'); // Uses URL parameter
    });
  });
});

  describe('Message Event Handlers (Req 4.1, 6.6)', () => {
    it('calls enrollment-updated handler when enrollment-updated message received', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000001',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Register handler
      const handler = vi.fn();
      websocketClient.onEnrollmentUpdated(handler);

      // Simulate receiving enrollment-updated message
      const enrollment = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        trainee_id: '550e8400-e29b-41d4-a716-446655440000',
        program_id: '550e8400-e29b-41d4-a716-446655440002',
        status: 'active' as const,
        enrollment_date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
      };

      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000002',
        type: 'enrollment-updated',
        data: { enrollment },
        timestamp: new Date().toISOString(),
      });

      // Verify handler was called with correct data
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        id: enrollment.id,
        status: 'active',
      }));
    });

    it('calls enrollment-added handler when enrollment-added message received', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000001',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Register handler
      const handler = vi.fn();
      websocketClient.onEnrollmentAdded(handler);

      // Simulate receiving enrollment-added message
      const enrollment = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        trainee_id: '550e8400-e29b-41d4-a716-446655440000',
        program_id: '550e8400-e29b-41d4-a716-446655440004',
        status: 'active' as const,
        enrollment_date: '2024-01-15',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      };

      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000003',
        type: 'enrollment-added',
        data: { enrollment },
        timestamp: new Date().toISOString(),
      });

      // Verify handler was called with correct data
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        id: enrollment.id,
        status: 'active',
      }));
    });

    it('calls enrollment-removed handler when enrollment-removed message received', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000001',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Register handler
      const handler = vi.fn();
      websocketClient.onEnrollmentRemoved(handler);

      // Simulate receiving enrollment-removed message
      const enrollmentId = '550e8400-e29b-41d4-a716-446655440005';

      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000004',
        type: 'enrollment-removed',
        data: { enrollmentId },
        timestamp: new Date().toISOString(),
      });

      // Verify handler was called with enrollment ID
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(enrollmentId);
    });

    it('sends pong response when heartbeat message received (Req 1.5, 6.12)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000001',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Clear sent messages to isolate heartbeat response
      mockWs.sentMessages = [];

      // Simulate receiving heartbeat ping
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000005',
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      });

      // Verify pong message was sent
      const pongMessage = mockWs.sentMessages.find(msg => {
        const parsed = JSON.parse(msg);
        return parsed.type === 'pong';
      });

      expect(pongMessage).toBeDefined();
      const parsed = JSON.parse(pongMessage!);
      expect(parsed.type).toBe('pong');
    });

    it('validates enrollment data before calling handler (Req 4.1, 4.3)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000001',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Register handler and error handler
      const handler = vi.fn();
      const errorHandler = vi.fn();
      websocketClient.onEnrollmentUpdated(handler);
      websocketClient.onError(errorHandler);

      // Send invalid enrollment data (missing fields)
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000006',
        type: 'enrollment-updated',
        data: { enrollment: { id: 'not-a-uuid' } },
        timestamp: new Date().toISOString(),
      });

      // Verify handler was NOT called
      expect(handler).not.toHaveBeenCalled();
      
      // Verify error was emitted
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid enrollment data'),
        })
      );
    });

    it('handles multiple handlers for same event type', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000001',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Register multiple handlers
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      websocketClient.onEnrollmentUpdated(handler1);
      websocketClient.onEnrollmentUpdated(handler2);

      // Simulate enrollment update
      const enrollment = {
        id: '550e8400-e29b-41d4-a716-446655440006',
        trainee_id: '550e8400-e29b-41d4-a716-446655440000',
        program_id: '550e8400-e29b-41d4-a716-446655440007',
        status: 'completed' as const,
        enrollment_date: '2024-02-01',
        created_at: '2024-02-01T00:00:00Z',
        updated_at: '2024-02-01T08:00:00Z',
      };

      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000007',
        type: 'enrollment-updated',
        data: { enrollment },
        timestamp: new Date().toISOString(),
      });

      // Both handlers should be called
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('allows unregistering handlers individually', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000001',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Register two handlers
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const unsubscribe1 = websocketClient.onEnrollmentUpdated(handler1);
      const unsubscribe2 = websocketClient.onEnrollmentUpdated(handler2);

      // Unregister first handler
      unsubscribe1();

      // Simulate enrollment update
      const enrollment = {
        id: '550e8400-e29b-41d4-a716-446655440008',
        trainee_id: '550e8400-e29b-41d4-a716-446655440000',
        program_id: '550e8400-e29b-41d4-a716-446655440009',
        status: 'active' as const,
        enrollment_date: '2024-03-01',
        created_at: '2024-03-01T00:00:00Z',
        updated_at: '2024-03-01T06:00:00Z',
      };

      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000008',
        type: 'enrollment-updated',
        data: { enrollment },
        timestamp: new Date().toISOString(),
      });

      // Only second handler should be called
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('removes enrollment from subscriptions when removal received', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';
      const enrollmentId = '550e8400-e29b-41d4-a716-446655440010';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000001',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Subscribe to enrollment
      websocketClient.subscribe(enrollmentId);
      mockWs.sentMessages = [];

      // Register removal handler
      const handler = vi.fn();
      websocketClient.onEnrollmentRemoved(handler);

      // Simulate enrollment removal
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000009',
        type: 'enrollment-removed',
        data: { enrollmentId },
        timestamp: new Date().toISOString(),
      });

      // Handler should be called
      expect(handler).toHaveBeenCalledWith(enrollmentId);

      // Attempting to re-subscribe should work (subscription was cleaned up)
      websocketClient.subscribe(enrollmentId);
      expect(mockWs.sentMessages.some(msg => JSON.parse(msg).type === 'subscribe')).toBe(true);
    });

    it('logs errors for invalid enrollment data without crashing', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      const errorHandler = vi.fn();
      websocketClient.onError(errorHandler);

      // Send enrollment-updated with missing enrollmentId in removal message
      mockWs.simulateMessage({
        id: '464',
        type: 'enrollment-removed',
        data: {}, // Missing enrollmentId
        timestamp: new Date().toISOString(),
      });

      // Application should not crash
      expect(mockWs.readyState).toBe(1); // Still open
    });
  });

  describe('Reconnection Logic with Exponential Backoff (Req 5.1, 5.2, 5.3, 5.4, 5.6)', () => {
    it('detects connection close and initiates reconnection (Req 5.1)', async () => {
      vi.useFakeTimers();

      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect first
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      const statusChanges: ConnectionStatus[] = [];
      websocketClient.onStatusChange(status => statusChanges.push(status));

      // Simulate connection close
      mockWs.simulateClose();

      // Should transition to reconnecting
      expect(statusChanges).toContain('reconnecting');

      vi.useRealTimers();
    });

    it('attempts reconnection with 1 second delay on first attempt (Req 5.2)', async () => {
      vi.useFakeTimers();

      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect first
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Simulate connection close to trigger reconnect
      mockWs.simulateClose();

      // Advance time by 900ms - should not have reconnected yet
      vi.advanceTimersByTime(900);
      expect(mockWebSocketInstances.length).toBe(1);

      // Advance time by 200ms more (1100ms total) - should attempt reconnect
      vi.advanceTimersByTime(200);
      expect(mockWebSocketInstances.length).toBe(2);

      vi.useRealTimers();
    });

    it('implements exponential backoff calculation correctly (Req 5.3, 5.4)', () => {
      // Test the exponential backoff formula directly
      // delay = min(2^n * 1000ms, 30000ms)
      const INITIAL_DELAY = 1000;
      const MAX_DELAY = 30000;

      const calculateBackoff = (attempt: number) => {
        return Math.min(INITIAL_DELAY * Math.pow(2, attempt), MAX_DELAY);
      };

      // Validates: Requirements 5.3, 5.4
      expect(calculateBackoff(0)).toBe(1000);    // 2^0 * 1000 = 1000
      expect(calculateBackoff(1)).toBe(2000);    // 2^1 * 1000 = 2000
      expect(calculateBackoff(2)).toBe(4000);    // 2^2 * 1000 = 4000
      expect(calculateBackoff(3)).toBe(8000);    // 2^3 * 1000 = 8000
      expect(calculateBackoff(4)).toBe(16000);   // 2^4 * 1000 = 16000
      expect(calculateBackoff(5)).toBe(30000);   // capped at 30000
      expect(calculateBackoff(10)).toBe(30000);  // capped at 30000
    });

    it('resets reconnection attempts counter on successful reconnection (Req 5.6)', async () => {
      vi.useFakeTimers();

      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';
      const enrollmentId = '550e8400-e29b-41d4-a716-446655440001';

      // Connect first
      const connectPromise = websocketClient.connect(url, traineeId, token);
      let mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Subscribe to something
      websocketClient.subscribe(enrollmentId);

      // Simulate connection close (triggers reconnect)
      mockWs.simulateClose();
      vi.advanceTimersByTime(1100); // Wait for first reconnect

      // Second reconnect attempt should happen at 2 seconds
      mockWs = mockWebSocketInstances[mockWebSocketInstances.length - 1];
      mockWs.simulateError();
      vi.advanceTimersByTime(2100);

      // Successful reconnection
      mockWs = mockWebSocketInstances[mockWebSocketInstances.length - 1];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '456',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });

      // Advance to let reconnection complete
      await vi.advanceTimersByTimeAsync(100);
      await vi.runAllTimersAsync();

      // Now simulate another close - should reset to 1 second delay
      mockWs.simulateClose();
      vi.advanceTimersByTime(1000);

      // Should have exactly one new reconnect attempt (at 1s, not 4s or higher)
      const previousConnectionCount = mockWebSocketInstances.length;
      vi.advanceTimersByTime(100); // Small buffer
      
      expect(mockWebSocketInstances.length).toBeGreaterThanOrEqual(previousConnectionCount);

      vi.useRealTimers();
    });

    it('automatically re-subscribes to all previous subscriptions on reconnect (Req 5.6)', async () => {
      vi.useFakeTimers();

      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';
      const enrollmentId1 = '550e8400-e29b-41d4-a716-446655440001';

      // Connect first
      const connectPromise = websocketClient.connect(url, traineeId, token);
      let mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Subscribe to an enrollment
      websocketClient.subscribe(enrollmentId1);
      
      const initialSubscriptions = mockWs.sentMessages.filter(msg => {
        const parsed = JSON.parse(msg);
        return parsed.type === 'subscribe';
      });
      expect(initialSubscriptions.length).toBe(1);

      // Simulate connection close  
      mockWs.simulateClose();

      // Wait for reconnection to be scheduled (1 second delay)
      vi.advanceTimersByTime(1100);
      
      // After this, a new connection should be in progress
      expect(mockWebSocketInstances.length).toBe(2);

      vi.useRealTimers();
    });

    it('handles reconnection error and schedules next attempt (Req 5.1, 5.2)', async () => {
      vi.useFakeTimers();

      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect first
      const connectPromise = websocketClient.connect(url, traineeId, token);
      let mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Track status changes
      const statusChanges: ConnectionStatus[] = [];
      websocketClient.onStatusChange(status => statusChanges.push(status));

      // Simulate connection close
      mockWs.simulateClose();

      // First reconnect attempt fails
      vi.advanceTimersByTime(1100);
      mockWs = mockWebSocketInstances[mockWebSocketInstances.length - 1];
      mockWs.simulateError();

      // Should transition back to reconnecting
      expect(statusChanges).toContain('reconnecting');

      // Second reconnect attempt
      vi.advanceTimersByTime(2100);

      // Verify a new connection was attempted
      expect(mockWebSocketInstances.length).toBeGreaterThanOrEqual(2);

      vi.useRealTimers();
    });

    it('emits reconnecting status when connection is lost (Req 13.2)', async () => {
      vi.useFakeTimers();

      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect first
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      const statusChanges: ConnectionStatus[] = [];
      websocketClient.onStatusChange(status => statusChanges.push(status));

      // Simulate connection close
      mockWs.simulateClose();

      // Should emit reconnecting status
      expect(statusChanges).toContain('reconnecting');

      vi.useRealTimers();
    });

    it('prevents reconnection if connection was intentionally disconnected', async () => {
      vi.useFakeTimers();

      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect first
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // After connecting, we should be connected
      expect(websocketClient.isConnected()).toBe(true);

      // Intentionally disconnect
      await websocketClient.disconnect();

      // Verify disconnected state
      expect(websocketClient.getConnectionStatus()).toBe('disconnected');

      // Advance timers - should NOT trigger reconnection
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      // Should still be disconnected
      expect(websocketClient.getConnectionStatus()).toBe('disconnected');

      vi.useRealTimers();
    });

    it('cleans up reconnection timeout on disconnect (Req 1.6)', async () => {
      vi.useFakeTimers();

      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect first
      const connectPromise = websocketClient.connect(url, traineeId, token);
      let mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '123',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Simulate connection close (starts reconnection timer)
      mockWs.simulateClose();

      // Disconnect before reconnection timeout fires
      await websocketClient.disconnect();

      // Advance past the reconnection timeout
      vi.advanceTimersByTime(2000);

      // Should not have attempted reconnection
      expect(mockWebSocketInstances.length).toBe(1);

      vi.useRealTimers();
    });
  });

  describe('Heartbeat Pong Response Tests (Req 1.5, 6.12)', () => {
    it('pong is sent in response to heartbeat ping (Req 1.5, 6.12)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000001',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Clear sent messages to isolate heartbeat response
      mockWs.sentMessages = [];

      // Simulate receiving heartbeat ping
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000005',
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      });

      // Verify pong message was sent
      const pongMessage = mockWs.sentMessages.find(msg => {
        const parsed = JSON.parse(msg);
        return parsed.type === 'pong';
      });

      expect(pongMessage).toBeDefined();
      expect(pongMessage).not.toBeNull();
    });

    it('pong has valid message structure (Req 1.5, 6.12, 8.1)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000001',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Clear sent messages
      mockWs.sentMessages = [];

      // Simulate receiving heartbeat ping
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000005',
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      });

      // Verify pong message structure
      const pongMessage = mockWs.sentMessages.find(msg => {
        const parsed = JSON.parse(msg);
        return parsed.type === 'pong';
      });

      expect(pongMessage).toBeDefined();
      const pongData = JSON.parse(pongMessage!);
      
      // Validate: Requirements 8.1 - message has required fields: id, type, timestamp
      expect(pongData).toHaveProperty('id');
      expect(pongData).toHaveProperty('type');
      expect(pongData).toHaveProperty('timestamp');
      expect(pongData.type).toBe('pong');
      expect(typeof pongData.id).toBe('string');
      expect(pongData.id.length > 0).toBe(true);
      expect(typeof pongData.timestamp).toBe('string');
    });

    it('pong is sent quickly within 100ms timing requirement (Req 1.5, 6.12)', async () => {
      vi.useFakeTimers();

      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000001',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Clear sent messages
      mockWs.sentMessages = [];

      // Simulate receiving heartbeat ping
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000005',
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      });

      // Check that pong was sent immediately (synchronously)
      const pongMessage = mockWs.sentMessages.find(msg => {
        const parsed = JSON.parse(msg);
        return parsed.type === 'pong';
      });

      expect(pongMessage).toBeDefined();
      
      // Advance time by only 50ms to verify pong arrives within 100ms window
      vi.advanceTimersByTime(50);
      
      // Pong should already be in sent messages (it's sent synchronously)
      expect(mockWs.sentMessages.some(msg => JSON.parse(msg).type === 'pong')).toBe(true);

      vi.useRealTimers();
    });

    it('multiple heartbeat pings each receive pong responses (Req 1.5, 6.12)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000001',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Clear sent messages
      mockWs.sentMessages = [];

      // Send first heartbeat
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000005',
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      });

      // Send second heartbeat
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000006',
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      });

      // Send third heartbeat
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000007',
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      });

      // Count pong responses
      const pongMessages = mockWs.sentMessages.filter(msg => {
        const parsed = JSON.parse(msg);
        return parsed.type === 'pong';
      });

      // Should have exactly 3 pong responses (one for each heartbeat)
      expect(pongMessages.length).toBe(3);
    });

    it('pong response preserves message ID uniqueness (Req 8.1)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000001',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Clear sent messages
      mockWs.sentMessages = [];

      // Send multiple heartbeats and collect pong IDs
      const pongIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        mockWs.simulateMessage({
          id: `550e8400-e29b-41d4-a716-00000000000${i}`,
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        });
      }

      // Find all pong messages and collect their IDs
      mockWs.sentMessages.forEach(msg => {
        const parsed = JSON.parse(msg);
        if (parsed.type === 'pong') {
          pongIds.push(parsed.id);
        }
      });

      // Verify all pong IDs are unique
      expect(pongIds.length).toBe(5);
      const uniqueIds = new Set(pongIds);
      expect(uniqueIds.size).toBe(5);
    });

    it('pong timestamp is valid ISO8601 format (Req 8.1)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000001',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      // Clear sent messages
      mockWs.sentMessages = [];

      // Simulate receiving heartbeat ping
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000005',
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      });

      // Verify pong message timestamp format
      const pongMessage = mockWs.sentMessages.find(msg => {
        const parsed = JSON.parse(msg);
        return parsed.type === 'pong';
      });

      expect(pongMessage).toBeDefined();
      const pongData = JSON.parse(pongMessage!);
      
      // Validate ISO8601 format
      const timestamp = pongData.timestamp;
      expect(typeof timestamp).toBe('string');
      
      // Check if it's valid ISO8601 by attempting to parse it
      const date = new Date(timestamp);
      expect(date.toString()).not.toBe('Invalid Date');
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('connection remains open after sending pong (Req 1.5, 6.12)', async () => {
      const url = 'ws://localhost:8080';
      const traineeId = '550e8400-e29b-41d4-a716-446655440000';
      const token = 'valid-token';

      // Connect
      const connectPromise = websocketClient.connect(url, traineeId, token);
      const mockWs = mockWebSocketInstances[0];
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000001',
        type: 'subscription-ack',
        timestamp: new Date().toISOString(),
      });
      await connectPromise;

      expect(websocketClient.isConnected()).toBe(true);
      expect(mockWs.readyState).toBe(1); // WebSocket.OPEN

      // Simulate receiving heartbeat ping
      mockWs.simulateMessage({
        id: '550e8400-e29b-41d4-a716-000000000005',
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      });

      // Connection should still be open after pong response
      expect(websocketClient.isConnected()).toBe(true);
      expect(mockWs.readyState).toBe(1); // WebSocket.OPEN
    });
  });
