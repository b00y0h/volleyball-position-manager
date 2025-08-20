/**
 * Validation result interfaces for volleyball rules engine
 */

import type { RotationSlot } from "./PlayerState";

/**
 * Types of violations that can occur
 */
export type ViolationCode =
  | "ROW_ORDER" // Players not in correct left-to-right order within row
  | "FRONT_BACK" // Front player positioned behind back counterpart
  | "MULTIPLE_SERVERS" // More than one player marked as server
  | "INVALID_LINEUP"; // Invalid lineup composition (wrong number of players, etc.)

/**
 * Individual violation details
 */
export interface Violation {
  /** Type of violation */
  code: ViolationCode;

  /** Rotation slots involved in the violation */
  slots: RotationSlot[];

  /** Human-readable message describing the violation */
  message: string;

  /** Optional coordinate information for affected players */
  coordinates?: { [slot: number]: { x: number; y: number } };
}

/**
 * Result of overlap validation
 */
export interface OverlapResult {
  /** Whether the current positioning is legal */
  isLegal: boolean;

  /** Array of violations found (empty if isLegal is true) */
  violations: Violation[];
}

/**
 * Position bounds for drag constraints
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

  /** Whether the position is constrained by rules */
  isConstrained: boolean;

  /** Reasons for the constraints (for user feedback) */
  constraintReasons: string[];
}

/**
 * Type guard to check if a value is a valid ViolationCode
 */
export function isValidViolationCode(value: unknown): value is ViolationCode {
  return (
    typeof value === "string" &&
    ["ROW_ORDER", "FRONT_BACK", "MULTIPLE_SERVERS", "INVALID_LINEUP"].includes(
      value
    )
  );
}

/**
 * Type guard to check if an object is a valid Violation
 */
export function isValidViolation(value: unknown): value is Violation {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    isValidViolationCode(obj.code) &&
    Array.isArray(obj.slots) &&
    obj.slots.every(
      (slot: unknown) => typeof slot === "number" && slot >= 1 && slot <= 6
    ) &&
    typeof obj.message === "string" &&
    (obj.coordinates === undefined || typeof obj.coordinates === "object")
  );
}

/**
 * Type guard to check if an object is a valid OverlapResult
 */
export function isValidOverlapResult(value: unknown): value is OverlapResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.isLegal === "boolean" &&
    Array.isArray(obj.violations) &&
    obj.violations.every(isValidViolation)
  );
}

/**
 * Type guard to check if an object is a valid PositionBounds
 */
export function isValidPositionBounds(value: unknown): value is PositionBounds {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.minX === "number" &&
    typeof obj.maxX === "number" &&
    typeof obj.minY === "number" &&
    typeof obj.maxY === "number" &&
    typeof obj.isConstrained === "boolean" &&
    Array.isArray(obj.constraintReasons) &&
    obj.constraintReasons.every((reason: unknown) => typeof reason === "string")
  );
}
