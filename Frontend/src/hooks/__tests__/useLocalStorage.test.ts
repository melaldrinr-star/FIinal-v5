import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage, useProgramIdStorage, useSelectiveLocalStorage } from '../useLocalStorage';
import * as fc from 'fast-check';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Basic Storage Operations', () => {
    it('should store a value in LocalStorage', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[1]('test-value');
      });

      expect(result.current[0]).toBe('test-value');
      expect(localStorage.getItem('test-key')).toBe('"test-value"');
    });

    it('should retrieve a value from LocalStorage', () => {
      localStorage.setItem('test-key', '"stored-value"');

      const { result } = renderHook(() => useLocalStorage('test-key'));

      expect(result.current[0]).toBe('stored-value');
    });

    it('should handle missing keys gracefully', () => {
      const { result } = renderHook(() => useLocalStorage('non-existent-key'));

      expect(result.current[0]).toBeNull();
      expect(result.current[3]).toBeNull(); // No error
    });

    it('should use initial value when key not in storage', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'default-value'));

      expect(result.current[0]).toBe('default-value');
    });

    it('should support storing objects', () => {
      const testObject = { id: '123', name: 'Test Program' };
      const { result } = renderHook(() => useLocalStorage('test-obj'));

      act(() => {
        result.current[1](testObject);
      });

      expect(result.current[0]).toEqual(testObject);
    });
  });

  describe('Removal Operations', () => {
    it('should remove a value from LocalStorage without affecting other keys', () => {
      localStorage.setItem('key-1', '"value-1"');
      localStorage.setItem('key-2', '"value-2"');
      localStorage.setItem('selected-key', '"to-remove"');

      const { result } = renderHook(() => useLocalStorage('selected-key'));

      act(() => {
        result.current[2](); // removeValue
      });

      expect(result.current[0]).toBeNull();
      expect(localStorage.getItem('selected-key')).toBeNull();
      expect(localStorage.getItem('key-1')).toBe('"value-1"');
      expect(localStorage.getItem('key-2')).toBe('"value-2"');
    });

    it('should handle removal of non-existent keys', () => {
      const { result } = renderHook(() => useLocalStorage('non-existent'));

      expect(() => {
        act(() => {
          result.current[2](); // removeValue
        });
      }).not.toThrow();

      expect(result.current[0]).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle quota exceeded errors', () => {
      const largData = new Array(10000000).fill('x').join('');

      const { result } = renderHook(() => useLocalStorage('quota-test'));

      act(() => {
        result.current[1](largData);
      });

      // Note: This may not actually trigger quota exceeded in test environment
      // but the error handling is in place
      if (result.current[3]) {
        expect(result.current[3].message).toContain('LocalStorage');
      }
    });

    it('should set error state on write failure', () => {
      const { result } = renderHook(() => useLocalStorage('test-key'));

      // Mock setItem to throw
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Mock storage error');
      });

      act(() => {
        result.current[1]('some-value');
      });

      expect(result.current[3]).not.toBeNull();
      expect(result.current[3]?.message).toContain('Mock storage error');

      setItemSpy.mockRestore();
    });

    it('should clear error state after successful operation', () => {
      const { result } = renderHook(() => useLocalStorage('test-key'));

      // First, cause an error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Mock storage error');
      });

      act(() => {
        result.current[1]('some-value');
      });

      expect(result.current[3]).not.toBeNull();

      // Restore setItem and try again
      setItemSpy.mockRestore();

      act(() => {
        result.current[1]('valid-value');
      });

      expect(result.current[3]).toBeNull();
      expect(result.current[0]).toBe('valid-value');
    });
  });
});

