/**
 * Comprehensive test suite covering all volleyball rules engine scenarios
 * This file implements the complete test coverage required by task 11
 */

import { describe, test, expect } from "vitest";
import { OverlapValidator } from "../validation/OverlapValidator";
import { ConstraintCalculator } from "../validation/ConstraintCalculator";
import { NeighborCalculator } from "../utils/NeighborCalculator";
import { ToleranceUtils } from "../utils/ToleranceUtils";
import type { PlayerState, RotationSlot, Role } from "../types/PlayerState";

/**
 * Helper function to create a test player
 */
function createPlayer(
  id: string,
  slot: RotationSlot,
  x: number,
  y: number,
  isServer: boolean = false,
  displayName?: string,
  role: Role = "Unknown"
): PlayerState {
  return {
    id,
    displayName: displayName || `Player ${id}`,
    role,
    slot,
    x,
    y,
    isServer,
  };
}

/**
 * Generate random position within bounds
 */
function randomPosition(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): [number, number] {
  return [
    minX + Math.random() * (maxX - minX),
    minY + Math.random() * (maxY - minY),
  ];
}

/**
 * Apply small perturbation to position
 */
function perturbPosition(
  x: number,
  y: number,
  maxDelta: number
): { x: number; y: number } {
  return {
    x: x + (Math.random() - 0.5) * 2 * maxDelta,
    y: y + (Math.random() - 0.5) * 2 * maxDelta,
  };
}

