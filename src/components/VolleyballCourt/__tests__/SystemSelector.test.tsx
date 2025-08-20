/**
 * Tests for SystemSelector component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SystemSelector } from "../controls/SystemSelector";

describe("SystemSelector", () => {
  const defaultProps = {
    system: "5-1" as const,
    onSystemChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with correct initial value", () => {
    render(<SystemSelector {...defaultProps} />);

    const selector = screen.getByTestId("system-selector");
    expect(selector).toHaveValue("5-1");
  });

  it("displays both system options", () => {
    render(<SystemSelector {...defaultProps} />);

    expect(screen.getByRole("option", { name: "5-1" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "6-2" })).toBeInTheDocument();
  });

  it("calls onSystemChange when selection changes", () => {
    const onSystemChange = vi.fn();
    render(
      <SystemSelector {...defaultProps} onSystemChange={onSystemChange} />
    );

    const selector = screen.getByTestId("system-selector");
    fireEvent.change(selector, { target: { value: "6-2" } });

    expect(onSystemChange).toHaveBeenCalledWith("6-2");
  });

  it("is disabled when isReadOnly is true", () => {
    render(<SystemSelector {...defaultProps} isReadOnly={true} />);

    const selector = screen.getByTestId("system-selector");
    expect(selector).toBeDisabled();
    expect(selector).toHaveClass("opacity-50", "cursor-not-allowed");
  });

  it("shows correct title when disabled", () => {
    render(<SystemSelector {...defaultProps} isReadOnly={true} />);

    const selector = screen.getByTestId("system-selector");
    expect(selector).toHaveAttribute("title", "Disabled in read-only mode");
  });

  it("shows correct title when enabled", () => {
    render(<SystemSelector {...defaultProps} />);

    const selector = screen.getByTestId("system-selector");
    expect(selector).toHaveAttribute("title", "Select volleyball system");
  });

  it("applies custom className", () => {
    render(<SystemSelector {...defaultProps} className="custom-class" />);

    const selector = screen.getByTestId("system-selector");
    expect(selector).toHaveClass("custom-class");
  });

  it("renders with 6-2 system selected", () => {
    render(<SystemSelector {...defaultProps} system="6-2" />);

    const selector = screen.getByTestId("system-selector");
    expect(selector).toHaveValue("6-2");
  });
});
