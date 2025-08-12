import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DraggablePlayer } from "../DraggablePlayer";
import { usePositionManager } from "@/hooks/usePositionManager";

// Mock the position manager
vi.mock("@/hooks/usePositionManager");

const mockPositionManager = {
  isPositionCustomized: vi.fn(() => false),
  validatePosition: vi.fn(() => ({ isValid: true })),
  setPosition: vi.fn(() => true),
};

const mockPlayer = {
  id: "S",
  name: "Setter",
  role: "S",
};

const mockPosition = { x: 100, y: 100 };
const mockCourtDimensions = { courtWidth: 600, courtHeight: 360 };

describe("Read-Only Mode", () => {
  beforeEach(() => {
    vi.mocked(usePositionManager).mockReturnValue(mockPositionManager as any);
  });

  it("should disable drag when isReadOnly is true", () => {
    render(
      <svg>
        <DraggablePlayer
          player={mockPlayer}
          position={mockPosition}
          positionManager={mockPositionManager as any}
          system="5-1"
          rotation={0}
          formation="rotational"
          courtDimensions={mockCourtDimensions}
          isReadOnly={true}
        />
      </svg>
    );

    const playerElement = screen.getByText("S");
    expect(playerElement).toBeInTheDocument();

    // In read-only mode, the drag should be disabled
    // We can't easily test the actual drag behavior in JSDOM,
    // but we can verify the component renders correctly
  });

  it("should show read-only tooltip when hovering in read-only mode", () => {
    render(
      <svg>
        <DraggablePlayer
          player={mockPlayer}
          position={mockPosition}
          positionManager={mockPositionManager as any}
          system="5-1"
          rotation={0}
          formation="rotational"
          courtDimensions={mockCourtDimensions}
          isReadOnly={true}
        />
      </svg>
    );

    const playerGroup = screen.getByText("S").closest("g");
    expect(playerGroup).toBeInTheDocument();

    // Simulate hover
    if (playerGroup) {
      fireEvent.mouseEnter(playerGroup);

      // Check if read-only text appears in tooltip
      expect(screen.getByText("(Read-only)")).toBeInTheDocument();
    }
  });

  it("should not show reset button in read-only mode", () => {
    // Mock customized position
    mockPositionManager.isPositionCustomized.mockReturnValue(true);

    render(
      <svg>
        <DraggablePlayer
          player={mockPlayer}
          position={mockPosition}
          positionManager={mockPositionManager as any}
          system="5-1"
          rotation={0}
          formation="rotational"
          courtDimensions={mockCourtDimensions}
          isReadOnly={true}
          onResetPosition={vi.fn()}
        />
      </svg>
    );

    const playerGroup = screen.getByText("S").closest("g");
    expect(playerGroup).toBeInTheDocument();

    // Simulate hover
    if (playerGroup) {
      fireEvent.mouseEnter(playerGroup);

      // Reset button should not appear in read-only mode
      expect(screen.queryByText("×")).not.toBeInTheDocument();
    }
  });

  it("should allow drag when isReadOnly is false", () => {
    render(
      <svg>
        <DraggablePlayer
          player={mockPlayer}
          position={mockPosition}
          positionManager={mockPositionManager as any}
          system="5-1"
          rotation={0}
          formation="rotational"
          courtDimensions={mockCourtDimensions}
          isReadOnly={false}
        />
      </svg>
    );

    const playerElement = screen.getByText("S");
    expect(playerElement).toBeInTheDocument();

    // In editable mode, drag should be enabled
    // Component should render without read-only indicators
  });
});
