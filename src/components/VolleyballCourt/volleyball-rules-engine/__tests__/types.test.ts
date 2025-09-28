/**
 * Tests for core data structures and type definitions
 */

import { describe, test, expect } from "vitest";
import {
  type PlayerState,
  type Role,
  type RotationSlot,
  type Violation,
  type OverlapResult,
  type PositionBounds,
  isValidRole,
  isValidRotationSlot,
  isValidPlayerState,
  isValidViolation,
  isValidOverlapResult,
  isValidPositionBounds,
  isValidPosition,
  isWithinCourtBounds,
  isInServiceZone,
  COORDINATE_SYSTEM,
  validateLineup,
  isValidLineup,
  createSlotMap,
} from "../index";

describe("Type Guards", () => {
  describe("isValidRole", () => {
    test("should validate correct roles", () => {
      const validRoles: Role[] = [
        "S",
        "OPP",
        "OH1",
        "OH2",
        "MB1",
        "MB2",
        "L",
        "DS",
        "Unknown",
      ];

      for (const role of validRoles) {
        expect(isValidRole(role)).toBe(true);
      }
    });

    test("should reject invalid roles", () => {
      expect(isValidRole("INVALID")).toBe(false);
      expect(isValidRole(123)).toBe(false);
      expect(isValidRole(null)).toBe(false);
      expect(isValidRole(undefined)).toBe(false);
    });
  });

  describe("isValidRotationSlot", () => {
    test("should validate slots 1-6", () => {
      for (let slot = 1; slot <= 6; slot++) {
        expect(isValidRotationSlot(slot)).toBe(true);
      }
    });

    test("should reject invalid slots", () => {
      expect(isValidRotationSlot(0)).toBe(false);
      expect(isValidRotationSlot(7)).toBe(false);
      expect(isValidRotationSlot(1.5)).toBe(false);
      expect(isValidRotationSlot("1")).toBe(false);
      expect(isValidRotationSlot(null)).toBe(false);
    });
  });

  describe("isValidPlayerState", () => {
    const validPlayer: PlayerState = {
      id: "player1",
      displayName: "John Doe",
      role: "S",
      slot: 1,
      x: 4.5,
      y: 8.0,
      isServer: true,
    };

    test("should validate correct player state", () => {
      expect(isValidPlayerState(validPlayer)).toBe(true);
    });

    test("should reject invalid player states", () => {
      expect(isValidPlayerState(null)).toBe(false);
      expect(isValidPlayerState({})).toBe(false);
      expect(isValidPlayerState({ ...validPlayer, id: 123 })).toBe(false);
      expect(isValidPlayerState({ ...validPlayer, role: "INVALID" })).toBe(
        false
      );
      expect(isValidPlayerState({ ...validPlayer, slot: 7 })).toBe(false);
    });
  });
});

describe("Coordinate System", () => {
  describe("isValidPosition", () => {
    test("should validate positions within court bounds", () => {
      expect(isValidPosition(4.5, 4.5)).toBe(true);
      expect(isValidPosition(0, 0)).toBe(true);
      expect(isValidPosition(9, 9)).toBe(true);
    });

    test("should reject positions outside court bounds", () => {
      expect(isValidPosition(-1, 4.5)).toBe(false);
      expect(isValidPosition(10, 4.5)).toBe(false);
      expect(isValidPosition(4.5, -1)).toBe(false);
      expect(isValidPosition(4.5, 12)).toBe(false);
    });

    test("should allow service zone when specified", () => {
      expect(isValidPosition(4.5, 10, true)).toBe(true);
      expect(isValidPosition(4.5, 11, true)).toBe(true);
      expect(isValidPosition(4.5, 10, false)).toBe(false);
    });
  });

  describe("isInServiceZone", () => {
    test("should identify service zone positions", () => {
      expect(isInServiceZone(4.5, 9.5)).toBe(true);
      expect(isInServiceZone(0, 10)).toBe(true);
      expect(isInServiceZone(9, 11)).toBe(true);
    });

    test("should reject non-service zone positions", () => {
      expect(isInServiceZone(4.5, 8.5)).toBe(false);
      expect(isInServiceZone(4.5, 11.5)).toBe(false);
      expect(isInServiceZone(-1, 10)).toBe(false);
    });
  });
});

