/**
 * Type definitions and interfaces for volleyball rules engine
 */

// Re-export all types and interfaces
export type { Role, RotationSlot, PlayerState } from "./PlayerState";

export type {
  ViolationCode,
  Violation,
  OverlapResult,
  PositionBounds,
} from "./ValidationResult";

export type { CoordinateBounds } from "./CoordinateSystem";

// Re-export constants
export {
  COORDINATE_SYSTEM,
  SCREEN_COORDINATE_SYSTEM,
  COURT_BOUNDS,
  EXTENDED_BOUNDS,
} from "./CoordinateSystem";

// Re-export type guards and validation functions
export {
  isValidRole,
  isValidRotationSlot,
  isValidPlayerState,
} from "./PlayerState";

export {
  isValidViolationCode,
  isValidViolation,
  isValidOverlapResult,
  isValidPositionBounds,
} from "./ValidationResult";

export {
  isWithinCourtBounds,
  isWithinExtendedBounds,
  isInServiceZone,
  isValidPosition,
  isValidCoordinateBounds,
} from "./CoordinateSystem";
