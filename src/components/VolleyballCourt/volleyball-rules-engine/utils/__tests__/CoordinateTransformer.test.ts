/**
 * Unit tests for CoordinateTransformer class
 */

import { describe, test, expect } from "vitest";
import { CoordinateTransformer, Point } from "../CoordinateTransformer";
import {
  COORDINATE_SYSTEM,
  SCREEN_COORDINATE_SYSTEM,
  COURT_BOUNDS,
  EXTENDED_BOUNDS,
} from "../../types/CoordinateSystem";

describe("CoordinateTransformer", () => {
  describe("screenToVolleyball", () => {
    test("should convert screen origin to volleyball origin", () => {
      const result = CoordinateTransformer.screenToVolleyball(0, 0);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    test("should convert screen max to volleyball max", () => {
      const result = CoordinateTransformer.screenToVolleyball(
        SCREEN_COORDINATE_SYSTEM.SCREEN_WIDTH,
        SCREEN_COORDINATE_SYSTEM.SCREEN_HEIGHT
      );
      expect(result.x).toBeCloseTo(COORDINATE_SYSTEM.COURT_WIDTH);
      expect(result.y).toBeCloseTo(COORDINATE_SYSTEM.COURT_LENGTH);
    });

    test("should convert screen center to volleyball center", () => {
      const result = CoordinateTransformer.screenToVolleyball(300, 180);
      expect(result.x).toBeCloseTo(4.5);
      expect(result.y).toBeCloseTo(4.5);
    });

    test("should handle fractional screen coordinates", () => {
      const result = CoordinateTransformer.screenToVolleyball(150.5, 90.25);
      expect(result.x).toBeCloseTo(2.2575);
      expect(result.y).toBeCloseTo(2.25625);
    });
  });

  describe("volleyballToScreen", () => {
    test("should convert volleyball origin to screen origin", () => {
      const result = CoordinateTransformer.volleyballToScreen(0, 0);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    test("should convert volleyball max to screen max", () => {
      const result = CoordinateTransformer.volleyballToScreen(
        COORDINATE_SYSTEM.COURT_WIDTH,
        COORDINATE_SYSTEM.COURT_LENGTH
      );
      expect(result.x).toBeCloseTo(SCREEN_COORDINATE_SYSTEM.SCREEN_WIDTH);
      expect(result.y).toBeCloseTo(SCREEN_COORDINATE_SYSTEM.SCREEN_HEIGHT);
    });

    test("should convert volleyball center to screen center", () => {
      const result = CoordinateTransformer.volleyballToScreen(4.5, 4.5);
      expect(result.x).toBeCloseTo(300);
      expect(result.y).toBeCloseTo(180);
    });

    test("should handle fractional volleyball coordinates", () => {
      const result = CoordinateTransformer.volleyballToScreen(2.25, 1.5);
      expect(result.x).toBeCloseTo(150);
      expect(result.y).toBeCloseTo(60);
    });
  });

  describe("bidirectional conversion", () => {
    test("should maintain precision in round-trip conversion from screen", () => {
      const originalScreen = { x: 123.45, y: 67.89 };
      const volleyball = CoordinateTransformer.screenToVolleyball(
        originalScreen.x,
        originalScreen.y
      );
      const backToScreen = CoordinateTransformer.volleyballToScreen(
        volleyball.x,
        volleyball.y
      );

      expect(backToScreen.x).toBeCloseTo(originalScreen.x, 10);
      expect(backToScreen.y).toBeCloseTo(originalScreen.y, 10);
    });

    test("should maintain precision in round-trip conversion from volleyball", () => {
      const originalVolleyball = { x: 3.456, y: 7.123 };
      const screen = CoordinateTransformer.volleyballToScreen(
        originalVolleyball.x,
        originalVolleyball.y
      );
      const backToVolleyball = CoordinateTransformer.screenToVolleyball(
        screen.x,
        screen.y
      );

      expect(backToVolleyball.x).toBeCloseTo(originalVolleyball.x, 10);
      expect(backToVolleyball.y).toBeCloseTo(originalVolleyball.y, 10);
    });
  });

  describe("isValidPosition", () => {
    test("should validate positions within court bounds", () => {
      expect(CoordinateTransformer.isValidPosition(4.5, 4.5)).toBe(true);
      expect(CoordinateTransformer.isValidPosition(0, 0)).toBe(true);
      expect(CoordinateTransformer.isValidPosition(9, 9)).toBe(true);
    });

    test("should reject positions outside court bounds", () => {
      expect(CoordinateTransformer.isValidPosition(-1, 4.5)).toBe(false);
      expect(CoordinateTransformer.isValidPosition(10, 4.5)).toBe(false);
      expect(CoordinateTransformer.isValidPosition(4.5, -1)).toBe(false);
      expect(CoordinateTransformer.isValidPosition(4.5, 12)).toBe(false);
    });

    test("should handle service zone when allowed", () => {
      expect(CoordinateTransformer.isValidPosition(4.5, 10, true)).toBe(true);
      expect(CoordinateTransformer.isValidPosition(4.5, 11, true)).toBe(true);
      expect(CoordinateTransformer.isValidPosition(4.5, 10, false)).toBe(false);
    });

    test("should reject service zone positions beyond limit", () => {
      expect(CoordinateTransformer.isValidPosition(4.5, 11.5, true)).toBe(
        false
      );
    });
  });

  describe("normalizeCoordinates", () => {
    test("should not modify valid coordinates", () => {
      const result = CoordinateTransformer.normalizeCoordinates(4.5, 4.5);
      expect(result).toEqual({ x: 4.5, y: 4.5 });
    });

    test("should clamp coordinates to court bounds", () => {
      const result1 = CoordinateTransformer.normalizeCoordinates(-1, 4.5);
      expect(result1).toEqual({ x: 0, y: 4.5 });

      const result2 = CoordinateTransformer.normalizeCoordinates(10, 4.5);
      expect(result2).toEqual({ x: 9, y: 4.5 });

      const result3 = CoordinateTransformer.normalizeCoordinates(4.5, -1);
      expect(result3).toEqual({ x: 4.5, y: 0 });

      const result4 = CoordinateTransformer.normalizeCoordinates(4.5, 12);
      expect(result4).toEqual({ x: 4.5, y: 9 });
    });

    test("should use extended bounds when service zone is allowed", () => {
      const result = CoordinateTransformer.normalizeCoordinates(
        4.5,
        10.5,
        true
      );
      expect(result).toEqual({ x: 4.5, y: 10.5 });

      const result2 = CoordinateTransformer.normalizeCoordinates(4.5, 12, true);
      expect(result2).toEqual({ x: 4.5, y: 11 });
    });
  });

  describe("isWithinBounds", () => {
    test("should correctly identify coordinates within bounds", () => {
      expect(CoordinateTransformer.isWithinBounds(4.5, 4.5, COURT_BOUNDS)).toBe(
        true
      );
      expect(CoordinateTransformer.isWithinBounds(0, 0, COURT_BOUNDS)).toBe(
        true
      );
      expect(CoordinateTransformer.isWithinBounds(9, 9, COURT_BOUNDS)).toBe(
        true
      );
    });

    test("should correctly identify coordinates outside bounds", () => {
      expect(
        CoordinateTransformer.isWithinBounds(-0.1, 4.5, COURT_BOUNDS)
      ).toBe(false);
      expect(CoordinateTransformer.isWithinBounds(9.1, 4.5, COURT_BOUNDS)).toBe(
        false
      );
      expect(
        CoordinateTransformer.isWithinBounds(4.5, -0.1, COURT_BOUNDS)
      ).toBe(false);
      expect(CoordinateTransformer.isWithinBounds(4.5, 9.1, COURT_BOUNDS)).toBe(
        false
      );
    });

    test("should work with extended bounds", () => {
      expect(
        CoordinateTransformer.isWithinBounds(4.5, 10, EXTENDED_BOUNDS)
      ).toBe(true);
      expect(
        CoordinateTransformer.isWithinBounds(4.5, 11, EXTENDED_BOUNDS)
      ).toBe(true);
      expect(
        CoordinateTransformer.isWithinBounds(4.5, 11.1, EXTENDED_BOUNDS)
      ).toBe(false);
    });
  });

  describe("clampToBounds", () => {
    test("should not modify coordinates within bounds", () => {
      const result = CoordinateTransformer.clampToBounds(
        4.5,
        4.5,
        COURT_BOUNDS
      );
      expect(result).toEqual({ x: 4.5, y: 4.5 });
    });

    test("should clamp coordinates to bounds", () => {
      const result1 = CoordinateTransformer.clampToBounds(
        -1,
        4.5,
        COURT_BOUNDS
      );
      expect(result1).toEqual({ x: 0, y: 4.5 });

      const result2 = CoordinateTransformer.clampToBounds(
        10,
        4.5,
        COURT_BOUNDS
      );
      expect(result2).toEqual({ x: 9, y: 4.5 });

      const result3 = CoordinateTransformer.clampToBounds(
        4.5,
        -1,
        COURT_BOUNDS
      );
      expect(result3).toEqual({ x: 4.5, y: 0 });

      const result4 = CoordinateTransformer.clampToBounds(
        4.5,
        12,
        COURT_BOUNDS
      );
      expect(result4).toEqual({ x: 4.5, y: 9 });
    });
  });

  describe("calculateDistance", () => {
    test("should calculate distance between same points as zero", () => {
      const point = { x: 3, y: 4 };
      const distance = CoordinateTransformer.calculateDistance(point, point);
      expect(distance).toBe(0);
    });

    test("should calculate distance between different points", () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 3, y: 4 };
      const distance = CoordinateTransformer.calculateDistance(point1, point2);
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    test("should calculate distance with negative coordinates", () => {
      const point1 = { x: -1, y: -1 };
      const point2 = { x: 2, y: 3 };
      const distance = CoordinateTransformer.calculateDistance(point1, point2);
      expect(distance).toBe(5); // sqrt((2-(-1))^2 + (3-(-1))^2) = sqrt(9+16) = 5
    });
  });

  describe("getScalingFactors", () => {
    test("should return correct scaling factors", () => {
      const factors = CoordinateTransformer.getScalingFactors();
      expect(factors.scaleX).toBeCloseTo(
        COORDINATE_SYSTEM.COURT_WIDTH / SCREEN_COORDINATE_SYSTEM.SCREEN_WIDTH
      );
      expect(factors.scaleY).toBeCloseTo(
        COORDINATE_SYSTEM.COURT_LENGTH / SCREEN_COORDINATE_SYSTEM.SCREEN_HEIGHT
      );
    });
  });

  describe("bounds conversion", () => {
    test("should convert screen bounds to volleyball bounds", () => {
      const screenBounds = { minX: 0, maxX: 300, minY: 0, maxY: 180 };
      const vbBounds =
        CoordinateTransformer.screenBoundsToVolleyball(screenBounds);

      expect(vbBounds.minX).toBeCloseTo(0);
      expect(vbBounds.maxX).toBeCloseTo(4.5);
      expect(vbBounds.minY).toBeCloseTo(0);
      expect(vbBounds.maxY).toBeCloseTo(4.5);
    });

    test("should convert volleyball bounds to screen bounds", () => {
      const vbBounds = { minX: 0, maxX: 4.5, minY: 0, maxY: 4.5 };
      const screenBounds =
        CoordinateTransformer.volleyballBoundsToScreen(vbBounds);

      expect(screenBounds.minX).toBeCloseTo(0);
      expect(screenBounds.maxX).toBeCloseTo(300);
      expect(screenBounds.minY).toBeCloseTo(0);
      expect(screenBounds.maxY).toBeCloseTo(180);
    });

    test("should maintain bounds consistency in round-trip conversion", () => {
      const originalBounds = { minX: 1, maxX: 8, minY: 2, maxY: 7 };
      const screenBounds =
        CoordinateTransformer.volleyballBoundsToScreen(originalBounds);
      const backToVb =
        CoordinateTransformer.screenBoundsToVolleyball(screenBounds);

      expect(backToVb.minX).toBeCloseTo(originalBounds.minX, 10);
      expect(backToVb.maxX).toBeCloseTo(originalBounds.maxX, 10);
      expect(backToVb.minY).toBeCloseTo(originalBounds.minY, 10);
      expect(backToVb.maxY).toBeCloseTo(originalBounds.maxY, 10);
    });
  });
});
