/**
 * Unit tests for NeighborCalculator
 */

import { NeighborCalculator } from "../NeighborCalculator";
import type { RotationSlot } from "../../types/PlayerState";

describe("NeighborCalculator", () => {
  describe("getLeftNeighbor", () => {
    describe("front row circular neighbors", () => {
      it("should return correct left neighbors for front row", () => {
        // Front row: 4 (LF) → 3 (MF) → 2 (RF)
        expect(NeighborCalculator.getLeftNeighbor(4)).toBe(2); // LF left neighbor is RF (circular)
        expect(NeighborCalculator.getLeftNeighbor(3)).toBe(4); // MF left neighbor is LF
        expect(NeighborCalculator.getLeftNeighbor(2)).toBe(3); // RF left neighbor is MF
      });
    });

    describe("back row circular neighbors", () => {
      it("should return correct left neighbors for back row", () => {
        // Back row: 5 (LB) → 6 (MB) → 1 (RB)
        expect(NeighborCalculator.getLeftNeighbor(5)).toBe(1); // LB left neighbor is RB (circular)
        expect(NeighborCalculator.getLeftNeighbor(6)).toBe(5); // MB left neighbor is LB
        expect(NeighborCalculator.getLeftNeighbor(1)).toBe(6); // RB left neighbor is MB
      });
    });

    it("should handle invalid slots", () => {
      // Test with invalid slot numbers (though TypeScript should prevent this)
      expect(NeighborCalculator.getLeftNeighbor(0 as RotationSlot)).toBe(null);
      expect(NeighborCalculator.getLeftNeighbor(7 as RotationSlot)).toBe(null);
    });
  });

  describe("getRightNeighbor", () => {
    describe("front row circular neighbors", () => {
      it("should return correct right neighbors for front row", () => {
        // Front row: 4 (LF) → 3 (MF) → 2 (RF)
        expect(NeighborCalculator.getRightNeighbor(4)).toBe(3); // LF right neighbor is MF
        expect(NeighborCalculator.getRightNeighbor(3)).toBe(2); // MF right neighbor is RF
        expect(NeighborCalculator.getRightNeighbor(2)).toBe(4); // RF right neighbor is LF (circular)
      });
    });

    describe("back row circular neighbors", () => {
      it("should return correct right neighbors for back row", () => {
        // Back row: 5 (LB) → 6 (MB) → 1 (RB)
        expect(NeighborCalculator.getRightNeighbor(5)).toBe(6); // LB right neighbor is MB
        expect(NeighborCalculator.getRightNeighbor(6)).toBe(1); // MB right neighbor is RB
        expect(NeighborCalculator.getRightNeighbor(1)).toBe(5); // RB right neighbor is LB (circular)
      });
    });

    it("should handle invalid slots", () => {
      expect(NeighborCalculator.getRightNeighbor(0 as RotationSlot)).toBe(null);
      expect(NeighborCalculator.getRightNeighbor(7 as RotationSlot)).toBe(null);
    });
  });

  describe("getRowCounterpart", () => {
    it("should return correct front/back counterparts", () => {
      // Front/back pairs: LF↔LB (4↔5), MF↔MB (3↔6), RF↔RB (2↔1)
      expect(NeighborCalculator.getRowCounterpart(4)).toBe(5); // LF ↔ LB
      expect(NeighborCalculator.getRowCounterpart(5)).toBe(4); // LB ↔ LF
      expect(NeighborCalculator.getRowCounterpart(3)).toBe(6); // MF ↔ MB
      expect(NeighborCalculator.getRowCounterpart(6)).toBe(3); // MB ↔ MF
      expect(NeighborCalculator.getRowCounterpart(2)).toBe(1); // RF ↔ RB
      expect(NeighborCalculator.getRowCounterpart(1)).toBe(2); // RB ↔ RF
    });

    it("should handle invalid slots", () => {
      expect(NeighborCalculator.getRowCounterpart(0 as RotationSlot)).toBe(
        null
      );
      expect(NeighborCalculator.getRowCounterpart(7 as RotationSlot)).toBe(
        null
      );
    });
  });

  describe("isFrontRow", () => {
    it("should correctly identify front row slots", () => {
      expect(NeighborCalculator.isFrontRow(2)).toBe(true); // RF
      expect(NeighborCalculator.isFrontRow(3)).toBe(true); // MF
      expect(NeighborCalculator.isFrontRow(4)).toBe(true); // LF
    });

    it("should correctly identify non-front row slots", () => {
      expect(NeighborCalculator.isFrontRow(1)).toBe(false); // RB
      expect(NeighborCalculator.isFrontRow(5)).toBe(false); // LB
      expect(NeighborCalculator.isFrontRow(6)).toBe(false); // MB
    });
  });

  describe("isBackRow", () => {
    it("should correctly identify back row slots", () => {
      expect(NeighborCalculator.isBackRow(1)).toBe(true); // RB
      expect(NeighborCalculator.isBackRow(5)).toBe(true); // LB
      expect(NeighborCalculator.isBackRow(6)).toBe(true); // MB
    });

    it("should correctly identify non-back row slots", () => {
      expect(NeighborCalculator.isBackRow(2)).toBe(false); // RF
      expect(NeighborCalculator.isBackRow(3)).toBe(false); // MF
      expect(NeighborCalculator.isBackRow(4)).toBe(false); // LF
    });
  });

  describe("getAllNeighbors", () => {
    it("should return all neighbors for front row slots", () => {
      const lfNeighbors = NeighborCalculator.getAllNeighbors(4); // LF
      expect(lfNeighbors).toEqual({
        left: 2, // RF (circular)
        right: 3, // MF
        counterpart: 5, // LB
      });

      const mfNeighbors = NeighborCalculator.getAllNeighbors(3); // MF
      expect(mfNeighbors).toEqual({
        left: 4, // LF
        right: 2, // RF
        counterpart: 6, // MB
      });

      const rfNeighbors = NeighborCalculator.getAllNeighbors(2); // RF
      expect(rfNeighbors).toEqual({
        left: 3, // MF
        right: 4, // LF (circular)
        counterpart: 1, // RB
      });
    });

    it("should return all neighbors for back row slots", () => {
      const lbNeighbors = NeighborCalculator.getAllNeighbors(5); // LB
      expect(lbNeighbors).toEqual({
        left: 1, // RB (circular)
        right: 6, // MB
        counterpart: 4, // LF
      });

      const mbNeighbors = NeighborCalculator.getAllNeighbors(6); // MB
      expect(mbNeighbors).toEqual({
        left: 5, // LB
        right: 1, // RB
        counterpart: 3, // MF
      });

      const rbNeighbors = NeighborCalculator.getAllNeighbors(1); // RB
      expect(rbNeighbors).toEqual({
        left: 6, // MB
        right: 5, // LB (circular)
        counterpart: 2, // RF
      });
    });
  });

  describe("getRowType", () => {
    it("should return correct row types", () => {
      expect(NeighborCalculator.getRowType(2)).toBe("front"); // RF
      expect(NeighborCalculator.getRowType(3)).toBe("front"); // MF
      expect(NeighborCalculator.getRowType(4)).toBe("front"); // LF

      expect(NeighborCalculator.getRowType(1)).toBe("back"); // RB
      expect(NeighborCalculator.getRowType(5)).toBe("back"); // LB
      expect(NeighborCalculator.getRowType(6)).toBe("back"); // MB
    });

    it("should handle invalid slots", () => {
      expect(NeighborCalculator.getRowType(0 as RotationSlot)).toBe(null);
      expect(NeighborCalculator.getRowType(7 as RotationSlot)).toBe(null);
    });
  });

  describe("getColumnPosition", () => {
    it("should return correct column positions", () => {
      expect(NeighborCalculator.getColumnPosition(4)).toBe("left"); // LF
      expect(NeighborCalculator.getColumnPosition(5)).toBe("left"); // LB

      expect(NeighborCalculator.getColumnPosition(3)).toBe("middle"); // MF
      expect(NeighborCalculator.getColumnPosition(6)).toBe("middle"); // MB

      expect(NeighborCalculator.getColumnPosition(2)).toBe("right"); // RF
      expect(NeighborCalculator.getColumnPosition(1)).toBe("right"); // RB
    });

    it("should handle invalid slots", () => {
      expect(NeighborCalculator.getColumnPosition(0 as RotationSlot)).toBe(
        null
      );
      expect(NeighborCalculator.getColumnPosition(7 as RotationSlot)).toBe(
        null
      );
    });
  });

  describe("edge cases and comprehensive coverage", () => {
    it("should maintain circular consistency for front row", () => {
      // Test that going around the circle returns to start
      const startSlot: RotationSlot = 4; // LF
      let currentSlot = startSlot;

      // Go right 3 times (should return to start due to circular nature)
      currentSlot = NeighborCalculator.getRightNeighbor(currentSlot)!; // 4 → 3
      currentSlot = NeighborCalculator.getRightNeighbor(currentSlot)!; // 3 → 2
      currentSlot = NeighborCalculator.getRightNeighbor(currentSlot)!; // 2 → 4

      expect(currentSlot).toBe(startSlot);
    });

    it("should maintain circular consistency for back row", () => {
      // Test that going around the circle returns to start
      const startSlot: RotationSlot = 5; // LB
      let currentSlot = startSlot;

      // Go right 3 times (should return to start due to circular nature)
      currentSlot = NeighborCalculator.getRightNeighbor(currentSlot)!; // 5 → 6
      currentSlot = NeighborCalculator.getRightNeighbor(currentSlot)!; // 6 → 1
      currentSlot = NeighborCalculator.getRightNeighbor(currentSlot)!; // 1 → 5

      expect(currentSlot).toBe(startSlot);
    });

    it("should maintain left/right symmetry", () => {
      const allSlots: RotationSlot[] = [1, 2, 3, 4, 5, 6];

      for (const slot of allSlots) {
        const rightNeighbor = NeighborCalculator.getRightNeighbor(slot);
        if (rightNeighbor) {
          const leftOfRight = NeighborCalculator.getLeftNeighbor(rightNeighbor);
          expect(leftOfRight).toBe(slot);
        }

        const leftNeighbor = NeighborCalculator.getLeftNeighbor(slot);
        if (leftNeighbor) {
          const rightOfLeft = NeighborCalculator.getRightNeighbor(leftNeighbor);
          expect(rightOfLeft).toBe(slot);
        }
      }
    });

    it("should maintain counterpart symmetry", () => {
      const allSlots: RotationSlot[] = [1, 2, 3, 4, 5, 6];

      for (const slot of allSlots) {
        const counterpart = NeighborCalculator.getRowCounterpart(slot);
        if (counterpart) {
          const counterpartOfCounterpart =
            NeighborCalculator.getRowCounterpart(counterpart);
          expect(counterpartOfCounterpart).toBe(slot);
        }
      }
    });

    it("should ensure no slot is both front and back row", () => {
      const allSlots: RotationSlot[] = [1, 2, 3, 4, 5, 6];

      for (const slot of allSlots) {
        const isFront = NeighborCalculator.isFrontRow(slot);
        const isBack = NeighborCalculator.isBackRow(slot);

        // Each slot should be exactly one of front or back, not both or neither
        expect(isFront !== isBack).toBe(true);
      }
    });

    it("should have exactly 3 slots in each row", () => {
      const allSlots: RotationSlot[] = [1, 2, 3, 4, 5, 6];

      const frontSlots = allSlots.filter((slot) =>
        NeighborCalculator.isFrontRow(slot)
      );
      const backSlots = allSlots.filter((slot) =>
        NeighborCalculator.isBackRow(slot)
      );

      expect(frontSlots).toHaveLength(3);
      expect(backSlots).toHaveLength(3);
      expect([...frontSlots, ...backSlots].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });
});
