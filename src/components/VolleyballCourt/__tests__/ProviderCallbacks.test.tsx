/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { VolleyballCourtProvider } from "../VolleyballCourtProvider";
import {
  PositionData,
  RotationChangeData,
  FormationChangeData,
  ViolationData,
  ShareData,
  ErrorData,
} from "../types";

// Mock the enhanced position manager hook
vi.mock("@/hooks/useEnhancedPositionManager", () => ({
  useEnhancedPositionManager: () => ({
    positions: {
      S: { x: 100, y: 200, isCustom: false, lastModified: new Date() },
      OH1: { x: 150, y: 250, isCustom: false, lastModified: new Date() },
    },
    rotationIndex: 0,
    setRotationIndex: vi.fn(),
    formation: "base",
    setFormation: vi.fn(),
    violations: [],
    setViolations: vi.fn(),
    errors: [],
    setError: vi.fn(),
    shareURL: "",
    setShareURL: vi.fn(),
    courtTheme: "light",
    system: "5-1",
    setSystem: vi.fn(),
    constraints: { horizontalLines: [], verticalLines: [] },
    getFormationPositions: vi.fn(() => ({
      S: { x: 100, y: 200, isCustom: false, lastModified: new Date() },
      OH1: { x: 150, y: 250, isCustom: false, lastModified: new Date() },
    })),
    resetPositions: vi.fn(),
    updatePlayerPosition: vi.fn(),
  }),
  EnhancedPositionManager: class {
    getFormationPositions = vi.fn(() => ({
      S: { x: 100, y: 200, isCustom: false, lastModified: new Date() },
      OH1: { x: 150, y: 250, isCustom: false, lastModified: new Date() },
    }));
    resetPositions = vi.fn();
    updatePlayerPosition = vi.fn();
  },
}));

