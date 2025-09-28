/**
 * Basic validation utilities for volleyball rules engine
 */

import type { PlayerState, RotationSlot } from "../types/PlayerState";
import { isValidPlayerState, isValidRotationSlot } from "../types/PlayerState";
import { isValidPosition } from "../types/CoordinateSystem";

/**
 * Validation error for lineup issues
 */
export interface ValidationError {
  code: string;
  message: string;
  playerId?: string;
  slot?: RotationSlot;
}

/**
 * Validate that a lineup has exactly 6 players
 */
export function validatePlayerCount(lineup: PlayerState[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (lineup.length !== 6) {
    errors.push({
      code: "INVALID_PLAYER_COUNT",
      message: `Expected exactly 6 players, got ${lineup.length}`,
    });
  }

  return errors;
}

/**
 * Validate that all players have unique rotation slots
 */
export function validateUniqueSlots(lineup: PlayerState[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const slotCounts = new Map<RotationSlot, PlayerState[]>();

  // Group players by slot
  for (const player of lineup) {
    if (!slotCounts.has(player.slot)) {
      slotCounts.set(player.slot, []);
    }
    slotCounts.get(player.slot)!.push(player);
  }

  // Check for duplicates
  for (const [slot, players] of slotCounts) {
    if (players.length > 1) {
      errors.push({
        code: "DUPLICATE_SLOT",
        message: `Multiple players assigned to slot ${slot}: ${players
          .map((p) => p.displayName)
          .join(", ")}`,
        slot,
      });
    }
  }

  // Check for missing slots (should have slots 1-6)
  for (let slot = 1; slot <= 6; slot++) {
    if (!slotCounts.has(slot as RotationSlot)) {
      errors.push({
        code: "MISSING_SLOT",
        message: `No player assigned to slot ${slot}`,
        slot: slot as RotationSlot,
      });
    }
  }

  return errors;
}

/**
 * Validate that exactly one player is marked as server
 */
export function validateServerCount(lineup: PlayerState[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const servers = lineup.filter((player) => player.isServer);

  if (servers.length === 0) {
    errors.push({
      code: "NO_SERVER",
      message: "No player is marked as server",
    });
  } else if (servers.length > 1) {
    errors.push({
      code: "MULTIPLE_SERVERS",
      message: `Multiple players marked as server: ${servers
        .map((p) => p.displayName)
        .join(", ")}`,
    });
  }

  return errors;
}

/**
 * Validate player coordinates are within acceptable bounds
 */
export function validatePlayerCoordinates(
  lineup: PlayerState[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const player of lineup) {
    // Check if coordinates are valid numbers
    if (!Number.isFinite(player.x) || !Number.isFinite(player.y)) {
      errors.push({
        code: "INVALID_COORDINATES",
        message: `Player ${player.displayName} has invalid coordinates: (${player.x}, ${player.y})`,
        playerId: player.id,
        slot: player.slot,
      });
      continue;
    }

    // Check if coordinates are within valid bounds (allow service zone for servers)
    if (!isValidPosition(player.x, player.y, player.isServer)) {
      errors.push({
        code: "OUT_OF_BOUNDS",
        message: `Player ${player.displayName} is positioned out of bounds: (${player.x}, ${player.y})`,
        playerId: player.id,
        slot: player.slot,
      });
    }
  }

  return errors;
}

/**
 * Validate individual player state objects
 */
export function validatePlayerStates(lineup: unknown[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < lineup.length; i++) {
    const player = lineup[i];

    if (!isValidPlayerState(player)) {
      errors.push({
        code: "INVALID_PLAYER_STATE",
        message: `Player at index ${i} has invalid structure`,
      });
    }
  }

  return errors;
}

/**
 * Comprehensive lineup validation
 */
export function validateLineup(lineup: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if lineup is an array
  if (!Array.isArray(lineup)) {
    errors.push({
      code: "INVALID_LINEUP_TYPE",
      message: "Lineup must be an array",
    });
    return errors;
  }

  // Validate player state structures first
  errors.push(...validatePlayerStates(lineup));

  // If we have structural errors, don't continue with other validations
  if (errors.length > 0) {
    return errors;
  }

  // Cast to PlayerState[] since we've validated the structure
  const validLineup = lineup as PlayerState[];

  // Run all validation checks
  errors.push(...validatePlayerCount(validLineup));
  errors.push(...validateUniqueSlots(validLineup));
  errors.push(...validateServerCount(validLineup));
  errors.push(...validatePlayerCoordinates(validLineup));

  return errors;
}

/**
 * Check if a lineup is valid (no validation errors)
 */
export function isValidLineup(lineup: unknown): lineup is PlayerState[] {
  return validateLineup(lineup).length === 0;
}

/**
 * Create a map of players by their rotation slots for easy lookup
 */
export function createSlotMap(
  lineup: PlayerState[]
): Map<RotationSlot, PlayerState> {
  const slotMap = new Map<RotationSlot, PlayerState>();

  for (const player of lineup) {
    slotMap.set(player.slot, player);
  }

  return slotMap;
}

/**
 * Get all rotation slots that should be present in a valid lineup
 */
export function getAllRotationSlots(): RotationSlot[] {
  return [1, 2, 3, 4, 5, 6];
}

/**
 * Check if a value represents a complete set of rotation slots
 */
export function hasAllRotationSlots(slots: RotationSlot[]): boolean {
  const uniqueSlots = new Set(slots);
  return (
    uniqueSlots.size === 6 &&
    getAllRotationSlots().every((slot) => uniqueSlots.has(slot))
  );
}
