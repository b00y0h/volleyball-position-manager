/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
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

describe("Callback Data Interfaces", () => {
  describe("PositionData", () => {
    it("should have all required fields", () => {
      const positionData: PositionData = {
        system: "5-1",
        rotation: 2,
        formation: "base",
        positions: {
          S: { x: 100, y: 200, isCustom: false, lastModified: Date.now() },
          OH1: { x: 150, y: 250, isCustom: true, lastModified: Date.now() },
        },
        timestamp: Date.now(),
      };

      expect(positionData.system).toBe("5-1");
      expect(positionData.rotation).toBe(2);
      expect(positionData.formation).toBe("base");
      expect(positionData.timestamp).toBeGreaterThan(0);
      expect(Object.keys(positionData.positions)).toHaveLength(2);
    });

    it("should support optional fields", () => {
      const positionData: PositionData = {
        system: "6-2",
        rotation: 0,
        formation: "serveReceive",
        positions: {},
        timestamp: Date.now(),
        changedPlayers: ["S1", "OH1"],
        changeType: "drag",
        metadata: {
          previousPositions: {},
          draggedPlayerId: "S1",
          validationStatus: "valid",
        },
      };

      expect(positionData.changedPlayers).toEqual(["S1", "OH1"]);
      expect(positionData.changeType).toBe("drag");
      expect(positionData.metadata?.draggedPlayerId).toBe("S1");
      expect(positionData.metadata?.validationStatus).toBe("valid");
    });

    it("should support all change types", () => {
      const changeTypes: PositionData["changeType"][] = [
        "drag",
        "formation-change",
        "rotation-change",
        "reset",
        "manual",
      ];

      changeTypes.forEach((changeType) => {
        const data: PositionData = {
          system: "5-1",
          rotation: 0,
          formation: "base",
          positions: {},
          timestamp: Date.now(),
          changeType,
        };

        expect(data.changeType).toBe(changeType);
      });
    });
  });

  describe("RotationChangeData", () => {
    it("should track rotation changes", () => {
      const rotationData: RotationChangeData = {
        previousRotation: 1,
        newRotation: 2,
        system: "5-1",
        formation: "base",
        timestamp: Date.now(),
        changeType: "manual",
        metadata: {
          triggeredBy: "RotationControls",
          animationDuration: 300,
        },
      };

      expect(rotationData.previousRotation).toBe(1);
      expect(rotationData.newRotation).toBe(2);
      expect(rotationData.system).toBe("5-1");
      expect(rotationData.changeType).toBe("manual");
      expect(rotationData.metadata?.triggeredBy).toBe("RotationControls");
      expect(rotationData.metadata?.animationDuration).toBe(300);
    });

    it("should support all change types", () => {
      const changeTypes: RotationChangeData["changeType"][] = [
        "manual",
        "programmatic",
        "animation",
      ];

      changeTypes.forEach((changeType) => {
        const data: RotationChangeData = {
          previousRotation: 0,
          newRotation: 1,
          system: "6-2",
          formation: "rotational",
          timestamp: Date.now(),
          changeType,
        };

        expect(data.changeType).toBe(changeType);
      });
    });
  });

  describe("FormationChangeData", () => {
    it("should track formation changes", () => {
      const formationData: FormationChangeData = {
        previousFormation: "base",
        newFormation: "serveReceive",
        system: "5-1",
        rotation: 3,
        timestamp: Date.now(),
        changeType: "manual",
        metadata: {
          triggeredBy: "FormationSelector",
          affectedPlayers: ["S", "OH1", "OH2"],
        },
      };

      expect(formationData.previousFormation).toBe("base");
      expect(formationData.newFormation).toBe("serveReceive");
      expect(formationData.system).toBe("5-1");
      expect(formationData.rotation).toBe(3);
      expect(formationData.metadata?.affectedPlayers).toEqual(["S", "OH1", "OH2"]);
    });
  });

  describe("ViolationData", () => {
    it("should provide comprehensive violation information", () => {
      const violation: ViolationData = {
        id: "violation_123",
        code: "OUT_OF_BOUNDS",
        message: "Player S is positioned outside court boundaries",
        affectedPlayers: ["S"],
        severity: "error",
        timestamp: Date.now(),
        violationType: "court-boundary",
        context: {
          system: "5-1",
          rotation: 2,
          formation: "base",
          positions: {
            S: { x: -10, y: 100, isCustom: true, lastModified: Date.now() },
          },
        },
        metadata: {
          rule: "Players must remain within court boundaries",
          suggestedFix: "Move player back inside court area",
          autoFixAvailable: true,
          educationalNote: "Court boundaries are essential for valid formations",
        },
      };

      expect(violation.id).toBe("violation_123");
      expect(violation.violationType).toBe("court-boundary");
      expect(violation.severity).toBe("error");
      expect(violation.affectedPlayers).toEqual(["S"]);
      expect(violation.context.system).toBe("5-1");
      expect(violation.metadata?.autoFixAvailable).toBe(true);
    });

    it("should support all violation types", () => {
      const violationTypes: ViolationData["violationType"][] = [
        "positioning",
        "rotation",
        "formation",
        "court-boundary",
        "custom",
      ];

      violationTypes.forEach((violationType) => {
        const violation: ViolationData = {
          id: `violation_${violationType}`,
          code: "TEST_VIOLATION",
          message: "Test violation",
          affectedPlayers: [],
          severity: "warning",
          timestamp: Date.now(),
          violationType,
          context: {
            system: "5-1",
            rotation: 0,
            formation: "base",
            positions: {},
          },
        };

        expect(violation.violationType).toBe(violationType);
      });
    });

    it("should support all severity levels", () => {
      const severities: ViolationData["severity"][] = ["error", "warning", "info"];

      severities.forEach((severity) => {
        const violation: ViolationData = {
          id: `violation_${severity}`,
          code: "TEST_VIOLATION",
          message: "Test violation",
          affectedPlayers: [],
          severity,
          timestamp: Date.now(),
          violationType: "custom",
          context: {
            system: "5-1",
            rotation: 0,
            formation: "base",
            positions: {},
          },
        };

        expect(violation.severity).toBe(severity);
      });
    });
  });

  describe("ShareData", () => {
    it("should provide comprehensive sharing information", () => {
      const shareData: ShareData = {
        url: "https://volleyball.app/share/abc123",
        shortUrl: "https://v-ball.ly/abc",
        qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...",
        config: {
          initialSystem: "5-1",
          initialRotation: 2,
          initialFormation: "serveReceive",
        },
        positions: {
          system: "5-1",
          rotation: 2,
          formation: "serveReceive",
          positions: {},
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
        shareId: "share_abc123",
        metadata: {
          title: "Championship Formation",
          description: "Our winning 5-1 serve receive formation",
          tags: ["volleyball", "championship", "serve-receive"],
          expiresAt: Date.now() + 86400000, // 24 hours
          isPublic: true,
          shareMethod: "qr",
        },
      };

      expect(shareData.url).toMatch(/^https?:\/\//);
      expect(shareData.shortUrl).toMatch(/^https?:\/\//);
      expect(shareData.qrCode).toMatch(/^data:image/);
      expect(shareData.shareId).toBe("share_abc123");
      expect(shareData.metadata?.title).toBe("Championship Formation");
      expect(shareData.metadata?.tags).toContain("volleyball");
      expect(shareData.metadata?.shareMethod).toBe("qr");
    });

    it("should support all share methods", () => {
      const shareMethods: NonNullable<ShareData["metadata"]>["shareMethod"][] = [
        "url",
        "qr",
        "clipboard",
        "email",
        "social",
      ];

      shareMethods.forEach((shareMethod) => {
        const shareData: ShareData = {
          url: "https://example.com/share",
          config: {},
          positions: {
            system: "5-1",
            rotation: 0,
            formation: "base",
            positions: {},
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
          metadata: {
            shareMethod,
          },
        };

        expect(shareData.metadata?.shareMethod).toBe(shareMethod);
      });
    });
  });

  describe("ErrorData", () => {
    it("should provide comprehensive error information", () => {
      const error: ErrorData = {
        id: "error_456",
        type: "validation",
        message: "Player configuration validation failed",
        timestamp: Date.now(),
        severity: "high",
        details: {
          field: "playerRole",
          expectedValues: ["S", "Opp", "OH", "MB"],
          receivedValue: "INVALID",
        },
        context: {
          component: "PlayerConfigurationPanel",
          action: "updatePlayerRole",
          state: {
            playerId: "S",
            currentConfig: { role: "INVALID" },
          },
        },
        recovery: {
          isRecoverable: true,
          suggestedActions: [
            "Select a valid player role",
            "Reset to default configuration",
          ],
          autoRecoveryAttempted: false,
          retryable: true,
        },
      };

      expect(error.id).toBe("error_456");
      expect(error.type).toBe("validation");
      expect(error.severity).toBe("high");
      expect(error.context?.component).toBe("PlayerConfigurationPanel");
      expect(error.recovery?.isRecoverable).toBe(true);
      expect(error.recovery?.suggestedActions).toHaveLength(2);
    });

    it("should support all error types", () => {
      const errorTypes: ErrorData["type"][] = [
        "validation",
        "storage",
        "network",
        "permission",
        "configuration",
        "unknown",
      ];

      errorTypes.forEach((type) => {
        const error: ErrorData = {
          id: `error_${type}`,
          type,
          message: "Test error",
          timestamp: Date.now(),
          severity: "medium",
        };

        expect(error.type).toBe(type);
      });
    });

    it("should support all severity levels", () => {
      const severities: ErrorData["severity"][] = ["low", "medium", "high", "critical"];

      severities.forEach((severity) => {
        const error: ErrorData = {
          id: `error_${severity}`,
          type: "unknown",
          message: "Test error",
          timestamp: Date.now(),
          severity,
        };

        expect(error.severity).toBe(severity);
      });
    });
  });

  describe("PlayerDragData", () => {
    it("should track player drag operations", () => {
      const dragData: PlayerDragData = {
        playerId: "S",
        playerName: "Elite Setter",
        playerRole: "S",
        startPosition: { x: 100, y: 200, isCustom: false, lastModified: Date.now() },
        currentPosition: { x: 120, y: 210, isCustom: true, lastModified: Date.now() },
        endPosition: { x: 125, y: 215, isCustom: true, lastModified: Date.now() },
        isValid: true,
        violations: [],
        timestamp: Date.now(),
        metadata: {
          dragDistance: 25.5,
          dragDuration: 1200,
          snapToPosition: { x: 125, y: 215, isCustom: true, lastModified: Date.now() },
          constraintsBoundaries: {
            horizontalLines: [],
            verticalLines: [],
          },
        },
      };

      expect(dragData.playerId).toBe("S");
      expect(dragData.playerRole).toBe("S");
      expect(dragData.isValid).toBe(true);
      expect(dragData.metadata?.dragDistance).toBe(25.5);
      expect(dragData.metadata?.dragDuration).toBe(1200);
    });

    it("should support all player roles", () => {
      const roles: PlayerDragData["playerRole"][] = ["S", "Opp", "OH", "MB"];

      roles.forEach((role) => {
        const dragData: PlayerDragData = {
          playerId: `player_${role}`,
          playerName: `Test ${role}`,
          playerRole: role,
          isValid: true,
          violations: [],
          timestamp: Date.now(),
        };

        expect(dragData.playerRole).toBe(role);
      });
    });
  });

  describe("ValidationStateData", () => {
    it("should track validation state changes", () => {
      const validationData: ValidationStateData = {
        isValid: false,
        violations: [
          {
            id: "v1",
            code: "POSITIONING",
            message: "Invalid position",
            affectedPlayers: ["S"],
            severity: "error",
            timestamp: Date.now(),
            violationType: "positioning",
            context: {
              system: "5-1",
              rotation: 0,
              formation: "base",
              positions: {},
            },
          },
        ],
        warnings: [
          {
            id: "w1",
            code: "SUBOPTIMAL",
            message: "Suboptimal positioning",
            affectedPlayers: ["OH1"],
            severity: "warning",
            timestamp: Date.now(),
            violationType: "positioning",
            context: {
              system: "5-1",
              rotation: 0,
              formation: "base",
              positions: {},
            },
          },
        ],
        system: "5-1",
        rotation: 0,
        formation: "base",
        timestamp: Date.now(),
        metadata: {
          validationMode: "real-time",
          performanceMetrics: {
            validationTime: 12,
            constraintCalculationTime: 8,
          },
        },
      };

      expect(validationData.isValid).toBe(false);
      expect(validationData.violations).toHaveLength(1);
      expect(validationData.warnings).toHaveLength(1);
      expect(validationData.metadata?.validationMode).toBe("real-time");
      expect(validationData.metadata?.performanceMetrics?.validationTime).toBe(12);
    });

    it("should support all validation modes", () => {
      const validationModes: NonNullable<
        ValidationStateData["metadata"]
      >["validationMode"][] = ["real-time", "on-demand", "on-change"];

      validationModes.forEach((validationMode) => {
        const data: ValidationStateData = {
          isValid: true,
          violations: [],
          warnings: [],
          system: "5-1",
          rotation: 0,
          formation: "base",
          timestamp: Date.now(),
          metadata: {
            validationMode,
          },
        };

        expect(data.metadata?.validationMode).toBe(validationMode);
      });
    });
  });

  describe("ConfigurationChangeData", () => {
    it("should track configuration changes", () => {
      const configData: ConfigurationChangeData = {
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

      expect(configData.changedKeys).toEqual([
        "appearance.theme",
        "validation.enableRealTimeValidation",
      ]);
      expect(configData.changeType).toBe("user");
      expect(configData.metadata?.triggeredBy).toBe("ConfigurationPanel");
      expect(configData.metadata?.affectedComponents).toContain("CourtVisualization");
    });

    it("should support all change types", () => {
      const changeTypes: ConfigurationChangeData["changeType"][] = [
        "user",
        "preset",
        "programmatic",
      ];

      changeTypes.forEach((changeType) => {
        const data: ConfigurationChangeData = {
          changedKeys: ["test.field"],
          previousConfig: {},
          newConfig: {},
          timestamp: Date.now(),
          changeType,
        };

        expect(data.changeType).toBe(changeType);
      });
    });
  });

  describe("SystemChangeData", () => {
    it("should track system changes", () => {
      const systemData: SystemChangeData = {
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

      expect(systemData.previousSystem).toBe("5-1");
      expect(systemData.newSystem).toBe("6-2");
      expect(systemData.changeType).toBe("manual");
      expect(systemData.metadata?.playersChanged).toBe(true);
      expect(systemData.metadata?.rotationsChanged).toBe(true);
      expect(systemData.metadata?.positionsReset).toBe(true);
    });

    it("should support all change types", () => {
      const changeTypes: SystemChangeData["changeType"][] = ["manual", "programmatic"];

      changeTypes.forEach((changeType) => {
        const data: SystemChangeData = {
          previousSystem: "5-1",
          newSystem: "6-2",
          timestamp: Date.now(),
          changeType,
        };

        expect(data.changeType).toBe(changeType);
      });
    });
  });

  describe("Callback data consistency", () => {
    it("should have consistent timestamp fields", () => {
      const now = Date.now();

      const positionData: PositionData = {
        system: "5-1",
        rotation: 0,
        formation: "base",
        positions: {},
        timestamp: now,
      };

      const violationData: ViolationData = {
        id: "v1",
        code: "TEST",
        message: "Test",
        affectedPlayers: [],
        severity: "info",
        timestamp: now,
        violationType: "custom",
        context: {
          system: "5-1",
          rotation: 0,
          formation: "base",
          positions: {},
        },
      };

      const shareData: ShareData = {
        url: "https://example.com",
        config: {},
        positions: positionData,
        timestamp: now,
      };

      const errorData: ErrorData = {
        id: "e1",
        type: "unknown",
        message: "Test error",
        timestamp: now,
        severity: "low",
      };

      expect(positionData.timestamp).toBe(now);
      expect(violationData.timestamp).toBe(now);
      expect(shareData.timestamp).toBe(now);
      expect(errorData.timestamp).toBe(now);
    });

    it("should have consistent system/rotation/formation context", () => {
      const systemContext = {
        system: "6-2" as const,
        rotation: 3,
        formation: "serveReceive" as const,
      };

      const positionData: PositionData = {
        ...systemContext,
        positions: {},
        timestamp: Date.now(),
      };

      const violationContext = {
        ...systemContext,
        positions: {},
      };

      const validationData: ValidationStateData = {
        isValid: true,
        violations: [],
        warnings: [],
        ...systemContext,
        timestamp: Date.now(),
      };

      expect(positionData.system).toBe(systemContext.system);
      expect(positionData.rotation).toBe(systemContext.rotation);
      expect(positionData.formation).toBe(systemContext.formation);

      expect(validationData.system).toBe(systemContext.system);
      expect(validationData.rotation).toBe(systemContext.rotation);
      expect(validationData.formation).toBe(systemContext.formation);
    });
  });
});