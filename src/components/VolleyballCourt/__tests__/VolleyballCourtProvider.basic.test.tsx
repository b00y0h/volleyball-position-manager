import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  VolleyballCourtProvider,
  useVolleyballCourt,
} from "../VolleyballCourtProvider";

// Mock the enhanced position manager
vi.mock("@/hooks/useEnhancedPositionManager", () => ({
  useEnhancedPositionManager: () => ({
    getFormationPositions: vi.fn(() => ({
      S: { x: 100, y: 100, isCustom: false, lastModified: new Date() },
      Opp: { x: 200, y: 200, isCustom: false, lastModified: new Date() },
    })),
    validateCurrentFormation: vi.fn(() => ({
      isValid: true,
      violations: [],
    })),
    isLoading: false,
    error: null,
  }),
}));

// Simple test component
const TestComponent: React.FC = () => {
  const { state, config } = useVolleyballCourt();

  return (
    <div>
      <div data-testid="system">{state.system}</div>
      <div data-testid="formation">{state.formation}</div>
      <div data-testid="config-system">{config.initialSystem}</div>
    </div>
  );
};

describe("VolleyballCourtProvider - Basic Tests", () => {
  it("should provide default state", () => {
    render(
      <VolleyballCourtProvider>
        <TestComponent />
      </VolleyballCourtProvider>
    );

    expect(screen.getByTestId("system")).toHaveTextContent("5-1");
    expect(screen.getByTestId("formation")).toHaveTextContent("base");
    expect(screen.getByTestId("config-system")).toHaveTextContent("5-1");
  });

  it("should throw error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow(
      "useVolleyballCourt must be used within a VolleyballCourtProvider"
    );

    consoleSpy.mockRestore();
  });
});
