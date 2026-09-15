import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  enrollmentService,
  Enrollment,
  ConnectionStatus,
  EnrollmentUpdateCallback,
} from '../services/enrollmentService';
import logger from '../utils/logger';

/**
 * Type definition for the enrollment context
 */
interface EnrollmentContextType {
  /** Array of enrollments for current trainee */
  enrollments: Enrollment[];
  /** Current connection status (connected, disconnected, reconnecting, connecting) */
  connectionStatus: ConnectionStatus;
  /** Whether enrollments are being fetched */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Current trainee ID for context */
  traineeId: string | null;
  /** Set the trainee ID (updates enrollments automatically) */
  setTraineeId: (traineeId: string) => void;
  /** Manually refetch enrollments from API */
  refetch: () => Promise<void>;
  /** Force refresh from REST API (bypasses cache and WebSocket) */
  forceRefresh: () => Promise<void>;
  /** Subscribe to enrollment changes (returns unsubscribe function) */
  subscribe: (callback: EnrollmentUpdateCallback) => () => void;
  /** Get current enrollments snapshot */
  getEnrollments: () => Enrollment[];
}

/**
 * Create enrollment context with undefined default
 * Must be wrapped by EnrollmentProvider to use
 */
const EnrollmentContext = createContext<EnrollmentContextType | undefined>(undefined);

/**
 * Props for EnrollmentProvider component
 */
interface EnrollmentProviderProps {
  /** Child components to provide context to */
  children: ReactNode;
  /** Optional initial trainee ID (if not provided, must be set via setTraineeId) */
  initialTraineeId?: string;
}

/**
 * EnrollmentProvider component
 *
 * Provides enrollment context to child components with real-time WebSocket synchronization.
 * Features:
 * - Manages enrollment state for current trainee
 * - Subscribes to WebSocket enrollment updates
 * - Notifies all subscribers when enrollments change
 * - Provides connection status visibility
 * - Handles fallback to REST API when WebSocket unavailable
 *
 * **Validates: Requirements 4.4**
 *
 * @param props - Provider props including children and optional initialTraineeId
 * @returns React Provider component wrapping children
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <EnrollmentProvider initialTraineeId="trainee-123">
 *       <MyComponents />
 *     </EnrollmentProvider>
 *   );
 * }
 * ```
 */
