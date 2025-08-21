/**
 * Tests for ControlsLayer component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ControlsLayer } from "../ControlsLayer";
import { ControlsLayerProps } from "../types";

// Mock the ResetButton component since it's complex
vi.mock("@/components/ResetButton", () => ({
  ResetButton: ({ onResetCurrentRotation, onResetAllRotations }: any) => (
    <div data-testid="reset-button">
      <button onClick={onResetCurrentRotation}>Reset Current</button>
      <button onClick={onResetAllRotations}>Reset All</button>
    </div>
  ),
}));

describe("ControlsLayer", () => {
  const defaultProps: ControlsLayerProps = {
    system: "5-1",
    rotationIndex: 0,
    formation: "rotational",
    isAnimating: false,
    isReadOnly: false,
    controlsConfig: {},
    onSystemChange: vi.fn(),
    onRotationChange: vi.fn(),
    onFormationChange: vi.fn(),
    onReset: vi.fn(),
    onShare: vi.fn(),
    onAnimate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all controls by default", () => {
    render(<ControlsLayer {...defaultProps} />);

    expect(screen.getByTestId("system-selector")).toBeInTheDocument();
    expect(screen.getByTestId("prev-rotation-button")).toBeInTheDocument();
    expect(screen.getByTestId("next-rotation-button")).toBeInTheDocument();
    expect(screen.getByTestId("formation-selector")).toBeInTheDocument();
    expect(screen.getByTestId("share-button")).toBeInTheDocument();
    expect(screen.getByTestId("animation-button")).toBeInTheDocument();
    expect(screen.getByTestId("reset-button")).toBeInTheDocument();
  });

  it("hides controls based on configuration", () => {
    const controlsConfig = {
      showSystemSelector: false,
      showRotationControls: false,
      showFormationSelector: false,
      showResetButton: false,
      showShareButton: false,
      showAnimateButton: false,
    };

    render(<ControlsLayer {...defaultProps} controlsConfig={controlsConfig} />);

    expect(screen.queryByTestId("system-selector")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("prev-rotation-button")
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("formation-selector")).not.toBeInTheDocument();
    expect(screen.queryByTestId("share-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("animation-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("reset-button")).not.toBeInTheDocument();
  });

  it("shows read-only indicator when in read-only mode", () => {
    render(<ControlsLayer {...defaultProps} isReadOnly={true} />);

    expect(screen.getByText("Read-Only")).toBeInTheDocument();
  });

  it("hides reset button in read-only mode", () => {
    render(<ControlsLayer {...defaultProps} isReadOnly={true} />);

    expect(screen.queryByTestId("reset-button")).not.toBeInTheDocument();
  });

  it("calls onSystemChange when system is changed", () => {
    const onSystemChange = vi.fn();
    render(<ControlsLayer {...defaultProps} onSystemChange={onSystemChange} />);

    const systemSelector = screen.getByTestId("system-selector");
    fireEvent.change(systemSelector, { target: { value: "6-2" } });

    expect(onSystemChange).toHaveBeenCalledWith("6-2");
  });

  it("calls onRotationChange when rotation buttons are clicked", () => {
    const onRotationChange = vi.fn();
    render(
      <ControlsLayer {...defaultProps} onRotationChange={onRotationChange} />
    );

    fireEvent.click(screen.getByTestId("next-rotation-button"));
    expect(onRotationChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByTestId("prev-rotation-button"));
    expect(onRotationChange).toHaveBeenCalledWith(5);
  });

  it("calls onFormationChange when formation is changed", () => {
    const onFormationChange = vi.fn();
    render(
      <ControlsLayer {...defaultProps} onFormationChange={onFormationChange} />
    );

    const formationSelector = screen.getByTestId("formation-selector");
    fireEvent.change(formationSelector, { target: { value: "serveReceive" } });

    expect(onFormationChange).toHaveBeenCalledWith("serveReceive");
  });

  it("calls onShare when share button is clicked", () => {
    const onShare = vi.fn();
    render(<ControlsLayer {...defaultProps} onShare={onShare} />);

    fireEvent.click(screen.getByTestId("share-button"));
    expect(onShare).toHaveBeenCalled();
  });

  it("calls onAnimate when animation button is clicked", () => {
    const onAnimate = vi.fn();
    render(<ControlsLayer {...defaultProps} onAnimate={onAnimate} />);

    fireEvent.click(screen.getByTestId("animation-button"));
    expect(onAnimate).toHaveBeenCalled();
  });

  it("calls onReset when reset buttons are clicked", () => {
    const onReset = vi.fn();
    render(<ControlsLayer {...defaultProps} onReset={onReset} />);

    fireEvent.click(screen.getByText("Reset Current"));
    expect(onReset).toHaveBeenCalledWith("current");

    fireEvent.click(screen.getByText("Reset All"));
    expect(onReset).toHaveBeenCalledWith("all");
  });

  it("disables controls when animating", () => {
    render(<ControlsLayer {...defaultProps} isAnimating={true} />);

    const prevButton = screen.getByTestId("prev-rotation-button");
    const nextButton = screen.getByTestId("next-rotation-button");
    const animationButton = screen.getByTestId("animation-button");

    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
    expect(animationButton).toBeDisabled();
  });

  it("disables controls when in read-only mode", () => {
    render(<ControlsLayer {...defaultProps} isReadOnly={true} />);

    const systemSelector = screen.getByTestId("system-selector");
    const prevButton = screen.getByTestId("prev-rotation-button");
    const nextButton = screen.getByTestId("next-rotation-button");
    const formationSelector = screen.getByTestId("formation-selector");
    const animationButton = screen.getByTestId("animation-button");

    expect(systemSelector).toBeDisabled();
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
    expect(formationSelector).toBeDisabled();
    expect(animationButton).toBeDisabled();
  });

  it("displays correct title", () => {
    render(<ControlsLayer {...defaultProps} />);

    expect(
      screen.getByText("Volleyball Rotations Visualizer")
    ).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ControlsLayer
        {...defaultProps}
        controlsConfig={{ showSystemSelector: true }}
      />
    );

    expect(container.firstChild).toHaveClass("volleyball-court-controls");
  });
});
