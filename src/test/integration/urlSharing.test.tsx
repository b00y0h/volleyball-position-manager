import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, createMockPositionManager, createTestPositionsState, createTestURL, mockLocalStorage, waitForAnimation } from '../testUtils';
import { URLStateManager } from '@/utils/URLStateManager';
import Home from '@/app/page';

// Mock the position manager hook
const mockPositionManager = createMockPositionManager();
vi.mock('@/hooks/usePositionManager', () => ({
  usePositionManager: () => mockPositionManager,
}));

// Mock window location and history
const mockLocation = {
  href: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  pathname: '/',
  search: '',
  searchParams: new URLSearchParams(),
};

const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
};

Object.defineProperty(window, 'location', {
  writable: true,
  value: mockLocation,
});

Object.defineProperty(window, 'history', {
  writable: true,
  value: mockHistory,
});

// Mock localStorage
const mockStorage = mockLocalStorage();
Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: mockStorage,
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

// Mock alert for copy feedback
vi.stubGlobal('alert', vi.fn());

describe('URL Sharing End-to-End Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.search = '';
    mockLocation.href = 'http://localhost:3000';
    mockPositionManager.positions = { '5-1': {}, '6-2': {} };
    mockPositionManager.isLoading = false;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('URL Generation and Encoding', () => {
    it('should generate shareable URL with position data', () => {
      const testPositions = createTestPositionsState('5-1', 0, 'rotational');
      const url = URLStateManager.generateShareableURL('5-1', 0, testPositions);

      expect(url).toContain('http://localhost:3000');
      expect(url).toContain('?d=');
      expect(url).toContain('&v=');
      expect(url).toContain('&s=5-1');
      expect(url).toContain('&r=0');
    });

    it('should handle large position datasets with fallback compression', () => {
      // Create a large dataset
      const largePositions = createTestPositionsState('5-1', 0, 'rotational');
      
      // Add many custom positions to simulate large dataset
      for (let i = 0; i < 100; i++) {
        largePositions[0].rotational[`player_${i}`] = {
          x: Math.random() * 600,
          y: Math.random() * 360,
          isCustom: true,
          lastModified: new Date(),
        };
      }

      const url = URLStateManager.generateShareableURL('5-1', 0, largePositions);
      
      // Should still generate a valid URL (may use fallback compression)
      expect(url).toContain('http://localhost:3000');
      expect(url.length).toBeLessThan(3000); // Should be reasonable length
    });

    it('should handle special characters in position data', () => {
      const testPositions = createTestPositionsState('5-1', 0, 'rotational');
      
      // Add position with special characters in custom data
      testPositions[0].rotational['special_player'] = {
        x: 300.123456789,
        y: 180.987654321,
        isCustom: true,
        lastModified: new Date('2023-12-25T10:30:45.123Z'),
      };

      expect(() => {
        URLStateManager.generateShareableURL('5-1', 0, testPositions);
      }).not.toThrow();
    });
  });

  describe('URL Parsing and Decoding', () => {
    it('should parse position data from URL correctly', () => {
      const originalPositions = createTestPositionsState('5-1', 2, 'serveReceive');
      const testUrl = createTestURL('5-1', 2, originalPositions);
      
      const parsedData = URLStateManager.decodePositionsFromURL(testUrl);
      
      expect(parsedData).not.toBeNull();
      expect(parsedData!.system).toBe('5-1');
      expect(parsedData!.rotation).toBe(2);
      expect(parsedData!.positions).toEqual(originalPositions);
    });

    it('should handle corrupted URL data gracefully', () => {
      const corruptedUrl = 'http://localhost:3000?d=invalid_data&v=1.0.0&s=5-1&r=0';
      
      const parsedData = URLStateManager.decodePositionsFromURL(corruptedUrl);
      
      expect(parsedData).toBeNull();
    });

    it('should validate URL parameter completeness', () => {
      const incompleteUrl = 'http://localhost:3000?d=data&v=1.0.0'; // Missing s and r
      
      const parsedData = URLStateManager.decodePositionsFromURL(incompleteUrl);
      
      expect(parsedData).toBeNull();
    });

    it('should handle version compatibility', () => {
      const futureVersionUrl = 'http://localhost:3000?d=data&v=2.0.0&s=5-1&r=0';
      
      // Should handle gracefully with version warning
      const hasPositionData = URLStateManager.hasPositionData(futureVersionUrl);
      
      expect(hasPositionData).toBe(true);
    });
  });

  describe('Share Dialog Integration', () => {
    it('should open share dialog when share button is clicked', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(screen.getByText('Share Configuration')).toBeInTheDocument();
      });

      expect(screen.getByText('Copy this URL to share your current volleyball formation configuration:')).toBeInTheDocument();
    });

    it('should generate and display shareable URL in dialog', async () => {
      mockPositionManager.positions = {
        '5-1': createTestPositionsState('5-1', 0, 'rotational'),
        '6-2': {},
      };

      render(<Home />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);

      await waitFor(() => {
        const urlInput = screen.getByDisplayValue(/http:\/\/localhost:3000\?/) as HTMLInputElement;
        expect(urlInput.value).toContain('?d=');
        expect(urlInput.value).toContain('&s=5-1');
        expect(urlInput.value).toContain('&r=0');
      });
    });

    it('should copy URL to clipboard when copy button is clicked', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);

      await waitFor(() => {
        const copyButton = screen.getByText('Copy');
        fireEvent.click(copyButton);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('URL copied to clipboard!');
    });

    it('should handle clipboard copy failure gracefully', async () => {
      // Mock clipboard.writeText to fail
      navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('Clipboard access denied'));

      render(<Home />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);

      await waitFor(() => {
        const copyButton = screen.getByText('Copy');
        fireEvent.click(copyButton);
      });

      // Should fall back to select text method
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('URL copied to clipboard!');
      });
    });
  });

  describe('URL Loading on Page Load', () => {
    it('should load position data from URL on page initialization', async () => {
      const testPositions = createTestPositionsState('6-2', 3, 'base');
      const testUrl = createTestURL('6-2', 3, testPositions);
      
      // Mock URL with position data
      mockLocation.href = testUrl;
      mockLocation.search = new URL(testUrl).search;

      render(<Home />);

      await waitFor(() => {
        expect(mockPositionManager.setFormationPositions).toHaveBeenCalled();
      });

      // Should set read-only mode for shared URLs
      await waitFor(() => {
        expect(screen.getByText('Read-Only Mode')).toBeInTheDocument();
      });
    });

    it('should handle URL loading failure gracefully', async () => {
      const invalidUrl = 'http://localhost:3000?d=invalid&v=1.0.0&s=5-1&r=0';
      mockLocation.href = invalidUrl;
      mockLocation.search = '?d=invalid&v=1.0.0&s=5-1&r=0';

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Should not crash and should show default state
      expect(screen.getByText('Volleyball Rotations Visualizer')).toBeInTheDocument();
    });

    it('should prioritize URL data over localStorage', async () => {
      // Set up localStorage with different data
      mockStorage.setItem('volleyball-positions', JSON.stringify({
        version: '1.0.0',
        lastModified: new Date(),
        positions: {
          '5-1': createTestPositionsState('5-1', 0, 'rotational'),
          '6-2': {},
        },
      }));

      // Set up URL with different data
      const urlPositions = createTestPositionsState('5-1', 1, 'serveReceive');
      const testUrl = createTestURL('5-1', 1, urlPositions);
      mockLocation.href = testUrl;
      mockLocation.search = new URL(testUrl).search;

      render(<Home />);

      await waitFor(() => {
        expect(mockPositionManager.setFormationPositions).toHaveBeenCalled();
      });

      // Should load URL data (rotation 1) not localStorage data (rotation 0)
      expect(screen.getByText('Loaded shared configuration from URL')).toBeInTheDocument();
    });
  });

  describe('Read-Only Mode for Shared URLs', () => {
    it('should enable read-only mode when loading from URL', async () => {
      const testPositions = createTestPositionsState('5-1', 0, 'rotational');
      const testUrl = createTestURL('5-1', 0, testPositions);
      
      mockLocation.href = testUrl;
      mockLocation.search = new URL(testUrl).search;

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Read-Only Mode')).toBeInTheDocument();
      });

      expect(screen.getByText('You\'re viewing a shared configuration')).toBeInTheDocument();
      expect(screen.getByText('Make Editable Copy')).toBeInTheDocument();
    });

    it('should create editable copy when requested', async () => {
      const testPositions = createTestPositionsState('5-1', 0, 'rotational');
      const testUrl = createTestURL('5-1', 0, testPositions);
      
      mockLocation.href = testUrl;
      mockLocation.search = new URL(testUrl).search;

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Make Editable Copy')).toBeInTheDocument();
      });

      const makeEditableButton = screen.getByText('Make Editable Copy');
      fireEvent.click(makeEditableButton);

      await waitFor(() => {
        expect(mockHistory.replaceState).toHaveBeenCalled();
        expect(mockPositionManager.saveImmediate).toHaveBeenCalled();
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/Created editable copy/)).toBeInTheDocument();
      });
    });

    it('should disable drag operations in read-only mode', async () => {
      const testPositions = createTestPositionsState('5-1', 0, 'rotational');
      const testUrl = createTestURL('5-1', 0, testPositions);
      
      mockLocation.href = testUrl;
      mockLocation.search = new URL(testUrl).search;

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Read-Only Mode')).toBeInTheDocument();
      });

      // All drag-related controls should be disabled
      const buttons = screen.getAllByRole('button');
      const disabledButtons = buttons.filter(button => 
        button.getAttribute('disabled') !== null ||
        button.getAttribute('title')?.includes('Disabled in read-only mode')
      );
      
      expect(disabledButtons.length).toBeGreaterThan(0);
    });
  });

  describe('URL Parameter Management', () => {
    it('should clear URL parameters when creating editable copy', async () => {
      const testPositions = createTestPositionsState('5-1', 0, 'rotational');
      const testUrl = createTestURL('5-1', 0, testPositions);
      
      mockLocation.href = testUrl;
      mockLocation.search = new URL(testUrl).search;

      render(<Home />);

      await waitFor(() => {
        const makeEditableButton = screen.getByText('Make Editable Copy');
        fireEvent.click(makeEditableButton);
      });

      await waitFor(() => {
        expect(mockHistory.replaceState).toHaveBeenCalledWith(
          {},
          '',
          'http://localhost:3000/'
        );
      });
    });

    it('should handle missing URL parameters gracefully', async () => {
      // URL with missing required parameters
      mockLocation.href = 'http://localhost:3000?s=5-1'; // Missing d, v, r
      mockLocation.search = '?s=5-1';

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      // Should not enter read-only mode
      expect(screen.queryByText('Read-Only Mode')).not.toBeInTheDocument();
      
      // Should use default/localStorage data
      expect(screen.getByText('Volleyball Rotations Visualizer')).toBeInTheDocument();
    });
  });

  describe('Error Handling in URL Sharing', () => {
    it('should handle URL generation errors', async () => {
      // Mock a position manager that throws during data access
      mockPositionManager.positions = null as any;

      render(<Home />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      const shareButton = screen.getByText('Share');
      
      // Should not crash when clicking share with invalid data
      expect(() => {
        fireEvent.click(shareButton);
      }).not.toThrow();
    });

    it('should show error feedback for URL generation failures', async () => {
      // Mock URLStateManager to throw
      vi.spyOn(URLStateManager, 'generateShareableURL').mockImplementation(() => {
        throw new Error('URL too large');
      });

      render(<Home />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading saved positions...')).not.toBeInTheDocument();
      });

      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);

      // Should show error feedback to user
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Failed to generate shareable URL')
        );
      });
    });

    it('should validate URL data integrity', () => {
      const testData = {
        system: '5-1' as const,
        rotation: 0,
        positions: createTestPositionsState('5-1', 0, 'rotational'),
        version: '1.0.0',
      };

      // Test with valid data
      const validUrl = URLStateManager.encodePositionsToURL(
        'http://localhost:3000',
        testData.system,
        testData.rotation,
        testData.positions
      );
      
      const decodedData = URLStateManager.decodePositionsFromURL(validUrl);
      
      expect(decodedData).toEqual(testData);
    });
  });

  describe('Cross-Browser URL Compatibility', () => {
    it('should generate URLs compatible with different browsers', () => {
      const testPositions = createTestPositionsState('5-1', 0, 'rotational');
      
      // Test URL generation
      const url = URLStateManager.generateShareableURL('5-1', 0, testPositions);
      
      // Should use URL-safe base64 encoding
      expect(url).not.toContain('+');
      expect(url).not.toContain('/');
      expect(url).not.toMatch(/=+$/); // No padding at end
      
      // Should be parseable
      const parsed = URLStateManager.decodePositionsFromURL(url);
      expect(parsed).not.toBeNull();
    });

    it('should handle URL length limitations', () => {
      // Create very large dataset
      const largePositions = createTestPositionsState('5-1', 0, 'rotational');
      
      // Add many positions to exceed typical URL limits
      for (let rotation = 0; rotation < 6; rotation++) {
        largePositions[rotation] = {
          rotational: {},
          serveReceive: {},
          base: {},
        };
        
        for (let i = 0; i < 50; i++) {
          largePositions[rotation].rotational[`player_${i}`] = {
            x: Math.random() * 600,
            y: Math.random() * 360,
            isCustom: true,
            lastModified: new Date(),
          };
        }
      }

      // Should use fallback compression and still work
      const url = URLStateManager.generateShareableURL('5-1', 0, largePositions);
      
      expect(url.length).toBeLessThan(2000); // Should compress to reasonable size
      
      const parsed = URLStateManager.decodePositionsFromURL(url);
      expect(parsed).not.toBeNull();
    });
  });
});