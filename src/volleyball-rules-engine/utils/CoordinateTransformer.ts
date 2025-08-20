/**
 * Coordinate transformation utilities for converting between screen and volleyball coordinates
 */

import {
  COORDINATE_SYSTEM,
  SCREEN_COORDINATE_SYSTEM,
  isValidPosition,
  CoordinateBounds,
  COURT_BOUNDS,
  EXTENDED_BOUNDS,
} from "../types/CoordinateSystem";

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Coordinate transformation class for bidirectional conversion
 * between screen coordinates (600x360 pixels) and volleyball court coordinates (9x9 meters)
 */
export class CoordinateTransformer {
  /**
   * Convert from screen coordinates to volleyball court coordinates
   * @param screenX - X coordinate in screen pixels (0-600)
   * @param screenY - Y coordinate in screen pixels (0-360)
   * @returns Volleyball court coordinates in meters
   */
  static screenToVolleyball(screenX: number, screenY: number): Point {
    // Calculate scaling factors
    const scaleX =
      COORDINATE_SYSTEM.COURT_WIDTH / SCREEN_COORDINATE_SYSTEM.SCREEN_WIDTH;
    const scaleY =
      COORDINATE_SYSTEM.COURT_LENGTH / SCREEN_COORDINATE_SYSTEM.SCREEN_HEIGHT;

    // Convert coordinates
    const x = screenX * scaleX;
    const y = screenY * scaleY;

    return { x, y };
  }

  /**
   * Convert from volleyball court coordinates to screen coordinates
   * @param vbX - X coordinate in volleyball court meters (0-9)
   * @param vbY - Y coordinate in volleyball court meters (0-9)
   * @returns Screen coordinates in pixels
   */
  static volleyballToScreen(vbX: number, vbY: number): Point {
    // Calculate scaling factors
    const scaleX =
      SCREEN_COORDINATE_SYSTEM.SCREEN_WIDTH / COORDINATE_SYSTEM.COURT_WIDTH;
    const scaleY =
      SCREEN_COORDINATE_SYSTEM.SCREEN_HEIGHT / COORDINATE_SYSTEM.COURT_LENGTH;

    // Convert coordinates
    const x = vbX * scaleX;
    const y = vbY * scaleY;

    return { x, y };
  }

  /**
   * Validate that coordinates are within acceptable bounds
   * @param x - X coordinate in volleyball court meters
   * @param y - Y coordinate in volleyball court meters
   * @param allowServiceZone - Whether to allow coordinates in the service zone
   * @returns True if coordinates are valid
   */
  static isValidPosition(
    x: number,
    y: number,
    allowServiceZone: boolean = false
  ): boolean {
    return isValidPosition(x, y, allowServiceZone);
  }

  /**
   * Normalize coordinates to ensure they are within valid bounds
   * @param x - X coordinate in volleyball court meters
   * @param y - Y coordinate in volleyball court meters
   * @param allowServiceZone - Whether to allow coordinates in the service zone
   * @returns Normalized coordinates clamped to valid bounds
   */
  static normalizeCoordinates(
    x: number,
    y: number,
    allowServiceZone: boolean = false
  ): Point {
    const bounds = allowServiceZone ? EXTENDED_BOUNDS : COURT_BOUNDS;

    const normalizedX = Math.max(bounds.minX, Math.min(bounds.maxX, x));
    const normalizedY = Math.max(bounds.minY, Math.min(bounds.maxY, y));

    return { x: normalizedX, y: normalizedY };
  }

  /**
   * Check if coordinates are within specified bounds
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param bounds - Coordinate bounds to check against
   * @returns True if coordinates are within bounds
   */
  static isWithinBounds(
    x: number,
    y: number,
    bounds: CoordinateBounds
  ): boolean {
    return (
      x >= bounds.minX &&
      x <= bounds.maxX &&
      y >= bounds.minY &&
      y <= bounds.maxY
    );
  }

  /**
   * Clamp coordinates to specified bounds
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param bounds - Coordinate bounds to clamp to
   * @returns Clamped coordinates
   */
  static clampToBounds(x: number, y: number, bounds: CoordinateBounds): Point {
    const clampedX = Math.max(bounds.minX, Math.min(bounds.maxX, x));
    const clampedY = Math.max(bounds.minY, Math.min(bounds.maxY, y));

    return { x: clampedX, y: clampedY };
  }

  /**
   * Calculate distance between two points
   * @param point1 - First point
   * @param point2 - Second point
   * @returns Euclidean distance between points
   */
  static calculateDistance(point1: Point, point2: Point): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get the scaling factors for coordinate conversion
   * @returns Object containing X and Y scaling factors
   */
  static getScalingFactors(): { scaleX: number; scaleY: number } {
    return {
      scaleX:
        COORDINATE_SYSTEM.COURT_WIDTH / SCREEN_COORDINATE_SYSTEM.SCREEN_WIDTH,
      scaleY:
        COORDINATE_SYSTEM.COURT_LENGTH / SCREEN_COORDINATE_SYSTEM.SCREEN_HEIGHT,
    };
  }

  /**
   * Convert screen bounds to volleyball court bounds
   * @param screenBounds - Bounds in screen coordinates
   * @returns Bounds in volleyball court coordinates
   */
  static screenBoundsToVolleyball(
    screenBounds: CoordinateBounds
  ): CoordinateBounds {
    const topLeft = this.screenToVolleyball(
      screenBounds.minX,
      screenBounds.minY
    );
    const bottomRight = this.screenToVolleyball(
      screenBounds.maxX,
      screenBounds.maxY
    );

    return {
      minX: topLeft.x,
      maxX: bottomRight.x,
      minY: topLeft.y,
      maxY: bottomRight.y,
    };
  }

  /**
   * Convert volleyball court bounds to screen bounds
   * @param vbBounds - Bounds in volleyball court coordinates
   * @returns Bounds in screen coordinates
   */
  static volleyballBoundsToScreen(
    vbBounds: CoordinateBounds
  ): CoordinateBounds {
    const topLeft = this.volleyballToScreen(vbBounds.minX, vbBounds.minY);
    const bottomRight = this.volleyballToScreen(vbBounds.maxX, vbBounds.maxY);

    return {
      minX: topLeft.x,
      maxX: bottomRight.x,
      minY: topLeft.y,
      maxY: bottomRight.y,
    };
  }
}