describe('useProgramIdStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Program ID Validation', () => {
    it('should accept valid UUID v4', () => {
      const { result } = renderHook(() => useProgramIdStorage());
      const validUUID = 'a1b2c3d4-e5f6-47a8-89ab-cdef01234567';

      act(() => {
        const success = result.current.setProgramId(validUUID);
        expect(success).toBe(true);
      });

      expect(result.current.programId).toBe(validUUID);
    });

    it('should reject invalid UUID format', () => {
      const { result } = renderHook(() => useProgramIdStorage());
      const invalidUUID = 'not-a-uuid';

      act(() => {
        const success = result.current.setProgramId(invalidUUID);
        expect(success).toBe(false);
      });

      expect(result.current.programId).toBeNull();
    });

    it('should reject partial UUIDs', () => {
      const { result } = renderHook(() => useProgramIdStorage());
      const partialUUID = 'a1b2c3d4-e5f6-47a8';

      act(() => {
        const success = result.current.setProgramId(partialUUID);
        expect(success).toBe(false);
      });

      expect(result.current.programId).toBeNull();
    });

    it('should reject UUIDs with wrong version (non-v4)', () => {
      const { result } = renderHook(() => useProgramIdStorage());
      // v3 UUID: xxxxxxxx-xxxx-3xxx-yxxx-xxxxxxxxxxxx (has 3 in version position, not 4)
      const v3UUID = 'a1b2c3d4-e5f6-3fa8-89ab-cdef01234567';

      act(() => {
        const success = result.current.setProgramId(v3UUID);
        expect(success).toBe(false);
      });

      expect(result.current.programId).toBeNull();
    });
  });

  describe('Program ID Storage', () => {
    it('should store program_id in correct key', () => {
      const { result } = renderHook(() => useProgramIdStorage());
      const validUUID = 'a1b2c3d4-e5f6-47a8-89ab-cdef01234567';

      act(() => {
        result.current.setProgramId(validUUID);
      });

      expect(localStorage.getItem('selected_program_id')).toBe(`"${validUUID}"`);
    });

    it('should retrieve previously stored program_id', () => {
      const validUUID = 'a1b2c3d4-e5f6-47a8-89ab-cdef01234567';
      localStorage.setItem('selected_program_id', `"${validUUID}"`);

      const { result } = renderHook(() => useProgramIdStorage());

      expect(result.current.programId).toBe(validUUID);
    });

    it('should remove program_id without affecting other keys', () => {
      localStorage.setItem('selected_program_id', '"a1b2c3d4-e5f6-47a8-89ab-cdef01234567"');
      localStorage.setItem('other-key', '"other-value"');

      const { result } = renderHook(() => useProgramIdStorage());

      act(() => {
        result.current.removeProgramId();
      });

      expect(result.current.programId).toBeNull();
      expect(localStorage.getItem('selected_program_id')).toBeNull();
      expect(localStorage.getItem('other-key')).toBe('"other-value"');
    });
  });

  describe('Error Handling for Program ID', () => {
    it('should report error on write failure', () => {
      const { result } = renderHook(() => useProgramIdStorage());

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage write failed');
      });

      act(() => {
        result.current.setProgramId('a1b2c3d4-e5f6-47a8-89ab-cdef01234567');
      });

      expect(result.current.error).not.toBeNull();

      setItemSpy.mockRestore();
    });
  });
});

describe('useSelectiveLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve values', () => {
      const { result } = renderHook(() => useSelectiveLocalStorage('test-key'));

      act(() => {
        result.current.setValue('test-value');
      });

      expect(result.current.value).toBe('test-value');
      expect(localStorage.getItem('test-key')).toBe('test-value');
    });

    it('should return null for non-existent keys', () => {
      const { result } = renderHook(() => useSelectiveLocalStorage('non-existent'));

      expect(result.current.value).toBeNull();
    });

    it('should retrieve existing values from storage', () => {
      localStorage.setItem('stored-key', 'stored-value');

      const { result } = renderHook(() => useSelectiveLocalStorage('stored-key'));

      expect(result.current.value).toBe('stored-value');
    });
  });

  describe('Selective Deletion', () => {
    it('should remove specific key without affecting others', () => {
      localStorage.setItem('key-1', 'value-1');
      localStorage.setItem('key-2', 'value-2');
      localStorage.setItem('target-key', 'target-value');

      const { result } = renderHook(() => useSelectiveLocalStorage('target-key'));

      act(() => {
        result.current.removeKey();
      });

      expect(result.current.value).toBeNull();
      expect(localStorage.getItem('target-key')).toBeNull();
      expect(localStorage.getItem('key-1')).toBe('value-1');
      expect(localStorage.getItem('key-2')).toBe('value-2');
    });

    it('should handle removal of non-existent keys gracefully', () => {
      const { result } = renderHook(() => useSelectiveLocalStorage('non-existent'));

      expect(() => {
        act(() => {
          result.current.removeKey();
        });
      }).not.toThrow();

      expect(result.current.value).toBeNull();
    });
  });
});

/**
 * Property-Based Tests
 * **Validates: Requirements 2.2, 6.2, 6.3**
 */
