/**
 * Unit tests for VolleyballCourtRulesIntegration
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  VolleyballCourtRulesIntegration,
  type RulesIntegrationConfig,
  type PositionValidationContext,
} from "../VolleyballCourtRulesIntegration";
import { VolleyballRulesEngine } from "@/volleyball-rules-engine/VolleyballRulesEngine";
import { OptimizedConstraintCalculator } from "@/volleyball-rules-engine/validation/OptimizedConstraintCalculator";
import { StateConverter } from "@/volleyball-rules-engine/utils/StateConverter";
import { CoordinateTransformer } from "@/volleyball-rules-engine/utils/CoordinateTransformer";
import type { PlayerPosition } from "@/types/positioning";
import type { RotationSlot } from "@/volleyball-rules-engine/types/PlayerState";

// Mock the volleyball rules engine modules
vi.mock("@/volleyball-rules-engine/VolleyballRulesEngine");
vi.mock("@/volleyball-rules-engine/validation/OptimizedConstraintCalculator");
vi.mock("@/volleyball-rules-engine/utils/StateConverter");
vi.mock("@/volleyball-rules-engine/utils/CoordinateTransformer");

describe("VolleyballCourtRulesIntegration", () => {
  let integration: VolleyballCourtRulesIntegration;
  let config: RulesIntegrationConfig;

  const mockPositions: Record<string, PlayerPosition> = {
    S: { x: 300, y: 180, isCustom: false, lastModified: new Date() },
    Opp: { x: 100, y: 180, isCustom: false, lastModified: new Date() },
    OH1: { x: 500, y: 180, isCustom: false, lastModified: new Date() },
    OH2: { x: 500, y: 300, isCustom: false, lastModified: new Date() },
    MB1: { x: 300, y: 300, isCustom: false, lastModified: new Date() },
    MB2: { x: 100, y: 300, isCustom: false, lastModified: new Date() },
  };

  const mockRotationMap = {
    1: "S",
    2: "MB1",
    3: "Opp",
    4: "MB2",
    5: "OH1",
    6: "OH2",
  };

  beforeEach(() => {
    config = {
      courtDimensions: { width: 600, height: 360 },
      enableRealTimeValidation: true,
      enableConstraintBoundaries: true,
      enablePositionSnapping: true,
      serverSlot: 1,
    };

    integration = new VolleyballCourtRulesIntegration(config);

    // Reset mocks
    vi.clearAllMocks();
  });

  describe("constructor and configuration", () => {
    it("should initialize with provided configuration", () => {
      expect(integration).toBeDefined();
      expect(integration.getPerformanceMetrics).toBeDefined();
    });

    it("should update configuration", () => {
      const newConfig = {
        enableRealTimeValidation: false,
        enableConstraintBoundaries: false,
      };

      integration.updateConfig(newConfig);

      // Verify cache is cleared when config updates
      expect(integration.getPerformanceMetrics().validationCacheSize).toBe(0);
      expect(integration.getPerformanceMetrics().constraintCacheSize).toBe(0);
    });
  });

  describe("validateLineup", () => {
    it("should validate a complete lineup successfully", () => {
      // Mock StateConverter
      const mockVolleyballStates = [
        { id: "S", slot: 1 as RotationSlot, x: 4.5, y: 5.5, isServer: true },
        { id: "MB1", slot: 2 as RotationSlot, x: 4.5, y: 3.0, isServer: false },
      ];

      vi.mocked(StateConverter.formationToVolleyballStates).mockReturnValue(
        mockVolleyballStates
      );

      // Mock VolleyballRulesEngine
      const mockValidationResult = {
        isLegal: true,
        violations: [],
      };

      vi.mocked(VolleyballRulesEngine.validateLineup).mockReturnValue(
        mockValidationResult
      );

      const result = integration.validateLineup(
        mockPositions,
        mockRotationMap,
        1
      );

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(StateConverter.formationToVolleyballStates).toHaveBeenCalledWith(
        mockPositions,
        mockRotationMap,
        1
      );
      expect(VolleyballRulesEngine.validateLineup).toHaveBeenCalledWith(
        mockVolleyballStates
      );
    });

    it("should handle validation violations", () => {
      // Mock StateConverter
      const mockVolleyballStates = [
        { id: "S", slot: 1 as RotationSlot, x: 4.5, y: 5.5, isServer: true },
        { id: "MB1", slot: 2 as RotationSlot, x: 4.5, y: 3.0, isServer: false },
      ];

      vi.mocked(StateConverter.formationToVolleyballStates).mockReturnValue(
        mockVolleyballStates
      );

      // Mock validation with violations
      const mockValidationResult = {
        isLegal: false,
        violations: [
          {
            code: "ROW_ORDER" as const,
            message: "Row order violation",
            slots: [1 as RotationSlot, 2 as RotationSlot],
          },
        ],
      };

      vi.mocked(VolleyballRulesEngine.validateLineup).mockReturnValue(
        mockValidationResult
      );

      const result = integration.validateLineup(
        mockPositions,
        mockRotationMap,
        1
      );

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toEqual({
        code: "ROW_ORDER",
        message: "Row order violation",
        affectedPlayers: ["S", "MB1"],
        severity: "warning",
      });
    });

    it("should handle validation errors gracefully", () => {
      vi.mocked(StateConverter.formationToVolleyballStates).mockImplementation(
        () => {
          throw new Error("Conversion error");
        }
      );

      const result = integration.validateLineup(
        mockPositions,
        mockRotationMap,
        1
      );

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].code).toBe("VALIDATION_ERROR");
      expect(result.violations[0].severity).toBe("error");
    });
  });

  describe("validatePlayerPosition", () => {
    let context: PositionValidationContext;

    beforeEach(() => {
      context = {
        playerId: "S",
        slot: 1 as RotationSlot,
        currentPosition: mockPositions["S"],
        allPositions: mockPositions,
        rotationMap: mockRotationMap,
        system: "5-1",
        formation: "base",
        isServer: true,
      };
    });

    it("should validate a valid player position", () => {
      // Mock coordinate conversion
      vi.mocked(StateConverter.playerPositionToVolleyball).mockReturnValue({
        x: 4.5,
        y: 5.5,
      });
      vi.mocked(StateConverter.formationToVolleyballStates).mockReturnValue([]);
      vi.mocked(VolleyballRulesEngine.isValidPosition).mockReturnValue(true);

      const result = integration.validatePlayerPosition(context);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should detect invalid player position", () => {
      // Mock coordinate conversion
      vi.mocked(StateConverter.playerPositionToVolleyball).mockReturnValue({
        x: 4.5,
        y: 5.5,
      });
      vi.mocked(StateConverter.formationToVolleyballStates).mockReturnValue([]);
      vi.mocked(VolleyballRulesEngine.isValidPosition).mockReturnValue(false);

      // Mock full validation for violations
      vi.mocked(VolleyballRulesEngine.validateLineup).mockReturnValue({
        isLegal: false,
        violations: [
          {
            code: "ROW_ORDER" as const,
            message: "Position violation",
            slots: [1 as RotationSlot],
          },
        ],
      });

      const result = integration.validatePlayerPosition(context);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].affectedPlayers).toContain("S");
    });

    it("should skip validation when disabled", () => {
      integration.updateConfig({ enableRealTimeValidation: false });

      const result = integration.validatePlayerPosition(context);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(VolleyballRulesEngine.isValidPosition).not.toHaveBeenCalled();
    });

    it("should use caching for repeated validations", () => {
      // Mock coordinate conversion
      vi.mocked(StateConverter.playerPositionToVolleyball).mockReturnValue({
        x: 4.5,
        y: 5.5,
      });
      vi.mocked(StateConverter.formationToVolleyballStates).mockReturnValue([]);
      vi.mocked(VolleyballRulesEngine.isValidPosition).mockReturnValue(true);

      // First validation
      const result1 = integration.validatePlayerPosition(context);

      // Second validation with same context
      const result2 = integration.validatePlayerPosition(context);

      expect(result1).toEqual(result2);
      // Should only call the rules engine once due to caching
      expect(VolleyballRulesEngine.isValidPosition).toHaveBeenCalledTimes(1);
    });
  });

  describe("calculateConstraintBoundaries", () => {
    let context: PositionValidationContext;

    beforeEach(() => {
      context = {
        playerId: "S",
        slot: 1 as RotationSlot,
        currentPosition: mockPositions["S"],
        allPositions: mockPositions,
        rotationMap: mockRotationMap,
        system: "5-1",
        formation: "base",
        isServer: true,
      };
    });

    it("should calculate constraint boundaries", () => {
      // Mock StateConverter
      vi.mocked(StateConverter.formationToVolleyballStates).mockReturnValue([]);

      // Mock OptimizedConstraintCalculator
      const mockConstraints = {
        isConstrained: true,
        minX: 3.0,
        maxX: 6.0,
        minY: 4.0,
        maxY: 7.0,
        constraintReasons: ["Test constraint"],
      };

      vi.mocked(
        OptimizedConstraintCalculator.calculateOptimizedConstraints
      ).mockReturnValue(mockConstraints);

      // Mock coordinate transformation
      vi.mocked(CoordinateTransformer.volleyballToScreen)
        .mockReturnValueOnce({ x: 180, y: 144 }) // minX, minY
        .mockReturnValueOnce({ x: 360, y: 252 }) // maxX, maxY
        .mockReturnValueOnce({ x: 180, y: 0 }) // minX for vertical line
        .mockReturnValueOnce({ x: 360, y: 0 }); // maxX for vertical line

      const result = integration.calculateConstraintBoundaries(context);

      expect(result.horizontalLines).toHaveLength(2);
      expect(result.verticalLines).toHaveLength(2);
      expect(result.validArea).toBeDefined();
      expect(result.validArea?.minX).toBe(180);
      expect(result.validArea?.maxX).toBe(360);
    });

    it("should handle unconstrained positions", () => {
      // Mock StateConverter
      vi.mocked(StateConverter.formationToVolleyballStates).mockReturnValue([]);

      // Mock OptimizedConstraintCalculator with no constraints
      const mockConstraints = {
        isConstrained: false,
        minX: 0,
        maxX: 9,
        minY: 0,
        maxY: 11,
        constraintReasons: [],
      };

      vi.mocked(
        OptimizedConstraintCalculator.calculateOptimizedConstraints
      ).mockReturnValue(mockConstraints);

      const result = integration.calculateConstraintBoundaries(context);

      expect(result.horizontalLines).toHaveLength(0);
      expect(result.verticalLines).toHaveLength(0);
    });

    it("should use caching for constraint calculations", () => {
      // Mock StateConverter
      vi.mocked(StateConverter.formationToVolleyballStates).mockReturnValue([]);

      // Mock OptimizedConstraintCalculator
      const mockConstraints = {
        isConstrained: true,
        minX: 3.0,
        maxX: 6.0,
        minY: 4.0,
        maxY: 7.0,
        constraintReasons: [],
      };

      vi.mocked(
        OptimizedConstraintCalculator.calculateOptimizedConstraints
      ).mockReturnValue(mockConstraints);

      // Mock coordinate transformation
      vi.mocked(CoordinateTransformer.volleyballToScreen).mockReturnValue({
        x: 300,
        y: 180,
      });

      // First calculation
      const result1 = integration.calculateConstraintBoundaries(context);

      // Second calculation with same context
      const result2 = integration.calculateConstraintBoundaries(context);

      expect(result1).toEqual(result2);
      // Should only call the calculator once due to caching
      expect(
        OptimizedConstraintCalculator.calculateOptimizedConstraints
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("snapToValidPosition", () => {
    let context: PositionValidationContext;

    beforeEach(() => {
      context = {
        playerId: "S",
        slot: 1 as RotationSlot,
        currentPosition: mockPositions["S"],
        allPositions: mockPositions,
        rotationMap: mockRotationMap,
        system: "5-1",
        formation: "base",
        isServer: true,
      };
    });

    it("should snap to valid position", () => {
      // Mock coordinate conversions
      vi.mocked(StateConverter.playerPositionToVolleyball).mockReturnValue({
        x: 4.5,
        y: 5.5,
      });
      vi.mocked(StateConverter.formationToVolleyballStates).mockReturnValue([]);

      const snappedVolleyballPosition = { x: 4.0, y: 5.0 };
      vi.mocked(VolleyballRulesEngine.snapToValidPosition).mockReturnValue(
        snappedVolleyballPosition
      );

      const snappedScreenPosition = {
        x: 240,
        y: 200,
        isCustom: true,
        lastModified: expect.any(Date),
      };
      vi.mocked(StateConverter.volleyballToPlayerPosition).mockReturnValue(
        snappedScreenPosition
      );

      const result = integration.snapToValidPosition(context);

      expect(result).toEqual(snappedScreenPosition);
      expect(VolleyballRulesEngine.snapToValidPosition).toHaveBeenCalledWith(
        context.slot,
        { x: 4.5, y: 5.5 },
        []
      );
    });

    it("should handle snapping errors gracefully", () => {
      vi.mocked(StateConverter.playerPositionToVolleyball).mockImplementation(
        () => {
          throw new Error("Conversion error");
        }
      );

      const result = integration.snapToValidPosition(context);

      expect(result).toEqual(context.currentPosition);
    });
  });

  describe("getDragConstraints", () => {
    it("should return drag constraints", () => {
      // Mock StateConverter
      vi.mocked(StateConverter.formationToVolleyballStates).mockReturnValue([]);

      // Mock OptimizedConstraintCalculator
      const mockConstraints = {
        isConstrained: true,
        minX: 3.0,
        maxX: 6.0,
        minY: 4.0,
        maxY: 7.0,
        constraintReasons: [],
      };

      vi.mocked(
        OptimizedConstraintCalculator.calculateOptimizedConstraints
      ).mockReturnValue(mockConstraints);

      // Mock coordinate transformation for valid area
      vi.mocked(CoordinateTransformer.volleyballToScreen)
        .mockReturnValueOnce({ x: 180, y: 144 }) // minX, minY
        .mockReturnValueOnce({ x: 360, y: 252 }); // maxX, maxY

      const result = integration.getDragConstraints(
        "S",
        1,
        mockPositions,
        mockRotationMap,
        true
      );

      expect(result).toEqual({
        minX: 180,
        maxX: 360,
        minY: 144,
        maxY: 252,
      });
    });

    it("should return null for unconstrained positions", () => {
      // Mock StateConverter
      vi.mocked(StateConverter.formationToVolleyballStates).mockReturnValue([]);

      // Mock OptimizedConstraintCalculator with no constraints
      const mockConstraints = {
        isConstrained: false,
        minX: 0,
        maxX: 9,
        minY: 0,
        maxY: 11,
        constraintReasons: [],
      };

      vi.mocked(
        OptimizedConstraintCalculator.calculateOptimizedConstraints
      ).mockReturnValue(mockConstraints);

      const result = integration.getDragConstraints(
        "S",
        1,
        mockPositions,
        mockRotationMap,
        true
      );

      expect(result).toBeNull();
    });

    it("should handle errors gracefully", () => {
      vi.mocked(StateConverter.formationToVolleyballStates).mockImplementation(
        () => {
          throw new Error("Conversion error");
        }
      );

      const result = integration.getDragConstraints(
        "S",
        1,
        mockPositions,
        mockRotationMap,
        true
      );

      expect(result).toBeNull();
    });
  });

  describe("coordinate conversion utilities", () => {
    it("should provide coordinate conversion methods", () => {
      expect(integration.convertCoordinates.screenToVolleyball).toBeDefined();
      expect(integration.convertCoordinates.volleyballToScreen).toBeDefined();
      expect(
        integration.convertCoordinates.playerPositionToVolleyball
      ).toBeDefined();
      expect(
        integration.convertCoordinates.volleyballToPlayerPosition
      ).toBeDefined();
    });

    it("should delegate to appropriate converters", () => {
      // Clear mocks to avoid interference from previous tests
      vi.clearAllMocks();

      integration.convertCoordinates.screenToVolleyball(300, 180);
      expect(CoordinateTransformer.screenToVolleyball).toHaveBeenCalledWith(
        300,
        180
      );

      integration.convertCoordinates.volleyballToScreen(4.5, 5.5);
      expect(CoordinateTransformer.volleyballToScreen).toHaveBeenCalledWith(
        4.5,
        5.5
      );

      const position = {
        x: 300,
        y: 180,
        isCustom: true,
        lastModified: new Date(),
      };
      integration.convertCoordinates.playerPositionToVolleyball(position);
      expect(StateConverter.playerPositionToVolleyball).toHaveBeenCalledWith(
        position
      );

      integration.convertCoordinates.volleyballToPlayerPosition(
        { x: 4.5, y: 5.5 },
        true
      );
      expect(StateConverter.volleyballToPlayerPosition).toHaveBeenCalledWith(
        { x: 4.5, y: 5.5 },
        true
      );
    });
  });

  describe("cache management", () => {
    it("should clear all caches", () => {
      // Populate caches by running some operations
      const context: PositionValidationContext = {
        playerId: "S",
        slot: 1 as RotationSlot,
        currentPosition: mockPositions["S"],
        allPositions: mockPositions,
        rotationMap: mockRotationMap,
        system: "5-1",
        formation: "base",
        isServer: true,
      };

      // Mock methods to populate caches
      vi.mocked(StateConverter.playerPositionToVolleyball).mockReturnValue({
        x: 4.5,
        y: 5.5,
      });
      vi.mocked(StateConverter.formationToVolleyballStates).mockReturnValue([]);
      vi.mocked(VolleyballRulesEngine.isValidPosition).mockReturnValue(true);
      vi.mocked(
        OptimizedConstraintCalculator.calculateOptimizedConstraints
      ).mockReturnValue({
        isConstrained: false,
        minX: 0,
        maxX: 9,
        minY: 0,
        maxY: 11,
        constraintReasons: [],
      });

      // Populate caches
      integration.validatePlayerPosition(context);
      integration.calculateConstraintBoundaries(context);

      // Verify caches have content
      const metricsBefore = integration.getPerformanceMetrics();
      expect(metricsBefore.validationCacheSize).toBeGreaterThan(0);
      expect(metricsBefore.constraintCacheSize).toBeGreaterThan(0);

      // Clear caches
      integration.clearCache();

      // Verify caches are empty
      const metricsAfter = integration.getPerformanceMetrics();
      expect(metricsAfter.validationCacheSize).toBe(0);
      expect(metricsAfter.constraintCacheSize).toBe(0);
    });
  });

  describe("performance metrics", () => {
    it("should return performance metrics", () => {
      // Mock OptimizedConstraintCalculator metrics
      vi.mocked(
        OptimizedConstraintCalculator.getPerformanceMetrics
      ).mockReturnValue({
        totalCalculations: 10,
        cacheHits: 5,
        incrementalUpdates: 2,
        fullRecalculations: 8,
        averageCalculationTime: 1.5,
        cacheMetrics: {
          size: 15,
          hits: 8,
          misses: 7,
          hitRate: 0.53,
        },
      });

      const metrics = integration.getPerformanceMetrics();

      expect(metrics).toEqual({
        validationCacheSize: 0,
        constraintCacheSize: 0,
        rulesEngineMetrics: {
          totalCalculations: 10,
          cacheHits: 5,
          incrementalUpdates: 2,
          fullRecalculations: 8,
          averageCalculationTime: 1.5,
          cacheMetrics: {
            size: 15,
            hits: 8,
            misses: 7,
            hitRate: 0.53,
          },
        },
      });
    });
  });
});
