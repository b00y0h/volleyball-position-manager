import { useCallback, useMemo } from 'react';
import { usePositionManager } from './usePositionManager';
import { useUndoRedo, UndoRedoAction } from './useUndoRedo';
import { SystemType, FormationType, CustomPositionsState } from '@/types';

interface ResetCapabilities {
  currentRotation: boolean;
  allRotations: boolean;  
  currentFormation: boolean;
  system: boolean;
}

interface ResetResult {
  success: boolean;
  affectedPositions: number;
  error?: string;
}

interface EnhancedPositionManagerActions {
  // Enhanced reset operations with undo support
  resetCurrentRotation: (
    system: SystemType,
    rotation: number,
    formation: FormationType
  ) => Promise<ResetResult>;
  
  resetAllRotations: (
    system: SystemType,
    formation: FormationType
  ) => Promise<ResetResult>;
  
  resetSelectedFormation: (
    system: SystemType,
    formation: FormationType
  ) => Promise<ResetResult>;
  
  resetEntireSystem: (
    system: SystemType
  ) => Promise<ResetResult>;
  
  // Undo/Redo operations
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
  canUndo: boolean;
  canRedo: boolean;
  
  // Reset capability detection
  getResetCapabilities: (
    system: SystemType,
    rotation: number,
    formation: FormationType
  ) => ResetCapabilities;
  
  // Batch operations for complex resets
  startResetBatch: (description: string) => void;
  endResetBatch: () => void;
  discardResetBatch: () => void;
  
  // Preview affected positions
  getAffectedPositions: (
    operation: 'current' | 'all' | 'formation' | 'system',
    system: SystemType,
    rotation?: number,
    formation?: FormationType
  ) => string[];
}

type EnhancedPositionManager = ReturnType<typeof usePositionManager> & EnhancedPositionManagerActions;

