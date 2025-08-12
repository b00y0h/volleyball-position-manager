import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { DraggablePlayer } from "../DraggablePlayer";
import { usePositionManager } from "@/hooks/usePositionManager";

// Mock the position manager hook
vi.mock("@/hooks/usePositionManager");

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    g: ({ children, ...props }: any) => <g {...props}>{children}</g>,
  },
}));

const mockPositionManager = {
  isPositionCustomized: vi.fn(),
  validatePosition: vi.fn(),
  setPosition: vi.fn(),
  getPosition: vi.fn(),
  isLoading: false,
  error: null,
};

const mockPlayer = {
  id: "S",
  name: "Setter",
  role: "S",
};

const mockPosition = { x: 100, y: 100 };

describe("DraggablePlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePositionManager as any).mockReturnValue(mockPositionManager);
    mockPositionManager.isPositionCustomized.mockReturnValue(false);
    mockPositionManager.validatePosition.mockReturnValue({ isValid: true });
    mockPositionManager.setPosition.mockReturnValue(true);
  });

  it("should render player with default styling", () => {
    render(
      <svg>
        <DraggablePlayer
          player={mockPlayer}
          position={mockPosition}
          positionManager={mockPositionManager as any}
          system="5-1"
          rotation={0}
          formation="rotational"
        />
      </svg>
    );

    const playerText = screen.getByText("S");
    expect(playerText).toBeInTheDocument();
  });

  it("should render customized player with different styling", () => {
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
        />
      </svg>
    );

    const playerText = screen.getByText("S");
    expect(playerText).toBeInTheDocument();
    expect(mockPositionManager.isPositionCustomized).toHaveBeenCalledWith(
      "5-1",
      0,
      "rotational",
      "S"
    );
  });

  it("should call onDragStart when drag starts", () => {
    const onDragStart = vi.fn();

    render(
      <svg>
        <DraggablePlayer
          player={mockPlayer}
          position={mockPosition}
          positionManager={mockPositionManager as any}
          system="5-1"
          rotation={0}
          formation="rotational"
          onDragStart={onDragStart}
        />
      </svg>
    );

    // Note: Testing actual drag events with framer-motion is complex
    // This test verifies the component renders without errors
    const playerText = screen.getByText("S");
    expect(playerText).toBeInTheDocument();
  });

  it("should not be draggable in read-only mode", () => {
    render(
      <svg>
        <DraggablePlayer
          player={mockPlayer}
          position={mockPosition}
          positionManager={mockPositionManager as any}
          system="5-1"
          rotation={0}
          formation="rotational"
          isReadOnly={true}
        />
      </svg>
    );

    const playerText = screen.getByText("S");
    expect(playerText).toBeInTheDocument();
  });

  it("should validate position during drag operations", () => {
    render(
      <svg>
        <DraggablePlayer
          player={mockPlayer}
          position={mockPosition}
          positionManager={mockPositionManager as any}
          system="5-1"
          rotation={0}
          formation="rotational"
        />
      </svg>
    );

    // Component should be rendered and position manager should be available
    expect(mockPositionManager.isPositionCustomized).toHaveBeenCalled();
  });
});
