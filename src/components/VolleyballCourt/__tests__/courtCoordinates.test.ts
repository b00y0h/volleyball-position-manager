/**
 * Unit tests for court coordinate utilities
 */

import { describe, it, expect } from "vitest";
import {
  calculateCourtDimensions,
  scaleCoordinates,
  getBaseCoordinates,
  getServeReceiveCoordinates,
  getServeReceiveTargets,
  getBaseAttackCoordinates,
  getFormationCoordinates,
  screenToVolleyballCoordinates,
  volleyballToScreenCoordinates,
  isPositionInBounds,
  clampPositionToBounds,
  BASE_COURT_WIDTH,
  BASE_COURT_HEIGHT,
  COURT_ASPECT_RATIO,
} from "../courtCoordinates";
import { CourtDimensions } from "../types";
import { PlayerPosition } from "@/types";

describe("courtCoordinates", () => {
  const defaultDimensions: CourtDimensions = {
    width: 600,
    height: 360,
    aspectRatio: 600 / 360,
  };

  describe("calculateCourtDimensions", () => {
    it("returns custom dimensions when provided", () => {
      const customDimensions: CourtDimensions = {
        width: 800,
        height: 480,
      };

      const result = calculateCourtDimensions(1200, 800, customDimensions);

      expect(result).toEqual({
        width: 800,
        height: 480,
        aspectRatio: 800 / 480,
      });
    });

    it("calculates responsive dimensions based on window size", () => {
      const result = calculateCourtDimensions(1200, 800);

      // Should account for sidebar, header, footer, and padding
      // Available width: 1200 - 300 - 80 = 820
      // Available height: 800 - 200 - 100 - 80 = 420
      // Constrained by height: 420 * (5/3) = 700, but width available is 820

      expect(result.width).toBeGreaterThan(400); // Minimum width
      expect(result.height).toBeGreaterThan(240); // Minimum height
      expect(result.aspectRatio).toBe(COURT_ASPECT_RATIO);
    });

    it("enforces minimum dimensions", () => {
      const result = calculateCourtDimensions(200, 200); // Very small window

      expect(result.width).toBe(400); // Minimum width
      expect(result.height).toBe(240); // Minimum height (400 / COURT_ASPECT_RATIO)
      expect(result.aspectRatio).toBe(COURT_ASPECT_RATIO);
    });

    it("maintains aspect ratio", () => {
      const result = calculateCourtDimensions(1600, 1200);

      expect(result.aspectRatio).toBe(COURT_ASPECT_RATIO);
      expect(result.width / result.height).toBeCloseTo(COURT_ASPECT_RATIO, 2);
    });
  });

  describe("scaleCoordinates", () => {
    it("scales coordinates proportionally", () => {
      const baseCoords = {
        1: { x: 300, y: 180 },
        2: { x: 150, y: 90 },
      };

      const scaledCoords = scaleCoordinates(baseCoords, {
        width: 600,
        height: 360,
        aspectRatio: 600 / 360,
      });

      // Scale factor is 600/600 = 1 for x, 360/360 = 1 for y (no scaling)
      expect(scaledCoords[1]).toEqual({ x: 300, y: 180, isCustom: undefined });
      expect(scaledCoords[2]).toEqual({ x: 150, y: 90, isCustom: undefined });
    });

    it("preserves isCustom property", () => {
      const baseCoords = {
        1: { x: 300, y: 180, isCustom: true },
      };

      const scaledCoords = scaleCoordinates(baseCoords, defaultDimensions);

      expect(scaledCoords[1].isCustom).toBe(true);
    });
  });

  describe("getBaseCoordinates", () => {
    it("returns correct base positions", () => {
      const coords = getBaseCoordinates(defaultDimensions);

      expect(coords).toHaveProperty("1");
      expect(coords).toHaveProperty("2");
      expect(coords).toHaveProperty("3");
      expect(coords).toHaveProperty("4");
      expect(coords).toHaveProperty("5");
      expect(coords).toHaveProperty("6");

      // Check specific positions
      expect(coords[1]).toEqual({ x: 468, y: 295.2 }); // 600 * 0.78, 360 * 0.82
      expect(coords[3]).toEqual({ x: 300, y: 151.2 }); // 600 * 0.5, 360 * 0.42
    });

    it("scales with different court dimensions", () => {
      const smallDimensions: CourtDimensions = {
        width: 300,
        height: 180,
        aspectRatio: 300 / 180,
      };

      const coords = getBaseCoordinates(smallDimensions);

      expect(coords[1]).toEqual({ x: 234, y: 147.6 }); // 300 * 0.78, 180 * 0.82
      expect(coords[3]).toEqual({ x: 150, y: 75.6 }); // 300 * 0.5, 180 * 0.42
    });
  });

  describe("getServeReceiveCoordinates", () => {
    it("returns serve/receive formation positions", () => {
      const coords = getServeReceiveCoordinates(defaultDimensions);

      expect(coords).toHaveProperty("SR_right");
      expect(coords).toHaveProperty("SR_middle");
      expect(coords).toHaveProperty("SR_left");
      expect(coords).toHaveProperty("SR_frontRight");
      expect(coords).toHaveProperty("SR_frontLeft");

      // Check specific positions (using approximate matching for floating point)
      expect(coords.SR_right.x).toBeCloseTo(420, 1); // 600 * 0.7
      expect(coords.SR_right.y).toBeCloseTo(252, 1); // 360 * 0.7
      expect(coords.SR_middle.x).toBeCloseTo(300, 1); // 600 * 0.5
      expect(coords.SR_middle.y).toBeCloseTo(234, 1); // 360 * 0.65
    });
  });

  describe("getServeReceiveTargets", () => {
    it("assigns serve/receive positions to back-row players", () => {
      const rotationMap = {
        1: "Player1", // right-back
        2: "Player2",
        3: "Player3",
        4: "Player4",
        5: "Player5", // left-back
        6: "Player6", // middle-back
      };

      const targets = getServeReceiveTargets(rotationMap, defaultDimensions);

      expect(targets).toHaveProperty("Player1"); // Position 1 -> SR_right
      expect(targets).toHaveProperty("Player6"); // Position 6 -> SR_middle
      expect(targets).toHaveProperty("Player5"); // Position 5 -> SR_left

      expect(targets.Player1.x).toBeCloseTo(420, 1); // SR_right
      expect(targets.Player1.y).toBeCloseTo(252, 1);
      expect(targets.Player6.x).toBeCloseTo(300, 1); // SR_middle
      expect(targets.Player6.y).toBeCloseTo(234, 1);
      expect(targets.Player5.x).toBeCloseTo(180, 1); // SR_left
      expect(targets.Player5.y).toBeCloseTo(252, 1);
    });

    it("handles missing players gracefully", () => {
      const rotationMap = {
        1: "Player1",
        // Missing positions 5 and 6
      };

      const targets = getServeReceiveTargets(rotationMap, defaultDimensions);

      expect(targets).toHaveProperty("Player1");
      expect(Object.keys(targets)).toHaveLength(1);
    });
  });

  describe("getBaseAttackCoordinates", () => {
    it("applies role-specific adjustments", () => {
      const rotationMap = {
        1: "Setter",
        2: "OH1",
        3: "MB1",
        4: "OH2",
        5: "Opp",
        6: "MB2",
      };

      const players = [
        { id: "Setter", role: "S" },
        { id: "OH1", role: "OH" },
        { id: "MB1", role: "MB" },
        { id: "OH2", role: "OH" },
        { id: "Opp", role: "Opp" },
        { id: "MB2", role: "MB" },
      ];

      const coords = getBaseAttackCoordinates(
        rotationMap,
        players,
        defaultDimensions
      );

      // Check that OH players in positions 2 and 4 have x adjustments
      expect(coords.OH1.x).toBeGreaterThan(468); // Position 2 OH moved right
      expect(coords.OH2.x).toBeLessThan(132); // Position 4 OH moved left

      // Check that MB in position 3 has y adjustment
      expect(coords.MB1.y).toBeLessThan(151.2); // Position 3 MB moved forward

      // Check that setter in position 1 has y adjustment
      expect(coords.Setter.y).toBeLessThan(295.2); // Position 1 setter moved forward
    });

    it("handles unknown roles gracefully", () => {
      const rotationMap = { 1: "UnknownPlayer" };
      const players = [{ id: "UnknownPlayer", role: "Unknown" }];

      const coords = getBaseAttackCoordinates(
        rotationMap,
        players,
        defaultDimensions
      );

      // Should use base position without adjustments
      expect(coords.UnknownPlayer).toEqual({ x: 468, y: 295.2 });
    });
  });

  describe("getFormationCoordinates", () => {
    const rotationMap = { 1: "Player1", 2: "Player2" };
    const players = [
      { id: "Player1", role: "S" },
      { id: "Player2", role: "OH" },
    ];

    it("returns rotational coordinates", () => {
      const coords = getFormationCoordinates(
        "Player1",
        "rotational",
        rotationMap,
        players,
        defaultDimensions
      );

      expect(coords).toEqual({ x: 468, y: 295.2 }); // Base position 1
    });

    it("returns serve/receive coordinates", () => {
      const coords = getFormationCoordinates(
        "Player1",
        "serveReceive",
        rotationMap,
        players,
        defaultDimensions
      );

      expect(coords?.x).toBeCloseTo(420, 1); // SR_right for position 1
      expect(coords?.y).toBeCloseTo(252, 1);
    });

    it("returns base attack coordinates", () => {
      const coords = getFormationCoordinates(
        "Player1",
        "base",
        rotationMap,
        players,
        defaultDimensions
      );

      expect(coords?.y).toBeLessThan(295.2); // Setter adjustment applied
    });

    it("returns null for unknown player", () => {
      const coords = getFormationCoordinates(
        "UnknownPlayer",
        "rotational",
        rotationMap,
        players,
        defaultDimensions
      );

      expect(coords).toBeNull();
    });
  });

  describe("coordinate system conversion", () => {
    it("converts screen to volleyball coordinates", () => {
      const screenPos: PlayerPosition = { x: 300, y: 180 }; // Center of 600x360 court
      const vbCoords = screenToVolleyballCoordinates(
        screenPos,
        defaultDimensions
      );

      expect(vbCoords).toEqual({ x: 0, y: 0 }); // Center should be (0, 0)
    });

    it("converts volleyball to screen coordinates", () => {
      const vbPos = { x: 0, y: 0 }; // Center in volleyball coordinates
      const screenCoords = volleyballToScreenCoordinates(
        vbPos,
        defaultDimensions
      );

      expect(screenCoords).toEqual({ x: 300, y: 180 }); // Center of 600x360 court
    });

    it("handles coordinate system boundaries", () => {
      // Top-left corner
      const topLeft = screenToVolleyballCoordinates(
        { x: 0, y: 0 },
        defaultDimensions
      );
      expect(topLeft).toEqual({ x: -1, y: -1 });

      // Bottom-right corner
      const bottomRight = screenToVolleyballCoordinates(
        { x: 600, y: 360 },
        defaultDimensions
      );
      expect(bottomRight).toEqual({ x: 1, y: 1 });
    });
  });

  describe("position validation", () => {
    it("checks if position is in bounds", () => {
      const validPos: PlayerPosition = { x: 300, y: 180 };
      const invalidPos: PlayerPosition = { x: -10, y: 180 };

      expect(isPositionInBounds(validPos, defaultDimensions)).toBe(true);
      expect(isPositionInBounds(invalidPos, defaultDimensions)).toBe(false);
    });

    it("respects margin parameter", () => {
      const edgePos: PlayerPosition = { x: 10, y: 180 };

      expect(isPositionInBounds(edgePos, defaultDimensions, 5)).toBe(true);
      expect(isPositionInBounds(edgePos, defaultDimensions, 15)).toBe(false);
    });

    it("clamps position to bounds", () => {
      const outOfBoundsPos: PlayerPosition = { x: -10, y: 400, isCustom: true };
      const clampedPos = clampPositionToBounds(
        outOfBoundsPos,
        defaultDimensions
      );

      expect(clampedPos.x).toBe(20); // Margin
      expect(clampedPos.y).toBe(340); // 360 - 20 (margin)
      expect(clampedPos.isCustom).toBe(true); // Preserves properties
    });

    it("does not modify valid positions", () => {
      const validPos: PlayerPosition = { x: 300, y: 180 };
      const clampedPos = clampPositionToBounds(validPos, defaultDimensions);

      expect(clampedPos).toEqual(validPos);
    });
  });

  describe("constants", () => {
    it("has correct base dimensions", () => {
      expect(BASE_COURT_WIDTH).toBe(600);
      expect(BASE_COURT_HEIGHT).toBe(360);
      expect(COURT_ASPECT_RATIO).toBe(600 / 360);
    });

    it("maintains 5:3 aspect ratio", () => {
      expect(COURT_ASPECT_RATIO).toBeCloseTo(5 / 3, 5);
    });
  });
});