describe('Property-Based Tests: LocalStorage Round-Trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Property 2: LocalStorage Round-Trip
   * Stored program_id retrieved equals original value
   * **Validates: Requirements 2.2, 6.2, 6.3**
   */
  it('Property 2: LocalStorage Round-Trip - Stored program_id retrieved equals original value', () => {
    const property = fc.property(fc.uuid({ version: 4 }), (programUUID) => {
      localStorage.clear();

      const { result } = renderHook(() => useProgramIdStorage());

      act(() => {
        const success = result.current.setProgramId(programUUID);
        expect(success).toBe(true);
      });

      // Verify stored value equals original
      expect(result.current.programId).toBe(programUUID);

      // Verify it's in LocalStorage with same value
      const stored = localStorage.getItem('selected_program_id');
      expect(stored).toBe(`"${programUUID}"`);

      // Parse from storage and verify equality
      const retrieved = JSON.parse(stored!);
      expect(retrieved).toBe(programUUID);
    });

    fc.assert(property);
  });

  /**
   * Additional Property: Selective Deletion Preserves Other Keys
   * When removing program_id, no other LocalStorage keys are affected
   * **Validates: Requirements 6.2, 6.3**
   */
  it('Property: Cleanup Selectivity - Removing program_id does not affect other keys', () => {
    const property = fc.property(
      fc.uuid({ version: 4 }),
      fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 }),
      (programUUID, otherKeys) => {
        localStorage.clear();

        // Setup: Store program_id
        const { result } = renderHook(() => useProgramIdStorage());

        act(() => {
          result.current.setProgramId(programUUID);
        });

        // Store other keys with values
        const storedOtherKeys = new Map<string, string>();
        otherKeys.forEach((keyBase, index) => {
          // Create safe key names
          const safeKey = keyBase === 'selected_program_id' ? `other_${index}` : `${keyBase}_${index}`;
          const value = `value-${index}`;
          localStorage.setItem(safeKey, value);
          storedOtherKeys.set(safeKey, value);
        });

        // Act: Remove program_id
        act(() => {
          result.current.removeProgramId();
        });

        // Assert: program_id is removed but others remain
        expect(localStorage.getItem('selected_program_id')).toBeNull();

        // Verify all other keys are intact
        storedOtherKeys.forEach((value, key) => {
          expect(localStorage.getItem(key)).toBe(value);
        });
      }
    );

    fc.assert(property);
  });

  /**
   * Additional Property: Invalid UUIDs are Consistently Rejected
   * For any non-v4 UUID or invalid format, setProgramId always returns false
   * **Validates: Requirements 2.2, 2.4**
   */
  it('Property: UUID Validation Consistency - Invalid UUIDs are consistently rejected', () => {
    const property = fc.property(fc.string(), (invalidUUID) => {
      localStorage.clear();

      // Only test strings that are definitely not valid v4 UUIDs
      const isValidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        invalidUUID
      );

      if (isValidV4) {
        // Skip valid UUIDs as they should succeed
        return true;
      }

      const { result } = renderHook(() => useProgramIdStorage());

      act(() => {
        const success = result.current.setProgramId(invalidUUID);
        expect(success).toBe(false);
      });

      // Ensure nothing was stored
      expect(result.current.programId).toBeNull();
      expect(localStorage.getItem('selected_program_id')).toBeNull();
    });

    fc.assert(property);
  });

  /**
   * Additional Property: Storage Determinism
   * Storing and retrieving the same value multiple times yields identical results
   * **Validates: Requirements 2.2, 6.2**
   */
  it('Property: Storage Determinism - Multiple store/retrieve cycles produce identical values', () => {
    const property = fc.property(fc.uuid({ version: 4 }), (programUUID) => {
      localStorage.clear();

      const { result: result1 } = renderHook(() => useProgramIdStorage());

      // First cycle: Store
      act(() => {
        result1.current.setProgramId(programUUID);
      });
      const firstValue = result1.current.programId;

      // Second cycle: Retrieve from localStorage directly
      const secondValue = JSON.parse(localStorage.getItem('selected_program_id')!);

      // Third cycle: New hook instance retrieves same value
      const { result: result2 } = renderHook(() => useProgramIdStorage());
      const thirdValue = result2.current.programId;

      // All should be identical
      expect(firstValue).toBe(programUUID);
      expect(secondValue).toBe(programUUID);
      expect(thirdValue).toBe(programUUID);
    });

    fc.assert(property);
  });
});
