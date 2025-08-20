/**
 * Tests for FormationSelector component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FormationSelector } from "../controls/FormationSelector";

describe("FormationSelector", () => {
  const defaultProps = {
    formation: "rotational" as const,
    onFormationChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with correct initial value", () => {
    render(<FormationSelector {...defaultProps} />);

    const selector = screen.getByTestId("formation-selector");
    expect(selector).toHaveValue("rotational");
  });

  it("displays all formation options", () => {
    render(<FormationSelector {...defaultProps} />);

    expect(
      screen.getByRole("option", { name: "Rotational Position" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Serve/Receive" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Base (Attack)" })
    ).toBeInTheDocument();
  });

  it("calls onFormationChange when selection changes", () => {
    const onFormationChange = vi.fn();
    render(
      <FormationSelector
        {...defaultProps}
        onFormationChange={onFormationChange}
      />
    );

    const selector = screen.getByTestId("formation-selector");
    fireEvent.change(selector, { target: { value: "serveReceive" } });

    expect(onFormationChange).toHaveBeenCalledWith("serveReceive");
  });

  it("is disabled when isReadOnly is true", () => {
    render(<FormationSelector {...defaultProps} isReadOnly={true} />);

    const selector = screen.getByTestId("formation-selector");
    expect(selector).toBeDisabled();
    expect(selector).toHaveClass("opacity-50", "cursor-not-allowed");
  });

  it("shows correct title when disabled", () => {
    render(<FormationSelector {...defaultProps} isReadOnly={true} />);

    const selector = screen.getByTestId("formation-selector");
    expect(selector).toHaveAttribute("title", "Disabled in read-only mode");
  });

  it("shows correct title when enabled", () => {
    render(<FormationSelector {...defaultProps} />);

    const selector = screen.getByTestId("formation-selector");
    expect(selector).toHaveAttribute("title", "Select formation type");
  });

  it("shows customization indicator when formation is customized", () => {
    const isFormationCustomized = (formation: string) =>
      formation === "rotational";
    render(
      <FormationSelector
        {...defaultProps}
        isFormationCustomized={isFormationCustomized}
      />
    );

    // Check for the visual indicator dot
    const indicator = document.querySelector(".bg-green-500");
    expect(indicator).toBeInTheDocument();
  });

  it("shows customization text in option labels", () => {
    const isFormationCustomized = (formation: string) =>
      formation === "rotational";
    render(
      <FormationSelector
        {...defaultProps}
        isFormationCustomized={isFormationCustomized}
      />
    );

    expect(
      screen.getByRole("option", { name: "Rotational Position ●" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Serve/Receive" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Base (Attack)" })
    ).toBeInTheDocument();
  });

  it("hides customization indicator when showCustomizationIndicator is false", () => {
    const isFormationCustomized = (formation: string) =>
      formation === "rotational";
    render(
      <FormationSelector
        {...defaultProps}
        isFormationCustomized={isFormationCustomized}
        showCustomizationIndicator={false}
      />
    );

    // Check that the visual indicator dot is not present
    const indicator = document.querySelector(".bg-green-500");
    expect(indicator).not.toBeInTheDocument();

    // Check that the text indicator is not in option labels
    expect(
      screen.getByRole("option", { name: "Rotational Position" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Rotational Position ●" })
    ).not.toBeInTheDocument();
  });

  it("shows customization help text by default", () => {
    render(<FormationSelector {...defaultProps} />);

    expect(
      screen.getByText("(● indicates custom positions)")
    ).toBeInTheDocument();
  });

  it("hides customization help text when showCustomizationIndicator is false", () => {
    render(
      <FormationSelector {...defaultProps} showCustomizationIndicator={false} />
    );

    expect(
      screen.queryByText("(● indicates custom positions)")
    ).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <FormationSelector {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders with different formation selected", () => {
    render(<FormationSelector {...defaultProps} formation="serveReceive" />);

    const selector = screen.getByTestId("formation-selector");
    expect(selector).toHaveValue("serveReceive");
  });

  it("renders label text", () => {
    render(<FormationSelector {...defaultProps} />);

    expect(screen.getByText("Show formation:")).toBeInTheDocument();
  });
});
