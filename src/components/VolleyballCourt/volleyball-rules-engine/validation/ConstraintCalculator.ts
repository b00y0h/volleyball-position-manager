import type { PlayerState, RotationSlot } from "../types/PlayerState";
import type { PositionBounds } from "../types/ValidationResult";
import { NeighborCalculator } from "../utils/NeighborCalculator";
import { ToleranceUtils } from "../utils/ToleranceUtils";
import { COORDINATE_SYSTEM } from "../types/CoordinateSystem";

/**
 * Constraint information for a single constraint
 */
interface Constraint {
  type: "left" | "right" | "front" | "back";
  value: number;
  reason: string;
  sourceSlot: RotationSlot;
}

/**
 * Calculator for real-time constraint boundaries and validation
 */
export class ConstraintCalculator {
  /**
   * Calculate valid positioning bounds for a player during drag operations
   * @param draggedSlot - The slot being dragged
   * @param currentPositions - Current positions of all players
   * @param isServer - Whether the dragged player is the server
   * @returns Position bounds with constraints applied
   */
  static calculateValidBounds(
    draggedSlot: RotationSlot,
    currentPositions: Map<RotationSlot, PlayerState>,
    isServer: boolean = false
  ): PositionBounds {
    // Server exemption - no overlap constraints apply
    if (isServer) {
      return {
        minX: COORDINATE_SYSTEM.LEFT_SIDELINE_X,
        maxX: COORDINATE_SYSTEM.RIGHT_SIDELINE_X,
        minY: COORDINATE_SYSTEM.NET_Y,
        maxY: COORDINATE_SYSTEM.SERVICE_ZONE_END,
        isConstrained: false,
        constraintReasons: ["Server exemption: no overlap constraints apply"],
      };
    }

    // Start with court boundaries
    let bounds: PositionBounds = {
      minX: COORDINATE_SYSTEM.LEFT_SIDELINE_X,
      maxX: COORDINATE_SYSTEM.RIGHT_SIDELINE_X,
      minY: COORDINATE_SYSTEM.NET_Y,
      maxY: COORDINATE_SYSTEM.ENDLINE_Y,
      isConstrained: false,
      constraintReasons: [],
    };

    // Collect all constraints
    const constraints = this.collectConstraints(draggedSlot, currentPositions);

    // Apply constraints to bounds
    bounds = this.applyConstraints(bounds, constraints);

    // Check for constraint conflicts
    bounds = this.detectConstraintConflicts(bounds);

    return bounds;
  }

  /**
   * Check if a specific position would be valid for a player
   * @param slot - The rotation slot
   * @param testPosition - Position to test
   * @param otherPositions - Positions of other players
   * @param isServer - Whether the player is the server
   * @returns True if position is valid
   */
  static isPositionValid(
    slot: RotationSlot,
    testPosition: { x: number; y: number },
    otherPositions: Map<RotationSlot, PlayerState>,
    isServer: boolean = false
  ): boolean {
    // Check basic coordinate bounds
    const allowServiceZone = isServer;
    if (!this.isWithinValidBounds(testPosition, allowServiceZone)) {
      return false;
    }

    // Server exemption - no overlap constraints
    if (isServer) {
      return true;
    }

    // Check against all constraints
    const constraints = this.collectConstraints(slot, otherPositions);
    return this.positionSatisfiesConstraints(testPosition, constraints);
  }

  /**
   * Find nearest valid position if current position violates constraints
   * @param slot - The rotation slot
   * @param targetPosition - Desired position
   * @param otherPositions - Positions of other players
   * @param isServer - Whether the player is the server
   * @returns Nearest valid position
   */
  static snapToValidPosition(
    slot: RotationSlot,
    targetPosition: { x: number; y: number },
    otherPositions: Map<RotationSlot, PlayerState>,
    isServer: boolean = false
  ): { x: number; y: number } {
    // If already valid, return as-is
    if (this.isPositionValid(slot, targetPosition, otherPositions, isServer)) {
      return targetPosition;
    }

    // Get valid bounds and clamp to them
    const bounds = this.calculateValidBounds(slot, otherPositions, isServer);

    return {
      x: ToleranceUtils.clampWithTolerance(
        targetPosition.x,
        bounds.minX,
        bounds.maxX
      ),
      y: ToleranceUtils.clampWithTolerance(
        targetPosition.y,
        bounds.minY,
        bounds.maxY
      ),
    };
  }

