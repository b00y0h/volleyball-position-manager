/**
 * Coordinate system constants and utilities for volleyball rules engine
 */

/**
 * Volleyball court coordinate system constants
 * Uses a right-handed 2D coordinate system:
 * - X-axis: 0 (left sideline) to 9.0 (right sideline) meters
 * - Y-axis: 0 (net) to 9.0 (endline) meters, service zone extends to 11.0 meters
 * - Origin (0,0) is at the intersection of left sideline and net
 */
export const COORDINATE_SYSTEM = {
  /** Court width in meters */
  COURT_WIDTH: 9.0,

  /** Court length in meters */
  COURT_LENGTH: 9.0,

  /** Net position on Y-axis */
  NET_Y: 0.0,

  /** Endline position on Y-axis */
  ENDLINE_Y: 9.0,

  /** Service zone start (at endline) */
  SERVICE_ZONE_START: 9.0,

  /** Service zone end (2 meters behind endline) */
  SERVICE_ZONE_END: 11.0,

  /** Left sideline position on X-axis */
  LEFT_SIDELINE_X: 0.0,

  /** Right sideline position on X-axis */
  RIGHT_SIDELINE_X: 9.0,

  /** Tolerance for floating-point comparisons (3cm) */
  TOLERANCE: 0.03,

  /** Attack line position (3 meters from net) */
  ATTACK_LINE_Y: 3.0,

  /** Center line position on X-axis */
  CENTER_LINE_X: 4.5,
} as const;

/**
 * Screen coordinate system constants for existing visualizer
 * Used for conversion between screen pixels and volleyball court meters
 */
export const SCREEN_COORDINATE_SYSTEM = {
  /** Screen width in pixels */
  SCREEN_WIDTH: 600,

  /** Screen height in pixels */
  SCREEN_HEIGHT: 360,
} as const;

/**
 * Coordinate bounds for validation
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

/**
 * Standard court bounds (excluding service zone)
 */
export const COURT_BOUNDS: CoordinateBounds = {
  minX: COORDINATE_SYSTEM.LEFT_SIDELINE_X,
  maxX: COORDINATE_SYSTEM.RIGHT_SIDELINE_X,
  minY: COORDINATE_SYSTEM.NET_Y,
  maxY: COORDINATE_SYSTEM.ENDLINE_Y,
} as const;

/**
 * Extended bounds including service zone
 */
export const EXTENDED_BOUNDS: CoordinateBounds = {
  minX: COORDINATE_SYSTEM.LEFT_SIDELINE_X,
  maxX: COORDINATE_SYSTEM.RIGHT_SIDELINE_X,
  minY: COORDINATE_SYSTEM.NET_Y,
  maxY: COORDINATE_SYSTEM.SERVICE_ZONE_END,
} as const;

/**
 * Type guard to check if coordinates are within court bounds
 */
export function isWithinCourtBounds(x: number, y: number): boolean {
  return (
    x >= COURT_BOUNDS.minX &&
    x <= COURT_BOUNDS.maxX &&
    y >= COURT_BOUNDS.minY &&
    y <= COURT_BOUNDS.maxY
  );
}

/**
 * Type guard to check if coordinates are within extended bounds (including service zone)
 */
export function isWithinExtendedBounds(x: number, y: number): boolean {
  return (
    x >= EXTENDED_BOUNDS.minX &&
    x <= EXTENDED_BOUNDS.maxX &&
    y >= EXTENDED_BOUNDS.minY &&
    y <= EXTENDED_BOUNDS.maxY
  );
}

/**
 * Check if coordinates are in the service zone
 */
export function isInServiceZone(x: number, y: number): boolean {
  return (
    x >= COORDINATE_SYSTEM.LEFT_SIDELINE_X &&
    x <= COORDINATE_SYSTEM.RIGHT_SIDELINE_X &&
    y >= COORDINATE_SYSTEM.SERVICE_ZONE_START &&
    y <= COORDINATE_SYSTEM.SERVICE_ZONE_END
  );
}

/**
 * Validate coordinates based on whether player is serving
 */
export function isValidPosition(
  x: number,
  y: number,
  allowServiceZone: boolean = false
): boolean {
  if (allowServiceZone) {
    return isWithinExtendedBounds(x, y);
  }
  return isWithinCourtBounds(x, y);
}

/**
 * Type guard to check if an object represents valid coordinate bounds
 */
export function isValidCoordinateBounds(
  value: unknown
): value is CoordinateBounds {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.minX === "number" &&
    typeof obj.maxX === "number" &&
    typeof obj.minY === "number" &&
    typeof obj.maxY === "number" &&
    obj.minX <= obj.maxX &&
    obj.minY <= obj.maxY
  );
}
