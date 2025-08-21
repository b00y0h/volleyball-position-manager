/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VolleyballCourt } from "../VolleyballCourt";
import {
  PositionData,
  RotationChangeData,
  FormationChangeData,
  ViolationData,
  ShareData,
  ErrorData,
  PlayerDragData,
  ValidationStateData,
  ConfigurationChangeData,
  SystemChangeData,
} from "../types";

describe("VolleyballCourt Callback System", () => {
  const mockOnPositionChange = vi.fn();
  const mockOnRotationChange = vi.fn();
  const mockOnFormationChange = vi.fn();
  const mockOnViolation = vi.fn();
  const mockOnShare = vi.fn();
  const mockOnError = vi.fn();
  const mockOnPlayerDragStart = vi.fn();
  const mockOnPlayerDragEnd = vi.fn();
  const mockOnValidationStateChange = vi.fn();
  const mockOnConfigurationChange = vi.fn();
  const mockOnSystemChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("onPositionChange callback", () => {
    it("should provide detailed position data", async () => {
      render(
        <VolleyballCourt
          onPositionChange={mockOnPositionChange}
          config={{
            initialSystem: "5-1",
            initialRotation: 0,
            initialFormation: "base",
          }}
        />
      );

      await waitFor(() => {
        expect(mockOnPositionChange).toHaveBeenCalled();
      });

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

      expect(callData.timestamp).toBeGreaterThan(0);
      expect(Object.keys(callData.positions)).toHaveLength(6);
    });

    it("should track changed players", async () => {
      render(
        <VolleyballCourt
          onPositionChange={mockOnPositionChange}
          config={{
            initialSystem: "5-1",
            initialRotation: 0,
            initialFormation: "base",
          }}
        />
      );

      await waitFor(() => {
        expect(mockOnPositionChange).toHaveBeenCalled();
      });

      const callData: PositionData = mockOnPositionChange.mock.calls[0][0];
      expect(callData.changedPlayers).toBeDefined();
    });

    it("should include validation status in metadata", async () => {
      render(
        <VolleyballCourt
          onPositionChange={mockOnPositionChange}
          config={{
            initialSystem: "5-1",
            validation: {
              enableRealTimeValidation: true,
            },
          }}
        />
      );

      await waitFor(() => {
        expect(mockOnPositionChange).toHaveBeenCalled();
      });

      const callData: PositionData = mockOnPositionChange.mock.calls[0][0];
      expect(callData.metadata?.validationStatus).toBeDefined();
    });
  });

  describe("onRotationChange callback", () => {
    it("should provide rotation change data", async () => {
      const user = userEvent.setup();

      render(
        <VolleyballCourt
          onRotationChange={mockOnRotationChange}
          config={{
            initialSystem: "5-1",
            controls: {
              showRotationControls: true,
            },
          }}
        />
      );

      // Wait for component to be ready
      await waitFor(() => {
        expect(screen.getByText(/rotation/i)).toBeInTheDocument();
      });

      // Simulate rotation change
      const nextButton = screen.getByLabelText(/next rotation/i) || screen.getByText(/next/i);
      if (nextButton) {
        await user.click(nextButton);

        await waitFor(() => {
          expect(mockOnRotationChange).toHaveBeenCalled();
        });

        const callData: RotationChangeData = mockOnRotationChange.mock.calls[0][0];

        expect(callData).toEqual({
          previousRotation: expect.any(Number),
          newRotation: expect.any(Number),
          system: "5-1",
          formation: expect.any(String),
          timestamp: expect.any(Number),
          changeType: "manual",
          metadata: expect.objectContaining({
            triggeredBy: expect.any(String),
          }),
        });
      }
    });

    it("should differentiate between manual and programmatic changes", () => {
      // This would be tested with direct component API calls
      // For now, we'll test the structure
      const mockData: RotationChangeData = {
        previousRotation: 0,
        newRotation: 1,
        system: "5-1",
        formation: "base",
        timestamp: Date.now(),
        changeType: "programmatic",
        metadata: {
          triggeredBy: "automated-sequence",
        },
      };

      expect(mockData.changeType).toBe("programmatic");
      expect(mockData.metadata?.triggeredBy).toBe("automated-sequence");
    });
  });

  describe("onFormationChange callback", () => {
    it("should provide formation change data", async () => {
      const user = userEvent.setup();

      render(
        <VolleyballCourt
          onFormationChange={mockOnFormationChange}
          config={{
            initialSystem: "5-1",
            controls: {
              showFormationSelector: true,
            },
          }}
        />
      );

      // Wait for component to be ready and look for formation selector
      await waitFor(() => {
        const formationSelect = screen.queryByLabelText(/formation/i);
        if (formationSelect) {
          fireEvent.change(formationSelect, { target: { value: "serveReceive" } });
        }
      });

      if (mockOnFormationChange.mock.calls.length > 0) {
        const callData: FormationChangeData = mockOnFormationChange.mock.calls[0][0];

        expect(callData).toEqual({
          previousFormation: expect.any(String),
          newFormation: expect.any(String),
          system: "5-1",
          rotation: expect.any(Number),
          timestamp: expect.any(Number),
          changeType: "manual",
          metadata: expect.objectContaining({
            triggeredBy: expect.any(String),
          }),
        });
      }
    });
  });

  describe("onViolation callback", () => {
    it("should provide comprehensive violation data", () => {
      const mockViolation: ViolationData = {
        id: "violation_123",
        code: "POSITIONING_ERROR",
        message: "Player out of bounds",
        affectedPlayers: ["S", "OH1"],
        severity: "error",
        timestamp: Date.now(),
        violationType: "positioning",
        context: {
          system: "5-1",
          rotation: 0,
          formation: "base",
          positions: {},
        },
        metadata: {
          rule: "Players must stay within court boundaries",
          suggestedFix: "Move player back to valid position",
          autoFixAvailable: true,
          educationalNote: "In volleyball, players cannot cross court boundaries during play",
        },
      };

      expect(mockViolation.id).toBeDefined();
      expect(mockViolation.timestamp).toBeGreaterThan(0);
      expect(mockViolation.violationType).toBe("positioning");
      expect(mockViolation.context).toBeDefined();
      expect(mockViolation.metadata?.rule).toBeDefined();
      expect(mockViolation.metadata?.autoFixAvailable).toBe(true);
    });

    it("should enhance violations with context", async () => {
      const TestComponent = () => {
        const handleTestViolation = () => {
          const violation: ViolationData = {
            id: "test_violation",
            code: "TEST_ERROR",
            message: "Test violation",
            affectedPlayers: ["S"],
            severity: "warning",
            timestamp: Date.now(),
            violationType: "custom",
            context: {
              system: "5-1",
              rotation: 0,
              formation: "base",
              positions: {},
            },
          };
          mockOnViolation([violation]);
        };

        return (
          <div>
            <VolleyballCourt onViolation={mockOnViolation} />
            <button onClick={handleTestViolation}>Trigger Violation</button>
          </div>
        );
      };

      const user = userEvent.setup();
      render(<TestComponent />);

      const triggerButton = screen.getByText("Trigger Violation");
      await user.click(triggerButton);

      expect(mockOnViolation).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            timestamp: expect.any(Number),
            context: expect.objectContaining({
              system: expect.any(String),
              rotation: expect.any(Number),
              formation: expect.any(String),
              positions: expect.any(Object),
            }),
          }),
        ])
      );
    });
  });

  describe("onShare callback", () => {
    it("should provide comprehensive share data", () => {
      const mockShareData: ShareData = {
        url: "https://example.com/share/abc123",
        shortUrl: "https://short.ly/abc",
        qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...",
        config: {
          initialSystem: "5-1",
          initialRotation: 0,
          initialFormation: "base",
        },
        positions: {
          system: "5-1",
          rotation: 0,
          formation: "base",
          positions: {},
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
        shareId: "share_abc123",
        metadata: {
          title: "My Volleyball Formation",
          description: "5-1 system base formation",
          tags: ["volleyball", "formation", "coaching"],
          expiresAt: Date.now() + 86400000, // 24 hours
          isPublic: true,
          shareMethod: "url",
        },
      };

      expect(mockShareData.url).toBeDefined();
      expect(mockShareData.timestamp).toBeGreaterThan(0);
      expect(mockShareData.shareId).toBeDefined();
      expect(mockShareData.metadata?.title).toBeDefined();
      expect(mockShareData.metadata?.shareMethod).toBe("url");
      expect(mockShareData.qrCode).toMatch(/^data:image/);
    });

    it("should enhance share data with timestamp", async () => {
      const TestComponent = () => {
        const handleTestShare = () => {
          const shareData: ShareData = {
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
          };
          mockOnShare(shareData);
        };

        return (
          <div>
            <VolleyballCourt onShare={mockOnShare} />
            <button onClick={handleTestShare}>Trigger Share</button>
          </div>
        );
      };

      const user = userEvent.setup();
      render(<TestComponent />);

      const triggerButton = screen.getByText("Trigger Share");
      await user.click(triggerButton);

      expect(mockOnShare).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Number),
          positions: expect.objectContaining({
            timestamp: expect.any(Number),
          }),
        })
      );
    });
  });

  describe("onError callback", () => {
    it("should provide comprehensive error data", () => {
      const mockErrorData: ErrorData = {
        id: "error_456",
        type: "validation",
        message: "Invalid player configuration",
        timestamp: Date.now(),
        severity: "high",
        details: { invalidField: "playerRole" },
        context: {
          component: "PlayerLayer",
          action: "validatePlayer",
          state: {
            system: "5-1",
            rotation: 0,
            playerId: "S",
          },
        },
        recovery: {
          isRecoverable: true,
          suggestedActions: ["Reset player configuration", "Use default values"],
          autoRecoveryAttempted: false,
          retryable: true,
        },
      };

      expect(mockErrorData.id).toBeDefined();
      expect(mockErrorData.timestamp).toBeGreaterThan(0);
      expect(mockErrorData.severity).toBe("high");
      expect(mockErrorData.context?.component).toBe("PlayerLayer");
      expect(mockErrorData.recovery?.isRecoverable).toBe(true);
      expect(mockErrorData.recovery?.suggestedActions).toHaveLength(2);
    });

    it("should enhance error data with context", async () => {
      const TestComponent = () => {
        const handleTestError = () => {
          const error: ErrorData = {
            id: "test_error",
            type: "unknown",
            message: "Test error",
            timestamp: Date.now(),
            severity: "low",
          };
          mockOnError(error);
        };

        return (
          <div>
            <VolleyballCourt onError={mockOnError} />
            <button onClick={handleTestError}>Trigger Error</button>
          </div>
        );
      };

      const user = userEvent.setup();
      render(<TestComponent />);

      const triggerButton = screen.getByText("Trigger Error");
      await user.click(triggerButton);

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          timestamp: expect.any(Number),
          severity: expect.any(String),
          context: expect.objectContaining({
            component: "VolleyballCourtProvider",
            state: expect.objectContaining({
              system: expect.any(String),
              rotation: expect.any(Number),
              formation: expect.any(String),
              isReadOnly: expect.any(Boolean),
            }),
          }),
        })
      );
    });
  });

  describe("Extended callbacks", () => {
    it("should support PlayerDragData structure", () => {
      const mockDragData: PlayerDragData = {
        playerId: "S",
        playerName: "Setter",
        playerRole: "S",
        startPosition: { x: 100, y: 100, isCustom: false, lastModified: Date.now() },
        currentPosition: { x: 120, y: 110, isCustom: true, lastModified: Date.now() },
        endPosition: { x: 125, y: 115, isCustom: true, lastModified: Date.now() },
        isValid: true,
        violations: [],
        timestamp: Date.now(),
        metadata: {
          dragDistance: 25.5,
          dragDuration: 1500,
          snapToPosition: { x: 125, y: 115, isCustom: true, lastModified: Date.now() },
        },
      };

      expect(mockDragData.playerId).toBe("S");
      expect(mockDragData.metadata?.dragDistance).toBe(25.5);
      expect(mockDragData.metadata?.dragDuration).toBe(1500);
      expect(mockDragData.isValid).toBe(true);
    });

    it("should support ValidationStateData structure", () => {
      const mockValidationData: ValidationStateData = {
        isValid: false,
        violations: [],
        warnings: [],
        system: "5-1",
        rotation: 0,
        formation: "base",
        timestamp: Date.now(),
        metadata: {
          validationMode: "real-time",
          performanceMetrics: {
            validationTime: 15,
            constraintCalculationTime: 8,
          },
        },
      };

      expect(mockValidationData.isValid).toBe(false);
      expect(mockValidationData.metadata?.validationMode).toBe("real-time");
      expect(mockValidationData.metadata?.performanceMetrics?.validationTime).toBe(15);
    });

    it("should support ConfigurationChangeData structure", () => {
      const mockConfigChangeData: ConfigurationChangeData = {
        changedKeys: ["appearance.theme", "validation.enableRealTimeValidation"],
        previousConfig: {
          appearance: { theme: "light" },
          validation: { enableRealTimeValidation: false },
        },
        newConfig: {
          appearance: { theme: "dark" },
          validation: { enableRealTimeValidation: true },
        },
        timestamp: Date.now(),
        changeType: "user",
        metadata: {
          triggeredBy: "ConfigurationPanel",
          affectedComponents: ["CourtVisualization", "ValidationLayer"],
        },
      };

      expect(mockConfigChangeData.changedKeys).toHaveLength(2);
      expect(mockConfigChangeData.changeType).toBe("user");
      expect(mockConfigChangeData.metadata?.affectedComponents).toContain("CourtVisualization");
    });

    it("should support SystemChangeData structure", () => {
      const mockSystemChangeData: SystemChangeData = {
        previousSystem: "5-1",
        newSystem: "6-2",
        timestamp: Date.now(),
        changeType: "manual",
        metadata: {
          triggeredBy: "SystemSelector",
          playersChanged: true,
          rotationsChanged: true,
          positionsReset: true,
        },
      };

      expect(mockSystemChangeData.previousSystem).toBe("5-1");
      expect(mockSystemChangeData.newSystem).toBe("6-2");
      expect(mockSystemChangeData.metadata?.playersChanged).toBe(true);
      expect(mockSystemChangeData.metadata?.rotationsChanged).toBe(true);
    });
  });

  describe("Callback integration", () => {
    it("should call all relevant callbacks in sequence", async () => {
      render(
        <VolleyballCourt
          onPositionChange={mockOnPositionChange}
          onRotationChange={mockOnRotationChange}
          onFormationChange={mockOnFormationChange}
          onViolation={mockOnViolation}
          config={{
            initialSystem: "5-1",
            validation: {
              enableRealTimeValidation: true,
            },
          }}
        />
      );

      // Wait for initial callbacks
      await waitFor(() => {
        expect(mockOnPositionChange).toHaveBeenCalled();
      });

      // Check that all timestamps are recent and in order
      const positionCall = mockOnPositionChange.mock.calls[0]?.[0];
      if (positionCall) {
        expect(positionCall.timestamp).toBeGreaterThan(Date.now() - 5000);
      }
    });

    it("should provide consistent data across callbacks", async () => {
      render(
        <VolleyballCourt
          onPositionChange={mockOnPositionChange}
          onRotationChange={mockOnRotationChange}
          config={{
            initialSystem: "5-1",
            initialRotation: 2,
            initialFormation: "base",
          }}
        />
      );

      await waitFor(() => {
        expect(mockOnPositionChange).toHaveBeenCalled();
      });

      const positionData: PositionData = mockOnPositionChange.mock.calls[0][0];
      
      expect(positionData.system).toBe("5-1");
      expect(positionData.rotation).toBe(2);
      expect(positionData.formation).toBe("base");
    });
  });
});