/**
 * Optimized coordinate transformer with pre-calculated scaling factors
 * and efficient batch operations for performance-critical scenarios
 */

import type { Point } from "./CoordinateTransformer";
import {
  COORDINATE_SYSTEM,
  SCREEN_COORDINATE_SYSTEM,
  CoordinateBounds,
  COURT_BOUNDS,
  EXTENDED_BOUNDS,
} from "../types/CoordinateSystem";

/**
 * Pre-calculated scaling factors for coordinate transformations
 */
interface ScalingFactors {
  screenToVbX: number;
  screenToVbY: number;
  vbToScreenX: number;
  vbToScreenY: number;
}

/**
 * Batch coordinate transformation request
 */
interface BatchTransformRequest {
  points: Point[];
  fromScreen: boolean; // true for screen->volleyball, false for volleyball->screen
}

/**
 * Optimized coordinate transformer with caching and batch operations
 */
export class OptimizedCoordinateTransformer {
  private static scalingFactors: ScalingFactors;
  private static boundsCache = new Map<string, CoordinateBounds>();

  // Initialize scaling factors once
  static {
    this.scalingFactors = {
      screenToVbX:
        COORDINATE_SYSTEM.COURT_WIDTH / SCREEN_COORDINATE_SYSTEM.SCREEN_WIDTH,
      screenToVbY:
        COORDINATE_SYSTEM.COURT_LENGTH / SCREEN_COORDINATE_SYSTEM.SCREEN_HEIGHT,
      vbToScreenX:
        SCREEN_COORDINATE_SYSTEM.SCREEN_WIDTH / COORDINATE_SYSTEM.COURT_WIDTH,
      vbToScreenY:
        SCREEN_COORDINATE_SYSTEM.SCREEN_HEIGHT / COORDINATE_SYSTEM.COURT_LENGTH,
    };
  }

  /**
   * High-performance screen to volleyball coordinate conversion
   * @param screenX - X coordinate in screen pixels
   * @param screenY - Y coordinate in screen pixels
   * @returns Volleyball court coordinates
   */
  static screenToVolleyballFast(screenX: number, screenY: number): Point {
    return {
      x: screenX * this.scalingFactors.screenToVbX,
      y: screenY * this.scalingFactors.screenToVbY,
    };
  }

  /**
   * High-performance volleyball to screen coordinate conversion
   * @param vbX - X coordinate in volleyball meters
   * @param vbY - Y coordinate in volleyball meters
   * @returns Screen coordinates
   */
  static volleyballToScreenFast(vbX: number, vbY: number): Point {
    return {
      x: vbX * this.scalingFactors.vbToScreenX,
      y: vbY * this.scalingFactors.vbToScreenY,
    };
  }

  /**
   * Batch coordinate transformation for multiple points
   * @param requests - Array of transformation requests
   * @returns Array of transformed points in the same order
   */
  static batchTransform(requests: BatchTransformRequest[]): Point[][] {
    return requests.map((request) => {
      if (request.fromScreen) {
        return request.points.map((point) =>
          this.screenToVolleyballFast(point.x, point.y)
        );
      } else {
        return request.points.map((point) =>
          this.volleyballToScreenFast(point.x, point.y)
        );
      }
    });
  }

  /**
   * Transform multiple points from screen to volleyball coordinates
   * @param points - Array of screen coordinate points
   * @returns Array of volleyball coordinate points
   */
  static batchScreenToVolleyball(points: Point[]): Point[] {
    return points.map((point) => this.screenToVolleyballFast(point.x, point.y));
  }

  /**
   * Transform multiple points from volleyball to screen coordinates
   * @param points - Array of volleyball coordinate points
   * @returns Array of screen coordinate points
   */
  static batchVolleyballToScreen(points: Point[]): Point[] {
    return points.map((point) => this.volleyballToScreenFast(point.x, point.y));
  }

  /**
   * Optimized bounds validation with pre-calculated bounds
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param allowServiceZone - Whether to allow service zone
   * @returns True if coordinates are valid
   */
  static isValidPositionFast(
    x: number,
    y: number,
    allowServiceZone: boolean = false
  ): boolean {
    const bounds = allowServiceZone ? EXTENDED_BOUNDS : COURT_BOUNDS;

    return (
      x >= bounds.minX &&
      x <= bounds.maxX &&
      y >= bounds.minY &&
      y <= bounds.maxY
    );
  }

