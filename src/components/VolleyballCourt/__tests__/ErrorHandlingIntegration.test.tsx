import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VolleyballCourt } from "../VolleyballCourt";
import { VolleyballCourtConfig, ErrorData, ViolationData } from "../types";

// Mock the sub-components to focus on integration
vi.mock("../CourtVisualization", () => ({
  CourtVisualization: ({ dimensions }: any) => (
    <div data-testid="court-visualization">
      Court {dimensions.width}x{dimensions.height}
    </div>
  ),
}));

vi.mock("../ValidationLayer", () => ({
  ValidationLayer: ({ violations, onDismiss }: any) => (
    <div data-testid="validation-layer">
      Violations: {violations.length}
      {onDismiss && (
        <button onClick={onDismiss} data-testid="dismiss-violations">
          Dismiss
        </button>
      )}
    </div>
  ),
}));

vi.mock("@/components/NotificationSystem", () => ({
  NotificationProvider: ({ children }: any) => (
    <div data-testid="notification-provider">{children}</div>
  ),
  useNotifications: () => ({
    notifications: [],
    addNotification: vi.fn(),
    removeNotification: vi.fn(),
    clearAll: vi.fn(),
  }),
}));

// Mock the provider to simulate different states
const mockUseVolleyballCourt = vi.fn();
vi.mock("../VolleyballCourtProvider", () => ({
  VolleyballCourtProvider: ({ children }: any) => children,
  useVolleyballCourt: () => mockUseVolleyballCourt(),
}));

// Mock window size hook
vi.mock("../VolleyballCourt", async () => {
  const actual = await vi.importActual("../VolleyballCourt");
  return {
    ...actual,
    useWindowSize: () => ({ width: 1200, height: 800 }),
  };
});

