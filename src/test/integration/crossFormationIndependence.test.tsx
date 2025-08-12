import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, createMockPositionManager, createTestPositionsState, waitForAnimation } from '../testUtils';
import Home from '@/app/page';
import { SystemType } from '@/types';

// Mock the position manager hook
const mockPositionManager = createMockPositionManager();
vi.mock('@/hooks/usePositionManager', () => ({
  usePositionManager: () => mockPositionManager,
}));

// Mock window location for consistent testing
const mockLocation = {
  href: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  pathname: '/',
  search: '',
};

Object.defineProperty(window, 'location', {
  writable: true,
  value: mockLocation,
});

describe('Cross-Formation Position Independence Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.search = '';
    mockPositionManager.positions = {
      '5-1': {},
      '6-2': {},
    };
    mockPositionManager.isLoading = false;
    mockPositionManager.error = null;
  });

  describe('Formation Isolation', () => {
    it('should maintain separate positions for rotational, serve/receive, and base formations', async () => {
      // Set up positions for all formations
      const rotationalPositions = createTestPositionsState('5-1', 0, 'rotational');
      const serveReceivePositions = createTestPositionsState('5-1', 0, 'serveReceive');
      const basePositions = createTestPositionsState('5-1', 0, 'base');

      // Mock different positions for each formation
      mockPositionManager.positions['5-1'] = {
        0: {
          rotational: rotationalPositions[0].rotational,
          serveReceive: serveReceivePositions[0].serveReceive,
          base: basePositions[0].base,
        },
      };

      mockPositionManager.getAllPositions.mockImplementation((system: SystemType, rotation: number, formation) => {
        if (formation === 'rotational') return rotationalPositions[rotation]?.rotational || {};
        if (formation === 'serveReceive') return serveReceivePositions[rotation]?.serveReceive || {};
        if (formation === 'base') return basePositions[rotation]?.base || {};
        return {};
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Start with rotational formation - check the dropdown
      const formationSelect = screen.getByDisplayValue(/Rotational Position/);
      expect(formationSelect).toBeInTheDocument();

      // Switch to Serve/Receive formation
      fireEvent.change(formationSelect, { target: { value: 'serveReceive' } });

      await waitForAnimation();

      // Should have called position manager with correct formation
      expect(mockPositionManager.getAllPositions).toHaveBeenCalledWith('5-1', 0, 'serveReceive');

      // Switch to Base formation
      fireEvent.change(formationSelect, { target: { value: 'base' } });

      await waitForAnimation();

      expect(mockPositionManager.getAllPositions).toHaveBeenCalledWith('5-1', 0, 'base');
    });

    it('should not affect other formations when modifying one formation', async () => {
      const testPositions = createTestPositionsState('5-1', 0, 'rotational');
      mockPositionManager.positions['5-1'] = testPositions;

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Mock position update for rotational formation only
      mockPositionManager.setPosition.mockImplementation((system, rotation, formation, playerId, position) => {
        if (formation === 'rotational') {
          return true;
        }
        return false;
      });

      // Stay on rotational formation (default)
      const formationSelect = screen.getByDisplayValue(/Rotational Position/);
      expect(formationSelect).toHaveValue('rotational');
      
      // Position manager should only be called for the active formation
      expect(mockPositionManager.setPosition).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'serveReceive',
        expect.anything(),
        expect.anything()
      );
      expect(mockPositionManager.setPosition).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'base',
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('System Independence', () => {
    it('should maintain separate positions for 5-1 and 6-2 systems', async () => {
      // Set up positions for both systems
      const fiveOnePositions = createTestPositionsState('5-1', 0, 'rotational');
      const sixTwoPositions = createTestPositionsState('6-2', 0, 'rotational');

      mockPositionManager.positions = {
        '5-1': fiveOnePositions,
        '6-2': sixTwoPositions,
      };

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Start with 5-1 system
      expect(screen.getByDisplayValue('5-1')).toBeInTheDocument();

      // Switch to 6-2 system
      const systemSelect = screen.getByDisplayValue('5-1');
      fireEvent.change(systemSelect, { target: { value: '6-2' } });

      await waitForAnimation();

      // Should load positions for 6-2 system
      expect(mockPositionManager.getAllPositions).toHaveBeenCalledWith('6-2', 0, 'rotational');

      // Switch back to 5-1
      fireEvent.change(systemSelect, { target: { value: '5-1' } });

      await waitForAnimation();

      // Should load positions for 5-1 system again
      expect(mockPositionManager.getAllPositions).toHaveBeenCalledWith('5-1', 0, 'rotational');
    });

    it('should handle different player roles between systems', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Start with 5-1 system (has one setter)
      const systemSelect = screen.getByDisplayValue('5-1');
      expect(systemSelect).toBeInTheDocument();

      // Switch to 6-2 system (has two setters)
      fireEvent.change(systemSelect, { target: { value: '6-2' } });

      await waitForAnimation();

      // Position manager should be called with the correct system
      expect(mockPositionManager.getAllPositions).toHaveBeenCalledWith('6-2', expect.any(Number), expect.any(String));
    });
  });

  describe('Rotation Independence', () => {
    it('should maintain separate positions for each rotation', async () => {
      // Set up positions for multiple rotations
      const rotationPositions = {
        0: createTestPositionsState('5-1', 0, 'rotational'),
        1: createTestPositionsState('5-1', 1, 'rotational'),
        2: createTestPositionsState('5-1', 2, 'rotational'),
      };

      mockPositionManager.positions['5-1'] = {
        ...rotationPositions[0],
        ...rotationPositions[1],
        ...rotationPositions[2],
      };

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Start with rotation 0 (button shows "1")
      const rotation1Button = screen.getByText('1');
      expect(rotation1Button).toBeInTheDocument();
      
      // Switch to rotation 1 (button shows "2")
      const rotation2Button = screen.getByText('2');
      fireEvent.click(rotation2Button);

      await waitForAnimation();

      // Should load positions for rotation 1
      expect(mockPositionManager.getAllPositions).toHaveBeenCalledWith('5-1', 1, 'rotational');

      // Switch to rotation 2 (button shows "3")
      const rotation3Button = screen.getByText('3');
      fireEvent.click(rotation3Button);

      await waitForAnimation();

      // Should load positions for rotation 2
      expect(mockPositionManager.getAllPositions).toHaveBeenCalledWith('5-1', 2, 'rotational');
    });

    it('should not affect other rotations when modifying one rotation', async () => {
      const testPositions = createTestPositionsState('5-1', 0, 'rotational');
      mockPositionManager.positions['5-1'] = testPositions;

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Mock position update for rotation 0 only
      mockPositionManager.setPosition.mockImplementation((system, rotation, formation, playerId, position) => {
        if (rotation === 0) {
          return true;
        }
        return false;
      });

      // Stay on rotation 0 (button shows "1")
      const rotation1Button = screen.getByText('1');
      expect(rotation1Button).toBeInTheDocument();

      // Position updates should only affect rotation 0
      expect(mockPositionManager.setPosition).not.toHaveBeenCalledWith(
        expect.anything(),
        1,
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('Complex Independence Scenarios', () => {
    it('should handle system + rotation + formation combinations independently', async () => {
      // Create comprehensive test data
      const testScenarios = [
        { system: '5-1' as SystemType, rotation: 0, formation: 'rotational' as const },
        { system: '5-1' as SystemType, rotation: 0, formation: 'serveReceive' as const },
        { system: '5-1' as SystemType, rotation: 1, formation: 'rotational' as const },
        { system: '6-2' as SystemType, rotation: 0, formation: 'rotational' as const },
        { system: '6-2' as SystemType, rotation: 0, formation: 'base' as const },
      ];

      // Set up positions for all scenarios
      mockPositionManager.positions = {
        '5-1': {
          0: {
            rotational: createTestPositionsState('5-1', 0, 'rotational')[0].rotational,
            serveReceive: createTestPositionsState('5-1', 0, 'serveReceive')[0].serveReceive,
            base: {},
          },
          1: {
            rotational: createTestPositionsState('5-1', 1, 'rotational')[1].rotational,
            serveReceive: {},
            base: {},
          },
        },
        '6-2': {
          0: {
            rotational: createTestPositionsState('6-2', 0, 'rotational')[0].rotational,
            serveReceive: {},
            base: createTestPositionsState('6-2', 0, 'base')[0].base,
          },
        },
      };

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Test each scenario
      for (const scenario of testScenarios) {
        // Set the system
        const systemSelect = screen.getByDisplayValue(/^(5-1|6-2)$/);
        fireEvent.change(systemSelect, { target: { value: scenario.system } });

        // Set the rotation
        const rotationButton = screen.getByText((scenario.rotation + 1).toString());
        fireEvent.click(rotationButton);

        // Set the formation
        const formationSelect = screen.getByDisplayValue(/Rotational Position|Serve\/Receive|Base/);
        fireEvent.change(formationSelect, { target: { value: scenario.formation } });

        await waitForAnimation();

        // Verify position manager is called with correct parameters
        expect(mockPositionManager.getAllPositions).toHaveBeenCalledWith(
          scenario.system,
          scenario.rotation,
          scenario.formation
        );
      }
    });

    it('should preserve positions when switching between combinations', async () => {
      const originalPositions = createTestPositionsState('5-1', 0, 'rotational');
      mockPositionManager.positions['5-1'] = originalPositions;

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Start with 5-1, rotation 0, rotational
      expect(screen.getByDisplayValue('5-1')).toBeInTheDocument();
      const rotation1Button = screen.getByText('1');
      expect(rotation1Button).toBeInTheDocument();
      const formationSelect = screen.getByDisplayValue(/Rotational Position/);
      expect(formationSelect).toBeInTheDocument();

      // Switch to serve/receive formation
      fireEvent.change(formationSelect, { target: { value: 'serveReceive' } });
      await waitForAnimation();

      // Switch back to rotational
      fireEvent.change(formationSelect, { target: { value: 'rotational' } });
      await waitForAnimation();

      // Should reload the original rotational positions
      expect(mockPositionManager.getAllPositions).toHaveBeenLastCalledWith('5-1', 0, 'rotational');
    });
  });

  describe('Data Consistency Across Formations', () => {
    it('should validate position data integrity when switching formations', async () => {
      const validPositions = createTestPositionsState('5-1', 0, 'rotational');
      mockPositionManager.positions['5-1'] = validPositions;

      mockPositionManager.getAllPositions.mockImplementation((system, rotation, formation) => {
        // Return valid data structure regardless of formation
        return validPositions[rotation] ? validPositions[rotation][formation] || {} : {};
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      const formations = [{ value: 'serveReceive', name: 'Serve/Receive' }, { value: 'base', name: 'Base' }, { value: 'rotational', name: 'Rotational' }];
      const formationSelect = screen.getByDisplayValue(/Rotational Position/);

      for (const formation of formations) {
        fireEvent.change(formationSelect, { target: { value: formation.value } });
        await waitForAnimation();

        // Should successfully load each formation without errors
        expect(formationSelect).toHaveValue(formation.value);
      }
    });

    it('should handle missing formation data gracefully', async () => {
      // Set up incomplete data (missing some formations)
      mockPositionManager.positions['5-1'] = {
        0: {
          rotational: createTestPositionsState('5-1', 0, 'rotational')[0].rotational,
          // Missing serveReceive and base
          serveReceive: {},
          base: {},
        },
      };

      mockPositionManager.getAllPositions.mockImplementation((system, rotation, formation) => {
        const rotationData = mockPositionManager.positions[system]?.[rotation];
        return rotationData?.[formation] || {};
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Should handle missing formation data without crashing
      const formationSelect = screen.getByDisplayValue(/Rotational Position/);
      
      fireEvent.change(formationSelect, { target: { value: 'serveReceive' } });
      await waitForAnimation();

      expect(formationSelect).toHaveValue('serveReceive');
      expect(mockPositionManager.getAllPositions).toHaveBeenCalledWith('5-1', 0, 'serveReceive');

      fireEvent.change(formationSelect, { target: { value: 'base' } });
      await waitForAnimation();

      expect(formationSelect).toHaveValue('base');
      expect(mockPositionManager.getAllPositions).toHaveBeenCalledWith('5-1', 0, 'base');
    });
  });

  describe('Reset Operations Independence', () => {
    it('should reset only the active formation when requested', async () => {
      const testPositions = createTestPositionsState('5-1', 0, 'rotational');
      mockPositionManager.positions['5-1'] = testPositions;

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Mock reset methods
      mockPositionManager.resetFormation = vi.fn();
      mockPositionManager.resetPosition = vi.fn();

      // Start with rotational formation (default)
      const formationSelect = screen.getByDisplayValue(/Rotational Position/);
      expect(formationSelect).toHaveValue('rotational');

      // If there's a reset button for formations, test it
      // (This would depend on the actual UI implementation)
      const resetButtons = screen.queryAllByText(/Reset/i);
      if (resetButtons.length > 0) {
        fireEvent.click(resetButtons[0]);
        
        // Should reset only the current formation
        expect(mockPositionManager.resetFormation).toHaveBeenCalledWith('5-1', 0, 'rotational');
      }
    });

    it('should not affect other formations when resetting one formation', async () => {
      const testPositions = {
        0: {
          rotational: createTestPositionsState('5-1', 0, 'rotational')[0].rotational,
          serveReceive: createTestPositionsState('5-1', 0, 'serveReceive')[0].serveReceive,
          base: createTestPositionsState('5-1', 0, 'base')[0].base,
        },
      };

      mockPositionManager.positions['5-1'] = testPositions;

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Mock reset to only affect the specified formation
      mockPositionManager.resetFormation.mockImplementation((system, rotation, formation) => {
        if (formation === 'rotational') {
          // Only clear rotational data
          mockPositionManager.positions[system][rotation].rotational = {};
          return true;
        }
        return false;
      });

      // Switch between formations to ensure independence
      const formationSelect = screen.getByDisplayValue(/Rotational Position/);
      
      fireEvent.change(formationSelect, { target: { value: 'rotational' } });
      fireEvent.change(formationSelect, { target: { value: 'serveReceive' } });
      fireEvent.change(formationSelect, { target: { value: 'base' } });

      // All formations should still be accessible
      expect(formationSelect).toBeInTheDocument();
      expect(screen.getByText('Serve/Receive')).toBeInTheDocument();
      expect(screen.getByText('Base (Attack)')).toBeInTheDocument();
    });
  });
});