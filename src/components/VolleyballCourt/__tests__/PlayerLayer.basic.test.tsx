/**
 * Basic tests for PlayerLayer component
 */
import React from "react";
import { render } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { PlayerLayer } from "../PlayerLayer";
import { FormationType } from "@/types";

// Mock all dependencies
vi.mock("@/volleyball-rules-engine/VolleyballRulesEngine");
vi.mock("@/volleyball-rules-engine/validation/OptimizedConstraintCalculator");
vi.mock("@/volleyball-rules-engine/utils/StateConverter");
vi.mock("@/hooks/useEnhancedPositionManager");
vi.mock("@/components/EnhancedDraggablePlayer");
vi.mock("@/components/DragGuidelines");
vi.mock("framer-motion", () => ({
  motion: { g: "g" },
  AnimatePresence: ({ children }: any) => children,
}));

describe("PlayerLayer", () => {
  const defaultProps = {
    players: [{ id: "1", name: "Player 1", role: "OH" }],
    positions: {
      "1": { x: 100, y: 200, isCustom: false, lastModified: new Date() },
    },
    rotationMap: { 1: "1" },
    formation: "serve-receive" as FormationType,
    draggedPlayer: null,
    visualGuidelines: { horizontalLines: [], verticalLines: [] },
    readOnly: false,
    courtDimensions: { width: 600, height: 360 },
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    onPositionChange: vi.fn(),
    onResetPosition: vi.fn(),
  };

  it("renders without crashing", () => {
    expect(() => {
      render(
        <svg>
          <PlayerLayer {...defaultProps} />
        </svg>
      );
    }).not.toThrow();
  });

  it("handles empty props gracefully", () => {
    const emptyProps = {
      ...defaultProps,
      players: [],
      positions: {},
    };

    expect(() => {
      render(
        <svg>
          <PlayerLayer {...emptyProps} />
        </svg>
      );
    }).not.toThrow();
  });
});