  /**
   * Collect all constraints that apply to a slot
   * @param slot - The rotation slot
   * @param positions - Current positions of all players
   * @returns Array of constraints
   */
  private static collectConstraints(
    slot: RotationSlot,
    positions: Map<RotationSlot, PlayerState>
  ): Constraint[] {
    const constraints: Constraint[] = [];
    const neighbors = NeighborCalculator.getAllNeighbors(slot);

    // Left neighbor constraint (must be right of left neighbor)
    // Only apply if it's a linear neighbor, not circular
    if (neighbors.left && this.isLinearNeighbor(slot, neighbors.left, "left")) {
      const leftPlayer = positions.get(neighbors.left);
      if (leftPlayer && !leftPlayer.isServer) {
        constraints.push({
          type: "left",
          value: leftPlayer.x,
          reason: `Must be right of ${this.getSlotName(neighbors.left)} (slot ${
            neighbors.left
          })`,
          sourceSlot: neighbors.left,
        });
      }
    }

    // Right neighbor constraint (must be left of right neighbor)
    // Only apply if it's a linear neighbor, not circular
    if (
      neighbors.right &&
      this.isLinearNeighbor(slot, neighbors.right, "right")
    ) {
      const rightPlayer = positions.get(neighbors.right);
      if (rightPlayer && !rightPlayer.isServer) {
        constraints.push({
          type: "right",
          value: rightPlayer.x,
          reason: `Must be left of ${this.getSlotName(neighbors.right)} (slot ${
            neighbors.right
          })`,
          sourceSlot: neighbors.right,
        });
      }
    }

    // Front/back counterpart constraint
    if (neighbors.counterpart) {
      const counterpartPlayer = positions.get(neighbors.counterpart);
      const currentPlayer = positions.get(slot);

      // Don't apply front/back constraints if the current player is marked as server in the formation
      // This handles the edge case where we're calculating bounds for a server as if they were non-server
      if (
        counterpartPlayer &&
        !counterpartPlayer.isServer &&
        currentPlayer &&
        !currentPlayer.isServer
      ) {
        if (NeighborCalculator.isFrontRow(slot)) {
          // Front row player must be in front of back counterpart
          constraints.push({
            type: "back",
            value: counterpartPlayer.y,
            reason: `Must be in front of ${this.getSlotName(
              neighbors.counterpart
            )} (slot ${neighbors.counterpart})`,
            sourceSlot: neighbors.counterpart,
          });
        } else {
          // Back row player must be behind front counterpart
          constraints.push({
            type: "front",
            value: counterpartPlayer.y,
            reason: `Must be behind ${this.getSlotName(
              neighbors.counterpart
            )} (slot ${neighbors.counterpart})`,
            sourceSlot: neighbors.counterpart,
          });
        }
      }
    }

    return constraints;
  }

  /**
   * Apply constraints to position bounds
   * @param bounds - Initial bounds
   * @param constraints - Constraints to apply
   * @returns Updated bounds with constraints applied
   */
  private static applyConstraints(
    bounds: PositionBounds,
    constraints: Constraint[]
  ): PositionBounds {
    const updatedBounds = { ...bounds };
    const reasons: string[] = [...bounds.constraintReasons];

    for (const constraint of constraints) {
      updatedBounds.isConstrained = true;
      reasons.push(constraint.reason);

      switch (constraint.type) {
        case "left":
          updatedBounds.minX = Math.max(
            updatedBounds.minX,
            ToleranceUtils.applyTolerance(constraint.value, "max")
          );
          break;
        case "right":
          updatedBounds.maxX = Math.min(
            updatedBounds.maxX,
            ToleranceUtils.applyTolerance(constraint.value, "min")
          );
          break;
        case "front":
          updatedBounds.minY = Math.max(
            updatedBounds.minY,
            ToleranceUtils.applyTolerance(constraint.value, "max")
          );
          break;
        case "back":
          updatedBounds.maxY = Math.min(
            updatedBounds.maxY,
            ToleranceUtils.applyTolerance(constraint.value, "min")
          );
          break;
      }
    }

    updatedBounds.constraintReasons = reasons;
    return updatedBounds;
  }

