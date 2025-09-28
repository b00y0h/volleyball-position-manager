/**
 * Neighbor relationship calculator for volleyball rotation slots
 *
 * Handles the complex neighbor relationships in volleyball rotations:
 * - Front row: 4 (LF) → 3 (MF) → 2 (RF) (circular)
 * - Back row: 5 (LB) → 6 (MB) → 1 (RB) (circular)
 * - Front/back counterparts: 4↔5, 3↔6, 2↔1
 */

import type { RotationSlot } from "../types/PlayerState";

/**
 * Calculator for rotation neighbor relationships
 */
export class NeighborCalculator {
  // Front row slots in left-to-right order
  private static readonly FRONT_ROW: readonly RotationSlot[] = [
    4, 3, 2,
  ] as const;

  // Back row slots in left-to-right order
  private static readonly BACK_ROW: readonly RotationSlot[] = [
    5, 6, 1,
  ] as const;

  // Front/back counterpart mapping
  private static readonly COUNTERPARTS: ReadonlyMap<
    RotationSlot,
    RotationSlot
  > = new Map([
    [4, 5], // LF ↔ LB
    [5, 4], // LB ↔ LF
    [3, 6], // MF ↔ MB
    [6, 3], // MB ↔ MF
    [2, 1], // RF ↔ RB
    [1, 2], // RB ↔ RF
  ]);

  /**
   * Get the left neighbor of a slot within the same row (circular)
   * @param slot - The rotation slot to find the left neighbor for
   * @returns The left neighbor slot, or null if slot is invalid
   */
  static getLeftNeighbor(slot: RotationSlot): RotationSlot | null {
    if (this.isFrontRow(slot)) {
      const index = this.FRONT_ROW.indexOf(slot);
      if (index === -1) return null;

      // Circular: if at leftmost position (4), wrap to rightmost (2)
      const leftIndex = index === 0 ? this.FRONT_ROW.length - 1 : index - 1;
      return this.FRONT_ROW[leftIndex];
    }

    if (this.isBackRow(slot)) {
      const index = this.BACK_ROW.indexOf(slot);
      if (index === -1) return null;

      // Circular: if at leftmost position (5), wrap to rightmost (1)
      const leftIndex = index === 0 ? this.BACK_ROW.length - 1 : index - 1;
      return this.BACK_ROW[leftIndex];
    }

    return null;
  }

  /**
   * Get the right neighbor of a slot within the same row (circular)
   * @param slot - The rotation slot to find the right neighbor for
   * @returns The right neighbor slot, or null if slot is invalid
   */
  static getRightNeighbor(slot: RotationSlot): RotationSlot | null {
    if (this.isFrontRow(slot)) {
      const index = this.FRONT_ROW.indexOf(slot);
      if (index === -1) return null;

      // Circular: if at rightmost position (2), wrap to leftmost (4)
      const rightIndex = (index + 1) % this.FRONT_ROW.length;
      return this.FRONT_ROW[rightIndex];
    }

    if (this.isBackRow(slot)) {
      const index = this.BACK_ROW.indexOf(slot);
      if (index === -1) return null;

      // Circular: if at rightmost position (1), wrap to leftmost (5)
      const rightIndex = (index + 1) % this.BACK_ROW.length;
      return this.BACK_ROW[rightIndex];
    }

    return null;
  }

  /**
   * Get the front/back counterpart of a slot
   * @param slot - The rotation slot to find the counterpart for
   * @returns The counterpart slot, or null if slot is invalid
   */
  static getRowCounterpart(slot: RotationSlot): RotationSlot | null {
    return this.COUNTERPARTS.get(slot) || null;
  }

  /**
   * Check if a slot is in the front row
   * @param slot - The rotation slot to check
   * @returns True if the slot is in the front row (2, 3, 4)
   */
  static isFrontRow(slot: RotationSlot): boolean {
    return this.FRONT_ROW.includes(slot);
  }

  /**
   * Check if a slot is in the back row
   * @param slot - The rotation slot to check
   * @returns True if the slot is in the back row (1, 5, 6)
   */
  static isBackRow(slot: RotationSlot): boolean {
    return this.BACK_ROW.includes(slot);
  }

  /**
   * Get all neighbors (left, right, and counterpart) for a slot
   * @param slot - The rotation slot to find neighbors for
   * @returns Object containing all neighbor relationships
   */
  static getAllNeighbors(slot: RotationSlot): {
    left: RotationSlot | null;
    right: RotationSlot | null;
    counterpart: RotationSlot | null;
  } {
    return {
      left: this.getLeftNeighbor(slot),
      right: this.getRightNeighbor(slot),
      counterpart: this.getRowCounterpart(slot),
    };
  }

  /**
   * Get the row type for a slot
   * @param slot - The rotation slot to check
   * @returns 'front', 'back', or null if invalid slot
   */
  static getRowType(slot: RotationSlot): "front" | "back" | null {
    if (this.isFrontRow(slot)) return "front";
    if (this.isBackRow(slot)) return "back";
    return null;
  }

  /**
   * Get the column position for a slot within its row
   * @param slot - The rotation slot to check
   * @returns 'left', 'middle', 'right', or null if invalid slot
   */
  static getColumnPosition(
    slot: RotationSlot
  ): "left" | "middle" | "right" | null {
    if (slot === 4 || slot === 5) return "left"; // LF, LB
    if (slot === 3 || slot === 6) return "middle"; // MF, MB
    if (slot === 2 || slot === 1) return "right"; // RF, RB
    return null;
  }
}
