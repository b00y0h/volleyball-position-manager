/**
 * Tests for RotationControls component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RotationControls } from "../controls/RotationControls";

describe("RotationControls", () => {
  const defaultProps = {
    rotationIndex: 0,
    onRotationChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders prev and next buttons", () => {
    render(<RotationControls {...defaultProps} />);

    expect(screen.getByTestId("prev-rotation-button")).toBeInTheDocument();
    expect(screen.getByTestId("next-rotation-button")).toBeInTheDocument();
  });

  it("renders rotation indicators by default", () => {
    render(<RotationControls {...defaultProps} />);

    for (let i = 0; i < 6; i++) {
      expect(screen.getByTestId(`rotation-indicator-${i}`)).toBeInTheDocument();
    }
  });

  it("hides rotation indicators when showRotationIndicators is false", () => {
    render(
      <RotationControls {...defaultProps} showRotationIndicators={false} />
    );

    expect(
      screen.queryByTestId("rotation-indicator-0")
    ).not.toBeInTheDocument();
  });

  it("calls onRotationChange with next rotation when next button clicked", () => {
    const onRotationChange = vi.fn();
    render(
      <RotationControls
        {...defaultProps}
        rotationIndex={2}
        onRotationChange={onRotationChange}
      />
    );

    fireEvent.click(screen.getByTestId("next-rotation-button"));
    expect(onRotationChange).toHaveBeenCalledWith(3);
  });

  it("wraps to rotation 0 when next is clicked on rotation 5", () => {
    const onRotationChange = vi.fn();
    render(
      <RotationControls
        {...defaultProps}
        rotationIndex={5}
        onRotationChange={onRotationChange}
      />
    );

    fireEvent.click(screen.getByTestId("next-rotation-button"));
    expect(onRotationChange).toHaveBeenCalledWith(0);
  });

  it("calls onRotationChange with previous rotation when prev button clicked", () => {
    const onRotationChange = vi.fn();
    render(
      <RotationControls
        {...defaultProps}
        rotationIndex={2}
        onRotationChange={onRotationChange}
      />
    );

    fireEvent.click(screen.getByTestId("prev-rotation-button"));
    expect(onRotationChange).toHaveBeenCalledWith(1);
  });

  it("wraps to rotation 5 when prev is clicked on rotation 0", () => {
    const onRotationChange = vi.fn();
    render(
      <RotationControls
        {...defaultProps}
        rotationIndex={0}
        onRotationChange={onRotationChange}
      />
    );

    fireEvent.click(screen.getByTestId("prev-rotation-button"));
    expect(onRotationChange).toHaveBeenCalledWith(5);
  });

  it("calls onRotationChange when rotation indicator is clicked", () => {
    const onRotationChange = vi.fn();
    render(
      <RotationControls {...defaultProps} onRotationChange={onRotationChange} />
    );

    fireEvent.click(screen.getByTestId("rotation-indicator-3"));
    expect(onRotationChange).toHaveBeenCalledWith(3);
  });

  it("highlights current rotation indicator", () => {
    render(<RotationControls {...defaultProps} rotationIndex={2} />);

    const currentIndicator = screen.getByTestId("rotation-indicator-2");
    expect(currentIndicator).toHaveClass(
      "bg-blue-500",
      "text-white",
      "border-blue-600"
    );
  });

  it("shows customized rotation indicators", () => {
    const isRotationCustomized = (rotation: number) =>
      rotation === 1 || rotation === 3;
    render(
      <RotationControls
        {...defaultProps}
        rotationIndex={2}
        isRotationCustomized={isRotationCustomized}
      />
    );

    const customizedIndicator1 = screen.getByTestId("rotation-indicator-1");
    const customizedIndicator3 = screen.getByTestId("rotation-indicator-3");
    const normalIndicator = screen.getByTestId("rotation-indicator-0");

    expect(customizedIndicator1).toHaveClass("bg-green-100", "text-green-700");
    expect(customizedIndicator3).toHaveClass("bg-green-100", "text-green-700");
    expect(normalIndicator).toHaveClass("bg-white", "text-gray-600");
  });

  it("disables controls when isAnimating is true", () => {
    render(<RotationControls {...defaultProps} isAnimating={true} />);

    expect(screen.getByTestId("prev-rotation-button")).toBeDisabled();
    expect(screen.getByTestId("next-rotation-button")).toBeDisabled();

    for (let i = 0; i < 6; i++) {
      expect(screen.getByTestId(`rotation-indicator-${i}`)).toBeDisabled();
    }
  });

  it("disables controls when isReadOnly is true", () => {
    render(<RotationControls {...defaultProps} isReadOnly={true} />);

    expect(screen.getByTestId("prev-rotation-button")).toBeDisabled();
    expect(screen.getByTestId("next-rotation-button")).toBeDisabled();

    for (let i = 0; i < 6; i++) {
      expect(screen.getByTestId(`rotation-indicator-${i}`)).toBeDisabled();
    }
  });

  it("shows correct titles for rotation indicators", () => {
    const isRotationCustomized = (rotation: number) => rotation === 1;
    render(
      <RotationControls
        {...defaultProps}
        isRotationCustomized={isRotationCustomized}
      />
    );

    const customizedIndicator = screen.getByTestId("rotation-indicator-1");
    const normalIndicator = screen.getByTestId("rotation-indicator-0");

    expect(customizedIndicator).toHaveAttribute(
      "title",
      "Rotation 2 (Custom positions)"
    );
    expect(normalIndicator).toHaveAttribute("title", "Rotation 1");
  });

  it("applies custom className", () => {
    const { container } = render(
      <RotationControls {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("does not call onRotationChange when disabled", () => {
    const onRotationChange = vi.fn();
    render(
      <RotationControls
        {...defaultProps}
        onRotationChange={onRotationChange}
        isAnimating={true}
      />
    );

    fireEvent.click(screen.getByTestId("next-rotation-button"));
    fireEvent.click(screen.getByTestId("prev-rotation-button"));
    fireEvent.click(screen.getByTestId("rotation-indicator-3"));

    expect(onRotationChange).not.toHaveBeenCalled();
  });
});
