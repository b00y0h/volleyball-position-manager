import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { NotificationProvider } from '@/components/NotificationSystem';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SystemType, FormationType, PlayerPosition, CustomPositionsState } from '@/types';

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for responsive components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for scroll-based components
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

// Mock URL for testing URL state management
const mockURL = {
  href: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  pathname: '/',
  search: '',
  searchParams: new URLSearchParams(),
};

Object.defineProperty(window, 'location', {
  writable: true,
  value: mockURL,
});

// Mock history for URL manipulation tests
Object.defineProperty(window, 'history', {
  writable: true,
  value: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
  },
});

// Mock clipboard API for URL sharing tests
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

// Test wrapper component with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NotificationProvider>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </NotificationProvider>
  );
};

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestWrapper, ...options });

// Mock position manager for testing
export const createMockPositionManager = () => ({
  positions: {
    '5-1': {} as CustomPositionsState,
    '6-2': {} as CustomPositionsState,
  },
  isLoading: false,
  error: null,
  
  // Position getters
  getPosition: vi.fn().mockReturnValue(null),
  getFormationPositions: vi.fn().mockReturnValue({}),
  getAllPositions: vi.fn().mockReturnValue({
    rotational: {},
    serveReceive: {},
    base: {},
  }),
  
  // Position setters
  setPosition: vi.fn().mockReturnValue(true),
  setFormationPositions: vi.fn().mockReturnValue(true),
  
  // Position validation
  validatePosition: vi.fn().mockReturnValue({ isValid: true }),
  
  // Customization checks
  isPositionCustomized: vi.fn().mockReturnValue(false),
  isFormationCustomized: vi.fn().mockReturnValue(false),
  isRotationCustomized: vi.fn().mockReturnValue(false),
  isSystemCustomized: vi.fn().mockReturnValue(false),
  
  // Reset operations
  resetPosition: vi.fn(),
  resetFormation: vi.fn(),
  resetRotation: vi.fn(),
  resetSystem: vi.fn(),
  resetAll: vi.fn(),
  
  // Utility methods
  clearError: vi.fn(),
  saveImmediate: vi.fn(),
});

// Mock court dimensions for consistent testing
export const mockCourtDimensions = {
  courtWidth: 600,
  courtHeight: 360,
};

// Test data factories
export const createTestPosition = (overrides?: Partial<PlayerPosition>): PlayerPosition => ({
  x: 300,
  y: 180,
  isCustom: false,
  lastModified: new Date('2023-01-01'),
  ...overrides,
});

export const createTestPlayer = (overrides?: Partial<{ id: string; name: string; role: string }>) => ({
  id: 'S',
  name: 'Setter',
  role: 'S',
  ...overrides,
});

export const createTestRotationData = (system: SystemType): Record<number, string> => {
  if (system === '5-1') {
    return {
      1: 'S',
      2: 'OH1',
      3: 'MB1',
      4: 'Opp',
      5: 'OH2',
      6: 'MB2',
    };
  } else {
    return {
      1: 'S1',
      2: 'OH1',
      3: 'MB1',
      4: 'S2',
      5: 'OH2',
      6: 'MB2',
    };
  }
};

export const createTestPositionsState = (
  system: SystemType,
  rotation: number,
  formation: FormationType,
  customPositions?: Record<string, PlayerPosition>
): CustomPositionsState => {
  const rotationData = createTestRotationData(system);
  const positions: Record<string, PlayerPosition> = {};
  
  // Create default positions for all players
  Object.values(rotationData).forEach((playerId, index) => {
    positions[playerId] = createTestPosition({
      x: 100 + (index * 80),
      y: 100 + (index % 2) * 80,
      isCustom: false,
    });
  });
  
  // Override with custom positions if provided
  if (customPositions) {
    Object.assign(positions, customPositions);
  }
  
  return {
    [rotation]: {
      rotational: formation === 'rotational' ? positions : {},
      serveReceive: formation === 'serveReceive' ? positions : {},
      base: formation === 'base' ? positions : {},
    },
  };
};

// Utility to wait for animations
export const waitForAnimation = (duration = 100) => 
  new Promise(resolve => setTimeout(resolve, duration));

// Utility to simulate drag events
export const simulateDragEvent = (
  element: Element,
  startPos: { x: number; y: number },
  endPos: { x: number; y: number }
) => {
  // Mock drag start
  element.dispatchEvent(new MouseEvent('mousedown', {
    clientX: startPos.x,
    clientY: startPos.y,
    bubbles: true,
  }));
  
  // Mock drag move
  element.dispatchEvent(new MouseEvent('mousemove', {
    clientX: endPos.x,
    clientY: endPos.y,
    bubbles: true,
  }));
  
  // Mock drag end
  element.dispatchEvent(new MouseEvent('mouseup', {
    clientX: endPos.x,
    clientY: endPos.y,
    bubbles: true,
  }));
};

// Utility to create URL with position data
export const createTestURL = (
  system: SystemType,
  rotation: number,
  positionData?: CustomPositionsState
): string => {
  const baseUrl = 'http://localhost:3000';
  
  if (!positionData) {
    return baseUrl;
  }
  
  const urlData = {
    system,
    rotation,
    positions: positionData,
    version: '1.0.0',
  };
  
  const compressed = btoa(JSON.stringify(urlData));
  const params = new URLSearchParams({
    d: compressed,
    v: '1.0.0',
    s: system,
    r: rotation.toString(),
  });
  
  return `${baseUrl}?${params.toString()}`;
};

// Utility to mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
};

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const startTime = performance.now();
  renderFn();
  await waitForAnimation(50); // Allow for render completion
  return performance.now() - startTime;
};

export const createLargeDataset = (
  size: number,
  system: SystemType = '5-1'
): CustomPositionsState => {
  const dataset: CustomPositionsState = {};
  
  for (let rotation = 0; rotation < 6; rotation++) {
    const rotationData = createTestRotationData(system);
    const positions: Record<string, PlayerPosition> = {};
    
    Object.values(rotationData).forEach((playerId, index) => {
      // Create multiple variations for performance testing
      for (let i = 0; i < size; i++) {
        positions[`${playerId}_${i}`] = createTestPosition({
          x: Math.random() * 600,
          y: Math.random() * 360,
          isCustom: Math.random() > 0.5,
          lastModified: new Date(Date.now() - Math.random() * 86400000),
        });
      }
    });
    
    dataset[rotation] = {
      rotational: { ...positions },
      serveReceive: { ...positions },
      base: { ...positions },
    };
  }
  
  return dataset;
};

// Visual regression test utilities
export const captureElementSnapshot = (element: HTMLElement): string => {
  // Simple snapshot representation for testing
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  
  return JSON.stringify({
    tagName: element.tagName,
    className: element.className,
    width: rect.width,
    height: rect.height,
    backgroundColor: styles.backgroundColor,
    color: styles.color,
    childCount: element.children.length,
    textContent: element.textContent?.substring(0, 100),
  });
};

// Error boundary testing utilities
export const ThrowError: React.FC<{ shouldThrow: boolean; message?: string }> = ({
  shouldThrow,
  message = 'Test error',
}) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>No error</div>;
};

// Re-export testing library utilities with custom render
export * from '@testing-library/react';
export { customRender as render };
export { vi } from 'vitest';