export const EnrollmentProvider: React.FC<EnrollmentProviderProps> = ({
  children,
  initialTraineeId,
}) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [traineeId, setTraineeId] = useState<string | null>(initialTraineeId || null);
  const [subscribers, setSubscribers] = useState<Set<EnrollmentUpdateCallback>>(new Set());

  /**
   * Notify all subscribers of enrollment changes
   * This is used internally when enrollments are updated via WebSocket
   */
  const notifySubscribers = useCallback((event: Parameters<EnrollmentUpdateCallback>[0]) => {
    subscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        logger.error('[EnrollmentContext] Subscriber callback error', { error: err });
      }
    });
  }, [subscribers]);

  /**
   * Handle enrollment updates from enrollmentService
   * Called when WebSocket events are received
   */
  const handleEnrollmentUpdate = useCallback<EnrollmentUpdateCallback>(
    (event) => {
      logger.debug('[EnrollmentContext] Enrollment update received', { eventType: event.type });

      if (event.type === 'updated' && event.enrollment) {
        // Update enrollment in context state
        setEnrollments((prev) =>
          prev.map((e) => (e.id === event.enrollment!.id ? event.enrollment! : e))
        );
        // Notify subscribers
        notifySubscribers(event);
      } else if (event.type === 'added' && event.enrollment) {
        // Add enrollment to context state
        setEnrollments((prev) => [...prev, event.enrollment!]);
        // Notify subscribers
        notifySubscribers(event);
      } else if (event.type === 'removed' && event.enrollmentId) {
        // Remove enrollment from context state
        setEnrollments((prev) => prev.filter((e) => e.id !== event.enrollmentId));
        // Notify subscribers
        notifySubscribers(event);
      }
    },
    [notifySubscribers]
  );

  /**
   * Fetch enrollments for the trainee
   */
  const fetchEnrollments = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await enrollmentService.fetchEnrollments(id);
      setEnrollments(data);
      logger.debug('[EnrollmentContext] Enrollments fetched', { count: data.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch enrollments';
      setError(errorMessage);
      logger.error('[EnrollmentContext] Failed to fetch enrollments', {
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Manual refetch from REST API
   */
  const handleRefresh = useCallback(async () => {
    if (!traineeId) return;

    try {
      setError(null);
      const data = await enrollmentService.forceRefresh(traineeId);
      setEnrollments(data);
      logger.debug('[EnrollmentContext] Force refresh completed', { count: data.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh enrollments';
      setError(errorMessage);
      logger.error('[EnrollmentContext] Force refresh failed', { error: errorMessage });
    }
  }, [traineeId]);

  /**
   * Manual refetch (same as forceRefresh but alternative name)
   */
  const handleRefetch = useCallback(async () => {
    if (traineeId) {
      await fetchEnrollments(traineeId);
    }
  }, [traineeId, fetchEnrollments]);

  /**
   * Subscribe to enrollment updates
   * Returns unsubscribe function
   */
  const subscribe = useCallback((callback: EnrollmentUpdateCallback) => {
    setSubscribers((prev) => new Set([...prev, callback]));
    logger.debug('[EnrollmentContext] New subscriber added', {
      subscriberCount: subscribers.size + 1,
    });

    // Return unsubscribe function
    return () => {
      setSubscribers((prev) => {
        const next = new Set(prev);
        next.delete(callback);
        logger.debug('[EnrollmentContext] Subscriber removed', { subscriberCount: next.size });
        return next;
      });
    };
  }, [subscribers.size]);

  /**
   * Get current enrollments snapshot
   */
  const getEnrollments = useCallback(() => [...enrollments], [enrollments]);

  /**
   * Effect: Fetch enrollments and subscribe to updates when traineeId changes
   * Dependencies: [traineeId, fetchEnrollments, handleEnrollmentUpdate]
   */
  useEffect(() => {
    if (!traineeId) {
      setEnrollments([]);
      return;
    }

    // Fetch initial enrollments
    fetchEnrollments(traineeId);

    // Subscribe to enrollment updates from enrollmentService
    const unsubscribe = enrollmentService.setEnrollmentUpdateHandler(handleEnrollmentUpdate);

    // Poll connection status
    const statusInterval = setInterval(() => {
      const status = enrollmentService.getConnectionStatus();
      setConnectionStatus(status);
    }, 1000);

    logger.debug('[EnrollmentContext] Subscribed to updates', { traineeId });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      clearInterval(statusInterval);
      logger.debug('[EnrollmentContext] Unsubscribed from updates');
    };
  }, [traineeId, fetchEnrollments, handleEnrollmentUpdate]);

  /**
   * Create context value
   */
  const value: EnrollmentContextType = {
    enrollments,
    connectionStatus,
    loading,
    error,
    traineeId,
    setTraineeId,
    refetch: handleRefetch,
    forceRefresh: handleRefresh,
    subscribe,
    getEnrollments,
  };

  return (
    <EnrollmentContext.Provider value={value}>
      {children}
    </EnrollmentContext.Provider>
  );
};

/**
 * Hook to use enrollment context
 * Must be called within EnrollmentProvider
 *
 * Throws error if used outside of provider
 *
 * @returns Enrollment context with enrollments, connection status, and control methods
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { enrollments, connectionStatus } = useEnrollment();
 *   return (
 *     <div>
 *       {connectionStatus === 'connected' && <span>✓ Real-time</span>}
 *       {enrollments.map(e => <div key={e.id}>{e.program?.name}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export const useEnrollment = (): EnrollmentContextType => {
  const context = useContext(EnrollmentContext);
  if (!context) {
    throw new Error('useEnrollment must be used within EnrollmentProvider');
  }
  return context;
};
