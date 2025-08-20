/**
 * Tests for OverlapValidator class
 */

import { describe, test, expect } from "vitest";
import { OverlapValidator } from "../OverlapValidator";
import type { PlayerState, RotationSlot } from "../../types/PlayerState";

/**
 * Helper function to create a test player
 */
function createPlayer(
  id: string,
  slot: RotationSlot,
  x: number,
  y: number,
  isServer: boolean = false,
  displayName?: string
): PlayerState {
  return {
    id,
    displayName: displayName || `Player ${id}`,
    role: "Unknown",
    slot,
    x,
    y,
    isServer,
  };
}

/**
 * Helper function to create a legal formation
 */
function createLegalFormation(): PlayerState[] {
  return [
    createPlayer("1", 1, 7.0, 6.0), // RB
    createPlayer("2", 2, 7.0, 3.0), // RF
    createPlayer("3", 3, 4.5, 3.0), // MF
    createPlayer("4", 4, 2.0, 3.0), // LF
    createPlayer("5", 5, 2.0, 6.0), // LB
    createPlayer("6", 6, 4.5, 6.0, true), // MB (server)
  ];
}

describe("OverlapValidator", () => {
  describe("Input validation", () => {
    test("should reject lineup with wrong number of players", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0),
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        // Missing 6th player
      ];

      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].code).toBe("INVALID_LINEUP");
      expect(result.violations[0].message).toContain(
        "expected 6 players, got 5"
      );
    });

    test("should reject lineup with duplicate slots", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true), // Server
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 1, 4.5, 6.0), // Duplicate slot 1
      ];

      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
      const duplicateViolation = result.violations.find(
        (v) => v.code === "INVALID_LINEUP" && v.message.includes("duplicate")
      );
      expect(duplicateViolation).toBeDefined();
      expect(duplicateViolation!.message).toContain("duplicate rotation slots");
    });

    test("should reject lineup with no server", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0),
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0), // No server
      ];

      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].code).toBe("MULTIPLE_SERVERS");
      expect(result.violations[0].message).toContain(
        "expected exactly 1 server, got 0"
      );
    });

    test("should reject lineup with multiple servers", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true), // Server
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0, true), // Another server
      ];

      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].code).toBe("MULTIPLE_SERVERS");
      expect(result.violations[0].message).toContain(
        "expected exactly 1 server, got 2"
      );
    });
  });

  describe("Legal formations", () => {
    test("should validate a perfectly legal formation", () => {
      const lineup = createLegalFormation();
      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test("should validate formation with server in different slots", () => {
      // Test server in each rotation slot
      for (let serverSlot = 1; serverSlot <= 6; serverSlot++) {
        const lineup = [
          createPlayer("1", 1, 7.0, 6.0, serverSlot === 1),
          createPlayer("2", 2, 7.0, 3.0, serverSlot === 2),
          createPlayer("3", 3, 4.5, 3.0, serverSlot === 3),
          createPlayer("4", 4, 2.0, 3.0, serverSlot === 4),
          createPlayer("5", 5, 2.0, 6.0, serverSlot === 5),
          createPlayer("6", 6, 4.5, 6.0, serverSlot === 6),
        ];

        const result = OverlapValidator.checkOverlap(lineup);
        expect(result.isLegal).toBe(true);
        expect(result.violations).toHaveLength(0);
      }
    });

    test("should validate formation with positions at tolerance boundaries", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0),
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.029, 3.0), // Just within tolerance of MF
        createPlayer("5", 5, 2.0, 6.029), // Just within tolerance of LF
        createPlayer("6", 6, 4.5, 6.0, true),
      ];

      const result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("Front row order violations", () => {
    test("should detect LF not left of MF violation", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0),
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 2.0, 3.0), // MF too far left
        createPlayer("4", 4, 4.5, 3.0), // LF too far right
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0, true),
      ];

      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].code).toBe("ROW_ORDER");
      expect(result.violations[0].slots).toEqual([4, 3]); // LF, MF
      expect(result.violations[0].message).toContain("Left Front");
      expect(result.violations[0].message).toContain("Middle Front");
    });

    test("should detect MF not left of RF violation", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0),
        createPlayer("2", 2, 4.5, 3.0), // RF too far left
        createPlayer("3", 3, 7.0, 3.0), // MF too far right
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0, true),
      ];

      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].code).toBe("ROW_ORDER");
      expect(result.violations[0].slots).toEqual([3, 2]); // MF, RF
      expect(result.violations[0].message).toContain("Middle Front");
      expect(result.violations[0].message).toContain("Right Front");
    });

    test("should not validate front row order when server is in front row", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0),
        createPlayer("2", 2, 7.0, 3.0, true), // RF is server
        createPlayer("3", 3, 7.5, 3.0), // MF would violate if not for server exemption
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0),
      ];

      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("Back row order violations", () => {
    test("should detect LB not left of MB violation", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0),
        createPlayer("2", 2, 7.0, 3.0, true), // Server in front row
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 6.0, 6.0), // LB too far right
        createPlayer("6", 6, 2.0, 6.0), // MB too far left
      ];

      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].code).toBe("ROW_ORDER");
      expect(result.violations[0].slots).toEqual([5, 6]); // LB, MB
      expect(result.violations[0].message).toContain("Left Back");
      expect(result.violations[0].message).toContain("Middle Back");
    });

    test("should detect MB not left of RB violation", () => {
      const lineup = [
        createPlayer("1", 1, 4.5, 6.0), // RB too far left
        createPlayer("2", 2, 7.0, 3.0, true), // Server in front row
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 7.0, 6.0), // MB too far right
      ];

      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].code).toBe("ROW_ORDER");
      expect(result.violations[0].slots).toEqual([6, 1]); // MB, RB
      expect(result.violations[0].message).toContain("Middle Back");
      expect(result.violations[0].message).toContain("Right Back");
    });

    test("should not validate back row order when server is in back row", () => {
      const lineup = [
        createPlayer("1", 1, 4.5, 6.0, true), // RB is server
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 7.0, 6.0), // MB would violate if not for server exemption
      ];

      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("Front/back order violations", () => {
    test("should detect LF behind LB violation", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0),
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 7.0), // LF behind LB
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0, true),
      ];

      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].code).toBe("FRONT_BACK");
      expect(result.violations[0].slots).toEqual([4, 5]); // LF, LB
      expect(result.violations[0].message).toContain("Left Front");
      expect(result.violations[0].message).toContain("Left Back");
    });

    test("should detect MF behind MB violation", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true), // Server in back row
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 4.5, 7.0), // MF behind MB
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0),
      ];

      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].code).toBe("FRONT_BACK");
      expect(result.violations[0].slots).toEqual([3, 6]); // MF, MB
      expect(result.violations[0].message).toContain("Middle Front");
      expect(result.violations[0].message).toContain("Middle Back");
    });

    test("should detect RF behind RB violation", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0),
        createPlayer("2", 2, 7.0, 7.0), // RF behind RB
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0, true),
      ];

      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].code).toBe("FRONT_BACK");
      expect(result.violations[0].slots).toEqual([2, 1]); // RF, RB
      expect(result.violations[0].message).toContain("Right Front");
      expect(result.violations[0].message).toContain("Right Back");
    });

    test("should not validate front/back order when server is involved", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true), // RB is server
        createPlayer("2", 2, 7.0, 7.0), // RF behind RB, but RB is server so exempt
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0),
      ];

      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("Multiple violations", () => {
    test("should detect multiple violations simultaneously", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true), // Server in back row
        createPlayer("2", 2, 2.0, 3.0), // RF too far left (violates MF < RF)
        createPlayer("3", 3, 4.5, 7.0), // MF behind MB (violates front/back)
        createPlayer("4", 4, 7.0, 3.0), // LF too far right (violates LF < MF)
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0),
      ];

      const result = OverlapValidator.checkOverlap(lineup);

      expect(result.isLegal).toBe(false);
      expect(result.violations.length).toBeGreaterThan(1);

      const violationCodes = result.violations.map((v) => v.code);
      expect(violationCodes).toContain("ROW_ORDER");
      expect(violationCodes).toContain("FRONT_BACK");
    });
  });

  describe("Tolerance handling", () => {
    test("should pass positions exactly at tolerance boundary", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0),
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.03), // Exactly at tolerance boundary
        createPlayer("6", 6, 4.5, 6.0, true),
      ];

      const result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(true);
    });

    test("should fail positions outside tolerance boundary", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true), // Server
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 1.96, 3.0), // MF too far left, outside tolerance of LF
        createPlayer("4", 4, 2.0, 3.0), // LF
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0),
      ];

      const result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(false);
    });
  });

  describe("explainViolation", () => {
    test("should provide detailed explanation for row order violation", () => {
      const lineup = createLegalFormation();
      const positionMap = new Map<RotationSlot, PlayerState>();
      lineup.forEach((player) => positionMap.set(player.slot, player));

      const violation = {
        code: "ROW_ORDER" as const,
        slots: [4, 3] as RotationSlot[],
        message: "Test violation",
        coordinates: {
          4: { x: 4.5, y: 3.0 },
          3: { x: 2.0, y: 3.0 },
        },
      };

      const explanation = OverlapValidator.explainViolation(
        violation,
        positionMap
      );

      expect(explanation).toContain("Left Front");
      expect(explanation).toContain("Middle Front");
      expect(explanation).toContain("4.50");
      expect(explanation).toContain("2.00");
      expect(explanation).toContain("must be to the left of");
    });

    test("should provide detailed explanation for front/back violation", () => {
      const lineup = createLegalFormation();
      const positionMap = new Map<RotationSlot, PlayerState>();
      lineup.forEach((player) => positionMap.set(player.slot, player));

      const violation = {
        code: "FRONT_BACK" as const,
        slots: [4, 5] as RotationSlot[],
        message: "Test violation",
        coordinates: {
          4: { x: 2.0, y: 7.0 },
          5: { x: 2.0, y: 6.0 },
        },
      };

      const explanation = OverlapValidator.explainViolation(
        violation,
        positionMap
      );

      expect(explanation).toContain("Left Front");
      expect(explanation).toContain("Left Back");
      expect(explanation).toContain("7.00");
      expect(explanation).toContain("6.00");
      expect(explanation).toContain("must be in front of");
    });

    test("should provide explanation for multiple servers violation", () => {
      const lineup = createLegalFormation();
      const positionMap = new Map<RotationSlot, PlayerState>();
      lineup.forEach((player) => positionMap.set(player.slot, player));

      const violation = {
        code: "MULTIPLE_SERVERS" as const,
        slots: [1, 6] as RotationSlot[],
        message: "Multiple servers detected",
      };

      const explanation = OverlapValidator.explainViolation(
        violation,
        positionMap
      );

      expect(explanation).toContain("Only one player can be the server");
      expect(explanation).toContain("Player 1");
      expect(explanation).toContain("Player 6");
    });
  });

  describe("isPositionValid", () => {
    test("should return true for valid position", () => {
      const otherPositions = new Map<RotationSlot, PlayerState>();
      const lineup = createLegalFormation();
      lineup.forEach((player) => {
        if (player.slot !== 4) {
          // Exclude LF for testing
          otherPositions.set(player.slot, player);
        }
      });

      const isValid = OverlapValidator.isPositionValid(
        4, // LF slot
        { x: 1.5, y: 3.0 }, // Valid position for LF
        otherPositions,
        false
      );

      expect(isValid).toBe(true);
    });

    test("should return false for invalid position", () => {
      const otherPositions = new Map<RotationSlot, PlayerState>();
      const lineup = createLegalFormation();
      lineup.forEach((player) => {
        if (player.slot !== 4) {
          // Exclude LF for testing
          otherPositions.set(player.slot, player);
        }
      });

      const isValid = OverlapValidator.isPositionValid(
        4, // LF slot
        { x: 5.0, y: 3.0 }, // Invalid position (too far right)
        otherPositions,
        false
      );

      expect(isValid).toBe(false);
    });

    test("should return true for server position that would otherwise be invalid", () => {
      const otherPositions = new Map<RotationSlot, PlayerState>();
      const lineup = createLegalFormation();
      lineup.forEach((player) => {
        if (player.slot !== 4) {
          // Exclude LF for testing
          // Make sure no other player is server
          otherPositions.set(player.slot, { ...player, isServer: false });
        }
      });

      const isValid = OverlapValidator.isPositionValid(
        4, // LF slot
        { x: 5.0, y: 3.0 }, // Would be invalid, but player is server
        otherPositions,
        true // isServer = true
      );

      expect(isValid).toBe(true);
    });

    test("should return true when lineup is incomplete", () => {
      const otherPositions = new Map<RotationSlot, PlayerState>();
      // Only add a few players
      otherPositions.set(1, createPlayer("1", 1, 7.0, 6.0));
      otherPositions.set(2, createPlayer("2", 2, 7.0, 3.0));

      const isValid = OverlapValidator.isPositionValid(
        4, // LF slot
        { x: 2.0, y: 3.0 },
        otherPositions,
        false
      );

      expect(isValid).toBe(true);
    });
  });
});
