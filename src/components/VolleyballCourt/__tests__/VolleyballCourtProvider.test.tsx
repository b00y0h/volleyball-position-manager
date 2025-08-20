import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  VolleyballCourtProvider,
  useVolleyballCourt,
} from "../VolleyballCourtProvider";
import { SystemType, FormationType } from "@/types";
import {
  VolleyballCourtConfig,
  ViolationData,
  ShareData,
  ErrorData,
} from "../types";

// Mock the enhanced position manager
vi.mock("@/hooks/useEnhancedPositionManager", () => ({
  useEnhancedPositionManager: () => ({
    // Position getters
    getPosition: vi.fn(() => ({
      x: 100,
      y: 100,
      isCustom: false,
      lastModified: new Date(),
    })),
    getFormationPositions: vi.fn(() => ({
      S: { x: 100, y: 100, isCustom: false, lastModified: new Date() },
      Opp: { x: 200, y: 200, isCustom: false, lastModified: new Date() },
    })),
    getAllPositions: vi.fn(() => ({})),

    // Position setters
    setPosition: vi.fn(() => true),
    setFormationPositions: vi.fn(() => true),

    // Position validation
    validatePosition: vi.fn(() => ({ isValid: true })),

    // Customization checks
    isPositionCustomized: vi.fn(() => false),
    isFormationCustomized: vi.fn(() => false),
    isRotationCustomized: vi.fn(() => false),
    isSystemCustomized: vi.fn(() => false),

    // Reset operations
    resetPosition: vi.fn(),
    resetFormation: vi.fn(),
    resetRotation: vi.fn(),
    resetSystem: vi.fn(),
    resetAll: vi.fn(),

    // Enhanced volleyball rules methods
    validateCurrentFormation: vi.fn(() => ({
      isValid: true,
      violations: [],
    })),
    getConstraintsForPlayer: vi.fn(() => ({
      isValid: () => true,
      snapToValid: (x: number, y: number) => ({ x, y }),
    })),
    validatePositionWithRules: vi.fn(() => ({ isValid: true })),
    setPositionWithValidation: vi.fn(() => ({ success: true })),
    setFormationPositionsWithValidation: vi.fn(() => ({ success: true })),
    isVolleyballRulesEnabled: vi.fn(() => true),
    setVolleyballRulesEnabled: vi.fn(),
    getVolleyballValidationSummary: vi.fn(() => ({
      totalViolations: 0,
      violationsByType: {},
      affectedPlayers: [],
    })),

    // State properties
    isLoading: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

// Test component that uses the context
const TestComponent: React.FC = () => {
  const {
    state,
    config,
    setSystem,
    setRotationIndex,
    setFormation,
    setIsAnimating,
    setDraggedPlayer,
    setViolations,
    setVisualGuidelines,
    setIsReadOnly,
    setShowControls,
    setShareURL,
    setShowShareDialog,
    setError,
    handlePositionChange,
    handleRotationChange,
    handleFormationChange,
    handleViolation,
    handleShare,
    handleError,
  } = useVolleyballCourt();

  return (
    <div>
      <div data-testid="system">{state.system}</div>
      <div data-testid="rotation">{state.rotationIndex}</div>
      <div data-testid="formation">{state.formation}</div>
      <div data-testid="animating">{state.isAnimating.toString()}</div>
      <div data-testid="dragged-player">{state.draggedPlayer || "none"}</div>
      <div data-testid="violations">{state.violations.join(",")}</div>
      <div data-testid="readonly">{state.isReadOnly.toString()}</div>
      <div data-testid="show-controls">{state.showControls.toString()}</div>
      <div data-testid="share-url">{state.shareURL}</div>
      <div data-testid="show-share-dialog">
        {state.showShareDialog.toString()}
      </div>
      <div data-testid="error">{state.error || "none"}</div>
      <div data-testid="config-system">{config.initialSystem}</div>

      <button onClick={() => setSystem("6-2")}>Change System</button>
      <button onClick={() => setRotationIndex(2)}>Change Rotation</button>
      <button onClick={() => setFormation("serve-receive")}>
        Change Formation
      </button>
      <button onClick={() => setIsAnimating(true)}>Start Animation</button>
      <button onClick={() => setDraggedPlayer("S")}>Set Dragged Player</button>
      <button onClick={() => setViolations(["test violation"])}>
        Set Violations
      </button>
      <button
        onClick={() =>
          setVisualGuidelines({ horizontalLines: [], verticalLines: [] })
        }
      >
        Set Guidelines
      </button>
      <button onClick={() => setIsReadOnly(true)}>Set Read Only</button>
      <button onClick={() => setShowControls(false)}>Hide Controls</button>
      <button onClick={() => setShareURL("test-url")}>Set Share URL</button>
      <button onClick={() => setShowShareDialog(true)}>
        Show Share Dialog
      </button>
      <button onClick={() => setError("test error")}>Set Error</button>

      <button
        onClick={() =>
          handlePositionChange({
            S: { x: 150, y: 150, isCustom: true, lastModified: new Date() },
          })
        }
      >
        Handle Position Change
      </button>
      <button onClick={() => handleRotationChange(3)}>
        Handle Rotation Change
      </button>
      <button onClick={() => handleFormationChange("base")}>
        Handle Formation Change
      </button>
      <button
        onClick={() =>
          handleViolation([
            {
              code: "TEST",
              message: "Test violation",
              affectedPlayers: [],
              severity: "error",
            },
          ])
        }
      >
        Handle Violation
      </button>
      <button
        onClick={() =>
          handleShare({
            url: "share-url",
            config: {},
            positions: {
              system: "5-1",
              rotation: 0,
              formation: "base",
              positions: {},
            },
          })
        }
      >
        Handle Share
      </button>
      <button
        onClick={() =>
          handleError({ type: "validation", message: "Test error" })
        }
      >
        Handle Error
      </button>
    </div>
  );
};

describe("VolleyballCourtProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Provider Functionality", () => {
    it("should provide default state and configuration", () => {
      render(
        <VolleyballCourtProvider>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      expect(screen.getByTestId("system")).toHaveTextContent("5-1");
      expect(screen.getByTestId("rotation")).toHaveTextContent("0");
      expect(screen.getByTestId("formation")).toHaveTextContent("base");
      expect(screen.getByTestId("animating")).toHaveTextContent("false");
      expect(screen.getByTestId("dragged-player")).toHaveTextContent("none");
      expect(screen.getByTestId("violations")).toHaveTextContent("");
      expect(screen.getByTestId("readonly")).toHaveTextContent("false");
      expect(screen.getByTestId("show-controls")).toHaveTextContent("true");
      expect(screen.getByTestId("share-url")).toHaveTextContent("");
      expect(screen.getByTestId("show-share-dialog")).toHaveTextContent(
        "false"
      );
      expect(screen.getByTestId("error")).toHaveTextContent("none");
      expect(screen.getByTestId("config-system")).toHaveTextContent("5-1");
    });

    it("should accept custom configuration", () => {
      const customConfig: VolleyballCourtConfig = {
        initialSystem: "6-2",
        initialRotation: 2,
        initialFormation: "serve-receive",
        appearance: {
          theme: "dark",
        },
      };

      render(
        <VolleyballCourtProvider config={customConfig}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      expect(screen.getByTestId("system")).toHaveTextContent("6-2");
      expect(screen.getByTestId("rotation")).toHaveTextContent("2");
      expect(screen.getByTestId("formation")).toHaveTextContent(
        "serve-receive"
      );
    });

    it("should accept readOnly prop", () => {
      render(
        <VolleyballCourtProvider readOnly={true}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      expect(screen.getByTestId("readonly")).toHaveTextContent("true");
    });

    it("should accept showControls prop", () => {
      render(
        <VolleyballCourtProvider showControls={false}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      expect(screen.getByTestId("show-controls")).toHaveTextContent("false");
    });
  });

  describe("State Management", () => {
    it("should update system state", async () => {
      render(
        <VolleyballCourtProvider>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Change System");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("system")).toHaveTextContent("6-2");
      });
    });

    it("should update rotation state", async () => {
      render(
        <VolleyballCourtProvider>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Change Rotation");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("rotation")).toHaveTextContent("2");
      });
    });

    it("should update formation state", async () => {
      render(
        <VolleyballCourtProvider>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Change Formation");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("formation")).toHaveTextContent(
          "serve-receive"
        );
      });
    });

    it("should update animation state", async () => {
      render(
        <VolleyballCourtProvider>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Start Animation");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("animating")).toHaveTextContent("true");
      });
    });

    it("should update dragged player state", async () => {
      render(
        <VolleyballCourtProvider>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Set Dragged Player");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("dragged-player")).toHaveTextContent("S");
      });
    });

    it("should update violations state", async () => {
      render(
        <VolleyballCourtProvider>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Set Violations");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("violations")).toHaveTextContent(
          "test violation"
        );
      });
    });

    it("should update read-only state", async () => {
      render(
        <VolleyballCourtProvider>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Set Read Only");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("readonly")).toHaveTextContent("true");
      });
    });

    it("should update show controls state", async () => {
      render(
        <VolleyballCourtProvider>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Hide Controls");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("show-controls")).toHaveTextContent("false");
      });
    });

    it("should update share URL state", async () => {
      render(
        <VolleyballCourtProvider>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Set Share URL");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("share-url")).toHaveTextContent("test-url");
      });
    });

    it("should update share dialog state", async () => {
      render(
        <VolleyballCourtProvider>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Show Share Dialog");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("show-share-dialog")).toHaveTextContent(
          "true"
        );
      });
    });

    it("should update error state", async () => {
      render(
        <VolleyballCourtProvider>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Set Error");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("test error");
      });
    });
  });

  describe("Callback Handlers", () => {
    it("should call onPositionChange callback", async () => {
      const onPositionChange = vi.fn();

      render(
        <VolleyballCourtProvider onPositionChange={onPositionChange}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Handle Position Change");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(onPositionChange).toHaveBeenCalledWith({
          system: "5-1",
          rotation: 0,
          formation: "base",
          positions: {
            S: {
              x: 150,
              y: 150,
              isCustom: true,
              lastModified: expect.any(Date),
            },
          },
        });
      });
    });

    it("should call onRotationChange callback", async () => {
      const onRotationChange = vi.fn();

      render(
        <VolleyballCourtProvider onRotationChange={onRotationChange}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Handle Rotation Change");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(onRotationChange).toHaveBeenCalledWith(3);
      });
    });

    it("should call onFormationChange callback", async () => {
      const onFormationChange = vi.fn();

      render(
        <VolleyballCourtProvider onFormationChange={onFormationChange}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Handle Formation Change");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(onFormationChange).toHaveBeenCalledWith("base");
      });
    });

    it("should call onViolation callback", async () => {
      const onViolation = vi.fn();

      render(
        <VolleyballCourtProvider onViolation={onViolation}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Handle Violation");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(onViolation).toHaveBeenCalledWith([
          {
            code: "TEST",
            message: "Test violation",
            affectedPlayers: [],
            severity: "error",
          },
        ]);
      });
    });

    it("should call onShare callback", async () => {
      const onShare = vi.fn();

      render(
        <VolleyballCourtProvider onShare={onShare}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Handle Share");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(onShare).toHaveBeenCalledWith({
          url: "share-url",
          config: {},
          positions: {
            system: "5-1",
            rotation: 0,
            formation: "base",
            positions: {},
          },
        });
      });
    });

    it("should call onError callback", async () => {
      const onError = vi.fn();

      render(
        <VolleyballCourtProvider onError={onError}>
          <TestComponent />
        </VolleyballCourtProvider>
      );

      const button = screen.getByText("Handle Error");

      act(() => {
        button.click();
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith({
          type: "validation",
          message: "Test error",
        });
      });
    });
  });

  describe("Error Handling", () => {
    it("should throw error when useVolleyballCourt is used outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow(
        "useVolleyballCourt must be used within a VolleyballCourtProvider"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Configuration Merging", () => {
    it("should merge custom players configuration", () => {
      const customConfig: VolleyballCourtConfig = {
        players: {
          "5-1": [{ id: "CustomS", name: "Custom Setter", role: "S" }],
        },
      };

      const TestConfigComponent: React.FC = () => {
        const { config } = useVolleyballCourt();
        return (
          <div data-testid="custom-player">{config.players["5-1"][0].name}</div>
        );
      };

      render(
        <VolleyballCourtProvider config={customConfig}>
          <TestConfigComponent />
        </VolleyballCourtProvider>
      );

      expect(screen.getByTestId("custom-player")).toHaveTextContent(
        "Custom Setter"
      );
    });

    it("should merge custom rotations configuration", () => {
      const customConfig: VolleyballCourtConfig = {
        rotations: {
          "5-1": [
            {
              1: "CustomS",
              2: "CustomOpp",
              3: "CustomOH1",
              4: "CustomMB1",
              5: "CustomOH2",
              6: "CustomMB2",
            },
          ],
        },
      };

      const TestConfigComponent: React.FC = () => {
        const { config } = useVolleyballCourt();
        return (
          <div data-testid="custom-rotation">
            {config.rotations["5-1"][0][1]}
          </div>
        );
      };

      render(
        <VolleyballCourtProvider config={customConfig}>
          <TestConfigComponent />
        </VolleyballCourtProvider>
      );

      expect(screen.getByTestId("custom-rotation")).toHaveTextContent(
        "CustomS"
      );
    });

    it("should merge controls configuration", () => {
      const customConfig: VolleyballCourtConfig = {
        controls: {
          showSystemSelector: false,
          showRotationControls: false,
        },
      };

      const TestConfigComponent: React.FC = () => {
        const { config } = useVolleyballCourt();
        return (
          <div>
            <div data-testid="show-system">
              {config.controls.showSystemSelector?.toString()}
            </div>
            <div data-testid="show-rotation">
              {config.controls.showRotationControls?.toString()}
            </div>
            <div data-testid="show-formation">
              {config.controls.showFormationSelector?.toString()}
            </div>
          </div>
        );
      };

      render(
        <VolleyballCourtProvider config={customConfig}>
          <TestConfigComponent />
        </VolleyballCourtProvider>
      );

      expect(screen.getByTestId("show-system")).toHaveTextContent("false");
      expect(screen.getByTestId("show-rotation")).toHaveTextContent("false");
      expect(screen.getByTestId("show-formation")).toHaveTextContent("true"); // Should keep default
    });
  });
});
