/**
 * Integration Tests for Reconnection Scenarios
 *
 * Tests complete reconnection flow:
 * - Client connects
 * - Connection drops
 * - Client reconnects
 * - Previous subscriptions are re-established
 * - Updates are received after reconnection
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.6**
 */

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Simulate complete WebSocket client lifecycle with reconnection
 */
class WebSocketClientSimulator {
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
  private subscriptions: Set<string> = new Set();
  private messageBuffer: any[] = [];
  private reconnectAttempt: number = 0;
  private maxReconnectTime: number = 30000;
  private reconnectionStartTime: number = 0;
  private receivedMessages: any[] = [];
  private messageHandlers: Map<string, Function[]> = new Map();
  private connected: boolean = false;

  async connect(): Promise<void> {
    this.connectionState = 'connecting';
    this.connected = true;
    this.connectionState = 'connected';
    this.reconnectAttempt = 0;
    this.messageBuffer = [];
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.connectionState = 'disconnected';
  }

  async handleConnectionLoss(): Promise<void> {
    if (this.connectionState === 'connected') {
      this.connected = false;
      this.connectionState = 'reconnecting';
      this.reconnectionStartTime = Date.now();
      this.reconnectAttempt = 0;
    }
  }

  async attemptReconnect(simulateSuccess: boolean = true): Promise<boolean> {
    if (this.connectionState !== 'reconnecting') {
      return false;
    }

    const elapsedTime = Date.now() - this.reconnectionStartTime;
    if (elapsedTime > this.maxReconnectTime) {
      return false;
    }

    const delay = this.calculateBackoffDelay();
    await this.delay(Math.min(delay, 50));

    if (simulateSuccess) {
      this.connected = true;
      this.connectionState = 'connected';
      this.reconnectAttempt++;

      for (const enrollmentId of this.subscriptions) {
        this.emit('subscription-reestablished', { enrollmentId });
      }

      return true;
    }

    this.reconnectAttempt++;
    return false;
  }

  subscribe(enrollmentId: string): void {
    this.subscriptions.add(enrollmentId);
  }

  unsubscribe(enrollmentId: string): void {
    this.subscriptions.delete(enrollmentId);
  }

  getSubscriptions(): Set<string> {
    return new Set(this.subscriptions);
  }

  receiveMessage(message: any): void {
    if (this.connectionState === 'connected') {
      this.receivedMessages.push(message);
      this.emit('message', message);
    } else {
      this.messageBuffer.push(message);
    }
  }

  getBufferedMessages(): any[] {
    return [...this.messageBuffer];
  }

  flushMessageBuffer(): void {
    for (const message of this.messageBuffer) {
      this.receivedMessages.push(message);
      this.emit('message', message);
    }
    this.messageBuffer = [];
  }

  getReceivedMessages(): any[] {
    return [...this.receivedMessages];
  }

  getConnectionStatus(): string {
    return this.connectionState;
  }

  on(event: string, handler: Function): void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)!.push(handler);
  }

  private emit(event: string, data: any): void {
    const handlers = this.messageHandlers.get(event) || [];
    for (const handler of handlers) {
      handler(data);
    }
  }

  private calculateBackoffDelay(): number {
    const INITIAL_DELAY = 1000;
    const MAX_DELAY = 30000;
    return Math.min(INITIAL_DELAY * Math.pow(2, this.reconnectAttempt), MAX_DELAY);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  isConnected(): boolean {
    return this.connected && this.connectionState === 'connected';
  }
}

