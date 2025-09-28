/**
 * Unit tests for PositionHelpers utility class
 */

import { describe, test, expect } from "vitest";
import { PositionHelpers, type Column, type Row } from "../PositionHelpers";
import type { RotationSlot, PlayerState } from "../../types/PlayerState";

describe("PositionHelpers", () => {
  describe("getSlotLabel", () => {
    test("should return correct labels for all slots", () => {
      expect(PositionHelpers.getSlotLabel(1)).toBe("RB");
      expect(PositionHelpers.getSlotLabel(2)).toBe("RF");
      expect(PositionHelpers.getSlotLabel(3)).toBe("MF");
      expect(PositionHelpers.getSlotLabel(4)).toBe("LF");
      expect(PositionHelpers.getSlotLabel(5)).toBe("LB");
      expect(PositionHelpers.getSlotLabel(6)).toBe("MB");
    });
  });

  describe("getSlotFullName", () => {
    test("should return correct full names for all slots", () => {
      expect(PositionHelpers.getSlotFullName(1)).toBe("Right Back");
      expect(PositionHelpers.getSlotFullName(2)).toBe("Right Front");
      expect(PositionHelpers.getSlotFullName(3)).toBe("Middle Front");
      expect(PositionHelpers.getSlotFullName(4)).toBe("Left Front");
      expect(PositionHelpers.getSlotFullName(5)).toBe("Left Back");
      expect(PositionHelpers.getSlotFullName(6)).toBe("Middle Back");
    });
  });

  describe("getSlotColumn", () => {
    test("should return correct columns for all slots", () => {
      expect(PositionHelpers.getSlotColumn(1)).toBe("Right");
      expect(PositionHelpers.getSlotColumn(2)).toBe("Right");
      expect(PositionHelpers.getSlotColumn(3)).toBe("Middle");
      expect(PositionHelpers.getSlotColumn(4)).toBe("Left");
      expect(PositionHelpers.getSlotColumn(5)).toBe("Left");
      expect(PositionHelpers.getSlotColumn(6)).toBe("Middle");
    });

    test("should group slots correctly by column", () => {
      const leftSlots = [4, 5];
      const middleSlots = [3, 6];
      const rightSlots = [1, 2];

      leftSlots.forEach((slot) => {
        expect(PositionHelpers.getSlotColumn(slot as RotationSlot)).toBe(
          "Left"
        );
      });

      middleSlots.forEach((slot) => {
        expect(PositionHelpers.getSlotColumn(slot as RotationSlot)).toBe(
          "Middle"
        );
      });

      rightSlots.forEach((slot) => {
        expect(PositionHelpers.getSlotColumn(slot as RotationSlot)).toBe(
          "Right"
        );
      });
    });
  });

  describe("getSlotRow", () => {
    test("should return correct rows for all slots", () => {
      expect(PositionHelpers.getSlotRow(1)).toBe("Back");
      expect(PositionHelpers.getSlotRow(2)).toBe("Front");
      expect(PositionHelpers.getSlotRow(3)).toBe("Front");
      expect(PositionHelpers.getSlotRow(4)).toBe("Front");
      expect(PositionHelpers.getSlotRow(5)).toBe("Back");
      expect(PositionHelpers.getSlotRow(6)).toBe("Back");
    });

    test("should group slots correctly by row", () => {
      const frontSlots = [2, 3, 4];
      const backSlots = [1, 5, 6];

      frontSlots.forEach((slot) => {
        expect(PositionHelpers.getSlotRow(slot as RotationSlot)).toBe("Front");
      });

      backSlots.forEach((slot) => {
        expect(PositionHelpers.getSlotRow(slot as RotationSlot)).toBe("Back");
      });
    });
  });

  describe("getPositionDescription", () => {
    test("should return complete position description", () => {
      const desc = PositionHelpers.getPositionDescription(3);

      expect(desc).toEqual({
        slot: 3,
        label: "MF",
        fullName: "Middle Front",
        column: "Middle",
        row: "Front",
        abbreviation: "MF",
      });
    });

    test("should work for all slots", () => {
      const allSlots: RotationSlot[] = [1, 2, 3, 4, 5, 6];

      allSlots.forEach((slot) => {
        const desc = PositionHelpers.getPositionDescription(slot);
        expect(desc.slot).toBe(slot);
        expect(desc.label).toBe(PositionHelpers.getSlotLabel(slot));
        expect(desc.fullName).toBe(PositionHelpers.getSlotFullName(slot));
        expect(desc.column).toBe(PositionHelpers.getSlotColumn(slot));
        expect(desc.row).toBe(PositionHelpers.getSlotRow(slot));
        expect(desc.abbreviation).toBe(desc.label);
      });
    });
  });

  describe("getSlotsInColumn", () => {
    test("should return correct slots for each column", () => {
      expect(PositionHelpers.getSlotsInColumn("Left")).toEqual([4, 5]);
      expect(PositionHelpers.getSlotsInColumn("Middle")).toEqual([3, 6]);
      expect(PositionHelpers.getSlotsInColumn("Right")).toEqual([1, 2]);
    });

    test("should return slots in sorted order", () => {
      const columns: Column[] = ["Left", "Middle", "Right"];

      columns.forEach((column) => {
        const slots = PositionHelpers.getSlotsInColumn(column);
        const sortedSlots = [...slots].sort((a, b) => a - b);
        expect(slots).toEqual(sortedSlots);
      });
    });
  });

  describe("getSlotsInRow", () => {
    test("should return correct slots for each row", () => {
      expect(PositionHelpers.getSlotsInRow("Front")).toEqual([2, 3, 4]);
      expect(PositionHelpers.getSlotsInRow("Back")).toEqual([1, 5, 6]);
    });

    test("should return slots in sorted order", () => {
      const rows: Row[] = ["Front", "Back"];

      rows.forEach((row) => {
        const slots = PositionHelpers.getSlotsInRow(row);
        const sortedSlots = [...slots].sort((a, b) => a - b);
        expect(slots).toEqual(sortedSlots);
      });
    });
  });

  describe("convenience methods for specific groups", () => {
    test("getFrontRowSlots should return front row slots", () => {
      expect(PositionHelpers.getFrontRowSlots()).toEqual([2, 3, 4]);
    });

    test("getBackRowSlots should return back row slots", () => {
      expect(PositionHelpers.getBackRowSlots()).toEqual([1, 5, 6]);
    });

    test("getLeftColumnSlots should return left column slots", () => {
      expect(PositionHelpers.getLeftColumnSlots()).toEqual([4, 5]);
    });

    test("getMiddleColumnSlots should return middle column slots", () => {
      expect(PositionHelpers.getMiddleColumnSlots()).toEqual([3, 6]);
    });

    test("getRightColumnSlots should return right column slots", () => {
      expect(PositionHelpers.getRightColumnSlots()).toEqual([1, 2]);
    });
  });

  describe("formatPositionDisplay", () => {
    test("should format with slot number by default", () => {
      expect(PositionHelpers.formatPositionDisplay(3)).toBe(
        "3 - MF (Middle Front)"
      );
      expect(PositionHelpers.formatPositionDisplay(1)).toBe(
        "1 - RB (Right Back)"
      );
    });

    test("should format without slot number when requested", () => {
      expect(PositionHelpers.formatPositionDisplay(3, false)).toBe(
        "MF (Middle Front)"
      );
      expect(PositionHelpers.formatPositionDisplay(1, false)).toBe(
        "RB (Right Back)"
      );
    });

    test("should work for all slots", () => {
      const allSlots: RotationSlot[] = [1, 2, 3, 4, 5, 6];

      allSlots.forEach((slot) => {
        const withNumber = PositionHelpers.formatPositionDisplay(slot);
        const withoutNumber = PositionHelpers.formatPositionDisplay(
          slot,
          false
        );

        expect(withNumber).toContain(slot.toString());
        expect(withNumber).toContain(PositionHelpers.getSlotLabel(slot));
        expect(withNumber).toContain(PositionHelpers.getSlotFullName(slot));

        expect(withoutNumber).not.toContain(slot.toString());
        expect(withoutNumber).toContain(PositionHelpers.getSlotLabel(slot));
        expect(withoutNumber).toContain(PositionHelpers.getSlotFullName(slot));
      });
    });
  });

  describe("formatCompactDisplay", () => {
    test("should format compact display correctly", () => {
      expect(PositionHelpers.formatCompactDisplay(1)).toBe("1RB");
      expect(PositionHelpers.formatCompactDisplay(2)).toBe("2RF");
      expect(PositionHelpers.formatCompactDisplay(3)).toBe("3MF");
      expect(PositionHelpers.formatCompactDisplay(4)).toBe("4LF");
      expect(PositionHelpers.formatCompactDisplay(5)).toBe("5LB");
      expect(PositionHelpers.formatCompactDisplay(6)).toBe("6MB");
    });
  });

  describe("analyzeFormationPattern", () => {
    const createPlayer = (
      id: string,
      slot: RotationSlot,
      x: number,
      y: number,
      isServer = false
    ): PlayerState => ({
      id,
      displayName: `Player ${id}`,
      role: "Unknown",
      slot,
      x,
      y,
      isServer,
    });

    test("should detect invalid formation with wrong player count", () => {
      const players = [createPlayer("1", 1, 7, 7), createPlayer("2", 2, 8, 2)];

      const pattern = PositionHelpers.analyzeFormationPattern(players);

      expect(pattern.isValid).toBe(false);
      expect(pattern.name).toBe("Invalid");
      expect(pattern.description).toBe("Formation must have exactly 6 players");
      expect(pattern.characteristics).toContain("Player count: 2");
    });

    test("should analyze valid standard formation", () => {
      const players = [
        createPlayer("1", 1, 7, 7), // RB
        createPlayer("2", 2, 8, 2, true), // RF (server)
        createPlayer("3", 3, 4.5, 2), // MF
        createPlayer("4", 4, 1, 2), // LF
        createPlayer("5", 5, 2, 7), // LB
        createPlayer("6", 6, 4.5, 7), // MB
      ];

      const pattern = PositionHelpers.analyzeFormationPattern(players);

      expect(pattern.isValid).toBe(true);
      expect(pattern.characteristics).toContain("Front row: 3 players");
      expect(pattern.characteristics).toContain("Back row: 3 players");
      expect(pattern.characteristics).toContain("Server: RF (Right Front)");
    });

    test("should detect server in service zone", () => {
      const players = [
        createPlayer("1", 1, 7, 7), // RB
        createPlayer("2", 2, 8, 10, true), // RF (server in service zone)
        createPlayer("3", 3, 4.5, 2), // MF
        createPlayer("4", 4, 1, 2), // LF
        createPlayer("5", 5, 2, 7), // LB
        createPlayer("6", 6, 4.5, 7), // MB
      ];

      const pattern = PositionHelpers.analyzeFormationPattern(players);

      expect(pattern.characteristics).toContain("Server in service zone");
    });

    test("should analyze formation spread", () => {
      const players = [
        createPlayer("1", 1, 8.5, 7), // RB (far right)
        createPlayer("2", 2, 8, 2, true), // RF (server)
        createPlayer("3", 3, 4.5, 2), // MF
        createPlayer("4", 4, 0.5, 2), // LF (far left)
        createPlayer("5", 5, 1, 7), // LB
        createPlayer("6", 6, 4.5, 7), // MB
      ];

      const pattern = PositionHelpers.analyzeFormationPattern(players);

      expect(pattern.name).toBe("Spread");
      expect(pattern.description).toBe(
        "Wide spread formation covering full court width"
      );
      expect(
        pattern.characteristics.some((c) => c.includes("X-axis spread:"))
      ).toBe(true);
    });

    test("should detect compact formation", () => {
      const players = [
        createPlayer("1", 1, 5, 7), // RB
        createPlayer("2", 2, 5.5, 2, true), // RF (server)
        createPlayer("3", 3, 4.5, 2), // MF
        createPlayer("4", 4, 4, 2), // LF
        createPlayer("5", 5, 4, 7), // LB
        createPlayer("6", 6, 4.5, 7), // MB
      ];

      const pattern = PositionHelpers.analyzeFormationPattern(players);

      expect(pattern.name).toBe("Compact");
      expect(pattern.description).toBe(
        "Compact formation with players close together"
      );
    });

    test("should handle invalid server count", () => {
      const players = [
        createPlayer("1", 1, 7, 7, true), // RB (server)
        createPlayer("2", 2, 8, 2, true), // RF (server)
        createPlayer("3", 3, 4.5, 2), // MF
        createPlayer("4", 4, 1, 2), // LF
        createPlayer("5", 5, 2, 7), // LB
        createPlayer("6", 6, 4.5, 7), // MB
      ];

      const pattern = PositionHelpers.analyzeFormationPattern(players);

      expect(pattern.isValid).toBe(false);
      expect(pattern.characteristics).toContain("Invalid server count: 2");
    });
  });

  describe("getPositionRelationships", () => {
    test("should return correct relationships for front row slots", () => {
      // LF (4) relationships
      const lfRel = PositionHelpers.getPositionRelationships(4);
      expect(lfRel.neighbors).toEqual([3]); // MF
      expect(lfRel.counterpart).toBe(5); // LB
      expect(lfRel.sameRow).toEqual([2, 3]); // RF, MF
      expect(lfRel.sameColumn).toEqual([5]); // LB

      // MF (3) relationships
      const mfRel = PositionHelpers.getPositionRelationships(3);
      expect(mfRel.neighbors).toEqual([4, 2]); // LF, RF
      expect(mfRel.counterpart).toBe(6); // MB
      expect(mfRel.sameRow).toEqual([2, 4]); // RF, LF
      expect(mfRel.sameColumn).toEqual([6]); // MB

      // RF (2) relationships
      const rfRel = PositionHelpers.getPositionRelationships(2);
      expect(rfRel.neighbors).toEqual([3]); // MF
      expect(rfRel.counterpart).toBe(1); // RB
      expect(rfRel.sameRow).toEqual([3, 4]); // MF, LF
      expect(rfRel.sameColumn).toEqual([1]); // RB
    });

    test("should return correct relationships for back row slots", () => {
      // LB (5) relationships
      const lbRel = PositionHelpers.getPositionRelationships(5);
      expect(lbRel.neighbors).toEqual([6]); // MB
      expect(lbRel.counterpart).toBe(4); // LF
      expect(lbRel.sameRow).toEqual([1, 6]); // RB, MB
      expect(lbRel.sameColumn).toEqual([4]); // LF

      // MB (6) relationships
      const mbRel = PositionHelpers.getPositionRelationships(6);
      expect(mbRel.neighbors).toEqual([5, 1]); // LB, RB
      expect(mbRel.counterpart).toBe(3); // MF
      expect(mbRel.sameRow).toEqual([1, 5]); // RB, LB
      expect(mbRel.sameColumn).toEqual([3]); // MF

      // RB (1) relationships
      const rbRel = PositionHelpers.getPositionRelationships(1);
      expect(rbRel.neighbors).toEqual([6]); // MB
      expect(rbRel.counterpart).toBe(2); // RF
      expect(rbRel.sameRow).toEqual([5, 6]); // LB, MB
      expect(rbRel.sameColumn).toEqual([2]); // RF
    });
  });

  describe("areAdjacent", () => {
    test("should correctly identify adjacent slots in front row", () => {
      expect(PositionHelpers.areAdjacent(4, 3)).toBe(true); // LF-MF
      expect(PositionHelpers.areAdjacent(3, 4)).toBe(true); // MF-LF
      expect(PositionHelpers.areAdjacent(3, 2)).toBe(true); // MF-RF
      expect(PositionHelpers.areAdjacent(2, 3)).toBe(true); // RF-MF
      expect(PositionHelpers.areAdjacent(4, 2)).toBe(false); // LF-RF (not adjacent)
    });

    test("should correctly identify adjacent slots in back row", () => {
      expect(PositionHelpers.areAdjacent(5, 6)).toBe(true); // LB-MB
      expect(PositionHelpers.areAdjacent(6, 5)).toBe(true); // MB-LB
      expect(PositionHelpers.areAdjacent(6, 1)).toBe(true); // MB-RB
      expect(PositionHelpers.areAdjacent(1, 6)).toBe(true); // RB-MB
      expect(PositionHelpers.areAdjacent(5, 1)).toBe(false); // LB-RB (not adjacent)
    });

    test("should return false for slots in different rows", () => {
      expect(PositionHelpers.areAdjacent(2, 1)).toBe(false); // RF-RB
      expect(PositionHelpers.areAdjacent(3, 6)).toBe(false); // MF-MB
      expect(PositionHelpers.areAdjacent(4, 5)).toBe(false); // LF-LB
    });
  });

  describe("areCounterparts", () => {
    test("should correctly identify counterpart pairs", () => {
      expect(PositionHelpers.areCounterparts(4, 5)).toBe(true); // LF-LB
      expect(PositionHelpers.areCounterparts(5, 4)).toBe(true); // LB-LF
      expect(PositionHelpers.areCounterparts(3, 6)).toBe(true); // MF-MB
      expect(PositionHelpers.areCounterparts(6, 3)).toBe(true); // MB-MF
      expect(PositionHelpers.areCounterparts(2, 1)).toBe(true); // RF-RB
      expect(PositionHelpers.areCounterparts(1, 2)).toBe(true); // RB-RF
    });

    test("should return false for non-counterpart pairs", () => {
      expect(PositionHelpers.areCounterparts(4, 3)).toBe(false); // LF-MF
      expect(PositionHelpers.areCounterparts(2, 6)).toBe(false); // RF-MB
      expect(PositionHelpers.areCounterparts(1, 5)).toBe(false); // RB-LB
    });
  });

  describe("getAllSlots", () => {
    test("should return all valid rotation slots", () => {
      expect(PositionHelpers.getAllSlots()).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test("should return slots in ascending order", () => {
      const slots = PositionHelpers.getAllSlots();
      const sortedSlots = [...slots].sort((a, b) => a - b);
      expect(slots).toEqual(sortedSlots);
    });
  });

  describe("isValidSlot", () => {
    test("should return true for valid slots", () => {
      expect(PositionHelpers.isValidSlot(1)).toBe(true);
      expect(PositionHelpers.isValidSlot(2)).toBe(true);
      expect(PositionHelpers.isValidSlot(3)).toBe(true);
      expect(PositionHelpers.isValidSlot(4)).toBe(true);
      expect(PositionHelpers.isValidSlot(5)).toBe(true);
      expect(PositionHelpers.isValidSlot(6)).toBe(true);
    });

    test("should return false for invalid slots", () => {
      expect(PositionHelpers.isValidSlot(0)).toBe(false);
      expect(PositionHelpers.isValidSlot(7)).toBe(false);
      expect(PositionHelpers.isValidSlot(-1)).toBe(false);
      expect(PositionHelpers.isValidSlot(1.5)).toBe(false);
      expect(PositionHelpers.isValidSlot("1")).toBe(false);
      expect(PositionHelpers.isValidSlot(null)).toBe(false);
      expect(PositionHelpers.isValidSlot(undefined)).toBe(false);
      expect(PositionHelpers.isValidSlot({})).toBe(false);
    });
  });

  describe("edge cases and error handling", () => {
    test("should handle all slot numbers consistently", () => {
      const allSlots: RotationSlot[] = [1, 2, 3, 4, 5, 6];

      allSlots.forEach((slot) => {
        // All methods should work without throwing
        expect(() => PositionHelpers.getSlotLabel(slot)).not.toThrow();
        expect(() => PositionHelpers.getSlotFullName(slot)).not.toThrow();
        expect(() => PositionHelpers.getSlotColumn(slot)).not.toThrow();
        expect(() => PositionHelpers.getSlotRow(slot)).not.toThrow();
        expect(() =>
          PositionHelpers.getPositionDescription(slot)
        ).not.toThrow();
        expect(() => PositionHelpers.formatPositionDisplay(slot)).not.toThrow();
        expect(() => PositionHelpers.formatCompactDisplay(slot)).not.toThrow();
        expect(() =>
          PositionHelpers.getPositionRelationships(slot)
        ).not.toThrow();

        // Results should be consistent
        const desc = PositionHelpers.getPositionDescription(slot);
        expect(desc.slot).toBe(slot);
        expect(desc.label).toBe(PositionHelpers.getSlotLabel(slot));
        expect(desc.column).toBe(PositionHelpers.getSlotColumn(slot));
        expect(desc.row).toBe(PositionHelpers.getSlotRow(slot));
      });
    });

    test("should maintain consistency between related methods", () => {
      // Front row methods should be consistent
      const frontFromRow = PositionHelpers.getSlotsInRow("Front");
      const frontFromMethod = PositionHelpers.getFrontRowSlots();
      expect(frontFromRow).toEqual(frontFromMethod);

      // Back row methods should be consistent
      const backFromRow = PositionHelpers.getSlotsInRow("Back");
      const backFromMethod = PositionHelpers.getBackRowSlots();
      expect(backFromRow).toEqual(backFromMethod);

      // Column methods should be consistent
      const leftFromColumn = PositionHelpers.getSlotsInColumn("Left");
      const leftFromMethod = PositionHelpers.getLeftColumnSlots();
      expect(leftFromColumn).toEqual(leftFromMethod);

      const middleFromColumn = PositionHelpers.getSlotsInColumn("Middle");
      const middleFromMethod = PositionHelpers.getMiddleColumnSlots();
      expect(middleFromColumn).toEqual(middleFromMethod);

      const rightFromColumn = PositionHelpers.getSlotsInColumn("Right");
      const rightFromMethod = PositionHelpers.getRightColumnSlots();
      expect(rightFromColumn).toEqual(rightFromMethod);
    });
  });
});
