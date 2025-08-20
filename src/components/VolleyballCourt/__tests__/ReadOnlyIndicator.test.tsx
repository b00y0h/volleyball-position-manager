/**
 * Tests for ReadOnlyIndicator component
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReadOnlyIndicator } from "../ReadOnlyIndicator";

describe("ReadOnlyIndicator", () => {
  const defaultProps = {
    isReadOnly: true,
    hasURLData: true,
    onClearURL: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render when in read-only mode with URL data", () => {
    render(<ReadOnlyIndicator {...defaultProps} />);

    expect(screen.getByTestId("read-only-indicator")).toBeInTheDocument();
    expect(
      screen.getByText("Viewing shared configuration (read-only)")
    ).toBeInTheDocument();
    expect(screen.getByText("Enable editing")).toBeInTheDocument();
  });

  it("should not render when not in read-only mode", () => {
    render(<ReadOnlyIndicator {...defaultProps} isReadOnly={false} />);

    expect(screen.queryByTestId("read-only-indicator")).not.toBeInTheDocument();
  });

  it("should not render when no URL data", () => {
    render(<ReadOnlyIndicator {...defaultProps} hasURLData={false} />);

    expect(screen.queryByTestId("read-only-indicator")).not.toBeInTheDocument();
  });

  it("should not render when both conditions are false", () => {
    render(
      <ReadOnlyIndicator
        {...defaultProps}
        isReadOnly={false}
        hasURLData={false}
      />
    );

    expect(screen.queryByTestId("read-only-indicator")).not.toBeInTheDocument();
  });

  it("should call onClearURL when enable editing button is clicked", () => {
    const onClearURL = vi.fn();
    render(<ReadOnlyIndicator {...defaultProps} onClearURL={onClearURL} />);

    const enableEditingButton = screen.getByText("Enable editing");
    fireEvent.click(enableEditingButton);

    expect(onClearURL).toHaveBeenCalledTimes(1);
  });

  it("should not show enable editing button when onClearURL is not provided", () => {
    render(<ReadOnlyIndicator {...defaultProps} onClearURL={undefined} />);

    expect(screen.queryByText("Enable editing")).not.toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(<ReadOnlyIndicator {...defaultProps} className="custom-class" />);

    const indicator = screen.getByTestId("read-only-indicator");
    expect(indicator).toHaveClass("custom-class");
  });

  it("should have proper accessibility attributes", () => {
    render(<ReadOnlyIndicator {...defaultProps} />);

    const indicator = screen.getByTestId("read-only-indicator");
    expect(indicator).toHaveAttribute("data-testid", "read-only-indicator");

    const enableButton = screen.getByText("Enable editing");
    expect(enableButton).toHaveAttribute(
      "title",
      "Clear URL and enable editing"
    );
  });

  it("should display correct styling classes", () => {
    render(<ReadOnlyIndicator {...defaultProps} />);

    const indicator = screen.getByTestId("read-only-indicator");
    expect(indicator).toHaveClass(
      "flex",
      "items-center",
      "gap-2",
      "px-3",
      "py-2",
      "bg-blue-50",
      "dark:bg-blue-900/20",
      "border",
      "border-blue-200",
      "dark:border-blue-800",
      "rounded-lg",
      "text-sm"
    );
  });

  it("should render info icon", () => {
    render(<ReadOnlyIndicator {...defaultProps} />);

    const icon = screen.getByTestId("read-only-indicator").querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass(
      "w-4",
      "h-4",
      "text-blue-600",
      "dark:text-blue-400"
    );
  });
});
