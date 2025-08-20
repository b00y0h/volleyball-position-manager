# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visual Development

### Design Principles

- Comprehensive design checklist in `/context/design-principles.md`
- When making visual (front-end, UI/UX) changes, always refer to these files for guidance

### Quick Visual Check

IMMEDIATELY after implementing any front-end change:

1. **Identify what changed** - Review the modified components/pages
2. **Navigate to affected pages** - Use `mcp__playwright__browser_navigate` to visit each changed view
3. **Verify design compliance** - Compare against `/context/design-principles.md`
4. **Validate feature implementation** - Ensure the change fulfills the user's specific request
5. **Check acceptance criteria** - Review any provided context files or requirements
6. **Capture evidence** - Take full page screenshot at desktop viewport (1440px) of each changed view
7. **Check for errors** - Run `mcp__playwright__browser_console_messages`

This verification ensures changes meet design standards and user requirements.

### Comprehensive Design Review

Invoke the `@agent-design-review` subagent for thorough design validation when:

- Completing significant UI/UX features
- Before finalizing PRs with visual changes
- Needing comprehensive accessibility and responsiveness testing

## Development Commands

### Core Commands

- `pnpm dev` - Start development server with Turbopack (Next.js)
- `pnpm build` - Production build
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - TypeScript type checking

### Testing Commands

- `pnpm test` - Run tests in watch mode (Vitest)
- `pnpm test:run` - Run tests once
- `pnpm test:ui` - Launch Vitest UI

## Architecture Overview

This is a Next.js 15 volleyball formation visualizer application with TypeScript, React 19, and Framer Motion animations.

### Core Architecture Components

**State Management**

- `usePositionManager` hook: Centralized state management for player positions across systems (5-1, 6-2), rotations (1-6), and formations (rotational, serve/receive, base)
- Position data is automatically persisted to localStorage and supports URL-based sharing
- Supports custom positions with validation and collision detection

**Key Data Flow**

1. Position data flows through the `PositionManager` which handles CRUD operations
2. `LocalStorageManager` handles persistence with debounced saving
3. `URLStateManager` handles URL encoding/decoding for sharing configurations
4. `DraggablePlayer` components handle drag-and-drop interactions with validation

**Type System**

- `PlayerPosition` interface tracks x/y coordinates, customization status, and modification time
- `FormationPositions` groups positions by formation type (rotational/serveReceive/base)
- `CustomPositionsState` organizes positions by rotation index
- Position validation includes boundary checking and collision detection

### Key Features

**Interactive Visualization**

- Drag-and-drop player positioning with real-time validation
- Visual indicators for default vs custom positions
- Formation switching with smooth animations via Framer Motion
- Read-only mode for shared configurations

**State Persistence**

- Local storage for user's custom positions
- URL-based sharing with base64 compression
- Automatic fallback handling for large datasets

**Position Management**

- Individual position reset capability
- Formation-level and rotation-level resets
- System-wide reset functionality
- Collision detection and automatic position adjustment

## File Structure Patterns

- `/src/app/` - Next.js App Router pages and layout
- `/src/components/` - Reusable React components with co-located tests
- `/src/hooks/` - Custom React hooks for state management
- `/src/types/` - TypeScript type definitions and interfaces
- `/src/utils/` - Utility functions organized by domain (storage, validation, transforms)
- Test files use `.test.ts` or `.test.tsx` extensions and are co-located with source files

## Development Notes

**Testing Setup**

- Vitest with jsdom environment for React component testing
- Testing Library for component testing utilities
- Test setup file: `src/test/setup.ts`

**Type Safety**

- Strict TypeScript configuration
- All position data is strongly typed with validation
- Union types for systems ("5-1" | "6-2") and formations ("rotational" | "serveReceive" | "base")

**Performance Considerations**

- Position manager uses React.useMemo for expensive calculations
- localStorage operations are debounced to prevent excessive writes
- URL compression for sharing large datasets

**Dark Mode Support**

- Tailwind CSS with dark mode classes throughout the application
- Consistent styling patterns across light and dark themes
