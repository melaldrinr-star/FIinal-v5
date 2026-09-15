import { useState, useCallback, useEffect } from 'react';

/**
 * Validates that a value is a valid UUID v4 format
 * UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * where y is one of 8, 9, A, or B
 */
function isValidUUID(value: string): boolean {
  // Strict UUID v4 validation
  // Format: 8hex-4hex-4hex-4hex-12hex where 3rd group starts with 4 and 4th group starts with [89ab]
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(value);
}

/**
 * Custom hook for managing LocalStorage with type safety and error handling
 * @template T - The type of value being stored
 * @param key - The LocalStorage key
 * @param initialValue - The initial value if key doesn't exist
 * @returns Tuple of [value, setValue, removeValue, error]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue?: T
): [T | null, (value: T) => void, () => void, Error | null] {
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Initialize value from LocalStorage on mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setValue(JSON.parse(item));
      } else if (initialValue !== undefined) {
        setValue(initialValue);
      }
    } catch (err) {
      setError(new Error(`Failed to read from LocalStorage: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
  }, [key, initialValue]);

  // Set value in LocalStorage
  const setValueInStorage = useCallback(
    (newValue: T) => {
      try {
        // Check if storage quota exceeded before attempting to store
        const serialized = JSON.stringify(newValue);
        window.localStorage.setItem(key, serialized);
        setValue(newValue);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === 'QuotaExceededError') {
          const quotaError = new Error('LocalStorage quota exceeded');
          setError(quotaError);
        } else {
          const storageError = new Error(`Failed to write to LocalStorage: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setError(storageError);
        }
      }
    },
    [key]
  );

  // Remove value from LocalStorage (selective deletion)
  const removeValueFromStorage = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setValue(null);
      setError(null);
    } catch (err) {
      setError(new Error(`Failed to remove from LocalStorage: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
  }, [key]);

  return [value, setValueInStorage, removeValueFromStorage, error];
}

/**
 * Specialized hook for managing program_id in LocalStorage
 * Includes UUID validation specific to program IDs
 */
export function useProgramIdStorage(): {
  programId: string | null;
  setProgramId: (id: string) => boolean;
  removeProgramId: () => void;
  error: Error | null;
} {
  const [programId, setProgramIdValue, removeProgramId, error] = useLocalStorage<string>('selected_program_id');

  // Wrapper that validates UUID before storing
  const setProgramId = useCallback((id: string): boolean => {
    if (!isValidUUID(id)) {
      return false;
    }
    setProgramIdValue(id);
    return true;
  }, [setProgramIdValue]);

  return {
    programId,
    setProgramId,
    removeProgramId,
    error,
  };
}

/**
 * Generic hook for key-value storage with selective deletion
 * Allows storing and removing individual keys without affecting others
 */
export function useSelectiveLocalStorage(key: string): {
  value: string | null;
  setValue: (value: string) => void;
  removeKey: () => void;
  error: Error | null;
} {
  const [value, setValue] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Initialize value from LocalStorage on mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      setValue(item);
    } catch (err) {
      setError(new Error(`Failed to read from LocalStorage: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
  }, [key]);

  // Set value in LocalStorage
  const setValueInStorage = useCallback(
    (newValue: string) => {
      try {
        window.localStorage.setItem(key, newValue);
        setValue(newValue);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === 'QuotaExceededError') {
          const quotaError = new Error('LocalStorage quota exceeded');
          setError(quotaError);
        } else {
          const storageError = new Error(`Failed to write to LocalStorage: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setError(storageError);
        }
      }
    },
    [key]
  );

  // Remove specific key from LocalStorage (doesn't affect other keys)
  const removeKey = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setValue(null);
      setError(null);
    } catch (err) {
      setError(new Error(`Failed to remove from LocalStorage: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
  }, [key]);

  return {
    value,
    setValue: setValueInStorage,
    removeKey,
    error,
  };
}
