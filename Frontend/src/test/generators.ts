import fc from 'fast-check';

/**
 * Fast-check Generators for Common Test Types
 * 
 * These generators provide fast-check compatible arbitrary functions
 * for commonly used types in tests.
 */

/**
 * Generates a valid UUID (format: 8-4-4-4-12)
 * Uses integer->hex conversion since hexaString doesn't exist in fast-check
 */
export const genUUID = () =>
  fc
    .tuple(
      fc.integer({ min: 0, max: 0xffffffff }).map(n => n.toString(16).padStart(8, '0')),
      fc.integer({ min: 0, max: 0xffff }).map(n => n.toString(16).padStart(4, '0')),
      fc.integer({ min: 0, max: 0xffff }).map(n => n.toString(16).padStart(4, '0')),
      fc.integer({ min: 0, max: 0xffff }).map(n => n.toString(16).padStart(4, '0')),
      fc.integer({ min: 0, max: 0xffffffffffff }).map(n => n.toString(16).padStart(12, '0'))
    )
    .map(
      ([a, b, c, d, e]) =>
        `${a}-${b}-${c}-${d}-${e}`.toLowerCase()
    );

/**
 * Generates a valid ISO date string (YYYY-MM-DD)
 */
export const genISODate = () =>
  fc.tuple(
    fc.integer({ min: 2020, max: 2025 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  ).map(([year, month, day]) => {
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  });

/**
 * Generates enrollment status values
 */
export const genEnrollmentStatus = () =>
  fc.constantFrom('enrolled', 'active', 'completed', 'dropped', 'failed');

/**
 * Generates a valid ISO datetime string (with time)
 */
export const genISODateTime = () =>
  fc.tuple(
    genISODate(),
    fc.integer({ min: 0, max: 23 }),
    fc.integer({ min: 0, max: 59 }),
    fc.integer({ min: 0, max: 59 })
  ).map(([date, hour, min, sec]) => {
    const hourStr = String(hour).padStart(2, '0');
    const minStr = String(min).padStart(2, '0');
    const secStr = String(sec).padStart(2, '0');
    return `${date}T${hourStr}:${minStr}:${secStr}Z`;
  });
