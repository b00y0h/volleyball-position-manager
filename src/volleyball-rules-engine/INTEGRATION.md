# Integration Guide: Volleyball Rules Engine

This guide shows how to integrate the Volleyball Rules Engine with the existing volleyball visualizer application to add real-time rule validation and constraint-based positioning.

## Table of Contents

- [Overview](#overview)
- [Quick Integration](#quick-integration)
- [Step-by-Step Integration](#step-by-step-integration)
- [Component Updates](#component-updates)
- [Hook Integration](#hook-integration)
- [State Management](#state-management)
- [Performance Optimization](#performance-optimization)
- [Testing Integration](#testing-integration)

## Overview

The Volleyball Rules Engine integrates with the existing volleyball visualizer by:

1. **Validating formations** in real-time as players are positioned
2. **Constraining drag operations** to prevent invalid positioning
3. **Providing visual feedback** about rule violations
4. **Snapping players** to valid positions when dropped at invalid locations

## Quick Integration

For a minimal integration, add validation to your existing position manager:

```typescript
// In your existing PositionManager or similar component
import { VolleyballRulesEngine } from "@/volleyball-rules-engine";

// Add validation to your position update logic
function updatePlayerPosition(playerId: string, x: number, y: number) {
  const updatedPlayers = players.map((p) =>
    p.id === playerId ? { ...p, x, y } : p
  );

  // Validate the new formation
  const validation = VolleyballRulesEngine.validateLineup(updatedPlayers);

  if (validation.isLegal) {
    setPlayers(updatedPlayers);
  } else {
    // Handle violations - show warnings or prevent update
    console.warn("Formation violations:", validation.violations);
  }
}
```

## Step-by-Step Integration

### Step 1: Update Player State Type

First, ensure your player state matches the rules engine's `PlayerState` interface:

```typescript
// Update your existing player type to match PlayerState
import type {
  PlayerState,
  Role,
  RotationSlot,
} from "@/volleyball-rules-engine";

// If your existing type is different, create a converter
function convertToRulesEnginePlayer(
  existingPlayer: YourPlayerType
): PlayerState {
  return {
    id: existingPlayer.id,
    displayName: existingPlayer.name,
    role: existingPlayer.position as Role, // Map your position to Role
    slot: existingPlayer.rotationSlot as RotationSlot,
    x: existingPlayer.x,
    y: existingPlayer.y,
    isServer: existingPlayer.isServing,
  };
}
```

### Step 2: Add Coordinate Conversion

If you're using screen coordinates, add conversion utilities:

```typescript
import { VolleyballRulesEngine } from "@/volleyball-rules-engine";

// Convert existing screen coordinates to volleyball coordinates
function convertPlayersToVolleyballCoords(
  screenPlayers: ScreenPlayer[]
): PlayerState[] {
  return screenPlayers.map((player) => ({
    ...player,
    ...VolleyballRulesEngine.convertCoordinates.screenToVolleyball(
      player.x,
      player.y
    ),
  }));
}

// Convert back to screen coordinates for display
function convertPlayersToScreenCoords(
  vbPlayers: PlayerState[]
): ScreenPlayer[] {
  return vbPlayers.map((player) => ({
    ...player,
    ...VolleyballRulesEngine.convertCoordinates.volleyballToScreen(
      player.x,
      player.y
    ),
  }));
}
```

### Step 3: Create Enhanced Position Manager Hook

Create a new hook that integrates the rules engine:

```typescript
// hooks/useEnhancedPositionManager.ts
import { useState, useCallback, useMemo } from "react";
import {
  VolleyballRulesEngine,
  type PlayerState,
  type PositionBounds,
} from "@/volleyball-rules-engine";

export function useEnhancedPositionManager(initialPlayers: PlayerState[]) {
  const [players, setPlayers] = useState<PlayerState[]>(initialPlayers);
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
  const [constraints, setConstraints] = useState<Map<string, PositionBounds>>(
    new Map()
  );

  // Real-time validation
  const validationResult = useMemo(() => {
    return VolleyballRulesEngine.validateLineup(players);
  }, [players]);

  // Start dragging with constraint calculation
  const startDrag = useCallback(
    (playerId: string) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      setDraggedPlayer(playerId);

      // Calculate constraints for this player
      const playerConstraints = VolleyballRulesEngine.getPlayerConstraints(
        player.slot,
        players
      );
      setConstraints((prev) => new Map(prev).set(playerId, playerConstraints));
    },
    [players]
  );

  // Update position with constraint enforcement
  const updatePlayerPosition = useCallback(
    (playerId: string, x: number, y: number) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      // Get constraints for this player
      const playerConstraints = constraints.get(playerId);

      // Apply constraints if available
      if (playerConstraints) {
        x = Math.max(
          playerConstraints.minX,
          Math.min(playerConstraints.maxX, x)
        );
        y = Math.max(
          playerConstraints.minY,
          Math.min(playerConstraints.maxY, y)
        );
      }

      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, x, y } : p))
      );
    },
    [players, constraints]
  );

  // End drag with position snapping
  const endDrag = useCallback(
    (playerId: string, finalX: number, finalY: number) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      // Snap to valid position
      const validPosition = VolleyballRulesEngine.snapToValidPosition(
        player.slot,
        { x: finalX, y: finalY },
        players
      );

      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? { ...p, x: validPosition.x, y: validPosition.y }
            : p
        )
      );

      setDraggedPlayer(null);
      setConstraints((prev) => {
        const newConstraints = new Map(prev);
        newConstraints.delete(playerId);
        return newConstraints;
      });
    },
    [players]
  );

  return {
    players,
    validationResult,
    draggedPlayer,
    constraints,
    startDrag,
    updatePlayerPosition,
    endDrag,
  };
}
```

### Step 4: Update Draggable Player Component

Enhance your existing draggable player component:

```typescript
// components/EnhancedDraggablePlayer.tsx
import React, { useCallback } from "react";
import {
  VolleyballRulesEngine,
  type PlayerState,
  type PositionBounds,
} from "@/volleyball-rules-engine";

interface EnhancedDraggablePlayerProps {
  player: PlayerState;
  constraints?: PositionBounds;
  isDragging: boolean;
  onDragStart: () => void;
  onDrag: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
}

export function EnhancedDraggablePlayer({
  player,
  constraints,
  isDragging,
  onDragStart,
  onDrag,
  onDragEnd,
}: EnhancedDraggablePlayerProps) {
  // Get position information
  const positionLabel = VolleyballRulesEngine.getSlotLabel(player.slot);
  const positionDescription = VolleyballRulesEngine.getPositionDescription(
    player.slot
  );

  // Handle drag with constraints
  const handleDrag = useCallback(
    (x: number, y: number) => {
      if (constraints) {
        // Apply constraints in real-time
        const constrainedX = Math.max(
          constraints.minX,
          Math.min(constraints.maxX, x)
        );
        const constrainedY = Math.max(
          constraints.minY,
          Math.min(constraints.maxY, y)
        );
        onDrag(constrainedX, constrainedY);
      } else {
        onDrag(x, y);
      }
    },
    [constraints, onDrag]
  );

  return (
    <div
      className={`
        draggable-player
        ${isDragging ? "dragging" : ""}
        ${player.isServer ? "server" : ""}
        ${constraints?.isConstrained ? "constrained" : ""}
      `}
      onDragStart={onDragStart}
      onDrag={handleDrag}
      onDragEnd={onDragEnd}
      title={`${player.displayName} - ${positionDescription.fullName} (${positionLabel})`}
    >
      <div className="player-info">
        <div className="position-label">{positionLabel}</div>
        <div className="slot-number">{player.slot}</div>
        {player.isServer && <div className="server-indicator">🏐</div>}
      </div>

      {/* Show constraint indicator when dragging */}
      {isDragging && constraints?.isConstrained && (
        <div className="constraint-indicator">
          <div className="constraint-bounds">
            X: {constraints.minX.toFixed(1)}-{constraints.maxX.toFixed(1)}
            Y: {constraints.minY.toFixed(1)}-{constraints.maxY.toFixed(1)}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Step 5: Add Validation Display Component

Create a component to show validation results:

```typescript
// components/ValidationDisplay.tsx
import React from "react";
import {
  VolleyballRulesEngine,
  type OverlapResult,
  type PlayerState,
} from "@/volleyball-rules-engine";

interface ValidationDisplayProps {
  validationResult: OverlapResult;
  players: PlayerState[];
  onViolationClick?: (violation: Violation) => void;
}

export function ValidationDisplay({
  validationResult,
  players,
  onViolationClick,
}: ValidationDisplayProps) {
  if (validationResult.isLegal) {
    return (
      <div className="validation-success">
        <span className="success-icon">✅</span>
        <span>Formation is legal</span>
      </div>
    );
  }

  return (
    <div className="validation-errors">
      <div className="error-header">
        <span className="error-icon">❌</span>
        <span>{validationResult.violations.length} violation(s) found</span>
      </div>

      <div className="violations-list">
        {validationResult.violations.map((violation, index) => {
          const explanation = VolleyballRulesEngine.explainViolation(
            violation,
            players
          );

          return (
            <div
              key={index}
              className="violation-item"
              onClick={() => onViolationClick?.(violation)}
            >
              <div className="violation-type">{violation.code}</div>
              <div className="violation-explanation">{explanation}</div>
              <div className="affected-slots">
                Slots: {violation.slots.join(", ")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## Component Updates

### Update Main Page Component

Integrate the enhanced position manager into your main page:

```typescript
// app/page.tsx (or your main component)
import React from "react";
import { useEnhancedPositionManager } from "@/hooks/useEnhancedPositionManager";
import { EnhancedDraggablePlayer } from "@/components/EnhancedDraggablePlayer";
import { ValidationDisplay } from "@/components/ValidationDisplay";
import {
  VolleyballRulesEngine,
  type PlayerState,
} from "@/volleyball-rules-engine";

// Initial formation
const initialPlayers: PlayerState[] = [
  {
    id: "1",
    displayName: "Setter",
    role: "S",
    slot: 1,
    x: 8.0,
    y: 6.0,
    isServer: true,
  },
  {
    id: "2",
    displayName: "Opposite",
    role: "OPP",
    slot: 2,
    x: 7.0,
    y: 3.0,
    isServer: false,
  },
  {
    id: "3",
    displayName: "Middle",
    role: "MB1",
    slot: 3,
    x: 4.5,
    y: 3.0,
    isServer: false,
  },
  {
    id: "4",
    displayName: "Outside",
    role: "OH1",
    slot: 4,
    x: 2.0,
    y: 3.0,
    isServer: false,
  },
  {
    id: "5",
    displayName: "Libero",
    role: "L",
    slot: 5,
    x: 1.0,
    y: 6.0,
    isServer: false,
  },
  {
    id: "6",
    displayName: "Middle Back",
    role: "MB2",
    slot: 6,
    x: 4.5,
    y: 6.0,
    isServer: false,
  },
];

export default function VolleyballVisualizer() {
  const {
    players,
    validationResult,
    draggedPlayer,
    constraints,
    startDrag,
    updatePlayerPosition,
    endDrag,
  } = useEnhancedPositionManager(initialPlayers);

  return (
    <div className="volleyball-visualizer">
      <h1>Volleyball Formation Visualizer</h1>

      {/* Validation Display */}
      <ValidationDisplay
        validationResult={validationResult}
        players={players}
      />

      {/* Court with Players */}
      <div className="court-container">
        <svg className="volleyball-court" viewBox="0 0 600 360">
          {/* Court lines and markings */}
          <CourtLines />

          {/* Players */}
          {players.map((player) => (
            <EnhancedDraggablePlayer
              key={player.id}
              player={player}
              constraints={constraints.get(player.id)}
              isDragging={draggedPlayer === player.id}
              onDragStart={() => startDrag(player.id)}
              onDrag={(x, y) => updatePlayerPosition(player.id, x, y)}
              onDragEnd={(x, y) => endDrag(player.id, x, y)}
            />
          ))}
        </svg>
      </div>

      {/* Player Information */}
      <div className="player-info-panel">
        <h3>Current Formation</h3>
        {players.map((player) => {
          const description = VolleyballRulesEngine.getPositionDescription(
            player.slot
          );
          return (
            <div key={player.id} className="player-info-item">
              <span>{player.displayName}</span>
              <span>
                {description.fullName} ({description.abbreviation})
              </span>
              <span>
                ({player.x.toFixed(1)}, {player.y.toFixed(1)})
              </span>
              {player.isServer && <span>🏐</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## Hook Integration

### Integrate with Existing Hooks

If you have existing position management hooks, you can enhance them:

```typescript
// Enhance existing usePositionManager hook
import { usePositionManager } from "@/hooks/usePositionManager";
import { VolleyballRulesEngine } from "@/volleyball-rules-engine";

export function useEnhancedPositionManager(initialPlayers) {
  const baseManager = usePositionManager(initialPlayers);

  // Add validation layer
  const validationResult = useMemo(() => {
    return VolleyballRulesEngine.validateLineup(baseManager.players);
  }, [baseManager.players]);

  // Enhance position updates with constraints
  const updatePlayerPosition = useCallback(
    (playerId, x, y) => {
      const player = baseManager.players.find((p) => p.id === playerId);
      if (!player) return;

      // Check if position is valid
      if (
        VolleyballRulesEngine.isValidPosition(
          player.slot,
          { x, y },
          baseManager.players
        )
      ) {
        baseManager.updatePlayerPosition(playerId, x, y);
      } else {
        // Snap to valid position
        const validPosition = VolleyballRulesEngine.snapToValidPosition(
          player.slot,
          { x, y },
          baseManager.players
        );
        baseManager.updatePlayerPosition(
          playerId,
          validPosition.x,
          validPosition.y
        );
      }
    },
    [baseManager]
  );

  return {
    ...baseManager,
    validationResult,
    updatePlayerPosition, // Override with enhanced version
  };
}
```

## State Management

### Integration with State Management Libraries

If using Redux, Zustand, or similar:

```typescript
// Redux integration example
import { createSlice } from "@reduxjs/toolkit";
import { VolleyballRulesEngine } from "@/volleyball-rules-engine";

const volleyballSlice = createSlice({
  name: "volleyball",
  initialState: {
    players: [],
    validationResult: { isLegal: true, violations: [] },
    constraints: new Map(),
  },
  reducers: {
    updatePlayerPosition: (state, action) => {
      const { playerId, x, y } = action.payload;

      // Update player position
      const playerIndex = state.players.findIndex((p) => p.id === playerId);
      if (playerIndex >= 0) {
        state.players[playerIndex].x = x;
        state.players[playerIndex].y = y;

        // Update validation
        state.validationResult = VolleyballRulesEngine.validateLineup(
          state.players
        );
      }
    },

    startDrag: (state, action) => {
      const { playerId } = action.payload;
      const player = state.players.find((p) => p.id === playerId);

      if (player) {
        const constraints = VolleyballRulesEngine.getPlayerConstraints(
          player.slot,
          state.players
        );
        state.constraints.set(playerId, constraints);
      }
    },

    endDrag: (state, action) => {
      const { playerId } = action.payload;
      state.constraints.delete(playerId);
    },
  },
});
```

## Performance Optimization

### Optimize for Frequent Updates

For applications with frequent position updates:

```typescript
import {
  OptimizedConstraintCalculator,
  PerformanceCache,
} from "@/volleyball-rules-engine";

// Use performance cache for expensive operations
const validationCache = new PerformanceCache();

function useOptimizedValidation(players) {
  return useMemo(() => {
    const cacheKey = players
      .map((p) => `${p.id}:${p.x}:${p.y}:${p.isServer}`)
      .join("|");

    return validationCache.getOrCompute(cacheKey, () => {
      return VolleyballRulesEngine.validateLineup(players);
    });
  }, [players]);
}

// Use optimized constraint calculator
function useOptimizedConstraints(slot, players) {
  return useMemo(() => {
    const slotMap = new Map(players.map((p) => [p.slot, p]));
    const player = slotMap.get(slot);

    return OptimizedConstraintCalculator.calculateValidBounds(
      slot,
      slotMap,
      player?.isServer || false
    );
  }, [slot, players]);
}
```

### Debounce Validation

For real-time drag operations:

```typescript
import { useDebouncedCallback } from "use-debounce";

function useDebounceValidation(players) {
  const [validationResult, setValidationResult] = useState({
    isLegal: true,
    violations: [],
  });

  const debouncedValidation = useDebouncedCallback(
    (playersToValidate) => {
      const result = VolleyballRulesEngine.validateLineup(playersToValidate);
      setValidationResult(result);
    },
    100 // 100ms debounce
  );

  useEffect(() => {
    debouncedValidation(players);
  }, [players, debouncedValidation]);

  return validationResult;
}
```

## Testing Integration

### Test Enhanced Components

```typescript
// __tests__/EnhancedDraggablePlayer.test.tsx
import { render, fireEvent } from "@testing-library/react";
import { EnhancedDraggablePlayer } from "@/components/EnhancedDraggablePlayer";
import { VolleyballRulesEngine } from "@/volleyball-rules-engine";

describe("EnhancedDraggablePlayer", () => {
  const mockPlayer = {
    id: "1",
    displayName: "Test Player",
    role: "OH1" as const,
    slot: 4 as const,
    x: 2.0,
    y: 3.0,
    isServer: false,
  };

  it("should display position label correctly", () => {
    const { getByText } = render(
      <EnhancedDraggablePlayer
        player={mockPlayer}
        isDragging={false}
        onDragStart={jest.fn()}
        onDrag={jest.fn()}
        onDragEnd={jest.fn()}
      />
    );

    const label = VolleyballRulesEngine.getSlotLabel(mockPlayer.slot);
    expect(getByText(label)).toBeInTheDocument();
  });

  it("should apply constraints during drag", () => {
    const constraints = {
      minX: 1.0,
      maxX: 3.0,
      minY: 2.0,
      maxY: 4.0,
      isConstrained: true,
      constraintReasons: ["Test constraint"],
    };

    const onDrag = jest.fn();

    const { container } = render(
      <EnhancedDraggablePlayer
        player={mockPlayer}
        constraints={constraints}
        isDragging={true}
        onDragStart={jest.fn()}
        onDrag={onDrag}
        onDragEnd={jest.fn()}
      />
    );

    // Simulate drag beyond constraints
    fireEvent.drag(container.firstChild, { clientX: 500, clientY: 500 });

    // Should be clamped to constraint bounds
    expect(onDrag).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/rules-engine-integration.test.tsx
import { renderHook, act } from "@testing-library/react";
import { useEnhancedPositionManager } from "@/hooks/useEnhancedPositionManager";

describe("Rules Engine Integration", () => {
  const initialPlayers = [
    // ... test players
  ];

  it("should validate formation in real-time", () => {
    const { result } = renderHook(() =>
      useEnhancedPositionManager(initialPlayers)
    );

    // Initial formation should be legal
    expect(result.current.validationResult.isLegal).toBe(true);

    // Move player to invalid position
    act(() => {
      result.current.updatePlayerPosition("3", 1.0, 3.0); // MF too far left
    });

    // Should detect violation
    expect(result.current.validationResult.isLegal).toBe(false);
    expect(result.current.validationResult.violations).toHaveLength(1);
  });

  it("should calculate constraints correctly", () => {
    const { result } = renderHook(() =>
      useEnhancedPositionManager(initialPlayers)
    );

    act(() => {
      result.current.startDrag("3"); // Middle Front
    });

    const constraints = result.current.constraints.get("3");
    expect(constraints).toBeDefined();
    expect(constraints?.isConstrained).toBe(true);
    expect(constraints?.minX).toBeGreaterThan(0);
    expect(constraints?.maxX).toBeLessThan(9);
  });
});
```

This integration guide provides a comprehensive approach to adding the Volleyball Rules Engine to your existing application while maintaining compatibility with your current architecture and providing enhanced functionality for rule validation and constraint-based positioning.
