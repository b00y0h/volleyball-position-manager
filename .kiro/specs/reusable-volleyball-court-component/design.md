# Design Document

## Overview

The VolleyballCourt component will be a fully self-contained, configurable React component that encapsulates all volleyball court visualization functionality. It will extract the complex court rendering, player positioning, drag-and-drop interactions, and rule validation logic from the main page into a reusable component that can be easily integrated into any React application. The component will maintain all existing functionality while providing a clean, props-based configuration API and comprehensive integration with the volleyball rules engine.

## Architecture

### Component Hierarchy

```
VolleyballCourt (main component)
├── VolleyballCourtProvider (context provider for internal state)
├── CourtVisualization (SVG court rendering)
├── PlayerLayer (player positioning and interactions)
│   ├── EnhancedDraggablePlayer (rule-aware draggable players)
│   └── DragGuidelines (visual constraint boundaries)
├── ControlsLayer (optional UI controls)
│   ├── SystemSelector (5-1/6-2 selection)
│   ├── RotationControls (prev/next rotation)
│   ├── FormationSelector (rotational/serve-receive/base)
│   ├── ResetButton (position reset functionality)
│   └── ShareButton (URL sharing)
├── ValidationLayer (rule violation display)
│   └── ValidationDisplay (comprehensive violation reporting)
├── NotificationSystem (user feedback)
└── ErrorBoundary (error handling)
```

### State Management Architecture

The component will use a centralized state management approach with the existing `useEnhancedPositionManager` hook as the core state manager, wrapped in a context provider for internal component communication.

```typescript
interface VolleyballCourtState {
  // Core state
  system: SystemType;
  rotationIndex: number;
  formation: FormationType;
  isAnimating: boolean;
  draggedPlayer: string | null;

  // Validation state
  violations: string[];
  visualGuidelines: ConstraintBoundaries;

  // UI state
  isReadOnly: boolean;
  showControls: boolean;
  shareURL: string;
  showShareDialog: boolean;

  // Position state (managed by useEnhancedPositionManager)
  positions: PositionState;
  isLoading: boolean;
  error: string | null;
}
```

## Components and Interfaces

### Main Component Interface

```typescript
interface VolleyballCourtProps {
  // Configuration
  config?: VolleyballCourtConfig;

  // Styling
  className?: string;
  style?: React.CSSProperties;
  courtDimensions?: { width: number; height: number };

  // Behavior
  readOnly?: boolean;
  showControls?: boolean;
  enableSharing?: boolean;
  enablePersistence?: boolean;

  // Event callbacks
  onPositionChange?: (positions: PositionData) => void;
  onRotationChange?: (rotation: number) => void;
  onFormationChange?: (formation: FormationType) => void;
  onViolation?: (violations: ViolationData[]) => void;
  onShare?: (shareData: ShareData) => void;
  onError?: (error: ErrorData) => void;

  // Advanced configuration
  customPlayers?: CustomPlayersConfig;
  customRotations?: CustomRotationsConfig;
  validationConfig?: ValidationConfig;
  animationConfig?: AnimationConfig;
}

interface VolleyballCourtConfig {
  // Initial state
  initialSystem?: SystemType;
  initialRotation?: number;
  initialFormation?: FormationType;

  // Player configuration
  players?: {
    "5-1": PlayerDefinition[];
    "6-2": PlayerDefinition[];
  };

  // Rotation configuration
  rotations?: {
    "5-1": RotationMapping[];
    "6-2": RotationMapping[];
  };

  // UI configuration
  controls?: {
    showSystemSelector?: boolean;
    showRotationControls?: boolean;
    showFormationSelector?: boolean;
    showResetButton?: boolean;
    showShareButton?: boolean;
    showAnimateButton?: boolean;
  };

  // Validation configuration
  validation?: {
    enableRealTimeValidation?: boolean;
    showConstraintBoundaries?: boolean;
    enablePositionSnapping?: boolean;
    showViolationDetails?: boolean;
  };

  // Appearance configuration
  appearance?: {
    theme?: "light" | "dark" | "auto";
    courtColor?: string;
    playerColors?: PlayerColorConfig;
    showPlayerNames?: boolean;
    showPositionLabels?: boolean;
  };
}
```

