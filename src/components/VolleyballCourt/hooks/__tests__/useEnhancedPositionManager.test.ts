import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEnhancedPositionManager } from '../useEnhancedPositionManager';

// Mock the base position manager
vi.mock('../usePositionManager', () => ({
  usePositionManager: () => ({
    positions: {
      '5-1': {
        0: {
          rotational: {
            'S': { x: 300, y: 180, isCustom: true, lastModified: new Date() },
            'OH1': { x: 200, y: 150, isCustom: true, lastModified: new Date() },
          },
          serveReceive: {},
          base: {},
        },
      },
      '6-2': {},
    },
    isLoading: false,
    error: null,
    resetFormation: vi.fn(),
    resetSystem: vi.fn(),
    saveImmediate: vi.fn(),
    isFormationCustomized: vi.fn((system, rotation, formation) => {
      if (system === '5-1' && rotation === 0 && formation === 'rotational') {
        return true;
      }
      return false;
    }),
    isSystemCustomized: vi.fn((system) => system === '5-1'),
  }),
}));

// Mock the undo/redo hook
vi.mock('../useUndoRedo', () => ({
  useUndoRedo: () => ({
    pushAction: vi.fn(),
    undo: vi.fn(() => ({ id: 'test', description: 'test action' })),
    redo: vi.fn(() => ({ id: 'test', description: 'test action' })),
    canUndo: true,
    canRedo: true,
    startBatch: vi.fn(),
    endBatch: vi.fn(),
    discardBatch: vi.fn(),
  }),
}));

