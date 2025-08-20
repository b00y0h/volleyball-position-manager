# Volleyball Rules Engine

A comprehensive TypeScript library for validating volleyball player positioning according to official overlap and rotation fault rules for indoor 6-on-6 volleyball.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Coordinate System](#coordinate-system)
- [Volleyball Rules](#volleyball-rules)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Integration Guide](#integration-guide)
- [Performance Considerations](#performance-considerations)
- [Contributing](#contributing)

## Installation

```bash
# If using as part of the volleyball visualizer project
import { VolleyballRulesEngine } from '@/volleyball-rules-engine';

# Or if published as a separate package
npm install volleyball-rules-engine
```

## Quick Start

```typescript
import {
  VolleyballRulesEngine,
  type PlayerState,
} from "@/volleyball-rules-engine";

// Define your players
const players: PlayerState[] = [
  {
    id: "1",
    displayName: "Alice",
    role: "OH1",
    slot: 4,
    x: 2.0,
    y: 3.0,
    isServer: false,
  },
  {
    id: "2",
    displayName: "Bob",
    role: "S",
    slot: 1,
    x: 7.0,
    y: 8.0,
    isServer: true,
  },
  // ... 4 more players for slots 2, 3, 5, 6
];

// Validate the lineup
const result = VolleyballRulesEngine.validateLineup(players);

if (result.isLegal) {
  console.log("✅ Formation is legal!");
} else {
  console.log("❌ Violations found:");
  result.violations.forEach((violation) => {
    console.log(`- ${violation.message}`);
  });
}

// Get constraints for drag operations
const constraints = VolleyballRulesEngine.getPlayerConstraints(4, players);
console.log(
  `Player 4 can move between x: ${constraints.minX}-${constraints.maxX}, y: ${constraints.minY}-${constraints.maxY}`
);
```

## Coordinate System

The volleyball rules engine uses a right-handed 2D coordinate system based on official volleyball court dimensions:

### Court Layout

```
Service Zone (y: 9.0 to 11.0)
┌─────────────────────────────────────┐
│                                     │ y = 11.0 (service zone end)
│           Service Zone              │
│                                     │
└─────────────────────────────────────┘ y = 9.0 (endline/service zone start)
┌─────────────────────────────────────┐
│  5 LB    6 MB    1 RB               │ y = 6.0 (back row area)
│                                     │
│                                     │
│  4 LF    3 MF    2 RF               │ y = 3.0 (front row area)
│                                     │
└─────────────────────────────────────┘ y = 0.0 (net)
x=0.0                               x=9.0
(left sideline)                (right sideline)
```

### Coordinate Specifications

- **X-axis**: 0.0 (left sideline) to 9.0 (right sideline) - 9 meters wide
- **Y-axis**: 0.0 (net) to 9.0 (endline) for regular play, 9.0 to 11.0 for service zone
- **Units**: Meters (real volleyball court dimensions)
- **Tolerance**: ±3cm (0.03m) for floating-point precision handling

### Rotation Slot Mapping

| Slot | Position     | Abbreviation | Typical Location |
| ---- | ------------ | ------------ | ---------------- |
| 1    | Right Back   | RB           | (7.5, 6.0)       |
| 2    | Right Front  | RF           | (7.5, 3.0)       |
| 3    | Middle Front | MF           | (4.5, 3.0)       |
| 4    | Left Front   | LF           | (1.5, 3.0)       |
| 5    | Left Back    | LB           | (1.5, 6.0)       |
| 6    | Middle Back  | MB           | (4.5, 6.0)       |

## Volleyball Rules

The engine validates positioning according to official volleyball overlap rules:

### Overlap Rules

1. **Front Row Order**: Left Front (4) must be left of Middle Front (3), which must be left of Right Front (2)

   - Rule: `LF.x < MF.x < RF.x` (with 3cm tolerance)

2. **Back Row Order**: Left Back (5) must be left of Middle Back (6), which must be left of Right Back (1)

   - Rule: `LB.x < MB.x < RB.x` (with 3cm tolerance)

3. **Front/Back Relationships**: Each front row player must be in front of their back row counterpart

   - LF (4) must be in front of LB (5): `LF.y < LB.y`
   - MF (3) must be in front of MB (6): `MF.y < MB.y`
   - RF (2) must be in front of RB (1): `RF.y < RB.y`

4. **Server Exemption**: The serving player is exempt from all overlap rules and may position in the service zone (y: 9.0-11.0)

### Violation Types

- **ROW_ORDER**: Left-to-right ordering violation within front or back row
- **FRONT_BACK**: Front player positioned behind their back row counterpart
- **MULTIPLE_SERVERS**: More than one player marked as server
- **INVALID_LINEUP**: Structural issues (wrong player count, duplicate slots, etc.)

## API Reference

### Main API Class

#### `VolleyballRulesEngine`

The primary interface for all volleyball rules validation and constraint operations.

##### Core Validation Methods

```typescript
// Validate complete lineup
static validateLineup(lineup: PlayerState[]): OverlapResult

// Check if specific position is valid
static isValidPosition(slot: RotationSlot, position: {x: number, y: number}, lineup: PlayerState[]): boolean
```

##### Constraint Calculation Methods

```typescript
// Get positioning constraints for drag operations
static getPlayerConstraints(slot: RotationSlot, lineup: PlayerState[]): PositionBounds

// Snap invalid position to nearest valid position
static snapToValidPosition(slot: RotationSlot, targetPosition: {x: number, y: number}, lineup: PlayerState[]): {x: number, y: number}
```

##### Position Helper Methods

```typescript
// Get position labels and information
static getSlotLabel(slot: RotationSlot): string
static getSlotColumn(slot: RotationSlot): "Left" | "Middle" | "Right"
static getSlotRow(slot: RotationSlot): "Front" | "Back"
static getPositionDescription(slot: RotationSlot): PositionDescription
```

##### Coordinate Conversion

```typescript
// Access to coordinate transformation utilities
static convertCoordinates: CoordinateTransformer
static convertState: StateConverter
```

##### Error Explanation

```typescript
// Get detailed violation explanations
static explainViolation(violation: Violation, lineup: PlayerState[]): string
```

### Core Types

#### `PlayerState`

```typescript
interface PlayerState {
  id: string; // Unique player identifier
  displayName: string; // Player name for display
  role: Role; // Player role (S, OH1, MB1, etc.)
  slot: RotationSlot; // Rotation slot (1-6)
  x: number; // X coordinate in meters (0-9)
  y: number; // Y coordinate in meters (0-11)
  isServer: boolean; // Whether player is currently serving
}
```

#### `OverlapResult`

```typescript
interface OverlapResult {
  isLegal: boolean; // Whether formation is legal
  violations: Violation[]; // Array of any violations found
}
```

#### `PositionBounds`

```typescript
interface PositionBounds {
  minX: number; // Minimum allowed X coordinate
  maxX: number; // Maximum allowed X coordinate
  minY: number; // Minimum allowed Y coordinate
  maxY: number; // Maximum allowed Y coordinate
  isConstrained: boolean; // Whether position is constrained by rules
  constraintReasons: string[]; // Human-readable constraint explanations
}
```

## Usage Examples

### Basic Validation

```typescript
import { VolleyballRulesEngine } from "@/volleyball-rules-engine";

// Create a legal formation
const legalFormation: PlayerState[] = [
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
    displayName: "Right Side",
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

const result = VolleyballRulesEngine.validateLineup(legalFormation);
console.log(result.isLegal); // true
```

### Handling Violations

```typescript
// Create formation with violations
const invalidFormation: PlayerState[] = [
  // ... players with MF positioned right of RF (violation)
];

const result = VolleyballRulesEngine.validateLineup(invalidFormation);
if (!result.isLegal) {
  result.violations.forEach((violation) => {
    const explanation = VolleyballRulesEngine.explainViolation(
      violation,
      invalidFormation
    );
    console.log(`Violation: ${explanation}`);
  });
}
```

### Real-time Drag Constraints

```typescript
// Get constraints for dragging middle front player
const constraints = VolleyballRulesEngine.getPlayerConstraints(
  3,
  currentFormation
);

// Use constraints in drag handler
function onPlayerDrag(newX: number, newY: number) {
  // Clamp to valid bounds
  const clampedX = Math.max(constraints.minX, Math.min(constraints.maxX, newX));
  const clampedY = Math.max(constraints.minY, Math.min(constraints.maxY, newY));

  // Update player position
  updatePlayerPosition(3, clampedX, clampedY);
}

// Or snap to valid position on drop
function onPlayerDrop(targetX: number, targetY: number) {
  const validPosition = VolleyballRulesEngine.snapToValidPosition(
    3,
    { x: targetX, y: targetY },
    currentFormation
  );
  updatePlayerPosition(3, validPosition.x, validPosition.y);
}
```

### Position Information

```typescript
// Get position information
for (let slot = 1; slot <= 6; slot++) {
  const description = VolleyballRulesEngine.getPositionDescription(
    slot as RotationSlot
  );
  console.log(
    `Slot ${slot}: ${description.fullName} (${description.abbreviation})`
  );
  console.log(`  Column: ${description.column}, Row: ${description.row}`);
}

// Output:
// Slot 1: Right Back (RB)
//   Column: Right, Row: Back
// Slot 2: Right Front (RF)
//   Column: Right, Row: Front
// ...
```

### Coordinate Conversion

```typescript
// Convert between screen coordinates (600x360) and volleyball coordinates (9x9m)
const screenCoords = { x: 300, y: 180 }; // Center of 600x360 screen
const vbCoords = VolleyballRulesEngine.convertCoordinates.screenToVolleyball(
  screenCoords.x,
  screenCoords.y
);
console.log(vbCoords); // { x: 4.5, y: 4.5 } - center of court

// Convert player states
const screenPlayer: ScreenPlayerState = {
  id: "1",
  displayName: "Player",
  role: "OH1",
  slot: 4,
  x: 100, // screen pixels
  y: 120, // screen pixels
  isServer: false,
};

const vbPlayer =
  VolleyballRulesEngine.convertState.toVolleyballCoordinates(screenPlayer);
console.log(vbPlayer.x, vbPlayer.y); // Volleyball court coordinates
```

## Integration Guide

### React Component Integration

```typescript
import React, { useState, useCallback } from "react";
import {
  VolleyballRulesEngine,
  type PlayerState,
  type PositionBounds,
} from "@/volleyball-rules-engine";

interface DraggablePlayerProps {
  player: PlayerState;
  allPlayers: PlayerState[];
  onPositionChange: (playerId: string, x: number, y: number) => void;
}

export function DraggablePlayer({
  player,
  allPlayers,
  onPositionChange,
}: DraggablePlayerProps) {
  const [constraints, setConstraints] = useState<PositionBounds | null>(null);

  const handleDragStart = useCallback(() => {
    // Calculate constraints when drag starts
    const bounds = VolleyballRulesEngine.getPlayerConstraints(
      player.slot,
      allPlayers
    );
    setConstraints(bounds);
  }, [player.slot, allPlayers]);

  const handleDrag = useCallback(
    (x: number, y: number) => {
      if (!constraints) return;

      // Clamp to valid bounds
      const clampedX = Math.max(
        constraints.minX,
        Math.min(constraints.maxX, x)
      );
      const clampedY = Math.max(
        constraints.minY,
        Math.min(constraints.maxY, y)
      );

      onPositionChange(player.id, clampedX, clampedY);
    },
    [constraints, player.id, onPositionChange]
  );

  const handleDragEnd = useCallback(
    (x: number, y: number) => {
      // Snap to valid position
      const validPosition = VolleyballRulesEngine.snapToValidPosition(
        player.slot,
        { x, y },
        allPlayers
      );

      onPositionChange(player.id, validPosition.x, validPosition.y);
      setConstraints(null);
    },
    [player.slot, player.id, allPlayers, onPositionChange]
  );

  // ... render draggable player component
}
```

### Validation Display Component

```typescript
import React from "react";
import {
  VolleyballRulesEngine,
  type OverlapResult,
  type PlayerState,
} from "@/volleyball-rules-engine";

interface ValidationDisplayProps {
  players: PlayerState[];
}

export function ValidationDisplay({ players }: ValidationDisplayProps) {
  const result = VolleyballRulesEngine.validateLineup(players);

  if (result.isLegal) {
    return <div className="text-green-600">✅ Formation is legal</div>;
  }

  return (
    <div className="text-red-600">
      <div>❌ Violations found:</div>
      <ul className="list-disc list-inside">
        {result.violations.map((violation, index) => {
          const explanation = VolleyballRulesEngine.explainViolation(
            violation,
            players
          );
          return <li key={index}>{explanation}</li>;
        })}
      </ul>
    </div>
  );
}
```

### Custom Hook for Position Management

```typescript
import { useState, useCallback, useMemo } from "react";
import {
  VolleyballRulesEngine,
  type PlayerState,
  type OverlapResult,
} from "@/volleyball-rules-engine";

export function useVolleyballPositions(initialPlayers: PlayerState[]) {
  const [players, setPlayers] = useState<PlayerState[]>(initialPlayers);

  const validationResult = useMemo(() => {
    return VolleyballRulesEngine.validateLineup(players);
  }, [players]);

  const updatePlayerPosition = useCallback(
    (playerId: string, x: number, y: number) => {
      setPlayers((prev) =>
        prev.map((player) =>
          player.id === playerId ? { ...player, x, y } : player
        )
      );
    },
    []
  );

  const getPlayerConstraints = useCallback(
    (slot: RotationSlot) => {
      return VolleyballRulesEngine.getPlayerConstraints(slot, players);
    },
    [players]
  );

  const isPositionValid = useCallback(
    (slot: RotationSlot, position: { x: number; y: number }) => {
      return VolleyballRulesEngine.isValidPosition(slot, position, players);
    },
    [players]
  );

  return {
    players,
    validationResult,
    updatePlayerPosition,
    getPlayerConstraints,
    isPositionValid,
  };
}
```

## Performance Considerations

### Optimization Strategies

The rules engine includes several performance optimizations for high-frequency operations:

1. **Memoization**: Constraint calculations are cached when player positions haven't changed
2. **Incremental Validation**: Only affected constraints are recalculated when a single player moves
3. **Lazy Evaluation**: Detailed violation information is only generated when requested
4. **Efficient Data Structures**: Optimized lookups for neighbor relationships and constraint queries

### Using Performance-Optimized Classes

```typescript
import {
  OptimizedConstraintCalculator,
  OptimizedCoordinateTransformer,
  PerformanceCache,
} from "@/volleyball-rules-engine";

// For high-performance applications with frequent updates
const optimizedConstraints = OptimizedConstraintCalculator.calculateValidBounds(
  slot,
  positions,
  isServer
);

// Use performance cache for repeated operations
const cache = new PerformanceCache();
const cachedResult = cache.getOrCompute("validation-key", () => {
  return VolleyballRulesEngine.validateLineup(players);
});
```

### Best Practices

1. **Batch Updates**: When updating multiple players, batch the updates and validate once
2. **Constraint Caching**: Cache constraint calculations for unchanged formations
3. **Selective Validation**: Use `isValidPosition` for single-position checks instead of full lineup validation
4. **Debounce Validation**: In real-time scenarios, debounce validation calls to avoid excessive computation

## Contributing

This rules engine is part of the volleyball visualizer project. When contributing:

1. **Maintain Test Coverage**: All new features must include comprehensive tests
2. **Follow Type Safety**: Use strict TypeScript types and avoid `any`
3. **Document Public APIs**: All public methods must have JSDoc documentation
4. **Performance Testing**: Include performance tests for optimization features
5. **Backward Compatibility**: Maintain API compatibility when making changes

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- volleyball-rules-engine

# Run with coverage
npm test -- --coverage
```

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

---

For more information about volleyball rules and positioning, refer to the official FIVB, NFHS, or NCAA volleyball rulebooks.
