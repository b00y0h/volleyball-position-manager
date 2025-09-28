/**
 * PersistenceManager - Handles URL state and localStorage persistence for VolleyballCourt component
 */

import { URLStateManager } from "./utils/URLStateManager";
import { LocalStorageManager } from "./utils/storage/LocalStorageManager";
import {
  SystemType,
  FormationType,
  PlayerPosition,
  CustomPositionsState,
} from "./types";
import {
  VolleyballCourtConfig,
  PositionData,
  ShareData,
  ErrorData,
} from "./types";

export interface PersistenceState {
  system: SystemType;
  rotation: number;
  formation: FormationType;
  positions: Record<string, PlayerPosition>;
  config?: Partial<VolleyballCourtConfig>;
}

export interface PersistenceOptions {
  enableURLPersistence: boolean;
  enableLocalStorage: boolean;
  autoSave: boolean;
  debounceDelay: number;
}

export class VolleyballCourtPersistenceManager {
  private localStorageManager: LocalStorageManager;
  private options: PersistenceOptions;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(options: Partial<PersistenceOptions> = {}) {
    this.localStorageManager = new LocalStorageManager();
    this.options = {
      enableURLPersistence: true,
      enableLocalStorage: true,
      autoSave: true,
      debounceDelay: 500,
      ...options,
    };
  }

  /**
   * Initialize persistence - load from URL or localStorage
   */
  public async initialize(): Promise<PersistenceState | null> {
    try {
      // First try to load from URL
      const urlData = this.loadFromURL();
      if (urlData) {
        return urlData;
      }

      // Fallback to localStorage
      if (this.options.enableLocalStorage) {
        return this.loadFromLocalStorage();
      }

      return null;
    } catch (error) {
      console.error("Failed to initialize persistence:", error);
      return null;
    }
  }

  /**
   * Load state from current URL
   */
  public loadFromURL(): PersistenceState | null {
    if (!this.options.enableURLPersistence || typeof window === "undefined") {
      return null;
    }

    try {
      const urlData = URLStateManager.parseCurrentURL();
      if (!urlData) {
        return null;
      }

      // Convert URLPositionData to PersistenceState
      const currentRotationPositions = urlData.positions[urlData.rotation];
      if (!currentRotationPositions) {
        return null;
      }

      // Get positions for the current formation (default to base if not found)
      const formationPositions =
        currentRotationPositions.base ||
        currentRotationPositions.serveReceive ||
        currentRotationPositions.rotational ||
        {};

      return {
        system: urlData.system,
        rotation: urlData.rotation,
        formation: "base", // Default formation from URL
        positions: formationPositions,
      };
    } catch (error) {
      console.error("Failed to load from URL:", error);
      return null;
    }
  }

  /**
   * Load state from localStorage
   */
  public loadFromLocalStorage(): PersistenceState | null {
    if (!this.options.enableLocalStorage) {
      return null;
    }

    try {
      const storedData = this.localStorageManager.load();
      if (!storedData) {
        return null;
      }

      // Return the most recently used system and rotation
      // For now, default to 5-1 system, rotation 0, base formation
      const system: SystemType = "5-1";
      const rotation = 0;
      const formation: FormationType = "base";

      const systemPositions = storedData[system];
      const rotationPositions = systemPositions?.[rotation];
      const formationPositions = rotationPositions?.[formation] || {};

      return {
        system,
        rotation,
        formation,
        positions: formationPositions,
      };
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
      return null;
    }
  }

  /**
   * Save current state with debouncing
   */
  public save(state: PersistenceState): void {
    if (!this.options.autoSave) {
      return;
    }

    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Set new debounced save
    this.saveTimeout = setTimeout(() => {
      this.performSave(state);
      this.saveTimeout = null;
    }, this.options.debounceDelay);
  }

  /**
   * Save immediately without debouncing
   */
  public saveImmediate(state: PersistenceState): void {
    // Clear any pending debounced save
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    this.performSave(state);
  }

  /**
   * Generate shareable URL
   */
  public generateShareURL(
    state: PersistenceState,
    config?: VolleyballCourtConfig
  ): ShareData {
    try {
      // Convert current state to CustomPositionsState format
      const customPositions: CustomPositionsState = {
        [state.rotation]: {
          [state.formation]: state.positions,
        },
      };

      const url = URLStateManager.generateShareableURL(
        state.system,
        state.rotation,
        customPositions
      );

      return {
        url,
        config: config || {},
        positions: {
          system: state.system,
          rotation: state.rotation,
          formation: state.formation,
          positions: state.positions,
          timestamp: Date.now(),
          changeType: "manual",
        },
      };
    } catch (error) {
      console.error("Failed to generate share URL:", error);
      throw new Error("Failed to generate shareable URL");
    }
  }

  /**
   * Copy URL to clipboard
   */
  public async copyToClipboard(url: string): Promise<void> {
    if (typeof window === "undefined" || !navigator.clipboard) {
      throw new Error("Clipboard API not available");
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      throw new Error("Failed to copy URL to clipboard");
    }
  }

  /**
   * Check if URL contains position data
   */
  public hasURLData(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    return URLStateManager.hasPositionData(window.location.href);
  }

  /**
   * Clear URL parameters
   */
  public clearURL(): void {
    if (!this.options.enableURLPersistence || typeof window === "undefined") {
      return;
    }

    URLStateManager.clearURLParameters();
  }

  /**
   * Update browser URL with current state
   */
  public updateURL(state: PersistenceState, replace: boolean = false): void {
    if (!this.options.enableURLPersistence || typeof window === "undefined") {
      return;
    }

    try {
      const customPositions: CustomPositionsState = {
        [state.rotation]: {
          [state.formation]: state.positions,
        },
      };

      URLStateManager.updateBrowserURL(
        state.system,
        state.rotation,
        customPositions,
        replace
      );
    } catch (error) {
      console.error("Failed to update URL:", error);
    }
  }

  /**
   * Get storage information
   */
  public getStorageInfo() {
    return this.localStorageManager.getStorageInfo();
  }

  /**
   * Clear all stored data
   */
  public clear(): void {
    this.localStorageManager.clear();
    this.clearURL();

    // Clear any pending saves
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }

  /**
   * Check if localStorage has data
   */
  public hasStoredData(): boolean {
    return this.localStorageManager.hasStoredData();
  }

  /**
   * Perform the actual save operation
   */
  private performSave(state: PersistenceState): void {
    if (!this.options.enableLocalStorage) {
      return;
    }

    try {
      // Convert to the format expected by LocalStorageManager
      const currentStoredData = this.localStorageManager.load() || {
        "5-1": {},
        "6-2": {},
      };

      // Update the specific system/rotation/formation
      if (!currentStoredData[state.system]) {
        currentStoredData[state.system] = {};
      }
      if (!currentStoredData[state.system][state.rotation]) {
        currentStoredData[state.system][state.rotation] = {
          rotational: {},
          serveReceive: {},
          base: {},
        };
      }

      currentStoredData[state.system][state.rotation][state.formation] =
        state.positions;

      // Save to localStorage
      this.localStorageManager.saveImmediate(currentStoredData);
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }

  /**
   * Enable read-only mode (disable saves)
   */
  public setReadOnly(readOnly: boolean): void {
    this.options.autoSave = !readOnly;
  }

  /**
   * Update persistence options
   */
  public updateOptions(options: Partial<PersistenceOptions>): void {
    this.options = { ...this.options, ...options };
  }
}
