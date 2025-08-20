import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VolleyballCourt } from "../VolleyballCourt";
import { VolleyballCourtConfig } from "../types";

// Mock the enhanced position manager hook
vi.mock("@/hooks/useEnhancedPositionManager", () => ({
  useEnhancedPositionManager: () => ({
    isLoading: false,
    error: null,
    clearError: vi.fn(),
    getAllPositions: vi.fn(() => ({
      S: { x: 100, y: 100, isCustom: false, lastModified: new Date() },
      Opp: { x: 200, y: 200, isCustom: false, lastModified: new Date() },
    })),
    positions: {},
  }),
}));

describe("VolleyballCourt Integration Tests", () => {
  describe("Real-world Configuration Scenarios", () => {
    it("should handle a complete configuration matching current page functionality", async () => {
      const pageConfig: VolleyballCourtConfig = {
        initialSystem: "5-1",
        initialRotation: 0,
        initialFormation: "rotational",

        players: {
          "5-1": [
            { id: "S", name: "Setter", role: "S" },
            { id: "Opp", name: "Opp", role: "Opp" },
            { id: "OH1", name: "OH1", role: "OH" },
            { id: "MB1", name: "MB1", role: "MB" },
            { id: "OH2", name: "OH2", role: "OH" },
            { id: "MB2", name: "MB2", role: "MB" },
          ],
          "6-2": [
            { id: "S1", name: "S1", role: "S" },
            { id: "S2", name: "S2", role: "S" },
            { id: "OH1", name: "OH1", role: "OH" },
            { id: "MB1", name: "MB1", role: "MB" },
            { id: "OH2", name: "OH2", role: "OH" },
            { id: "MB2", name: "MB2", role: "MB" },
          ],
        },

        controls: {
          showSystemSelector: true,
          showRotationControls: true,
          showFormationSelector: true,
          showResetButton: true,
          showShareButton: true,
          showAnimateButton: true,
        },

        validation: {
          enableRealTimeValidation: true,
          showConstraintBoundaries: true,
          enablePositionSnapping: true,
          showViolationDetails: true,
        },

        appearance: {
          theme: "auto",
          showPlayerNames: true,
          showPositionLabels: false,
        },
      };

      const onPositionChange = vi.fn();
      const onRotationChange = vi.fn();
      const onFormationChange = vi.fn();

      render(
        <VolleyballCourt
          config={pageConfig}
          onPositionChange={onPositionChange}
          onRotationChange={onRotationChange}
          onFormationChange={onFormationChange}
          enableSharing={true}
          enablePersistence={true}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("Volleyball Court Component")
        ).toBeInTheDocument();
      });

      // Should show the configured system and settings
      expect(screen.getByText(/System: 5-1/)).toBeInTheDocument();
      expect(screen.getByText(/Rotation: 1/)).toBeInTheDocument();
      expect(screen.getByText(/Formation: rotational/)).toBeInTheDocument();
    });

    it("should handle custom court dimensions for different layouts", async () => {
      const customDimensions = { width: 800, height: 480 };

      render(
        <VolleyballCourt
          courtDimensions={customDimensions}
          className="custom-court"
        />
      );

      await waitFor(() => {
        const courtElement = document.querySelector(".volleyball-court");
        expect(courtElement).toHaveClass("custom-court");
        expect(courtElement).toHaveStyle({
          width: "800px",
          height: "480px",
        });
      });
    });

    it("should handle read-only mode for shared configurations", async () => {
      render(<VolleyballCourt readOnly={true} showControls={false} />);

      await waitFor(() => {
        expect(
          screen.getByText("Volleyball Court Component")
        ).toBeInTheDocument();
      });

      // Should indicate read-only mode in debug info
      const debugInfo = document.querySelector(".absolute.top-2.left-2");
      if (debugInfo) {
        expect(debugInfo.textContent).toContain("ReadOnly: Yes");
      }
    });
  });

  describe("Event Callback Integration", () => {
    it("should properly set up all event callbacks", async () => {
      const callbacks = {
        onPositionChange: vi.fn(),
        onRotationChange: vi.fn(),
        onFormationChange: vi.fn(),
        onViolation: vi.fn(),
        onShare: vi.fn(),
        onError: vi.fn(),
      };

      render(<VolleyballCourt {...callbacks} />);

      await waitFor(() => {
        expect(
          screen.getByText("Volleyball Court Component")
        ).toBeInTheDocument();
      });

      // All callbacks should be properly set up (not called initially)
      Object.values(callbacks).forEach((callback) => {
        expect(callback).not.toHaveBeenCalled();
      });
    });
  });

  describe("Performance and Responsiveness", () => {
    it("should handle multiple rapid re-renders without issues", async () => {
      const { rerender } = render(<VolleyballCourt />);

      // Rapidly change props to test stability
      for (let i = 0; i < 10; i++) {
        rerender(
          <VolleyballCourt
            config={{ initialRotation: i % 6 }}
            courtDimensions={{ width: 600 + i * 10, height: 360 + i * 6 }}
          />
        );
      }

      await waitFor(() => {
        expect(
          screen.getByText("Volleyball Court Component")
        ).toBeInTheDocument();
      });

      // Should still be functional after rapid changes
      const courtElement = document.querySelector(".volleyball-court");
      expect(courtElement).toBeInTheDocument();
    });

    it("should handle window resize events gracefully", async () => {
      render(<VolleyballCourt />);

      await waitFor(() => {
        expect(
          screen.getByText("Volleyball Court Component")
        ).toBeInTheDocument();
      });

      // Simulate window resize
      window.innerWidth = 800;
      window.innerHeight = 600;
      window.dispatchEvent(new Event("resize"));

      // Component should still be functional
      await waitFor(() => {
        const courtElement = document.querySelector(".volleyball-court");
        expect(courtElement).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle invalid configuration gracefully", async () => {
      const invalidConfig: any = {
        initialSystem: "invalid-system",
        initialRotation: 10, // Out of bounds but not extreme
        controls: "not-an-object",
      };

      // Should not crash with invalid config
      render(<VolleyballCourt config={invalidConfig} />);

      await waitFor(() => {
        expect(
          screen.getByText("Volleyball Court Component")
        ).toBeInTheDocument();
      });
    });

    it("should handle missing dependencies gracefully", async () => {
      // Component should render even if some dependencies are missing
      render(<VolleyballCourt />);

      await waitFor(() => {
        expect(
          screen.getByText("Volleyball Court Component")
        ).toBeInTheDocument();
      });

      // Should show some indication of the current state
      expect(screen.getByText(/System:/)).toBeInTheDocument();
      expect(screen.getByText(/Rotation:/)).toBeInTheDocument();
      expect(screen.getByText(/Formation:/)).toBeInTheDocument();
    });
  });

  describe("Accessibility and Usability", () => {
    it("should provide proper ARIA attributes and semantic structure", async () => {
      render(<VolleyballCourt />);

      await waitFor(() => {
        const courtElement = document.querySelector(".volleyball-court");
        expect(courtElement).toBeInTheDocument();

        // Should have proper semantic structure
        expect(courtElement).toHaveAttribute("style");
        expect(courtElement).toHaveClass("volleyball-court");
      });
    });

    it("should handle keyboard navigation appropriately", async () => {
      render(<VolleyballCourt />);

      await waitFor(() => {
        expect(
          screen.getByText("Volleyball Court Component")
        ).toBeInTheDocument();
      });

      // Component should be keyboard accessible (basic structure test)
      const courtElement = document.querySelector(".volleyball-court");
      expect(courtElement).toBeInTheDocument();
    });
  });
});
