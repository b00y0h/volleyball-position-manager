# Project Structure

## Directory Organization

```
volleyball-visualizer/
├── .kiro/                           # Kiro AI assistant configuration
│   ├── specs/                       # Feature specifications and tasks
│   │   ├── volleyball-rules-engine/ # Rules engine specification
│   │   ├── customizable-player-positioning/ # Player positioning spec
│   │   └── reusable-volleyball-court-component/ # Court component spec
│   └── steering/                    # AI guidance documents
├── src/                            # Source code
│   ├── app/                        # Next.js App Router pages
│   │   ├── layout.tsx              # Root layout with fonts and metadata
│   │   ├── page.tsx                # Main volleyball visualizer component
│   │   ├── globals.css             # Global styles and Tailwind imports
│   │   └── favicon.ico             # Site icon
│   ├── components/                 # React components
│   │   ├── __tests__/              # Component tests
│   │   ├── DraggablePlayer.tsx     # Basic draggable player component
│   │   ├── EnhancedDraggablePlayer.tsx # Rule-aware draggable player
│   │   ├── ValidationDisplay.tsx   # Violation reporting component
│   │   └── ResetButton.tsx         # Formation reset functionality
│   ├── hooks/                      # Custom React hooks
│   │   ├── __tests__/              # Hook tests
│   │   ├── usePositionManager.ts   # Basic position management
│   │   └── useEnhancedPositionManager.ts # Rule-aware position management
│   ├── utils/                      # Utility functions
│   │   ├── storage/                # Local storage utilities
│   │   ├── __tests__/              # Utility tests
│   │   ├── coordinateTransforms.ts # Coordinate system utilities
│   │   ├── positionValidation.ts   # Position validation logic
│   │   ├── defaultPositions.ts     # Default formation data
│   │   ├── URLStateManager.ts      # URL state persistence
│   │   └── coordinateSystemMigration.ts # Legacy data migration
│   ├── types/                      # TypeScript type definitions
│   └── volleyball-rules-engine/    # Volleyball rules validation engine
│       ├── __tests__/              # Engine tests
│       ├── examples/               # Usage examples and demos
│       ├── types/                  # Engine-specific types
│       ├── utils/                  # Engine utilities
│       ├── validation/             # Rule validation logic
│       ├── VolleyballRulesEngine.ts # Main engine class
│       ├── types.d.ts              # Type definitions
│       ├── API.md                  # API documentation
│       ├── README.md               # Engine documentation
│       └── INTEGRATION.md          # Integration guide
├── public/                         # Static assets
│   └── *.svg                       # SVG icons and graphics
├── .playwright-mcp/                # Playwright test artifacts
├── node_modules/                   # Dependencies (auto-generated)
├── .next/                          # Next.js build output (auto-generated)
├── dist/                           # Build output (auto-generated)
└── config files                    # TypeScript, ESLint, Next.js, Vitest, etc.
```

## Code Organization Patterns

### Component Architecture

#### Basic Components

- **DraggablePlayer.tsx** - Core draggable player functionality
- **ResetButton.tsx** - Formation reset with confirmation

#### Enhanced Components

- **EnhancedDraggablePlayer.tsx** - Rule-aware dragging with constraint visualization
- **ValidationDisplay.tsx** - Comprehensive violation reporting with educational context

#### Component Features

- Single-file components in TypeScript React (.tsx)
- Client components marked with `"use client"` directive
- Inline styles using Tailwind CSS classes
- Animation logic with Framer Motion
- Comprehensive test coverage with Vitest and Testing Library

### Hook Architecture

#### Basic Hooks

- **usePositionManager.ts** - Core position management and validation

#### Enhanced Hooks

- **useEnhancedPositionManager.ts** - Volleyball rules integration with real-time constraint calculation

#### Hook Features

- Custom React hooks for state management
- Integration with volleyball rules engine
- Real-time validation and constraint calculation
- URL state persistence and local storage integration

### Volleyball Rules Engine

#### Core Engine

- **VolleyballRulesEngine.ts** - Main validation engine with comprehensive rule checking
- **types.d.ts** - Complete type system for volleyball positioning

#### Validation System

- **ConstraintCalculator.ts** - Real-time constraint boundary calculation
- **OverlapValidator.ts** - Player overlap detection and prevention
- **OptimizedConstraintCalculator.ts** - Performance-optimized constraint calculation
- **LazyViolationAnalyzer.ts** - Efficient violation analysis

#### Utility System

- **CoordinateTransformer.ts** - Coordinate system transformations
- **StateConverter.ts** - Bidirectional conversion between screen and volleyball coordinates
- **PositionHelpers.ts** - Position calculation and validation utilities
- **NeighborCalculator.ts** - Player neighbor relationship calculations
- **PerformanceCache.ts** - Caching system for performance optimization

#### Integration Layer

- **StateConverter.ts** - Bridge between existing coordinate system and volleyball rules
- **coordinateSystemMigration.ts** - Legacy data migration utilities

### State Management

#### Local State

- React hooks (useState, useEffect) for component-level state
- Custom hooks for complex state logic and validation

#### Persistence

- **URLStateManager.ts** - URL-based state sharing and bookmarking
- **LocalStorageManager.ts** - Browser storage for user preferences and formations

#### Validation State

- Real-time validation results from volleyball rules engine
- Constraint boundaries for drag operations
- Violation reporting with detailed explanations

### Testing Architecture

#### Test Organization

- \***\*tests**/\*\* directories alongside source files
- Comprehensive unit tests for all major components and utilities
- Integration tests for coordinate system transformations
- Performance tests for optimization validation

#### Test Types

- **Component tests** - React component behavior and rendering
- **Hook tests** - Custom hook functionality and state management
- **Utility tests** - Pure function testing with edge cases
- **Integration tests** - Cross-system functionality validation
- **Performance tests** - Optimization and caching validation

### Styling Approach

- Tailwind utility classes for styling
- CSS custom properties for theming (light/dark mode)
- Inline SVG for court visualization
- Responsive design with flexbox layouts
- Animated feedback for validation states

### File Naming Conventions

- React components: PascalCase (.tsx)
- Hooks: camelCase with "use" prefix (.ts)
- Utilities: camelCase (.ts)
- Tests: matching source file name with .test.ts/.test.tsx extension
- Configuration files: lowercase with extensions
- Static assets: lowercase with descriptive names

## Import Patterns

- Use `@/*` alias for src imports
- External dependencies imported first
- React hooks and utilities grouped together
- Type imports use `import type` syntax
- Volleyball rules engine imports from `@/volleyball-rules-engine`
- Component imports from `@/components`
- Hook imports from `@/hooks`
- Utility imports from `@/utils`

## Architecture Principles

### Separation of Concerns

- **Presentation layer** - React components for UI
- **Business logic layer** - Custom hooks for state management
- **Validation layer** - Volleyball rules engine for rule enforcement
- **Persistence layer** - URL and local storage managers

### Performance Optimization

- **Lazy loading** - Violation analysis only when needed
- **Caching** - Performance cache for expensive calculations
- **Optimized algorithms** - Specialized constraint calculators for real-time operations
- **Minimal re-renders** - Efficient state management patterns

### Extensibility

- **Modular architecture** - Independent, composable components
- **Plugin system** - Rules engine designed for extensibility
- **Configuration-driven** - Behavior controlled through configuration objects
- **Type safety** - Comprehensive TypeScript coverage for maintainability
