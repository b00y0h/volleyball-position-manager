/**
 * VolleyballCourtRulesIntegration class for rules engine integration
 * Provides a clean interface between the VolleyballCourt component and the volleyball rules engine
 */

import { VolleyballRulesEngine } from "@/volleyball-rules-engine/VolleyballRulesEngine";
import { OptimizedConstraintCalculator } from "@/volleyball-rules-engine/validation/OptimizedConstraintCalculator";
import { StateConverter } from "@/volleyball-rules-engine/utils/StateConverter";
import { CoordinateTransformer } from "@/volleyball-rules-engine/utils/CoordinateTransformer";
import type {
  PlayerState,
  RotationSlot,
} from "@/volleyball-rules-engine/types/PlayerState";
import type { PositionBounds } from "@/volleyball-rules-engine/types/ValidationResult";
import type {
  PlayerPosition,
  SystemType,
  FormationType,
} from "@/types/positioning";
import type {
  CourtDimensions,
  ConstraintBoundaries,
  ViolationData,
} from "./types";

/**
 * Configuration for rules integration
 */
export interface RulesIntegrationConfig {
  courtDimensions: CourtDimensions;
  enableRealTimeValidation: boolean;
  enableConstraintBoundaries: boolean;
  enablePositionSnapping: boolean;
  serverSlot?: RotationSlot;
}

/**
 * Validation result with screen coordinate context
 */
export interface ScreenValidationResult {
  isValid: boolean;
  violations: ViolationData[];
  constraintBoundaries?: ConstraintBoundaries;
  snappedPosition?: PlayerPosition;
}

/**
 * Position validation context
 */
export interface PositionValidationContext {
  playerId: string;
  slot: RotationSlot;
  currentPosition: PlayerPosition;
  allPositions: Record<string, PlayerPosition>;
  rotationMap: Record<number, string>;
  system: SystemType;
  formation: FormationType;
  isServer: boolean;
}

/**
 * Main integration class for volleyball rules engine
 */
export class VolleyballCourtRulesIntegration {
  private config: RulesIntegrationConfig;
  private lastValidationCache = new Map<string, ScreenValidationResult>();
  private constraintCache = new Map<string, ConstraintBoundaries>();

  constructor(config: RulesIntegrationConfig) {
    this.config = config;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RulesIntegrationConfig>): void {
    this.config = { ...this.config, ...config };
    this.clearCache();
  }

  /**
   * Validate a complete lineup using the volleyball rules engine
   */
  validateLineup(
    positions: Record<string, PlayerPosition>,
    rotationMap: Record<number, string>,
    serverSlot: RotationSlot = 1
  ): ScreenValidationResult {
    try {
      // Convert screen positions to volleyball states
      const volleyballStates = StateConverter.formationToVolleyballStates(
        positions,
        rotationMap,
        serverSlot
      );

      // Validate using rules engine
      const validationResult =
        VolleyballRulesEngine.validateLineup(volleyballStates);

      // Convert violations to screen format
      const violations: ViolationData[] = validationResult.violations.map(
        (violation) => ({
          code: violation.code,
          message: violation.message,
          affectedPlayers: violation.slots
            .map((slot) => rotationMap[slot])
            .filter(Boolean),
          severity: violation.code === "INVALID_LINEUP" ? "error" : "warning",
        })
      );

      return {
        isValid: validationResult.isLegal,
        violations,
      };
    } catch (error) {
      console.warn("Error validating lineup:", error);
      return {
        isValid: false,
        violations: [
          {
            code: "VALIDATION_ERROR",
            message: "Unable to validate lineup due to internal error",
            affectedPlayers: [],
            severity: "error",
          },
        ],
      };
    }
  }