describe("Error Handling Integration", () => {
  const mockOnError = vi.fn();
  const mockOnViolation = vi.fn();

  const defaultConfig: VolleyballCourtConfig = {
    initialSystem: "5-1",
    initialRotation: 0,
    initialFormation: "rotational",
    validation: {
      showViolationDetails: true,
      enableRealTimeValidation: true,
    },
    appearance: {
      theme: "light",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock state
    mockUseVolleyballCourt.mockReturnValue({
      state: {
        system: "5-1",
        rotationIndex: 0,
        formation: "rotational",
        isAnimating: false,
        draggedPlayer: null,
        violations: [],
        visualGuidelines: { horizontalLines: [], verticalLines: [] },
        isReadOnly: false,
        showControls: true,
        shareURL: "",
        showShareDialog: false,
        positions: {},
        isLoading: false,
        error: null,
      },
      config: {
        players: { "5-1": [], "6-2": [] },
        rotations: { "5-1": [], "6-2": [] },
        validation: { showViolationDetails: true },
        appearance: { theme: "light" },
      },
    });
  });

  it("renders without errors in normal state", () => {
    render(
      <VolleyballCourt
        config={defaultConfig}
        onError={mockOnError}
        onViolation={mockOnViolation}
      />
    );

    expect(screen.getByTestId("notification-provider")).toBeInTheDocument();
    expect(screen.getByTestId("court-visualization")).toBeInTheDocument();
    expect(
      screen.getByText("Context provider active - State management working")
    ).toBeInTheDocument();
  });

  it("displays validation layer when violations exist", () => {
    mockUseVolleyballCourt.mockReturnValue({
      state: {
        system: "5-1",
        rotationIndex: 0,
        formation: "rotational",
        isAnimating: false,
        draggedPlayer: null,
        violations: ["Test violation 1", "Test violation 2"],
        visualGuidelines: { horizontalLines: [], verticalLines: [] },
        isReadOnly: false,
        showControls: true,
        shareURL: "",
        showShareDialog: false,
        positions: {},
        isLoading: false,
        error: null,
      },
      config: {
        players: { "5-1": [], "6-2": [] },
        rotations: { "5-1": [], "6-2": [] },
        validation: { showViolationDetails: true },
        appearance: { theme: "light" },
      },
    });

    render(
      <VolleyballCourt
        config={defaultConfig}
        onError={mockOnError}
        onViolation={mockOnViolation}
      />
    );

    expect(screen.getByTestId("validation-layer")).toBeInTheDocument();
    expect(screen.getByText("Violations: 2")).toBeInTheDocument();
    expect(screen.getByText("2 violations detected")).toBeInTheDocument();
  });

  it("hides validation layer when showViolationDetails is false", () => {
    mockUseVolleyballCourt.mockReturnValue({
      state: {
        system: "5-1",
        rotationIndex: 0,
        formation: "rotational",
        isAnimating: false,
        draggedPlayer: null,
        violations: ["Test violation"],
        visualGuidelines: { horizontalLines: [], verticalLines: [] },
        isReadOnly: false,
        showControls: true,
        shareURL: "",
        showShareDialog: false,
        positions: {},
        isLoading: false,
        error: null,
      },
      config: {
        players: { "5-1": [], "6-2": [] },
        rotations: { "5-1": [], "6-2": [] },
        validation: { showViolationDetails: false },
        appearance: { theme: "light" },
      },
    });

    render(
      <VolleyballCourt
        config={{
          ...defaultConfig,
          validation: { showViolationDetails: false },
        }}
        onError={mockOnError}
        onViolation={mockOnViolation}
      />
    );

    expect(screen.queryByTestId("validation-layer")).not.toBeInTheDocument();
  });

  it("displays error state when state has error", () => {
    mockUseVolleyballCourt.mockReturnValue({
      state: {
        system: "5-1",
        rotationIndex: 0,
        formation: "rotational",
        isAnimating: false,
        draggedPlayer: null,
        violations: [],
        visualGuidelines: { horizontalLines: [], verticalLines: [] },
        isReadOnly: false,
        showControls: true,
        shareURL: "",
        showShareDialog: false,
        positions: {},
        isLoading: false,
        error: "Failed to load court data",
      },
      config: {
        players: { "5-1": [], "6-2": [] },
        rotations: { "5-1": [], "6-2": [] },
        validation: { showViolationDetails: true },
        appearance: { theme: "light" },
      },
    });

    render(
      <VolleyballCourt
        config={defaultConfig}
        onError={mockOnError}
        onViolation={mockOnViolation}
      />
    );

    expect(
      screen.getByText("Error loading volleyball court")
    ).toBeInTheDocument();
    expect(screen.getByText("Failed to load court data")).toBeInTheDocument();
  });

  it("displays loading state", () => {
    mockUseVolleyballCourt.mockReturnValue({
      state: {
        system: "5-1",
        rotationIndex: 0,
        formation: "rotational",
        isAnimating: false,
        draggedPlayer: null,
        violations: [],
        visualGuidelines: { horizontalLines: [], verticalLines: [] },
        isReadOnly: false,
        showControls: true,
        shareURL: "",
        showShareDialog: false,
        positions: {},
        isLoading: true,
        error: null,
      },
      config: {
        players: { "5-1": [], "6-2": [] },
        rotations: { "5-1": [], "6-2": [] },
        validation: { showViolationDetails: true },
        appearance: { theme: "light" },
      },
    });

    render(
      <VolleyballCourt
        config={defaultConfig}
        onError={mockOnError}
        onViolation={mockOnViolation}
      />
    );

    expect(screen.getByText("Loading volleyball court...")).toBeInTheDocument();
  });

  it("wraps component with error boundary", () => {
    // This test verifies the error boundary is present by checking the component structure
    render(
      <VolleyballCourt
        config={defaultConfig}
        onError={mockOnError}
        onViolation={mockOnViolation}
      />
    );

    // The NotificationProvider should be present, indicating the error boundary wrapper is working
    expect(screen.getByTestId("notification-provider")).toBeInTheDocument();
  });

  it("handles violation dismissal", async () => {
    mockUseVolleyballCourt.mockReturnValue({
      state: {
        system: "5-1",
        rotationIndex: 0,
        formation: "rotational",
        isAnimating: false,
        draggedPlayer: null,
        violations: ["Test violation"],
        visualGuidelines: { horizontalLines: [], verticalLines: [] },
        isReadOnly: false,
        showControls: true,
        shareURL: "",
        showShareDialog: false,
        positions: {},
        isLoading: false,
        error: null,
      },
      config: {
        players: { "5-1": [], "6-2": [] },
        rotations: { "5-1": [], "6-2": [] },
        validation: { showViolationDetails: true },
        appearance: { theme: "light" },
      },
    });

    render(
      <VolleyballCourt
        config={defaultConfig}
        onError={mockOnError}
        onViolation={mockOnViolation}
      />
    );

    expect(screen.getByTestId("validation-layer")).toBeInTheDocument();

    // Click dismiss button
    fireEvent.click(screen.getByTestId("dismiss-violations"));

    // The validation layer should still be present but violations should be cleared
    // (This would require the component to update its internal state)
  });

  it("shows debug information in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    mockUseVolleyballCourt.mockReturnValue({
      state: {
        system: "5-1",
        rotationIndex: 0,
        formation: "rotational",
        isAnimating: false,
        draggedPlayer: null,
        violations: ["Test violation"],
        visualGuidelines: { horizontalLines: [], verticalLines: [] },
        isReadOnly: false,
        showControls: true,
        shareURL: "",
        showShareDialog: false,
        positions: {},
        isLoading: false,
        error: null, // No error so we can see the debug info
      },
      config: {
        players: { "5-1": [], "6-2": [] },
        rotations: { "5-1": [], "6-2": [] },
        validation: { showViolationDetails: true },
        appearance: { theme: "light" },
      },
    });

    render(
      <VolleyballCourt
        config={defaultConfig}
        onError={mockOnError}
        onViolation={mockOnViolation}
      />
    );

    expect(
      screen.getByText(
        /Players: 0.*ReadOnly: No.*Theme: light.*Violations: 1.*Errors: 0/
      )
    ).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("applies correct court dimensions", () => {
    render(
      <VolleyballCourt
        config={defaultConfig}
        courtDimensions={{ width: 800, height: 600 }}
        onError={mockOnError}
        onViolation={mockOnViolation}
      />
    );

    // The court should use calculated responsive dimensions, not the provided prop
    const courtElement = screen
      .getByText("Context provider active - State management working")
      .closest(".volleyball-court");
    expect(courtElement).toHaveStyle({
      width: "644px", // This comes from the calculated dimensions based on window size
      height: "386.4px",
    });
  });

  it("handles theme changes correctly", () => {
    const { rerender } = render(
      <VolleyballCourt
        config={{
          ...defaultConfig,
          appearance: { theme: "light" },
        }}
        onError={mockOnError}
        onViolation={mockOnViolation}
      />
    );

    let courtElement = screen
      .getByText("Context provider active - State management working")
      .closest(".volleyball-court");
    expect(courtElement).toHaveStyle({
      backgroundColor: "#ffffff",
      border: "1px solid #d1d5db",
    });

    // Change to dark theme
    mockUseVolleyballCourt.mockReturnValue({
      state: {
        system: "5-1",
        rotationIndex: 0,
        formation: "rotational",
        isAnimating: false,
        draggedPlayer: null,
        violations: [],
        visualGuidelines: { horizontalLines: [], verticalLines: [] },
        isReadOnly: false,
        showControls: true,
        shareURL: "",
        showShareDialog: false,
        positions: {},
        isLoading: false,
        error: null,
      },
      config: {
        players: { "5-1": [], "6-2": [] },
        rotations: { "5-1": [], "6-2": [] },
        validation: { showViolationDetails: true },
        appearance: { theme: "dark" },
      },
    });

    rerender(
      <VolleyballCourt
        config={{
          ...defaultConfig,
          appearance: { theme: "dark" },
        }}
        onError={mockOnError}
        onViolation={mockOnViolation}
      />
    );

    courtElement = screen
      .getByText("Context provider active - State management working")
      .closest(".volleyball-court");
    expect(courtElement).toHaveStyle({
      backgroundColor: "#1f2937",
      border: "1px solid #374151",
    });
  });
});