describe("Validation Results", () => {
  describe("isValidViolation", () => {
    const validViolation: Violation = {
      code: "ROW_ORDER",
      slots: [2, 3],
      message: "RF must be right of MF",
    };

    test("should validate correct violation", () => {
      expect(isValidViolation(validViolation)).toBe(true);
    });

    test("should reject invalid violations", () => {
      expect(isValidViolation({ ...validViolation, code: "INVALID" })).toBe(
        false
      );
      expect(isValidViolation({ ...validViolation, slots: [7] })).toBe(false);
      expect(isValidViolation({ ...validViolation, message: 123 })).toBe(false);
    });
  });

  describe("isValidOverlapResult", () => {
    const validResult: OverlapResult = {
      isLegal: true,
      violations: [],
    };

    test("should validate correct overlap result", () => {
      expect(isValidOverlapResult(validResult)).toBe(true);
    });

    test("should validate result with violations", () => {
      const resultWithViolations: OverlapResult = {
        isLegal: false,
        violations: [
          {
            code: "ROW_ORDER",
            slots: [2, 3],
            message: "RF must be right of MF",
          },
        ],
      };
      expect(isValidOverlapResult(resultWithViolations)).toBe(true);
    });
  });
});

describe("Lineup Validation", () => {
  const createValidLineup = (): PlayerState[] => [
    {
      id: "1",
      displayName: "Player 1",
      role: "S",
      slot: 1,
      x: 7,
      y: 8,
      isServer: true,
    },
    {
      id: "2",
      displayName: "Player 2",
      role: "OPP",
      slot: 2,
      x: 8,
      y: 4,
      isServer: false,
    },
    {
      id: "3",
      displayName: "Player 3",
      role: "MB1",
      slot: 3,
      x: 4.5,
      y: 4,
      isServer: false,
    },
    {
      id: "4",
      displayName: "Player 4",
      role: "OH1",
      slot: 4,
      x: 1,
      y: 4,
      isServer: false,
    },
    {
      id: "5",
      displayName: "Player 5",
      role: "L",
      slot: 5,
      x: 2,
      y: 8,
      isServer: false,
    },
    {
      id: "6",
      displayName: "Player 6",
      role: "MB2",
      slot: 6,
      x: 4.5,
      y: 8,
      isServer: false,
    },
  ];

  test("should validate correct lineup", () => {
    const lineup = createValidLineup();
    expect(isValidLineup(lineup)).toBe(true);
    expect(validateLineup(lineup)).toHaveLength(0);
  });

  test("should reject lineup with wrong number of players", () => {
    const lineup = createValidLineup().slice(0, 5);
    expect(isValidLineup(lineup)).toBe(false);
    const errors = validateLineup(lineup);
    expect(errors.some((e) => e.code === "INVALID_PLAYER_COUNT")).toBe(true);
  });

  test("should reject lineup with duplicate slots", () => {
    const lineup = createValidLineup();
    lineup[1].slot = 1; // Duplicate slot 1
    expect(isValidLineup(lineup)).toBe(false);
    const errors = validateLineup(lineup);
    expect(errors.some((e) => e.code === "DUPLICATE_SLOT")).toBe(true);
  });

  test("should reject lineup with no server", () => {
    const lineup = createValidLineup();
    lineup[0].isServer = false; // Remove server
    expect(isValidLineup(lineup)).toBe(false);
    const errors = validateLineup(lineup);
    expect(errors.some((e) => e.code === "NO_SERVER")).toBe(true);
  });

  test("should reject lineup with multiple servers", () => {
    const lineup = createValidLineup();
    lineup[1].isServer = true; // Add second server
    expect(isValidLineup(lineup)).toBe(false);
    const errors = validateLineup(lineup);
    expect(errors.some((e) => e.code === "MULTIPLE_SERVERS")).toBe(true);
  });
});

describe("Utility Functions", () => {
  test("createSlotMap should create correct mapping", () => {
    const lineup: PlayerState[] = [
      {
        id: "1",
        displayName: "Player 1",
        role: "S",
        slot: 1,
        x: 7,
        y: 8,
        isServer: true,
      },
      {
        id: "2",
        displayName: "Player 2",
        role: "OPP",
        slot: 2,
        x: 8,
        y: 4,
        isServer: false,
      },
    ];

    const slotMap = createSlotMap(lineup);
    expect(slotMap.size).toBe(2);
    expect(slotMap.get(1)?.id).toBe("1");
    expect(slotMap.get(2)?.id).toBe("2");
  });
});

describe("Constants", () => {
  test("COORDINATE_SYSTEM should have correct values", () => {
    expect(COORDINATE_SYSTEM.COURT_WIDTH).toBe(9.0);
    expect(COORDINATE_SYSTEM.COURT_LENGTH).toBe(9.0);
    expect(COORDINATE_SYSTEM.TOLERANCE).toBe(0.03);
    expect(COORDINATE_SYSTEM.SERVICE_ZONE_END).toBe(11.0);
  });
});
