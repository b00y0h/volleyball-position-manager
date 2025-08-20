# Volleyball Rules Engine API Reference

This document provides a comprehensive reference for all public APIs in the Volleyball Rules Engine.

## Table of Contents

- [Main API Class](#main-api-class)
- [Core Types](#core-types)
- [Utility Classes](#utility-classes)
- [Constants](#constants)
- [Type Guards](#type-guards)
- [Validation Utilities](#validation-utilities)
- [Performance Classes](#performance-classes)
- [Error Handling](#error-handling)

## Main API Class

### `VolleyballRulesEngine`

The primary interface for all volleyball rules validation and constraint operations.

#### Core Validation Methods

##### `validateLineup(lineup: PlayerState[]): OverlapResult`

Validates a complete lineup for overlap rule compliance.

**Parameters:**

- `lineup` - Array of exactly 6 players with positions and rotation slots

**Returns:**

- `OverlapResult` - Validation result indicating if lineup is legal and any violations

**Example:**

```typescript
const result = VolleyballRulesEngine.validateLineup(players);
if (!result.isLegal) {
  console.log("Violations:", result.violations);
}
```

**Validation Rules:**

- Front row order: LF < MF < RF (x coordinates)
- Back row order: LB < MB < RB (x coordinates)
- Front/back relationships: Front players in front of back counterparts
- Server exemptions: Server exempt from overlap rules

---

##### `isValidPosition(slot: RotationSlot, position: Point, lineup: PlayerState[]): boolean`

Checks if a specific position would be valid for a player without modifying the lineup.

**Parameters:**

- `slot` - The rotation slot to test (1-6)
- `position` - The position coordinates to test `{x: number, y: number}`
- `lineup` - Current lineup of all players

**Returns:**

- `boolean` - True if the position would be valid, false otherwise

**Example:**

```typescript
const isValid = VolleyballRulesEngine.isValidPosition(
  3, // Middle Front
  { x: 4.5, y: 2.0 },
  currentPlayers
);
```

#### Constraint Calculation Methods

##### `getPlayerConstraints(slot: RotationSlot, lineup: PlayerState[]): PositionBounds`

Calculates valid positioning bounds for a player during drag operations.

**Parameters:**

- `slot` - The rotation slot to calculate constraints for (1-6)
- `lineup` - Current lineup of all players

**Returns:**

- `PositionBounds` - Position bounds with min/max coordinates and constraint reasons

**Example:**

```typescript
const bounds = VolleyballRulesEngine.getPlayerConstraints(3, players);
console.log(`X range: ${bounds.minX} to ${bounds.maxX}`);
console.log(`Y range: ${bounds.minY} to ${bounds.maxY}`);
```

**Constraint Types:**

- Left/right neighbor constraints
- Front/back counterpart constraints
- Court boundary constraints
- Service zone allowances (for servers)

---

##### `snapToValidPosition(slot: RotationSlot, targetPosition: Point, lineup: PlayerState[]): Point`

Finds the nearest valid position if the target position violates constraints.

**Parameters:**

- `slot` - The rotation slot
- `targetPosition` - The desired position `{x: number, y: number}`
- `lineup` - Current lineup of all players

**Returns:**

- `Point` - The nearest valid position within constraints

**Example:**

```typescript
const validPosition = VolleyballRulesEngine.snapToValidPosition(
  3,
  { x: 4.5, y: 2.0 },
  players
);
```

#### Position Helper Methods

##### `getSlotLabel(slot: RotationSlot): string`

Gets the standard position label for a rotation slot.

**Parameters:**

- `slot` - Rotation slot (1-6)

**Returns:**

- `string` - Position label (e.g., "RB", "LF", "MF")

**Slot Mappings:**

- 1 → "RB" (Right Back)
- 2 → "RF" (Right Front)
- 3 → "MF" (Middle Front)
- 4 → "LF" (Left Front)
- 5 → "LB" (Left Back)
- 6 → "MB" (Middle Back)

---

##### `getSlotColumn(slot: RotationSlot): Column`

Gets the column (Left/Middle/Right) for a rotation slot.

**Parameters:**

- `slot` - Rotation slot (1-6)

**Returns:**

- `Column` - "Left" | "Middle" | "Right"

---

##### `getSlotRow(slot: RotationSlot): Row`

Gets the row (Front/Back) for a rotation slot.

**Parameters:**

- `slot` - Rotation slot (1-6)

**Returns:**

- `Row` - "Front" | "Back"

---

##### `getPositionDescription(slot: RotationSlot): PositionDescription`

Gets detailed position information for a rotation slot.

**Parameters:**

- `slot` - Rotation slot (1-6)

**Returns:**

- `PositionDescription` - Complete position description

**Example:**

```typescript
const desc = VolleyballRulesEngine.getPositionDescription(4);
console.log(desc.fullName); // "Left Front"
console.log(desc.abbreviation); // "LF"
console.log(desc.column); // "Left"
console.log(desc.row); // "Front"
```

#### Coordinate Conversion

##### `convertCoordinates: CoordinateTransformer`

Access to coordinate transformation utilities.

**Methods:**

- `screenToVolleyball(screenX, screenY)` - Convert screen to volleyball coordinates
- `volleyballToScreen(vbX, vbY)` - Convert volleyball to screen coordinates
- `isValidPosition(x, y, allowServiceZone?)` - Validate coordinate bounds

---

##### `convertState: StateConverter`

Access to state conversion utilities.

**Methods:**

- `toVolleyballCoordinates(screenState)` - Convert screen player state to volleyball coordinates
- `toScreenCoordinates(vbState)` - Convert volleyball player state to screen coordinates

#### Error Explanation

##### `explainViolation(violation: Violation, lineup: PlayerState[]): string`

Generates a detailed human-readable explanation of a violation.

**Parameters:**

- `violation` - The violation to explain
- `lineup` - The lineup where the violation occurred

**Returns:**

- `string` - Detailed explanation string

**Example:**

```typescript
result.violations.forEach((violation) => {
  const explanation = VolleyballRulesEngine.explainViolation(
    violation,
    players
  );
  console.log(explanation);
});
```

#### Constants

##### `COORDINATE_SYSTEM`

Access to coordinate system constants and configuration.

**Properties:**

- `COURT_WIDTH: 9.0` - Court width in meters
- `COURT_LENGTH: 9.0` - Court length in meters
- `NET_Y: 0.0` - Net position
- `ENDLINE_Y: 9.0` - Endline position
- `SERVICE_ZONE_START: 9.0` - Service zone start
- `SERVICE_ZONE_END: 11.0` - Service zone end
- `LEFT_SIDELINE_X: 0.0` - Left sideline
- `RIGHT_SIDELINE_X: 9.0` - Right sideline
- `TOLERANCE: 0.03` - 3cm tolerance for comparisons

## Core Types

### `PlayerState`

Complete player state with position and metadata.

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

### `OverlapResult`

Result of overlap validation.

```typescript
interface OverlapResult {
  isLegal: boolean; // Whether formation is legal
  violations: Violation[]; // Array of any violations found
}
```

### `Violation`

Individual violation with details.

```typescript
interface Violation {
  code: ViolationCode; // Type of violation
  slots: RotationSlot[]; // Rotation slots involved
  message: string; // Human-readable message
  coordinates?: Record<number, { x: number; y: number }>; // Optional coordinates
}
```

### `PositionBounds`

Position bounds for constraint-based movement.

```typescript
interface PositionBounds {
  minX: number; // Minimum allowed X coordinate
  maxX: number; // Maximum allowed X coordinate
  minY: number; // Minimum allowed Y coordinate
  maxY: number; // Maximum allowed Y coordinate
  isConstrained: boolean; // Whether position is constrained
  constraintReasons: string[]; // Human-readable constraint explanations
}
```

### Type Enumerations

#### `Role`

```typescript
type Role =
  | "S" // Setter
  | "OPP" // Opposite/Right Side Hitter
  | "OH1" // Outside Hitter 1
  | "OH2" // Outside Hitter 2
  | "MB1" // Middle Blocker 1
  | "MB2" // Middle Blocker 2
  | "L" // Libero
  | "DS" // Defensive Specialist
  | "Unknown"; // Unknown/Unspecified role
```

#### `RotationSlot`

```typescript
type RotationSlot = 1 | 2 | 3 | 4 | 5 | 6;
```

#### `ViolationCode`

```typescript
type ViolationCode =
  | "ROW_ORDER" // Left-to-right ordering violation
  | "FRONT_BACK" // Front player behind back counterpart
  | "MULTIPLE_SERVERS" // More than one server
  | "INVALID_LINEUP"; // Structural lineup issues
```

## Utility Classes

### `CoordinateTransformer`

Coordinate transformation utilities.

#### Methods

##### `screenToVolleyball(screenX: number, screenY: number): Point`

Convert screen coordinates to volleyball court coordinates.

**Parameters:**

- `screenX` - X coordinate in screen pixels (0-600)
- `screenY` - Y coordinate in screen pixels (0-360)

**Returns:**

- `Point` - Volleyball coordinates `{x: number, y: number}` in meters

---

##### `volleyballToScreen(vbX: number, vbY: number): Point`

Convert volleyball court coordinates to screen coordinates.

**Parameters:**

- `vbX` - X coordinate in volleyball meters (0-9)
- `vbY` - Y coordinate in volleyball meters (0-11)

**Returns:**

- `Point` - Screen coordinates `{x: number, y: number}` in pixels

---

##### `isValidPosition(x: number, y: number, allowServiceZone?: boolean): boolean`

Validate coordinates are within acceptable bounds.

**Parameters:**

- `x` - X coordinate to validate
- `y` - Y coordinate to validate
- `allowServiceZone` - Whether to allow service zone (y: 9-11)

**Returns:**

- `boolean` - True if position is within valid bounds

### `NeighborCalculator`

Rotation neighbor relationship calculator.

#### Methods

##### `getLeftNeighbor(slot: RotationSlot): RotationSlot | null`

Calculate left neighbor in same row (circular within row).

**Neighbor Relationships:**

- Front row: 4 ← 3 ← 2 (LF ← MF ← RF)
- Back row: 5 ← 6 ← 1 (LB ← MB ← RB)

---

##### `getRightNeighbor(slot: RotationSlot): RotationSlot | null`

Calculate right neighbor in same row.

---

##### `getRowCounterpart(slot: RotationSlot): RotationSlot`

Get front/back counterpart.

**Counterpart Mappings:**

- 4 ↔ 5 (LF ↔ LB)
- 3 ↔ 6 (MF ↔ MB)
- 2 ↔ 1 (RF ↔ RB)

---

##### `isFrontRow(slot: RotationSlot): boolean`

Determine if slot is front row (slots 2, 3, 4).

---

##### `isBackRow(slot: RotationSlot): boolean`

Determine if slot is back row (slots 1, 5, 6).

### `PositionHelpers`

Position labeling and helper utilities.

#### Methods

##### `getSlotLabel(slot: RotationSlot): string`

Get position label for slot.

##### `getSlotColumn(slot: RotationSlot): Column`

Get column position for slot.

##### `getSlotRow(slot: RotationSlot): Row`

Get row position for slot.

##### `getPositionDescription(slot: RotationSlot): PositionDescription`

Get complete position description.

##### `analyzeFormation(lineup: PlayerState[]): FormationPattern`

Analyze formation pattern and characteristics.

### `ToleranceUtils`

Tolerance utilities for floating-point comparisons.

#### Methods

##### `isLessOrEqual(a: number, b: number): boolean`

Floating-point safe less-than-or-equal comparison with 3cm tolerance.

##### `isGreaterOrEqual(a: number, b: number): boolean`

Floating-point safe greater-than-or-equal comparison with 3cm tolerance.

##### `isEqual(a: number, b: number): boolean`

Floating-point safe equality comparison with 3cm tolerance.

##### `applyTolerance(value: number, direction: 'min' | 'max'): number`

Apply tolerance to constraint calculations.

## Constants

### `COORDINATE_SYSTEM`

Volleyball court coordinate system constants.

```typescript
const COORDINATE_SYSTEM = {
  COURT_WIDTH: 9.0, // meters
  COURT_LENGTH: 9.0, // meters
  NET_Y: 0.0, // net position
  ENDLINE_Y: 9.0, // endline position
  SERVICE_ZONE_START: 9.0, // service zone start
  SERVICE_ZONE_END: 11.0, // service zone end
  LEFT_SIDELINE_X: 0.0, // left sideline
  RIGHT_SIDELINE_X: 9.0, // right sideline
  TOLERANCE: 0.03, // 3cm tolerance
} as const;
```

### `SCREEN_COORDINATE_SYSTEM`

Screen coordinate system constants.

```typescript
const SCREEN_COORDINATE_SYSTEM = {
  WIDTH: 600, // screen width in pixels
  HEIGHT: 360, // screen height in pixels
} as const;
```

### `COURT_BOUNDS` and `EXTENDED_BOUNDS`

Predefined coordinate boundary definitions.

## Type Guards

Type guard functions for runtime type checking.

### `isValidRole(value: unknown): value is Role`

Check if value is a valid Role.

### `isValidRotationSlot(value: unknown): value is RotationSlot`

Check if value is a valid RotationSlot.

### `isValidPlayerState(value: unknown): value is PlayerState`

Check if value is a valid PlayerState.

### `isValidOverlapResult(value: unknown): value is OverlapResult`

Check if value is a valid OverlapResult.

### `isValidPosition(x: number, y: number, allowServiceZone?: boolean): boolean`

Check if coordinates are within valid bounds.

## Validation Utilities

Low-level validation utilities for lineup validation.

### `validateLineup(lineup: unknown): ValidationError[]`

Comprehensive lineup validation returning array of errors.

### `isValidLineup(lineup: unknown): lineup is PlayerState[]`

Type guard checking if lineup is valid.

### `createSlotMap(lineup: PlayerState[]): Map<RotationSlot, PlayerState>`

Create map of players by rotation slots.

### `getAllRotationSlots(): RotationSlot[]`

Get array of all valid rotation slots [1, 2, 3, 4, 5, 6].

## Performance Classes

Optimized classes for high-performance applications.

### `PerformanceCache`

Caching utility for expensive operations.

#### Methods

##### `get<T>(key: string): T | undefined`

Get cached value by key.

##### `set<T>(key: string, value: T): void`

Set cached value.

##### `getOrCompute<T>(key: string, computeFn: () => T): T`

Get cached value or compute and cache if not found.

### `OptimizedConstraintCalculator`

Performance-optimized version of ConstraintCalculator with memoization.

### `OptimizedCoordinateTransformer`

Performance-optimized version of CoordinateTransformer with pre-calculated scaling.

## Error Handling

### `ValidationError`

Structure for validation errors.

```typescript
interface ValidationError {
  code: string; // Error code
  message: string; // Human-readable message
  playerId?: string; // Optional player ID
  slot?: RotationSlot; // Optional slot number
}
```

### Common Error Codes

- `INVALID_PLAYER_COUNT` - Wrong number of players
- `DUPLICATE_SLOT` - Multiple players in same slot
- `MISSING_SLOT` - No player in required slot
- `NO_SERVER` - No server designated
- `MULTIPLE_SERVERS` - Multiple servers designated
- `INVALID_COORDINATES` - Invalid coordinate values
- `OUT_OF_BOUNDS` - Coordinates outside valid bounds
- `INVALID_PLAYER_STATE` - Malformed player state object
- `INVALID_LINEUP_TYPE` - Lineup is not an array

## Usage Patterns

### Basic Validation

```typescript
const result = VolleyballRulesEngine.validateLineup(players);
if (!result.isLegal) {
  result.violations.forEach((violation) => {
    console.log(VolleyballRulesEngine.explainViolation(violation, players));
  });
}
```

### Real-time Constraints

```typescript
const constraints = VolleyballRulesEngine.getPlayerConstraints(slot, players);
const clampedX = Math.max(constraints.minX, Math.min(constraints.maxX, dragX));
const clampedY = Math.max(constraints.minY, Math.min(constraints.maxY, dragY));
```

### Position Validation

```typescript
if (VolleyballRulesEngine.isValidPosition(slot, newPosition, players)) {
  updatePlayerPosition(slot, newPosition);
} else {
  const validPosition = VolleyballRulesEngine.snapToValidPosition(
    slot,
    newPosition,
    players
  );
  updatePlayerPosition(slot, validPosition);
}
```

### Coordinate Conversion

```typescript
const vbCoords = VolleyballRulesEngine.convertCoordinates.screenToVolleyball(
  screenX,
  screenY
);
const screenCoords =
  VolleyballRulesEngine.convertCoordinates.volleyballToScreen(vbX, vbY);
```
