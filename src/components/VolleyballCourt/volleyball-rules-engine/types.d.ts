/**
 * TypeScript Declaration File for Volleyball Rules Engine
 *
 * This file provides comprehensive type definitions for the volleyball rules engine,
 * ensuring proper IDE support, IntelliSense, and type checking for consuming applications.
 */

declare module "./volleyball-rules-engine" {
  // ============================================================================
  // CORE TYPES AND INTERFACES
  // ============================================================================

  /**
   * Player role enumeration for volleyball positions
   */
  export type Role =
    | "S" // Setter
    | "OPP" // Opposite/Right Side Hitter
    | "OH1" // Outside Hitter 1
    | "OH2" // Outside Hitter 2
    | "MB1" // Middle Blocker 1
    | "MB2" // Middle Blocker 2
    | "L" // Libero
    | "DS" // Defensive Specialist
    | "Unknown"; // Unknown/Unspecified role

  /**
   * Rotation slot numbers (1-6) corresponding to court positions
   * 1 = Right Back (RB)
   * 2 = Right Front (RF)
   * 3 = Middle Front (MF)
   * 4 = Left Front (LF)
   * 5 = Left Back (LB)
   * 6 = Middle Back (MB)
   */
  export type RotationSlot = 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * Complete player state with position and metadata
   */
  export interface PlayerState {
    /** Unique identifier for the player */
    id: string;
    /** Display name for UI purposes */
    displayName: string;
    /** Player's role/position type */
    role: Role;
    /** Rotation slot (1-6) */
    slot: RotationSlot;
    /** X coordinate in meters (0-9, court width) */
    x: number;
    /** Y coordinate in meters (0-11, court length + service zone) */
    y: number;
    /** Whether this player is currently serving */
    isServer: boolean;
  }

  /**
   * Violation codes for different rule infractions
   */
  export type ViolationCode =
    | "ROW_ORDER" // Left-to-right ordering violation within a row
    | "FRONT_BACK" // Front player behind back counterpart
    | "MULTIPLE_SERVERS" // More than one server designated
    | "INVALID_LINEUP"; // Structural lineup issues

  /**
   * Individual violation with details
   */
  export interface Violation {
    /** Type of violation */
    code: ViolationCode;
    /** Rotation slots involved in the violation */
    slots: RotationSlot[];
    /** Human-readable violation message */
    message: string;
    /** Optional coordinate information for affected players */
    coordinates?: Record<number, { x: number; y: number }>;
  }

  /**
   * Result of overlap validation
   */
  export interface OverlapResult {
    /** Whether the formation is legal according to volleyball rules */
    isLegal: boolean;
    /** Array of any violations found (empty if legal) */
    violations: Violation[];
  }

  /**
   * Position bounds for constraint-based movement
   */
  export interface PositionBounds {
    /** Minimum allowed X coordinate */
    minX: number;
    /** Maximum allowed X coordinate */
    maxX: number;
    /** Minimum allowed Y coordinate */
    minY: number;
    /** Maximum allowed Y coordinate */
    maxY: number;
    /** Whether position is constrained by overlap rules */
    isConstrained: boolean;
    /** Human-readable explanations of constraints */
    constraintReasons: string[];
  }

  /**
   * Coordinate bounds definition
   */
  export interface CoordinateBounds {
    /** Minimum X coordinate */
    minX: number;
    /** Maximum X coordinate */
    maxX: number;
    /** Minimum Y coordinate */
    minY: number;
    /** Maximum Y coordinate */
    maxY: number;
  }

  // ============================================================================
  // COORDINATE SYSTEM TYPES
  // ============================================================================

  /**
   * 2D point coordinates
   */
  export interface Point {
    x: number;
    y: number;
  }

  /**
   * Column position on court
   */
  export type Column = "Left" | "Middle" | "Right";

  /**
   * Row position on court
   */
  export type Row = "Front" | "Back";

  /**
   * Detailed position description
   */
  export interface PositionDescription {
    slot: RotationSlot;
    label: string;
    fullName: string;
    column: Column;
    row: Row;
    abbreviation: string;
  }

  /**
   * Formation pattern analysis
   */
  export interface FormationPattern {
    name: string;
    description: string;
    isValid: boolean;
    characteristics: string[];
  }

  // ============================================================================
  // STATE CONVERSION TYPES
  // ============================================================================

  /**
   * Player state with screen coordinates (pixels)
   */
  export interface ScreenPlayerState extends Omit<PlayerState, "x" | "y"> {
    /** X coordinate in screen pixels */
    x: number;
    /** Y coordinate in screen pixels */
    y: number;
  }

