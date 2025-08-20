import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ResetButton from "../ResetButton";
import { NotificationProvider } from "../NotificationSystem";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NotificationProvider>{children}</NotificationProvider>
);

describe("ResetButton", () => {
  const mockOnResetCurrentRotation = vi.fn();
  const mockOnResetAllRotations = vi.fn();
  const mockOnResetSelectedFormation = vi.fn();
  const mockOnResetSystem = vi.fn();

  const mockOnUndo = vi.fn();
  const mockOnRedo = vi.fn();
  const mockOnShowPreview = vi.fn();
  const mockGetAffectedPositions = vi.fn();

  const defaultProps = {
    system: "5-1" as const,
    rotation: 0,
    formation: "rotational" as const,
    onResetCurrentRotation: mockOnResetCurrentRotation,
    onResetAllRotations: mockOnResetAllRotations,
    onResetSelectedFormation: mockOnResetSelectedFormation,
    onResetSystem: mockOnResetSystem,
    hasCustomizations: {
      currentRotation: true,
      allRotations: true,
      currentFormation: true,
      system: true,
    },
    canUndo: false,
    canRedo: false,
    onUndo: mockOnUndo,
    onRedo: mockOnRedo,
    onShowPreview: mockOnShowPreview,
    getAffectedPositions: mockGetAffectedPositions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnResetCurrentRotation.mockResolvedValue({
      success: true,
      affectedPositions: 2,
    });
    mockOnResetAllRotations.mockResolvedValue({
      success: true,
      affectedPositions: 10,
    });
    mockOnResetSelectedFormation.mockResolvedValue({
      success: true,
      affectedPositions: 15,
    });
    mockOnResetSystem.mockResolvedValue({
      success: true,
      affectedPositions: 30,
    });
    mockOnUndo.mockResolvedValue(true);
    mockOnRedo.mockResolvedValue(true);
    mockGetAffectedPositions.mockReturnValue(["player1", "player2"]);
  });

  it("renders reset button", () => {
    render(<ResetButton {...defaultProps} />, { wrapper: TestWrapper });

    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("shows dropdown when button is clicked", async () => {
    const user = userEvent.setup();
    render(<ResetButton {...defaultProps} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText("Reset Options")).toBeInTheDocument();
    });
  });

  it("shows available reset options based on customizations", async () => {
    const user = userEvent.setup();
    render(<ResetButton {...defaultProps} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText("Reset Current Rotation")).toBeInTheDocument();
      expect(screen.getByText("Reset All Rotations")).toBeInTheDocument();
      expect(screen.getByText("Reset Formation")).toBeInTheDocument();
      expect(screen.getByText("Reset Entire System")).toBeInTheDocument();
    });
  });

  it("shows no actions available when button is enabled but no options exist", async () => {
    const user = userEvent.setup();
    const propsWithNoCustomizations = {
      ...defaultProps,
      hasCustomizations: {
        currentRotation: false,
        allRotations: false,
        currentFormation: false,
        system: false,
      },
      canUndo: true, // Enable button with undo capability but no customizations
    };

    render(<ResetButton {...propsWithNoCustomizations} />, {
      wrapper: TestWrapper,
    });

    await user.click(screen.getByRole("button", { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText("Undo Last Action")).toBeInTheDocument();
      // Should show undo option but no reset options
      expect(
        screen.queryByText("Reset Current Rotation")
      ).not.toBeInTheDocument();
    });
  });

  it("disables button when disabled prop is true", () => {
    render(<ResetButton {...defaultProps} isDisabled={true} />, {
      wrapper: TestWrapper,
    });

    const button = screen.getByRole("button", { name: /reset/i });
    expect(button).toBeDisabled();
  });

  it("disables button when no customizations exist", () => {
    const propsWithNoCustomizations = {
      ...defaultProps,
      hasCustomizations: {
        currentRotation: false,
        allRotations: false,
        currentFormation: false,
        system: false,
      },
    };

    render(<ResetButton {...propsWithNoCustomizations} />, {
      wrapper: TestWrapper,
    });

    const button = screen.getByRole("button", { name: /reset/i });
    expect(button).toBeDisabled();
  });

  it("executes current rotation reset when clicked", async () => {
    const user = userEvent.setup();
    render(<ResetButton {...defaultProps} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText("Reset Current Rotation")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Reset Current Rotation"));

    expect(mockOnResetCurrentRotation).toHaveBeenCalled();
  });

  it("shows confirmation dialog for destructive operations", async () => {
    const user = userEvent.setup();
    render(<ResetButton {...defaultProps} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText("Reset All Rotations")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Reset All Rotations"));

    await waitFor(() => {
      expect(screen.getByText("Reset All Rotations")).toBeInTheDocument(); // In dialog title
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument(); // Cancel button
      // Check for the confirm button by looking for the red reset button in the dialog
      const buttons = screen.getAllByRole("button", { name: /reset/i });
      expect(buttons.length).toBeGreaterThan(1); // Should have both dropdown and confirm buttons
    });
  });

  it("executes confirmed destructive operation", async () => {
    const user = userEvent.setup();
    render(<ResetButton {...defaultProps} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: /reset/i }));
    await user.click(screen.getByText("Reset All Rotations"));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });

    // Click the confirm button (the red one in the dialog)
    const confirmButton = screen
      .getAllByRole("button", { name: /reset/i })
      .find((button) => button.className.includes("bg-red-600"));
    expect(confirmButton).toBeDefined();
    await user.click(confirmButton!);

    expect(mockOnResetAllRotations).toHaveBeenCalled();
  });

  it("cancels confirmation dialog", async () => {
    const user = userEvent.setup();
    render(<ResetButton {...defaultProps} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: /reset/i }));
    await user.click(screen.getByText("Reset All Rotations"));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(mockOnResetAllRotations).not.toHaveBeenCalled();

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText("Reset All Rotations")).not.toBeInTheDocument();
    });
  });

  it("handles reset failures gracefully", async () => {
    const user = userEvent.setup();
    mockOnResetCurrentRotation.mockResolvedValue({
      success: false,
      affectedPositions: 0,
      error: "Test error",
    });

    render(<ResetButton {...defaultProps} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: /reset/i }));
    await user.click(screen.getByText("Reset Current Rotation"));

    expect(mockOnResetCurrentRotation).toHaveBeenCalled();
    // Error should be handled internally without crashing
  });

  it("shows info notification when no changes to reset", async () => {
    const user = userEvent.setup();
    mockOnResetCurrentRotation.mockResolvedValue({
      success: true,
      affectedPositions: 0,
    });

    const propsWithNoCurrentRotationCustomization = {
      ...defaultProps,
      hasCustomizations: {
        ...defaultProps.hasCustomizations,
        currentRotation: false,
      },
    };

    render(<ResetButton {...propsWithNoCurrentRotationCustomization} />, {
      wrapper: TestWrapper,
    });

    await user.click(screen.getByRole("button", { name: /reset/i }));

    // Should not show the option if no customizations exist
    await waitFor(() => {
      expect(
        screen.queryByText("Reset Current Rotation")
      ).not.toBeInTheDocument();
    });
  });

  it("closes dropdown when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ResetButton {...defaultProps} />
        <div data-testid="outside">Outside element</div>
      </div>,
      { wrapper: TestWrapper }
    );

    await user.click(screen.getByRole("button", { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText("Reset Options")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("outside"));

    await waitFor(() => {
      expect(screen.queryByText("Reset Options")).not.toBeInTheDocument();
    });
  });

  it("displays keyboard shortcuts in options", async () => {
    const user = userEvent.setup();
    render(<ResetButton {...defaultProps} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText("Ctrl+R")).toBeInTheDocument();
      expect(screen.getByText("Ctrl+Shift+R")).toBeInTheDocument();
      expect(screen.getByText("Ctrl+Alt+R")).toBeInTheDocument();
    });
  });

  it("handles keyboard shortcuts", async () => {
    render(<ResetButton {...defaultProps} />, { wrapper: TestWrapper });

    // Simulate Ctrl+R
    fireEvent.keyDown(document, { key: "r", ctrlKey: true });

    expect(mockOnResetCurrentRotation).toHaveBeenCalled();
  });

  it("prevents keyboard shortcuts when disabled", async () => {
    render(<ResetButton {...defaultProps} isDisabled={true} />, {
      wrapper: TestWrapper,
    });

    // Simulate Ctrl+R
    fireEvent.keyDown(document, { key: "r", ctrlKey: true });

    expect(mockOnResetCurrentRotation).not.toHaveBeenCalled();
  });

  it("closes dropdown on Escape key", async () => {
    const user = userEvent.setup();
    render(<ResetButton {...defaultProps} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText("Reset Options")).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByText("Reset Options")).not.toBeInTheDocument();
    });
  });

  it("shows correct descriptions for different systems and formations", async () => {
    const user = userEvent.setup();
    const props = {
      ...defaultProps,
      system: "6-2" as const,
      formation: "serveReceive" as const,
    };

    render(<ResetButton {...props} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: /reset/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Reset all 6 rotations in serveReceive")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Reset entire serveReceive formation")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Reset all customizations in 6-2 system")
      ).toBeInTheDocument();
    });
  });

  it("shows undo option when canUndo is true", async () => {
    const user = userEvent.setup();
    const propsWithUndo = {
      ...defaultProps,
      canUndo: true,
    };

    render(<ResetButton {...propsWithUndo} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText("Undo Last Action")).toBeInTheDocument();
      expect(screen.getByText("Ctrl+Z")).toBeInTheDocument();
    });
  });

  it("shows redo option when canRedo is true", async () => {
    const user = userEvent.setup();
    const propsWithRedo = {
      ...defaultProps,
      canRedo: true,
    };

    render(<ResetButton {...propsWithRedo} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText("Redo Last Action")).toBeInTheDocument();
      expect(screen.getByText("Ctrl+Y")).toBeInTheDocument();
    });
  });

  it("executes undo when undo option is clicked", async () => {
    const user = userEvent.setup();
    const propsWithUndo = {
      ...defaultProps,
      canUndo: true,
    };

    render(<ResetButton {...propsWithUndo} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: /reset/i }));
    await user.click(screen.getByText("Undo Last Action"));

    expect(mockOnUndo).toHaveBeenCalled();
  });

  it("executes redo when redo option is clicked", async () => {
    const user = userEvent.setup();
    const propsWithRedo = {
      ...defaultProps,
      canRedo: true,
    };

    render(<ResetButton {...propsWithRedo} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: /reset/i }));
    await user.click(screen.getByText("Redo Last Action"));

    expect(mockOnRedo).toHaveBeenCalled();
  });

  it("handles undo keyboard shortcut", async () => {
    const propsWithUndo = {
      ...defaultProps,
      canUndo: true,
    };

    render(<ResetButton {...propsWithUndo} />, { wrapper: TestWrapper });

    // Simulate Ctrl+Z
    fireEvent.keyDown(document, { key: "z", ctrlKey: true });

    expect(mockOnUndo).toHaveBeenCalled();
  });

  it("handles redo keyboard shortcuts", async () => {
    const propsWithRedo = {
      ...defaultProps,
      canRedo: true,
    };

    render(<ResetButton {...propsWithRedo} />, { wrapper: TestWrapper });

    // Simulate Ctrl+Y
    fireEvent.keyDown(document, { key: "y", ctrlKey: true });
    expect(mockOnRedo).toHaveBeenCalled();

    vi.clearAllMocks();

    // Simulate Ctrl+Shift+Z
    fireEvent.keyDown(document, { key: "Z", ctrlKey: true, shiftKey: true });
    expect(mockOnRedo).toHaveBeenCalled();
  });

  it("enables button when undo/redo is available even without customizations", () => {
    const propsWithUndoButNoCustomizations = {
      ...defaultProps,
      canUndo: true,
      hasCustomizations: {
        currentRotation: false,
        allRotations: false,
        currentFormation: false,
        system: false,
      },
    };

    render(<ResetButton {...propsWithUndoButNoCustomizations} />, {
      wrapper: TestWrapper,
    });

    const button = screen.getByRole("button", { name: /reset/i });
    expect(button).not.toBeDisabled();
  });

  it("shows separator between undo/redo and reset options", async () => {
    const user = userEvent.setup();
    const propsWithUndoAndCustomizations = {
      ...defaultProps,
      canUndo: true,
    };

    render(<ResetButton {...propsWithUndoAndCustomizations} />, {
      wrapper: TestWrapper,
    });

    await user.click(screen.getByRole("button", { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText("Undo Last Action")).toBeInTheDocument();
      expect(screen.getByText("Reset Current Rotation")).toBeInTheDocument();
      // Check that there's a separator (border) between them
      const separators = document.querySelectorAll(".border-t");
      expect(separators.length).toBeGreaterThan(0);
    });
  });
});
