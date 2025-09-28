/**
 * Main Volleyball Rules Engine API
 *
 * A comprehensive TypeScript library for validating volleyball player positioning
 * according to official overlap and rotation fault rules for indoor 6-on-6 volleyball.
 *
 * This class provides a clean, high-level API for common validation and constraint
 * operations while maintaining access to lower-level utilities for advanced use cases.
 *
 * @example
 * ```typescript
 * import { VolleyballRulesEngine } from './VolleyballRulesEngine';
 *
 * // Validate a lineup
 * const result = VolleyballRulesEngine.validateLineup(players);
 * if (!result.isLegal) {
 *   console.log('Violations:', result.violations);
 * }
 *
 * // Get constraints for drag operations
 * const constraints = VolleyballRulesEngine.getPlayerConstraints(3, players);
 * ```
 */

import type {
  PlayerState,
  RotationSlot,
  Role,
  OverlapResult,
  PositionBounds,
  Violation,
} from "./types/index";

import { OverlapValidator } from "./validation/OverlapValidator";
import { ConstraintCalculator } from "./validation/ConstraintCalculator";
import { PositionHelpers } from "./utils/PositionHelpers";
import { CoordinateTransformer } from "./utils/CoordinateTransformer";
import { StateConverter } from "./utils/StateConverter";
import { validateLineup, createSlotMap } from "./utils/ValidationUtils";
import { COORDINATE_SYSTEM } from "./types/index";

/**
 * Main Volleyball Rules Engine class providing a clean public API
 * for volleyball positioning validation and constraint calculation.
 */
export class VolleyballRulesEngine {
  // ============================================================================
  // CORE VALIDATION METHODS
  // ============================================================================

  /**
   * Validates a complete lineup for overlap rule compliance.
   *
   * Checks all volleyball overlap rules including:
   * - Front row order (LF < MF < RF)
   * - Back row order (LB < MB < RB)
   * - Front/back relationships (front players in front of back counterparts)
   * - Server exemptions
   *
   * @param lineup - Array of exactly 6 players with positions and rotation slots
   * @returns Validation result indicating if lineup is legal and any violations
   *
   * @example
   * ```typescript
   * const players: PlayerState[] = [
   *   { id: '1', displayName: 'Player 1', role: 'OH1', slot: 4, x: 2, y: 3, isServer: false },
   *   // ... 5 more players
   * ];
   *
   * const result = VolleyballRulesEngine.validateLineup(players);
   * if (result.isLegal) {
   *   console.log('Formation is legal!');
   * } else {
   *   result.violations.forEach(v => console.log(v.message));
   * }
   * ```
   */
  static validateLineup(lineup: PlayerState[]): OverlapResult {
    // First validate basic lineup structure
    const structuralErrors = validateLineup(lineup);
    if (structuralErrors.length > 0) {
      return {
        isLegal: false,
        violations: structuralErrors.map((error) => ({
          code: "INVALID_LINEUP" as const,
          slots: [],
          message: error.message,
        })),
      };
    }

    // Perform overlap validation
    return OverlapValidator.checkOverlap(lineup);
  }

  /**
   * Checks if a specific position would be valid for a player without modifying the lineup.
   *
   * @param slot - The rotation slot to test
   * @param position - The position coordinates to test
   * @param lineup - Current lineup of all players
   * @returns True if the position would be valid, false otherwise
   *
   * @example
   * ```typescript
   * const isValid = VolleyballRulesEngine.isValidPosition(
   *   3, // Middle Front
   *   { x: 4.5, y: 2.0 },
   *   currentPlayers
   * );
   * ```
   */
  static isValidPosition(
    slot: RotationSlot,
    position: { x: number; y: number },
    lineup: PlayerState[]
  ): boolean {
    const slotMap = createSlotMap(lineup);
    const player = slotMap.get(slot);
    if (!player) return false;

    return ConstraintCalculator.isPositionValid(
      slot,
      position,
      slotMap,
      player.isServer
    );
  }

  // ============================================================================
  // CONSTRAINT CALCULATION METHODS
  // ============================================================================

