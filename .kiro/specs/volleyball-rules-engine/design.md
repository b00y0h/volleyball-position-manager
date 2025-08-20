# Design Document

## Overview

The volleyball rules engine is a TypeScript library that validates player positioning according to official volleyball overlap and rotation fault rules. The engine operates on a precise coordinate system and provides both static validation and real-time constraint calculation for drag-and-drop interfaces. It integrates with the existing volleyball visualizer to prevent invalid positioning and provide rule compliance feedback.

The system is designed as a pure functional library with no external dependencies, making it easily testable and integrable with various UI frameworks. It follows the single responsibility principle by focusing solely on rule validation and constraint calculation, leaving UI concerns to consuming applications.

## Architecture

### Core Components

```
VolleyballRulesEngine/
├── types/
│   ├── PlayerState.ts          # Player data model and enums
│   ├── ValidationResult.ts     # Validation result interfaces
│   └── CoordinateSystem.ts     # Coordinate system constants
├── validation/
│   ├── OverlapValidator.ts     # Core overlap rule validation
│   ├── NeighborCalculator.ts   # Rotation neighbor relationships
│   └── ConstraintCalculator.ts # Real-time drag constraints
├── utils/
│   ├── CoordinateUtils.ts      # Coordinate transformation utilities
│   ├── ToleranceUtils.ts       # Floating-point tolerance handling
│   └── PositionHelpers.ts      # Position labeling and mapping
└── index.ts                    # Public API exports
```

### Integration Architecture

The rules engine integrates with the existing volleyball visualizer through a clean API boundary:

```
Existing Visualizer
├── DraggablePlayer.tsx ──────► ConstraintCalculator (real-time bounds)
├── PositionManager.ts ────────► OverlapValidator (validation)
└── ValidationDisplay.tsx ─────► ValidationResult (error display)
```

## Components and Interfaces

### Core Data Models

```typescript
// Player state representation
interface PlayerState {
  id: string;
  displayName: string;
  role: Role;
  slot: RotationSlot;
  x: number; // meters, 0-9 (court width)
  y: number; // meters, 0-9 (court length), service zone 9-11
  isServer: boolean;
}

// Role enumeration
type Role =
  | "S"
  | "OPP"
  | "OH1"
  | "OH2"
  | "MB1"
  | "MB2"
  | "L"
  | "DS"
  | "Unknown";

// Rotation slot mapping (1=RB, 2=RF, 3=MF, 4=LF, 5=LB, 6=MB)
type RotationSlot = 1 | 2 | 3 | 4 | 5 | 6;

// Validation result structure
interface OverlapResult {
  isLegal: boolean;
  violations: Violation[];
}

interface Violation {
  code: "ROW_ORDER" | "FRONT_BACK" | "MULTIPLE_SERVERS" | "INVALID_LINEUP";
  slots: RotationSlot[];
  message: string;
  coordinates?: { [slot: number]: { x: number; y: number } };
}
```

### Coordinate System Implementation

```typescript
// Court coordinate system constants
const COORDINATE_SYSTEM = {
  COURT_WIDTH: 9.0, // meters, x-axis
  COURT_LENGTH: 9.0, // meters, y-axis
  NET_Y: 0.0, // net position
  ENDLINE_Y: 9.0, // endline position
  SERVICE_ZONE_START: 9.0,
  SERVICE_ZONE_END: 11.0,
  LEFT_SIDELINE_X: 0.0,
  RIGHT_SIDELINE_X: 9.0,
  TOLERANCE: 0.03, // 3cm tolerance for floating-point comparisons
} as const;

// Coordinate transformation between screen and volleyball court coordinates
class CoordinateTransformer {
  // Convert from existing screen coordinates (600x360) to volleyball coordinates (9x9m)
  static screenToVolleyball(
    screenX: number,
    screenY: number
  ): { x: number; y: number };

  // Convert from volleyball coordinates to screen coordinates for display
  static volleyballToScreen(vbX: number, vbY: number): { x: number; y: number };

  // Validate coordinates are within acceptable bounds
  static isValidPosition(
    x: number,
    y: number,
    allowServiceZone: boolean
  ): boolean;
}
```

### Neighbor Relationship Calculator