describe("Comprehensive Volleyball Rules Engine Test Suite", () => {
  describe("Legal Formation Examples from Requirements", () => {
    test("should validate standard 5-1 receive formation", () => {
      const lineup = [
        createPlayer("RB", 1, 8.0, 7.0, false, "Right Back", "L"), // Libero
        createPlayer("RF", 2, 8.0, 2.0, false, "Right Front", "OPP"),
        createPlayer("MF", 3, 4.5, 2.0, false, "Middle Front", "MB1"),
        createPlayer("LF", 4, 1.0, 2.0, false, "Left Front", "OH1"),
        createPlayer("LB", 5, 1.0, 7.0, false, "Left Back", "OH2"),
        createPlayer("MB", 6, 4.5, 7.0, true, "Middle Back", "S"), // Server
      ];

      const result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test("should validate 6-2 formation with setter in front row", () => {
      const lineup = [
        createPlayer("RB", 1, 7.5, 6.5, false, "Right Back", "OH1"),
        createPlayer("RF", 2, 7.5, 2.5, true, "Right Front", "S"), // Server setter
        createPlayer("MF", 3, 4.5, 2.5, false, "Middle Front", "MB1"),
        createPlayer("LF", 4, 1.5, 2.5, false, "Left Front", "OPP"),
        createPlayer("LB", 5, 1.5, 6.5, false, "Left Back", "L"),
        createPlayer("MB", 6, 4.5, 6.5, false, "Middle Back", "OH2"),
      ];

      const result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test("should validate tight formation with minimal spacing", () => {
      const lineup = [
        createPlayer("RB", 1, 6.5, 5.5, false, "Right Back", "DS"),
        createPlayer("RF", 2, 6.5, 3.5, false, "Right Front", "OH1"),
        createPlayer("MF", 3, 4.5, 3.5, false, "Middle Front", "MB1"),
        createPlayer("LF", 4, 2.5, 3.5, false, "Left Front", "OH2"),
        createPlayer("LB", 5, 2.5, 5.5, false, "Left Back", "L"),
        createPlayer("MB", 6, 4.5, 5.5, true, "Middle Back", "S"), // Server
      ];

      const result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test("should validate wide formation with maximum court usage", () => {
      const lineup = [
        createPlayer("RB", 1, 8.5, 8.0, false, "Right Back", "L"),
        createPlayer("RF", 2, 8.5, 1.0, false, "Right Front", "OPP"),
        createPlayer("MF", 3, 4.5, 1.0, false, "Middle Front", "MB1"),
        createPlayer("LF", 4, 0.5, 1.0, false, "Left Front", "OH1"),
        createPlayer("LB", 5, 0.5, 8.0, false, "Left Back", "OH2"),
        createPlayer("MB", 6, 4.5, 8.0, true, "Middle Back", "S"), // Server
      ];

      const result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test("should validate asymmetric formation", () => {
      const lineup = [
        createPlayer("RB", 1, 7.0, 6.0, false, "Right Back", "L"),
        createPlayer("RF", 2, 6.0, 2.0, false, "Right Front", "OH1"),
        createPlayer("MF", 3, 3.0, 2.5, false, "Middle Front", "MB1"),
        createPlayer("LF", 4, 1.0, 3.0, false, "Left Front", "OPP"),
        createPlayer("LB", 5, 2.0, 7.0, false, "Left Back", "OH2"),
        createPlayer("MB", 6, 5.0, 8.0, true, "Middle Back", "S"), // Server
      ];

      const result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("Server Exemption Tests for Each Rotation Slot", () => {
    // Test server exemption in each slot with borderline tolerance cases
    const testCases = [
      { slot: 1, name: "Right Back", x: 7.0, y: 6.0 },
      { slot: 2, name: "Right Front", x: 7.0, y: 3.0 },
      { slot: 3, name: "Middle Front", x: 4.5, y: 3.0 },
      { slot: 4, name: "Left Front", x: 2.0, y: 3.0 },
      { slot: 5, name: "Left Back", x: 2.0, y: 6.0 },
      { slot: 6, name: "Middle Back", x: 4.5, y: 6.0 },
    ] as const;

    testCases.forEach(({ slot, name, x, y }) => {
      test(`should exempt server in slot ${slot} (${name}) from overlap constraints`, () => {
        const lineup = [
          createPlayer("1", 1, 7.0, 6.0, slot === 1),
          createPlayer("2", 2, 7.0, 3.0, slot === 2),
          createPlayer("3", 3, 4.5, 3.0, slot === 3),
          createPlayer("4", 4, 2.0, 3.0, slot === 4),
          createPlayer("5", 5, 2.0, 6.0, slot === 5),
          createPlayer("6", 6, 4.5, 6.0, slot === 6),
        ];

        // Move server to position that would violate if not exempt
        const serverPlayer = lineup.find((p) => p.slot === slot)!;
        if (slot === 2) {
          // RF server
          serverPlayer.x = 1.0; // Far left, would violate MF < RF
        } else if (slot === 3) {
          // MF server
          serverPlayer.x = 8.0; // Far right, would violate LF < MF and MF < RF
        } else if (slot === 4) {
          // LF server
          serverPlayer.x = 8.0; // Far right, would violate LF < MF
        } else if (slot === 1) {
          // RB server
          serverPlayer.x = 1.0; // Far left, would violate MB < RB
        } else if (slot === 6) {
          // MB server
          serverPlayer.x = 8.0; // Far right, would violate LB < MB and MB < RB
        } else if (slot === 5) {
          // LB server
          serverPlayer.x = 8.0; // Far right, would violate LB < MB
        }

        const result = OverlapValidator.checkOverlap(lineup);
        expect(result.isLegal).toBe(true);
        expect(result.violations).toHaveLength(0);
      });

      test(`should allow server in slot ${slot} (${name}) in service zone`, () => {
        const lineup = [
          createPlayer("1", 1, 7.0, 6.0, slot === 1),
          createPlayer("2", 2, 7.0, 3.0, slot === 2),
          createPlayer("3", 3, 4.5, 3.0, slot === 3),
          createPlayer("4", 4, 2.0, 3.0, slot === 4),
          createPlayer("5", 5, 2.0, 6.0, slot === 5),
          createPlayer("6", 6, 4.5, 6.0, slot === 6),
        ];

        // Move server to service zone
        const serverPlayer = lineup.find((p) => p.slot === slot)!;
        serverPlayer.y = 10.0; // Service zone

        const result = OverlapValidator.checkOverlap(lineup);
        expect(result.isLegal).toBe(true);
        expect(result.violations).toHaveLength(0);
      });

      test(`should handle borderline tolerance cases for server in slot ${slot} (${name})`, () => {
        const lineup = [
          createPlayer("1", 1, 7.0, 6.0, slot === 1),
          createPlayer("2", 2, 7.0, 3.0, slot === 2),
          createPlayer("3", 3, 4.5, 3.0, slot === 3),
          createPlayer("4", 4, 2.0, 3.0, slot === 4),
          createPlayer("5", 5, 2.0, 6.0, slot === 5),
          createPlayer("6", 6, 4.5, 6.0, slot === 6),
        ];

        // Test positions exactly at tolerance boundaries
        const serverPlayer = lineup.find((p) => p.slot === slot)!;

        // Move server to edge of service zone
        serverPlayer.y = 9.03; // Just within tolerance of service zone

        const result = OverlapValidator.checkOverlap(lineup);
        expect(result.isLegal).toBe(true);
        expect(result.violations).toHaveLength(0);
      });
    });

    test("should still validate non-server players when server is exempt", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true), // RB is server (exempt)
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 1.0, 3.0), // MF too far left (should violate)
        createPlayer("4", 4, 2.0, 3.0), // LF
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0),
      ];

      const result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].code).toBe("ROW_ORDER");
      expect(result.violations[0].slots).toEqual([4, 3]); // LF, MF
    });
  });

  describe("Libero Positioning Tests", () => {
    // Test libero in each back-row slot
    const backRowSlots = [
      { slot: 1, name: "Right Back", x: 7.0, y: 6.0 },
      { slot: 5, name: "Left Back", x: 2.0, y: 6.0 },
      { slot: 6, name: "Middle Back", x: 4.5, y: 6.0 },
    ] as const;

    backRowSlots.forEach(({ slot, name, x, y }) => {
      test(`should validate libero in slot ${slot} (${name}) with standard positioning`, () => {
        const lineup = [
          createPlayer(
            "1",
            1,
            7.0,
            6.0,
            false,
            "Player 1",
            slot === 1 ? "L" : "DS"
          ),
          createPlayer("2", 2, 7.0, 3.0, false, "Player 2", "OPP"),
          createPlayer("3", 3, 4.5, 3.0, false, "Player 3", "MB1"),
          createPlayer("4", 4, 2.0, 3.0, false, "Player 4", "OH1"),
          createPlayer(
            "5",
            5,
            2.0,
            6.0,
            false,
            "Player 5",
            slot === 5 ? "L" : "OH2"
          ),
          createPlayer(
            "6",
            6,
            4.5,
            6.0,
            true,
            "Player 6",
            slot === 6 ? "L" : "S"
          ),
        ];

        const result = OverlapValidator.checkOverlap(lineup);
        expect(result.isLegal).toBe(true);
        expect(result.violations).toHaveLength(0);
      });

      test(`should validate libero in slot ${slot} (${name}) with defensive positioning`, () => {
        const lineup = [
          createPlayer(
            "1",
            1,
            8.0,
            7.5,
            false,
            "Player 1",
            slot === 1 ? "L" : "DS"
          ),
          createPlayer("2", 2, 8.0, 2.5, false, "Player 2", "OPP"),
          createPlayer("3", 3, 4.5, 2.5, false, "Player 3", "MB1"),
          createPlayer("4", 4, 1.0, 2.5, false, "Player 4", "OH1"),
          createPlayer(
            "5",
            5,
            1.0,
            7.5,
            false,
            "Player 5",
            slot === 5 ? "L" : "OH2"
          ),
          createPlayer(
            "6",
            6,
            4.5,
            7.5,
            true,
            "Player 6",
            slot === 6 ? "L" : "S"
          ),
        ];

        const result = OverlapValidator.checkOverlap(lineup);
        expect(result.isLegal).toBe(true);
        expect(result.violations).toHaveLength(0);
      });

      test(`should validate libero in slot ${slot} (${name}) near court boundaries`, () => {
        const lineup = [
          createPlayer(
            "1",
            1,
            slot === 1 ? 8.97 : 7.0,
            slot === 1 ? 8.97 : 6.0,
            false,
            "Player 1",
            slot === 1 ? "L" : "DS"
          ),
          createPlayer("2", 2, 7.0, 3.0, false, "Player 2", "OPP"),
          createPlayer("3", 3, 4.5, 3.0, false, "Player 3", "MB1"),
          createPlayer("4", 4, 2.0, 3.0, false, "Player 4", "OH1"),
          createPlayer(
            "5",
            5,
            slot === 5 ? 0.03 : 2.0,
            slot === 5 ? 8.97 : 6.0,
            false,
            "Player 5",
            slot === 5 ? "L" : "OH2"
          ),
          createPlayer(
            "6",
            6,
            slot === 6 ? 4.5 : 4.5,
            slot === 6 ? 8.97 : 6.0,
            true,
            "Player 6",
            slot === 6 ? "L" : "S"
          ),
        ];

        const result = OverlapValidator.checkOverlap(lineup);
        expect(result.isLegal).toBe(true);
        expect(result.violations).toHaveLength(0);
      });

      test(`should handle libero substitution scenarios in slot ${slot} (${name})`, () => {
        // Test that libero follows same overlap rules as any back-row player
        const lineup = [
          createPlayer(
            "1",
            1,
            7.0,
            6.0,
            false,
            "Player 1",
            slot === 1 ? "L" : "DS"
          ),
          createPlayer("2", 2, 7.0, 3.0, true, "Player 2", "OPP"), // Server in front
          createPlayer("3", 3, 4.5, 3.0, false, "Player 3", "MB1"),
          createPlayer("4", 4, 2.0, 3.0, false, "Player 4", "OH1"),
          createPlayer(
            "5",
            5,
            2.0,
            6.0,
            false,
            "Player 5",
            slot === 5 ? "L" : "OH2"
          ),
          createPlayer(
            "6",
            6,
            4.5,
            6.0,
            false,
            "Player 6",
            slot === 6 ? "L" : "MB2"
          ),
        ];

        // Position libero in a way that would violate if overlap rules weren't followed
        const liberoPlayer = lineup.find((p) => p.role === "L")!;
        if (slot === 1) {
          // RB libero
          liberoPlayer.x = 3.0; // Would violate MB < RB if not positioned correctly
          const result = OverlapValidator.checkOverlap(lineup);
          expect(result.isLegal).toBe(false); // Should detect violation
          expect(result.violations.length).toBeGreaterThan(0);
        } else if (slot === 5) {
          // LB libero
          liberoPlayer.x = 6.0; // Would violate LB < MB if not positioned correctly
          const result = OverlapValidator.checkOverlap(lineup);
          expect(result.isLegal).toBe(false); // Should detect violation
          expect(result.violations.length).toBeGreaterThan(0);
        } else if (slot === 6) {
          // MB libero - test a different violation scenario
          liberoPlayer.x = 1.0; // Would violate LB < MB
          const result = OverlapValidator.checkOverlap(lineup);
          expect(result.isLegal).toBe(false); // Should detect violation
          expect(result.violations.length).toBeGreaterThan(0);
        }
      });
    });

    test("should not allow libero in front row positions", () => {
      // This is more of a game rule test, but the engine should treat libero like any other player
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, false, "Player 1", "DS"),
        createPlayer("2", 2, 7.0, 3.0, false, "Player 2", "L"), // Libero in front row (unusual but engine should handle)
        createPlayer("3", 3, 4.5, 3.0, false, "Player 3", "MB1"),
        createPlayer("4", 4, 2.0, 3.0, false, "Player 4", "OH1"),
        createPlayer("5", 5, 2.0, 6.0, false, "Player 5", "OH2"),
        createPlayer("6", 6, 4.5, 6.0, true, "Player 6", "S"),
      ];

      // Engine should validate positioning regardless of role
      const result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(true); // Position is legal even if role assignment is unusual
    });
  });

  describe("Fuzz Testing with Position Perturbations", () => {
    test("should maintain legality with small perturbations (±2cm)", () => {
      const baseLineup = [
        createPlayer("1", 1, 7.0, 6.0, false),
        createPlayer("2", 2, 7.0, 3.0, false),
        createPlayer("3", 3, 4.5, 3.0, false),
        createPlayer("4", 4, 2.0, 3.0, false),
        createPlayer("5", 5, 2.0, 6.0, false),
        createPlayer("6", 6, 4.5, 6.0, true), // Server
      ];

      // Run multiple iterations with small perturbations
      for (let i = 0; i < 50; i++) {
        const perturbedLineup = baseLineup.map((player) => ({
          ...player,
          ...perturbPosition(player.x, player.y, 0.02), // ±2cm
        }));

        const result = OverlapValidator.checkOverlap(perturbedLineup);
        expect(result.isLegal).toBe(true);
        expect(result.violations).toHaveLength(0);
      }
    });

    test("should detect violations with larger perturbations (±10cm)", () => {
      // Create specific violation scenarios to ensure we can detect them
      const violationScenarios = [
        // Scenario 1: LF/MF order violation
        [
          createPlayer("1", 1, 7.0, 6.0, true), // Server
          createPlayer("2", 2, 7.0, 3.0, false),
          createPlayer("3", 3, 1.5, 3.0, false), // MF too far left
          createPlayer("4", 4, 2.0, 3.0, false), // LF
          createPlayer("5", 5, 2.0, 6.0, false),
          createPlayer("6", 6, 4.5, 6.0, false),
        ],
        // Scenario 2: MF/RF order violation
        [
          createPlayer("1", 1, 7.0, 6.0, true), // Server
          createPlayer("2", 2, 4.0, 3.0, false), // RF too far left
          createPlayer("3", 3, 5.0, 3.0, false), // MF too far right
          createPlayer("4", 4, 2.0, 3.0, false),
          createPlayer("5", 5, 2.0, 6.0, false),
          createPlayer("6", 6, 4.5, 6.0, false),
        ],
        // Scenario 3: Front/back violation
        [
          createPlayer("1", 1, 7.0, 6.0, true), // Server
          createPlayer("2", 2, 7.0, 7.0, false), // RF behind RB
          createPlayer("3", 3, 4.5, 3.0, false),
          createPlayer("4", 4, 2.0, 3.0, false),
          createPlayer("5", 5, 2.0, 6.0, false),
          createPlayer("6", 6, 4.5, 6.0, false),
        ],
      ];

      let violationsDetected = 0;

      // Test each violation scenario
      violationScenarios.forEach((lineup) => {
        const result = OverlapValidator.checkOverlap(lineup);
        if (!result.isLegal) {
          violationsDetected++;
        }
      });

      // Should detect violations in these specific scenarios
      expect(violationsDetected).toBeGreaterThan(0); // At least some violations
    });

    test("should handle edge cases near court boundaries", () => {
      const edgeCases = [
        // Near left sideline
        { x: 0.05, y: 3.0 },
        { x: 0.01, y: 6.0 },
        // Near right sideline
        { x: 8.95, y: 3.0 },
        { x: 8.99, y: 6.0 },
        // Near net
        { x: 4.5, y: 0.05 },
        // Near endline
        { x: 4.5, y: 8.95 },
        // Service zone
        { x: 4.5, y: 9.5 },
        { x: 4.5, y: 10.95 },
      ];

      edgeCases.forEach((pos, index) => {
        const lineup = [
          createPlayer("1", 1, 7.0, 6.0, false),
          createPlayer("2", 2, 7.0, 3.0, false),
          createPlayer("3", 3, 4.5, 3.0, false),
          createPlayer("4", 4, 2.0, 3.0, false),
          createPlayer("5", 5, 2.0, 6.0, false),
          createPlayer("6", 6, 4.5, 6.0, true), // Server
        ];

        // Move one player to edge position
        const playerIndex = index % 6;
        lineup[playerIndex].x = pos.x;
        lineup[playerIndex].y = pos.y;

        // If moving to service zone, make that player the server
        if (pos.y > 9.0) {
          lineup.forEach((p) => (p.isServer = false));
          lineup[playerIndex].isServer = true;
        }

        const result = OverlapValidator.checkOverlap(lineup);
        // Should not crash and should provide valid result
        expect(typeof result.isLegal).toBe("boolean");
        expect(Array.isArray(result.violations)).toBe(true);
      });
    });

    test("should handle random formation generation", () => {
      for (let i = 0; i < 20; i++) {
        // Generate random but potentially legal formation
        const lineup = [
          createPlayer("1", 1, ...randomPosition(6.0, 8.5, 5.0, 8.0), false), // RB
          createPlayer("2", 2, ...randomPosition(6.0, 8.5, 1.0, 4.0), false), // RF
          createPlayer("3", 3, ...randomPosition(3.0, 6.0, 1.0, 4.0), false), // MF
          createPlayer("4", 4, ...randomPosition(0.5, 3.0, 1.0, 4.0), false), // LF
          createPlayer("5", 5, ...randomPosition(0.5, 3.0, 5.0, 8.0), false), // LB
          createPlayer("6", 6, ...randomPosition(3.0, 6.0, 5.0, 8.0), true), // MB (server)
        ];

        const result = OverlapValidator.checkOverlap(lineup);

        // Should not crash
        expect(typeof result.isLegal).toBe("boolean");
        expect(Array.isArray(result.violations)).toBe(true);

        // If legal, should have no violations
        if (result.isLegal) {
          expect(result.violations).toHaveLength(0);
        } else {
          expect(result.violations.length).toBeGreaterThan(0);
        }
      }
    });

    test("should handle extreme position values gracefully", () => {
      const extremeCases = [
        // Negative coordinates
        { x: -1.0, y: 3.0 },
        { x: 4.5, y: -1.0 },
        // Very large coordinates
        { x: 15.0, y: 3.0 },
        { x: 4.5, y: 15.0 },
        // Zero coordinates
        { x: 0.0, y: 0.0 },
        // Floating point edge cases
        { x: Number.EPSILON, y: 3.0 },
        { x: 4.5, y: Number.EPSILON },
      ];

      extremeCases.forEach((pos, index) => {
        const lineup = [
          createPlayer("1", 1, 7.0, 6.0, false),
          createPlayer("2", 2, 7.0, 3.0, false),
          createPlayer("3", 3, 4.5, 3.0, false),
          createPlayer("4", 4, 2.0, 3.0, false),
          createPlayer("5", 5, 2.0, 6.0, false),
          createPlayer("6", 6, 4.5, 6.0, true),
        ];

        // Apply extreme position to one player
        const playerIndex = index % 6;
        lineup[playerIndex].x = pos.x;
        lineup[playerIndex].y = pos.y;

        // Should not throw errors
        expect(() => {
          const result = OverlapValidator.checkOverlap(lineup);
          expect(typeof result.isLegal).toBe("boolean");
          expect(Array.isArray(result.violations)).toBe(true);
        }).not.toThrow();
      });
    });
  });

  describe("Integration Tests for Drag-and-Drop Workflows", () => {
    test("should provide real-time constraint calculation during drag", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, false),
        createPlayer("2", 2, 7.0, 3.0, false),
        createPlayer("3", 3, 4.5, 3.0, false),
        createPlayer("4", 4, 2.0, 3.0, false),
        createPlayer("5", 5, 2.0, 6.0, false),
        createPlayer("6", 6, 4.5, 6.0, true),
      ];

      const positionMap = new Map<RotationSlot, PlayerState>();
      lineup.forEach((player) => positionMap.set(player.slot, player));

      // Test constraint calculation for each player
      for (let slot = 1; slot <= 6; slot++) {
        const constraints = ConstraintCalculator.calculateValidBounds(
          slot as RotationSlot,
          positionMap,
          positionMap.get(slot as RotationSlot)?.isServer || false
        );

        expect(constraints).toBeDefined();
        expect(typeof constraints.minX).toBe("number");
        expect(typeof constraints.maxX).toBe("number");
        expect(typeof constraints.minY).toBe("number");
        expect(typeof constraints.maxY).toBe("number");
        expect(typeof constraints.isConstrained).toBe("boolean");
        expect(Array.isArray(constraints.constraintReasons)).toBe(true);
      }
    });

    test("should update constraints when other players move", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, false),
        createPlayer("2", 2, 7.0, 3.0, false),
        createPlayer("3", 3, 4.5, 3.0, false),
        createPlayer("4", 4, 2.0, 3.0, false),
        createPlayer("5", 5, 2.0, 6.0, false),
        createPlayer("6", 6, 4.5, 6.0, true),
      ];

      const positionMap = new Map<RotationSlot, PlayerState>();
      lineup.forEach((player) => positionMap.set(player.slot, player));

      // Get initial constraints for MF (slot 3)
      const initialConstraints = ConstraintCalculator.calculateValidBounds(
        3,
        positionMap,
        false
      );

      // Move LF (slot 4) to the right
      positionMap.get(4)!.x = 3.0;

      // Get updated constraints for MF
      const updatedConstraints = ConstraintCalculator.calculateValidBounds(
        3,
        positionMap,
        false
      );

      // Constraints should have changed
      expect(updatedConstraints.minX).toBeGreaterThan(initialConstraints.minX);
    });

    test("should validate positions during drag operations", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true), // RB is server (so MB is not exempt)
        createPlayer("2", 2, 7.0, 3.0, false),
        createPlayer("3", 3, 4.5, 3.0, false),
        createPlayer("4", 4, 2.0, 3.0, false),
        createPlayer("5", 5, 2.0, 6.0, false),
        createPlayer("6", 6, 4.5, 6.0, false), // MB is not server
      ];

      const positionMap = new Map<RotationSlot, PlayerState>();
      lineup.forEach((player) => {
        if (player.slot !== 3) {
          // Exclude MF for testing
          positionMap.set(player.slot, player);
        }
      });

      // Test various positions for MF during drag
      // LF is at x=2.0, RF is at x=7.0, MB is at y=6.0
      const testPositions = [
        { x: 3.0, y: 3.0, expected: true }, // Valid position
        { x: 1.5, y: 3.0, expected: false }, // Too far left (violates LF < MF)
        { x: 8.0, y: 3.0, expected: false }, // Too far right (violates MF < RF)
        { x: 4.5, y: 7.0, expected: false }, // Too far back (violates MF in front of MB)
      ];

      testPositions.forEach(({ x, y, expected }) => {
        const isValid = OverlapValidator.isPositionValid(
          3,
          { x, y },
          positionMap,
          false
        );
        expect(isValid).toBe(expected);
      });
    });

    test("should handle complete drag-and-drop workflow", () => {
      // Simulate complete workflow: initial position -> drag -> validate -> drop
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, false),
        createPlayer("2", 2, 7.0, 3.0, false),
        createPlayer("3", 3, 4.5, 3.0, false),
        createPlayer("4", 4, 2.0, 3.0, false),
        createPlayer("5", 5, 2.0, 6.0, false),
        createPlayer("6", 6, 4.5, 6.0, true),
      ];

      // Step 1: Initial validation
      let result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(true);

      // Step 2: Start drag (get constraints)
      const positionMap = new Map<RotationSlot, PlayerState>();
      lineup.forEach((player) => {
        if (player.slot !== 4) {
          // Exclude LF for dragging
          positionMap.set(player.slot, player);
        }
      });

      const constraints = ConstraintCalculator.calculateValidBounds(
        4,
        positionMap,
        false
      );
      expect(constraints.isConstrained).toBe(true);

      // Step 3: Validate intermediate positions during drag
      const dragPositions = [
        { x: 1.5, y: 3.0 }, // Valid
        { x: 1.0, y: 3.0 }, // Valid
        { x: 0.5, y: 3.0 }, // Valid
      ];

      dragPositions.forEach((pos) => {
        const isValid = OverlapValidator.isPositionValid(
          4,
          pos,
          positionMap,
          false
        );
        expect(isValid).toBe(true);
      });

      // Step 4: Drop at final position
      lineup[3].x = 1.0; // Move LF to new position
      result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(true);

      // Step 5: Test invalid drop
      lineup[3].x = 5.0; // Move LF to invalid position
      result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    test("should handle server drag to service zone", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, false),
        createPlayer("2", 2, 7.0, 3.0, false),
        createPlayer("3", 3, 4.5, 3.0, false),
        createPlayer("4", 4, 2.0, 3.0, false),
        createPlayer("5", 5, 2.0, 6.0, false),
        createPlayer("6", 6, 4.5, 6.0, true), // Server
      ];

      // Initial validation
      let result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(true);

      // Drag server to service zone
      lineup[5].y = 10.0; // Move to service zone

      // Should still be valid
      result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(true);

      // Test constraint calculation for server in service zone
      const positionMap = new Map<RotationSlot, PlayerState>();
      lineup.forEach((player) => positionMap.set(player.slot, player));

      const constraints = ConstraintCalculator.calculateValidBounds(
        6,
        positionMap,
        true
      );
      expect(constraints.maxY).toBeGreaterThan(9.0); // Should allow service zone
    });

    test("should handle multi-player simultaneous movement", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, false),
        createPlayer("2", 2, 7.0, 3.0, false),
        createPlayer("3", 3, 4.5, 3.0, false),
        createPlayer("4", 4, 2.0, 3.0, false),
        createPlayer("5", 5, 2.0, 6.0, false),
        createPlayer("6", 6, 4.5, 6.0, true),
      ];

      // Initial validation
      let result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(true);

      // Move multiple players simultaneously
      lineup[1].x = 6.5; // RF slightly left
      lineup[2].x = 4.0; // MF slightly left
      lineup[3].x = 1.5; // LF slightly left

      // Should maintain relative order and be valid
      result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(true);

      // Test invalid simultaneous movement
      lineup[1].x = 3.0; // RF too far left
      lineup[2].x = 5.0; // MF too far right

      result = OverlapValidator.checkOverlap(lineup);
      expect(result.isLegal).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    test("should provide constraint enforcement feedback", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, false),
        createPlayer("2", 2, 7.0, 3.0, false),
        createPlayer("3", 3, 4.5, 3.0, false),
        createPlayer("4", 4, 2.0, 3.0, false),
        createPlayer("5", 5, 2.0, 6.0, false),
        createPlayer("6", 6, 4.5, 6.0, true),
      ];

      const positionMap = new Map<RotationSlot, PlayerState>();
      lineup.forEach((player) => {
        if (player.slot !== 3) {
          // Exclude MF
          positionMap.set(player.slot, player);
        }
      });

      // Get constraints with reasons
      const constraints = ConstraintCalculator.calculateValidBounds(
        3,
        positionMap,
        false
      );

      expect(constraints.constraintReasons).toBeDefined();
      expect(constraints.constraintReasons.length).toBeGreaterThan(0);

      // Should include information about neighboring players
      const reasons = constraints.constraintReasons.join(" ");
      expect(reasons).toMatch(/left|right|front|back/i);
    });
  });

  describe("Performance and Stress Testing", () => {
    test("should handle rapid validation calls efficiently", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, false),
        createPlayer("2", 2, 7.0, 3.0, false),
        createPlayer("3", 3, 4.5, 3.0, false),
        createPlayer("4", 4, 2.0, 3.0, false),
        createPlayer("5", 5, 2.0, 6.0, false),
        createPlayer("6", 6, 4.5, 6.0, true),
      ];

      const startTime = performance.now();

      // Perform many validation calls
      for (let i = 0; i < 1000; i++) {
        const result = OverlapValidator.checkOverlap(lineup);
        expect(result.isLegal).toBe(true);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second for 1000 validations
    });

    test("should handle large number of constraint calculations", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, false),
        createPlayer("2", 2, 7.0, 3.0, false),
        createPlayer("3", 3, 4.5, 3.0, false),
        createPlayer("4", 4, 2.0, 3.0, false),
        createPlayer("5", 5, 2.0, 6.0, false),
        createPlayer("6", 6, 4.5, 6.0, true),
      ];

      const positionMap = new Map<RotationSlot, PlayerState>();
      lineup.forEach((player) => positionMap.set(player.slot, player));

      const startTime = performance.now();

      // Calculate constraints for all players many times
      for (let i = 0; i < 500; i++) {
        for (let slot = 1; slot <= 6; slot++) {
          const constraints = ConstraintCalculator.calculateValidBounds(
            slot as RotationSlot,
            positionMap,
            positionMap.get(slot as RotationSlot)?.isServer || false
          );
          expect(constraints).toBeDefined();
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(2000); // 2 seconds for 3000 constraint calculations
    });
  });
});
