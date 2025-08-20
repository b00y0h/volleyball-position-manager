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

  describe("dynamic constraint boundary enforcement", () => {
    test("should update constraint boundaries when other players move", () => {
      const positions = new Map<RotationSlot, PlayerState>();

      // Initial formation
      positions.set(4, createPlayer(4, 2.0, 2.0)); // LF
      positions.set(3, createPlayer(3, 4.5, 2.0)); // MF
      positions.set(2, createPlayer(2, 7.0, 2.0)); // RF

      // Get initial bounds for MF
      const initialBounds = ConstraintCalculator.calculateValidBounds(
        3,
        positions,
        false
      );

      // Move LF to the right, which should tighten MF's left constraint
      positions.set(4, createPlayer(4, 3.0, 2.0)); // LF moved right

      // Get updated bounds for MF
      const updatedBounds = ConstraintCalculator.calculateValidBounds(
        3,
        positions,
        false
      );

      // MF's minimum X should increase (more restrictive)
      expect(updatedBounds.minX).toBeGreaterThan(initialBounds.minX);
      expect(updatedBounds.constraintReasons).toContain(
        "Must be right of LF (slot 4)"
      );
    });

    test("should handle multiple overlapping constraints with most restrictive wins", () => {
      const positions = new Map<RotationSlot, PlayerState>();

      // Create a scenario where MF has constraints from both neighbors and counterpart
      positions.set(4, createPlayer(4, 3.5, 2.0)); // LF close to center
      positions.set(3, createPlayer(3, 4.5, 2.0)); // MF in middle
      positions.set(2, createPlayer(2, 5.5, 2.0)); // RF close to center
      positions.set(6, createPlayer(6, 4.5, 3.0)); // MB close to front

      const bounds = ConstraintCalculator.calculateValidBounds(
        3,
        positions,
        false
      );

      // Should have multiple constraints
      expect(bounds.constraintReasons.length).toBeGreaterThan(1);
      expect(bounds.constraintReasons).toContain(
        "Must be right of LF (slot 4)"
      );
      expect(bounds.constraintReasons).toContain("Must be left of RF (slot 2)");
      expect(bounds.constraintReasons).toContain(
        "Must be in front of MB (slot 6)"
      );

      // Bounds should be the most restrictive
      expect(bounds.minX).toBeGreaterThanOrEqual(
        3.5 + COORDINATE_SYSTEM.TOLERANCE
      );
      expect(bounds.maxX).toBeLessThanOrEqual(
        5.5 - COORDINATE_SYSTEM.TOLERANCE
      );
      expect(bounds.maxY).toBeLessThanOrEqual(
        3.0 - COORDINATE_SYSTEM.TOLERANCE
      );
    });

    test("should detect and resolve constraint conflicts", () => {
      const positions = new Map<RotationSlot, PlayerState>();

      // Create impossible constraint scenario where neighbors are in wrong order
      positions.set(4, createPlayer(4, 6.0, 2.0)); // LF to the right
      positions.set(3, createPlayer(3, 4.5, 2.0)); // MF in middle
      positions.set(2, createPlayer(2, 3.0, 2.0)); // RF to the left

      const bounds = ConstraintCalculator.calculateValidBounds(
        3,
        positions,
        false
      );

      // Should detect conflicting constraints
      expect(bounds.constraintReasons).toContain(
        "Conflicting constraints detected"
      );

      // Should resolve conflict by using midpoint
      expect(bounds.minX).toBeCloseTo(bounds.maxX, 2);
    });

    test("should provide visual feedback data for constraint boundaries", () => {
      const positions = new Map<RotationSlot, PlayerState>();

      positions.set(4, createPlayer(4, 2.0, 2.0)); // LF
      positions.set(3, createPlayer(3, 4.5, 2.0)); // MF
      positions.set(2, createPlayer(2, 7.0, 2.0)); // RF
      positions.set(6, createPlayer(6, 4.5, 6.0)); // MB

      const bounds = ConstraintCalculator.calculateValidBounds(
        3,
        positions,
        false
      );

      // Should provide clear min/max values for UI
      expect(typeof bounds.minX).toBe("number");
      expect(typeof bounds.maxX).toBe("number");
      expect(typeof bounds.minY).toBe("number");
      expect(typeof bounds.maxY).toBe("number");

      // Should be within court bounds
      expect(bounds.minX).toBeGreaterThanOrEqual(
        COORDINATE_SYSTEM.LEFT_SIDELINE_X
      );
      expect(bounds.maxX).toBeLessThanOrEqual(
        COORDINATE_SYSTEM.RIGHT_SIDELINE_X
      );
      expect(bounds.minY).toBeGreaterThanOrEqual(COORDINATE_SYSTEM.NET_Y);
      expect(bounds.maxY).toBeLessThanOrEqual(COORDINATE_SYSTEM.ENDLINE_Y);
    });

    test("should track constraint reasons for user feedback", () => {
      const positions = new Map<RotationSlot, PlayerState>();

      positions.set(4, createPlayer(4, 2.0, 2.0)); // LF
      positions.set(3, createPlayer(3, 4.5, 2.0)); // MF
      positions.set(2, createPlayer(2, 7.0, 2.0)); // RF
      positions.set(6, createPlayer(6, 4.5, 6.0)); // MB

      const bounds = ConstraintCalculator.calculateValidBounds(
        3,
        positions,
        false
      );

      // Should provide human-readable constraint reasons
      expect(bounds.constraintReasons).toBeInstanceOf(Array);
      expect(bounds.constraintReasons.length).toBeGreaterThan(0);

      // Each reason should be a string
      bounds.constraintReasons.forEach((reason) => {
        expect(typeof reason).toBe("string");
        expect(reason.length).toBeGreaterThan(0);
      });

      // Should include specific constraint information
      expect(
        bounds.constraintReasons.some((reason) => reason.includes("slot"))
      ).toBe(true);
    });

    test("should handle dynamic updates during multi-player movement", () => {
      const positions = new Map<RotationSlot, PlayerState>();

      // Initial tight formation
      positions.set(4, createPlayer(4, 2.0, 2.0)); // LF
      positions.set(3, createPlayer(3, 3.0, 2.0)); // MF
      positions.set(2, createPlayer(2, 4.0, 2.0)); // RF

      // Simulate moving multiple players
      const scenarios = [
        // Move LF right - should tighten MF's left constraint
        { slot: 4 as RotationSlot, newPos: { x: 2.5, y: 2.0 } },
        // Move RF left - should tighten MF's right constraint
        { slot: 2 as RotationSlot, newPos: { x: 3.5, y: 2.0 } },
      ];

      scenarios.forEach((scenario) => {
        // Update position
        const player = positions.get(scenario.slot)!;
        positions.set(scenario.slot, {
          ...player,
          x: scenario.newPos.x,
          y: scenario.newPos.y,
        });

        // Check that MF's bounds are updated
        const bounds = ConstraintCalculator.calculateValidBounds(
          3,
          positions,
          false
        );

        // Should still be constrained
        expect(bounds.isConstrained).toBe(true);

        // Should have valid bounds
        expect(bounds.minX).toBeLessThanOrEqual(bounds.maxX);
        expect(bounds.minY).toBeLessThanOrEqual(bounds.maxY);

        // Position should be valid within bounds
        const currentMF = positions.get(3)!;
        if (bounds.minX <= bounds.maxX && bounds.minY <= bounds.maxY) {
          expect(currentMF.x).toBeGreaterThanOrEqual(bounds.minX - 0.001);
          expect(currentMF.x).toBeLessThanOrEqual(bounds.maxX + 0.001);
          expect(currentMF.y).toBeGreaterThanOrEqual(bounds.minY - 0.001);
          expect(currentMF.y).toBeLessThanOrEqual(bounds.maxY + 0.001);
        }
      });
    });

    test("should maintain constraint consistency across formation changes", () => {
      const positions = new Map<RotationSlot, PlayerState>();

      // Start with standard formation
      positions.set(1, createPlayer(1, 7.5, 6.0)); // RB
      positions.set(2, createPlayer(2, 7.5, 2.0)); // RF
      positions.set(3, createPlayer(3, 4.5, 2.0)); // MF
      positions.set(4, createPlayer(4, 1.5, 2.0)); // LF
      positions.set(5, createPlayer(5, 1.5, 6.0)); // LB
      positions.set(6, createPlayer(6, 4.5, 6.0)); // MB

      // Test each player's constraints
      for (let slot = 1; slot <= 6; slot++) {
        const bounds = ConstraintCalculator.calculateValidBounds(
          slot as RotationSlot,
          positions,
          false
        );

        // Bounds should be valid
        expect(bounds.minX).toBeLessThanOrEqual(bounds.maxX);
        expect(bounds.minY).toBeLessThanOrEqual(bounds.maxY);

        // Current position should be valid
        const isValid = ConstraintCalculator.isPositionValid(
          slot as RotationSlot,
          positions.get(slot as RotationSlot)!,
          positions,
          false
        );
        expect(isValid).toBe(true);
      }
    });
  });
});
