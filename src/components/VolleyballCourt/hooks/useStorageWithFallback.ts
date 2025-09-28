import { useCallback, useRef, useState, useEffect } from "react";

export interface StorageError {
  type: "quota_exceeded" | "not_available" | "permission_denied" | "corruption" | "unknown";
  message: string;
  originalError?: Error;
}

export interface StorageState {
  isAvailable: boolean;
  hasError: boolean;
  error: StorageError | null;
  fallbackActive: boolean;
}

interface UseStorageWithFallbackOptions {
  storageType?: "localStorage" | "sessionStorage";
  fallbackEnabled?: boolean;
  onError?: (error: StorageError) => void;
  onFallbackActivated?: () => void;
}

export function useStorageWithFallback(options: UseStorageWithFallbackOptions = {}) {
  const {
    storageType = "localStorage",
    fallbackEnabled = true,
    onError,
    onFallbackActivated,
  } = options;

  const [storageState, setStorageState] = useState<StorageState>({
    isAvailable: false,
    hasError: false,
    error: null,
    fallbackActive: false,
  });

  // In-memory fallback storage
  const fallbackStorage = useRef<Map<string, string>>(new Map());
  const storageRef = useRef<Storage | null>(null);

  // Initialize storage availability check
  useEffect(() => {
    checkStorageAvailability();
  }, [storageType]);

  const checkStorageAvailability = useCallback(() => {
    try {
      const storage = storageType === "localStorage" ? window.localStorage : window.sessionStorage;
      
      // Test storage functionality
      const testKey = "__storage_test__";
      storage.setItem(testKey, "test");
      storage.removeItem(testKey);
      
      storageRef.current = storage;
      setStorageState(prev => ({
        ...prev,
        isAvailable: true,
        hasError: false,
        error: null,
        fallbackActive: false,
      }));
    } catch (error) {
      const storageError = createStorageError(error);
      
      setStorageState(prev => ({
        ...prev,
        isAvailable: false,
        hasError: true,
        error: storageError,
        fallbackActive: fallbackEnabled,
      }));

      if (fallbackEnabled) {
        onFallbackActivated?.();
      }
      onError?.(storageError);
    }
  }, [storageType, fallbackEnabled, onError, onFallbackActivated]);

  const createStorageError = useCallback((error: unknown): StorageError => {
    const err = error as Error;
    
    if (err.name === "QuotaExceededError" || err.message?.includes("quota")) {
      return {
        type: "quota_exceeded",
        message: "Storage quota exceeded. Consider clearing old data.",
        originalError: err,
      };
    }
    
    if (err.name === "SecurityError" || err.message?.includes("access")) {
      return {
        type: "permission_denied",
        message: "Storage access denied. This may be due to browser privacy settings.",
        originalError: err,
      };
    }
    
    if (err.message?.includes("localStorage") || err.message?.includes("sessionStorage")) {
      return {
        type: "not_available",
        message: "Storage is not available in this browser or environment.",
        originalError: err,
      };
    }

    return {
      type: "unknown",
      message: err.message || "An unknown storage error occurred.",
      originalError: err,
    };
  }, []);

  const setItem = useCallback((key: string, value: string): boolean => {
    try {
      if (storageRef.current && storageState.isAvailable) {
        storageRef.current.setItem(key, value);
        return true;
      } else if (fallbackEnabled && storageState.fallbackActive) {
        fallbackStorage.current.set(key, value);
        return true;
      }
      return false;
    } catch (error) {
      const storageError = createStorageError(error);
      
      setStorageState(prev => ({
        ...prev,
        hasError: true,
        error: storageError,
      }));

      onError?.(storageError);

      // Try fallback storage
      if (fallbackEnabled) {
        try {
          fallbackStorage.current.set(key, value);
          setStorageState(prev => ({
            ...prev,
            fallbackActive: true,
          }));
          onFallbackActivated?.();
          return true;
        } catch (fallbackError) {
          return false;
        }
      }
      
      return false;
    }
  }, [storageState.isAvailable, storageState.fallbackActive, fallbackEnabled, onError, onFallbackActivated, createStorageError]);

  const getItem = useCallback((key: string): string | null => {
    try {
      if (storageRef.current && storageState.isAvailable) {
        return storageRef.current.getItem(key);
      } else if (fallbackEnabled && storageState.fallbackActive) {
        return fallbackStorage.current.get(key) || null;
      }
      return null;
    } catch (error) {
      const storageError = createStorageError(error);
      
      setStorageState(prev => ({
        ...prev,
        hasError: true,
        error: storageError,
      }));

      onError?.(storageError);

      // Try fallback storage
      if (fallbackEnabled) {
        return fallbackStorage.current.get(key) || null;
      }
      
      return null;
    }
  }, [storageState.isAvailable, storageState.fallbackActive, fallbackEnabled, onError, createStorageError]);

  const removeItem = useCallback((key: string): boolean => {
    try {
      if (storageRef.current && storageState.isAvailable) {
        storageRef.current.removeItem(key);
        return true;
      } else if (fallbackEnabled && storageState.fallbackActive) {
        fallbackStorage.current.delete(key);
        return true;
      }
      return false;
    } catch (error) {
      const storageError = createStorageError(error);
      
      setStorageState(prev => ({
        ...prev,
        hasError: true,
        error: storageError,
      }));

      onError?.(storageError);

      // Try fallback storage
      if (fallbackEnabled) {
        fallbackStorage.current.delete(key);
        return true;
      }
      
      return false;
    }
  }, [storageState.isAvailable, storageState.fallbackActive, fallbackEnabled, onError, createStorageError]);

  const clear = useCallback((): boolean => {
    try {
      if (storageRef.current && storageState.isAvailable) {
        storageRef.current.clear();
        return true;
      } else if (fallbackEnabled && storageState.fallbackActive) {
        fallbackStorage.current.clear();
        return true;
      }
      return false;
    } catch (error) {
      const storageError = createStorageError(error);
      
      setStorageState(prev => ({
        ...prev,
        hasError: true,
        error: storageError,
      }));

      onError?.(storageError);

      // Try fallback storage
      if (fallbackEnabled) {
        fallbackStorage.current.clear();
        return true;
      }
      
      return false;
    }
  }, [storageState.isAvailable, storageState.fallbackActive, fallbackEnabled, onError, createStorageError]);

  const retry = useCallback(() => {
    checkStorageAvailability();
  }, [checkStorageAvailability]);

  const clearError = useCallback(() => {
    setStorageState(prev => ({
      ...prev,
      hasError: false,
      error: null,
    }));
  }, []);

  return {
    ...storageState,
    setItem,
    getItem,
    removeItem,
    clear,
    retry,
    clearError,
  };
}