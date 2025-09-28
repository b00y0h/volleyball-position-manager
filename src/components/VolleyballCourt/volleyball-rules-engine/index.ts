/**
 * Volleyball Rules Engine
 *
 * A comprehensive TypeScript library for validating volleyball player positioning
 * according to official overlap and rotation fault rules for indoor 6-on-6 volleyball.
 *
 * @example
 * ```typescript
 * import { VolleyballRulesEngine } from '@/volleyball-rules-engine';
 *
 * // Simple validation
 * const result = VolleyballRulesEngine.validateLineup(players);
 * if (!result.isLegal) {
 *   console.log('Violations found:', result.violations);
 * }
 *
 * // Real-time constraints for drag operations
 * const bounds = VolleyballRulesEngine.getPlayerConstraints(3, players);
 * ```
 */

// ============================================================================
// MAIN API - Recommended for most use cases
// ============================================================================

/**
 * Main Volleyball Rules Engine class - the primary interface for all
 * volleyball rules validation and constraint operations.
 *
 * @example
 * ```typescript
 * // Basic validation
 * const result = VolleyballRulesEngine.validateLineup(players);
 *
 * // Real-time constraints
 * const bounds = VolleyballRulesEngine.getPlayerConstraints(3, players);
 *
 * // Position helpers
 * const label = VolleyballRulesEngine.getSlotLabel(4); // "LF"
 * ```
 */
export { VolleyballRulesEngine } from "./VolleyballRulesEngine";

// ============================================================================
// CORE TYPES AND INTERFACES
// ============================================================================

export type { Role, RotationSlot, PlayerState } from "./types/PlayerState";

export type {
  ViolationCode,
  Violation,
  OverlapResult,
  PositionBounds,
} from "./types/ValidationResult";

export type { CoordinateBounds } from "./types/CoordinateSystem";

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

export {
  COORDINATE_SYSTEM,
  SCREEN_COORDINATE_SYSTEM,
  COURT_BOUNDS,
  EXTENDED_BOUNDS,
} from "./types/CoordinateSystem";

// ============================================================================
// ADVANCED API - For specialized use cases
// ============================================================================

// Type guards and validation functions
export {
  isValidRole,
  isValidRotationSlot,
  isValidPlayerState,
} from "./types/PlayerState";

export {
  isValidViolationCode,
  isValidViolation,
  isValidOverlapResult,
  isValidPositionBounds,
} from "./types/ValidationResult";

export {
  isWithinCourtBounds,
  isWithinExtendedBounds,
  isInServiceZone,
  isValidPosition,
  isValidCoordinateBounds,
} from "./types/CoordinateSystem";

// Low-level validation utilities
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

// Core validation and constraint engines
export { OverlapValidator } from "./validation/OverlapValidator";
export { ConstraintCalculator } from "./validation/ConstraintCalculator";

// Utility classes
export type { Point } from "./utils/CoordinateTransformer";
export { CoordinateTransformer } from "./utils/CoordinateTransformer";
export { ToleranceUtils } from "./utils/ToleranceUtils";
export { NeighborCalculator } from "./utils/NeighborCalculator";

// Position helpers
export type {
  Column,
  Row,
  PositionDescription,
  FormationPattern,
} from "./utils/PositionHelpers";
export { PositionHelpers } from "./utils/PositionHelpers";

// Integration utilities
export { StateConverter } from "./utils/StateConverter";
export type {
  ScreenPlayerState,
  VolleyballPlayerState,
} from "./utils/StateConverter";

// ============================================================================
// PERFORMANCE OPTIMIZATIONS - For high-performance applications
// ============================================================================

export { PerformanceCache } from "./utils/PerformanceCache";
export { OptimizedCoordinateTransformer } from "./utils/OptimizedCoordinateTransformer";
export { OptimizedConstraintCalculator } from "./validation/OptimizedConstraintCalculator";
export { LazyViolationAnalyzer } from "./validation/LazyViolationAnalyzer";
