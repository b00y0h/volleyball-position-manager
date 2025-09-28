import { useState, useCallback, useEffect, useMemo } from "react";
import {
  PlayerPosition,
  FormationType,
  SystemType,
  CustomPositionsState,
  FormationPositions,
} from "../types";
import {
  getDefaultPositions,
  isPositionDefault,
  resetToDefault,
} from "../utils/defaultPositions";
import {
  validateFormationPosition,
  checkCollision,
  findNearestValidPosition,
} from "../utils/positionValidation";
import { localStorageManager } from "../utils/storage/LocalStorageManager";

export interface PositionManagerState {
  positions: {
    "5-1": CustomPositionsState;
    "6-2": CustomPositionsState;
  };
  isLoading: boolean;
  error: string | null;
}

export interface PositionManagerActions {
  // Position getters
  getPosition: (
    system: SystemType,
    rotation: number,
    formation: FormationType,
    playerId: string
  ) => PlayerPosition | null;
  getFormationPositions: (
    system: SystemType,
    rotation: number,
    formation: FormationType
  ) => Record<string, PlayerPosition>;
  getAllPositions: (system: SystemType, rotation: number, formation?: FormationType) => FormationPositions | Record<string, PlayerPosition>;

  // Position setters
  setPosition: (
    system: SystemType,
    rotation: number,
    formation: FormationType,
    playerId: string,
    position: { x: number; y: number }
  ) => boolean;
  setFormationPositions: (
    system: SystemType,
    rotation: number,
    formation: FormationType,
    positions: Record<string, PlayerPosition>
  ) => boolean;

  // Position validation
  validatePosition: (
    system: SystemType,
    rotation: number,
    formation: FormationType,
    playerId: string,
    position: { x: number; y: number },
    courtWidth?: number,
    courtHeight?: number
  ) => { isValid: boolean; reason?: string };

  // Customization checks
  isPositionCustomized: (
    system: SystemType,
    rotation: number,
    formation: FormationType,
    playerId: string
  ) => boolean;
  isFormationCustomized: (
    system: SystemType,
    rotation: number,
    formation: FormationType
  ) => boolean;
  isRotationCustomized: (system: SystemType, rotation: number) => boolean;
  isSystemCustomized: (system: SystemType) => boolean;

  // Reset operations
  resetPosition: (
    system: SystemType,
    rotation: number,
    formation: FormationType,
    playerId: string
  ) => void;
  resetFormation: (
    system: SystemType,
    rotation: number,
    formation: FormationType
  ) => void;
  resetRotation: (system: SystemType, rotation: number) => void;
  resetSystem: (system: SystemType) => void;
  resetAll: () => void;

  // Utility methods
  clearError: () => void;
  saveImmediate: () => void;
}

export type PositionManager = PositionManagerState & PositionManagerActions;

/**
 * Custom hook for centralized position state management
 */