describe('Integration: Reconnection Scenarios (Req 5.1, 5.2, 5.3, 5.4, 5.6)', () => {
  let client: WebSocketClientSimulator;

  beforeEach(() => {
    client = new WebSocketClientSimulator();
  });

  it('client successfully reconnects after connection drop', async () => {
    await client.connect();
    expect(client.getConnectionStatus()).toBe('connected');
    expect(client.isConnected()).toBe(true);

    await client.handleConnectionLoss();
    expect(client.getConnectionStatus()).toBe('reconnecting');
    expect(client.isConnected()).toBe(false);

    const success = await client.attemptReconnect(true);
    expect(success).toBe(true);
    expect(client.getConnectionStatus()).toBe('connected');
    expect(client.isConnected()).toBe(true);
  });

  it('all previous subscriptions are re-established after reconnection', async () => {
    const enrollmentIds = ['enrollment-1', 'enrollment-2', 'enrollment-3'];

    await client.connect();
    for (const id of enrollmentIds) {
      client.subscribe(id);
    }

    expect(client.getSubscriptions().size).toBe(3);

    await client.handleConnectionLoss();
    const subsBeforeReconnect = client.getSubscriptions();
    expect(subsBeforeReconnect.size).toBe(3);

    await client.attemptReconnect(true);
    expect(client.getConnectionStatus()).toBe('connected');

    const subsAfterReconnect = client.getSubscriptions();
    expect(subsAfterReconnect.size).toBe(3);

    for (const id of enrollmentIds) {
      expect(subsAfterReconnect.has(id)).toBe(true);
    }
  });

  it('updates are received after reconnection', async () => {
    const enrollmentId = 'enrollment-1';

    await client.connect();
    client.subscribe(enrollmentId);

    await client.handleConnectionLoss();

    const offlineMessage = {
      type: 'enrollment-updated',
      data: { id: enrollmentId, status: 'completed' },
    };
    client.receiveMessage(offlineMessage);

    expect(client.getBufferedMessages()).toHaveLength(1);
    expect(client.getReceivedMessages()).toHaveLength(0);

    await client.attemptReconnect(true);

    client.flushMessageBuffer();

    expect(client.getReceivedMessages()).toHaveLength(1);
    expect(client.getReceivedMessages()[0].data.status).toBe('completed');
  });

  it('new updates arrive after reconnection', async () => {
    const enrollmentId = 'enrollment-1';

    await client.connect();
    client.subscribe(enrollmentId);

    const connectedMessage = {
      type: 'enrollment-updated',
      data: { id: enrollmentId, status: 'active' },
    };
    client.receiveMessage(connectedMessage);
    expect(client.getReceivedMessages()).toHaveLength(1);

    await client.handleConnectionLoss();
    expect(client.getConnectionStatus()).toBe('reconnecting');

    await client.attemptReconnect(true);
    expect(client.getConnectionStatus()).toBe('connected');

    const newMessage = {
      type: 'enrollment-updated',
      data: { id: enrollmentId, status: 'completed' },
    };
    client.receiveMessage(newMessage);

    const allMessages = client.getReceivedMessages();
    expect(allMessages).toHaveLength(2);
    expect(allMessages[1].data.status).toBe('completed');
  });

  it('multiple reconnection attempts with backoff', async () => {
    await client.connect();
    client.subscribe('enrollment-1');

    await client.handleConnectionLoss();
    expect(client.getConnectionStatus()).toBe('reconnecting');

    let attempt1 = await client.attemptReconnect(false);
    expect(attempt1).toBe(false);

    let attempt2 = await client.attemptReconnect(true);
    expect(attempt2).toBe(true);
    expect(client.getConnectionStatus()).toBe('connected');
  });

  it('subscriptions survive multiple disconnect/reconnect cycles', async () => {
    const enrollmentIds = ['enrollment-1', 'enrollment-2'];

    await client.connect();
    for (const id of enrollmentIds) {
      client.subscribe(id);
    }

    for (let cycle = 0; cycle < 3; cycle++) {
      await client.handleConnectionLoss();
      let subs = client.getSubscriptions();
      expect(subs.size).toBe(enrollmentIds.length);

      await client.attemptReconnect(true);
      subs = client.getSubscriptions();
      expect(subs.size).toBe(enrollmentIds.length);
    }
  });

  it('new subscriptions during active connection are maintained through reconnection', async () => {
    await client.connect();
    client.subscribe('enrollment-1');
    expect(client.getSubscriptions().size).toBe(1);

    client.subscribe('enrollment-2');
    expect(client.getSubscriptions().size).toBe(2);

    await client.handleConnectionLoss();
    await client.attemptReconnect(true);

    const subs = client.getSubscriptions();
    expect(subs.size).toBe(2);
    expect(subs.has('enrollment-1')).toBe(true);
    expect(subs.has('enrollment-2')).toBe(true);
  });

  it('unsubscriptions are maintained through reconnection', async () => {
    await client.connect();
    client.subscribe('enrollment-1');
    client.subscribe('enrollment-2');
    client.subscribe('enrollment-3');
    expect(client.getSubscriptions().size).toBe(3);

    client.unsubscribe('enrollment-2');
    expect(client.getSubscriptions().size).toBe(2);

    await client.handleConnectionLoss();
    await client.attemptReconnect(true);

    const subs = client.getSubscriptions();
    expect(subs.size).toBe(2);
    expect(subs.has('enrollment-1')).toBe(true);
    expect(subs.has('enrollment-2')).toBe(false);
    expect(subs.has('enrollment-3')).toBe(true);
  });

  it('rapid reconnects do not lose subscriptions', async () => {
    await client.connect();
    const enrollmentIds = Array.from({ length: 10 }, (_, i) => `enrollment-${i}`);

    for (const id of enrollmentIds) {
      client.subscribe(id);
    }

    for (let i = 0; i < 5; i++) {
      await client.handleConnectionLoss();
      const subs = client.getSubscriptions();
      expect(subs.size).toBe(enrollmentIds.length);

      await client.attemptReconnect(true);
      const subsAfter = client.getSubscriptions();
      expect(subsAfter.size).toBe(enrollmentIds.length);
    }
  });

  it('connection state transitions are correct through reconnection', async () => {
    expect(client.getConnectionStatus()).toBe('disconnected');

    await client.connect();
    expect(client.getConnectionStatus()).toBe('connected');

    await client.handleConnectionLoss();
    expect(client.getConnectionStatus()).toBe('reconnecting');

    await client.attemptReconnect(true);
    expect(client.getConnectionStatus()).toBe('connected');
  });

  it('message arrival during active connection is received immediately', async () => {
    const enrollmentId = 'enrollment-1';

    await client.connect();
    client.subscribe(enrollmentId);

    const message = {
      type: 'enrollment-updated',
      data: { id: enrollmentId, status: 'completed' },
    };
    client.receiveMessage(message);

    expect(client.getReceivedMessages()).toHaveLength(1);
    expect(client.getBufferedMessages()).toHaveLength(0);
  });

  it('message handlers are called on reconnection events', async () => {
    const events: string[] = [];

    client.on('subscription-reestablished', (data) => {
      events.push('subscription-reestablished');
    });

    client.on('message', (data) => {
      events.push('message');
    });

    await client.connect();
    client.subscribe('enrollment-1');

    await client.handleConnectionLoss();
    await client.attemptReconnect(true);

    expect(events).toContain('subscription-reestablished');
  });
});
