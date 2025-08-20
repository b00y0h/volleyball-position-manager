/**
 * Tests for AnimationControls component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnimationControls } from "../controls/AnimationControls";

describe("AnimationControls", () => {
  const defaultProps = {
    onAnimate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default animation label", () => {
    render(<AnimationControls {...defaultProps} />);

    expect(screen.getByTestId("animation-button")).toBeInTheDocument();
    expect(screen.getByText("Animate SR→Base")).toBeInTheDocument();
  });

  it("renders with custom animation label", () => {
    render(
      <AnimationControls {...defaultProps} animationLabel="Custom Animation" />
    );

    expect(screen.getByText("Custom Animation")).toBeInTheDocument();
  });

  it("calls onAnimate when clicked", () => {
    const onAnimate = vi.fn();
    render(<AnimationControls {...defaultProps} onAnimate={onAnimate} />);

    fireEvent.click(screen.getByTestId("animation-button"));
    expect(onAnimate).toHaveBeenCalled();
  });

  it("is disabled when isAnimating is true", () => {
    render(<AnimationControls {...defaultProps} isAnimating={true} />);

    const button = screen.getByTestId("animation-button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("bg-gray-500", "cursor-not-allowed");
  });

  it("is disabled when isReadOnly is true", () => {
    render(<AnimationControls {...defaultProps} isReadOnly={true} />);

    const button = screen.getByTestId("animation-button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("bg-gray-500", "cursor-not-allowed");
  });

  it("shows 'Animating...' text when isAnimating is true", () => {
    render(<AnimationControls {...defaultProps} isAnimating={true} />);

    expect(screen.getByText("Animating...")).toBeInTheDocument();
  });

  it("shows correct title when animating", () => {
    render(<AnimationControls {...defaultProps} isAnimating={true} />);

    const button = screen.getByTestId("animation-button");
    expect(button).toHaveAttribute("title", "Animation in progress");
  });

  it("shows correct title when in read-only mode", () => {
    render(<AnimationControls {...defaultProps} isReadOnly={true} />);

    const button = screen.getByTestId("animation-button");
    expect(button).toHaveAttribute("title", "Disabled in read-only mode");
  });

  it("shows correct title when enabled", () => {
    render(<AnimationControls {...defaultProps} />);

    const button = screen.getByTestId("animation-button");
    expect(button).toHaveAttribute("title", "Play scripted animation sequence");
  });

  it("applies primary variant styles by default", () => {
    render(<AnimationControls {...defaultProps} />);

    const button = screen.getByTestId("animation-button");
    expect(button).toHaveClass("bg-blue-600", "hover:bg-blue-700");
  });

  it("applies secondary variant styles", () => {
    render(<AnimationControls {...defaultProps} variant="secondary" />);

    const button = screen.getByTestId("animation-button");
    expect(button).toHaveClass("bg-gray-600", "hover:bg-gray-700");
  });

  it("applies custom className", () => {
    render(<AnimationControls {...defaultProps} className="custom-class" />);

    const button = screen.getByTestId("animation-button");
    expect(button).toHaveClass("custom-class");
  });

  it("does not call onAnimate when disabled due to animation", () => {
    const onAnimate = vi.fn();
    render(
      <AnimationControls
        {...defaultProps}
        onAnimate={onAnimate}
        isAnimating={true}
      />
    );

    fireEvent.click(screen.getByTestId("animation-button"));
    expect(onAnimate).not.toHaveBeenCalled();
  });

  it("does not call onAnimate when disabled due to read-only mode", () => {
    const onAnimate = vi.fn();
    render(
      <AnimationControls
        {...defaultProps}
        onAnimate={onAnimate}
        isReadOnly={true}
      />
    );

    fireEvent.click(screen.getByTestId("animation-button"));
    expect(onAnimate).not.toHaveBeenCalled();
  });

  it("has correct base styling classes", () => {
    render(<AnimationControls {...defaultProps} />);

    const button = screen.getByTestId("animation-button");
    expect(button).toHaveClass(
      "px-3",
      "py-1",
      "rounded",
      "text-white",
      "font-medium",
      "transition-colors"
    );
  });
});
