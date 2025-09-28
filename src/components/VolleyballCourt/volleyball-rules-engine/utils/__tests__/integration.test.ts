/**
 * Integration tests for coordinate transformation utilities
 */

import { describe, test, expect } from "vitest";
import { CoordinateTransformer, ToleranceUtils } from "../index";
import {
  COORDINATE_SYSTEM,
  SCREEN_COORDINATE_SYSTEM,
} from "../../types/CoordinateSystem";

describe("Coordinate System Integration", () => {
  test("should correctly transform between screen and volleyball coordinates", () => {
    // Test center court position
    const screenCenter = {
      x: SCREEN_COORDINATE_SYSTEM.SCREEN_WIDTH / 2,
      y: SCREEN_COORDINATE_SYSTEM.SCREEN_HEIGHT / 2,
    };

    const vbCenter = CoordinateTransformer.screenToVolleyball(
      screenCenter.x,
      screenCenter.y
    );
    expect(vbCenter.x).toBeCloseTo(COORDINATE_SYSTEM.COURT_WIDTH / 2);
    expect(vbCenter.y).toBeCloseTo(COORDINATE_SYSTEM.COURT_LENGTH / 2);

    // Transform back to screen
    const backToScreen = CoordinateTransformer.volleyballToScreen(
      vbCenter.x,
      vbCenter.y
    );
    expect(backToScreen.x).toBeCloseTo(screenCenter.x);
    expect(backToScreen.y).toBeCloseTo(screenCenter.y);
  });

  test("should validate positions correctly with tolerance", () => {
    // Test position just within court bounds
    const nearBoundary = {
      x: COORDINATE_SYSTEM.RIGHT_SIDELINE_X - 0.01, // 1cm from right sideline
      y: COORDINATE_SYSTEM.ENDLINE_Y - 0.01, // 1cm from endline
    };

    expect(
      CoordinateTransformer.isValidPosition(nearBoundary.x, nearBoundary.y)
    ).toBe(true);

    // Test position just outside court bounds
    const outsideBoundary = {
      x: COORDINATE_SYSTEM.RIGHT_SIDELINE_X + 0.01, // 1cm outside right sideline
      y: COORDINATE_SYSTEM.ENDLINE_Y + 0.01, // 1cm outside endline
    };

    expect(
      CoordinateTransformer.isValidPosition(
        outsideBoundary.x,
        outsideBoundary.y
      )
    ).toBe(false);
  });

  test("should handle service zone positioning correctly", () => {
    const serviceZonePosition = {
      x: COORDINATE_SYSTEM.COURT_WIDTH / 2, // center of court width
      y: COORDINATE_SYSTEM.SERVICE_ZONE_START + 0.5, // 0.5m into service zone
    };

    // Should be invalid without service zone allowance
    expect(
      CoordinateTransformer.isValidPosition(
        serviceZonePosition.x,
        serviceZonePosition.y,
        false
      )
    ).toBe(false);

    // Should be valid with service zone allowance
    expect(
      CoordinateTransformer.isValidPosition(
        serviceZonePosition.x,
        serviceZonePosition.y,
        true
      )
    ).toBe(true);
  });

  test("should use tolerance for position comparisons", () => {
    const position1 = { x: 4.5, y: 4.5 };
    const position2 = { x: 4.52, y: 4.48 }; // Within 3cm tolerance

    expect(ToleranceUtils.arePointsEqual(position1, position2)).toBe(true);

    const position3 = { x: 4.55, y: 4.45 }; // Outside 3cm tolerance
    expect(ToleranceUtils.arePointsEqual(position1, position3)).toBe(false);
  });

  test("should normalize coordinates to valid bounds", () => {
    // Test coordinates outside court bounds
    const outsidePosition = { x: -1, y: 12 };
    const normalized = CoordinateTransformer.normalizeCoordinates(
      outsidePosition.x,
      outsidePosition.y
    );

    expect(normalized.x).toBe(COORDINATE_SYSTEM.LEFT_SIDELINE_X);
    expect(normalized.y).toBe(COORDINATE_SYSTEM.ENDLINE_Y);

    // Test with service zone allowed
    const normalizedWithService = CoordinateTransformer.normalizeCoordinates(
      outsidePosition.x,
      outsidePosition.y,
      true
    );

    expect(normalizedWithService.x).toBe(COORDINATE_SYSTEM.LEFT_SIDELINE_X);
    expect(normalizedWithService.y).toBe(COORDINATE_SYSTEM.SERVICE_ZONE_END);
  });

  test("should calculate distances correctly", () => {
    const point1 = { x: 0, y: 0 };
    const point2 = { x: 3, y: 4 };

    const distance = CoordinateTransformer.calculateDistance(point1, point2);
    expect(distance).toBe(5); // 3-4-5 triangle

    // Test with volleyball court coordinates
    const leftFront = { x: 0, y: 0 };
    const rightBack = {
      x: COORDINATE_SYSTEM.COURT_WIDTH,
      y: COORDINATE_SYSTEM.COURT_LENGTH,
    };

    const courtDiagonal = CoordinateTransformer.calculateDistance(
      leftFront,
      rightBack
    );
    expect(courtDiagonal).toBeCloseTo(Math.sqrt(81 + 81)); // sqrt(9^2 + 9^2)
  });

  test("should handle bounds conversion correctly", () => {
    const vbBounds = {
      minX: 2,
      maxX: 7,
      minY: 1,
      maxY: 8,
    };

    const screenBounds =
      CoordinateTransformer.volleyballBoundsToScreen(vbBounds);
    const backToVb =
      CoordinateTransformer.screenBoundsToVolleyball(screenBounds);

    expect(backToVb.minX).toBeCloseTo(vbBounds.minX, 10);
    expect(backToVb.maxX).toBeCloseTo(vbBounds.maxX, 10);
    expect(backToVb.minY).toBeCloseTo(vbBounds.minY, 10);
    expect(backToVb.maxY).toBeCloseTo(vbBounds.maxY, 10);
  });

  test("should apply tolerance correctly in constraint calculations", () => {
    const baseValue = 5.0;

    const minConstraint = ToleranceUtils.applyTolerance(baseValue, "min");
    const maxConstraint = ToleranceUtils.applyTolerance(baseValue, "max");

    expect(minConstraint).toBeCloseTo(baseValue - COORDINATE_SYSTEM.TOLERANCE);
    expect(maxConstraint).toBeCloseTo(baseValue + COORDINATE_SYSTEM.TOLERANCE);

    // Test that values within tolerance are considered valid
    expect(
      ToleranceUtils.isWithinRange(
        baseValue + 0.02,
        minConstraint,
        maxConstraint
      )
    ).toBe(true);
    expect(
      ToleranceUtils.isWithinRange(
        baseValue - 0.02,
        minConstraint,
        maxConstraint
      )
    ).toBe(true);
    // Test that values outside the expanded range are invalid
    // Since minConstraint = 5.0 - 0.03 = 4.97 and maxConstraint = 5.0 + 0.03 = 5.03
    // And isWithinRange applies tolerance again, we need a value that's clearly outside
    expect(
      ToleranceUtils.isWithinRange(
        baseValue + 0.08,
        minConstraint,
        maxConstraint
      )
    ).toBe(false);
  });
});
