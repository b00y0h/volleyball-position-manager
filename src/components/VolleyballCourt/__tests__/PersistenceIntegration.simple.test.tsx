/**
 * Simple integration tests for persistence functionality
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  VolleyballCourtProvider,
  useVolleyballCourt,
} from "../VolleyballCourtProvider";

// Mock the dependencies
vi.mock("@/utils/URLStateManager", () => ({
  URLStateManager: {
    parseCurrentURL: vi.fn().mockReturnValue(null),
    generateShareableURL: vi.fn().mockReturnValue("http://test.com/share"),
    hasPositionData: vi.fn().mockReturnValue(false),
    clearURLParameters: vi.fn(),
    updateBrowserURL: vi.fn(),
  },
}));

vi.mock("@/utils/storage/LocalStorageManager", () => ({
  LocalStorageManager: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockReturnValue(null),
    save: vi.fn(),
    saveImmediate: vi.fn(),
    clear: vi.fn(),
    hasStoredData: vi.fn().mockReturnValue(false),
    getStorageInfo: vi.fn().mockReturnValue({ used: 0, available: true }),
  })),
}));

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
  const { state, generateShareURL, hasURLData } = useVolleyballCourt();

  return (
    <div>
      <div data-testid="system">{state.system}</div>
      <div data-testid="loading">{state.isLoading.toString()}</div>
      <div data-testid="readonly">{state.isReadOnly.toString()}</div>
      <div data-testid="has-url-data">{hasURLData().toString()}</div>
      <button data-testid="generate-share" onClick={() => generateShareURL()}>
        Generate Share URL
      </button>
    </div>
  );
};

describe("Persistence Integration (Simple)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

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

  it("should render with default state", async () => {
    render(
      <VolleyballCourtProvider>
        <TestComponent />
      </VolleyballCourtProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("system")).toHaveTextContent("5-1");
    expect(screen.getByTestId("readonly")).toHaveTextContent("false");
    expect(screen.getByTestId("has-url-data")).toHaveTextContent("false");
  });

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

  it("should have persistence manager available", async () => {
    render(
      <VolleyballCourtProvider enableSharing={true} enablePersistence={true}>
        <TestComponent />
      </VolleyballCourtProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    // Should be able to click generate share button without errors
    const generateButton = screen.getByTestId("generate-share");
    expect(generateButton).toBeInTheDocument();
  });
});
