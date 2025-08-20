/**
 * Unit tests for ToleranceUtils class
 */

import { describe, test, expect } from "vitest";
import { ToleranceUtils } from "../ToleranceUtils";
import { COORDINATE_SYSTEM } from "../../types/CoordinateSystem";

describe("ToleranceUtils", () => {
  const EPSILON = COORDINATE_SYSTEM.TOLERANCE; // 0.03

  describe("isEqual", () => {
    test("should return true for identical values", () => {
      expect(ToleranceUtils.isEqual(5.0, 5.0)).toBe(true);
      expect(ToleranceUtils.isEqual(0, 0)).toBe(true);
      expect(ToleranceUtils.isEqual(-3.5, -3.5)).toBe(true);
    });

    test("should return true for values within tolerance", () => {
      expect(ToleranceUtils.isEqual(5.0, 5.02)).toBe(true);
      expect(ToleranceUtils.isEqual(5.0, 4.98)).toBe(true);
      expect(ToleranceUtils.isEqual(5.0, 5.025)).toBe(true); // well within tolerance
      expect(ToleranceUtils.isEqual(5.0, 4.975)).toBe(true); // well within tolerance
    });

    test("should return false for values outside tolerance", () => {
      expect(ToleranceUtils.isEqual(5.0, 5.04)).toBe(false);
      expect(ToleranceUtils.isEqual(5.0, 4.96)).toBe(false);
      expect(ToleranceUtils.isEqual(5.0, 5.1)).toBe(false);
      expect(ToleranceUtils.isEqual(5.0, 4.9)).toBe(false);
    });

    test("should handle boundary conditions correctly", () => {
      // Test values that avoid floating-point precision issues
      expect(ToleranceUtils.isEqual(5.0, 5.029)).toBe(true); // just within tolerance
      expect(ToleranceUtils.isEqual(5.0, 4.971)).toBe(true); // just within tolerance
      expect(ToleranceUtils.isEqual(5.0, 5.035)).toBe(false); // clearly outside tolerance
      expect(ToleranceUtils.isEqual(5.0, 4.965)).toBe(false); // clearly outside tolerance
    });

    test("should work with custom epsilon", () => {
      expect(ToleranceUtils.isEqual(5.0, 5.05, 0.1)).toBe(true);
      expect(ToleranceUtils.isEqual(5.0, 5.15, 0.1)).toBe(false);
    });
  });

  describe("isLess", () => {
    test("should return true when first value is clearly less", () => {
      expect(ToleranceUtils.isLess(4.0, 5.0)).toBe(true);
      expect(ToleranceUtils.isLess(4.9, 5.0)).toBe(true);
    });

    test("should return false when values are within tolerance", () => {
      expect(ToleranceUtils.isLess(4.98, 5.0)).toBe(false);
      expect(ToleranceUtils.isLess(5.0, 5.02)).toBe(false);
    });

    test("should return false when first value is greater", () => {
      expect(ToleranceUtils.isLess(5.1, 5.0)).toBe(false);
      expect(ToleranceUtils.isLess(6.0, 5.0)).toBe(false);
    });

    test("should work with custom epsilon", () => {
      expect(ToleranceUtils.isLess(4.85, 5.0, 0.1)).toBe(true); // 4.85 < 5.0 - 0.1 = 4.9
      expect(ToleranceUtils.isLess(4.92, 5.0, 0.1)).toBe(false); // 4.92 >= 5.0 - 0.1 = 4.9
    });
  });

  describe("isLessOrEqual", () => {
    test("should return true when first value is less", () => {
      expect(ToleranceUtils.isLessOrEqual(4.0, 5.0)).toBe(true);
      expect(ToleranceUtils.isLessOrEqual(4.9, 5.0)).toBe(true);
    });

    test("should return true when values are within tolerance", () => {
      expect(ToleranceUtils.isLessOrEqual(4.98, 5.0)).toBe(true);
      expect(ToleranceUtils.isLessOrEqual(5.0, 5.02)).toBe(true);
      expect(ToleranceUtils.isLessOrEqual(5.03, 5.0)).toBe(true);
    });

    test("should return false when first value is significantly greater", () => {
      expect(ToleranceUtils.isLessOrEqual(5.04, 5.0)).toBe(false);
      expect(ToleranceUtils.isLessOrEqual(6.0, 5.0)).toBe(false);
    });
  });

  describe("isGreater", () => {
    test("should return true when first value is clearly greater", () => {
      expect(ToleranceUtils.isGreater(6.0, 5.0)).toBe(true);
      expect(ToleranceUtils.isGreater(5.1, 5.0)).toBe(true);
    });

    test("should return false when values are within tolerance", () => {
      expect(ToleranceUtils.isGreater(5.02, 5.0)).toBe(false);
      expect(ToleranceUtils.isGreater(5.0, 4.98)).toBe(false);
    });

    test("should return false when first value is less", () => {
      expect(ToleranceUtils.isGreater(4.9, 5.0)).toBe(false);
      expect(ToleranceUtils.isGreater(4.0, 5.0)).toBe(false);
    });
  });

  describe("isGreaterOrEqual", () => {
    test("should return true when first value is greater", () => {
      expect(ToleranceUtils.isGreaterOrEqual(6.0, 5.0)).toBe(true);
      expect(ToleranceUtils.isGreaterOrEqual(5.1, 5.0)).toBe(true);
    });

    test("should return true when values are within tolerance", () => {
      expect(ToleranceUtils.isGreaterOrEqual(5.02, 5.0)).toBe(true);
      expect(ToleranceUtils.isGreaterOrEqual(5.0, 4.98)).toBe(true);
      expect(ToleranceUtils.isGreaterOrEqual(4.97, 5.0)).toBe(true);
    });

    test("should return false when first value is significantly less", () => {
      expect(ToleranceUtils.isGreaterOrEqual(4.96, 5.0)).toBe(false);
      expect(ToleranceUtils.isGreaterOrEqual(4.0, 5.0)).toBe(false);
    });
  });

  describe("applyTolerance", () => {
    test("should subtract epsilon for min direction", () => {
      const result = ToleranceUtils.applyTolerance(5.0, "min");
      expect(result).toBeCloseTo(5.0 - EPSILON);
    });

    test("should add epsilon for max direction", () => {
      const result = ToleranceUtils.applyTolerance(5.0, "max");
      expect(result).toBeCloseTo(5.0 + EPSILON);
    });

    test("should work with custom epsilon", () => {
      const customEpsilon = 0.1;
      const minResult = ToleranceUtils.applyTolerance(
        5.0,
        "min",
        customEpsilon
      );
      const maxResult = ToleranceUtils.applyTolerance(
        5.0,
        "max",
        customEpsilon
      );

      expect(minResult).toBeCloseTo(4.9);
      expect(maxResult).toBeCloseTo(5.1);
    });
  });

  describe("roundToPrecision", () => {
    test("should round to default precision (3 decimal places)", () => {
      expect(ToleranceUtils.roundToPrecision(5.123456)).toBe(5.123);
      expect(ToleranceUtils.roundToPrecision(5.1236)).toBe(5.124);
    });

    test("should round to custom precision", () => {
      expect(ToleranceUtils.roundToPrecision(5.123456, 2)).toBe(5.12);
      expect(ToleranceUtils.roundToPrecision(5.126, 2)).toBe(5.13);
      expect(ToleranceUtils.roundToPrecision(5.123456, 1)).toBe(5.1);
    });

    test("should handle zero precision", () => {
      expect(ToleranceUtils.roundToPrecision(5.7, 0)).toBe(6);
      expect(ToleranceUtils.roundToPrecision(5.3, 0)).toBe(5);
    });
  });

  describe("isWithinRange", () => {
    test("should return true for values within range", () => {
      expect(ToleranceUtils.isWithinRange(5.0, 3.0, 7.0)).toBe(true);
      expect(ToleranceUtils.isWithinRange(3.0, 3.0, 7.0)).toBe(true);
      expect(ToleranceUtils.isWithinRange(7.0, 3.0, 7.0)).toBe(true);
    });

    test("should return true for values within range considering tolerance", () => {
      expect(ToleranceUtils.isWithinRange(2.98, 3.0, 7.0)).toBe(true);
      expect(ToleranceUtils.isWithinRange(7.02, 3.0, 7.0)).toBe(true);
    });

    test("should return false for values outside range", () => {
      expect(ToleranceUtils.isWithinRange(2.96, 3.0, 7.0)).toBe(false);
      expect(ToleranceUtils.isWithinRange(7.04, 3.0, 7.0)).toBe(false);
      expect(ToleranceUtils.isWithinRange(1.0, 3.0, 7.0)).toBe(false);
      expect(ToleranceUtils.isWithinRange(9.0, 3.0, 7.0)).toBe(false);
    });
  });

  describe("clampWithTolerance", () => {
    test("should not modify values within range", () => {
      expect(ToleranceUtils.clampWithTolerance(5.0, 3.0, 7.0)).toBe(5.0);
      expect(ToleranceUtils.clampWithTolerance(3.02, 3.0, 7.0)).toBe(3.02);
      expect(ToleranceUtils.clampWithTolerance(6.98, 3.0, 7.0)).toBe(6.98);
    });

    test("should clamp values outside range", () => {
      expect(ToleranceUtils.clampWithTolerance(2.0, 3.0, 7.0)).toBe(3.0);
      expect(ToleranceUtils.clampWithTolerance(8.0, 3.0, 7.0)).toBe(7.0);
    });

    test("should handle values at tolerance boundaries", () => {
      expect(ToleranceUtils.clampWithTolerance(2.98, 3.0, 7.0)).toBe(2.98);
      expect(ToleranceUtils.clampWithTolerance(7.02, 3.0, 7.0)).toBe(7.02);
      expect(ToleranceUtils.clampWithTolerance(2.96, 3.0, 7.0)).toBe(3.0);
      expect(ToleranceUtils.clampWithTolerance(7.04, 3.0, 7.0)).toBe(7.0);
    });
  });

  describe("compare", () => {
    test("should return 0 for equal values", () => {
      expect(ToleranceUtils.compare(5.0, 5.0)).toBe(0);
      expect(ToleranceUtils.compare(5.0, 5.02)).toBe(0);
      expect(ToleranceUtils.compare(5.0, 4.98)).toBe(0);
    });

    test("should return -1 when first value is less", () => {
      expect(ToleranceUtils.compare(4.0, 5.0)).toBe(-1);
      expect(ToleranceUtils.compare(4.96, 5.0)).toBe(-1);
    });

    test("should return 1 when first value is greater", () => {
      expect(ToleranceUtils.compare(6.0, 5.0)).toBe(1);
      expect(ToleranceUtils.compare(5.04, 5.0)).toBe(1);
    });
  });

  describe("getEpsilon", () => {
    test("should return the correct epsilon value", () => {
      expect(ToleranceUtils.getEpsilon()).toBe(EPSILON);
    });
  });

  describe("isSignificantDifference", () => {
    test("should return false for differences within tolerance", () => {
      expect(ToleranceUtils.isSignificantDifference(5.0, 5.02)).toBe(false);
      expect(ToleranceUtils.isSignificantDifference(5.0, 4.98)).toBe(false);
      expect(ToleranceUtils.isSignificantDifference(5.0, 5.029)).toBe(false); // just under tolerance
    });

    test("should return true for differences outside tolerance", () => {
      expect(ToleranceUtils.isSignificantDifference(5.0, 5.04)).toBe(true);
      expect(ToleranceUtils.isSignificantDifference(5.0, 4.96)).toBe(true);
      expect(ToleranceUtils.isSignificantDifference(5.0, 6.0)).toBe(true);
    });
  });

  describe("findClosest", () => {
    test("should find closest value in array", () => {
      const values = [1.0, 3.0, 5.0, 7.0, 9.0];
      expect(ToleranceUtils.findClosest(3.8, values)).toBe(3.0); // closer to 3 than 5
      expect(ToleranceUtils.findClosest(4.8, values)).toBe(5.0); // closer to 5 than 3
      expect(ToleranceUtils.findClosest(6.0, values)).toBe(5.0); // closer to 5 than 7
    });

    test("should handle single value array", () => {
      expect(ToleranceUtils.findClosest(10.0, [5.0])).toBe(5.0);
    });

    test("should throw error for empty array", () => {
      expect(() => ToleranceUtils.findClosest(5.0, [])).toThrow(
        "Cannot find closest value in empty array"
      );
    });

    test("should handle exact matches", () => {
      const values = [1.0, 3.0, 5.0, 7.0, 9.0];
      expect(ToleranceUtils.findClosest(5.0, values)).toBe(5.0);
    });
  });

  describe("arePointsEqual", () => {
    test("should return true for identical points", () => {
      const point1 = { x: 3.0, y: 4.0 };
      const point2 = { x: 3.0, y: 4.0 };
      expect(ToleranceUtils.arePointsEqual(point1, point2)).toBe(true);
    });

    test("should return true for points within tolerance", () => {
      const point1 = { x: 3.0, y: 4.0 };
      const point2 = { x: 3.02, y: 4.01 };
      expect(ToleranceUtils.arePointsEqual(point1, point2)).toBe(true);
    });

    test("should return false for points outside tolerance", () => {
      const point1 = { x: 3.0, y: 4.0 };
      const point2 = { x: 3.05, y: 4.0 };
      expect(ToleranceUtils.arePointsEqual(point1, point2)).toBe(false);

      const point3 = { x: 3.0, y: 4.05 };
      expect(ToleranceUtils.arePointsEqual(point1, point3)).toBe(false);
    });

    test("should work with custom epsilon", () => {
      const point1 = { x: 3.0, y: 4.0 };
      const point2 = { x: 3.08, y: 4.06 };
      expect(ToleranceUtils.arePointsEqual(point1, point2, 0.1)).toBe(true);
      expect(ToleranceUtils.arePointsEqual(point1, point2, 0.05)).toBe(false);
    });
  });

  describe("edge cases and boundary conditions", () => {
    test("should handle zero values correctly", () => {
      expect(ToleranceUtils.isEqual(0, 0.02)).toBe(true);
      expect(ToleranceUtils.isEqual(0, 0.04)).toBe(false);
      expect(ToleranceUtils.isLessOrEqual(0, 0.03)).toBe(true);
      expect(ToleranceUtils.isGreaterOrEqual(0, -0.03)).toBe(true);
    });

    test("should handle negative values correctly", () => {
      expect(ToleranceUtils.isEqual(-5.0, -5.02)).toBe(true);
      expect(ToleranceUtils.isLess(-5.1, -5.0)).toBe(true);
      expect(ToleranceUtils.isGreater(-4.9, -5.0)).toBe(true);
    });

    test("should handle very small values correctly", () => {
      expect(ToleranceUtils.isEqual(0.001, 0.002)).toBe(true);
      expect(ToleranceUtils.isEqual(0.001, 0.035)).toBe(false);
    });

    test("should handle very large values correctly", () => {
      expect(ToleranceUtils.isEqual(1000.0, 1000.02)).toBe(true);
      expect(ToleranceUtils.isEqual(1000.0, 1000.04)).toBe(false);
    });
  });
});
