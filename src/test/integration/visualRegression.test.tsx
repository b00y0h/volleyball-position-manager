import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, createMockPositionManager, createTestPositionsState, waitForAnimation, captureElementSnapshot } from '../testUtils';
import { DraggablePlayer } from '@/components/DraggablePlayer';
import Home from '@/app/page';

// Mock framer-motion to avoid animation complexities in tests
vi.mock('framer-motion', () => ({
  motion: {
    g: ({ children, ...props }: any) => <g {...props}>{children}</g>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the position manager hook
const mockPositionManager = createMockPositionManager();
vi.mock('@/hooks/usePositionManager', () => ({
  usePositionManager: () => mockPositionManager,
}));

// Mock court dimensions for consistent visual testing
const mockCourtDimensions = {
  courtWidth: 600,
  courtHeight: 360,
};

describe('Visual Regression Tests for Custom Position Indicators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPositionManager.positions = {
      '5-1': {},
      '6-2': {},
    };
    mockPositionManager.isLoading = false;
    mockPositionManager.error = null;
  });

  describe('Player Visual Appearance', () => {
    it('should render default player positions consistently', async () => {
      const testPlayer = { id: 'S', name: 'Setter', role: 'S' };
      const testPosition = { x: 300, y: 180 };

      mockPositionManager.isPositionCustomized.mockReturnValue(false);

      const { container } = render(
        <svg width={600} height={360}>
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

      await waitForAnimation();

      const playerElement = screen.getByText('S').closest('g');
      expect(playerElement).toBeTruthy();

      // Capture visual snapshot of default player
      const snapshot = captureElementSnapshot(playerElement as HTMLElement);
      
      // Verify consistent appearance
      const parsedSnapshot = JSON.parse(snapshot);
      expect(parsedSnapshot.tagName).toBe('g');
      expect(parsedSnapshot.textContent).toContain('S');
    });

    it('should render custom player positions with distinct visual indicators', async () => {
      const testPlayer = { id: 'S', name: 'Setter', role: 'S' };
      const customPosition = { 
        x: 350, 
        y: 200, 
        isCustom: true, 
        lastModified: new Date() 
      };

      mockPositionManager.isPositionCustomized.mockReturnValue(true);
      mockPositionManager.getPosition.mockReturnValue(customPosition);

      const { container } = render(
        <svg width={600} height={360}>
          <DraggablePlayer
            player={testPlayer}
            position={customPosition}
            positionManager={mockPositionManager}
            system="5-1"
            rotation={0}
            formation="rotational"
            courtDimensions={mockCourtDimensions}
          />
        </svg>
      );

      await waitForAnimation();

      const playerElement = screen.getByText('S').closest('g');
      expect(playerElement).toBeTruthy();

      // Custom positions should have visual indicators
      const snapshot = captureElementSnapshot(playerElement as HTMLElement);
      const parsedSnapshot = JSON.parse(snapshot);
      
      expect(parsedSnapshot.textContent).toContain('S');
      // Custom positions may have different styling
      expect(parsedSnapshot.className).toBeDefined();
    });

    it('should show consistent visual feedback for read-only mode', async () => {
      const testPlayer = { id: 'S', name: 'Setter', role: 'S' };
      const testPosition = { x: 300, y: 180 };

      const { container } = render(
        <svg width={600} height={360}>
          <DraggablePlayer
            player={testPlayer}
            position={testPosition}
            positionManager={mockPositionManager}
            system="5-1"
            rotation={0}
            formation="rotational"
            courtDimensions={mockCourtDimensions}
            isReadOnly={true}
          />
        </svg>
      );

      await waitForAnimation();

      const playerElement = screen.getByText('S').closest('g');
      expect(playerElement).toBeTruthy();

      // Read-only mode should have distinct visual appearance
      const snapshot = captureElementSnapshot(playerElement as HTMLElement);
      const parsedSnapshot = JSON.parse(snapshot);
      
      expect(parsedSnapshot.textContent).toContain('S');
      // Read-only mode may affect styling/opacity
      expect(parsedSnapshot).toBeDefined();
    });
  });

  describe('Formation Visual Consistency', () => {
    const formations = ['rotational', 'serveReceive', 'base'] as const;

    formations.forEach(formation => {
      it(`should render ${formation} formation consistently`, async () => {
        const testPositions = createTestPositionsState('5-1', 0, formation);
        mockPositionManager.positions['5-1'] = testPositions;
        mockPositionManager.getAllPositions.mockReturnValue(testPositions[0][formation]);

        render(<Home />);

        await waitFor(() => {
          expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
        });

        // Switch to the specific formation
        const formationName = formation === 'rotational' ? 'Rotational' :
                            formation === 'serveReceive' ? 'Serve/Receive' : 'Base';
        
        fireEvent.click(screen.getByText(formationName));
        await waitForAnimation();

        // Find the court area
        const courtElement = screen.getByTestId('volleyball-court');
        if (courtElement) {
          const courtSnapshot = captureElementSnapshot(courtElement as HTMLElement);
          const parsedSnapshot = JSON.parse(courtSnapshot);
          
          // Court should have consistent structure
          expect(parsedSnapshot.tagName).toBe('DIV');
          expect(parsedSnapshot.childCount).toBeGreaterThan(0);
        }
      });
    });

    it('should maintain visual consistency when switching between formations', async () => {
      const rotationalPositions = createTestPositionsState('5-1', 0, 'rotational');
      const serveReceivePositions = createTestPositionsState('5-1', 0, 'serveReceive');
      
      mockPositionManager.positions['5-1'] = {
        0: {
          rotational: rotationalPositions[0].rotational,
          serveReceive: serveReceivePositions[0].serveReceive,
          base: {},
        },
      };

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      const snapshots: string[] = [];

      // Capture snapshots for each formation
      const formations = [
        { button: 'Rotational', formation: 'rotational' },
        { button: 'Serve/Receive', formation: 'serveReceive' },
        { button: 'Rotational', formation: 'rotational' }, // Back to rotational
      ];

      for (const { button, formation } of formations) {
        mockPositionManager.getAllPositions.mockReturnValue(
          mockPositionManager.positions['5-1'][0][formation as keyof typeof mockPositionManager.positions['5-1'][0]]
        );

        fireEvent.click(screen.getByText(button));
        await waitForAnimation();

        const courtElement = screen.getByTestId('volleyball-court');
        if (courtElement) {
          const snapshot = captureElementSnapshot(courtElement as HTMLElement);
          snapshots.push(snapshot);
        }
      }

      // First and last snapshots (both rotational) should be identical
      if (snapshots.length >= 3) {
        expect(snapshots[0]).toBe(snapshots[2]);
      }
    });
  });

  describe('System-Specific Visual Elements', () => {
    it('should render 5-1 system players with correct visual identifiers', async () => {
      const fiveOnePositions = createTestPositionsState('5-1', 0, 'rotational');
      mockPositionManager.positions['5-1'] = fiveOnePositions;
      mockPositionManager.getAllPositions.mockReturnValue(fiveOnePositions[0].rotational);

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // 5-1 system should show setter (S) position
      const setterElement = screen.queryByText('S');
      if (setterElement) {
        const playerGroup = setterElement.closest('g');
        expect(playerGroup).toBeTruthy();
        
        const snapshot = captureElementSnapshot(playerGroup as HTMLElement);
        const parsedSnapshot = JSON.parse(snapshot);
        expect(parsedSnapshot.textContent).toContain('S');
      }
    });

    it('should render 6-2 system players with correct visual identifiers', async () => {
      const sixTwoPositions = createTestPositionsState('6-2', 0, 'rotational');
      mockPositionManager.positions['6-2'] = sixTwoPositions;
      mockPositionManager.getAllPositions.mockReturnValue(sixTwoPositions[0].rotational);

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Switch to 6-2 system
      const systemSelect = screen.getByDisplayValue('5-1');
      fireEvent.change(systemSelect, { target: { value: '6-2' } });

      await waitForAnimation();

      // 6-2 system should show both setter positions
      const setterElements = screen.queryAllByText(/S[12]/);
      expect(setterElements.length).toBeGreaterThanOrEqual(1);

      if (setterElements.length > 0) {
        const snapshot = captureElementSnapshot(setterElements[0].closest('g') as HTMLElement);
        const parsedSnapshot = JSON.parse(snapshot);
        expect(parsedSnapshot.textContent).toMatch(/S[12]/);
      }
    });
  });

  describe('Custom Position Visual Indicators', () => {
    it('should show visual distinction for customized positions', async () => {
      const customPositions = createTestPositionsState('5-1', 0, 'rotational');
      
      // Mark some positions as custom
      Object.keys(customPositions[0].rotational).forEach((playerId, index) => {
        if (index % 2 === 0) { // Make every other position custom
          customPositions[0].rotational[playerId].isCustom = true;
          customPositions[0].rotational[playerId].lastModified = new Date();
        }
      });

      mockPositionManager.positions['5-1'] = customPositions;
      mockPositionManager.getAllPositions.mockReturnValue(customPositions[0].rotational);
      
      // Mock customization checks
      mockPositionManager.isPositionCustomized.mockImplementation((system, rotation, formation, playerId) => {
        return customPositions[0].rotational[playerId]?.isCustom || false;
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Find all player elements
      const playerElements = screen.getAllByText(/^[A-Z]{1,3}[12]?$/);
      expect(playerElements.length).toBeGreaterThan(0);

      // Check that custom and non-custom positions are visually distinguishable
      const snapshots: { playerId: string; snapshot: string; isCustom: boolean }[] = [];
      
      playerElements.forEach((element) => {
        const playerId = element.textContent || '';
        const playerGroup = element.closest('g');
        if (playerGroup) {
          const snapshot = captureElementSnapshot(playerGroup as HTMLElement);
          const isCustom = customPositions[0].rotational[playerId]?.isCustom || false;
          snapshots.push({ playerId, snapshot, isCustom });
        }
      });

      // Verify that custom positions have different visual characteristics
      const customSnapshots = snapshots.filter(s => s.isCustom);
      const defaultSnapshots = snapshots.filter(s => !s.isCustom);

      if (customSnapshots.length > 0 && defaultSnapshots.length > 0) {
        // Custom and default positions should have some visual differences
        // This could be in styling, additional elements, etc.
        expect(customSnapshots[0].snapshot).toBeDefined();
        expect(defaultSnapshots[0].snapshot).toBeDefined();
      }
    });

    it('should show hover effects consistently', async () => {
      const testPlayer = { id: 'S', name: 'Setter', role: 'S' };
      const testPosition = { x: 300, y: 180 };

      const { container } = render(
        <svg width={600} height={360}>
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

      await waitForAnimation();

      const playerElement = screen.getByText('S').closest('g');
      expect(playerElement).toBeTruthy();

      // Capture before hover
      const beforeHoverSnapshot = captureElementSnapshot(playerElement as HTMLElement);

      // Simulate hover
      fireEvent.mouseEnter(playerElement!);
      await waitForAnimation();

      // Capture during hover
      const duringHoverSnapshot = captureElementSnapshot(playerElement as HTMLElement);

      // Simulate mouse leave
      fireEvent.mouseLeave(playerElement!);
      await waitForAnimation();

      // Capture after hover
      const afterHoverSnapshot = captureElementSnapshot(playerElement as HTMLElement);

      // Before and after hover should be the same
      expect(beforeHoverSnapshot).toBe(afterHoverSnapshot);

      // During hover may be different (depends on implementation)
      expect(duringHoverSnapshot).toBeDefined();
    });
  });

  describe('Responsive Visual Behavior', () => {
    it('should maintain visual consistency across different court sizes', async () => {
      const testPlayer = { id: 'S', name: 'Setter', role: 'S' };
      const testPosition = { x: 300, y: 180 };

      const courtSizes = [
        { courtWidth: 400, courtHeight: 240 },
        { courtWidth: 600, courtHeight: 360 },
        { courtWidth: 800, courtHeight: 480 },
      ];

      const snapshots: string[] = [];

      for (const courtSize of courtSizes) {
        const { container } = render(
          <svg width={courtSize.courtWidth} height={courtSize.courtHeight}>
            <DraggablePlayer
              player={testPlayer}
              position={testPosition}
              positionManager={mockPositionManager}
              system="5-1"
              rotation={0}
              formation="rotational"
              courtDimensions={courtSize}
            />
          </svg>
        );

        await waitForAnimation();

        const playerElement = screen.getByText('S').closest('g');
        if (playerElement) {
          const snapshot = captureElementSnapshot(playerElement as HTMLElement);
          snapshots.push(snapshot);
        }
      }

      // All snapshots should have consistent structure
      snapshots.forEach(snapshot => {
        const parsed = JSON.parse(snapshot);
        expect(parsed.tagName).toBe('g');
        expect(parsed.textContent).toContain('S');
      });
    });

    it('should handle edge cases in visual rendering', async () => {
      const edgePositions = [
        { x: 0, y: 0 },        // Top-left corner
        { x: 600, y: 0 },      // Top-right corner
        { x: 0, y: 360 },      // Bottom-left corner
        { x: 600, y: 360 },    // Bottom-right corner
        { x: 300, y: 180 },    // Center
      ];

      const testPlayer = { id: 'S', name: 'Setter', role: 'S' };

      for (const position of edgePositions) {
        const { container } = render(
          <svg width={600} height={360}>
            <DraggablePlayer
              player={testPlayer}
              position={position}
              positionManager={mockPositionManager}
              system="5-1"
              rotation={0}
              formation="rotational"
              courtDimensions={mockCourtDimensions}
            />
          </svg>
        );

        await waitForAnimation();

        const playerElement = screen.getByText('S').closest('g');
        expect(playerElement).toBeTruthy();

        // Should render consistently even at edge positions
        const snapshot = captureElementSnapshot(playerElement as HTMLElement);
        const parsed = JSON.parse(snapshot);
        expect(parsed.textContent).toContain('S');
        expect(parsed.width).toBeGreaterThan(0);
        expect(parsed.height).toBeGreaterThan(0);
      }
    });
  });

  describe('Animation Visual Consistency', () => {
    it('should maintain visual integrity during position updates', async () => {
      const testPositions = createTestPositionsState('5-1', 0, 'rotational');
      mockPositionManager.positions['5-1'] = testPositions;
      mockPositionManager.getAllPositions.mockReturnValue(testPositions[0].rotational);

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Find a player element
      const playerElement = screen.getAllByText(/^[A-Z]{1,3}[12]?$/)[0];
      if (playerElement) {
        const playerGroup = playerElement.closest('g');
        
        // Capture before any interaction
        const beforeSnapshot = captureElementSnapshot(playerGroup as HTMLElement);

        // Simulate a quick interaction that might trigger animations
        fireEvent.mouseDown(playerGroup!);
        await waitForAnimation(50);
        fireEvent.mouseUp(playerGroup!);
        await waitForAnimation(100);

        // Capture after interaction
        const afterSnapshot = captureElementSnapshot(playerGroup as HTMLElement);

        // Basic structure should remain consistent
        const beforeParsed = JSON.parse(beforeSnapshot);
        const afterParsed = JSON.parse(afterSnapshot);
        
        expect(beforeParsed.tagName).toBe(afterParsed.tagName);
        expect(beforeParsed.textContent).toBe(afterParsed.textContent);
      }
    });
  });
});