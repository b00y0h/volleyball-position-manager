import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LocalStorageManager } from "../LocalStorageManager";
import type { CustomPositionsState } from "@/types";

// Simple localStorage mock
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      // Simulate quota exceeded error if value is too large
      if (value.length > 1000000) {
        // 1MB limit for testing
        const error = new Error("QuotaExceededError");
        error.name = "QuotaExceededError";
        throw error;
      }
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    _reset: () => {
      store = {};
    },
  };
};

// Test data
const createTestPositions = (): {
  "5-1": CustomPositionsState;
  "6-2": CustomPositionsState;
} => ({
  "5-1": {
    0: {
      rotational: {
        "1": {
          x: 100,
          y: 100,
          isCustom: true,
          lastModified: new Date("2024-01-01"),
        },
        "2": {
          x: 200,
          y: 100,
          isCustom: false,
          lastModified: new Date("2024-01-01"),
        },
      },
      serveReceive: {
        "1": {
          x: 150,
          y: 150,
          isCustom: true,
          lastModified: new Date("2024-01-01"),
        },
      },
      base: {
        "1": {
          x: 120,
          y: 120,
          isCustom: false,
          lastModified: new Date("2024-01-01"),
        },
      },
    },
  },
  "6-2": {
    0: {
      rotational: {
        "1": {
          x: 300,
          y: 200,
          isCustom: true,
          lastModified: new Date("2024-01-01"),
        },
      },
      serveReceive: {},
      base: {},
    },
  },
});