  /**
   * Player state with volleyball court coordinates (meters)
   */
  export interface VolleyballPlayerState extends PlayerState {
    /** X coordinate in volleyball court meters */
    x: number;
    /** Y coordinate in volleyball court meters */
    y: number;
  }

  /**
   * Validation error for lineup issues
   */
  export interface ValidationError {
    code: string;
    message: string;
    playerId?: string;
    slot?: RotationSlot;
  }

  // ============================================================================
  // MAIN API CLASS
  // ============================================================================

  /**
   * Main Volleyball Rules Engine API class
   */
  export class VolleyballRulesEngine {
    // Core validation methods
    static validateLineup(lineup: PlayerState[]): OverlapResult;
    static isValidPosition(
      slot: RotationSlot,
      position: Point,
      lineup: PlayerState[]
    ): boolean;

    // Constraint calculation methods
    static getPlayerConstraints(
      slot: RotationSlot,
      lineup: PlayerState[]
    ): PositionBounds;
    static snapToValidPosition(
      slot: RotationSlot,
      targetPosition: Point,
      lineup: PlayerState[]
    ): Point;

    // Position labeling methods
    static getSlotLabel(slot: RotationSlot): string;
    static getSlotColumn(slot: RotationSlot): Column;
    static getSlotRow(slot: RotationSlot): Row;
    static getPositionDescription(slot: RotationSlot): PositionDescription;

    // Coordinate conversion utilities
    static convertCoordinates: typeof CoordinateTransformer;
    static convertState: typeof StateConverter;

    // Error explanation
    static explainViolation(
      violation: Violation,
      lineup: PlayerState[]
    ): string;

    // Constants
    static COORDINATE_SYSTEM: typeof COORDINATE_SYSTEM;
  }

  // ============================================================================
  // UTILITY CLASSES
  // ============================================================================

  /**
   * Coordinate transformation utilities
   */
  export class CoordinateTransformer {
    static screenToVolleyball(screenX: number, screenY: number): Point;
    static volleyballToScreen(vbX: number, vbY: number): Point;
    static isValidPosition(
      x: number,
      y: number,
      allowServiceZone?: boolean
    ): boolean;
  }

  /**
   * State conversion utilities
   */
  export class StateConverter {
    static toVolleyballCoordinates(
      screenState: ScreenPlayerState
    ): VolleyballPlayerState;
    static toScreenCoordinates(
      vbState: VolleyballPlayerState
    ): ScreenPlayerState;
  }

  /**
   * Tolerance utilities for floating-point comparisons
   */
  export class ToleranceUtils {
    static isLessOrEqual(a: number, b: number): boolean;
    static isGreaterOrEqual(a: number, b: number): boolean;
    static isEqual(a: number, b: number): boolean;
    static applyTolerance(value: number, direction: "min" | "max"): number;
  }

  /**
   * Neighbor relationship calculator
   */
  export class NeighborCalculator {
    static getLeftNeighbor(slot: RotationSlot): RotationSlot | null;
    static getRightNeighbor(slot: RotationSlot): RotationSlot | null;
    static getRowCounterpart(slot: RotationSlot): RotationSlot;
    static isFrontRow(slot: RotationSlot): boolean;
    static isBackRow(slot: RotationSlot): boolean;
  }

  /**
   * Position helper utilities
   */
  export class PositionHelpers {
    static getSlotLabel(slot: RotationSlot): string;
    static getSlotColumn(slot: RotationSlot): Column;
    static getSlotRow(slot: RotationSlot): Row;
    static getPositionDescription(slot: RotationSlot): PositionDescription;
    static analyzeFormation(lineup: PlayerState[]): FormationPattern;
  }

  /**
   * Core overlap validation engine
   */
  export class OverlapValidator {
    static checkOverlap(lineup: PlayerState[]): OverlapResult;
  }

  /**
   * Real-time constraint calculator
   */
  export class ConstraintCalculator {
    static calculateValidBounds(
      draggedSlot: RotationSlot,
      currentPositions: Map<RotationSlot, PlayerState>,
      isServer?: boolean
    ): PositionBounds;
    static isPositionValid(
      slot: RotationSlot,
      testPosition: Point,
      otherPositions: Map<RotationSlot, PlayerState>,
      isServer?: boolean
    ): boolean;
    static snapToValidPosition(
      slot: RotationSlot,
      targetPosition: Point,
      otherPositions: Map<RotationSlot, PlayerState>,
      isServer?: boolean
    ): Point;
  }

