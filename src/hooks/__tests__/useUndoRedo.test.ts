import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUndoRedo, UndoRedoAction } from '../useUndoRedo';

interface TestState {
  value: number;
  text: string;
}

describe('useUndoRedo', () => {
  let mockOnUndo: ReturnType<typeof vi.fn>;
  let mockOnRedo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUndo = vi.fn();
    mockOnRedo = vi.fn();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useUndoRedo<TestState>());
    
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.currentAction).toBeNull();
    expect(result.current.historySize).toBe(0);
  });

  it('should add actions to history', () => {
    const { result } = renderHook(() => useUndoRedo<TestState>());
    
    const action = {
      description: 'Test action',
      previousState: { value: 0, text: 'initial' },
      newState: { value: 1, text: 'updated' },
      type: 'test' as const,
    };

    act(() => {
      result.current.pushAction(action);
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.historySize).toBe(1);
    expect(result.current.currentAction?.description).toBe('Test action');
  });

  it('should perform undo operations', () => {
    const { result } = renderHook(() => useUndoRedo<TestState>(50, mockOnUndo, mockOnRedo));
    
    const action = {
      description: 'Test action',
      previousState: { value: 0, text: 'initial' },
      newState: { value: 1, text: 'updated' },
      type: 'test' as const,
    };

    act(() => {
      result.current.pushAction(action);
    });

    expect(result.current.canUndo).toBe(true);

    let undoneAction: UndoRedoAction<TestState> | null = null;
    act(() => {
      undoneAction = result.current.undo();
    });

    expect(undoneAction).not.toBeNull();
    expect(undoneAction?.description).toBe('Test action');
    expect(mockOnUndo).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Test action',
      previousState: { value: 0, text: 'initial' },
      newState: { value: 1, text: 'updated' },
    }));
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('should perform redo operations', () => {
    const { result } = renderHook(() => useUndoRedo<TestState>(50, mockOnUndo, mockOnRedo));
    
    const action = {
      description: 'Test action',
      previousState: { value: 0, text: 'initial' },
      newState: { value: 1, text: 'updated' },
      type: 'test' as const,
    };

    act(() => {
      result.current.pushAction(action);
      result.current.undo();
    });

    expect(result.current.canRedo).toBe(true);

    let redoneAction: UndoRedoAction<TestState> | null = null;
    act(() => {
      redoneAction = result.current.redo();
    });

    expect(redoneAction).not.toBeNull();
    expect(redoneAction?.description).toBe('Test action');
    expect(mockOnRedo).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Test action',
      previousState: { value: 0, text: 'initial' },
      newState: { value: 1, text: 'updated' },
    }));
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should handle multiple actions', () => {
    const { result } = renderHook(() => useUndoRedo<TestState>());
    
    const actions = [
      {
        description: 'Action 1',
        previousState: { value: 0, text: 'initial' },
        newState: { value: 1, text: 'step1' },
        type: 'test' as const,
      },
      {
        description: 'Action 2',
        previousState: { value: 1, text: 'step1' },
        newState: { value: 2, text: 'step2' },
        type: 'test' as const,
      },
      {
        description: 'Action 3',
        previousState: { value: 2, text: 'step2' },
        newState: { value: 3, text: 'step3' },
        type: 'test' as const,
      },
    ];

    act(() => {
      actions.forEach(action => result.current.pushAction(action));
    });

    expect(result.current.historySize).toBe(3);
    expect(result.current.currentAction?.description).toBe('Action 3');

    // Undo twice
    act(() => {
      result.current.undo();
      result.current.undo();
    });

    expect(result.current.currentAction?.description).toBe('Action 1');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);
  });

  it('should clear history when new action is added after undo', () => {
    const { result } = renderHook(() => useUndoRedo<TestState>());
    
    const actions = [
      {
        description: 'Action 1',
        previousState: { value: 0, text: 'initial' },
        newState: { value: 1, text: 'step1' },
        type: 'test' as const,
      },
      {
        description: 'Action 2',
        previousState: { value: 1, text: 'step1' },
        newState: { value: 2, text: 'step2' },
        type: 'test' as const,
      },
    ];

    act(() => {
      actions.forEach(action => result.current.pushAction(action));
      result.current.undo(); // Undo Action 2
    });

    expect(result.current.canRedo).toBe(true);
    expect(result.current.historySize).toBe(2);

    // Add new action after undo
    const newAction = {
      description: 'New Action',
      previousState: { value: 1, text: 'step1' },
      newState: { value: 10, text: 'newStep' },
      type: 'test' as const,
    };

    act(() => {
      result.current.pushAction(newAction);
    });

    expect(result.current.canRedo).toBe(false);
    expect(result.current.historySize).toBe(2);
    expect(result.current.currentAction?.description).toBe('New Action');
  });

  it('should respect max history size', () => {
    const maxSize = 3;
    const { result } = renderHook(() => useUndoRedo<TestState>(maxSize));
    
    const actions = Array.from({ length: 5 }, (_, i) => ({
      description: `Action ${i + 1}`,
      previousState: { value: i, text: `step${i}` },
      newState: { value: i + 1, text: `step${i + 1}` },
      type: 'test' as const,
    }));

    act(() => {
      actions.forEach(action => result.current.pushAction(action));
    });

    expect(result.current.historySize).toBe(maxSize);
    expect(result.current.currentAction?.description).toBe('Action 5');

    // Should only be able to undo 3 times
    act(() => {
      result.current.undo();
      result.current.undo();
      result.current.undo();
    });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.currentAction?.description).toBe('Action 3');
  });

  it('should handle batch operations', () => {
    const { result } = renderHook(() => useUndoRedo<TestState>());
    
    act(() => {
      result.current.startBatch('Batch operation');
    });

    const batchActions = [
      {
        description: 'Batch Action 1',
        previousState: { value: 0, text: 'initial' },
        newState: { value: 1, text: 'batch1' },
        type: 'test' as const,
      },
      {
        description: 'Batch Action 2',
        previousState: { value: 1, text: 'batch1' },
        newState: { value: 2, text: 'batch2' },
        type: 'test' as const,
      },
    ];

    act(() => {
      batchActions.forEach(action => result.current.pushAction(action));
    });

    // No actions should be in history yet
    expect(result.current.historySize).toBe(0);

    act(() => {
      result.current.endBatch();
    });

    // Should have one compound action
    expect(result.current.historySize).toBe(1);
    expect(result.current.currentAction?.description).toBe('Batch operation');
    expect(result.current.currentAction?.previousState).toEqual({ value: 0, text: 'initial' });
    expect(result.current.currentAction?.newState).toEqual({ value: 2, text: 'batch2' });
  });

  it('should discard batch operations', () => {
    const { result } = renderHook(() => useUndoRedo<TestState>());
    
    act(() => {
      result.current.startBatch('Discarded batch');
    });

    const batchAction = {
      description: 'Batch Action',
      previousState: { value: 0, text: 'initial' },
      newState: { value: 1, text: 'batch' },
      type: 'test' as const,
    };

    act(() => {
      result.current.pushAction(batchAction);
    });

    expect(result.current.historySize).toBe(0);

    act(() => {
      result.current.discardBatch();
    });

    expect(result.current.historySize).toBe(0);
    expect(result.current.canUndo).toBe(false);
  });

  it('should clear all history', () => {
    const { result } = renderHook(() => useUndoRedo<TestState>());
    
    const actions = [
      {
        description: 'Action 1',
        previousState: { value: 0, text: 'initial' },
        newState: { value: 1, text: 'step1' },
        type: 'test' as const,
      },
      {
        description: 'Action 2',
        previousState: { value: 1, text: 'step1' },
        newState: { value: 2, text: 'step2' },
        type: 'test' as const,
      },
    ];

    act(() => {
      actions.forEach(action => result.current.pushAction(action));
    });

    expect(result.current.historySize).toBe(2);

    act(() => {
      result.current.clear();
    });

    expect(result.current.historySize).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.currentAction).toBeNull();
  });

  it('should return history', () => {
    const { result } = renderHook(() => useUndoRedo<TestState>());
    
    const actions = [
      {
        description: 'Action 1',
        previousState: { value: 0, text: 'initial' },
        newState: { value: 1, text: 'step1' },
        type: 'test' as const,
      },
      {
        description: 'Action 2',
        previousState: { value: 1, text: 'step1' },
        newState: { value: 2, text: 'step2' },
        type: 'test' as const,
      },
    ];

    act(() => {
      actions.forEach(action => result.current.pushAction(action));
    });

    const history = result.current.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].description).toBe('Action 1');
    expect(history[1].description).toBe('Action 2');
    expect(history[0]).toHaveProperty('id');
    expect(history[0]).toHaveProperty('timestamp');
  });

  it('should handle edge cases', () => {
    const { result } = renderHook(() => useUndoRedo<TestState>());
    
    // Try to undo when no actions
    let undoResult: UndoRedoAction<TestState> | null = null;
    act(() => {
      undoResult = result.current.undo();
    });
    expect(undoResult).toBeNull();

    // Try to redo when no actions
    let redoResult: UndoRedoAction<TestState> | null = null;
    act(() => {
      redoResult = result.current.redo();
    });
    expect(redoResult).toBeNull();

    // End batch when no batch is active
    act(() => {
      result.current.endBatch();
    });
    expect(result.current.historySize).toBe(0);

    // Discard batch when no batch is active
    act(() => {
      result.current.discardBatch();
    });
    expect(result.current.historySize).toBe(0);
  });
});