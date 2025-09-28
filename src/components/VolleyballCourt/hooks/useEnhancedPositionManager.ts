import { useState, useCallback, useEffect, useMemo } from "react";
import {
  PlayerPosition,
  FormationType,
  SystemType,
  CustomPositionsState,
  FormationPositions,
} from "../types";
import { usePositionManager, PositionManager } from "./usePositionManager";
import { OverlapValidator } from "../volleyball-rules-engine/validation/OverlapValidator";
import { ConstraintCalculator } from "../volleyball-rules-engine/validation/ConstraintCalculator";
import { StateConverter } from "../volleyball-rules-engine/utils/StateConverter";
import { RotationSlot } from "../volleyball-rules-engine/types/PlayerState";
import { OverlapResult } from "../volleyball-rules-engine/types/ValidationResult";
import { PositionBounds } from "../volleyball-rules-engine/types/ValidationResult";

export interface VolleyballValidationResult {
  isValid: boolean;
  violations: string[];
  detailedResult?: OverlapResult;
}

export interface DragConstraints {
  bounds?: PositionBounds;
  isValid: (x: number, y: number) => boolean;
  snapToValid: (x: number, y: number) => { x: number; y: number };
}

export interface EnhancedPositionManagerActions {
  // Volleyball rules validation
  validateCurrentFormation: (
    system: SystemType,
    rotation: number,
    formation: FormationType,
    rotationMap?: Record<number, string>
  ) => VolleyballValidationResult;

  // Real-time constraint calculation
  getConstraintsForPlayer: (
    system: SystemType,
    rotation: number,
    formation: FormationType,
    playerId: string,
    rotationMap?: Record<number, string>,
    serverSlot?: RotationSlot
  ) => DragConstraints;

  // Enhanced position validation
  validatePositionWithRules: (
    system: SystemType,
    rotation: number,
    formation: FormationType,
    playerId: string,
    position: { x: number; y: number },
    rotationMap?: Record<number, string>,
    courtWidth?: number,
    courtHeight?: number
  ) => { isValid: boolean; reason?: string; volleyballViolations?: string[] };

  // Position setting with volleyball rules
  setPositionWithValidation: (
    system: SystemType,
    rotation: number,
    formation: FormationType,
    playerId: string,
    position: { x: number; y: number },
    rotationMap?: Record<number, string>,
    enforceRules?: boolean
  ) => { success: boolean; violations?: string[] };

  // Batch operations with validation
  setFormationPositionsWithValidation: (
    system: SystemType,
    rotation: number,
    formation: FormationType,
    positions: Record<string, PlayerPosition>,
    rotationMap?: Record<number, string>,
    enforceRules?: boolean
  ) => { success: boolean; violations?: string[] };

  // Utility methods
  isVolleyballRulesEnabled: () => boolean;
  setVolleyballRulesEnabled: (enabled: boolean) => void;
  getVolleyballValidationSummary: (
    system: SystemType,
    rotation: number,
    formation: FormationType,
    rotationMap?: Record<number, string>
  ) => {
    totalViolations: number;
    violationsByType: Record<string, number>;
    affectedPlayers: string[];
  };
}

export type EnhancedPositionManager = PositionManager &
  EnhancedPositionManagerActions;

/**
 * Enhanced position manager with volleyball rules integration
 */
