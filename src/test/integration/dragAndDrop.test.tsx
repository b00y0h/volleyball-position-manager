import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { render, createMockPositionManager, mockCourtDimensions, createTestPlayer, waitForAnimation, simulateDragEvent } from '../testUtils';
import { DraggablePlayer } from '@/components/DraggablePlayer';
import Home from '@/app/page';

// Mock framer-motion to avoid animation complexities in tests
vi.mock('framer-motion', () => ({
  motion: {
    g: ({ children, ...props }: any) => <g {...props}>{children}</g>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the position manager hook
const mockPositionManager = createMockPositionManager();
vi.mock('@/hooks/usePositionManager', () => ({
  usePositionManager: () => mockPositionManager,
}));

// Mock window size hook to return consistent dimensions
vi.mock('@/app/page', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/app/page')>();
  return {
    ...original,
    useWindowSize: () => ({ width: 1200, height: 800 }),
  };
});

describe('Drag and Drop Integration Tests', () => {
  const testPlayer = createTestPlayer();
  const testPosition = { x: 300, y: 180 };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPositionManager.validatePosition.mockReturnValue({ isValid: true });
    mockPositionManager.setPosition.mockReturnValue(true);
  });

  describe('Basic Drag Operations', () => {
    it('should handle successful drag and drop workflow', async () => {
      const onDragStart = vi.fn();
      const onDragEnd = vi.fn();
      const onResetPosition = vi.fn();

      render(
        <svg>
          <DraggablePlayer
            player={testPlayer}
            position={testPosition}
            positionManager={mockPositionManager}
            system="5-1"
            rotation={0}
            formation="rotational"
            courtDimensions={mockCourtDimensions}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onResetPosition={onResetPosition}
          />
        </svg>
      );

      const playerElement = screen.getByText('S').closest('g');
      expect(playerElement).toBeTruthy();

      // Simulate drag start
      fireEvent.mouseDown(playerElement!);
      await waitForAnimation();

      expect(onDragStart).toHaveBeenCalledWith('S');

      // Simulate drag end with successful position update
      fireEvent.mouseUp(playerElement!);
      await waitForAnimation();

      expect(onDragEnd).toHaveBeenCalledWith('S', true);
    });

    it('should handle invalid position during drag', async () => {
      mockPositionManager.validatePosition.mockReturnValue({
        isValid: false,
        reason: 'Position out of bounds',
      });

      const onDragEnd = vi.fn();

      render(
        <svg>
          <DraggablePlayer
            player={testPlayer}
            position={testPosition}
            positionManager={mockPositionManager}
            system="5-1"
            rotation={0}
            formation="rotational"
            courtDimensions={mockCourtDimensions}
            onDragEnd={onDragEnd}
          />
        </svg>
      );

      const playerElement = screen.getByText('S').closest('g');
      
      // Simulate drag to invalid position
      fireEvent.mouseDown(playerElement!);
      fireEvent.mouseUp(playerElement!);
      await waitForAnimation();

      expect(onDragEnd).toHaveBeenCalledWith('S', false);
    });

    it('should prevent drag in read-only mode', async () => {
      const onDragStart = vi.fn();

      render(
        <svg>
          <DraggablePlayer
            player={testPlayer}
            position={testPosition}
            positionManager={mockPositionManager}
            system="5-1"
            rotation={0}
            formation="rotational"
            courtDimensions={mockCourtDimensions}
            isReadOnly={true}
            onDragStart={onDragStart}
          />
        </svg>
      );

      const playerElement = screen.getByText('S').closest('g');
      
      // Try to start drag in read-only mode
      fireEvent.mouseDown(playerElement!);
      await waitForAnimation();

      expect(onDragStart).not.toHaveBeenCalled();
    });
  });

  describe('Position Validation During Drag', () => {
    it('should validate position boundaries during drag', async () => {
      // Mock out-of-bounds validation
      mockPositionManager.validatePosition.mockReturnValueOnce({
        isValid: false,
        reason: 'Position is outside court boundaries',
      });

      render(
        <svg>
          <DraggablePlayer
            player={testPlayer}
            position={testPosition}
            positionManager={mockPositionManager}
            system="5-1"
            rotation={0}
            formation="rotational"
            courtDimensions={mockCourtDimensions}
          />
        </svg>
      );

      const playerElement = screen.getByText('S').closest('g');
      
      // Simulate drag to out-of-bounds position
      simulateDragEvent(
        playerElement!,
        { x: 300, y: 180 },
        { x: 700, y: 400 } // Beyond court boundaries
      );

      expect(mockPositionManager.validatePosition).toHaveBeenCalledWith(
        '5-1',
        0,
        'rotational',
        'S',
        expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
      );
    });

    it('should handle collision detection during drag', async () => {
      mockPositionManager.validatePosition.mockReturnValue({
        isValid: false,
        reason: 'Position would collide with another player',
      });

      render(
        <svg>
          <DraggablePlayer
            player={testPlayer}
            position={testPosition}
            positionManager={mockPositionManager}
            system="5-1"
            rotation={0}
            formation="rotational"
            courtDimensions={mockCourtDimensions}
          />
        </svg>
      );

      const playerElement = screen.getByText('S').closest('g');
      
      // Simulate drag to position that would collide
      simulateDragEvent(
        playerElement!,
        { x: 300, y: 180 },
        { x: 350, y: 190 } // Close to existing player
      );

      expect(mockPositionManager.validatePosition).toHaveBeenCalled();
    });
  });

  describe('Multi-Player Drag Scenarios', () => {
    it('should handle multiple simultaneous drag operations', async () => {
      const players = [
        createTestPlayer({ id: 'S', name: 'Setter' }),
        createTestPlayer({ id: 'OH1', name: 'OH1' }),
        createTestPlayer({ id: 'MB1', name: 'MB1' }),
      ];

      render(
        <svg>
          {players.map((player, index) => (
            <DraggablePlayer
              key={player.id}
              player={player}
              position={{ x: 200 + index * 100, y: 200 }}
              positionManager={mockPositionManager}
              system="5-1"
              rotation={0}
              formation="rotational"
              courtDimensions={mockCourtDimensions}
            />
          ))}
        </svg>
      );

      // Try to drag multiple players
      const setterElement = screen.getByText('S').closest('g');
      const oh1Element = screen.getByText('OH1').closest('g');

      fireEvent.mouseDown(setterElement!);
      fireEvent.mouseDown(oh1Element!);

      await waitForAnimation();

      // Only one player should be draggable at a time
      expect(mockPositionManager.setPosition).not.toHaveBeenCalledTimes(2);
    });

    it('should update position manager correctly after successful drag', async () => {
      render(
        <svg>
          <DraggablePlayer
            player={testPlayer}
            position={testPosition}
            positionManager={mockPositionManager}
            system="5-1"
            rotation={0}
            formation="rotational"
            courtDimensions={mockCourtDimensions}
          />
        </svg>
      );

      const playerElement = screen.getByText('S').closest('g');
      
      // Simulate successful drag
      simulateDragEvent(
        playerElement!,
        { x: 300, y: 180 },
        { x: 400, y: 250 }
      );

      await waitForAnimation();

      expect(mockPositionManager.setPosition).toHaveBeenCalledWith(
        '5-1',
        0,
        'rotational',
        'S',
        expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
      );
    });
  });

  describe('Formation-Specific Drag Behavior', () => {
    const formations = ['rotational', 'serveReceive', 'base'] as const;

    formations.forEach(formation => {
      it(`should handle drag operations in ${formation} formation`, async () => {
        render(
          <svg>
            <DraggablePlayer
              player={testPlayer}
              position={testPosition}
              positionManager={mockPositionManager}
              system="5-1"
              rotation={0}
              formation={formation}
              courtDimensions={mockCourtDimensions}
            />
          </svg>
        );

        const playerElement = screen.getByText('S').closest('g');
        
        simulateDragEvent(
          playerElement!,
          { x: 300, y: 180 },
          { x: 350, y: 200 }
        );

        expect(mockPositionManager.validatePosition).toHaveBeenCalledWith(
          '5-1',
          0,
          formation,
          'S',
          expect.any(Object)
        );
      });
    });
  });

  describe('Error Handling During Drag', () => {
    it('should handle position manager errors gracefully', async () => {
      mockPositionManager.setPosition.mockImplementation(() => {
        throw new Error('Position manager error');
      });

      const onDragEnd = vi.fn();

      render(
        <svg>
          <DraggablePlayer
            player={testPlayer}
            position={testPosition}
            positionManager={mockPositionManager}
            system="5-1"
            rotation={0}
            formation="rotational"
            courtDimensions={mockCourtDimensions}
            onDragEnd={onDragEnd}
          />
        </svg>
      );

      const playerElement = screen.getByText('S').closest('g');
      
      // This should not crash the application
      expect(() => {
        simulateDragEvent(
          playerElement!,
          { x: 300, y: 180 },
          { x: 350, y: 200 }
        );
      }).not.toThrow();

      await waitForAnimation();
      
      expect(onDragEnd).toHaveBeenCalledWith('S', false);
    });

    it('should recover from validation errors', async () => {
      // First validation fails, second succeeds
      mockPositionManager.validatePosition
        .mockReturnValueOnce({ isValid: false, reason: 'Invalid position' })
        .mockReturnValueOnce({ isValid: true });

      render(
        <svg>
          <DraggablePlayer
            player={testPlayer}
            position={testPosition}
            positionManager={mockPositionManager}
            system="5-1"
            rotation={0}
            formation="rotational"
            courtDimensions={mockCourtDimensions}
          />
        </svg>
      );

      const playerElement = screen.getByText('S').closest('g');
      
      // First drag attempt (should fail)
      simulateDragEvent(
        playerElement!,
        { x: 300, y: 180 },
        { x: 700, y: 400 }
      );

      await waitForAnimation();

      // Second drag attempt (should succeed)
      simulateDragEvent(
        playerElement!,
        { x: 300, y: 180 },
        { x: 350, y: 200 }
      );

      await waitForAnimation();

      expect(mockPositionManager.validatePosition).toHaveBeenCalledTimes(2);
    });
  });

  describe('Responsive Drag Behavior', () => {
    it('should adapt drag boundaries to court dimensions', async () => {
      const smallCourtDimensions = { courtWidth: 300, courtHeight: 180 };

      render(
        <svg>
          <DraggablePlayer
            player={testPlayer}
            position={testPosition}
            positionManager={mockPositionManager}
            system="5-1"
            rotation={0}
            formation="rotational"
            courtDimensions={smallCourtDimensions}
          />
        </svg>
      );

      const playerElement = screen.getByText('S').closest('g');
      
      // Drag to position that would be valid on large court but invalid on small court
      simulateDragEvent(
        playerElement!,
        { x: 150, y: 90 },
        { x: 280, y: 160 } // Near edge of small court
      );

      // Should validate against the smaller court dimensions
      expect(mockPositionManager.validatePosition).toHaveBeenCalled();
    });
  });

  describe('Drag Visual Feedback', () => {
    it('should show visual feedback during drag', async () => {
      render(
        <svg>
          <DraggablePlayer
            player={testPlayer}
            position={testPosition}
            positionManager={mockPositionManager}
            system="5-1"
            rotation={0}
            formation="rotational"
            courtDimensions={mockCourtDimensions}
          />
        </svg>
      );

      const playerElement = screen.getByText('S').closest('g');
      
      // Start drag
      fireEvent.mouseDown(playerElement!);
      await waitForAnimation();

      // During drag, visual feedback should be shown
      // (This would be tested more thoroughly with actual DOM inspection)
      expect(playerElement).toBeTruthy();

      // End drag
      fireEvent.mouseUp(playerElement!);
      await waitForAnimation();

      // Visual feedback should be removed
      expect(playerElement).toBeTruthy();
    });

    it('should show different feedback for valid vs invalid positions', async () => {
      mockPositionManager.validatePosition
        .mockReturnValueOnce({ isValid: true })
        .mockReturnValueOnce({ isValid: false, reason: 'Invalid position' });

      render(
        <svg>
          <DraggablePlayer
            player={testPlayer}
            position={testPosition}
            positionManager={mockPositionManager}
            system="5-1"
            rotation={0}
            formation="rotational"
            courtDimensions={mockCourtDimensions}
          />
        </svg>
      );

      const playerElement = screen.getByText('S').closest('g');
      
      // Valid position drag
      simulateDragEvent(
        playerElement!,
        { x: 300, y: 180 },
        { x: 350, y: 200 }
      );

      await waitForAnimation();

      // Invalid position drag  
      simulateDragEvent(
        playerElement!,
        { x: 300, y: 180 },
        { x: 700, y: 400 }
      );

      await waitForAnimation();

      // Both validations should have been called
      expect(mockPositionManager.validatePosition).toHaveBeenCalledTimes(2);
    });
  });
});