  // ============================================================================
  // PERFORMANCE OPTIMIZATION CLASSES
  // ============================================================================

  /**
   * Performance cache for optimization
   */
  export class PerformanceCache {
    constructor();
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T): void;
    clear(): void;
    getOrCompute<T>(key: string, computeFn: () => T): T;
  }

  /**
   * Optimized coordinate transformer
   */
  export class OptimizedCoordinateTransformer extends CoordinateTransformer {
    // Inherits all methods from CoordinateTransformer with optimizations
  }

  /**
   * Optimized constraint calculator
   */
  export class OptimizedConstraintCalculator extends ConstraintCalculator {
    // Inherits all methods from ConstraintCalculator with optimizations
  }

  /**
   * Lazy violation analyzer
   */
  export class LazyViolationAnalyzer {
    static analyzeViolations(lineup: PlayerState[]): OverlapResult;
  }

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  /**
   * Volleyball court coordinate system constants
   */
  export const COORDINATE_SYSTEM: {
    readonly COURT_WIDTH: 9.0;
    readonly COURT_LENGTH: 9.0;
    readonly NET_Y: 0.0;
    readonly ENDLINE_Y: 9.0;
    readonly SERVICE_ZONE_START: 9.0;
    readonly SERVICE_ZONE_END: 11.0;
    readonly LEFT_SIDELINE_X: 0.0;
    readonly RIGHT_SIDELINE_X: 9.0;
    readonly TOLERANCE: 0.03;
  };

  /**
   * Screen coordinate system constants
   */
  export const SCREEN_COORDINATE_SYSTEM: {
    readonly WIDTH: 600;
    readonly HEIGHT: 360;
  };

  /**
   * Court boundary definitions
   */
  export const COURT_BOUNDS: CoordinateBounds;
  export const EXTENDED_BOUNDS: CoordinateBounds;

  // ============================================================================
  // TYPE GUARDS AND VALIDATION FUNCTIONS
  // ============================================================================

  export function isValidRole(value: unknown): value is Role;
  export function isValidRotationSlot(value: unknown): value is RotationSlot;
  export function isValidPlayerState(value: unknown): value is PlayerState;
  export function isValidViolationCode(value: unknown): value is ViolationCode;
  export function isValidViolation(value: unknown): value is Violation;
  export function isValidOverlapResult(value: unknown): value is OverlapResult;
  export function isValidPositionBounds(
    value: unknown
  ): value is PositionBounds;
  export function isWithinCourtBounds(x: number, y: number): boolean;
  export function isWithinExtendedBounds(x: number, y: number): boolean;
  export function isInServiceZone(y: number): boolean;
  export function isValidPosition(
    x: number,
    y: number,
    allowServiceZone?: boolean
  ): boolean;
  export function isValidCoordinateBounds(
    value: unknown
  ): value is CoordinateBounds;

  // ============================================================================
  // VALIDATION UTILITIES
  // ============================================================================

  export function validatePlayerCount(lineup: PlayerState[]): ValidationError[];
  export function validateUniqueSlots(lineup: PlayerState[]): ValidationError[];
  export function validateServerCount(lineup: PlayerState[]): ValidationError[];
  export function validatePlayerCoordinates(
    lineup: PlayerState[]
  ): ValidationError[];
  export function validatePlayerStates(lineup: unknown[]): ValidationError[];
  export function validateLineup(lineup: unknown): ValidationError[];
  export function isValidLineup(lineup: unknown): lineup is PlayerState[];
  export function createSlotMap(
    lineup: PlayerState[]
  ): Map<RotationSlot, PlayerState>;
  export function getAllRotationSlots(): RotationSlot[];
  export function hasAllRotationSlots(slots: RotationSlot[]): boolean;
}

// ============================================================================
// MODULE AUGMENTATION FOR REACT TYPES (if using React)
// ============================================================================

declare module "react" {
  interface HTMLAttributes<T> {
    // Allow custom data attributes for volleyball court elements
    "data-slot"?: number;
    "data-player-id"?: string;
    "data-position"?: string;
  }
}

// ============================================================================
// GLOBAL TYPE EXTENSIONS
// ============================================================================

declare global {
  namespace VolleyballRules {
    interface Player {
      id: string;
      displayName: string;
      role: string;
      slot: number;
      x: number;
      y: number;
      isServer: boolean;
    }
    type Slot = number;
    interface ValidationResult {
      isLegal: boolean;
      violations: any[];
    }
    interface Bounds {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
      isConstrained: boolean;
      constraintReasons: string[];
    }
  }
}

export {};
