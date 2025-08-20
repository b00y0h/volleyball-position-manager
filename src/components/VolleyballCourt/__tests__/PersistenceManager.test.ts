/**
 * Tests for VolleyballCourtPersistenceManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  VolleyballCourtPersistenceManager,
  PersistenceState,
} from "../PersistenceManager";
import { URLStateManager } from "@/utils/URLStateManager";
import { LocalStorageManager } from "@/utils/storage/LocalStorageManager";

// Mock the dependencies
vi.mock("@/utils/URLStateManager");
vi.mock("@/utils/storage/LocalStorageManager");

describe("VolleyballCourtPersistenceManager", () => {
  let persistenceManager: VolleyballCourtPersistenceManager;
  let mockURLStateManager: typeof URLStateManager;
  let mockLocalStorageManager: LocalStorageManager;

  const mockPersistenceState: PersistenceState = {
    system: "5-1",
    rotation: 0,
    formation: "base",
    positions: {
      S: { x: 100, y: 200, isCustom: false, lastModified: new Date() },
      OH1: { x: 150, y: 250, isCustom: true, lastModified: new Date() },
    },
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock URLStateManager
    mockURLStateManager = URLStateManager as any;
    mockURLStateManager.parseCurrentURL = vi.fn();
    mockURLStateManager.generateShareableURL = vi.fn();
    mockURLStateManager.hasPositionData = vi.fn();
    mockURLStateManager.clearURLParameters = vi.fn();
    mockURLStateManager.updateBrowserURL = vi.fn();

    // Mock LocalStorageManager
    mockLocalStorageManager = {
      load: vi.fn(),
      save: vi.fn(),
      saveImmediate: vi.fn(),
      clear: vi.fn(),
      hasStoredData: vi.fn(),
      getStorageInfo: vi.fn(),
    } as any;

    // Mock the LocalStorageManager constructor
    vi.mocked(LocalStorageManager).mockImplementation(
      () => mockLocalStorageManager
    );

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    // Mock window
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost:3000/",
        reload: vi.fn(),
      },
      writable: true,
    });

    persistenceManager = new VolleyballCourtPersistenceManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should create with default options", () => {
      expect(persistenceManager).toBeInstanceOf(
        VolleyballCourtPersistenceManager
      );
    });

    it("should create with custom options", () => {
      const customManager = new VolleyballCourtPersistenceManager({
        enableURLPersistence: false,
        enableLocalStorage: false,
        autoSave: false,
        debounceDelay: 1000,
      });
      expect(customManager).toBeInstanceOf(VolleyballCourtPersistenceManager);
    });
  });

  describe("initialize", () => {
    it("should load from URL when URL data is available", async () => {
      const mockURLData = {
        system: "5-1" as const,
        rotation: 1,
        positions: {
          1: {
            base: {
              S: { x: 100, y: 200, isCustom: false, lastModified: new Date() },
            },
          },
        },
        version: "1.0.0",
      };

      mockURLStateManager.parseCurrentURL.mockReturnValue(mockURLData);

      const result = await persistenceManager.initialize();

      expect(result).toEqual({
        system: "5-1",
        rotation: 1,
        formation: "base",
        positions: {
          S: {
            x: 100,
            y: 200,
            isCustom: false,
            lastModified: expect.any(Date),
          },
        },
      });
      expect(mockURLStateManager.parseCurrentURL).toHaveBeenCalled();
    });

    it("should fallback to localStorage when no URL data", async () => {
      mockURLStateManager.parseCurrentURL.mockReturnValue(null);
      mockLocalStorageManager.load.mockReturnValue({
        "5-1": {
          0: {
            base: {
              S: { x: 100, y: 200, isCustom: false, lastModified: new Date() },
            },
          },
        },
        "6-2": {},
      });

      const result = await persistenceManager.initialize();

      expect(result).toEqual({
        system: "5-1",
        rotation: 0,
        formation: "base",
        positions: {
          S: {
            x: 100,
            y: 200,
            isCustom: false,
            lastModified: expect.any(Date),
          },
        },
      });
      expect(mockLocalStorageManager.load).toHaveBeenCalled();
    });

    it("should return null when no data is available", async () => {
      mockURLStateManager.parseCurrentURL.mockReturnValue(null);
      mockLocalStorageManager.load.mockReturnValue(null);

      const result = await persistenceManager.initialize();

      expect(result).toBeNull();
    });

    it("should handle errors gracefully", async () => {
      mockURLStateManager.parseCurrentURL.mockImplementation(() => {
        throw new Error("URL parsing error");
      });

      const result = await persistenceManager.initialize();

      expect(result).toBeNull();
    });
  });

  describe("loadFromURL", () => {
    it("should return null when URL persistence is disabled", () => {
      const manager = new VolleyballCourtPersistenceManager({
        enableURLPersistence: false,
      });

      const result = manager.loadFromURL();

      expect(result).toBeNull();
      expect(mockURLStateManager.parseCurrentURL).not.toHaveBeenCalled();
    });

    it("should return null when no URL data exists", () => {
      mockURLStateManager.parseCurrentURL.mockReturnValue(null);

      const result = persistenceManager.loadFromURL();

      expect(result).toBeNull();
    });

    it("should parse URL data correctly", () => {
      const mockURLData = {
        system: "6-2" as const,
        rotation: 2,
        positions: {
          2: {
            serveReceive: {
              S1: { x: 150, y: 300, isCustom: true, lastModified: new Date() },
            },
          },
        },
        version: "1.0.0",
      };

      mockURLStateManager.parseCurrentURL.mockReturnValue(mockURLData);

      const result = persistenceManager.loadFromURL();

      expect(result).toEqual({
        system: "6-2",
        rotation: 2,
        formation: "base",
        positions: {
          S1: {
            x: 150,
            y: 300,
            isCustom: true,
            lastModified: expect.any(Date),
          },
        },
      });
    });
  });

  describe("save and saveImmediate", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should debounce saves", () => {
      persistenceManager.save(mockPersistenceState);
      persistenceManager.save(mockPersistenceState);

      expect(mockLocalStorageManager.saveImmediate).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);

      expect(mockLocalStorageManager.saveImmediate).toHaveBeenCalledTimes(1);
    });

    it("should save immediately without debouncing", () => {
      persistenceManager.saveImmediate(mockPersistenceState);

      expect(mockLocalStorageManager.saveImmediate).toHaveBeenCalledTimes(1);
    });

    it("should not save when autoSave is disabled", () => {
      const manager = new VolleyballCourtPersistenceManager({
        autoSave: false,
      });

      manager.save(mockPersistenceState);
      vi.advanceTimersByTime(500);

      expect(mockLocalStorageManager.saveImmediate).not.toHaveBeenCalled();
    });
  });

  describe("generateShareURL", () => {
    it("should generate share URL successfully", () => {
      const mockURL = "http://localhost:3000/?d=encoded-data&v=1.0.0&s=5-1&r=0";
      mockURLStateManager.generateShareableURL.mockReturnValue(mockURL);

      const result = persistenceManager.generateShareURL(mockPersistenceState);

      expect(result).toEqual({
        url: mockURL,
        config: {},
        positions: {
          system: "5-1",
          rotation: 0,
          formation: "base",
          positions: mockPersistenceState.positions,
        },
      });
      expect(mockURLStateManager.generateShareableURL).toHaveBeenCalledWith(
        "5-1",
        0,
        { 0: { base: mockPersistenceState.positions } }
      );
    });

    it("should handle errors when generating share URL", () => {
      mockURLStateManager.generateShareableURL.mockImplementation(() => {
        throw new Error("URL generation failed");
      });

      expect(() => {
        persistenceManager.generateShareURL(mockPersistenceState);
      }).toThrow("Failed to generate shareable URL");
    });
  });

  describe("copyToClipboard", () => {
    it("should copy URL to clipboard successfully", async () => {
      const url = "http://localhost:3000/?data=test";

      await persistenceManager.copyToClipboard(url);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(url);
    });

    it("should handle clipboard API errors", async () => {
      vi.mocked(navigator.clipboard.writeText).mockRejectedValue(
        new Error("Clipboard error")
      );

      await expect(
        persistenceManager.copyToClipboard("test-url")
      ).rejects.toThrow("Failed to copy URL to clipboard");
    });

    it("should handle missing clipboard API", async () => {
      // Remove clipboard API
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        writable: true,
      });

      await expect(
        persistenceManager.copyToClipboard("test-url")
      ).rejects.toThrow("Clipboard API not available");
    });
  });

  describe("URL management", () => {
    it("should check if URL has data", () => {
      mockURLStateManager.hasPositionData.mockReturnValue(true);

      const result = persistenceManager.hasURLData();

      expect(result).toBe(true);
      expect(mockURLStateManager.hasPositionData).toHaveBeenCalledWith(
        window.location.href
      );
    });

    it("should clear URL parameters", () => {
      persistenceManager.clearURL();

      expect(mockURLStateManager.clearURLParameters).toHaveBeenCalled();
    });

    it("should update browser URL", () => {
      persistenceManager.updateURL(mockPersistenceState, true);

      expect(mockURLStateManager.updateBrowserURL).toHaveBeenCalledWith(
        "5-1",
        0,
        { 0: { base: mockPersistenceState.positions } },
        true
      );
    });
  });

  describe("storage management", () => {
    it("should get storage info", () => {
      const mockStorageInfo = {
        used: 1024,
        available: true,
        quota: 5242880,
      };
      mockLocalStorageManager.getStorageInfo.mockReturnValue(mockStorageInfo);

      const result = persistenceManager.getStorageInfo();

      expect(result).toEqual(mockStorageInfo);
    });

    it("should clear all data", () => {
      persistenceManager.clear();

      expect(mockLocalStorageManager.clear).toHaveBeenCalled();
      expect(mockURLStateManager.clearURLParameters).toHaveBeenCalled();
    });

    it("should check if stored data exists", () => {
      mockLocalStorageManager.hasStoredData.mockReturnValue(true);

      const result = persistenceManager.hasStoredData();

      expect(result).toBe(true);
    });
  });

  describe("configuration", () => {
    it("should set read-only mode", () => {
      vi.useFakeTimers();

      persistenceManager.setReadOnly(true);

      // Test that auto-save is disabled
      persistenceManager.save(mockPersistenceState);
      vi.advanceTimersByTime(500);

      expect(mockLocalStorageManager.saveImmediate).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("should update options", () => {
      persistenceManager.updateOptions({
        debounceDelay: 1000,
        enableURLPersistence: false,
      });

      // Test that URL persistence is disabled
      const result = persistenceManager.loadFromURL();
      expect(result).toBeNull();
    });
  });
});
