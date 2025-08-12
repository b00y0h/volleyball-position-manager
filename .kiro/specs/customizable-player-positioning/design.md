# Design Document

## Overview

The customizable player positioning feature transforms the volleyball visualizer from a static demonstration tool into an interactive coaching platform. The design extends the existing React/Next.js application with drag-and-drop functionality, persistent storage, and URL-based sharing capabilities. The solution maintains the current architecture while adding new layers for position management, data persistence, and URL encoding/decoding.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Component Layer                    │
├─────────────────────────────────────────────────────────────┤
│  VolleyballVisualizer │ DragDropProvider │ PositionManager  │
├─────────────────────────────────────────────────────────────┤
│                   State Management Layer                    │
├─────────────────────────────────────────────────────────────┤
│  CustomPositions │ URLStateManager │ LocalStorageManager   │
├─────────────────────────────────────────────────────────────┤
│                    Data Persistence Layer                   │
├─────────────────────────────────────────────────────────────┤
│     Browser Storage    │    URL Parameters    │   Cookies   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction**: Coach drags player dot on court
2. **Position Update**: DragDropProvider captures new coordinates
3. **State Management**: PositionManager validates and updates position state
4. **Persistence**: LocalStorageManager saves to browser storage
5. **URL Generation**: URLStateManager encodes current state for sharing
6. **Visual Update**: React re-renders with new positions using Framer Motion

## Components and Interfaces

### Core Interfaces

```typescript
interface PlayerPosition {
  x: number;
  y: number;
  isCustom: boolean;
  lastModified: Date;
}

interface FormationPositions {
  rotational: Record<string, PlayerPosition>;
  serveReceive: Record<string, PlayerPosition>;
  base: Record<string, PlayerPosition>;
}

interface CustomPositionsState {
  [rotationIndex: number]: FormationPositions;
}

interface URLPositionData {
  system: "5-1" | "6-2";
  rotation: number;
  positions: CustomPositionsState;
  version: string;
}
```

### Component Structure

#### PositionManager

- **Purpose**: Central state management for all custom positions
- **Responsibilities**:
  - Maintain position state for all rotations and formations
  - Validate position changes
  - Coordinate with persistence layers
  - Provide position data to visualization components

#### DragDropProvider

- **Purpose**: Handle drag-and-drop interactions
- **Responsibilities**:
  - Detect drag start/end events on player dots
  - Provide visual feedback during dragging
  - Validate drop zones and positions
  - Trigger position updates through PositionManager

#### URLStateManager

- **Purpose**: Handle URL encoding/decoding of position data
- **Responsibilities**:
  - Encode current positions into shareable URLs
  - Decode incoming URL parameters
  - Handle URL compression for large datasets
  - Manage version compatibility

#### LocalStorageManager

- **Purpose**: Persist positions to browser storage
- **Responsibilities**:
  - Save position changes automatically
  - Load saved positions on application start
  - Handle storage quota and error scenarios
  - Provide data migration capabilities

### Enhanced Volleyball Visualizer Component

The existing component will be extended with:

- Drag-and-drop event handlers on player dots
- Visual indicators for customized positions
- Integration with PositionManager for position data
- URL sharing functionality
- Read-only mode for shared configurations

## Data Models

### Position Storage Format

```typescript
// Browser Storage Format
interface StoredPositions {
  version: string;
  lastModified: Date;
  positions: {
    "5-1": CustomPositionsState;
    "6-2": CustomPositionsState;
  };
}

// URL Parameter Format (compressed)
interface URLParams {
  d: string; // compressed position data
  v: string; // version
  s: string; // system
  r: string; // rotation
}
```

### Position Validation Rules

- **Court Boundaries**: x: 0-600, y: 0-360 (based on current court dimensions)
- **Formation Constraints**:
  - Rotational: Must maintain relative positioning rules
  - Serve/Receive: Back-row players only in designated zones
  - Base: Front-row players must be in attack positions
- **Collision Detection**: Minimum distance between players (30px radius)

## Error Handling

### Drag-and-Drop Errors

- **Invalid Drop Zone**: Return player to previous position with visual feedback
- **Collision Detection**: Prevent overlapping players with snap-back animation
- **Boundary Violations**: Constrain movement to court boundaries

### Storage Errors

- **Quota Exceeded**: Graceful degradation with user notification
- **Storage Unavailable**: Fall back to session-only mode
- **Corruption Detection**: Reset to defaults with user confirmation

### URL Sharing Errors

- **Invalid URL Data**: Display error message and load defaults
- **Version Mismatch**: Attempt migration or show compatibility warning
- **Compression Failures**: Fall back to uncompressed format

## Testing Strategy

### Unit Testing

- **Position Validation**: Test boundary checking and collision detection
- **URL Encoding/Decoding**: Verify data integrity across encode/decode cycles
- **Storage Operations**: Mock browser storage for save/load operations
- **State Management**: Test position updates and state transitions

### Integration Testing

- **Drag-and-Drop Flow**: End-to-end testing of drag operations
- **URL Sharing**: Test complete share/load cycle
- **Cross-Formation Consistency**: Verify independent formation positioning
- **Browser Compatibility**: Test storage and URL handling across browsers

### Visual Testing

- **Animation Smoothness**: Verify Framer Motion transitions
- **Visual Indicators**: Test custom position highlighting
- **Responsive Behavior**: Test on different screen sizes
- **Accessibility**: Ensure keyboard navigation and screen reader support

## Implementation Considerations

### Performance Optimizations

- **Debounced Saves**: Batch position updates to reduce storage writes
- **Lazy Loading**: Load position data only when needed
- **Memoization**: Cache position calculations and validations
- **URL Compression**: Use efficient encoding for large position datasets

### Browser Compatibility

- **Storage Fallbacks**: Support both localStorage and cookies
- **URL Length Limits**: Handle browser-specific URL length constraints
- **Touch Support**: Ensure drag-and-drop works on mobile devices
- **Modern Browser Features**: Use feature detection for advanced capabilities

### Security Considerations

- **Input Validation**: Sanitize all position data from URLs
- **Storage Limits**: Prevent excessive data storage
- **XSS Prevention**: Properly encode URL parameters
- **Data Privacy**: Keep position data local unless explicitly shared

### Migration Strategy

- **Version Management**: Handle schema changes in stored data
- **Backward Compatibility**: Support older URL formats
- **Data Recovery**: Provide reset options for corrupted data
- **Feature Flags**: Allow gradual rollout of new capabilities
