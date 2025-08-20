/**
 * Tolerance-aware comparison utilities for handling floating-point precision issues
 * Uses a 3cm epsilon (0.03m) for all comparisons to prevent precision-related errors
 */

import { COORDINATE_SYSTEM } from "../types/CoordinateSystem";

/**
 * Tolerance utilities for floating-point safe comparisons
 */
export class ToleranceUtils {
  /**
   * Tolerance value for floating-point comparisons (3cm)
   */
  private static readonly EPSILON = COORDINATE_SYSTEM.TOLERANCE;

  /**
   * Check if two values are equal within tolerance
   * @param a - First value
   * @param b - Second value
   * @param customEpsilon - Optional custom epsilon value
   * @returns True if values are equal within tolerance
   */
  static isEqual(a: number, b: number, customEpsilon?: number): boolean {
    const epsilon = customEpsilon ?? this.EPSILON;
    return Math.abs(a - b) <= epsilon;
  }

  /**
   * Check if first value is less than second value, accounting for tolerance
   * @param a - First value
   * @param b - Second value
   * @param customEpsilon - Optional custom epsilon value
   * @returns True if a < b within tolerance
   */
  static isLess(a: number, b: number, customEpsilon?: number): boolean {
    const epsilon = customEpsilon ?? this.EPSILON;
    return a < b - epsilon;
  }

  /**
   * Check if first value is less than or equal to second value, accounting for tolerance
   * @param a - First value
   * @param b - Second value
   * @param customEpsilon - Optional custom epsilon value
   * @returns True if a <= b within tolerance
   */
  static isLessOrEqual(a: number, b: number, customEpsilon?: number): boolean {
    const epsilon = customEpsilon ?? this.EPSILON;
    return a <= b + epsilon;
  }

  /**
   * Check if first value is greater than second value, accounting for tolerance
   * @param a - First value
   * @param b - Second value
   * @param customEpsilon - Optional custom epsilon value
   * @returns True if a > b within tolerance
   */
  static isGreater(a: number, b: number, customEpsilon?: number): boolean {
    const epsilon = customEpsilon ?? this.EPSILON;
    return a > b + epsilon;
  }

  /**
   * Check if first value is greater than or equal to second value, accounting for tolerance
   * @param a - First value
   * @param b - Second value
   * @param customEpsilon - Optional custom epsilon value
   * @returns True if a >= b within tolerance
   */
  static isGreaterOrEqual(
    a: number,
    b: number,
    customEpsilon?: number
  ): boolean {
    const epsilon = customEpsilon ?? this.EPSILON;
    return a >= b - epsilon;
  }

  /**
   * Apply tolerance to a value for constraint calculations
   * @param value - The base value
   * @param direction - Whether to apply tolerance for minimum or maximum constraint
   * @param customEpsilon - Optional custom epsilon value
   * @returns Value adjusted by tolerance
   */
  static applyTolerance(
    value: number,
    direction: "min" | "max",
    customEpsilon?: number
  ): number {
    const epsilon = customEpsilon ?? this.EPSILON;
    return direction === "min" ? value - epsilon : value + epsilon;
  }

  /**
   * Round a value to eliminate floating-point precision issues
   * @param value - Value to round
   * @param precision - Number of decimal places (default: 3 for millimeter precision)
   * @returns Rounded value
   */
  static roundToPrecision(value: number, precision: number = 3): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  /**
   * Check if a value is within a range, accounting for tolerance
   * @param value - Value to check
   * @param min - Minimum value of range
   * @param max - Maximum value of range
   * @param customEpsilon - Optional custom epsilon value
   * @returns True if value is within range
   */
  static isWithinRange(
    value: number,
    min: number,
    max: number,
    customEpsilon?: number
  ): boolean {
    return (
      this.isGreaterOrEqual(value, min, customEpsilon) &&
      this.isLessOrEqual(value, max, customEpsilon)
    );
  }

  /**
   * Clamp a value to a range with tolerance consideration
   * @param value - Value to clamp
   * @param min - Minimum value
   * @param max - Maximum value
   * @param customEpsilon - Optional custom epsilon value
   * @returns Clamped value
   */
  static clampWithTolerance(
    value: number,
    min: number,
    max: number,
    customEpsilon?: number
  ): number {
    const epsilon = customEpsilon ?? this.EPSILON;

    if (this.isLess(value, min, epsilon)) {
      return min;
    }
    if (this.isGreater(value, max, epsilon)) {
      return max;
    }
    return value;
  }

  /**
   * Compare two values and return comparison result accounting for tolerance
   * @param a - First value
   * @param b - Second value
   * @param customEpsilon - Optional custom epsilon value
   * @returns -1 if a < b, 0 if a ≈ b, 1 if a > b
   */
  static compare(a: number, b: number, customEpsilon?: number): -1 | 0 | 1 {
    if (this.isEqual(a, b, customEpsilon)) {
      return 0;
    }
    return this.isLess(a, b, customEpsilon) ? -1 : 1;
  }

  /**
   * Get the current epsilon value being used
   * @returns Current epsilon value
   */
  static getEpsilon(): number {
    return this.EPSILON;
  }

  /**
   * Check if a difference between two values is significant (greater than tolerance)
   * @param a - First value
   * @param b - Second value
   * @param customEpsilon - Optional custom epsilon value
   * @returns True if difference is significant
   */
  static isSignificantDifference(
    a: number,
    b: number,
    customEpsilon?: number
  ): boolean {
    const epsilon = customEpsilon ?? this.EPSILON;
    return Math.abs(a - b) > epsilon;
  }

  /**
   * Find the closest value in an array to a target value
   * @param target - Target value
   * @param values - Array of values to search
   * @param customEpsilon - Optional custom epsilon value
   * @returns Closest value from the array
   */
  static findClosest(
    target: number,
    values: number[],
    customEpsilon?: number
  ): number {
    if (values.length === 0) {
      throw new Error("Cannot find closest value in empty array");
    }

    let closest = values[0];
    let minDistance = Math.abs(target - closest);

    for (let i = 1; i < values.length; i++) {
      const distance = Math.abs(target - values[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closest = values[i];
      }
    }

    return closest;
  }

  /**
   * Check if two points are equal within tolerance
   * @param point1 - First point
   * @param point2 - Second point
   * @param customEpsilon - Optional custom epsilon value
   * @returns True if points are equal within tolerance
   */
  static arePointsEqual(
    point1: { x: number; y: number },
    point2: { x: number; y: number },
    customEpsilon?: number
  ): boolean {
    return (
      this.isEqual(point1.x, point2.x, customEpsilon) &&
      this.isEqual(point1.y, point2.y, customEpsilon)
    );
  }
}
