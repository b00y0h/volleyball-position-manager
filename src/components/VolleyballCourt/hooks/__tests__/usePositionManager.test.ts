import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { usePositionManager } from "../usePositionManager";
import { localStorageManager } from "../../utils/storage/LocalStorageManager";
import type { PlayerPosition, CustomPositionsState } from "../../types";

// Mock the LocalStorageManager
vi.mock("../../utils/storage/LocalStorageManager", () => ({
  localStorageManager: {
    load: vi.fn(),
    save: vi.fn(),
    saveImmediate: vi.fn(),
    clear: vi.fn(),
    hasStoredData: vi.fn(),
    getStorageInfo: vi.fn(),
  },
}));

// Mock the utility functions
vi.mock("../../utils/defaultPositions", () => ({
  getDefaultPositions: vi.fn((formation, rotation, system) => ({
    pos1: { x: 100, y: 100, isCustom: false, lastModified: new Date() },
    pos2: { x: 200, y: 100, isCustom: false, lastModified: new Date() },
    pos3: { x: 300, y: 100, isCustom: false, lastModified: new Date() },
  })),
  isPositionDefault: vi.fn((position, defaultPosition, tolerance = 5) => {
    const dx = Math.abs(position.x - defaultPosition.x);
    const dy = Math.abs(position.y - defaultPosition.y);
    return dx <= tolerance && dy <= tolerance && !position.isCustom;
  }),
  resetToDefault: vi.fn((formation, rotation, system, playerId) => ({
    x: 100,
    y: 100,
    isCustom: false,
    lastModified: new Date(),
  })),
}));

vi.mock("../../utils/positionValidation", () => ({
  validateFormationPosition: vi.fn(() => ({ isValid: true })),
  checkCollision: vi.fn(() => false),
  findNearestValidPosition: vi.fn((position) => position),
}));

