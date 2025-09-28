/**
 * Core player state and role definitions for volleyball rules engine
 */

/**
 * Player roles in volleyball
 */
export type Role =
  | "S" // Setter
  | "OPP" // Opposite
  | "OH1" // Outside Hitter 1
  | "OH2" // Outside Hitter 2
  | "MB1" // Middle Blocker 1
  | "MB2" // Middle Blocker 2
  | "L" // Libero
  | "DS" // Defensive Specialist
  | "Unknown"; // Unknown/unassigned role

/**
 * Rotation slot positions (1-6)
 * 1 = RB (Right Back)
 * 2 = RF (Right Front)
 * 3 = MF (Middle Front)
 * 4 = LF (Left Front)
 * 5 = LB (Left Back)
 * 6 = MB (Middle Back)
 */
export type RotationSlot = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Complete player state representation
 */
export interface PlayerState {
  /** Unique identifier for the player */
  id: string;

  /** Display name for the player */
  displayName: string;

  /** Player's role/position */
  role: Role;

  /** Current rotation slot (1-6) */
  slot: RotationSlot;

  /** X coordinate in meters (0-9, court width) */
  x: number;

  /** Y coordinate in meters (0-9 court length, 9-11 service zone) */
  y: number;

  /** Whether this player is currently serving */
  isServer: boolean;
}

/**
 * Type guard to check if a value is a valid Role
 */
export function isValidRole(value: unknown): value is Role {
  return (
    typeof value === "string" &&
    ["S", "OPP", "OH1", "OH2", "MB1", "MB2", "L", "DS", "Unknown"].includes(
      value
    )
  );
}

/**
 * Type guard to check if a value is a valid RotationSlot
 */
export function isValidRotationSlot(value: unknown): value is RotationSlot {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 6
  );
}

/**
 * Type guard to check if an object is a valid PlayerState
 */
export function isValidPlayerState(value: unknown): value is PlayerState {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === "string" &&
    typeof obj.displayName === "string" &&
    isValidRole(obj.role) &&
    isValidRotationSlot(obj.slot) &&
    typeof obj.x === "number" &&
    typeof obj.y === "number" &&
    typeof obj.isServer === "boolean"
  );
}