export function useEnhancedPositionManager(): EnhancedPositionManager {
  const positionManager = usePositionManager();
  
  const {
    pushAction,
    undo: undoAction,
    redo: redoAction,
    canUndo,
    canRedo,
    startBatch,
    endBatch,
    discardBatch,
  } = useUndoRedo<{ '5-1': CustomPositionsState; '6-2': CustomPositionsState }>(
    50, // Max 50 undo operations
    // onUndo callback
    (action) => {
      // For now, we'll handle this by restoring the entire position state
      // In a more sophisticated implementation, we could store more specific action data
      console.log('Undo action:', action.description);
    },
    // onRedo callback
    (action) => {
      // For now, we'll handle this by restoring the entire position state
      // In a more sophisticated implementation, we could store more specific action data
      console.log('Redo action:', action.description);
    }
  );

  const createStateSnapshot = useCallback(() => {
    return positionManager.positions;
  }, [positionManager.positions]);

  const countCustomizedPositions = useCallback((
    system: SystemType,
    rotation?: number,
    formation?: FormationType
  ): number => {
    let count = 0;
    const systemPositions = positionManager.positions[system] || {};
    
    if (rotation !== undefined && formation !== undefined) {
      // Count for specific rotation and formation
      const rotationData = systemPositions[rotation];
      if (rotationData && rotationData[formation]) {
        count = Object.keys(rotationData[formation]).length;
      }
    } else if (formation !== undefined) {
      // Count for specific formation across all rotations
      for (let r = 0; r < 6; r++) {
        const rotationData = systemPositions[r];
        if (rotationData && rotationData[formation]) {
          count += Object.keys(rotationData[formation]).length;
        }
      }
    } else {
      // Count for entire system
      Object.values(systemPositions).forEach(rotationData => {
        if (rotationData) {
          Object.values(rotationData).forEach(formationData => {
            if (formationData) {
              count += Object.keys(formationData).length;
            }
          });
        }
      });
    }
    
    return count;
  }, [positionManager.positions]);

  const resetCurrentRotation = useCallback(async (
    system: SystemType,
    rotation: number,
    formation: FormationType
  ): Promise<ResetResult> => {
    try {
      const beforeState = createStateSnapshot();
      const affectedPositions = countCustomizedPositions(system, rotation, formation);
      
      if (affectedPositions === 0) {
        return {
          success: true,
          affectedPositions: 0,
        };
      }

      // Perform the reset
      positionManager.resetFormation(system, rotation, formation);
      positionManager.saveImmediate();
      
      const afterState = createStateSnapshot();
      
      // Record the action for undo
      pushAction({
        description: `Reset ${formation} formation for rotation ${rotation + 1}`,
        previousState: beforeState,
        newState: afterState,
        type: 'reset',
      });

      return {
        success: true,
        affectedPositions,
      };
    } catch (error) {
      return {
        success: false,
        affectedPositions: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }, [positionManager, createStateSnapshot, countCustomizedPositions, pushAction]);

  const resetAllRotations = useCallback(async (
    system: SystemType,
    formation: FormationType
  ): Promise<ResetResult> => {
    try {
      const beforeState = createStateSnapshot();
      const affectedPositions = countCustomizedPositions(system, undefined, formation);
      
      if (affectedPositions === 0) {
        return {
          success: true,
          affectedPositions: 0,
        };
      }

      startBatch(`Reset all rotations in ${formation} formation`);
      
      // Reset all 6 rotations for this formation
      for (let rotation = 0; rotation < 6; rotation++) {
        positionManager.resetFormation(system, rotation, formation);
      }
      
      positionManager.saveImmediate();
      const afterState = createStateSnapshot();
      
      // Record batch action
      pushAction({
        description: `Reset all rotations in ${formation} formation`,
        previousState: beforeState,
        newState: afterState,
        type: 'reset',
      });
      
      endBatch();

      return {
        success: true,
        affectedPositions,
      };
    } catch (error) {
      discardBatch();
      return {
        success: false,
        affectedPositions: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }, [positionManager, createStateSnapshot, countCustomizedPositions, pushAction, startBatch, endBatch, discardBatch]);

  const resetSelectedFormation = useCallback(async (
    system: SystemType,
    formation: FormationType
  ): Promise<ResetResult> => {
    try {
      const beforeState = createStateSnapshot();
      const affectedPositions = countCustomizedPositions(system, undefined, formation);
      
      if (affectedPositions === 0) {
        return {
          success: true,
          affectedPositions: 0,
        };
      }

      startBatch(`Reset entire ${formation} formation`);
      
      // Reset the formation across all rotations
      for (let rotation = 0; rotation < 6; rotation++) {
        positionManager.resetFormation(system, rotation, formation);
      }
      
      positionManager.saveImmediate();
      const afterState = createStateSnapshot();
      
      // Record batch action
      pushAction({
        description: `Reset entire ${formation} formation`,
        previousState: beforeState,
        newState: afterState,
        type: 'reset',
      });
      
      endBatch();

      return {
        success: true,
        affectedPositions,
      };
    } catch (error) {
      discardBatch();
      return {
        success: false,
        affectedPositions: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }, [positionManager, createStateSnapshot, countCustomizedPositions, pushAction, startBatch, endBatch, discardBatch]);

  const resetEntireSystem = useCallback(async (
    system: SystemType
  ): Promise<ResetResult> => {
    try {
      const beforeState = createStateSnapshot();
      const affectedPositions = countCustomizedPositions(system);
      
      if (affectedPositions === 0) {
        return {
          success: true,
          affectedPositions: 0,
        };
      }

      // Perform the reset
      positionManager.resetSystem(system);
      positionManager.saveImmediate();
      
      const afterState = createStateSnapshot();
      
      // Record the action for undo
      pushAction({
        description: `Reset entire ${system} system`,
        previousState: beforeState,
        newState: afterState,
        type: 'system',
      });

      return {
        success: true,
        affectedPositions,
      };
    } catch (error) {
      return {
        success: false,
        affectedPositions: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }, [positionManager, createStateSnapshot, countCustomizedPositions, pushAction]);

  const undo = useCallback(async (): Promise<boolean> => {
    const action = undoAction();
    if (action) {
      positionManager.saveImmediate();
      return true;
    }
    return false;
  }, [undoAction, positionManager]);

  const redo = useCallback(async (): Promise<boolean> => {
    const action = redoAction();
    if (action) {
      positionManager.saveImmediate();
      return true;
    }
    return false;
  }, [redoAction, positionManager]);

  const getResetCapabilities = useCallback((
    system: SystemType,
    rotation: number,
    formation: FormationType
  ): ResetCapabilities => {
    return {
      currentRotation: positionManager.isFormationCustomized(system, rotation, formation),
      allRotations: positionManager.isSystemCustomized(system), // Simplified check
      currentFormation: positionManager.isSystemCustomized(system), // Will be refined
      system: positionManager.isSystemCustomized(system),
    };
  }, [positionManager]);

  const getAffectedPositions = useCallback((
    operation: 'current' | 'all' | 'formation' | 'system',
    system: SystemType,
    rotation?: number,
    formation?: FormationType
  ): string[] => {
    const affected: string[] = [];
    const systemPositions = positionManager.positions[system] || {};
    
    switch (operation) {
      case 'current':
        if (rotation !== undefined && formation !== undefined) {
          const rotationData = systemPositions[rotation];
          if (rotationData && rotationData[formation]) {
            affected.push(...Object.keys(rotationData[formation]));
          }
        }
        break;
        
      case 'all':
        if (formation !== undefined) {
          for (let r = 0; r < 6; r++) {
            const rotationData = systemPositions[r];
            if (rotationData && rotationData[formation]) {
              Object.keys(rotationData[formation]).forEach(playerId => {
                if (!affected.includes(playerId)) {
                  affected.push(playerId);
                }
              });
            }
          }
        }
        break;
        
      case 'formation':
        if (formation !== undefined) {
          for (let r = 0; r < 6; r++) {
            const rotationData = systemPositions[r];
            if (rotationData && rotationData[formation]) {
              Object.keys(rotationData[formation]).forEach(playerId => {
                if (!affected.includes(`R${r + 1}-${playerId}`)) {
                  affected.push(`R${r + 1}-${playerId}`);
                }
              });
            }
          }
        }
        break;
        
      case 'system':
        Object.entries(systemPositions).forEach(([rotationStr, rotationData]) => {
          if (rotationData) {
            Object.entries(rotationData).forEach(([formationType, formationData]) => {
              if (formationData) {
                Object.keys(formationData).forEach(playerId => {
                  const key = `${formationType}-R${parseInt(rotationStr) + 1}-${playerId}`;
                  if (!affected.includes(key)) {
                    affected.push(key);
                  }
                });
              }
            });
          }
        });
        break;
    }
    
    return affected.sort();
  }, [positionManager.positions]);

  return useMemo(() => ({
    // Original position manager functionality
    ...positionManager,
    
    // Enhanced reset operations
    resetCurrentRotation,
    resetAllRotations,
    resetSelectedFormation,
    resetEntireSystem,
    
    // Undo/Redo functionality
    undo,
    redo,
    canUndo,
    canRedo,
    
    // Reset capability detection
    getResetCapabilities,
    
    // Batch operations
    startResetBatch: startBatch,
    endResetBatch: endBatch,
    discardResetBatch: discardBatch,
    
    // Preview functionality
    getAffectedPositions,
  }), [
    positionManager,
    resetCurrentRotation,
    resetAllRotations,
    resetSelectedFormation,
    resetEntireSystem,
    undo,
    redo,
    canUndo,
    canRedo,
    getResetCapabilities,
    startBatch,
    endBatch,
    discardBatch,
    getAffectedPositions,
  ]);
}

export type { EnhancedPositionManager, ResetCapabilities, ResetResult };