/**
 * Tests for ShareButton component
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShareButton } from "../controls/ShareButton";

describe("ShareButton", () => {
  const defaultProps = {
    onShare: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default text", () => {
    render(<ShareButton {...defaultProps} />);

    expect(screen.getByTestId("share-button")).toBeInTheDocument();
    expect(screen.getByText("Share")).toBeInTheDocument();
  });

  it("calls onShare when clicked", () => {
    const onShare = vi.fn();
    render(<ShareButton {...defaultProps} onShare={onShare} />);

    fireEvent.click(screen.getByTestId("share-button"));
    expect(onShare).toHaveBeenCalled();
  });

  it("is disabled when isAnimating is true", () => {
    render(<ShareButton {...defaultProps} isAnimating={true} />);

    const button = screen.getByTestId("share-button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("opacity-50", "cursor-not-allowed");
  });

  it("shows correct title when animating", () => {
    render(<ShareButton {...defaultProps} isAnimating={true} />);

    const button = screen.getByTestId("share-button");
    expect(button).toHaveAttribute(
      "title",
      "Please wait for animation to complete"
    );
  });

  it("shows correct title when not animating", () => {
    render(<ShareButton {...defaultProps} />);

    const button = screen.getByTestId("share-button");
    expect(button).toHaveAttribute("title", "Share current configuration");
  });

  it("shows sharing state during async operation", async () => {
    const onShare = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
    render(<ShareButton {...defaultProps} onShare={onShare} />);

    const button = screen.getByTestId("share-button");
    fireEvent.click(button);

    // Should show sharing state immediately
    expect(screen.getByText("Sharing...")).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "Generating share URL...");

    // Wait for async operation to complete
    await waitFor(() => {
      expect(screen.getByText("Share")).toBeInTheDocument();
    });

    expect(button).not.toBeDisabled();
  });

  it("handles share errors gracefully", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const onShare = vi.fn().mockRejectedValue(new Error("Share failed"));
    render(<ShareButton {...defaultProps} onShare={onShare} />);

    const button = screen.getByTestId("share-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Share")).toBeInTheDocument();
    });

    expect(consoleError).toHaveBeenCalledWith(
      "Share failed:",
      expect.any(Error)
    );
    expect(button).not.toBeDisabled();

    consoleError.mockRestore();
  });

  it("applies primary variant styles by default", () => {
    render(<ShareButton {...defaultProps} />);

    const button = screen.getByTestId("share-button");
    expect(button).toHaveClass(
      "bg-green-600",
      "text-white",
      "hover:bg-green-700"
    );
  });

  it("applies secondary variant styles", () => {
    render(<ShareButton {...defaultProps} variant="secondary" />);

    const button = screen.getByTestId("share-button");
    expect(button).toHaveClass("bg-gray-200", "text-gray-900");
  });

  it("applies different size classes", () => {
    const { rerender } = render(<ShareButton {...defaultProps} size="sm" />);
    let button = screen.getByTestId("share-button");
    expect(button).toHaveClass("px-2", "py-1", "text-sm");

    rerender(<ShareButton {...defaultProps} size="md" />);
    button = screen.getByTestId("share-button");
    expect(button).toHaveClass("px-3", "py-1");

    rerender(<ShareButton {...defaultProps} size="lg" />);
    button = screen.getByTestId("share-button");
    expect(button).toHaveClass("px-4", "py-2", "text-lg");
  });

  it("applies custom className", () => {
    render(<ShareButton {...defaultProps} className="custom-class" />);

    const button = screen.getByTestId("share-button");
    expect(button).toHaveClass("custom-class");
  });

  it("prevents multiple simultaneous share operations", async () => {
    const onShare = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
    render(<ShareButton {...defaultProps} onShare={onShare} />);

    const button = screen.getByTestId("share-button");

    // Click multiple times rapidly
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    // Should only call onShare once
    expect(onShare).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText("Share")).toBeInTheDocument();
    });
  });

  it("shows share icon", () => {
    render(<ShareButton {...defaultProps} />);

    // Check for SVG icon (share icon has specific path)
    const shareIcon = document.querySelector(
      'path[d*="M8.684 13.342C8.886 12.938"]'
    );
    expect(shareIcon).toBeInTheDocument();
  });

  it("shows loading spinner when sharing", async () => {
    const onShare = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
    render(<ShareButton {...defaultProps} onShare={onShare} />);

    fireEvent.click(screen.getByTestId("share-button"));

    // Check for loading spinner (has animate-spin class)
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Share")).toBeInTheDocument();
    });
  });
});