  /**
   * Validate a single player position
   */
  validatePlayerPosition(
    context: PositionValidationContext
  ): ScreenValidationResult {
    if (!this.config.enableRealTimeValidation) {
      return { isValid: true, violations: [] };
    }

    try {
      // Create cache key
      const cacheKey = this.createValidationCacheKey(context);

      // Check cache first
      if (this.lastValidationCache.has(cacheKey)) {
        return this.lastValidationCache.get(cacheKey)!;
      }

      // Convert to volleyball coordinates
      const volleyballPosition = StateConverter.playerPositionToVolleyball(
        context.currentPosition
      );

      // Create updated positions for validation
      const updatedPositions = {
        ...context.allPositions,
        [context.playerId]: context.currentPosition,
      };

      // Convert all positions to volleyball states
      const volleyballStates = StateConverter.formationToVolleyballStates(
        updatedPositions,
        context.rotationMap,
        this.config.serverSlot || 1
      );

      // Validate the position
      const isValidPosition = VolleyballRulesEngine.isValidPosition(
        context.slot,
        volleyballPosition,
        volleyballStates
      );

      let violations: ViolationData[] = [];
      let constraintBoundaries: ConstraintBoundaries | undefined;
      let snappedPosition: PlayerPosition | undefined;

      if (!isValidPosition) {
        // Get full lineup validation for detailed violations
        const fullValidation =
          VolleyballRulesEngine.validateLineup(volleyballStates);

        violations = fullValidation.violations
          .filter((v) => v.slots.includes(context.slot))
          .map((violation) => ({
            code: violation.code,
            message: violation.message,
            affectedPlayers: [context.playerId],
            severity: "error" as const,
          }));

        // Calculate constraint boundaries if enabled
        if (this.config.enableConstraintBoundaries) {
          constraintBoundaries = this.calculateConstraintBoundaries(context);
        }

        // Calculate snapped position if enabled
        if (this.config.enablePositionSnapping) {
          snappedPosition = this.snapToValidPosition(context);
        }
      }

      const result: ScreenValidationResult = {
        isValid: isValidPosition,
        violations,
        constraintBoundaries,
        snappedPosition,
      };

      // Cache the result
      this.lastValidationCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.warn("Error validating player position:", error);
      return {
        isValid: false,
        violations: [
          {
            code: "VALIDATION_ERROR",
            message: "Unable to validate position due to internal error",
            affectedPlayers: [context.playerId],
            severity: "error",
          },
        ],
      };
    }
  }

  /**
   * Calculate constraint boundaries for a player
   */
  calculateConstraintBoundaries(
    context: PositionValidationContext
  ): ConstraintBoundaries {
    try {
      // Check cache first
      const cacheKey = this.createConstraintCacheKey(context);
      if (this.constraintCache.has(cacheKey)) {
        return this.constraintCache.get(cacheKey)!;
      }

      // Convert positions to volleyball states
      const volleyballStates = StateConverter.formationToVolleyballStates(
        context.allPositions,
        context.rotationMap,
        this.config.serverSlot || 1
      );

      // Create position map
      const positionMap = new Map<RotationSlot, PlayerState>();
      volleyballStates.forEach((state) => {
        positionMap.set(state.slot, state);
      });

      // Calculate constraints using optimized calculator
      const constraints =
        OptimizedConstraintCalculator.calculateOptimizedConstraints(
          context.slot,
          positionMap,
          context.isServer
        );

      // Convert volleyball constraints to screen coordinates
      const screenConstraints = this.convertConstraintsToScreen(constraints);

      // Cache the result
      this.constraintCache.set(cacheKey, screenConstraints);

      return screenConstraints;
    } catch (error) {
      console.warn("Error calculating constraint boundaries:", error);
      return {
        horizontalLines: [],
        verticalLines: [],
      };
    }
  }

  /**
   * Snap position to nearest valid location
   */
  snapToValidPosition(context: PositionValidationContext): PlayerPosition {
    try {
      // Convert to volleyball coordinates
      const volleyballPosition = StateConverter.playerPositionToVolleyball(
        context.currentPosition
      );

      // Convert all positions to volleyball states
      const volleyballStates = StateConverter.formationToVolleyballStates(
        context.allPositions,
        context.rotationMap,
        this.config.serverSlot || 1
      );

      // Snap to valid position using rules engine
      const snappedVolleyballPosition =
        VolleyballRulesEngine.snapToValidPosition(
          context.slot,
          volleyballPosition,
          volleyballStates
        );

      // Convert back to screen coordinates
      return StateConverter.volleyballToPlayerPosition(
        snappedVolleyballPosition,
        true
      );
    } catch (error) {
      console.warn("Error snapping to valid position:", error);
      return context.currentPosition;
    }
  }

  /**
   * Get constraint boundaries for drag operations
   */
  getDragConstraints(
    playerId: string,
    slot: RotationSlot,
    positions: Record<string, PlayerPosition>,
    rotationMap: Record<number, string>,
    isServer: boolean = false
  ): { minX: number; maxX: number; minY: number; maxY: number } | null {
    try {
      const context: PositionValidationContext = {
        playerId,
        slot,
        currentPosition: positions[playerId],
        allPositions: positions,
        rotationMap,
        system: "5-1", // Default system
        formation: "base", // Default formation
        isServer,
      };

      const boundaries = this.calculateConstraintBoundaries(context);

      if (boundaries.validArea) {
        return {
          minX: Math.max(0, boundaries.validArea.minX),
          maxX: Math.min(
            this.config.courtDimensions.width,
            boundaries.validArea.maxX
          ),
          minY: Math.max(0, boundaries.validArea.minY),
          maxY: Math.min(
            this.config.courtDimensions.height,
            boundaries.validArea.maxY
          ),
        };
      }

      return null;
    } catch (error) {
      console.warn("Error getting drag constraints:", error);
      return null;
    }
  }

