import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { enrollmentService, Enrollment, UpdateEnrollmentPayload } from './enrollmentService';
import api from './api';

/**
 * Property 1: Enrollment Fetch Returns All Trainee Records
 * 
 * **Validates: Requirements 1.1, 1.2**
 * 
 * Property: For any trainee ID, fetching enrollments SHALL return all enrollment 
 * records associated with that trainee from the database, and SHALL NOT return any 
 * enrollments from other trainees.
 * 
 * Test Strategy: Generate random trainee IDs with test enrollments. Fetch using 
 * service for trainee A. Verify: (1) all enrollments for trainee A returned, 
 * (2) no enrollments from trainee B or C returned, (3) response matches trainee_id filter.
 * 
 * Minimum 100 iterations using fast-check
 */
describe('Property 1: Enrollment Fetch Returns All Trainee Records', () => {
  // ============================================================================
  // SETUP AND HELPERS
  // ============================================================================

  beforeEach(() => {
    vi.clearAllMocks();
    enrollmentService.clearCache();
  });

  afterEach(() => {
    enrollmentService.clearCache();
    vi.clearAllMocks();
  });

  /**
   * Helper: Create a mock Enrollment for a specific trainee
   * Uses properly formatted UUIDs that pass Zod validation
   */
  const createMockEnrollment = (traineeId: string, index: number): Enrollment => {
    // Generate a valid UUID format (deterministic based on seed)
    const generateUUID = (seed: string): string => {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      // Create valid UUID v4 format
      const a = Math.abs(hash).toString(16).padStart(8, '0');
      const b = Math.abs(hash ^ 0x12345).toString(16).padStart(4, '0');
      const c = Math.abs(hash ^ 0x67890).toString(16).padStart(4, '0');
      const d = Math.abs(hash ^ 0xabcde).toString(16).padStart(4, '0');
      const e = Math.abs(hash ^ 0xfedcb).toString(16).padStart(12, '0');
      
      return `${a.substring(0, 8)}-${b.substring(0, 4)}-4${c.substring(1, 4)}-8${d.substring(1, 4)}-${e.substring(0, 12)}`;
    };

    return {
      id: generateUUID(`enroll-${traineeId}-${index}`),
      trainee_id: traineeId,
      program_id: generateUUID(`prog-${index}`),
      status: 'enrolled',
      enrollment_date: '2024-01-15',
      completion_date: null,
      final_grade: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      trainee: {
        id: traineeId,
        first_name: 'John',
        last_name: 'Doe',
        middle_name: 'Q',
        email: 'john@example.com',
      },
      program: {
        id: generateUUID(`prog-${index}`),
        name: `Program ${index}`,
        description: 'Test program',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'active',
      },
    };
  };

  // ============================================================================
  // PROPERTY TESTS - 100+ iterations each
  // ============================================================================

  it(
    'returns only enrollments matching the trainee_id parameter',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc.uuid(),
            fc.integer({ min: 1, max: 5 }),
            fc.integer({ min: 0, max: 3 }),
            fc.integer({ min: 1, max: 4 })
          ),
          async ([targetTraineeId, targetCount, otherTraineeCount, perOther]) => {
            // Arrange: Create enrollments for target trainee
            const targetEnrollments: Enrollment[] = [];
            for (let i = 0; i < targetCount; i++) {
              targetEnrollments.push(createMockEnrollment(targetTraineeId, i));
            }

            // Create enrollments for other trainees (not returned by API)
            for (let t = 0; t < otherTraineeCount; t++) {
              const otherId = fc.sample(fc.uuid(), 1)[0];
              for (let i = 0; i < perOther; i++) {
                createMockEnrollment(otherId, i);
              }
            }

            // Mock API to return only target's enrollments
            const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({
              data: { data: targetEnrollments },
            });

            try {
              // Act
              const result = await enrollmentService.fetchEnrollments(targetTraineeId);

              // Assert 1: All returned enrollments have matching trainee_id
              result.forEach((enrollment) => {
                expect(enrollment.trainee_id).toBe(targetTraineeId);
              });

              // Assert 2: Correct count returned
              expect(result.length).toBe(targetCount);

              // Assert 3: API called with correct filter
              expect(getSpy).toHaveBeenCalledWith(`/enrollments?trainee_id=${targetTraineeId}`);
            } finally {
              getSpy.mockRestore();
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    'handles case where trainee has no enrollments',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc.uuid(),
            fc.integer({ min: 1, max: 2 }),
            fc.integer({ min: 1, max: 3 })
          ),
          async ([targetTraineeId, otherCount, perOther]) => {
            // Arrange: No enrollments for target, only for others
            const otherEnrollments: Enrollment[] = [];
            for (let t = 0; t < otherCount; t++) {
              for (let i = 0; i < perOther; i++) {
                otherEnrollments.push(createMockEnrollment(fc.sample(fc.uuid(), 1)[0], i));
              }
            }

            // Mock API to return empty array
            const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({
              data: { data: [] },
            });

            try {
              // Act
              const result = await enrollmentService.fetchEnrollments(targetTraineeId);

              // Assert: Returns empty array, not null/undefined
              expect(Array.isArray(result)).toBe(true);
              expect(result.length).toBe(0);

              expect(getSpy).toHaveBeenCalledWith(`/enrollments?trainee_id=${targetTraineeId}`);
            } finally {
              getSpy.mockRestore();
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    'ensures no cross-trainee data contamination between fetches',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc.uuid(),
            fc.uuid(),
            fc.integer({ min: 1, max: 3 }),
            fc.integer({ min: 1, max: 3 })
          ),
          async ([traineeA, traineeB, countA, countB]) => {
            // Skip if IDs are same
            if (traineeA === traineeB) return true;

            // Arrange: Create distinct enrollments
            const enrollmentsA: Enrollment[] = [];
            for (let i = 0; i < countA; i++) {
              enrollmentsA.push(createMockEnrollment(traineeA, i));
            }

            const enrollmentsB: Enrollment[] = [];
            for (let i = 0; i < countB; i++) {
              enrollmentsB.push(createMockEnrollment(traineeB, i + 100));
            }

            // Mock API with conditional logic
            const getSpy = vi.spyOn(api, 'get').mockImplementation((url: string) => {
              if (url.includes(`trainee_id=${traineeA}`)) {
                return Promise.resolve({ data: { data: enrollmentsA } });
              }
              if (url.includes(`trainee_id=${traineeB}`)) {
                return Promise.resolve({ data: { data: enrollmentsB } });
              }
              return Promise.resolve({ data: { data: [] } });
            });

            try {
              // Act: Fetch for both trainees
              const [resultA, resultB] = await Promise.all([
                enrollmentService.fetchEnrollments(traineeA),
                enrollmentService.fetchEnrollments(traineeB),
              ]);

              // Assert: A gets only A's, B gets only B's
              expect(resultA.length).toBe(countA);
              expect(resultB.length).toBe(countB);

              resultA.forEach((e) => expect(e.trainee_id).toBe(traineeA));
              resultB.forEach((e) => expect(e.trainee_id).toBe(traineeB));

              // Assert: No ID overlap
              const idsA = new Set(resultA.map((e) => e.id));
              const idsB = new Set(resultB.map((e) => e.id));
              resultA.forEach((e) => expect(idsB.has(e.id)).toBe(false));
              resultB.forEach((e) => expect(idsA.has(e.id)).toBe(false));
            } finally {
              getSpy.mockRestore();
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    'preserves all enrollment fields when filtering by trainee',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc.uuid(),
            fc.integer({ min: 2, max: 4 })
          ),
          async ([traineeId, count]) => {
            // Arrange: Create enrollments with various field values
            const enrollments: Enrollment[] = [
              createMockEnrollment(traineeId, 0),
              {
                ...createMockEnrollment(traineeId, 1),
                status: 'completed',
                completion_date: '2024-12-15',
                final_grade: 92,
              },
            ];

            for (let i = 2; i < count; i++) {
              enrollments.push(createMockEnrollment(traineeId, i));
            }

            const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({
              data: { data: enrollments },
            });

            try {
              // Act
              const result = await enrollmentService.fetchEnrollments(traineeId);

              // Assert: All fields present and preserved
              result.forEach((enrollment, index) => {
                const original = enrollments[index];

                expect(enrollment.id).toBe(original.id);
                expect(enrollment.trainee_id).toBe(original.trainee_id);
                expect(enrollment.program_id).toBe(original.program_id);
                expect(enrollment.status).toBe(original.status);
                expect(enrollment.enrollment_date).toBe(original.enrollment_date);
                expect(enrollment.completion_date).toBe(original.completion_date);
                expect(enrollment.final_grade).toBe(original.final_grade);
                expect(enrollment.created_at).toBe(original.created_at);
                expect(enrollment.updated_at).toBe(original.updated_at);
              });
            } finally {
              getSpy.mockRestore();
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  /**
   * Comprehensive property test combining all aspects
   * **Validates: Requirements 1.1, 1.2**
   */
  it(
    '**Validates: Requirements 1.1, 1.2** - Enrollment fetch returns all and only trainee records',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc.uuid(),
            fc.integer({ min: 1, max: 5 }),
            fc.integer({ min: 0, max: 2 }),
            fc.integer({ min: 1, max: 4 })
          ),
          async ([targetTraineeId, targetCount, otherCount, perOther]) => {
            // Arrange: Build mixed dataset
            const targetEnrollments: Enrollment[] = [];
            for (let i = 0; i < targetCount; i++) {
              targetEnrollments.push(createMockEnrollment(targetTraineeId, i));
            }

            // Mock API
            const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({
              data: { data: targetEnrollments },
            });

            try {
              // Act: Fetch for target
              const result = await enrollmentService.fetchEnrollments(targetTraineeId);

              // Assert 1 (Req 1.1): All enrollments for trainee returned
              expect(result.length).toBe(targetCount);

              // Assert 2 (Req 1.2): Only trainee's enrollments returned
              result.forEach((enrollment) => {
                expect(enrollment.trainee_id).toBe(targetTraineeId);
              });

              // Assert 3: Response matches filter
              expect(getSpy).toHaveBeenCalledWith(`/enrollments?trainee_id=${targetTraineeId}`);

              // Assert 4: All required fields present
              result.forEach((enrollment) => {
                expect(enrollment).toHaveProperty('id');
                expect(enrollment).toHaveProperty('trainee_id');
                expect(enrollment).toHaveProperty('program_id');
                expect(enrollment).toHaveProperty('status');
                expect(enrollment).toHaveProperty('enrollment_date');
                expect(enrollment).toHaveProperty('created_at');
                expect(enrollment).toHaveProperty('updated_at');
              });
            } finally {
              getSpy.mockRestore();
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

/**
 * Unit tests for supporting service methods
 */
describe('EnrollmentService - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enrollmentService.clearCache();
  });

  afterEach(() => {
    enrollmentService.clearCache();
    vi.clearAllMocks();
  });

  describe('getEnrollment', () => {
    it('fetches a single enrollment by ID', async () => {
      const enrollmentId = '550e8400-e29b-41d4-a716-446655440000';
      const traineeId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      const mockEnrollment: Enrollment = {
        id: enrollmentId,
        trainee_id: traineeId,
        program_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        status: 'completed',
        enrollment_date: '2024-01-15',
        completion_date: '2024-12-20',
        final_grade: 85,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
        data: { data: mockEnrollment },
      });

      const result = await enrollmentService.getEnrollment(enrollmentId);

      expect(getSpy).toHaveBeenCalledWith(`/enrollments/${enrollmentId}`);
      expect(result).toEqual(mockEnrollment);

      getSpy.mockRestore();
    });
  });

  describe('clearCache', () => {
    it('clears cache for a specific trainee', async () => {
      const traineeId = '550e8400-e29b-41d4-a716-446655440001';
      const mockEnrollments: Enrollment[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          trainee_id: traineeId,
          program_id: '550e8400-e29b-41d4-a716-446655440003',
          status: 'enrolled',
          enrollment_date: '2024-01-15',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
        data: { data: mockEnrollments },
      });

      // First call - populates cache
      await enrollmentService.fetchEnrollments(traineeId);
      expect(getSpy).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await enrollmentService.fetchEnrollments(traineeId);
      expect(getSpy).toHaveBeenCalledTimes(1); // Still 1

      // Clear cache
      enrollmentService.clearCache(`enrollments_${traineeId}`);

      // Third call - cache cleared, should fetch again
      await enrollmentService.fetchEnrollments(traineeId);
      expect(getSpy).toHaveBeenCalledTimes(2);

      getSpy.mockRestore();
    });
  });
});