describe('useEnhancedPositionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extend base position manager functionality', () => {
    const { result } = renderHook(() => useEnhancedPositionManager());
    
    // Should have base functionality
    expect(result.current.positions).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    
    // Should have enhanced functionality
    expect(result.current.resetCurrentRotation).toBeDefined();
    expect(result.current.resetAllRotations).toBeDefined();
    expect(result.current.resetSelectedFormation).toBeDefined();
    expect(result.current.resetEntireSystem).toBeDefined();
    expect(result.current.undo).toBeDefined();
    expect(result.current.redo).toBeDefined();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);
  });

  it('should handle current rotation reset', async () => {
    const { result } = renderHook(() => useEnhancedPositionManager());
    
    let resetResult;
    await act(async () => {
      resetResult = await result.current.resetCurrentRotation('5-1', 0, 'rotational');
    });
    
    expect(resetResult).toEqual({
      success: true,
      affectedPositions: 2, // S and OH1
    });
  });

  it('should handle current rotation reset with no customizations', async () => {
    const { result } = renderHook(() => useEnhancedPositionManager());
    
    let resetResult;
    await act(async () => {
      resetResult = await result.current.resetCurrentRotation('6-2', 0, 'rotational');
    });
    
    expect(resetResult).toEqual({
      success: true,
      affectedPositions: 0,
    });
  });

  it('should handle all rotations reset', async () => {
    const { result } = renderHook(() => useEnhancedPositionManager());
    
    let resetResult;
    await act(async () => {
      resetResult = await result.current.resetAllRotations('5-1', 'rotational');
    });
    
    expect(resetResult).toEqual({
      success: true,
      affectedPositions: expect.any(Number),
    });
  });

  it('should handle formation reset', async () => {
    const { result } = renderHook(() => useEnhancedPositionManager());
    
    let resetResult;
    await act(async () => {
      resetResult = await result.current.resetSelectedFormation('5-1', 'rotational');
    });
    
    expect(resetResult).toEqual({
      success: true,
      affectedPositions: expect.any(Number),
    });
  });

  it('should handle system reset', async () => {
    const { result } = renderHook(() => useEnhancedPositionManager());
    
    let resetResult;
    await act(async () => {
      resetResult = await result.current.resetEntireSystem('5-1');
    });
    
    expect(resetResult).toEqual({
      success: true,
      affectedPositions: expect.any(Number),
    });
  });

  it('should handle undo operations', async () => {
    const { result } = renderHook(() => useEnhancedPositionManager());
    
    let undoResult;
    await act(async () => {
      undoResult = await result.current.undo();
    });
    
    expect(undoResult).toBe(true);
  });

  it('should handle redo operations', async () => {
    const { result } = renderHook(() => useEnhancedPositionManager());
    
    let redoResult;
    await act(async () => {
      redoResult = await result.current.redo();
    });
    
    expect(redoResult).toBe(true);
  });

  it('should get reset capabilities correctly', () => {
    const { result } = renderHook(() => useEnhancedPositionManager());
    
    const capabilities = result.current.getResetCapabilities('5-1', 0, 'rotational');
    
    expect(capabilities).toEqual({
      currentRotation: true,
      allRotations: true,
      currentFormation: true,
      system: true,
    });
  });

  it('should get affected positions for current rotation', () => {
    const { result } = renderHook(() => useEnhancedPositionManager());
    
    const affected = result.current.getAffectedPositions('current', '5-1', 0, 'rotational');
    
    expect(affected).toEqual(expect.arrayContaining(['S', 'OH1']));
  });

  it('should get affected positions for all rotations', () => {
    const { result } = renderHook(() => useEnhancedPositionManager());
    
    const affected = result.current.getAffectedPositions('all', '5-1', undefined, 'rotational');
    
    expect(Array.isArray(affected)).toBe(true);
  });

  it('should get affected positions for formation', () => {
    const { result } = renderHook(() => useEnhancedPositionManager());
    
    const affected = result.current.getAffectedPositions('formation', '5-1', undefined, 'rotational');
    
    expect(Array.isArray(affected)).toBe(true);
  });

  it('should get affected positions for system', () => {
    const { result } = renderHook(() => useEnhancedPositionManager());
    
    const affected = result.current.getAffectedPositions('system', '5-1');
    
    expect(Array.isArray(affected)).toBe(true);
  });

  it('should handle errors in reset operations gracefully', async () => {
    // Mock the base position manager to throw an error
    vi.mocked(vi.importMock('../usePositionManager')).mockReturnValue({
      ...vi.mocked(vi.importMock('../usePositionManager')),
      resetFormation: vi.fn(() => {
        throw new Error('Test error');
      }),
    });

    const { result } = renderHook(() => useEnhancedPositionManager());
    
    let resetResult;
    await act(async () => {
      resetResult = await result.current.resetCurrentRotation('5-1', 0, 'rotational');
    });
    
    expect(resetResult).toEqual({
      success: false,
      affectedPositions: 0,
      error: 'Test error',
    });
  });

  it('should handle batch operations correctly', async () => {
    const { result } = renderHook(() => useEnhancedPositionManager());
    
    // Start batch operation
    act(() => {
      result.current.startResetBatch('Test batch');
    });
    
    // Perform reset operation
    await act(async () => {
      await result.current.resetAllRotations('5-1', 'rotational');
    });
    
    // End batch operation
    act(() => {
      result.current.endResetBatch();
    });
    
    // Should have completed without errors
    expect(result.current).toBeDefined();
  });

  it('should discard batch operations when needed', async () => {
    const { result } = renderHook(() => useEnhancedPositionManager());
    
    // Start batch operation
    act(() => {
      result.current.startResetBatch('Test batch');
    });
    
    // Discard batch operation
    act(() => {
      result.current.discardResetBatch();
    });
    
    // Should have completed without errors
    expect(result.current).toBeDefined();
  });

  it('should handle failed undo operations', async () => {
    // Mock undo to return null (no action to undo)
    vi.mocked(vi.importMock('../useUndoRedo')).mockReturnValue({
      ...vi.mocked(vi.importMock('../useUndoRedo')),
      undo: vi.fn(() => null),
    });

    const { result } = renderHook(() => useEnhancedPositionManager());
    
    let undoResult;
    await act(async () => {
      undoResult = await result.current.undo();
    });
    
    expect(undoResult).toBe(false);
  });

  it('should handle failed redo operations', async () => {
    // Mock redo to return null (no action to redo)
    vi.mocked(vi.importMock('../useUndoRedo')).mockReturnValue({
      ...vi.mocked(vi.importMock('../useUndoRedo')),
      redo: vi.fn(() => null),
    });

    const { result } = renderHook(() => useEnhancedPositionManager());
    
    let redoResult;
    await act(async () => {
      redoResult = await result.current.redo();
    });
    
    expect(redoResult).toBe(false);
  });
});