  /**
   * Convert coordinate systems between screen and volleyball
   */
  convertCoordinates = {
    screenToVolleyball: (x: number, y: number) =>
      CoordinateTransformer.screenToVolleyball(x, y),

    volleyballToScreen: (x: number, y: number) =>
      CoordinateTransformer.volleyballToScreen(x, y),

    playerPositionToVolleyball: (position: PlayerPosition) =>
      StateConverter.playerPositionToVolleyball(position),

    volleyballToPlayerPosition: (
      point: { x: number; y: number },
      isCustom: boolean = true
    ) => StateConverter.volleyballToPlayerPosition(point, isCustom),
  };

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.lastValidationCache.clear();
    this.constraintCache.clear();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      validationCacheSize: this.lastValidationCache.size,
      constraintCacheSize: this.constraintCache.size,
      rulesEngineMetrics: OptimizedConstraintCalculator.getPerformanceMetrics(),
    };
  }

  // Private helper methods

  private createValidationCacheKey(context: PositionValidationContext): string {
    return `${context.playerId}-${context.slot}-${context.currentPosition.x}-${
      context.currentPosition.y
    }-${context.isServer}-${JSON.stringify(context.rotationMap)}`;
  }

  private createConstraintCacheKey(context: PositionValidationContext): string {
    const otherPositions = Object.entries(context.allPositions)
      .filter(([id]) => id !== context.playerId)
      .map(([id, pos]) => `${id}:${pos.x},${pos.y}`)
      .sort()
      .join("|");

    return `${context.slot}-${context.isServer}-${otherPositions}`;
  }

  private convertConstraintsToScreen(
    constraints: PositionBounds
  ): ConstraintBoundaries {
    const horizontalLines: Array<{
      position: number;
      type: "min" | "max";
      reason: string;
    }> = [];
    const verticalLines: Array<{
      position: number;
      type: "min" | "max";
      reason: string;
    }> = [];

    // Only process if constraints exist and are constrained
    if (!constraints || !constraints.isConstrained) {
      return {
        horizontalLines,
        verticalLines,
      };
    }

    try {
      // Convert Y constraints (volleyball Y to screen Y)
      if (constraints.minY > 0) {
        const screenY = CoordinateTransformer.volleyballToScreen(
          0,
          constraints.minY
        ).y;
        horizontalLines.push({
          position: screenY,
          type: "min",
          reason: "Minimum Y position constraint",
        });
      }

      if (constraints.maxY < 11) {
        // Volleyball court length
        const screenY = CoordinateTransformer.volleyballToScreen(
          0,
          constraints.maxY
        ).y;
        horizontalLines.push({
          position: screenY,
          type: "max",
          reason: "Maximum Y position constraint",
        });
      }

      // Convert X constraints (volleyball X to screen X)
      if (constraints.minX > 0) {
        const screenX = CoordinateTransformer.volleyballToScreen(
          constraints.minX,
          0
        ).x;
        verticalLines.push({
          position: screenX,
          type: "min",
          reason: "Minimum X position constraint",
        });
      }

      if (constraints.maxX < 9) {
        // Volleyball court width
        const screenX = CoordinateTransformer.volleyballToScreen(
          constraints.maxX,
          0
        ).x;
        verticalLines.push({
          position: screenX,
          type: "max",
          reason: "Maximum X position constraint",
        });
      }

      // Create valid area bounding box in screen coordinates
      const topLeft = CoordinateTransformer.volleyballToScreen(
        constraints.minX,
        constraints.minY
      );
      const bottomRight = CoordinateTransformer.volleyballToScreen(
        constraints.maxX,
        constraints.maxY
      );

      const validArea = {
        minX: Math.max(0, topLeft.x),
        maxX: Math.min(this.config.courtDimensions.width, bottomRight.x),
        minY: Math.max(0, topLeft.y),
        maxY: Math.min(this.config.courtDimensions.height, bottomRight.y),
      };

      return {
        horizontalLines,
        verticalLines,
        validArea,
      };
    } catch (error) {
      console.warn(
        "Error converting constraints to screen coordinates:",
        error
      );
      return {
        horizontalLines,
        verticalLines,
      };
    }
  }
}