```typescript
class NeighborCalculator {
  // Calculate left neighbor in same row (circular within row)
  static getLeftNeighbor(slot: RotationSlot): RotationSlot | null {
    const frontRow = [4, 3, 2]; // LF -> MF -> RF
    const backRow = [5, 6, 1]; // LB -> MB -> RB
    // Implementation handles circular relationships within each row
  }

  // Calculate right neighbor in same row
  static getRightNeighbor(slot: RotationSlot): RotationSlot | null;

  // Get front/back counterpart
  static getRowCounterpart(slot: RotationSlot): RotationSlot {
    // 4↔5 (LF↔LB), 3↔6 (MF↔MB), 2↔1 (RF↔RB)
  }

  // Determine if slot is front row
  static isFrontRow(slot: RotationSlot): boolean {
    return [2, 3, 4].includes(slot);
  }

  // Determine if slot is back row
  static isBackRow(slot: RotationSlot): boolean {
    return [1, 5, 6].includes(slot);
  }
}
```

### Overlap Validation Engine

```typescript
class OverlapValidator {
  // Main validation function
  static checkOverlap(lineup: PlayerState[]): OverlapResult {
    // 1. Validate input (6 players, unique slots, exactly 1 server)
    // 2. Build position map by slot
    // 3. Check row order constraints (excluding server)
    // 4. Check front/back constraints (excluding server pairs)
    // 5. Aggregate violations with detailed messages
  }

  // Validate front row left-to-right order: LF < MF < RF
  private static validateFrontRowOrder(
    positions: Map<RotationSlot, PlayerState>
  ): Violation[];

  // Validate back row left-to-right order: LB < MB < RB
  private static validateBackRowOrder(
    positions: Map<RotationSlot, PlayerState>
  ): Violation[];

  // Validate front players are in front of back counterparts
  private static validateFrontBackOrder(
    positions: Map<RotationSlot, PlayerState>
  ): Violation[];

  // Generate human-readable violation messages
  private static createViolationMessage(
    violation: Violation,
    positions: Map<RotationSlot, PlayerState>
  ): string;
}
```

### Real-time Constraint Calculator

```typescript
class ConstraintCalculator {
  // Calculate valid positioning bounds for a player during drag operations
  static calculateValidBounds(
    draggedSlot: RotationSlot,
    currentPositions: Map<RotationSlot, PlayerState>,
    isServer: boolean
  ): PositionBounds {
    // Calculate constraints based on:
    // 1. Left/right neighbor positions (if not server)
    // 2. Front/back counterpart position (if not server)
    // 3. Court boundaries
    // 4. Service zone allowance (if server)
  }

  // Check if a specific position would be valid for a player
  static isPositionValid(
    slot: RotationSlot,
    testPosition: { x: number; y: number },
    otherPositions: Map<RotationSlot, PlayerState>,
    isServer: boolean
  ): boolean;

  // Find nearest valid position if current position violates constraints
  static snapToValidPosition(
    slot: RotationSlot,
    targetPosition: { x: number; y: number },
    otherPositions: Map<RotationSlot, PlayerState>,
    isServer: boolean
  ): { x: number; y: number };
}

interface PositionBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  isConstrained: boolean;
  constraintReasons: string[];
}
```

## Data Models

### Player State Management

The engine maintains a clear separation between volleyball-specific data and UI concerns:

```typescript
// Internal volleyball coordinate system (meters)
interface VolleyballPlayerState extends PlayerState {
  // Inherits all PlayerState properties
  // Coordinates are in volleyball court meters (0-9 x, 0-11 y)
}

// Conversion utilities for existing screen coordinate system
interface ScreenPlayerState {
  // Same as PlayerState but coordinates in screen pixels (600x360)
  x: number; // 0-600 pixels
  y: number; // 0-360 pixels
}

// Bidirectional conversion
class StateConverter {
  static toVolleyballCoordinates(
    screenState: ScreenPlayerState
  ): VolleyballPlayerState;
  static toScreenCoordinates(vbState: VolleyballPlayerState): ScreenPlayerState;
}
```

### Validation Result Modeling

