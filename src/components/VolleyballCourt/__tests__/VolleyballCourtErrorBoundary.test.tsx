import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VolleyballCourtErrorBoundary } from "../VolleyballCourtErrorBoundary";
import { ErrorData } from "../types";

// Mock component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; errorType?: string }> = ({
  shouldThrow = false,
  errorType = "generic",
}) => {
  if (shouldThrow) {
    if (errorType === "validation") {
      throw new Error("Validation error occurred");
    } else if (errorType === "storage") {
      throw new Error("localStorage is not available");
    } else if (errorType === "rules-engine") {
      throw new Error("VolleyballRulesEngine calculation failed");
    } else if (errorType === "render") {
      throw new Error("Component render failed");
    } else {
      throw new Error("Generic error");
    }
  }
  return <div>No error</div>;
};

describe("VolleyballCourtErrorBoundary", () => {
  const mockOnError = vi.fn();
  const mockFallbackComponent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for these tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <VolleyballCourtErrorBoundary>
        <div>Test content</div>
      </VolleyballCourtErrorBoundary>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders default error UI when child component throws", () => {
    render(
      <VolleyballCourtErrorBoundary>
        <ThrowError shouldThrow={true} />
      </VolleyballCourtErrorBoundary>
    );

    expect(screen.getByText("Unexpected Error")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
    expect(screen.getByText("Reload Page")).toBeInTheDocument();
  });

  it("categorizes validation errors correctly", () => {
    render(
      <VolleyballCourtErrorBoundary>
        <ThrowError shouldThrow={true} errorType="validation" />
      </VolleyballCourtErrorBoundary>
    );

    expect(screen.getByText("Validation Error")).toBeInTheDocument();
    expect(
      screen.getByText(/There was an issue with position validation/)
    ).toBeInTheDocument();
    expect(screen.getByText("Continue with Basic Mode")).toBeInTheDocument();
  });

  it("categorizes storage errors correctly", () => {
    render(
      <VolleyballCourtErrorBoundary>
        <ThrowError shouldThrow={true} errorType="storage" />
      </VolleyballCourtErrorBoundary>
    );

    expect(screen.getByText("Storage Error")).toBeInTheDocument();
    expect(
      screen.getByText(/Unable to save or load positions/)
    ).toBeInTheDocument();
    expect(screen.getByText("Continue without Saving")).toBeInTheDocument();
  });

  it("categorizes rules engine errors correctly", () => {
    render(
      <VolleyballCourtErrorBoundary>
        <ThrowError shouldThrow={true} errorType="rules-engine" />
      </VolleyballCourtErrorBoundary>
    );

    expect(screen.getByText("Rules Engine Error")).toBeInTheDocument();
    expect(
      screen.getByText(
        /The volleyball rules validation system encountered an error/
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Continue without Rules")).toBeInTheDocument();
  });

  it("categorizes render errors correctly", () => {
    render(
      <VolleyballCourtErrorBoundary>
        <ThrowError shouldThrow={true} errorType="render" />
      </VolleyballCourtErrorBoundary>
    );

    expect(screen.getByText("Rendering Error")).toBeInTheDocument();
    expect(
      screen.getByText(
        /There was an issue rendering the volleyball court component/
      )
    ).toBeInTheDocument();
  });

  it("calls onError callback when error occurs", () => {
    render(
      <VolleyballCourtErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} errorType="validation" />
      </VolleyballCourtErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledWith({
      type: "validation",
      message: "Validation error occurred",
      details: expect.objectContaining({
        stack: expect.any(String),
        componentStack: expect.any(String),
      }),
    });
  });

  it("uses custom fallback component when provided", () => {
    const customFallback = (error: ErrorData, resetError: () => void) => (
      <div>
        <span>Custom error: {error.message}</span>
        <button onClick={resetError}>Custom Reset</button>
      </div>
    );

    render(
      <VolleyballCourtErrorBoundary fallbackComponent={customFallback}>
        <ThrowError shouldThrow={true} />
      </VolleyballCourtErrorBoundary>
    );

    expect(screen.getByText("Custom error: Generic error")).toBeInTheDocument();
    expect(screen.getByText("Custom Reset")).toBeInTheDocument();
  });

  it("respects court dimensions for error UI sizing", () => {
    const courtDimensions = { width: 800, height: 600 };

    render(
      <VolleyballCourtErrorBoundary courtDimensions={courtDimensions}>
        <ThrowError shouldThrow={true} />
      </VolleyballCourtErrorBoundary>
    );

    const errorContainer = screen
      .getByText("Unexpected Error")
      .closest(".volleyball-court-error");
    expect(errorContainer).toHaveStyle({
      width: "800px",
      height: "600px",
    });
  });

  it("resets error state when reset button is clicked", () => {
    const { rerender } = render(
      <VolleyballCourtErrorBoundary>
        <ThrowError shouldThrow={true} />
      </VolleyballCourtErrorBoundary>
    );

    expect(screen.getByText("Unexpected Error")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Try Again"));

    // Re-render with no error
    rerender(
      <VolleyballCourtErrorBoundary>
        <ThrowError shouldThrow={false} />
      </VolleyballCourtErrorBoundary>
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("shows technical details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <VolleyballCourtErrorBoundary>
        <ThrowError shouldThrow={true} />
      </VolleyballCourtErrorBoundary>
    );

    expect(screen.getByText("Show Technical Details")).toBeInTheDocument();

    // Click to expand details
    fireEvent.click(screen.getByText("Show Technical Details"));
    expect(screen.getByText(/Error Type: unknown/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("hides technical details in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    render(
      <VolleyballCourtErrorBoundary>
        <ThrowError shouldThrow={true} />
      </VolleyballCourtErrorBoundary>
    );

    expect(
      screen.queryByText("Show Technical Details")
    ).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("renders court outline for visual context", () => {
    render(
      <VolleyballCourtErrorBoundary>
        <ThrowError shouldThrow={true} />
      </VolleyballCourtErrorBoundary>
    );

    const courtOutline = document.querySelector(
      ".absolute.inset-4.border-2.border-red-300"
    );
    expect(courtOutline).toBeInTheDocument();
  });

  it("handles reload page action", () => {
    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <VolleyballCourtErrorBoundary>
        <ThrowError shouldThrow={true} />
      </VolleyballCourtErrorBoundary>
    );

    fireEvent.click(screen.getByText("Reload Page"));
    expect(mockReload).toHaveBeenCalled();
  });
});