### Core Sub-Components

#### CourtVisualization Component

```typescript
interface CourtVisualizationProps {
  dimensions: { width: number; height: number };
  theme: "light" | "dark";
  courtColor?: string;
  showGrid?: boolean;
  showZones?: boolean;
}
```

Responsibilities:

- Render the SVG volleyball court with proper dimensions
- Handle responsive sizing and aspect ratio maintenance
- Provide court zones and grid lines
- Support theming and customization

#### PlayerLayer Component

```typescript
interface PlayerLayerProps {
  players: PlayerDefinition[];
  positions: Record<string, PlayerPosition>;
  rotationMap: Record<number, string>;
  formation: FormationType;
  draggedPlayer: string | null;
  visualGuidelines: ConstraintBoundaries;
  readOnly: boolean;
  onDragStart: (playerId: string) => void;
  onDragEnd: (playerId: string, success: boolean) => void;
  onPositionChange: (playerId: string, position: PlayerPosition) => void;
}
```

Responsibilities:

- Render all player positions using EnhancedDraggablePlayer components
- Manage drag-and-drop interactions with rule validation
- Display visual constraint boundaries during drag operations
- Handle position updates and validation

#### ControlsLayer Component

```typescript
interface ControlsLayerProps {
  system: SystemType;
  rotationIndex: number;
  formation: FormationType;
  isAnimating: boolean;
  isReadOnly: boolean;
  controlsConfig: ControlsConfig;
  onSystemChange: (system: SystemType) => void;
  onRotationChange: (rotation: number) => void;
  onFormationChange: (formation: FormationType) => void;
  onReset: (type: ResetType) => void;
  onShare: () => void;
  onAnimate: () => void;
}
```

Responsibilities:

- Render optional UI controls based on configuration
- Handle user interactions for system/rotation/formation changes
- Provide reset and sharing functionality
- Manage animation triggers

### Integration with Volleyball Rules Engine

The component will deeply integrate with the existing volleyball rules engine:

```typescript
class VolleyballCourtRulesIntegration {
  private rulesEngine: VolleyballRulesEngine;
  private constraintCalculator: OptimizedConstraintCalculator;
  private violationAnalyzer: LazyViolationAnalyzer;

  constructor(courtDimensions: CourtDimensions) {
    this.rulesEngine = new VolleyballRulesEngine();
    this.constraintCalculator = new OptimizedConstraintCalculator(
      courtDimensions
    );
    this.violationAnalyzer = new LazyViolationAnalyzer();
  }

  validatePosition(
    playerId: string,
    position: PlayerPosition,
    allPositions: PlayerPositions
  ): ValidationResult {
    // Convert to volleyball coordinates and validate
    const vbState = StateConverter.toVolleyballCoordinates(position);
    return this.rulesEngine.validateLineup(
      this.buildLineup(playerId, vbState, allPositions)
    );
  }

  calculateConstraints(
    playerId: string,
    allPositions: PlayerPositions
  ): ConstraintBoundaries {
    // Calculate real-time positioning constraints
    return this.constraintCalculator.calculateValidBounds(
      playerId,
      allPositions
    );
  }

  snapToValidPosition(
    playerId: string,
    targetPosition: PlayerPosition,
    allPositions: PlayerPositions
  ): PlayerPosition {
    // Snap to nearest valid position
    const vbPosition = StateConverter.toVolleyballCoordinates(targetPosition);
    const snappedVb = this.rulesEngine.snapToValidPosition(
      playerId,
      vbPosition,
      this.buildLineup(playerId, vbPosition, allPositions)
    );
    return StateConverter.toScreenCoordinates(snappedVb);
  }
}
```

## Data Models

### Configuration Models