```typescript
// Detailed violation information for UI feedback
interface DetailedViolation extends Violation {
  affectedPlayers: {
    slot: RotationSlot;
    currentPosition: { x: number; y: number };
    requiredRelation: string; // e.g., "must be left of slot 3"
    suggestedPosition?: { x: number; y: number };
  }[];

  // Visual highlighting information for UI
  highlightPairs: Array<{
    slot1: RotationSlot;
    slot2: RotationSlot;
    violationType: "left-right" | "front-back";
  }>;
}

// Extended result with UI helper information
interface EnhancedOverlapResult extends OverlapResult {
  violations: DetailedViolation[];
  summary: {
    totalViolations: number;
    violationTypes: Record<string, number>;
    affectedSlots: RotationSlot[];
  };
}
```

## Error Handling

### Input Validation Strategy

```typescript
class InputValidator {
  // Comprehensive lineup validation
  static validateLineup(lineup: PlayerState[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check player count
    if (lineup.length !== 6) {
      errors.push({
        code: "INVALID_PLAYER_COUNT",
        message: `Expected 6 players, got ${lineup.length}`,
      });
    }

    // Check unique slots
    const slots = lineup.map((p) => p.slot);
    const uniqueSlots = new Set(slots);
    if (uniqueSlots.size !== 6) {
      errors.push({
        code: "DUPLICATE_SLOTS",
        message: "Each player must have a unique rotation slot",
      });
    }

    // Check server count
    const servers = lineup.filter((p) => p.isServer);
    if (servers.length !== 1) {
      errors.push({
        code: "INVALID_SERVER_COUNT",
        message: `Expected exactly 1 server, got ${servers.length}`,
      });
    }

    // Validate coordinates
    lineup.forEach((player, index) => {
      if (
        !CoordinateTransformer.isValidPosition(
          player.x,
          player.y,
          player.isServer
        )
      ) {
        errors.push({
          code: "INVALID_COORDINATES",
          message: `Player ${player.id} has invalid coordinates: (${player.x}, ${player.y})`,
          playerId: player.id,
        });
      }
    });

    return errors;
  }
}

interface ValidationError {
  code: string;
  message: string;
  playerId?: string;
}
```

### Tolerance and Precision Handling

```typescript
class ToleranceUtils {
  private static readonly EPSILON = 0.03; // 3cm tolerance

  // Floating-point safe comparison with tolerance
  static isLessOrEqual(a: number, b: number): boolean {
    return a <= b + this.EPSILON;
  }

  static isGreaterOrEqual(a: number, b: number): boolean {
    return a >= b - this.EPSILON;
  }

  static isEqual(a: number, b: number): boolean {
    return Math.abs(a - b) <= this.EPSILON;
  }

  // Apply tolerance to constraint calculations
  static applyTolerance(value: number, direction: "min" | "max"): number {
    return direction === "min" ? value - this.EPSILON : value + this.EPSILON;
  }
}
```

## Testing Strategy

### Unit Test Coverage

```typescript
// Core validation tests
describe("OverlapValidator", () => {
  describe("Legal formations", () => {
    test("should validate perfectly spaced receive formation");
    test("should validate server in each rotation slot");
    test("should handle libero in each back-row position");
  });

  describe("Violation detection", () => {
    test("should detect LF not left of MF violation");
    test("should detect MF not left of RF violation");
    test("should detect LB not left of MB violation");
    test("should detect MB not left of RB violation");
    test("should detect front player behind back counterpart");
    test("should detect multiple servers");
  });

  describe("Server exemptions", () => {
    test("should exempt server from row order constraints");
    test("should exempt server from front/back constraints");
    test("should still validate non-server players when server is exempt");
  });

  describe("Tolerance handling", () => {
    test("should pass positions within 3cm tolerance");
    test("should fail positions outside 3cm tolerance");
    test("should handle edge cases at exact tolerance boundaries");
  });
});

// Constraint calculation tests
describe("ConstraintCalculator", () => {
  describe("Boundary calculation", () => {
    test("should calculate correct left/right bounds for middle front player");
    test("should calculate correct front/back bounds for back row player");
    test("should handle server exemption in constraint calculation");
    test("should update constraints when other players move");
  });

  describe("Real-time validation", () => {
    test("should prevent invalid positioning during drag");
    test("should allow valid positioning during drag");
    test(
      "should snap to nearest valid position when released at invalid location"
    );
  });
});

// Integration tests
describe("Rules Engine Integration", () => {
  test("should integrate with existing coordinate system");
  test("should work with existing drag-and-drop system");
  test("should provide consistent validation across formation types");
});
```