export function useEnhancedPositionManager(): EnhancedPositionManager {
  const baseManager = usePositionManager();
  const [volleyballRulesEnabled, setVolleyballRulesEnabledState] =
    useState(true);

  // Validate current formation using volleyball rules
  const validateCurrentFormation = useCallback(
    (
      system: SystemType,
      rotation: number,
      formation: FormationType,
      rotationMap?: Record<number, string>
    ): VolleyballValidationResult => {
      if (
        !volleyballRulesEnabled ||
        !rotationMap ||
        formation === "rotational"
      ) {
        return { isValid: true, violations: [] };
      }

      try {
        // Get current positions
        const positions = baseManager.getFormationPositions(
          system,
          rotation,
          formation
        );

        // Convert to volleyball states
        const serverSlot: RotationSlot = 1; // Default server slot
        const volleyballStates = StateConverter.formationToVolleyballStates(
          positions,
          rotationMap,
          serverSlot
        );

        // Validate using overlap validator
        const result = OverlapValidator.checkOverlap(volleyballStates);

        return {
          isValid: result.isLegal,
          violations: result.violations.map((v) => v.message),
          detailedResult: result,
        };
      } catch (error) {
        console.warn(
          "Error validating formation with volleyball rules:",
          error
        );
        return { isValid: true, violations: [] };
      }
    },
    [volleyballRulesEnabled, baseManager]
  );

  // Get constraints for a specific player
  const getConstraintsForPlayer = useCallback(
    (
      system: SystemType,
      rotation: number,
      formation: FormationType,
      playerId: string,
      rotationMap?: Record<number, string>,
      serverSlot: RotationSlot = 1
    ): DragConstraints => {
      const defaultConstraints: DragConstraints = {
        isValid: () => true,
        snapToValid: (x, y) => ({ x, y }),
      };

      if (
        !volleyballRulesEnabled ||
        !rotationMap ||
        formation === "rotational"
      ) {
        return defaultConstraints;
      }

      try {
        // Get player's rotation slot
        const slotEntry = Object.entries(rotationMap).find(
          ([, id]) => id === playerId
        );
        if (!slotEntry) {
          return defaultConstraints;
        }

        const playerSlot = parseInt(slotEntry[0]) as RotationSlot;
        const isServer = playerSlot === serverSlot;

        // Get current positions
        const positions = baseManager.getFormationPositions(
          system,
          rotation,
          formation
        );

        // Convert to volleyball states
        const volleyballStates = StateConverter.formationToVolleyballStates(
          positions,
          rotationMap,
          serverSlot
        );

        // Create position map by slot
        const positionMap = new Map();
        volleyballStates.forEach((state) => {
          positionMap.set(state.slot, state);
        });

        // Calculate constraints
        const bounds = ConstraintCalculator.calculateValidBounds(
          playerSlot,
          positionMap,
          isServer
        );

        return {
          bounds: bounds.isConstrained ? bounds : undefined,
          isValid: (x, y) => {
            // Convert screen coordinates to volleyball coordinates
            const vbCoords = StateConverter.playerPositionToVolleyball({
              x,
              y,
              isCustom: true,
              lastModified: new Date(),
            });
            return ConstraintCalculator.isPositionValid(
              playerSlot,
              vbCoords,
              positionMap,
              isServer
            );
          },
          snapToValid: (x, y) => {
            // Convert to volleyball coordinates
            const vbCoords = StateConverter.playerPositionToVolleyball({
              x,
              y,
              isCustom: true,
              lastModified: new Date(),
            });
            const snappedVb = ConstraintCalculator.snapToValidPosition(
              playerSlot,
              vbCoords,
              positionMap,
              isServer
            );
            // Convert back to screen coordinates
            const screenPos =
              StateConverter.volleyballToPlayerPosition(snappedVb);
            return { x: screenPos.x, y: screenPos.y };
          },
        };
      } catch (error) {
        console.warn("Error calculating constraints for player:", error);
        return defaultConstraints;
      }
    },
    [volleyballRulesEnabled, baseManager]
  );

  // Enhanced position validation with volleyball rules
  const validatePositionWithRules = useCallback(
    (
      system: SystemType,
      rotation: number,
      formation: FormationType,
      playerId: string,
      position: { x: number; y: number },
      rotationMap?: Record<number, string>,
      courtWidth?: number,
      courtHeight?: number
    ): {
      isValid: boolean;
      reason?: string;
      volleyballViolations?: string[];
    } => {
      // First validate with base manager
      const baseValidation = baseManager.validatePosition(
        system,
        rotation,
        formation,
        playerId,
        position,
        courtWidth,
        courtHeight
      );

      if (!baseValidation.isValid) {
        return baseValidation;
      }

      // Then validate with volleyball rules if enabled
      if (
        !volleyballRulesEnabled ||
        !rotationMap ||
        formation === "rotational"
      ) {
        return baseValidation;
      }

      try {
        // Get current positions and update with new position
        const currentPositions = baseManager.getFormationPositions(
          system,
          rotation,
          formation
        );
        const updatedPositions = {
          ...currentPositions,
          [playerId]: {
            x: position.x,
            y: position.y,
            isCustom: true,
            lastModified: new Date(),
          },
        };

        // Convert to volleyball states
        const serverSlot: RotationSlot = 1;
        const volleyballStates = StateConverter.formationToVolleyballStates(
          updatedPositions,
          rotationMap,
          serverSlot
        );

        // Validate using overlap validator
        const result = OverlapValidator.checkOverlap(volleyballStates);

        if (!result.isLegal) {
          return {
            isValid: false,
            reason: "Volleyball rule violations",
            volleyballViolations: result.violations.map((v) => v.message),
          };
        }

        return { isValid: true };
      } catch (error) {
        console.warn("Error validating position with volleyball rules:", error);
        return baseValidation;
      }
    },
    [volleyballRulesEnabled, baseManager]
  );

  // Set position with volleyball rules validation
  const setPositionWithValidation = useCallback(
    (
      system: SystemType,
      rotation: number,
      formation: FormationType,
      playerId: string,
      position: { x: number; y: number },
      rotationMap?: Record<number, string>,
      enforceRules: boolean = true
    ): { success: boolean; violations?: string[] } => {
      if (enforceRules && volleyballRulesEnabled) {
        const validation = validatePositionWithRules(
          system,
          rotation,
          formation,
          playerId,
          position,
          rotationMap
        );

        if (!validation.isValid) {
          return {
            success: false,
            violations: validation.volleyballViolations || [
              validation.reason || "Invalid position",
            ],
          };
        }
      }

      const success = baseManager.setPosition(
        system,
        rotation,
        formation,
        playerId,
        position
      );

      return { success };
    },
    [volleyballRulesEnabled, validatePositionWithRules, baseManager]
  );

  // Set formation positions with volleyball rules validation
  const setFormationPositionsWithValidation = useCallback(
    (
      system: SystemType,
      rotation: number,
      formation: FormationType,
      positions: Record<string, PlayerPosition>,
      rotationMap?: Record<number, string>,
      enforceRules: boolean = true
    ): { success: boolean; violations?: string[] } => {
      if (
        enforceRules &&
        volleyballRulesEnabled &&
        rotationMap &&
        formation !== "rotational"
      ) {
        try {
          // Convert to volleyball states
          const serverSlot: RotationSlot = 1;
          const volleyballStates = StateConverter.formationToVolleyballStates(
            positions,
            rotationMap,
            serverSlot
          );

          // Validate using overlap validator
          const result = OverlapValidator.checkOverlap(volleyballStates);

          if (!result.isLegal) {
            return {
              success: false,
              violations: result.violations.map((v) => v.message),
            };
          }
        } catch (error) {
          console.warn("Error validating formation positions:", error);
        }
      }

      const success = baseManager.setFormationPositions(
        system,
        rotation,
        formation,
        positions
      );

      return { success };
    },
    [volleyballRulesEnabled, baseManager]
  );

  // Get volleyball validation summary
  const getVolleyballValidationSummary = useCallback(
    (
      system: SystemType,
      rotation: number,
      formation: FormationType,
      rotationMap?: Record<number, string>
    ) => {
      const validation = validateCurrentFormation(
        system,
        rotation,
        formation,
        rotationMap
      );

      const violationsByType: Record<string, number> = {};
      const affectedPlayers: Set<string> = new Set();

      if (validation.detailedResult) {
        validation.detailedResult.violations.forEach((violation) => {
          violationsByType[violation.code] =
            (violationsByType[violation.code] || 0) + 1;
          violation.slots.forEach((slot) => {
            if (rotationMap) {
              const playerId = rotationMap[slot];
              if (playerId) {
                affectedPlayers.add(playerId);
              }
            }
          });
        });
      }

      return {
        totalViolations: validation.violations.length,
        violationsByType,
        affectedPlayers: Array.from(affectedPlayers),
      };
    },
    [validateCurrentFormation]
  );

  // Volleyball rules control
  const isVolleyballRulesEnabled = useCallback(
    () => volleyballRulesEnabled,
    [volleyballRulesEnabled]
  );
  const setVolleyballRulesEnabled = useCallback((enabled: boolean) => {
    setVolleyballRulesEnabledState(enabled);
  }, []);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // Base manager properties and methods
      ...baseManager,

      // Enhanced volleyball rules methods
      validateCurrentFormation,
      getConstraintsForPlayer,
      validatePositionWithRules,
      setPositionWithValidation,
      setFormationPositionsWithValidation,
      isVolleyballRulesEnabled,
      setVolleyballRulesEnabled,
      getVolleyballValidationSummary,
    }),
    [
      baseManager,
      validateCurrentFormation,
      getConstraintsForPlayer,
      validatePositionWithRules,
      setPositionWithValidation,
      setFormationPositionsWithValidation,
      isVolleyballRulesEnabled,
      setVolleyballRulesEnabled,
      getVolleyballValidationSummary,
    ]
  );
}
