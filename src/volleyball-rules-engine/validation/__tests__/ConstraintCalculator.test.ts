/**
 * Tests for ConstraintCalculator - real-time constraint calculation system
 */

import { describe, test, expect } from "vitest";
import { ConstraintCalculator } from "../ConstraintCalculator";
import type { PlayerState, RotationSlot } from "../../types/PlayerState";
import { COORDINATE_SYSTEM } from "../../types/CoordinateSystem";

/**
 * Helper function to create a test player
 */
function createPlayer(
  slot: RotationSlot,
  x: number,
  y: number,
  isServer: boolean = false
): PlayerState {
  return {
    id: `player-${slot}`,
    displayName: `Player ${slot}`,
    role: "Unknown",
    slot,
    x,
    y,
    isServer,
  };
}

/**
 * Helper function to create a standard formation
 */
function createStandardFormation(
  serverSlot: RotationSlot = 1
): Map<RotationSlot, PlayerState> {
  const positions = new Map<RotationSlot, PlayerState>();

  // Standard 6-2 receive formation positions
  positions.set(1, createPlayer(1, 7.5, 6.0, serverSlot === 1)); // RB
  positions.set(2, createPlayer(2, 7.5, 2.0, serverSlot === 2)); // RF
  positions.set(3, createPlayer(3, 4.5, 2.0, serverSlot === 3)); // MF
  positions.set(4, createPlayer(4, 1.5, 2.0, serverSlot === 4)); // LF
  positions.set(5, createPlayer(5, 1.5, 6.0, serverSlot === 5)); // LB
  positions.set(6, createPlayer(6, 4.5, 6.0, serverSlot === 6)); // MB

  return positions;
}