### Fuzz Testing Strategy

```typescript
// Property-based testing for robustness
describe("Fuzz Testing", () => {
  test("should maintain consistency with small position perturbations", () => {
    // Generate legal formation
    // Apply random ±2cm perturbations
    // Verify formation remains legal
  });

  test("should detect violations with larger perturbations", () => {
    // Generate legal formation
    // Apply random ±10cm perturbations
    // Verify violations are detected when expected
  });

  test("should handle edge cases near court boundaries", () => {
    // Test positions near 0, 9, and service zone boundaries
  });
});
```

## Performance Considerations

### Optimization Strategies

1. **Memoization**: Cache constraint calculations for unchanged player positions
2. **Incremental Validation**: Only recalculate constraints for affected players when one player moves
3. **Spatial Indexing**: Use efficient data structures for neighbor lookups
4. **Lazy Evaluation**: Calculate detailed violation information only when requested

```typescript
class PerformanceOptimizedValidator {
  private static constraintCache = new Map<string, PositionBounds>();

  // Cache key based on relevant player positions
  private static getCacheKey(
    slot: RotationSlot,
    positions: Map<RotationSlot, PlayerState>
  ): string {
    // Include only positions that affect this slot's constraints
    const relevantSlots = this.getRelevantSlots(slot);
    const relevantPositions = relevantSlots.map(
      (s) => `${s}:${positions.get(s)?.x},${positions.get(s)?.y}`
    );
    return `${slot}:${relevantPositions.join("|")}`;
  }

  // Get cached constraints or calculate new ones
  static getCachedConstraints(
    slot: RotationSlot,
    positions: Map<RotationSlot, PlayerState>
  ): PositionBounds {
    const cacheKey = this.getCacheKey(slot, positions);

    if (this.constraintCache.has(cacheKey)) {
      return this.constraintCache.get(cacheKey)!;
    }

    const constraints = ConstraintCalculator.calculateValidBounds(
      slot,
      positions,
      positions.get(slot)?.isServer || false
    );
    this.constraintCache.set(cacheKey, constraints);
    return constraints;
  }
}
```

## Integration Points

### Existing Codebase Integration

The rules engine integrates with existing components through well-defined interfaces:

```typescript
// Enhanced DraggablePlayer component integration
interface DragConstraints {
  bounds: PositionBounds;
  isValid: (x: number, y: number) => boolean;
  snapToValid: (x: number, y: number) => { x: number; y: number };
}

// Enhanced PositionManager integration
interface RulesEnhancedPositionManager extends PositionManager {
  validateCurrentFormation(): OverlapResult;
  getConstraintsForPlayer(playerId: string): DragConstraints;
  onPlayerMove(playerId: string, newPosition: { x: number; y: number }): void;
}

// New validation display component
interface ValidationDisplayProps {
  validationResult: OverlapResult;
  onViolationClick: (violation: Violation) => void;
  showDetails: boolean;
}
```

### API Surface Design

```typescript
// Main public API
export class VolleyballRulesEngine {
  // Core validation
  static validateLineup(lineup: PlayerState[]): OverlapResult;

  // Real-time constraints
  static getPlayerConstraints(
    slot: RotationSlot,
    lineup: PlayerState[]
  ): PositionBounds;
  static isValidPosition(
    slot: RotationSlot,
    position: { x: number; y: number },
    lineup: PlayerState[]
  ): boolean;

  // Utility functions
  static getSlotLabel(slot: RotationSlot): string;
  static getSlotColumn(slot: RotationSlot): "Left" | "Middle" | "Right";
  static getSlotRow(slot: RotationSlot): "Front" | "Back";

  // Coordinate conversion
  static convertCoordinates: typeof CoordinateTransformer;

  // Error explanation
  static explainViolation(violation: Violation, lineup: PlayerState[]): string;
}

// Convenience exports
export {
  PlayerState,
  RotationSlot,
  Role,
  OverlapResult,
  Violation,
  PositionBounds,
};
export { COORDINATE_SYSTEM };
```

This design provides a comprehensive, testable, and performant volleyball rules engine that integrates seamlessly with the existing codebase while providing the constraint-based positioning functionality you requested.
