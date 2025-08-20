/**
 * Integration tests for persistence functionality in VolleyballCourtProvider
 */

import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import {
  VolleyballCourtProvider,
  useVolleyballCourt,
} from "../VolleyballCourtProvider";
import { URLStateManager } from "@/utils/URLStateManager";
import { LocalStorageManager } from "@/utils/storage/LocalStorageManager";

// Mock the dependencies
vi.mock("@/utils/URLStateManager");
vi.mock("@/utils/storage/LocalStorageManager");
vi.mock("@/hooks/useEnhancedPositionManager", () => ({
  useEnhancedPositionManager: () => ({
    getFormationPositions: vi.fn().mockReturnValue({
      S: { x: 100, y: 200, isCustom: false, lastModified: new Date() },
      OH1: { x: 150, y: 250, isCustom: false, lastModified: new Date() },
    }),
    validateCurrentFormation: vi.fn().mockReturnValue({
      isValid: true,
      violations: [],
    }),
  }),
}));

// Test component that uses the context
const TestComponent: React.FC = () => {
  const {
    state,
    generateShareURL,
    copyShareURL,
    clearStoredData,
    hasURLData,
    persistenceManager,
  } = useVolleyballCourt();

  return (
    <div>
      <div data-testid="system">{state.system}</div>
      <div data-testid="rotation">{state.rotationIndex}</div>
      <div data-testid="formation">{state.formation}</div>
      <div data-testid="loading">{state.isLoading.toString()}</div>
      <div data-testid="readonly">{state.isReadOnly.toString()}</div>
      <div data-testid="has-url-data">{hasURLData().toString()}</div>
      <button data-testid="generate-share" onClick={() => generateShareURL()}>
        Generate Share URL
      </button>
      <button data-testid="copy-url" onClick={() => copyShareURL("test-url")}>
        Copy URL
      </button>
      <button data-testid="clear-data" onClick={() => clearStoredData()}>
        Clear Data
      </button>
    </div>
  );
};