describe("LocalStorageManager", () => {
  let manager: LocalStorageManager;
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      configurable: true,
    });

    manager = new LocalStorageManager();
    localStorageMock._reset();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("save", () => {
    it("should save position data with debouncing", () => {
      const positions = createTestPositions();

      manager.save(positions);

      // Should not save immediately
      expect(localStorageMock.setItem).not.toHaveBeenCalled();

      // Fast-forward time to trigger debounced save
      vi.advanceTimersByTime(500);

      // Should have storage test + actual save
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "__storage_test__",
        "__storage_test__"
      );
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
        "volleyball-custom-positions",
        expect.stringContaining('"version":"1.0.0"')
      );
    });

    it("should debounce multiple rapid saves", () => {
      const positions = createTestPositions();

      // Make multiple rapid saves
      manager.save(positions);
      manager.save(positions);
      manager.save(positions);

      // Should not save immediately
      expect(localStorageMock.setItem).not.toHaveBeenCalled();

      // Fast-forward time
      vi.advanceTimersByTime(500);

      // Should only save once (storage test + actual save)
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
    });

    it("should reset debounce timer on subsequent saves", () => {
      const positions = createTestPositions();

      manager.save(positions);

      // Advance time partially
      vi.advanceTimersByTime(300);

      // Make another save (should reset timer)
      manager.save(positions);

      // Advance remaining time from first save
      vi.advanceTimersByTime(200);

      // Should not have saved yet
      expect(localStorageMock.setItem).not.toHaveBeenCalled();

      // Advance full debounce time from second save
      vi.advanceTimersByTime(300);

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
    });
  });

  describe("saveImmediate", () => {
    it("should save immediately without debouncing", () => {
      const positions = createTestPositions();

      manager.saveImmediate(positions);

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2); // storage test + actual save
    });

    it("should cancel pending debounced saves", () => {
      const positions = createTestPositions();

      // Start a debounced save
      manager.save(positions);

      // Immediately save
      manager.saveImmediate(positions);

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2); // storage test + actual save

      // Fast-forward time - should not trigger another save
      vi.advanceTimersByTime(500);

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
    });

    it("should handle data size exceeded error", () => {
      const largePositions = createTestPositions();
      // Create a dataset that exceeds the size limit but not localStorage quota
      for (let i = 0; i < 100; i++) {
        largePositions["5-1"][i] = {
          rotational: {},
          serveReceive: {},
          base: {},
        };
        for (let j = 0; j < 1000; j++) {
          largePositions["5-1"][i].rotational[j.toString()] = {
            x: Math.random() * 600,
            y: Math.random() * 360,
            isCustom: true,
            lastModified: new Date(),
          };
        }
      }

      expect(() => manager.saveImmediate(largePositions)).toThrow(
        /Data size .* exceeds maximum allowed/
      );
    });
  });

  describe("load", () => {
    it("should load and deserialize position data", () => {
      const positions = createTestPositions();
      manager.saveImmediate(positions);

      const loaded = manager.load();

      expect(loaded).toBeDefined();
      expect(loaded!["5-1"][0].rotational["1"].x).toBe(100);
      expect(loaded!["5-1"][0].rotational["1"].isCustom).toBe(true);
      expect(loaded!["5-1"][0].rotational["1"].lastModified).toBeInstanceOf(
        Date
      );
    });

    it("should return null when no data is stored", () => {
      const loaded = manager.load();
      expect(loaded).toBeNull();
    });

    it("should handle corrupted data gracefully", () => {
      localStorageMock.setItem("volleyball-custom-positions", "invalid json");

      const loaded = manager.load();

      expect(loaded).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "volleyball-custom-positions"
      );
    });

    it("should validate data structure and clear invalid data", () => {
      const invalidData = {
        version: "1.0.0",
        lastModified: new Date().toISOString(),
        positions: {
          "5-1": "invalid", // Should be an object
        },
      };

      localStorageMock.setItem(
        "volleyball-custom-positions",
        JSON.stringify(invalidData)
      );

      const loaded = manager.load();

      expect(loaded).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "volleyball-custom-positions"
      );
    });

    it("should handle localStorage unavailable", () => {
      // Mock localStorage to throw error
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("localStorage not available");
      });

      const loaded = manager.load();

      expect(loaded).toBeNull();
    });
  });

  describe("clear", () => {
    it("should remove stored data", () => {
      const positions = createTestPositions();
      manager.saveImmediate(positions);

      manager.clear();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "volleyball-custom-positions"
      );
    });

    it("should cancel pending saves", () => {
      const positions = createTestPositions();
      manager.save(positions);

      // Clear before the debounced save
      manager.clear();

      // Fast-forward time - should not save
      vi.advanceTimersByTime(500);

      // Should only have the storage availability test from clear()
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "__storage_test__",
        "__storage_test__"
      );
    });

    it("should handle errors gracefully", () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("Remove failed");
      });

      expect(() => manager.clear()).not.toThrow();
    });
  });

  describe("hasStoredData", () => {
    it("should return true when data exists", () => {
      const positions = createTestPositions();
      manager.saveImmediate(positions);

      expect(manager.hasStoredData()).toBe(true);
    });

    it("should return false when no data exists", () => {
      expect(manager.hasStoredData()).toBe(false);
    });

    it("should return false when localStorage is unavailable", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("localStorage not available");
      });

      expect(manager.hasStoredData()).toBe(false);
    });
  });

  describe("getStorageInfo", () => {
    it("should return storage usage information", () => {
      const positions = createTestPositions();
      manager.saveImmediate(positions);

      const info = manager.getStorageInfo();

      expect(info.available).toBe(true);
      expect(info.used).toBeGreaterThan(0);
      expect(info.quota).toBe(5 * 1024 * 1024);
    });

    it("should return unavailable when localStorage is not accessible", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("localStorage not available");
      });

      const info = manager.getStorageInfo();

      expect(info.available).toBe(false);
      expect(info.used).toBe(0);
    });
  });

  describe("data serialization", () => {
    it("should properly serialize and deserialize dates", () => {
      const positions = createTestPositions();
      const originalDate = positions["5-1"][0].rotational["1"].lastModified;

      manager.saveImmediate(positions);
      const loaded = manager.load();

      expect(loaded!["5-1"][0].rotational["1"].lastModified).toBeInstanceOf(
        Date
      );
      expect(loaded!["5-1"][0].rotational["1"].lastModified.getTime()).toBe(
        originalDate.getTime()
      );
    });

    it("should handle missing lastModified dates", () => {
      const positions = createTestPositions();
      // Remove lastModified from one position
      delete (
        positions["5-1"][0].rotational["1"] as unknown as Record<
          string,
          unknown
        >
      ).lastModified;

      manager.saveImmediate(positions);
      const loaded = manager.load();

      expect(loaded).toBeDefined();
      expect(loaded!["5-1"][0].rotational["1"].lastModified).toBeUndefined();
    });
  });

  describe("version migration", () => {
    it("should handle same version data", () => {
      const positions = createTestPositions();
      manager.saveImmediate(positions);

      const loaded = manager.load();

      expect(loaded).toBeDefined();
    });

    it("should migrate data from older versions", () => {
      const oldVersionData = {
        version: "0.9.0",
        lastModified: new Date().toISOString(),
        positions: createTestPositions(),
      };

      localStorageMock.setItem(
        "volleyball-custom-positions",
        JSON.stringify(oldVersionData)
      );

      const loaded = manager.load();

      expect(loaded).toBeDefined();
      // Should have migrated the data successfully
    });
  });

  describe("error handling", () => {
    it("should handle localStorage detection failure", () => {
      // Mock localStorage to be undefined
      Object.defineProperty(window, "localStorage", {
        value: undefined,
        configurable: true,
      });

      const newManager = new LocalStorageManager();
      const positions = createTestPositions();

      expect(() => newManager.saveImmediate(positions)).toThrow(
        "LocalStorage is not available"
      );
      expect(newManager.load()).toBeNull();
      expect(newManager.hasStoredData()).toBe(false);

      // Restore localStorage
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
        configurable: true,
      });
    });

    it("should handle storage test failure", () => {
      localStorageMock.setItem.mockImplementation((key: string) => {
        if (key === "__storage_test__") {
          throw new Error("Storage test failed");
        }
      });

      const newManager = new LocalStorageManager();
      const positions = createTestPositions();

      expect(() => newManager.saveImmediate(positions)).toThrow(
        "LocalStorage is not available"
      );
    });
  });
});