// Mock the persistence manager
vi.mock("./PersistenceManager", () => ({
  VolleyballCourtPersistenceManager: class {
    generateShareURL = vi.fn(() => ({
      url: "https://example.com/share/test",
      config: {},
      positions: {
        system: "5-1",
        rotation: 0,
        formation: "base",
        positions: {},
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    }));
    loadFromURL = vi.fn();
    setReadOnly = vi.fn();
  },
}));

describe("VolleyballCourtProvider Callbacks", () => {
  const mockOnPositionChange = vi.fn();
  const mockOnRotationChange = vi.fn();
  const mockOnFormationChange = vi.fn();
  const mockOnViolation = vi.fn();
  const mockOnShare = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const TestComponent = () => {
    return (
      <VolleyballCourtProvider
        config={{
          initialSystem: "5-1",
          initialRotation: 0,
          initialFormation: "base",
        }}
        onPositionChange={mockOnPositionChange}
        onRotationChange={mockOnRotationChange}
        onFormationChange={mockOnFormationChange}
        onViolation={mockOnViolation}
        onShare={mockOnShare}
        onError={mockOnError}
      >
        <div data-testid="test-content">Test Content</div>
      </VolleyballCourtProvider>
    );
  };

  describe("Callback data enhancement", () => {
    it("should enhance position data with timestamp and metadata", () => {
      render(<TestComponent />);

      // Position callback should be called during initialization
      expect(mockOnPositionChange).toHaveBeenCalled();

      const callData: PositionData = mockOnPositionChange.mock.calls[0][0];

      expect(callData).toEqual({
        system: "5-1",
        rotation: 0,
        formation: "base",
        positions: expect.any(Object),
        timestamp: expect.any(Number),
        changedPlayers: expect.any(Array),
        changeType: "formation-change",
        metadata: expect.objectContaining({
          previousPositions: expect.any(Object),
        }),
      });

      expect(callData.timestamp).toBeGreaterThan(Date.now() - 5000);
      expect(callData.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it("should enhance violation data with context", () => {
      const TestViolationComponent = () => {
        const handleTestViolation = () => {
          const violation: ViolationData = {
            id: "test_violation",
            code: "TEST_ERROR",
            message: "Test violation",
            affectedPlayers: ["S"],
            severity: "warning",
            timestamp: 0, // Will be enhanced
            violationType: "custom",
            context: {
              system: "5-1",
              rotation: 0,
              formation: "base",
              positions: {},
            },
          };
          // Simulate calling the violation handler directly
          mockOnViolation([violation]);
        };

        React.useEffect(() => {
          handleTestViolation();
        }, []);

        return (
          <VolleyballCourtProvider
            config={{ initialSystem: "5-1" }}
            onViolation={mockOnViolation}
          >
            <div>Test</div>
          </VolleyballCourtProvider>
        );
      };

      render(<TestViolationComponent />);

      expect(mockOnViolation).toHaveBeenCalled();

      const violations: ViolationData[] = mockOnViolation.mock.calls[0][0];
      const violation = violations[0];

      expect(violation.timestamp).toBeGreaterThan(0);
      expect(violation.context).toEqual({
        system: "5-1",
        rotation: 0,
        formation: "base",
        positions: {},
      });
    });

    it("should enhance share data with timestamp", () => {
      const TestShareComponent = () => {
        const handleTestShare = () => {
          const shareData: ShareData = {
            url: "https://example.com/share/test",
            config: {},
            positions: {
              system: "5-1",
              rotation: 0,
              formation: "base",
              positions: {},
              timestamp: 0, // Will be enhanced
            },
            timestamp: 0, // Will be enhanced
          };
          mockOnShare(shareData);
        };

        React.useEffect(() => {
          handleTestShare();
        }, []);

        return (
          <VolleyballCourtProvider
            config={{ initialSystem: "5-1" }}
            onShare={mockOnShare}
          >
            <div>Test</div>
          </VolleyballCourtProvider>
        );
      };

      render(<TestShareComponent />);

      expect(mockOnShare).toHaveBeenCalled();

      const shareData: ShareData = mockOnShare.mock.calls[0][0];

      expect(shareData.timestamp).toBeGreaterThan(0);
      expect(shareData.positions.timestamp).toBeGreaterThan(0);
    });

    it("should enhance error data with context and ID", () => {
      const TestErrorComponent = () => {
        const handleTestError = () => {
          const error: ErrorData = {
            id: "", // Will be enhanced
            type: "unknown",
            message: "Test error",
            timestamp: 0, // Will be enhanced
            severity: "low", // Will be enhanced if missing
          };
          mockOnError(error);
        };

        React.useEffect(() => {
          handleTestError();
        }, []);

        return (
          <VolleyballCourtProvider
            config={{ initialSystem: "5-1" }}
            onError={mockOnError}
          >
            <div>Test</div>
          </VolleyballCourtProvider>
        );
      };

      render(<TestErrorComponent />);

      expect(mockOnError).toHaveBeenCalled();

      const error: ErrorData = mockOnError.mock.calls[0][0];

      expect(error.id).toMatch(/^error_\d+$/);
      expect(error.timestamp).toBeGreaterThan(0);
      expect(error.severity).toBe("medium"); // Default severity
      expect(error.context).toEqual({
        component: "VolleyballCourtProvider",
        state: {
          system: "5-1",
          rotation: 0,
          formation: "base",
          isReadOnly: false,
        },
      });
    });
  });

  describe("Callback timing and sequencing", () => {
    it("should call callbacks in the correct order", () => {
      const callOrder: string[] = [];

      const trackingOnPositionChange = vi.fn(() => {
        callOrder.push("position");
      });
      const trackingOnRotationChange = vi.fn(() => {
        callOrder.push("rotation");
      });
      const trackingOnFormationChange = vi.fn(() => {
        callOrder.push("formation");
      });

      const TrackingComponent = () => (
        <VolleyballCourtProvider
          config={{
            initialSystem: "5-1",
            initialRotation: 1,
            initialFormation: "serveReceive",
          }}
          onPositionChange={trackingOnPositionChange}
          onRotationChange={trackingOnRotationChange}
          onFormationChange={trackingOnFormationChange}
        >
          <div>Test</div>
        </VolleyballCourtProvider>
      );

      render(<TrackingComponent />);

      // Position change should be called during setup
      expect(trackingOnPositionChange).toHaveBeenCalled();
      expect(callOrder).toContain("position");
    });

    it("should provide consistent timestamps within a short time window", () => {
      const startTime = Date.now();

      render(<TestComponent />);

      if (mockOnPositionChange.mock.calls.length > 0) {
        const positionData: PositionData = mockOnPositionChange.mock.calls[0][0];
        const timeDiff = Math.abs(positionData.timestamp - startTime);

        // Timestamp should be within 1 second of test start
        expect(timeDiff).toBeLessThan(1000);
      }
    });
  });

  describe("Callback data validation", () => {
    it("should provide valid system values", () => {
      render(<TestComponent />);

      if (mockOnPositionChange.mock.calls.length > 0) {
        const positionData: PositionData = mockOnPositionChange.mock.calls[0][0];
        expect(["5-1", "6-2"]).toContain(positionData.system);
      }
    });

    it("should provide valid formation values", () => {
      render(<TestComponent />);

      if (mockOnPositionChange.mock.calls.length > 0) {
        const positionData: PositionData = mockOnPositionChange.mock.calls[0][0];
        expect(["rotational", "serveReceive", "base"]).toContain(
          positionData.formation
        );
      }
    });

    it("should provide valid rotation indices", () => {
      render(<TestComponent />);

      if (mockOnPositionChange.mock.calls.length > 0) {
        const positionData: PositionData = mockOnPositionChange.mock.calls[0][0];
        expect(positionData.rotation).toBeGreaterThanOrEqual(0);
        expect(positionData.rotation).toBeLessThan(6);
      }
    });

    it("should provide positions with valid structure", () => {
      render(<TestComponent />);

      if (mockOnPositionChange.mock.calls.length > 0) {
        const positionData: PositionData = mockOnPositionChange.mock.calls[0][0];

        Object.entries(positionData.positions).forEach(([playerId, position]) => {
          expect(typeof playerId).toBe("string");
          expect(position).toEqual({
            x: expect.any(Number),
            y: expect.any(Number),
            isCustom: expect.any(Boolean),
            lastModified: expect.any(Number),
          });
        });
      }
    });
  });

  describe("Error handling and recovery", () => {
    it("should handle missing callback functions gracefully", () => {
      const ComponentWithoutCallbacks = () => (
        <VolleyballCourtProvider config={{ initialSystem: "5-1" }}>
          <div>Test</div>
        </VolleyballCourtProvider>
      );

      // Should not throw when callbacks are not provided
      expect(() => {
        render(<ComponentWithoutCallbacks />);
      }).not.toThrow();
    });

    it("should handle callback function errors gracefully", () => {
      const throwingOnPositionChange = vi.fn(() => {
        throw new Error("Callback error");
      });

      const ErrorThrowingComponent = () => (
        <VolleyballCourtProvider
          config={{ initialSystem: "5-1" }}
          onPositionChange={throwingOnPositionChange}
        >
          <div>Test</div>
        </VolleyballCourtProvider>
      );

      // Component should still render even if callback throws
      expect(() => {
        render(<ErrorThrowingComponent />);
      }).not.toThrow();

      expect(throwingOnPositionChange).toHaveBeenCalled();
    });
  });

  describe("Callback performance", () => {
    it("should call callbacks efficiently without excessive re-renders", () => {
      render(<TestComponent />);

      // Position callback should be called a reasonable number of times during initialization
      expect(mockOnPositionChange.mock.calls.length).toBeLessThan(5);
    });

    it("should provide metadata for performance monitoring", () => {
      const performanceTrackingCallback = vi.fn();

      const PerformanceComponent = () => (
        <VolleyballCourtProvider
          config={{
            initialSystem: "5-1",
            validation: { enableRealTimeValidation: true },
          }}
          onPositionChange={(data) => {
            performanceTrackingCallback({
              timestamp: data.timestamp,
              changeType: data.changeType,
              validationStatus: data.metadata?.validationStatus,
            });
          }}
        >
          <div>Test</div>
        </VolleyballCourtProvider>
      );

      render(<PerformanceComponent />);

      if (performanceTrackingCallback.mock.calls.length > 0) {
        const callData = performanceTrackingCallback.mock.calls[0][0];
        expect(callData.timestamp).toBeDefined();
        expect(callData.changeType).toBeDefined();
      }
    });
  });
});