  /**
   * Detect and handle constraint conflicts
   * @param bounds - Bounds to check for conflicts
   * @returns Updated bounds with conflict information
   */
  private static detectConstraintConflicts(
    bounds: PositionBounds
  ): PositionBounds {
    const hasXConflict = ToleranceUtils.isGreater(bounds.minX, bounds.maxX);
    const hasYConflict = ToleranceUtils.isGreater(bounds.minY, bounds.maxY);

    if (hasXConflict || hasYConflict) {
      const updatedBounds = { ...bounds };
      updatedBounds.constraintReasons = [
        ...bounds.constraintReasons,
        "Conflicting constraints detected",
      ];

      // Resolve conflicts by using the most restrictive bounds
      if (hasXConflict) {
        const midX = (bounds.minX + bounds.maxX) / 2;
        updatedBounds.minX = midX;
        updatedBounds.maxX = midX;
      }

      if (hasYConflict) {
        const midY = (bounds.minY + bounds.maxY) / 2;
        updatedBounds.minY = midY;
        updatedBounds.maxY = midY;
      }

      return updatedBounds;
    }

    return bounds;
  }

  /**
   * Check if a position satisfies all constraints
   * @param position - Position to check
   * @param constraints - Constraints to check against
   * @returns True if position satisfies all constraints
   */
  private static positionSatisfiesConstraints(
    position: { x: number; y: number },
    constraints: Constraint[]
  ): boolean {
    for (const constraint of constraints) {
      switch (constraint.type) {
        case "left":
          // Must be to the right of the constraint value (with tolerance)
          if (
            position.x < ToleranceUtils.applyTolerance(constraint.value, "max")
          ) {
            return false;
          }
          break;
        case "right":
          // Must be to the left of the constraint value (with tolerance)
          if (
            position.x > ToleranceUtils.applyTolerance(constraint.value, "min")
          ) {
            return false;
          }
          break;
        case "front":
          // Must be in front of the constraint value (with tolerance)
          if (
            position.y < ToleranceUtils.applyTolerance(constraint.value, "max")
          ) {
            return false;
          }
          break;
        case "back":
          // Must be behind the constraint value (with tolerance)
          if (
            position.y > ToleranceUtils.applyTolerance(constraint.value, "min")
          ) {
            return false;
          }
          break;
      }
    }
    return true;
  }

  /**
   * Check if position is within valid coordinate bounds
   * @param position - Position to check
   * @param allowServiceZone - Whether to allow service zone coordinates
   * @returns True if within valid bounds
   */
  private static isWithinValidBounds(
    position: { x: number; y: number },
    allowServiceZone: boolean = false
  ): boolean {
    const { x, y } = position;

    // Check X bounds
    if (
      !ToleranceUtils.isWithinRange(
        x,
        COORDINATE_SYSTEM.LEFT_SIDELINE_X,
        COORDINATE_SYSTEM.RIGHT_SIDELINE_X
      )
    ) {
      return false;
    }

    // Check Y bounds
    const maxY = allowServiceZone
      ? COORDINATE_SYSTEM.SERVICE_ZONE_END
      : COORDINATE_SYSTEM.ENDLINE_Y;

    return ToleranceUtils.isWithinRange(y, COORDINATE_SYSTEM.NET_Y, maxY);
  }

  /**
   * Check if a neighbor relationship is linear (not circular)
   * @param slot - The current slot
   * @param neighbor - The neighbor slot
   * @param direction - The direction of the neighbor
   * @returns True if it's a linear neighbor relationship
   */
  private static isLinearNeighbor(
    slot: RotationSlot,
    neighbor: RotationSlot,
    direction: "left" | "right"
  ): boolean {
    // Front row linear relationships: 4 → 3 → 2 (LF → MF → RF)
    if (NeighborCalculator.isFrontRow(slot)) {
      if (direction === "left") {
        // Linear left neighbors: 3 has 4, 2 has 3
        return (slot === 3 && neighbor === 4) || (slot === 2 && neighbor === 3);
      } else {
        // Linear right neighbors: 4 has 3, 3 has 2
        return (slot === 4 && neighbor === 3) || (slot === 3 && neighbor === 2);
      }
    }

    // Back row linear relationships: 5 → 6 → 1 (LB → MB → RB)
    if (NeighborCalculator.isBackRow(slot)) {
      if (direction === "left") {
        // Linear left neighbors: 6 has 5, 1 has 6
        return (slot === 6 && neighbor === 5) || (slot === 1 && neighbor === 6);
      } else {
        // Linear right neighbors: 5 has 6, 6 has 1
        return (slot === 5 && neighbor === 6) || (slot === 6 && neighbor === 1);
      }
    }

    return false;
  }

  /**
   * Get human-readable name for a rotation slot
   * @param slot - Rotation slot
   * @returns Human-readable name
   */
  private static getSlotName(slot: RotationSlot): string {
    const names: Record<RotationSlot, string> = {
      1: "RB",
      2: "RF",
      3: "MF",
      4: "LF",
      5: "LB",
      6: "MB",
    };
    return names[slot];
  }
}