  /**
   * Calculates valid positioning bounds for a player during drag operations.
   *
   * Returns the allowable coordinate ranges based on overlap rules and other
   * player positions. Accounts for server exemptions and dynamic constraints.
   *
   * @param slot - The rotation slot to calculate constraints for
   * @param lineup - Current lineup of all players
   * @returns Position bounds with min/max coordinates and constraint reasons
   *
   * @example
   * ```typescript
   * const bounds = VolleyballRulesEngine.getPlayerConstraints(3, players);
   * console.log(`X range: ${bounds.minX} to ${bounds.maxX}`);
   * console.log(`Y range: ${bounds.minY} to ${bounds.maxY}`);
   * bounds.constraintReasons.forEach(reason => console.log(reason));
   * ```
   */
  static getPlayerConstraints(
    slot: RotationSlot,
    lineup: PlayerState[]
  ): PositionBounds {
    const slotMap = createSlotMap(lineup);
    const player = slotMap.get(slot);
    if (!player) {
      throw new Error(`No player found in slot ${slot}`);
    }

    return ConstraintCalculator.calculateValidBounds(
      slot,
      slotMap,
      player.isServer
    );
  }

  /**
   * Finds the nearest valid position if the target position violates constraints.
   *
   * @param slot - The rotation slot
   * @param targetPosition - The desired position
   * @param lineup - Current lineup of all players
   * @returns The nearest valid position within constraints
   *
   * @example
   * ```typescript
   * const validPosition = VolleyballRulesEngine.snapToValidPosition(
   *   3,
   *   { x: 4.5, y: 2.0 },
   *   players
   * );
   * ```
   */
  static snapToValidPosition(
    slot: RotationSlot,
    targetPosition: { x: number; y: number },
    lineup: PlayerState[]
  ): { x: number; y: number } {
    const slotMap = createSlotMap(lineup);
    const player = slotMap.get(slot);
    if (!player) {
      throw new Error(`No player found in slot ${slot}`);
    }

    return ConstraintCalculator.snapToValidPosition(
      slot,
      targetPosition,
      slotMap,
      player.isServer
    );
  }

  // ============================================================================
  // POSITION LABELING AND HELPER METHODS
  // ============================================================================

  /**
   * Gets the standard position label for a rotation slot.
   *
   * @param slot - Rotation slot (1-6)
   * @returns Position label (e.g., "RB", "LF", "MF")
   *
   * @example
   * ```typescript
   * console.log(VolleyballRulesEngine.getSlotLabel(1)); // "RB"
   * console.log(VolleyballRulesEngine.getSlotLabel(4)); // "LF"
   * ```
   */
  static getSlotLabel(slot: RotationSlot): string {
    return PositionHelpers.getSlotLabel(slot);
  }

  /**
   * Gets the column (Left/Middle/Right) for a rotation slot.
   *
   * @param slot - Rotation slot (1-6)
   * @returns Column position
   *
   * @example
   * ```typescript
   * console.log(VolleyballRulesEngine.getSlotColumn(4)); // "Left"
   * console.log(VolleyballRulesEngine.getSlotColumn(3)); // "Middle"
   * ```
   */
  static getSlotColumn(slot: RotationSlot): "Left" | "Middle" | "Right" {
    return PositionHelpers.getSlotColumn(slot);
  }

  /**
   * Gets the row (Front/Back) for a rotation slot.
   *
   * @param slot - Rotation slot (1-6)
   * @returns Row position
   *
   * @example
   * ```typescript
   * console.log(VolleyballRulesEngine.getSlotRow(2)); // "Front"
   * console.log(VolleyballRulesEngine.getSlotRow(1)); // "Back"
   * ```
   */
  static getSlotRow(slot: RotationSlot): "Front" | "Back" {
    return PositionHelpers.getSlotRow(slot);
  }

  /**
   * Gets detailed position information for a rotation slot.
   *
   * @param slot - Rotation slot (1-6)
   * @returns Complete position description with label, full name, column, row, etc.
   *
   * @example
   * ```typescript
   * const desc = VolleyballRulesEngine.getPositionDescription(4);
   * console.log(desc.fullName); // "Left Front"
   * console.log(desc.abbreviation); // "LF"
   * ```
   */
  static getPositionDescription(slot: RotationSlot) {
    return PositionHelpers.getPositionDescription(slot);
  }

  // ============================================================================
  // COORDINATE CONVERSION METHODS
  // ============================================================================

  /**
   * Coordinate transformation utilities for converting between screen and volleyball coordinates.
   *
   * Provides access to the CoordinateTransformer for applications that need to
   * convert between different coordinate systems.
   *
   * @example
   * ```typescript
   * const vbCoords = VolleyballRulesEngine.convertCoordinates.screenToVolleyball(300, 180);
   * const screenCoords = VolleyballRulesEngine.convertCoordinates.volleyballToScreen(4.5, 4.5);
   * ```
   */
  static convertCoordinates = CoordinateTransformer;