  /**
   * Optimized coordinate clamping with pre-calculated bounds
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param allowServiceZone - Whether to allow service zone
   * @returns Clamped coordinates
   */
  static clampToValidBoundsFast(
    x: number,
    y: number,
    allowServiceZone: boolean = false
  ): Point {
    const bounds = allowServiceZone ? EXTENDED_BOUNDS : COURT_BOUNDS;

    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, y)),
    };
  }

  /**
   * Batch coordinate validation
   * @param points - Array of points to validate
   * @param allowServiceZone - Whether to allow service zone
   * @returns Array of boolean values indicating validity
   */
  static batchValidatePositions(
    points: Point[],
    allowServiceZone: boolean = false
  ): boolean[] {
    return points.map((point) =>
      this.isValidPositionFast(point.x, point.y, allowServiceZone)
    );
  }

  /**
   * Batch coordinate clamping
   * @param points - Array of points to clamp
   * @param allowServiceZone - Whether to allow service zone
   * @returns Array of clamped points
   */
  static batchClampToValidBounds(
    points: Point[],
    allowServiceZone: boolean = false
  ): Point[] {
    return points.map((point) =>
      this.clampToValidBoundsFast(point.x, point.y, allowServiceZone)
    );
  }

  /**
   * Get cached bounds or calculate and cache them
   * @param allowServiceZone - Whether to include service zone
   * @returns Coordinate bounds
   */
  static getCachedBounds(allowServiceZone: boolean = false): CoordinateBounds {
    const cacheKey = allowServiceZone ? "extended" : "court";

    if (this.boundsCache.has(cacheKey)) {
      return this.boundsCache.get(cacheKey)!;
    }

    const bounds = allowServiceZone ? EXTENDED_BOUNDS : COURT_BOUNDS;
    this.boundsCache.set(cacheKey, bounds);
    return bounds;
  }

  /**
   * Fast distance calculation between two points
   * @param point1 - First point
   * @param point2 - Second point
   * @returns Euclidean distance
   */
  static calculateDistanceFast(point1: Point, point2: Point): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Fast squared distance calculation (avoids sqrt for performance)
   * @param point1 - First point
   * @param point2 - Second point
   * @returns Squared Euclidean distance
   */
  static calculateSquaredDistance(point1: Point, point2: Point): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return dx * dx + dy * dy;
  }

  /**
   * Batch distance calculations
   * @param points1 - Array of first points
   * @param points2 - Array of second points
   * @returns Array of distances
   */
  static batchCalculateDistances(points1: Point[], points2: Point[]): number[] {
    const minLength = Math.min(points1.length, points2.length);
    const distances: number[] = [];

    for (let i = 0; i < minLength; i++) {
      distances.push(this.calculateDistanceFast(points1[i], points2[i]));
    }

    return distances;
  }

  /**
   * Check if a point is within a circular area (optimized)
   * @param point - Point to check
   * @param center - Center of the circle
   * @param radius - Radius of the circle
   * @returns True if point is within the circle
   */
  static isWithinCircleFast(
    point: Point,
    center: Point,
    radius: number
  ): boolean {
    const squaredDistance = this.calculateSquaredDistance(point, center);
    return squaredDistance <= radius * radius;
  }

  /**
   * Find the closest point on a line segment to a given point
   * @param point - The point to find the closest point to
   * @param lineStart - Start of the line segment
   * @param lineEnd - End of the line segment
   * @returns Closest point on the line segment
   */
  static closestPointOnLineSegment(
    point: Point,
    lineStart: Point,
    lineEnd: Point
  ): Point {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;

    if (dx === 0 && dy === 0) {
      return lineStart; // Line segment is a point
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
          (dx * dx + dy * dy)
      )
    );

    return {
      x: lineStart.x + t * dx,
      y: lineStart.y + t * dy,
    };
  }

  /**
   * Get pre-calculated scaling factors
   * @returns Scaling factors object
   */
  static getScalingFactors(): ScalingFactors {
    return { ...this.scalingFactors };
  }

  /**
   * Convert screen bounds to volleyball bounds (optimized)
   * @param screenBounds - Bounds in screen coordinates
   * @returns Bounds in volleyball coordinates
   */
  static screenBoundsToVolleyballFast(
    screenBounds: CoordinateBounds
  ): CoordinateBounds {
    return {
      minX: screenBounds.minX * this.scalingFactors.screenToVbX,
      maxX: screenBounds.maxX * this.scalingFactors.screenToVbX,
      minY: screenBounds.minY * this.scalingFactors.screenToVbY,
      maxY: screenBounds.maxY * this.scalingFactors.screenToVbY,
    };
  }

  /**
   * Convert volleyball bounds to screen bounds (optimized)
   * @param vbBounds - Bounds in volleyball coordinates
   * @returns Bounds in screen coordinates
   */
  static volleyballBoundsToScreenFast(
    vbBounds: CoordinateBounds
  ): CoordinateBounds {
    return {
      minX: vbBounds.minX * this.scalingFactors.vbToScreenX,
      maxX: vbBounds.maxX * this.scalingFactors.vbToScreenX,
      minY: vbBounds.minY * this.scalingFactors.vbToScreenY,
      maxY: vbBounds.maxY * this.scalingFactors.vbToScreenY,
    };
  }

  /**
   * Clear all cached data
   */
  static clearCache(): void {
    this.boundsCache.clear();
  }

  /**
   * Get cache statistics
   * @returns Cache statistics object
   */
  static getCacheStats(): {
    boundsCache: number;
  } {
    return {
      boundsCache: this.boundsCache.size,
    };
  }
}