export function usePositionManager(): PositionManager {
  const [state, setState] = useState<PositionManagerState>({
    positions: {
      "5-1": {},
      "6-2": {},
    },
    isLoading: true,
    error: null,
  });

  // Initialize positions from storage on mount
  useEffect(() => {
    const loadStoredPositions = async () => {
      try {
        const stored = localStorageManager.load();
        if (stored) {
          setState((prev) => ({
            ...prev,
            positions: stored,
            isLoading: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to load positions",
          isLoading: false,
        }));
      }
    };

    loadStoredPositions();
  }, []);

  // Auto-save positions when they change
  useEffect(() => {
    if (!state.isLoading && !state.error) {
      localStorageManager.save(state.positions);
    }
  }, [state.positions, state.isLoading, state.error]);

  // Helper function to ensure rotation exists in state
  const ensureRotationExists = useCallback(
    (system: SystemType, rotation: number): void => {
      setState((prev) => {
        if (!prev.positions[system][rotation]) {
          return {
            ...prev,
            positions: {
              ...prev.positions,
              [system]: {
                ...prev.positions[system],
                [rotation]: {
                  rotational: {},
                  serveReceive: {},
                  base: {},
                },
              },
            },
          };
        }
        return prev;
      });
    },
    []
  );

  // Get a specific player position
  const getPosition = useCallback(
    (
      system: SystemType,
      rotation: number,
      formation: FormationType,
      playerId: string
    ): PlayerPosition | null => {
      const rotationData = state.positions[system][rotation];
      if (!rotationData) {
        // Return default position if no custom data exists
        const defaultPositions = getDefaultPositions(
          formation,
          rotation,
          system
        );
        return defaultPositions[playerId] || null;
      }

      const customPosition = rotationData[formation][playerId];
      if (customPosition) {
        return customPosition;
      }

      // Return default position if no custom position exists
      const defaultPositions = getDefaultPositions(formation, rotation, system);
      return defaultPositions[playerId] || null;
    },
    [state.positions]
  );

  // Get all positions for a formation
  const getFormationPositions = useCallback(
    (
      system: SystemType,
      rotation: number,
      formation: FormationType
    ): Record<string, PlayerPosition> => {
      const defaultPositions = getDefaultPositions(formation, rotation, system);
      const rotationData = state.positions[system][rotation];

      if (!rotationData) {
        return defaultPositions;
      }

      const customPositions = rotationData[formation];

      // Merge default positions with custom positions
      return {
        ...defaultPositions,
        ...customPositions,
      };
    },
    [state.positions]
  );

  // Get all positions for a rotation (all formations) or specific formation
  const getAllPositions = useCallback(
    (system: SystemType, rotation: number, formation?: FormationType): FormationPositions | Record<string, PlayerPosition> => {
      if (formation) {
        return getFormationPositions(system, rotation, formation);
      }
      return {
        rotational: getFormationPositions(system, rotation, "rotational"),
        serveReceive: getFormationPositions(system, rotation, "serveReceive"),
        base: getFormationPositions(system, rotation, "base"),
      };
    },
    [getFormationPositions]
  );

  // Set a specific player position
  const setPosition = useCallback(
    (
      system: SystemType,
      rotation: number,
      formation: FormationType,
      playerId: string,
      position: { x: number; y: number }
    ): boolean => {
      try {
        // Get current formation positions for collision detection
        const currentPositions = getFormationPositions(
          system,
          rotation,
          formation
        );

        // Validate the new position
        const validation = validateFormationPosition(
          position,
          playerId,
          formation,
          rotation
        );

        if (!validation.isValid) {
          setState((prev) => ({
            ...prev,
            error: validation.reason || "Invalid position",
          }));
          return false;
        }

        // Check for collisions with other players
        if (checkCollision(position, currentPositions, playerId)) {
          // Find nearest valid position
          const validPosition = findNearestValidPosition(
            position,
            currentPositions,
            playerId
          );
          position = validPosition;
        }

        // Ensure rotation exists in state
        ensureRotationExists(system, rotation);

        // Create new position object
        const newPosition: PlayerPosition = {
          x: position.x,
          y: position.y,
          isCustom: true,
          lastModified: new Date(),
        };

        // Update state
        setState((prev) => ({
          ...prev,
          positions: {
            ...prev.positions,
            [system]: {
              ...prev.positions[system],
              [rotation]: {
                ...prev.positions[system][rotation],
                [formation]: {
                  ...prev.positions[system][rotation]?.[formation],
                  [playerId]: newPosition,
                },
              },
            },
          },
          error: null,
        }));

        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to set position",
        }));
        return false;
      }
    },
    [getFormationPositions, ensureRotationExists]
  );

  // Set all positions for a formation
  const setFormationPositions = useCallback(
    (
      system: SystemType,
      rotation: number,
      formation: FormationType,
      positions: Record<string, PlayerPosition>
    ): boolean => {
      try {
        // Validate all positions
        for (const [playerId, position] of Object.entries(positions)) {
          const validation = validateFormationPosition(
            position,
            playerId,
            formation,
            rotation
          );

          if (!validation.isValid) {
            setState((prev) => ({
              ...prev,
              error: `Invalid position for ${playerId}: ${validation.reason}`,
            }));
            return false;
          }
        }

        // Ensure rotation exists in state
        ensureRotationExists(system, rotation);

        // Update state
        setState((prev) => ({
          ...prev,
          positions: {
            ...prev.positions,
            [system]: {
              ...prev.positions[system],
              [rotation]: {
                ...prev.positions[system][rotation],
                [formation]: positions,
              },
            },
          },
          error: null,
        }));

        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to set formation positions",
        }));
        return false;
      }
    },
    [ensureRotationExists]
  );

  // Validate a position
  const validatePosition = useCallback(
    (
      system: SystemType,
      rotation: number,
      formation: FormationType,
      playerId: string,
      position: { x: number; y: number },
      courtWidth?: number,
      courtHeight?: number
    ): { isValid: boolean; reason?: string } => {
      // Basic formation validation
      const formationValidation = validateFormationPosition(
        position,
        playerId,
        formation,
        rotation,
        courtWidth,
        courtHeight
      );

      if (!formationValidation.isValid) {
        return formationValidation;
      }

      // Check for collisions
      const currentPositions = getFormationPositions(
        system,
        rotation,
        formation
      );
      if (checkCollision(position, currentPositions, playerId)) {
        return {
          isValid: false,
          reason: "Position would collide with another player",
        };
      }

      return { isValid: true };
    },
    [getFormationPositions]
  );

  // Check if a specific position is customized
  const isPositionCustomized = useCallback(
    (
      system: SystemType,
      rotation: number,
      formation: FormationType,
      playerId: string
    ): boolean => {
      const position = getPosition(system, rotation, formation, playerId);
      if (!position) return false;

      // Check if position is marked as custom
      if (position.isCustom) return true;

      // Double-check against default position
      const defaultPositions = getDefaultPositions(formation, rotation, system);
      const defaultPosition = defaultPositions[playerId];

      if (!defaultPosition) return true; // If no default exists, consider it custom

      return !isPositionDefault(position, defaultPosition);
    },
    [getPosition]
  );

  // Check if a formation has any customized positions
  const isFormationCustomized = useCallback(
    (
      system: SystemType,
      rotation: number,
      formation: FormationType
    ): boolean => {
      const defaultPositions = getDefaultPositions(formation, rotation, system);

      for (const playerId of Object.keys(defaultPositions)) {
        if (isPositionCustomized(system, rotation, formation, playerId)) {
          return true;
        }
      }

      return false;
    },
    [isPositionCustomized]
  );

  // Check if a rotation has any customized positions
  const isRotationCustomized = useCallback(
    (system: SystemType, rotation: number): boolean => {
      const formations: FormationType[] = [
        "rotational",
        "serveReceive",
        "base",
      ];
      return formations.some((formation) =>
        isFormationCustomized(system, rotation, formation)
      );
    },
    [isFormationCustomized]
  );

  // Check if a system has any customized positions
  const isSystemCustomized = useCallback(
    (system: SystemType): boolean => {
      const systemData = state.positions[system];
      if (!systemData || Object.keys(systemData).length === 0) {
        return false;
      }

      for (const rotation of Object.keys(systemData)) {
        if (isRotationCustomized(system, parseInt(rotation))) {
          return true;
        }
      }

      return false;
    },
    [state.positions, isRotationCustomized]
  );

  // Reset a specific position to default
  const resetPosition = useCallback(
    (
      system: SystemType,
      rotation: number,
      formation: FormationType,
      playerId: string
    ): void => {
      resetToDefault(formation, rotation, system, playerId);

      setState((prev) => {
        const newState = { ...prev };

        // Remove the custom position (will fall back to default)
        if (newState.positions[system][rotation]?.[formation]?.[playerId]) {
          const newFormationPositions = {
            ...newState.positions[system][rotation][formation],
          };
          delete newFormationPositions[playerId];

          newState.positions = {
            ...newState.positions,
            [system]: {
              ...newState.positions[system],
              [rotation]: {
                ...newState.positions[system][rotation],
                [formation]: newFormationPositions,
              },
            },
          };
        }

        return newState;
      });
    },
    []
  );

  // Reset all positions in a formation to default
  const resetFormation = useCallback(
    (system: SystemType, rotation: number, formation: FormationType): void => {
      setState((prev) => {
        if (!prev.positions[system][rotation]) {
          return prev;
        }

        return {
          ...prev,
          positions: {
            ...prev.positions,
            [system]: {
              ...prev.positions[system],
              [rotation]: {
                ...prev.positions[system][rotation],
                [formation]: {},
              },
            },
          },
        };
      });
    },
    []
  );

  // Reset all positions in a rotation to default
  const resetRotation = useCallback(
    (system: SystemType, rotation: number): void => {
      setState((prev) => ({
        ...prev,
        positions: {
          ...prev.positions,
          [system]: {
            ...prev.positions[system],
            [rotation]: {
              rotational: {},
              serveReceive: {},
              base: {},
            },
          },
        },
      }));
    },
    []
  );

  // Reset all positions in a system to default
  const resetSystem = useCallback((system: SystemType): void => {
    setState((prev) => ({
      ...prev,
      positions: {
        ...prev.positions,
        [system]: {},
      },
    }));
  }, []);

  // Reset all positions to default
  const resetAll = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      positions: {
        "5-1": {},
        "6-2": {},
      },
    }));
  }, []);

  // Clear error state
  const clearError = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Save immediately (bypass debouncing)
  const saveImmediate = useCallback((): void => {
    if (!state.isLoading && !state.error) {
      localStorageManager.saveImmediate(state.positions);
    }
  }, [state.positions, state.isLoading, state.error]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // State
      positions: state.positions,
      isLoading: state.isLoading,
      error: state.error,

      // Position getters
      getPosition,
      getFormationPositions,
      getAllPositions,

      // Position setters
      setPosition,
      setFormationPositions,

      // Position validation
      validatePosition,

      // Customization checks
      isPositionCustomized,
      isFormationCustomized,
      isRotationCustomized,
      isSystemCustomized,

      // Reset operations
      resetPosition,
      resetFormation,
      resetRotation,
      resetSystem,
      resetAll,

      // Utility methods
      clearError,
      saveImmediate,
    }),
    [
      state,
      getPosition,
      getFormationPositions,
      getAllPositions,
      setPosition,
      setFormationPositions,
      validatePosition,
      isPositionCustomized,
      isFormationCustomized,
      isRotationCustomized,
      isSystemCustomized,
      resetPosition,
      resetFormation,
      resetRotation,
      resetSystem,
      resetAll,
      clearError,
      saveImmediate,
    ]
  );
}