describe("ConstraintCalculator", () => {
  describe("calculateValidBounds", () => {
    test("should return unconstrained bounds for server", () => {
      const positions = createStandardFormation(1);
      const bounds = ConstraintCalculator.calculateValidBounds(
        1,
        positions,
        true
      );

      expect(bounds.isConstrained).toBe(false);
      expect(bounds.minX).toBe(COORDINATE_SYSTEM.LEFT_SIDELINE_X);
      expect(bounds.maxX).toBe(COORDINATE_SYSTEM.RIGHT_SIDELINE_X);
      expect(bounds.minY).toBe(COORDINATE_SYSTEM.NET_Y);
      expect(bounds.maxY).toBe(COORDINATE_SYSTEM.SERVICE_ZONE_END);
      expect(bounds.constraintReasons).toContain(
        "Server exemption: no overlap constraints apply"
      );
    });

    test("should calculate left/right constraints for middle front player", () => {
      const positions = createStandardFormation(1);
      const bounds = ConstraintCalculator.calculateValidBounds(
        3,
        positions,
        false
      );

      expect(bounds.isConstrained).toBe(true);

      // MF (slot 3) should be constrained by LF (slot 4) on left and RF (slot 2) on right
      const lfPlayer = positions.get(4)!;
      const rfPlayer = positions.get(2)!;

      expect(bounds.minX).toBeGreaterThan(lfPlayer.x);
      expect(bounds.maxX).toBeLessThan(rfPlayer.x);

      expect(bounds.constraintReasons).toContain(
        "Must be right of LF (slot 4)"
      );
      expect(bounds.constraintReasons).toContain("Must be left of RF (slot 2)");
    });

    test("should calculate front/back constraints for front row player", () => {
      const positions = createStandardFormation(1);
      const bounds = ConstraintCalculator.calculateValidBounds(
        4,
        positions,
        false
      );

      expect(bounds.isConstrained).toBe(true);

      // LF (slot 4) should be constrained by LB (slot 5) counterpart
      const lbPlayer = positions.get(5)!;

      expect(bounds.maxY).toBeLessThan(lbPlayer.y);
      expect(bounds.constraintReasons).toContain(
        "Must be in front of LB (slot 5)"
      );
    });

    test("should calculate front/back constraints for back row player", () => {
      const positions = createStandardFormation(1);
      const bounds = ConstraintCalculator.calculateValidBounds(
        5,
        positions,
        false
      );

      expect(bounds.isConstrained).toBe(true);

      // LB (slot 5) should be constrained by LF (slot 4) counterpart
      const lfPlayer = positions.get(4)!;

      expect(bounds.minY).toBeGreaterThan(lfPlayer.y);
      expect(bounds.constraintReasons).toContain("Must be behind LF (slot 4)");
    });

    test("should ignore server neighbors in constraint calculation", () => {
      const positions = createStandardFormation(4); // LF is server
      const bounds = ConstraintCalculator.calculateValidBounds(
        3,
        positions,
        false
      );

      // MF (slot 3) should only be constrained by RF (slot 2), not LF (slot 4) since LF is server
      const rfPlayer = positions.get(2)!;

      expect(bounds.maxX).toBeLessThan(rfPlayer.x);
      expect(bounds.constraintReasons).toContain("Must be left of RF (slot 2)");
      expect(bounds.constraintReasons).not.toContain(
        "Must be right of LF (slot 4)"
      );
    });

    test("should handle edge positions correctly", () => {
      const positions = createStandardFormation(1);

      // Test leftmost front player (LF)
      const lfBounds = ConstraintCalculator.calculateValidBounds(
        4,
        positions,
        false
      );
      expect(lfBounds.minX).toBe(COORDINATE_SYSTEM.LEFT_SIDELINE_X);

      // Test rightmost front player (RF)
      const rfBounds = ConstraintCalculator.calculateValidBounds(
        2,
        positions,
        false
      );
      expect(rfBounds.maxX).toBe(COORDINATE_SYSTEM.RIGHT_SIDELINE_X);
    });

    test("should return court bounds for non-server", () => {
      const positions = createStandardFormation(1);
      const bounds = ConstraintCalculator.calculateValidBounds(
        1,
        positions,
        false
      );

      expect(bounds.minY).toBe(COORDINATE_SYSTEM.NET_Y);
      expect(bounds.maxY).toBe(COORDINATE_SYSTEM.ENDLINE_Y);
    });
  });

  describe("isPositionValid", () => {
    test("should return true for valid positions", () => {
      const positions = createStandardFormation(1);

      // Test valid position for MF
      const isValid = ConstraintCalculator.isPositionValid(
        3,
        { x: 4.5, y: 2.5 },
        positions,
        false
      );

      expect(isValid).toBe(true);
    });

    test("should return false for positions violating left/right constraints", () => {
      const positions = createStandardFormation(1);

      // Test MF positioned too far left (violating LF constraint)
      const tooLeft = ConstraintCalculator.isPositionValid(
        3,
        { x: 1.0, y: 2.5 },
        positions,
        false
      );

      expect(tooLeft).toBe(false);

      // Test MF positioned too far right (violating RF constraint)
      const tooRight = ConstraintCalculator.isPositionValid(
        3,
        { x: 8.0, y: 2.5 },
        positions,
        false
      );

      expect(tooRight).toBe(false);
    });

    test("should return false for positions violating front/back constraints", () => {
      const positions = createStandardFormation(1);

      // Test LF positioned behind LB
      const behindCounterpart = ConstraintCalculator.isPositionValid(
        4,
        { x: 1.5, y: 7.0 },
        positions,
        false
      );

      expect(behindCounterpart).toBe(false);
    });

    test("should return true for server in service zone", () => {
      const positions = createStandardFormation(1);

      const serverInServiceZone = ConstraintCalculator.isPositionValid(
        1,
        { x: 4.5, y: 10.0 },
        positions,
        true
      );

      expect(serverInServiceZone).toBe(true);
    });

    test("should return false for invalid coordinates", () => {
      const positions = createStandardFormation(1);

      // Test position outside court bounds
      const outsideCourt = ConstraintCalculator.isPositionValid(
        3,
        { x: -1.0, y: 2.5 },
        positions,
        false
      );

      expect(outsideCourt).toBe(false);
    });

    test("should handle tolerance correctly", () => {
      const positions = new Map<RotationSlot, PlayerState>();
      positions.set(4, createPlayer(4, 2.0, 2.0)); // LF
      positions.set(3, createPlayer(3, 4.0, 2.0)); // MF
      positions.set(2, createPlayer(2, 6.0, 2.0)); // RF

      // Position just within tolerance of LF
      const withinTolerance = ConstraintCalculator.isPositionValid(
        3,
        { x: 2.0 + COORDINATE_SYSTEM.TOLERANCE + 0.001, y: 2.5 },
        positions,
        false
      );

      expect(withinTolerance).toBe(true);

      // Position just outside tolerance of LF
      const outsideTolerance = ConstraintCalculator.isPositionValid(
        3,
        { x: 2.0 + COORDINATE_SYSTEM.TOLERANCE - 0.001, y: 2.5 },
        positions,
        false
      );

      expect(outsideTolerance).toBe(false);
    });
  });

  describe("snapToValidPosition", () => {
    test("should return same position if already valid", () => {
      const positions = createStandardFormation(1);
      const validPosition = { x: 4.5, y: 2.5 };

      const snapped = ConstraintCalculator.snapToValidPosition(
        3,
        validPosition,
        positions,
        false
      );

      expect(snapped).toEqual(validPosition);
    });

    test("should snap to nearest valid X coordinate", () => {
      const positions = createStandardFormation(1);
      const invalidPosition = { x: 1.0, y: 2.5 }; // Too far left for MF

      const snapped = ConstraintCalculator.snapToValidPosition(
        3,
        invalidPosition,
        positions,
        false
      );

      expect(snapped.x).toBeGreaterThan(invalidPosition.x);
      expect(snapped.y).toBe(invalidPosition.y);
    });

    test("should snap to nearest valid Y coordinate", () => {
      const positions = createStandardFormation(1);
      const invalidPosition = { x: 1.5, y: 7.0 }; // LF behind LB

      const snapped = ConstraintCalculator.snapToValidPosition(
        4,
        invalidPosition,
        positions,
        false
      );

      expect(snapped.x).toBe(invalidPosition.x);
      expect(snapped.y).toBeLessThan(invalidPosition.y);
    });

    test("should snap to court boundaries", () => {
      const positions = createStandardFormation(1);
      const outsidePosition = { x: -1.0, y: 12.0 };

      const snapped = ConstraintCalculator.snapToValidPosition(
        3,
        outsidePosition,
        positions,
        false
      );

      expect(snapped.x).toBeGreaterThanOrEqual(
        COORDINATE_SYSTEM.LEFT_SIDELINE_X
      );
      expect(snapped.y).toBeLessThanOrEqual(COORDINATE_SYSTEM.ENDLINE_Y);
    });

    test("should allow server in service zone", () => {
      const positions = createStandardFormation(1);
      const serviceZonePosition = { x: 4.5, y: 10.5 };

      const snapped = ConstraintCalculator.snapToValidPosition(
        1,
        serviceZonePosition,
        positions,
        true
      );

      expect(snapped).toEqual(serviceZonePosition);
    });
  });

  describe("complex constraint scenarios", () => {
    test("should handle multiple overlapping constraints", () => {
      const positions = new Map<RotationSlot, PlayerState>();

      // Create tight formation where MF has very limited space
      positions.set(4, createPlayer(4, 3.0, 2.0)); // LF close to center
      positions.set(3, createPlayer(3, 4.5, 2.0)); // MF in middle
      positions.set(2, createPlayer(2, 6.0, 2.0)); // RF
      positions.set(5, createPlayer(5, 3.0, 6.0)); // LB
      positions.set(6, createPlayer(6, 4.5, 3.5)); // MB close to front
      positions.set(1, createPlayer(1, 6.0, 6.0)); // RB

      const bounds = ConstraintCalculator.calculateValidBounds(
        3,
        positions,
        false
      );

      expect(bounds.isConstrained).toBe(true);
      expect(bounds.minX).toBeGreaterThan(3.0); // Must be right of LF
      expect(bounds.maxX).toBeLessThan(6.0); // Must be left of RF
      expect(bounds.maxY).toBeLessThan(3.5); // Must be in front of MB
    });

    test("should handle conflicting constraints gracefully", () => {
      const positions = new Map<RotationSlot, PlayerState>();

      // Create impossible constraint scenario
      positions.set(4, createPlayer(4, 5.0, 2.0)); // LF to the right
      positions.set(3, createPlayer(3, 4.5, 2.0)); // MF in middle
      positions.set(2, createPlayer(2, 4.0, 2.0)); // RF to the left

      const bounds = ConstraintCalculator.calculateValidBounds(
        3,
        positions,
        false
      );

      expect(bounds.isConstrained).toBe(true);
      expect(bounds.constraintReasons).toContain(
        "Conflicting constraints detected"
      );
    });

    test("should handle all players as servers correctly", () => {
      for (let serverSlot = 1; serverSlot <= 6; serverSlot++) {
        const positions = createStandardFormation(serverSlot as RotationSlot);
        const bounds = ConstraintCalculator.calculateValidBounds(
          serverSlot as RotationSlot,
          positions,
          true
        );

        expect(bounds.isConstrained).toBe(false);
        expect(bounds.constraintReasons).toContain(
          "Server exemption: no overlap constraints apply"
        );
      }
    });

    test("should validate positions with tolerance edge cases", () => {
      const positions = new Map<RotationSlot, PlayerState>();
      const tolerance = COORDINATE_SYSTEM.TOLERANCE;

      positions.set(4, createPlayer(4, 2.0, 2.0)); // LF
      positions.set(2, createPlayer(2, 6.0, 2.0)); // RF

      // Test position exactly at tolerance boundary
      const exactTolerance = ConstraintCalculator.isPositionValid(
        3,
        { x: 2.0 + tolerance, y: 2.5 },
        positions,
        false
      );

      expect(exactTolerance).toBe(true);
    });
  });

  describe("integration with existing validation", () => {
    test("should work with realistic volleyball formations", () => {
      // Test with a realistic 5-1 receive formation
      const positions = new Map<RotationSlot, PlayerState>();

      positions.set(1, createPlayer(1, 8.0, 7.0, true)); // Server in service zone
      positions.set(2, createPlayer(2, 7.0, 1.5)); // RF
      positions.set(3, createPlayer(3, 4.5, 1.5)); // MF
      positions.set(4, createPlayer(4, 2.0, 1.5)); // LF
      positions.set(5, createPlayer(5, 2.0, 7.0)); // LB
      positions.set(6, createPlayer(6, 4.5, 7.0)); // MB

      // All non-server positions should be valid
      for (let slot = 2; slot <= 6; slot++) {
        const player = positions.get(slot as RotationSlot)!;
        const isValid = ConstraintCalculator.isPositionValid(
          slot as RotationSlot,
          { x: player.x, y: player.y },
          positions,
          false
        );
        expect(isValid).toBe(true);
      }

      // Server should be valid in service zone
      const serverValid = ConstraintCalculator.isPositionValid(
        1,
        { x: 8.0, y: 10.0 },
        positions,
        true
      );
      expect(serverValid).toBe(true);
    });
  });
});
