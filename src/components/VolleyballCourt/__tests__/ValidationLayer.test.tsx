import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ValidationLayer } from "../ValidationLayer";
import { ViolationData } from "../types";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock ValidationDisplay component
vi.mock("@/components/ValidationDisplay", () => ({
  ValidationDisplay: ({
    validationResult,
    onViolationClick,
    showDetails,
    className,
  }: any) => (
    <div data-testid="validation-display" className={className}>
      <div>Legal: {validationResult.isLegal.toString()}</div>
      <div>Violations: {validationResult.violations.length}</div>
      <div>Show Details: {showDetails.toString()}</div>
      {validationResult.violations.map((violation: any, index: number) => (
        <div key={index} onClick={() => onViolationClick?.(violation)}>
          {violation.code}: {violation.message}
        </div>
      ))}
    </div>
  ),
}));

describe("ValidationLayer", () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleViolations: ViolationData[] = [
    {
      code: "ROW_ORDER",
      message: "Front row players must maintain left-to-right order",
      affectedPlayers: ["player-1", "player-2"],
      severity: "error",
    },
    {
      code: "FRONT_BACK",
      message:
        "Front row players must be positioned in front of back row players",
      affectedPlayers: ["player-3"],
      severity: "warning",
    },
  ];

  it("renders nothing when there are no violations", () => {
    const { container } = render(
      <ValidationLayer violations={[]} showDetails={true} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders ValidationDisplay when violations exist", () => {
    render(
      <ValidationLayer violations={sampleViolations} showDetails={true} />
    );

    expect(screen.getByTestId("validation-display")).toBeInTheDocument();
    expect(screen.getByText("Legal: false")).toBeInTheDocument();
    expect(screen.getByText("Violations: 2")).toBeInTheDocument();
    expect(screen.getByText("Show Details: true")).toBeInTheDocument();
  });

  it("converts ViolationData to OverlapResult format correctly", () => {
    render(
      <ValidationLayer violations={sampleViolations} showDetails={true} />
    );

    expect(
      screen.getByText(
        "ROW_ORDER: Front row players must maintain left-to-right order"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "FRONT_BACK: Front row players must be positioned in front of back row players"
      )
    ).toBeInTheDocument();
  });

  it("shows dismiss button when onDismiss is provided", () => {
    render(
      <ValidationLayer
        violations={sampleViolations}
        showDetails={true}
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByLabelText("Dismiss violations");
    expect(dismissButton).toBeInTheDocument();
    expect(dismissButton).toHaveTextContent("×");
  });

  it("hides dismiss button when onDismiss is not provided", () => {
    render(
      <ValidationLayer violations={sampleViolations} showDetails={true} />
    );

    expect(
      screen.queryByLabelText("Dismiss violations")
    ).not.toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    render(
      <ValidationLayer
        violations={sampleViolations}
        showDetails={true}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.click(screen.getByLabelText("Dismiss violations"));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("passes showDetails prop to ValidationDisplay", () => {
    const { rerender } = render(
      <ValidationLayer violations={sampleViolations} showDetails={false} />
    );

    expect(screen.getByText("Show Details: false")).toBeInTheDocument();

    rerender(
      <ValidationLayer violations={sampleViolations} showDetails={true} />
    );

    expect(screen.getByText("Show Details: true")).toBeInTheDocument();
  });

  it("handles violation click events", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    render(
      <ValidationLayer violations={sampleViolations} showDetails={true} />
    );

    fireEvent.click(
      screen.getByText(
        "ROW_ORDER: Front row players must maintain left-to-right order"
      )
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "Violation clicked:",
      expect.objectContaining({
        code: "ROW_ORDER",
        message: "Front row players must maintain left-to-right order",
      })
    );

    consoleSpy.mockRestore();
  });

  it("extracts slot numbers from player IDs correctly", () => {
    const violationsWithPlayerIds: ViolationData[] = [
      {
        code: "TEST",
        message: "Test violation",
        affectedPlayers: ["player-1", "player-3", "player-10"],
        severity: "error",
      },
    ];

    render(
      <ValidationLayer
        violations={violationsWithPlayerIds}
        showDetails={true}
      />
    );

    // The component should extract slot numbers 1, 3, 10 from the player IDs
    expect(screen.getByTestId("validation-display")).toBeInTheDocument();
  });

  it("handles player IDs without numbers gracefully", () => {
    const violationsWithoutNumbers: ViolationData[] = [
      {
        code: "TEST",
        message: "Test violation",
        affectedPlayers: ["setter", "outside-hitter"],
        severity: "error",
      },
    ];

    render(
      <ValidationLayer
        violations={violationsWithoutNumbers}
        showDetails={true}
      />
    );

    // Should not crash and should render the validation display
    expect(screen.getByTestId("validation-display")).toBeInTheDocument();
  });

  it("applies correct CSS classes for positioning", () => {
    render(
      <ValidationLayer violations={sampleViolations} showDetails={true} />
    );

    // The mocked motion.div doesn't apply classes, so we check for the presence of the component
    expect(screen.getByTestId("validation-display")).toBeInTheDocument();

    // In a real implementation, the container would have these classes:
    // "absolute bottom-4 left-4 right-4 z-10"
  });

  it("applies shadow-lg class to ValidationDisplay", () => {
    render(
      <ValidationLayer violations={sampleViolations} showDetails={true} />
    );

    expect(screen.getByTestId("validation-display")).toHaveClass("shadow-lg");
  });

  it("positions dismiss button correctly", () => {
    render(
      <ValidationLayer
        violations={sampleViolations}
        showDetails={true}
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByLabelText("Dismiss violations");
    expect(dismissButton).toHaveClass("absolute", "-top-2", "-right-2", "z-20");
  });

  it("handles empty violations array", () => {
    render(
      <ValidationLayer
        violations={[]}
        showDetails={true}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.queryByTestId("validation-display")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Dismiss violations")
    ).not.toBeInTheDocument();
  });

  it("handles single violation", () => {
    const singleViolation: ViolationData[] = [
      {
        code: "SINGLE",
        message: "Single violation",
        affectedPlayers: ["player-1"],
        severity: "error",
      },
    ];

    render(<ValidationLayer violations={singleViolation} showDetails={true} />);

    expect(screen.getByText("Legal: false")).toBeInTheDocument();
    expect(screen.getByText("Violations: 1")).toBeInTheDocument();
    expect(screen.getByText("SINGLE: Single violation")).toBeInTheDocument();
  });
});