describe("usePositionManager", () => {
  const mockStorageManager = localStorageManager as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageManager.load.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Initialization", () => {
    it("should initialize with empty positions when no stored data", async () => {
      mockStorageManager.load.mockReturnValue(null);

      const { result } = renderHook(() => usePositionManager());

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.positions).toEqual({
        "5-1": {},
        "6-2": {},
      });
      expect(result.current.error).toBe(null);
    });

    it("should load stored positions on initialization", async () => {
      const storedPositions = {
        "5-1": {
          0: {
            rotational: {
              pos1: {
                x: 150,
                y: 150,
                isCustom: true,
                lastModified: new Date(),
              },
            },
            serveReceive: {},
            base: {},
          },
        },
        "6-2": {},
      };

      mockStorageManager.load.mockReturnValue(storedPositions);

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.positions).toEqual(storedPositions);
    });

    it("should handle storage loading errors", async () => {
      mockStorageManager.load.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe("Storage error");
    });
  });

  describe("Position Getters", () => {
    it("should get default position when no custom position exists", async () => {
      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const position = result.current.getPosition(
        "5-1",
        0,
        "rotational",
        "pos1"
      );
      expect(position).toEqual({
        x: 100,
        y: 100,
        isCustom: false,
        lastModified: expect.any(Date),
      });
    });

    it("should get custom position when it exists", async () => {
      const customPosition: PlayerPosition = {
        x: 150,
        y: 150,
        isCustom: true,
        lastModified: new Date(),
      };

      const storedPositions = {
        "5-1": {
          0: {
            rotational: { pos1: customPosition },
            serveReceive: {},
            base: {},
          },
        },
        "6-2": {},
      };

      mockStorageManager.load.mockReturnValue(storedPositions);

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const position = result.current.getPosition(
        "5-1",
        0,
        "rotational",
        "pos1"
      );
      expect(position).toEqual(customPosition);
    });

    it("should get formation positions with defaults and customs merged", async () => {
      const customPosition: PlayerPosition = {
        x: 150,
        y: 150,
        isCustom: true,
        lastModified: new Date(),
      };

      const storedPositions = {
        "5-1": {
          0: {
            rotational: { pos1: customPosition },
            serveReceive: {},
            base: {},
          },
        },
        "6-2": {},
      };

      mockStorageManager.load.mockReturnValue(storedPositions);

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const positions = result.current.getFormationPositions(
        "5-1",
        0,
        "rotational"
      );
      expect(positions.pos1).toEqual(customPosition);
      expect(positions.pos2).toEqual({
        x: 200,
        y: 100,
        isCustom: false,
        lastModified: expect.any(Date),
      });
    });

    it("should get all positions for a rotation", async () => {
      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const allPositions = result.current.getAllPositions("5-1", 0);
      expect(allPositions).toHaveProperty("rotational");
      expect(allPositions).toHaveProperty("serveReceive");
      expect(allPositions).toHaveProperty("base");
    });
  });

  describe("Position Setters", () => {
    it("should set a custom position successfully", async () => {
      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      let success: boolean;
      act(() => {
        success = result.current.setPosition("5-1", 0, "rotational", "pos1", {
          x: 150,
          y: 150,
        });
      });

      expect(success!).toBe(true);
      expect(result.current.error).toBe(null);

      const position = result.current.getPosition(
        "5-1",
        0,
        "rotational",
        "pos1"
      );
      expect(position?.x).toBe(150);
      expect(position?.y).toBe(150);
      expect(position?.isCustom).toBe(true);
    });

    it("should handle position validation errors", async () => {
      const { validateFormationPosition } = await import(
        "@/utils/positionValidation"
      );
      (validateFormationPosition as any).mockReturnValue({
        isValid: false,
        reason: "Invalid position",
      });

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      let success: boolean;
      act(() => {
        success = result.current.setPosition("5-1", 0, "rotational", "pos1", {
          x: -10,
          y: -10,
        });
      });

      expect(success!).toBe(false);
      expect(result.current.error).toBe("Invalid position");
    });

    it("should handle collision detection", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      const {
        checkCollision,
        findNearestValidPosition,
        validateFormationPosition,
      } = await import("@/utils/positionValidation");
      (validateFormationPosition as any).mockReturnValue({ isValid: true });
      (checkCollision as any).mockReturnValue(true);
      (findNearestValidPosition as any).mockReturnValue({ x: 160, y: 160 });

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      let success: boolean;
      act(() => {
        success = result.current.setPosition("5-1", 0, "rotational", "pos1", {
          x: 150,
          y: 150,
        });
      });

      expect(success!).toBe(true);
      const position = result.current.getPosition(
        "5-1",
        0,
        "rotational",
        "pos1"
      );
      expect(position?.x).toBe(160);
      expect(position?.y).toBe(160);
    });

    it("should set formation positions", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      const { validateFormationPosition } = await import(
        "@/utils/positionValidation"
      );
      (validateFormationPosition as any).mockReturnValue({ isValid: true });

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const newPositions = {
        pos1: { x: 150, y: 150, isCustom: true, lastModified: new Date() },
        pos2: { x: 250, y: 150, isCustom: true, lastModified: new Date() },
      };

      let success: boolean;
      act(() => {
        success = result.current.setFormationPositions(
          "5-1",
          0,
          "rotational",
          newPositions
        );
      });

      expect(success!).toBe(true);
      const positions = result.current.getFormationPositions(
        "5-1",
        0,
        "rotational"
      );
      expect(positions.pos1).toEqual(newPositions.pos1);
      expect(positions.pos2).toEqual(newPositions.pos2);
    });
  });

  describe("Position Validation", () => {
    it("should validate positions correctly", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      const { validateFormationPosition, checkCollision } = await import(
        "@/utils/positionValidation"
      );
      (validateFormationPosition as any).mockReturnValue({ isValid: true });
      (checkCollision as any).mockReturnValue(false);

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const validation = result.current.validatePosition(
        "5-1",
        0,
        "rotational",
        "pos1",
        { x: 150, y: 150 }
      );

      expect(validation.isValid).toBe(true);
    });

    it("should detect collision in validation", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      const { checkCollision, validateFormationPosition } = await import(
        "@/utils/positionValidation"
      );
      (validateFormationPosition as any).mockReturnValue({ isValid: true });
      (checkCollision as any).mockReturnValue(true);

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const validation = result.current.validatePosition(
        "5-1",
        0,
        "rotational",
        "pos1",
        { x: 150, y: 150 }
      );

      expect(validation.isValid).toBe(false);
      expect(validation.reason).toBe(
        "Position would collide with another player"
      );
    });
  });

  describe("Customization Checks", () => {
    it("should detect customized positions", async () => {
      const customPosition: PlayerPosition = {
        x: 150,
        y: 150,
        isCustom: true,
        lastModified: new Date(),
      };

      const storedPositions = {
        "5-1": {
          0: {
            rotational: { pos1: customPosition },
            serveReceive: {},
            base: {},
          },
        },
        "6-2": {},
      };

      mockStorageManager.load.mockReturnValue(storedPositions);

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(
        result.current.isPositionCustomized("5-1", 0, "rotational", "pos1")
      ).toBe(true);
      expect(
        result.current.isPositionCustomized("5-1", 0, "rotational", "pos2")
      ).toBe(false);
    });

    it("should detect customized formations", async () => {
      const customPosition: PlayerPosition = {
        x: 150,
        y: 150,
        isCustom: true,
        lastModified: new Date(),
      };

      const storedPositions = {
        "5-1": {
          0: {
            rotational: { pos1: customPosition },
            serveReceive: {},
            base: {},
          },
        },
        "6-2": {},
      };

      mockStorageManager.load.mockReturnValue(storedPositions);

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isFormationCustomized("5-1", 0, "rotational")).toBe(
        true
      );
      expect(
        result.current.isFormationCustomized("5-1", 0, "serveReceive")
      ).toBe(false);
    });

    it("should detect customized rotations", async () => {
      const customPosition: PlayerPosition = {
        x: 150,
        y: 150,
        isCustom: true,
        lastModified: new Date(),
      };

      const storedPositions = {
        "5-1": {
          0: {
            rotational: { pos1: customPosition },
            serveReceive: {},
            base: {},
          },
        },
        "6-2": {},
      };

      mockStorageManager.load.mockReturnValue(storedPositions);

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isRotationCustomized("5-1", 0)).toBe(true);
      expect(result.current.isRotationCustomized("5-1", 1)).toBe(false);
    });

    it("should detect customized systems", async () => {
      const customPosition: PlayerPosition = {
        x: 150,
        y: 150,
        isCustom: true,
        lastModified: new Date(),
      };

      const storedPositions = {
        "5-1": {
          0: {
            rotational: { pos1: customPosition },
            serveReceive: {},
            base: {},
          },
        },
        "6-2": {},
      };

      mockStorageManager.load.mockReturnValue(storedPositions);

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isSystemCustomized("5-1")).toBe(true);
      expect(result.current.isSystemCustomized("6-2")).toBe(false);
    });
  });

  describe("Reset Operations", () => {
    it("should reset a specific position", async () => {
      const customPosition: PlayerPosition = {
        x: 150,
        y: 150,
        isCustom: true,
        lastModified: new Date(),
      };

      const storedPositions = {
        "5-1": {
          0: {
            rotational: { pos1: customPosition },
            serveReceive: {},
            base: {},
          },
        },
        "6-2": {},
      };

      mockStorageManager.load.mockReturnValue(storedPositions);

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(
        result.current.isPositionCustomized("5-1", 0, "rotational", "pos1")
      ).toBe(true);

      act(() => {
        result.current.resetPosition("5-1", 0, "rotational", "pos1");
      });

      expect(
        result.current.isPositionCustomized("5-1", 0, "rotational", "pos1")
      ).toBe(false);
    });

    it("should reset a formation", async () => {
      const customPosition: PlayerPosition = {
        x: 150,
        y: 150,
        isCustom: true,
        lastModified: new Date(),
      };

      const storedPositions = {
        "5-1": {
          0: {
            rotational: { pos1: customPosition },
            serveReceive: {},
            base: {},
          },
        },
        "6-2": {},
      };

      mockStorageManager.load.mockReturnValue(storedPositions);

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isFormationCustomized("5-1", 0, "rotational")).toBe(
        true
      );

      act(() => {
        result.current.resetFormation("5-1", 0, "rotational");
      });

      expect(result.current.isFormationCustomized("5-1", 0, "rotational")).toBe(
        false
      );
    });

    it("should reset a rotation", async () => {
      const customPosition: PlayerPosition = {
        x: 150,
        y: 150,
        isCustom: true,
        lastModified: new Date(),
      };

      const storedPositions = {
        "5-1": {
          0: {
            rotational: { pos1: customPosition },
            serveReceive: {},
            base: {},
          },
        },
        "6-2": {},
      };

      mockStorageManager.load.mockReturnValue(storedPositions);

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isRotationCustomized("5-1", 0)).toBe(true);

      act(() => {
        result.current.resetRotation("5-1", 0);
      });

      expect(result.current.isRotationCustomized("5-1", 0)).toBe(false);
    });

    it("should reset a system", async () => {
      const customPosition: PlayerPosition = {
        x: 150,
        y: 150,
        isCustom: true,
        lastModified: new Date(),
      };

      const storedPositions = {
        "5-1": {
          0: {
            rotational: { pos1: customPosition },
            serveReceive: {},
            base: {},
          },
        },
        "6-2": {},
      };

      mockStorageManager.load.mockReturnValue(storedPositions);

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isSystemCustomized("5-1")).toBe(true);

      act(() => {
        result.current.resetSystem("5-1");
      });

      expect(result.current.isSystemCustomized("5-1")).toBe(false);
    });

    it("should reset all positions", async () => {
      const customPosition: PlayerPosition = {
        x: 150,
        y: 150,
        isCustom: true,
        lastModified: new Date(),
      };

      const storedPositions = {
        "5-1": {
          0: {
            rotational: { pos1: customPosition },
            serveReceive: {},
            base: {},
          },
        },
        "6-2": {
          0: {
            rotational: { pos1: customPosition },
            serveReceive: {},
            base: {},
          },
        },
      };

      mockStorageManager.load.mockReturnValue(storedPositions);

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isSystemCustomized("5-1")).toBe(true);
      expect(result.current.isSystemCustomized("6-2")).toBe(true);

      act(() => {
        result.current.resetAll();
      });

      expect(result.current.isSystemCustomized("5-1")).toBe(false);
      expect(result.current.isSystemCustomized("6-2")).toBe(false);
    });
  });

  describe("Utility Methods", () => {
    it("should clear error state", async () => {
      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Set an error by attempting invalid position
      const { validateFormationPosition } = await import(
        "@/utils/positionValidation"
      );
      (validateFormationPosition as any).mockReturnValue({
        isValid: false,
        reason: "Test error",
      });

      act(() => {
        result.current.setPosition("5-1", 0, "rotational", "pos1", {
          x: -10,
          y: -10,
        });
      });

      expect(result.current.error).toBe("Test error");

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    it("should save immediately", async () => {
      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.saveImmediate();
      });

      expect(mockStorageManager.saveImmediate).toHaveBeenCalledWith(
        result.current.positions
      );
    });
  });

  describe("Auto-save functionality", () => {
    it("should auto-save when positions change", async () => {
      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.setPosition("5-1", 0, "rotational", "pos1", {
          x: 150,
          y: 150,
        });
      });

      // Wait for auto-save effect
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockStorageManager.save).toHaveBeenCalled();
    });

    it("should not auto-save when loading or in error state", async () => {
      mockStorageManager.load.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const { result } = renderHook(() => usePositionManager());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBeTruthy();
      expect(mockStorageManager.save).not.toHaveBeenCalled();
    });
  });
});