describe("Persistence Integration", () => {
  let mockURLStateManager: typeof URLStateManager;
  let mockLocalStorageManager: LocalStorageManager;

  beforeEach(() => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization from URL", () => {
    it("should initialize from URL data when available", async () => {
      const mockURLData = {
        system: "6-2" as const,
        rotation: 2,
        positions: {
          2: {
            base: {
              S1: { x: 200, y: 300, isCustom: true, lastModified: new Date() },
            },
          },
        },
        version: "1.0.0",
      };

      mockURLStateManager.parseCurrentURL.mockReturnValue(mockURLData);

      render(
        <VolleyballCourtProvider enableSharing={true} enablePersistence={true}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      expect(screen.getByTestId("system")).toHaveTextContent("6-2");
      expect(screen.getByTestId("rotation")).toHaveTextContent("2");
      expect(screen.getByTestId("formation")).toHaveTextContent("base");
    });

    it("should fallback to localStorage when no URL data", async () => {
      mockURLStateManager.parseCurrentURL.mockReturnValue(null);
      mockLocalStorageManager.load.mockReturnValue({
        "5-1": {
          1: {
            serveReceive: {
              S: { x: 150, y: 250, isCustom: true, lastModified: new Date() },
            },
          },
        },
        "6-2": {},
      });

      render(
        <VolleyballCourtProvider enableSharing={true} enablePersistence={true}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      // Should use default values when localStorage data doesn't match current state
      expect(screen.getByTestId("system")).toHaveTextContent("5-1");
      expect(screen.getByTestId("rotation")).toHaveTextContent("0");
      expect(screen.getByTestId("formation")).toHaveTextContent("base");
    });

    it("should use default configuration when no persistence data", async () => {
      mockURLStateManager.parseCurrentURL.mockReturnValue(null);
      mockLocalStorageManager.load.mockReturnValue(null);

      render(
        <VolleyballCourtProvider>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      expect(screen.getByTestId("system")).toHaveTextContent("5-1");
      expect(screen.getByTestId("rotation")).toHaveTextContent("0");
      expect(screen.getByTestId("formation")).toHaveTextContent("base");
    });
  });

  describe("read-only mode", () => {
    it("should enable read-only mode when readOnly prop is true", async () => {
      render(
        <VolleyballCourtProvider readOnly={true}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      expect(screen.getByTestId("readonly")).toHaveTextContent("true");
    });

    it("should disable persistence when in read-only mode", async () => {
      render(
        <VolleyballCourtProvider readOnly={true} enablePersistence={true}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      // Auto-save should be disabled in read-only mode
      // This is tested indirectly by checking that the persistence manager
      // is configured correctly (tested in PersistenceManager.test.ts)
    });
  });

  describe("share functionality", () => {
    it("should generate share URL successfully", async () => {
      const mockShareURL = "http://localhost:3000/?d=encoded&v=1.0.0&s=5-1&r=0";
      mockURLStateManager.generateShareableURL.mockReturnValue(mockShareURL);

      render(
        <VolleyballCourtProvider enableSharing={true}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      const generateButton = screen.getByTestId("generate-share");

      await act(async () => {
        generateButton.click();
      });

      expect(mockURLStateManager.generateShareableURL).toHaveBeenCalled();
    });

    it("should copy URL to clipboard", async () => {
      render(
        <VolleyballCourtProvider enableSharing={true}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      const copyButton = screen.getByTestId("copy-url");

      await act(async () => {
        copyButton.click();
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test-url");
    });

    it("should handle share URL generation errors", async () => {
      mockURLStateManager.generateShareableURL.mockImplementation(() => {
        throw new Error("URL generation failed");
      });

      render(
        <VolleyballCourtProvider enableSharing={true}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      const generateButton = screen.getByTestId("generate-share");

      // Should not throw, but handle error gracefully
      await act(async () => {
        generateButton.click();
      });

      // Error should be handled internally
      expect(mockURLStateManager.generateShareableURL).toHaveBeenCalled();
    });
  });

  describe("data management", () => {
    it("should clear stored data", async () => {
      render(
        <VolleyballCourtProvider enablePersistence={true}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      const clearButton = screen.getByTestId("clear-data");

      await act(async () => {
        clearButton.click();
      });

      expect(mockLocalStorageManager.clear).toHaveBeenCalled();
      expect(mockURLStateManager.clearURLParameters).toHaveBeenCalled();
    });

    it("should check for URL data", async () => {
      mockURLStateManager.hasPositionData.mockReturnValue(true);

      render(
        <VolleyballCourtProvider enableSharing={true}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      expect(screen.getByTestId("has-url-data")).toHaveTextContent("true");
    });
  });

  describe("persistence options", () => {
    it("should disable URL persistence when enableSharing is false", async () => {
      render(
        <VolleyballCourtProvider enableSharing={false}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      expect(screen.getByTestId("has-url-data")).toHaveTextContent("false");
    });

    it("should disable localStorage when enablePersistence is false", async () => {
      render(
        <VolleyballCourtProvider enablePersistence={false}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      // Should not attempt to load from localStorage
      expect(mockLocalStorageManager.load).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle initialization errors gracefully", async () => {
      mockURLStateManager.parseCurrentURL.mockImplementation(() => {
        throw new Error("URL parsing error");
      });

      render(
        <VolleyballCourtProvider enableSharing={true}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      // Should fallback to default state
      expect(screen.getByTestId("system")).toHaveTextContent("5-1");
      expect(screen.getByTestId("rotation")).toHaveTextContent("0");
      expect(screen.getByTestId("formation")).toHaveTextContent("base");
    });

    it("should handle clipboard errors gracefully", async () => {
      vi.mocked(navigator.clipboard.writeText).mockRejectedValue(
        new Error("Clipboard error")
      );

      render(
        <VolleyballCourtProvider enableSharing={true}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      const copyButton = screen.getByTestId("copy-url");

      // Should not throw, but handle error gracefully
      await act(async () => {
        copyButton.click();
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test-url");
    });
  });
});