```typescript
interface PlayerDefinition {
  id: string;
  name: string;
  role: PlayerRole;
  color?: string;
}

interface RotationMapping {
  [position: number]: string; // position -> playerId
}

interface PlayerPosition {
  x: number;
  y: number;
  isCustom?: boolean;
}

interface PositionData {
  system: SystemType;
  rotation: number;
  formation: FormationType;
  positions: Record<string, PlayerPosition>;
}

interface ViolationData {
  code: string;
  message: string;
  affectedPlayers: string[];
  severity: "error" | "warning";
}

interface ShareData {
  url: string;
  config: VolleyballCourtConfig;
  positions: PositionData;
}

interface ErrorData {
  type: "validation" | "storage" | "network" | "unknown";
  message: string;
  details?: any;
}
```

### Internal State Models

```typescript
interface CourtDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

interface ConstraintBoundaries {
  horizontalLines: ConstraintLine[];
  verticalLines: ConstraintLine[];
  validArea: BoundingBox;
}

interface ConstraintLine {
  position: number;
  type: "min" | "max";
  reason: string;
}

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
```

## Error Handling

### Error Boundary Strategy

The component will include a comprehensive error boundary that catches and handles different types of errors:

```typescript
interface VolleyballCourtErrorBoundaryState {
  hasError: boolean;
  errorType: "render" | "validation" | "storage" | "rules-engine";
  errorMessage: string;
  errorDetails?: any;
}

class VolleyballCourtErrorBoundary extends React.Component<Props, State> {
  // Handle different error types with appropriate recovery strategies
  // Provide fallback UI for different error scenarios
  // Log errors for debugging while maintaining user experience
}
```

### Error Recovery Mechanisms

1. **Validation Errors**: Graceful degradation with basic positioning
2. **Storage Errors**: Fallback to memory-only mode with user notification
3. **Rules Engine Errors**: Disable advanced validation while maintaining basic functionality
4. **Rendering Errors**: Fallback to simplified court visualization

## Testing Strategy

### Unit Testing

- **Component Testing**: Each sub-component tested in isolation
- **Hook Testing**: State management hooks tested with various scenarios
- **Integration Testing**: Rules engine integration tested thoroughly
- **Configuration Testing**: All configuration options validated

### Integration Testing

- **Full Component Testing**: Complete component functionality tested
- **Rules Engine Integration**: Validation and constraint calculation tested
- **State Persistence**: URL and localStorage integration tested
- **Error Scenarios**: Error handling and recovery tested

### Visual Testing

- **Snapshot Testing**: Component rendering consistency
- **Responsive Testing**: Different screen sizes and orientations
- **Theme Testing**: Light/dark mode rendering
- **Animation Testing**: Transition and animation behavior

### Performance Testing

- **Rendering Performance**: Large datasets and complex configurations
- **Drag Performance**: Real-time constraint calculation during drag operations
- **Memory Usage**: Long-running sessions and state management
- **Rules Engine Performance**: Validation speed with complex formations

## Implementation Phases

### Phase 1: Core Component Structure

- Extract main component shell from page.tsx
- Create basic prop interface and configuration system
- Implement responsive court rendering
- Set up internal state management with context

### Phase 2: Player and Interaction Layer

- Integrate EnhancedDraggablePlayer components
- Implement drag-and-drop with rules engine validation
- Add visual constraint boundaries and guidelines
- Create position management and persistence

### Phase 3: Controls and UI Layer

- Extract and componentize all UI controls
- Implement configurable control visibility
- Add reset functionality and confirmation dialogs
- Create sharing and URL state management

### Phase 4: Validation and Error Handling

- Integrate ValidationDisplay component
- Implement comprehensive error boundaries
- Add notification system integration
- Create fallback mechanisms for error scenarios

### Phase 5: Configuration and Customization

- Implement full configuration API
- Add theming and appearance customization
- Create callback system for external integration
- Add comprehensive TypeScript definitions

### Phase 6: Testing and Documentation

- Create comprehensive test suite
- Add performance optimization
- Write API documentation and usage examples
- Prepare for npm packaging

This design provides a solid foundation for creating a reusable, configurable volleyball court component that maintains all existing functionality while being prepared for distribution as an npm package.
