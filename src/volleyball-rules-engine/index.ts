/**
 * Volleyball Rules Engine
 *
 * A TypeScript library for validating volleyball player positioning according to
 * official overlap and rotation fault rules for indoor 6-on-6 volleyball.
 */

// Export all types and interfaces
export type {
  Role,
  RotationSlot,
  PlayerState,
  ViolationCode,
  Violation,
  OverlapResult,
  PositionBounds,
  CoordinateBounds,
} from "./types";

// Export constants
export {
  COORDINATE_SYSTEM,
  SCREEN_COORDINATE_SYSTEM,
  COURT_BOUNDS,
  EXTENDED_BOUNDS,
} from "./types";

// Export type guards and validation functions
export {
  isValidRole,
  isValidRotationSlot,
  isValidPlayerState,
  isValidViolationCode,
  isValidViolation,
  isValidOverlapResult,
  isValidPositionBounds,
  isWithinCourtBounds,
  isWithinExtendedBounds,
  isInServiceZone,
  isValidPosition,
  isValidCoordinateBounds,
} from "./types";

// Export validation utilities
export type { ValidationError } from "./utils/ValidationUtils";

export {
  validatePlayerCount,
  validateUniqueSlots,
  validateServerCount,
  validatePlayerCoordinates,
  validatePlayerStates,
  validateLineup,
  isValidLineup,
  createSlotMap,
  getAllRotationSlots,
  hasAllRotationSlots,
} from "./utils/ValidationUtils";

// Export coordinate transformation utilities
export type { Point } from "./utils/CoordinateTransformer";
export { CoordinateTransformer } from "./utils/CoordinateTransformer";

// Export tolerance utilities
export { ToleranceUtils } from "./utils/ToleranceUtils";

// Export neighbor relationship calculator
export { NeighborCalculator } from "./utils/NeighborCalculator";

// Export position labeling and helper utilities
export type {
  Column,
  Row,
  PositionDescription,
  FormationPattern,
} from "./utils/PositionHelpers";
export { PositionHelpers } from "./utils/PositionHelpers";

// Export validation engine
export { OverlapValidator } from "./validation/OverlapValidator";

// Export constraint calculator
export { ConstraintCalculator } from "./validation/ConstraintCalculator";
