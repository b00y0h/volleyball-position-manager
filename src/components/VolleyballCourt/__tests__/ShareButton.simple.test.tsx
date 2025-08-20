/**
 * Simple tests for ShareButton component with persistence integration
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShareButton } from "../controls/ShareButton";
import { VolleyballCourtProvider } from "../VolleyballCourtProvider";

// Mock the persistence dependencies
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

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <VolleyballCourtProvider enableSharing={true}>
      {children}
    </VolleyballCourtProvider>
  );
};

describe("ShareButton (Simple)", () => {
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

  it("renders with default text", async () => {
    render(
      <TestWrapper>
        <ShareButton />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("share-button")).toBeInTheDocument();
    });

    expect(screen.getByText("Share")).toBeInTheDocument();
  });

  it("generates share URL and copies to clipboard when clicked", async () => {
    render(
      <TestWrapper>
        <ShareButton />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("share-button")).toBeInTheDocument();
    });

    const button = screen.getByTestId("share-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "http://test.com/share"
      );
    });
  });

  it("shows copied feedback after successful share", async () => {
    render(
      <TestWrapper>
        <ShareButton showCopyFeedback={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("share-button")).toBeInTheDocument();
    });

    const button = screen.getByTestId("share-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });
  });

  it("is disabled when animating", async () => {
    render(
      <TestWrapper>
        <ShareButton isAnimating={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("share-button")).toBeInTheDocument();
    });

    const button = screen.getByTestId("share-button");
    expect(button).toBeDisabled();
  });

  it("calls external onShare callback if provided", async () => {
    const onShare = vi.fn();

    render(
      <TestWrapper>
        <ShareButton onShare={onShare} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("share-button")).toBeInTheDocument();
    });

    const button = screen.getByTestId("share-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(onShare).toHaveBeenCalled();
    });
  });
});
