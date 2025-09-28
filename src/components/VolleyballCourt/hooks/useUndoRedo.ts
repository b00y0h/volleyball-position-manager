import { useState, useCallback, useRef } from 'react';

export interface UndoRedoAction<T> {
  id: string;
  timestamp: number;
  description: string;
  previousState: T;
  newState: T;
  type: 'reset' | 'position' | 'formation' | 'system';
}

interface UndoRedoState<T> {
  history: UndoRedoAction<T>[];
  currentIndex: number;
  maxHistorySize: number;
}

interface UseUndoRedoReturn<T> {
  // State
  canUndo: boolean;
  canRedo: boolean;
  currentAction: UndoRedoAction<T> | null;
  historySize: number;
  
  // Actions
  pushAction: (action: Omit<UndoRedoAction<T>, 'id' | 'timestamp'>) => void;
  undo: () => UndoRedoAction<T> | null;
  redo: () => UndoRedoAction<T> | null;
  clear: () => void;
  getHistory: () => UndoRedoAction<T>[];
  
  // Batch operations
  startBatch: (description: string) => void;
  endBatch: () => void;
  discardBatch: () => void;
}

export function useUndoRedo<T>(
  maxHistorySize: number = 50,
  onUndo?: (action: UndoRedoAction<T>) => void,
  onRedo?: (action: UndoRedoAction<T>) => void
): UseUndoRedoReturn<T> {
  const [state, setState] = useState<UndoRedoState<T>>({
    history: [],
    currentIndex: -1,
    maxHistorySize,
  });
  
  const batchRef = useRef<{
    isActive: boolean;
    description: string;
    actions: Omit<UndoRedoAction<T>, 'id' | 'timestamp'>[];
    initialState: T | null;
  }>({
    isActive: false,
    description: '',
    actions: [],
    initialState: null,
  });

  const generateId = useCallback(() => {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const pushAction = useCallback((action: Omit<UndoRedoAction<T>, 'id' | 'timestamp'>) => {
    const batch = batchRef.current;
    
    if (batch.isActive) {
      // Store action in batch instead of immediately adding to history
      batch.actions.push(action);
      if (batch.initialState === null) {
        batch.initialState = action.previousState;
      }
      return;
    }

    setState(prev => {
      const newAction: UndoRedoAction<T> = {
        ...action,
        id: generateId(),
        timestamp: Date.now(),
      };

      // Remove any actions after current index (when redoing after undo)
      const newHistory = prev.history.slice(0, prev.currentIndex + 1);
      
      // Add new action
      newHistory.push(newAction);
      
      // Trim history if it exceeds max size
      if (newHistory.length > prev.maxHistorySize) {
        newHistory.shift();
        return {
          ...prev,
          history: newHistory,
          currentIndex: newHistory.length - 1,
        };
      }
      
      return {
        ...prev,
        history: newHistory,
        currentIndex: newHistory.length - 1,
      };
    });
  }, [generateId]);

  const undo = useCallback(() => {
    let actionToUndo: UndoRedoAction<T> | null = null;
    
    setState(prev => {
      if (prev.currentIndex < 0) return prev;
      
      actionToUndo = prev.history[prev.currentIndex];
      
      return {
        ...prev,
        currentIndex: prev.currentIndex - 1,
      };
    });
    
    if (actionToUndo && onUndo) {
      onUndo(actionToUndo);
    }
    
    return actionToUndo;
  }, [onUndo]);

  const redo = useCallback(() => {
    let actionToRedo: UndoRedoAction<T> | null = null;
    
    setState(prev => {
      if (prev.currentIndex >= prev.history.length - 1) return prev;
      
      const nextIndex = prev.currentIndex + 1;
      actionToRedo = prev.history[nextIndex];
      
      return {
        ...prev,
        currentIndex: nextIndex,
      };
    });
    
    if (actionToRedo && onRedo) {
      onRedo(actionToRedo);
    }
    
    return actionToRedo;
  }, [onRedo]);

  const clear = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: [],
      currentIndex: -1,
    }));
    batchRef.current = {
      isActive: false,
      description: '',
      actions: [],
      initialState: null,
    };
  }, []);

  const getHistory = useCallback(() => {
    return [...state.history];
  }, [state.history]);

  const startBatch = useCallback((description: string) => {
    batchRef.current = {
      isActive: true,
      description,
      actions: [],
      initialState: null,
    };
  }, []);

  const endBatch = useCallback(() => {
    const batch = batchRef.current;
    
    if (!batch.isActive || batch.actions.length === 0) {
      batchRef.current.isActive = false;
      return;
    }

    // Create a single compound action from all batched actions
    const lastAction = batch.actions[batch.actions.length - 1];
    const compoundAction: Omit<UndoRedoAction<T>, 'id' | 'timestamp'> = {
      description: batch.description,
      previousState: batch.initialState || batch.actions[0].previousState,
      newState: lastAction.newState,
      type: 'reset', // Batch operations are typically resets
    };

    // Reset batch state
    batchRef.current = {
      isActive: false,
      description: '',
      actions: [],
      initialState: null,
    };

    // Push the compound action
    pushAction(compoundAction);
  }, [pushAction]);

  const discardBatch = useCallback(() => {
    batchRef.current = {
      isActive: false,
      description: '',
      actions: [],
      initialState: null,
    };
  }, []);

  return {
    // State
    canUndo: state.currentIndex >= 0,
    canRedo: state.currentIndex < state.history.length - 1,
    currentAction: state.currentIndex >= 0 ? state.history[state.currentIndex] : null,
    historySize: state.history.length,
    
    // Actions
    pushAction,
    undo,
    redo,
    clear,
    getHistory,
    
    // Batch operations
    startBatch,
    endBatch,
    discardBatch,
  };
}