import type { StoredPositions, CustomPositionsState } from "../../types";

/**
 * LocalStorageManager handles persistence of custom player positions to browser storage
 * with automatic saving, debouncing, and comprehensive error handling.
 */
export class LocalStorageManager {
  private static readonly STORAGE_KEY = "volleyball-custom-positions";
  private static readonly STORAGE_VERSION = "1.0.0";
  private static readonly DEBOUNCE_DELAY = 500; // 500ms debounce
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

  private saveTimeout: NodeJS.Timeout | null = null;
  private pendingData: StoredPositions | null = null;

  /**
   * Save position data to localStorage with debouncing
   */
  public save(positions: {
    "5-1": CustomPositionsState;
    "6-2": CustomPositionsState;
  }): void {
    const dataToSave: StoredPositions = {
      version: LocalStorageManager.STORAGE_VERSION,
      lastModified: new Date(),
      positions,
    };

    this.pendingData = dataToSave;

    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Set new debounced save
    this.saveTimeout = setTimeout(() => {
      this.performSave(this.pendingData!);
      this.pendingData = null;
      this.saveTimeout = null;
    }, LocalStorageManager.DEBOUNCE_DELAY);
  }

  /**
   * Immediately save data without debouncing (for critical saves)
   */
  public saveImmediate(positions: {
    "5-1": CustomPositionsState;
    "6-2": CustomPositionsState;
  }): void {
    // Clear any pending debounced save
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    const dataToSave: StoredPositions = {
      version: LocalStorageManager.STORAGE_VERSION,
      lastModified: new Date(),
      positions,
    };

    this.performSave(dataToSave);
  }

  /**
   * Load position data from localStorage
   */
  public load(): {
    "5-1": CustomPositionsState;
    "6-2": CustomPositionsState;
  } | null {
    try {
      if (!this.isStorageAvailable()) {
        console.warn("LocalStorage is not available");
        return null;
      }

      const stored = localStorage.getItem(LocalStorageManager.STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored) as StoredPositions;

      // Validate the loaded data
      if (!this.validateStoredData(parsed)) {
        console.warn("Invalid stored position data, clearing storage");
        this.clear();
        return null;
      }

      // Handle version migration if needed
      const migrated = this.migrateData(parsed);

      // Convert Date strings back to Date objects
      this.deserializeDates(migrated.positions);

      return migrated.positions;
    } catch (error) {
      console.error("Error loading position data:", error);
      // Clear corrupted data
      this.clear();
      return null;
    }
  }

  /**
   * Clear all stored position data
   */
  public clear(): void {
    try {
      if (this.isStorageAvailable()) {
        localStorage.removeItem(LocalStorageManager.STORAGE_KEY);
      }

      // Clear any pending saves
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
      this.pendingData = null;
    } catch (error) {
      console.error("Error clearing position data:", error);
    }
  }

  /**
   * Check if there is stored data available
   */
  public hasStoredData(): boolean {
    try {
      if (!this.isStorageAvailable()) {
        return false;
      }
      return localStorage.getItem(LocalStorageManager.STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  public getStorageInfo(): {
    used: number;
    available: boolean;
    quota?: number;
  } {
    if (!this.isStorageAvailable()) {
      return { used: 0, available: false };
    }

    try {
      const stored = localStorage.getItem(LocalStorageManager.STORAGE_KEY);
      const used = stored ? new Blob([stored]).size : 0;

      return {
        used,
        available: true,
        quota: LocalStorageManager.MAX_STORAGE_SIZE,
      };
    } catch {
      return { used: 0, available: false };
    }
  }

  /**
   * Perform the actual save operation with error handling
   */
  private performSave(data: StoredPositions): void {
    try {
      if (!this.isStorageAvailable()) {
        throw new Error("LocalStorage is not available");
      }

      // Serialize dates for storage
      const serialized = this.serializeDates(data);
      const jsonString = JSON.stringify(serialized);

      // Check size before saving
      const size = new Blob([jsonString]).size;
      if (size > LocalStorageManager.MAX_STORAGE_SIZE) {
        throw new Error(
          `Data size (${size} bytes) exceeds maximum allowed (${LocalStorageManager.MAX_STORAGE_SIZE} bytes)`
        );
      }

      localStorage.setItem(LocalStorageManager.STORAGE_KEY, jsonString);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.name === "QuotaExceededError" ||
          error.message.includes("quota")
        ) {
          console.error("Storage quota exceeded. Consider clearing old data.");
          throw new Error("Storage quota exceeded");
        }
        throw error;
      }
      throw new Error("Unknown storage error");
    }
  }

  /**
   * Check if localStorage is available and functional
   */
  private isStorageAvailable(): boolean {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate the structure of loaded data
   */
  private validateStoredData(data: unknown): data is StoredPositions {
    if (!data || typeof data !== "object") return false;

    const obj = data as Record<string, unknown>;
    if (!obj.version || typeof obj.version !== "string") return false;
    if (!obj.lastModified) return false;
    if (!obj.positions || typeof obj.positions !== "object") return false;

    const positions = obj.positions as Record<string, unknown>;
    // Check for required system types
    if (!positions["5-1"] || !positions["6-2"]) return false;

    return true;
  }

  /**
   * Handle data migration between versions
   */
  private migrateData(data: StoredPositions): StoredPositions {
    // Currently only version 1.0.0, but this allows for future migrations
    if (data.version === LocalStorageManager.STORAGE_VERSION) {
      return data;
    }

    // Future version migrations would go here
    console.warn(
      `Migrating data from version ${data.version} to ${LocalStorageManager.STORAGE_VERSION}`
    );

    return {
      ...data,
      version: LocalStorageManager.STORAGE_VERSION,
      lastModified: new Date(),
    };
  }

  /**
   * Convert Date objects to ISO strings for storage
   */
  private serializeDates(data: StoredPositions): Record<string, unknown> {
    const serialized = JSON.parse(JSON.stringify(data));
    serialized.lastModified = data.lastModified.toISOString();

    // Serialize dates in position data
    Object.values(serialized.positions).forEach((systemPositions) => {
      Object.values(systemPositions as Record<string, unknown>).forEach(
        (rotationPositions) => {
          Object.values(rotationPositions as Record<string, unknown>).forEach(
            (formationPositions) => {
              Object.values(
                formationPositions as Record<string, unknown>
              ).forEach((position) => {
                const pos = position as Record<string, unknown>;
                if (pos.lastModified) {
                  pos.lastModified =
                    pos.lastModified instanceof Date
                      ? pos.lastModified.toISOString()
                      : pos.lastModified;
                }
              });
            }
          );
        }
      );
    });

    return serialized;
  }

  /**
   * Convert ISO strings back to Date objects after loading
   */
  private deserializeDates(positions: {
    "5-1": CustomPositionsState;
    "6-2": CustomPositionsState;
  }): void {
    Object.values(positions).forEach((systemPositions) => {
      Object.values(systemPositions).forEach((rotationPositions) => {
        Object.values(rotationPositions).forEach((formationPositions) => {
          Object.values(
            formationPositions as Record<string, Record<string, unknown>>
          ).forEach((position: Record<string, unknown>) => {
            if (
              position.lastModified &&
              typeof position.lastModified === "string"
            ) {
              position.lastModified = new Date(position.lastModified);
            }
          });
        });
      });
    });
  }
}

// Export a singleton instance for convenience
export const localStorageManager = new LocalStorageManager();
