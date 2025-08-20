/**
 * Comprehensive tests for violation messaging and reporting functionality
 * Tests all violation types and message generation scenarios
 */

import { describe, test, expect } from "vitest";
import { OverlapValidator } from "../OverlapValidator";
import type { PlayerState, RotationSlot } from "../../types/PlayerState";
import type { Violation } from "../../types/ValidationResult";

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

describe("Violation Messaging and Reporting", () => {
  describe("ROW_ORDER violation messages", () => {
    test("should generate detailed message for LF/MF violation", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true), // Server
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 1.8, 3.0, false, "Alice"), // MF
        createPlayer("4", 4, 2.0, 3.0, false, "Bob"), // LF
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0),
      ];

      const violations = OverlapValidator.generateDetailedViolations(lineup);
      expect(violations).toHaveLength(1);

      const violation = violations[0];
      expect(violation.code).toBe("ROW_ORDER");
      expect(violation.message).toContain("Row order violation");
      expect(violation.message).toContain("Left Front (Bob)");
      expect(violation.message).toContain("Middle Front (Alice)");
      expect(violation.message).toContain("x=2.00m");
      expect(violation.message).toContain("x=1.80m");
      expect(violation.message).toContain("Current separation: 0.200m");
      expect(violation.message).toContain("minimum required: 0.030m");
      expect(violation.coordinates).toEqual({
        4: { x: 2.0, y: 3.0 },
        3: { x: 1.8, y: 3.0 },
      });
    });

    test("should generate detailed message for MF/RF violation", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true), // Server
        createPlayer("2", 2, 4.0, 3.0, false, "Charlie"), // RF
        createPlayer("3", 3, 4.5, 3.0, false, "Diana"), // MF
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0),
      ];

      const violations = OverlapValidator.generateDetailedViolations(lineup);
      expect(violations).toHaveLength(1);

      const violation = violations[0];
      expect(violation.code).toBe("ROW_ORDER");
      expect(violation.message).toContain("Middle Front (Diana)");
      expect(violation.message).toContain("Right Front (Charlie)");
      expect(violation.message).toContain("x=4.50m");
      expect(violation.message).toContain("x=4.00m");
      expect(violation.message).toContain("Current separation: 0.500m");
    });

    test("should generate detailed message for LB/MB violation", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0),
        createPlayer("2", 2, 7.0, 3.0, true), // Server
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 5.0, 6.0, false, "Eve"), // LB
        createPlayer("6", 6, 4.8, 6.0, false, "Frank"), // MB
      ];

      const violations = OverlapValidator.generateDetailedViolations(lineup);
      expect(violations).toHaveLength(1);

      const violation = violations[0];
      expect(violation.code).toBe("ROW_ORDER");
      expect(violation.message).toContain("Left Back (Eve)");
      expect(violation.message).toContain("Middle Back (Frank)");
      expect(violation.message).toContain("x=5.00m");
      expect(violation.message).toContain("x=4.80m");
    });

    test("should generate detailed message for MB/RB violation", () => {
      const lineup = [
        createPlayer("1", 1, 6.0, 6.0, false, "Grace"), // RB
        createPlayer("2", 2, 7.0, 3.0, true), // Server
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 6.5, 6.0, false, "Henry"), // MB
      ];

      const violations = OverlapValidator.generateDetailedViolations(lineup);
      expect(violations).toHaveLength(1);

      const violation = violations[0];
      expect(violation.code).toBe("ROW_ORDER");
      expect(violation.message).toContain("Middle Back (Henry)");
      expect(violation.message).toContain("Right Back (Grace)");
      expect(violation.message).toContain("x=6.50m");
      expect(violation.message).toContain("x=6.00m");
    });
  });

  describe("FRONT_BACK violation messages", () => {
    test("should generate detailed message for LF/LB violation", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true), // Server
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 6.5, false, "Ivy"), // LF behind LB
        createPlayer("5", 5, 2.0, 6.0, false, "Jack"), // LB
        createPlayer("6", 6, 4.5, 6.0),
      ];

      const violations = OverlapValidator.generateDetailedViolations(lineup);
      expect(violations).toHaveLength(1);

      const violation = violations[0];
      expect(violation.code).toBe("FRONT_BACK");
      expect(violation.message).toContain("Front/back violation");
      expect(violation.message).toContain("Left Front (Ivy)");
      expect(violation.message).toContain("Left Back (Jack)");
      expect(violation.message).toContain("y=6.50m");
      expect(violation.message).toContain("y=6.00m");
      expect(violation.message).toContain("Current separation: -0.500m");
      expect(violation.coordinates).toEqual({
        4: { x: 2.0, y: 6.5 },
        5: { x: 2.0, y: 6.0 },
      });
    });

    test("should generate detailed message for MF/MB violation", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true), // Server
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 4.5, 6.2, false, "Kate"), // MF behind MB
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0, false, "Liam"), // MB
      ];

      const violations = OverlapValidator.generateDetailedViolations(lineup);
      expect(violations).toHaveLength(1);

      const violation = violations[0];
      expect(violation.code).toBe("FRONT_BACK");
      expect(violation.message).toContain("Middle Front (Kate)");
      expect(violation.message).toContain("Middle Back (Liam)");
      expect(violation.message).toContain("y=6.20m");
      expect(violation.message).toContain("y=6.00m");
    });

    test("should generate detailed message for RF/RB violation", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, false, "Mia"), // RB
        createPlayer("2", 2, 7.0, 6.1, false, "Noah"), // RF behind RB
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0, true), // Server
      ];

      const violations = OverlapValidator.generateDetailedViolations(lineup);
      expect(violations).toHaveLength(1);

      const violation = violations[0];
      expect(violation.code).toBe("FRONT_BACK");
      expect(violation.message).toContain("Right Front (Noah)");
      expect(violation.message).toContain("Right Back (Mia)");
      expect(violation.message).toContain("y=6.10m");
      expect(violation.message).toContain("y=6.00m");
    });
  });

  describe("MULTIPLE_SERVERS violation messages", () => {
    test("should generate detailed message for two servers", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true, "Olivia"), // Server 1
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0, true, "Paul"), // Server 2
      ];

      const violations = OverlapValidator.generateDetailedViolations(lineup);
      expect(violations).toHaveLength(1);

      const violation = violations[0];
      expect(violation.code).toBe("MULTIPLE_SERVERS");
      expect(violation.message).toContain("Multiple servers detected");
      expect(violation.message).toContain("Olivia (slot 1)");
      expect(violation.message).toContain("Paul (slot 6)");
      expect(violation.message).toContain(
        "Only one player can be designated as the server"
      );
      expect(violation.coordinates).toEqual({
        1: { x: 7.0, y: 6.0 },
        6: { x: 4.5, y: 6.0 },
      });
    });

    test("should generate detailed message for three servers", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true, "Quinn"), // Server 1
        createPlayer("2", 2, 7.0, 3.0, true, "Riley"), // Server 2
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0, true, "Sam"), // Server 3
      ];

      const violations = OverlapValidator.generateDetailedViolations(lineup);
      expect(violations).toHaveLength(1);

      const violation = violations[0];
      expect(violation.code).toBe("MULTIPLE_SERVERS");
      expect(violation.message).toContain("Quinn (slot 1)");
      expect(violation.message).toContain("Riley (slot 2)");
      expect(violation.message).toContain("Sam (slot 6)");
      expect(violation.coordinates).toEqual({
        1: { x: 7.0, y: 6.0 },
        2: { x: 7.0, y: 3.0 },
        6: { x: 4.5, y: 6.0 },
      });
    });
  });

  describe("INVALID_LINEUP violation messages", () => {
    test("should enhance invalid lineup violation with coordinates", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true),
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 4.5, 3.0),
        createPlayer("4", 4, 2.0, 3.0),
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 1, 4.5, 6.0), // Duplicate slot 1
      ];

      const violations = OverlapValidator.generateDetailedViolations(lineup);

      const duplicateViolation = violations.find(
        (v) => v.code === "INVALID_LINEUP" && v.message.includes("duplicate")
      );
      expect(duplicateViolation).toBeDefined();
      expect(duplicateViolation!.coordinates).toBeDefined();
      // The coordinates should include the duplicate slot
      expect(duplicateViolation!.coordinates![1]).toBeDefined();
      expect(duplicateViolation!.slots).toContain(1);
    });
  });

  describe("Complex violation scenarios", () => {
    test("should handle multiple different violation types", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true, "Alpha"), // Server
        createPlayer("2", 2, 2.0, 3.0, true, "Beta"), // Another server (creates MULTIPLE_SERVERS)
        createPlayer("3", 3, 4.5, 7.0, false, "Gamma"), // MF behind MB (creates FRONT_BACK)
        createPlayer("4", 4, 7.0, 3.0, false, "Delta"), // LF too far right (creates ROW_ORDER)
        createPlayer("5", 5, 2.0, 6.0, false, "Echo"),
        createPlayer("6", 6, 4.5, 6.0, false, "Foxtrot"),
      ];

      const violations = OverlapValidator.generateDetailedViolations(lineup);
      expect(violations.length).toBeGreaterThanOrEqual(1);

      const violationCodes = violations.map((v) => v.code);
      expect(violationCodes).toContain("MULTIPLE_SERVERS");

      // Check that all violations have enhanced messages
      violations.forEach((violation) => {
        expect(violation.message).toBeTruthy();
        expect(violation.message.length).toBeGreaterThan(20); // Should be detailed
        if (violation.slots.length > 0) {
          expect(violation.coordinates).toBeDefined();
        }
      });
    });

    test("should provide accurate distance calculations", () => {
      const lineup = [
        createPlayer("1", 1, 7.0, 6.0, true), // Server
        createPlayer("2", 2, 7.0, 3.0),
        createPlayer("3", 3, 1.95, 3.0), // MF exactly 0.05m left of LF
        createPlayer("4", 4, 2.0, 3.0), // LF
        createPlayer("5", 5, 2.0, 6.0),
        createPlayer("6", 6, 4.5, 6.0),
      ];

      const violations = OverlapValidator.generateDetailedViolations(lineup);
      expect(violations).toHaveLength(1);

      const violation = violations[0];
      expect(violation.message).toContain("Current separation: 0.050m");
      expect(violation.message).toContain("minimum required: 0.030m");
    });
  });

  describe("User-friendly message generation", () => {
    test("should provide contextual tips for each violation type", () => {
      // Test ROW_ORDER tip
      let violations = [{ code: "ROW_ORDER", slots: [4, 3], message: "test" }];
      let messages = OverlapValidator.generateUserFriendlyMessages(violations);
      expect(
        messages.some((msg) => msg.includes("💡 Tip: Players in the same row"))
      ).toBe(true);

      // Test FRONT_BACK tip
      violations = [{ code: "FRONT_BACK", slots: [2, 1], message: "test" }];
      messages = OverlapValidator.generateUserFriendlyMessages(violations);
      expect(
        messages.some((msg) => msg.includes("💡 Tip: Front row players"))
      ).toBe(true);

      // Test MULTIPLE_SERVERS tip
      violations = [
        { code: "MULTIPLE_SERVERS", slots: [1, 6], message: "test" },
      ];
      messages = OverlapValidator.generateUserFriendlyMessages(violations);
      expect(
        messages.some((msg) =>
          msg.includes("💡 Tip: Only one player can be designated")
        )
      ).toBe(true);
    });

    test("should format violation counts correctly", () => {
      // Single violation
      let violations = [
        { code: "ROW_ORDER", slots: [4, 3], message: "Single violation" },
      ];
      let messages = OverlapValidator.generateUserFriendlyMessages(violations);
      expect(messages[0]).toBe("1 positioning violation detected:");
      expect(messages[1]).toBe("1. Single violation");

      // Multiple violations
      violations = [
        { code: "ROW_ORDER", slots: [4, 3], message: "First violation" },
        { code: "FRONT_BACK", slots: [2, 1], message: "Second violation" },
      ];
      messages = OverlapValidator.generateUserFriendlyMessages(violations);
      expect(messages[0]).toBe("2 positioning violations detected:");
      expect(messages[1]).toBe("1. First violation");
      expect(messages[2]).toBe("2. Second violation");
    });

    test("should handle edge cases gracefully", () => {
      // Empty violations
      let violations: Violation[] = [];
      let messages = OverlapValidator.generateUserFriendlyMessages(violations);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toContain("All players are positioned correctly");

      // Violation with no slots
      violations = [
        { code: "INVALID_LINEUP", slots: [], message: "Invalid lineup" },
      ];
      messages = OverlapValidator.generateUserFriendlyMessages(violations);
      expect(messages[0]).toContain("1 positioning violation detected");
      expect(messages[1]).toContain("1. Invalid lineup");
    });
  });

  describe("Violation summary statistics", () => {
    test("should calculate severity levels correctly", () => {
      // None
      let violations: Violation[] = [];
      let summary = OverlapValidator.getViolationSummary(violations);
      expect(summary.severity).toBe("none");

      // Minor (single row order)
      violations = [{ code: "ROW_ORDER", slots: [4, 3], message: "test" }];
      summary = OverlapValidator.getViolationSummary(violations);
      expect(summary.severity).toBe("minor");

      // Major (single non-row-order or two violations)
      violations = [{ code: "FRONT_BACK", slots: [2, 1], message: "test" }];
      summary = OverlapValidator.getViolationSummary(violations);
      expect(summary.severity).toBe("major");

      violations = [
        { code: "ROW_ORDER", slots: [4, 3], message: "test" },
        { code: "ROW_ORDER", slots: [5, 6], message: "test" },
      ];
      summary = OverlapValidator.getViolationSummary(violations);
      expect(summary.severity).toBe("major");

      // Critical (more than two violations)
      violations = [
        { code: "ROW_ORDER", slots: [4, 3], message: "test" },
        { code: "FRONT_BACK", slots: [2, 1], message: "test" },
        { code: "MULTIPLE_SERVERS", slots: [1, 6], message: "test" },
      ];
      summary = OverlapValidator.getViolationSummary(violations);
      expect(summary.severity).toBe("critical");
    });

    test("should aggregate violation types correctly", () => {
      const violations = [
        { code: "ROW_ORDER", slots: [4, 3], message: "test" },
        { code: "ROW_ORDER", slots: [5, 6], message: "test" },
        { code: "FRONT_BACK", slots: [2, 1], message: "test" },
        { code: "MULTIPLE_SERVERS", slots: [1, 6], message: "test" },
      ];

      const summary = OverlapValidator.getViolationSummary(violations);
      expect(summary.totalViolations).toBe(4);
      expect(summary.violationTypes).toEqual({
        ROW_ORDER: 2,
        FRONT_BACK: 1,
        MULTIPLE_SERVERS: 1,
      });
      expect(summary.affectedSlots).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });
});
