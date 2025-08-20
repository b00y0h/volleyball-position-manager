/**
 * Tests for StateConverter integration utilities
 */

import { StateConverter } from "../StateConverter";
import { PlayerPosition } from "@/types/positioning";
import { RotationSlot } from "../../types/PlayerState";

describe("StateConverter", () => {
  describe("coordinate conversion", () => {
    it("should convert screen coordinates to volleyball coordinates", () => {
      const screenState = {
        id: "1",
        displayName: "Player 1",
        role: "setter",
        x: 300, // Middle of 600px width
        y: 180, // Middle of 360px height
        isCustom: true,
        lastModified: new Date(),
      };

      const vbState = StateConverter.toVolleyballState(screenState, 1, false);

      expect(vbState.x).toBeCloseTo(4.5, 1); // Middle of 9m court
      expect(vbState.y).toBeCloseTo(4.5, 1); // Middle of 9m court
      expect(vbState.role).toBe("S"); // Mapped from "setter"
      expect(vbState.slot).toBe(1);
      expect(vbState.isServer).toBe(false);
    });

    it("should convert volleyball coordinates to screen coordinates", () => {
      const vbState = {
        id: "1",
        displayName: "Player 1",
        role: "S" as const,
        slot: 1 as RotationSlot,
        x: 4.5, // Middle of 9m court
        y: 4.5, // Middle of 9m court
        isServer: false,
      };

      const screenState = StateConverter.toScreenState(vbState);

      expect(screenState.x).toBeCloseTo(300, 1); // Middle of 600px width
      expect(screenState.y).toBeCloseTo(180, 1); // Middle of 360px height
      expect(screenState.role).toBe("S");
    });

    it("should handle PlayerPosition conversion", () => {
      const position: PlayerPosition = {
        x: 150,
        y: 90,
        isCustom: true,
        lastModified: new Date(),
      };

      const vbCoords = StateConverter.playerPositionToVolleyball(position);
      expect(vbCoords.x).toBeCloseTo(2.25, 1);
      expect(vbCoords.y).toBeCloseTo(2.25, 1);

      const backToPosition =
        StateConverter.volleyballToPlayerPosition(vbCoords);
      expect(backToPosition.x).toBeCloseTo(150, 1);
      expect(backToPosition.y).toBeCloseTo(90, 1);
    });
  });

  describe("formation conversion", () => {
    it("should convert formation positions to volleyball states", () => {
      const positions: Record<string, PlayerPosition> = {
        "1": { x: 500, y: 300, isCustom: true, lastModified: new Date() },
        "2": { x: 500, y: 100, isCustom: true, lastModified: new Date() },
        "3": { x: 300, y: 100, isCustom: true, lastModified: new Date() },
        "4": { x: 100, y: 100, isCustom: true, lastModified: new Date() },
        "5": { x: 100, y: 300, isCustom: true, lastModified: new Date() },
        "6": { x: 300, y: 300, isCustom: true, lastModified: new Date() },
      };

      const rotationMap = {
        1: "1",
        2: "2",
        3: "3",
        4: "4",
        5: "5",
        6: "6",
      };

      const states = StateConverter.formationToVolleyballStates(
        positions,
        rotationMap,
        1
      );

      expect(states).toHaveLength(6);
      expect(states[0].slot).toBe(1);
      expect(states[0].isServer).toBe(true); // Server slot
      expect(states[1].isServer).toBe(false);
    });

    it("should convert volleyball states back to formation positions", () => {
      const states = [
        {
          id: "1",
          displayName: "Player 1",
          role: "S" as const,
          slot: 1 as RotationSlot,
          x: 7.5,
          y: 7.5,
          isServer: true,
        },
        {
          id: "2",
          displayName: "Player 2",
          role: "OPP" as const,
          slot: 2 as RotationSlot,
          x: 7.5,
          y: 2.5,
          isServer: false,
        },
      ];

      const positions = StateConverter.volleyballStatesToFormation(states);

      expect(positions["1"]).toBeDefined();
      expect(positions["2"]).toBeDefined();
      expect(positions["1"].x).toBeCloseTo(500, 1);
      expect(positions["1"].y).toBeCloseTo(300, 1);
    });
  });

  describe("role mapping", () => {
    it("should map string roles to volleyball roles", () => {
      const testCases = [
        { input: "setter", expected: "S" },
        { input: "opposite", expected: "OPP" },
        { input: "outside-hitter", expected: "OH1" },
        { input: "middle-blocker", expected: "MB1" },
        { input: "libero", expected: "L" },
        { input: "unknown-role", expected: "Unknown" },
      ];

      testCases.forEach(({ input, expected }) => {
        const screenState = {
          id: "1",
          displayName: "Player 1",
          role: input,
          x: 300,
          y: 180,
          isCustom: true,
          lastModified: new Date(),
        };

        const vbState = StateConverter.toVolleyballState(screenState, 1, false);
        expect(vbState.role).toBe(expected);
      });
    });
  });

  describe("coordinate validation", () => {
    it("should validate screen coordinates", () => {
      expect(StateConverter.isValidCoordinates({ x: 300, y: 180 }, false)).toBe(
        true
      );
      expect(StateConverter.isValidCoordinates({ x: -10, y: 180 }, false)).toBe(
        false
      );
      expect(StateConverter.isValidCoordinates({ x: 700, y: 180 }, false)).toBe(
        false
      );
    });

    it("should validate volleyball coordinates", () => {
      expect(StateConverter.isValidCoordinates({ x: 4.5, y: 4.5 }, true)).toBe(
        true
      );
      expect(StateConverter.isValidCoordinates({ x: -1, y: 4.5 }, true)).toBe(
        false
      );
      expect(
        StateConverter.isValidCoordinates({ x: 4.5, y: 10 }, true, false)
      ).toBe(false);
      expect(
        StateConverter.isValidCoordinates({ x: 4.5, y: 10 }, true, true)
      ).toBe(true); // Service zone
    });

    it("should normalize coordinates", () => {
      const screenNormalized = StateConverter.normalizeCoordinates(
        { x: -10, y: 400 },
        false
      );
      expect(screenNormalized.x).toBe(0);
      expect(screenNormalized.y).toBe(360);

      const vbNormalized = StateConverter.normalizeCoordinates(
        { x: -1, y: 12 },
        true,
        true
      );
      expect(vbNormalized.x).toBe(0);
      expect(vbNormalized.y).toBe(11); // Service zone end
    });
  });

  describe("utility functions", () => {
    it("should create rotation map from states", () => {
      const states = [
        {
          id: "player1",
          displayName: "Player 1",
          role: "S" as const,
          slot: 1 as RotationSlot,
          x: 4.5,
          y: 4.5,
          isServer: true,
        },
        {
          id: "player2",
          displayName: "Player 2",
          role: "OPP" as const,
          slot: 2 as RotationSlot,
          x: 4.5,
          y: 2.5,
          isServer: false,
        },
      ];

      const rotationMap = StateConverter.createRotationMap(states);
      expect(rotationMap[1]).toBe("player1");
      expect(rotationMap[2]).toBe("player2");
    });

    it("should find server slot", () => {
      const states = [
        {
          id: "player1",
          displayName: "Player 1",
          role: "S" as const,
          slot: 1 as RotationSlot,
          x: 4.5,
          y: 4.5,
          isServer: false,
        },
        {
          id: "player2",
          displayName: "Player 2",
          role: "OPP" as const,
          slot: 3 as RotationSlot,
          x: 4.5,
          y: 2.5,
          isServer: true,
        },
      ];

      const serverSlot = StateConverter.findServerSlot(states);
      expect(serverSlot).toBe(3);
    });

    it("should return default server slot when no server found", () => {
      const states = [
        {
          id: "player1",
          displayName: "Player 1",
          role: "S" as const,
          slot: 1 as RotationSlot,
          x: 4.5,
          y: 4.5,
          isServer: false,
        },
      ];

      const serverSlot = StateConverter.findServerSlot(states);
      expect(serverSlot).toBe(1);
    });
  });

  describe("coordinate system info", () => {
    it("should provide coordinate system information", () => {
      const info = StateConverter.getCoordinateSystemInfo();

      expect(info.volleyball.width).toBe(9);
      expect(info.volleyball.height).toBe(9);
      expect(info.screen.width).toBe(600);
      expect(info.screen.height).toBe(360);
      expect(info.scalingFactors).toBeDefined();
    });
  });
});
