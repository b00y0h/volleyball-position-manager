/**
 * Tests for URLStateManager
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { URLStateManager } from "../URLStateManager";
import { CustomPositionsState, PlayerPosition } from "@/types";

// Mock window object for tests
const mockWindow = {
  location: {
    protocol: "https:",
    host: "example.com",
    pathname: "/volleyball",
    href: "https://example.com/volleyball",
  },
  history: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
  },
};

// Mock global window
Object.defineProperty(global, "window", {
  value: mockWindow,
  writable: true,
});

// Mock btoa and atob for Node.js environment
global.btoa = (str: string) => Buffer.from(str, "binary").toString("base64");
global.atob = (str: string) => Buffer.from(str, "base64").toString("binary");

describe("URLStateManager", () => {
  const mockPosition: PlayerPosition = {
    x: 100,
    y: 200,
    isCustom: true,
    lastModified: new Date("2024-01-01T00:00:00.000Z"),
  };

  const mockPositions: CustomPositionsState = {
    0: {
      rotational: {
        player1: mockPosition,
        player2: { ...mockPosition, x: 150, y: 250 },
      },
      serveReceive: {
        player1: { ...mockPosition, x: 120, y: 220 },
      },
      base: {},
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("encodePositionsToURL", () => {
    it("should create a valid URL with encoded position data", () => {
      const baseURL = "https://example.com/volleyball";
      const system = "5-1";
      const rotation = 0;

      const result = URLStateManager.encodePositionsToURL(
        baseURL,
        system,
        rotation,
        mockPositions
      );

      expect(result).toContain(baseURL);
      expect(result).toContain("d="); // compressed data
      expect(result).toContain("v=1.0.0"); // version
      expect(result).toContain("s=5-1"); // system
      expect(result).toContain("r=0"); // rotation
    });

    it("should handle empty positions", () => {
      const baseURL = "https://example.com/volleyball";
      const system = "6-2";
      const rotation = 1;
      const emptyPositions: CustomPositionsState = {};

      const result = URLStateManager.encodePositionsToURL(
        baseURL,
        system,
        rotation,
        emptyPositions
      );

      expect(result).toContain(baseURL);
      expect(result).toContain("s=6-2");
      expect(result).toContain("r=1");
    });

    it("should throw error for invalid data", () => {
      const baseURL = "https://example.com/volleyball";
      const system = "5-1";
      const rotation = 0;
      const invalidPositions = null as any;

      expect(() => {
        URLStateManager.encodePositionsToURL(
          baseURL,
          system,
          rotation,
          invalidPositions
        );
      }).toThrow("Failed to create shareable URL");
    });
  });

  describe("decodePositionsFromURL", () => {
    it("should decode valid URL data correctly", () => {
      const baseURL = "https://example.com/volleyball";
      const system = "5-1";
      const rotation = 0;

      // First encode the data
      const encodedURL = URLStateManager.encodePositionsToURL(
        baseURL,
        system,
        rotation,
        mockPositions
      );

      // Then decode it
      const result = URLStateManager.decodePositionsFromURL(encodedURL);

      expect(result).not.toBeNull();
      expect(result!.system).toBe(system);
      expect(result!.rotation).toBe(rotation);
      expect(result!.version).toBe("1.0.0");

      // Check structure but handle Date conversion
      expect(result!.positions[0]).toBeDefined();
      expect(result!.positions[0].rotational.player1.x).toBe(100);
      expect(result!.positions[0].rotational.player1.y).toBe(200);
      expect(result!.positions[0].rotational.player1.isCustom).toBe(true);
      expect(
        result!.positions[0].rotational.player1.lastModified
      ).toBeInstanceOf(Date);
    });

    it("should return null for invalid URL", () => {
      const invalidURL = "https://example.com/volleyball?invalid=true";

      const result = URLStateManager.decodePositionsFromURL(invalidURL);

      expect(result).toBeNull();
    });

    it("should return null for URL without required parameters", () => {
      const incompleteURL = "https://example.com/volleyball?d=somedata";

      const result = URLStateManager.decodePositionsFromURL(incompleteURL);

      expect(result).toBeNull();
    });

    it("should handle corrupted data gracefully", () => {
      const corruptedURL =
        "https://example.com/volleyball?d=invalid&v=1.0.0&s=5-1&r=0";

      const result = URLStateManager.decodePositionsFromURL(corruptedURL);

      expect(result).toBeNull();
    });
  });

  describe("hasPositionData", () => {
    it("should return true for URL with position data", () => {
      const baseURL = "https://example.com/volleyball";
      const encodedURL = URLStateManager.encodePositionsToURL(
        baseURL,
        "5-1",
        0,
        mockPositions
      );

      const result = URLStateManager.hasPositionData(encodedURL);

      expect(result).toBe(true);
    });

    it("should return false for URL without position data", () => {
      const cleanURL = "https://example.com/volleyball";

      const result = URLStateManager.hasPositionData(cleanURL);

      expect(result).toBe(false);
    });

    it("should return false for invalid URL", () => {
      const invalidURL = "not-a-url";

      const result = URLStateManager.hasPositionData(invalidURL);

      expect(result).toBe(false);
    });
  });

  describe("getURLInfo", () => {
    it("should extract basic info from URL", () => {
      const baseURL = "https://example.com/volleyball";
      const system = "6-2";
      const rotation = 3;
      const encodedURL = URLStateManager.encodePositionsToURL(
        baseURL,
        system,
        rotation,
        mockPositions
      );

      const result = URLStateManager.getURLInfo(encodedURL);

      expect(result).not.toBeNull();
      expect(result!.system).toBe(system);
      expect(result!.rotation).toBe(rotation);
      expect(result!.version).toBe("1.0.0");
    });

    it("should return null for URL without required parameters", () => {
      const incompleteURL = "https://example.com/volleyball?s=5-1";

      const result = URLStateManager.getURLInfo(incompleteURL);

      expect(result).toBeNull();
    });
  });

  describe("generateShareableURL", () => {
    it("should generate URL using current window location", () => {
      const system = "5-1";
      const rotation = 2;

      const result = URLStateManager.generateShareableURL(
        system,
        rotation,
        mockPositions
      );

      expect(result).toContain("https://example.com/volleyball");
      expect(result).toContain("s=5-1");
      expect(result).toContain("r=2");
    });
  });

  describe("parseCurrentURL", () => {
    it("should parse current window URL", () => {
      const baseURL = "https://example.com/volleyball";
      const encodedURL = URLStateManager.encodePositionsToURL(
        baseURL,
        "5-1",
        0,
        mockPositions
      );

      // Mock current URL
      mockWindow.location.href = encodedURL;

      const result = URLStateManager.parseCurrentURL();

      expect(result).not.toBeNull();
      expect(result!.system).toBe("5-1");
      expect(result!.rotation).toBe(0);
    });
  });

  describe("updateBrowserURL", () => {
    it("should update browser URL with pushState", () => {
      const system = "6-2";
      const rotation = 1;

      URLStateManager.updateBrowserURL(system, rotation, mockPositions, false);

      expect(mockWindow.history.pushState).toHaveBeenCalledWith(
        {},
        "",
        expect.stringContaining("s=6-2")
      );
    });

    it("should update browser URL with replaceState", () => {
      const system = "5-1";
      const rotation = 3;

      URLStateManager.updateBrowserURL(system, rotation, mockPositions, true);

      expect(mockWindow.history.replaceState).toHaveBeenCalledWith(
        {},
        "",
        expect.stringContaining("s=5-1")
      );
    });
  });

  describe("clearURLParameters", () => {
    it("should clear URL parameters", () => {
      URLStateManager.clearURLParameters();

      expect(mockWindow.history.replaceState).toHaveBeenCalledWith(
        {},
        "",
        "https://example.com/volleyball"
      );
    });
  });

  describe("data compression", () => {
    it("should compress and decompress data correctly", () => {
      const baseURL = "https://example.com/volleyball";
      const system = "5-1";
      const rotation = 0;

      // Create a smaller dataset to avoid fallback URL issues
      const testPositions: CustomPositionsState = {
        0: {
          rotational: {
            player1: {
              x: 150,
              y: 200,
              isCustom: true,
              lastModified: new Date("2024-01-01T00:00:00.000Z"),
            },
            player2: {
              x: 200,
              y: 200,
              isCustom: true,
              lastModified: new Date("2024-01-01T00:00:00.000Z"),
            },
          },
          serveReceive: {},
          base: {},
        },
      };

      const encodedURL = URLStateManager.encodePositionsToURL(
        baseURL,
        system,
        rotation,
        testPositions
      );

      const decodedData = URLStateManager.decodePositionsFromURL(encodedURL);

      expect(decodedData).not.toBeNull();
      expect(decodedData!.positions[0].rotational.player1.x).toBe(150);
      expect(decodedData!.positions[0].rotational.player1.y).toBe(200);
      expect(decodedData!.positions[0].rotational.player1.isCustom).toBe(true);
      expect(
        decodedData!.positions[0].rotational.player1.lastModified
      ).toBeInstanceOf(Date);
    });
  });

  describe("version compatibility", () => {
    it("should handle compatible versions", () => {
      // This test would require mocking the version compatibility logic
      // For now, we'll test that the current version is handled correctly
      const baseURL = "https://example.com/volleyball";
      const encodedURL = URLStateManager.encodePositionsToURL(
        baseURL,
        "5-1",
        0,
        mockPositions
      );

      const result = URLStateManager.decodePositionsFromURL(encodedURL);

      expect(result).not.toBeNull();
      expect(result!.version).toBe("1.0.0");
    });
  });

  describe("edge cases", () => {
    it("should handle Date objects in positions", () => {
      const positionsWithDates: CustomPositionsState = {
        0: {
          rotational: {
            player1: {
              x: 100,
              y: 200,
              isCustom: true,
              lastModified: new Date("2024-01-01T12:00:00.000Z"),
            },
          },
          serveReceive: {},
          base: {},
        },
      };

      const baseURL = "https://example.com/volleyball";
      const encodedURL = URLStateManager.encodePositionsToURL(
        baseURL,
        "5-1",
        0,
        positionsWithDates
      );

      const decodedData = URLStateManager.decodePositionsFromURL(encodedURL);

      expect(decodedData).not.toBeNull();
      const decodedDate =
        decodedData!.positions[0].rotational.player1.lastModified;
      expect(decodedDate).toBeInstanceOf(Date);
      expect(decodedDate.toISOString()).toBe("2024-01-01T12:00:00.000Z");
    });

    it("should handle empty formations", () => {
      const emptyFormations: CustomPositionsState = {
        0: {
          rotational: {},
          serveReceive: {},
          base: {},
        },
      };

      const baseURL = "https://example.com/volleyball";
      const encodedURL = URLStateManager.encodePositionsToURL(
        baseURL,
        "5-1",
        0,
        emptyFormations
      );

      const decodedData = URLStateManager.decodePositionsFromURL(encodedURL);

      expect(decodedData).not.toBeNull();
      expect(decodedData!.positions).toEqual(emptyFormations);
    });
  });
});