  /**
   * State conversion utilities for converting between screen and volleyball player states.
   *
   * @example
   * ```typescript
   * const vbState = VolleyballRulesEngine.convertState.toVolleyballCoordinates(screenPlayer);
   * const screenState = VolleyballRulesEngine.convertState.toScreenCoordinates(vbPlayer);
   * ```
   */
  static convertState = StateConverter;

  // ============================================================================
  // ERROR EXPLANATION METHODS
  // ============================================================================

  /**
   * Generates a detailed human-readable explanation of a violation.
   *
   * @param violation - The violation to explain
   * @param lineup - The lineup where the violation occurred
   * @returns Detailed explanation string
   *
   * @example
   * ```typescript
   * const result = VolleyballRulesEngine.validateLineup(players);
   * if (!result.isLegal) {
   *   result.violations.forEach(violation => {
   *     const explanation = VolleyballRulesEngine.explainViolation(violation, players);
   *     console.log(explanation);
   *   });
   * }
   * ```
   */
  static explainViolation(violation: Violation, lineup: PlayerState[]): string {
    const slotMap = createSlotMap(lineup);

    switch (violation.code) {
      case "ROW_ORDER":
        return this.explainRowOrderViolation(violation, slotMap);
      case "FRONT_BACK":
        return this.explainFrontBackViolation(violation, slotMap);
      case "MULTIPLE_SERVERS":
        return this.explainMultipleServersViolation(violation, slotMap);
      case "INVALID_LINEUP":
        return violation.message;
      default:
        return `Unknown violation: ${violation.message}`;
    }
  }

  // ============================================================================
  // CONSTANTS AND CONFIGURATION
  // ============================================================================

  /**
   * Coordinate system constants and configuration.
   *
   * Provides access to court dimensions, tolerance values, and coordinate system
   * definitions used throughout the rules engine.
   *
   * @example
   * ```typescript
   * console.log(VolleyballRulesEngine.COORDINATE_SYSTEM.COURT_WIDTH); // 9.0
   * console.log(VolleyballRulesEngine.COORDINATE_SYSTEM.TOLERANCE); // 0.03
   * ```
   */
  static COORDINATE_SYSTEM = COORDINATE_SYSTEM;

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private static explainRowOrderViolation(
    violation: Violation,
    slotMap: Map<RotationSlot, PlayerState>
  ): string {
    const [slot1, slot2] = violation.slots;
    const player1 = slotMap.get(slot1);
    const player2 = slotMap.get(slot2);

    if (!player1 || !player2) {
      return violation.message;
    }

    const pos1 = PositionHelpers.getSlotLabel(slot1);
    const pos2 = PositionHelpers.getSlotLabel(slot2);

    return `Row order violation: ${
      player1.displayName
    } (${pos1}) at x=${player1.x.toFixed(2)} must be left of ${
      player2.displayName
    } (${pos2}) at x=${player2.x.toFixed(
      2
    )}. Current positions violate the left-to-right ordering rule.`;
  }

  private static explainFrontBackViolation(
    violation: Violation,
    slotMap: Map<RotationSlot, PlayerState>
  ): string {
    const [frontSlot, backSlot] = violation.slots;
    const frontPlayer = slotMap.get(frontSlot);
    const backPlayer = slotMap.get(backSlot);

    if (!frontPlayer || !backPlayer) {
      return violation.message;
    }

    const frontPos = PositionHelpers.getSlotLabel(frontSlot);
    const backPos = PositionHelpers.getSlotLabel(backSlot);

    return `Front/back violation: ${
      frontPlayer.displayName
    } (${frontPos}) at y=${frontPlayer.y.toFixed(2)} must be in front of ${
      backPlayer.displayName
    } (${backPos}) at y=${backPlayer.y.toFixed(
      2
    )}. Front row players must have smaller y-coordinates than their back row counterparts.`;
  }

  private static explainMultipleServersViolation(
    violation: Violation,
    slotMap: Map<RotationSlot, PlayerState>
  ): string {
    const serverNames = violation.slots
      .map((slot) => {
        const player = slotMap.get(slot);
        return player
          ? `${player.displayName} (${PositionHelpers.getSlotLabel(slot)})`
          : `Slot ${slot}`;
      })
      .join(", ");

    return `Multiple servers detected: ${serverNames}. Only one player may be designated as the server.`;
  }
}
