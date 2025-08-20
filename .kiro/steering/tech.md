# Technology Stack

## Framework & Runtime

- **Next.js 15.4.6** - React framework with App Router
- **React 19.1.0** - UI library with latest features
- **TypeScript 5** - Type-safe JavaScript development
- **Node.js** - Runtime environment

## Styling & Animation

- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion 12.23.12** - Animation library for smooth transitions
- **PostCSS** - CSS processing

## Testing Framework

- **Vitest 3.2.4** - Fast unit testing framework with Jest compatibility
- **@testing-library/react 16.3.0** - React component testing utilities
- **@testing-library/user-event 14.6.1** - User interaction simulation
- **@testing-library/jest-dom 6.6.4** - Custom Jest matchers for DOM testing
- **jsdom 26.1.0** - DOM implementation for testing environment
- **@vitest/ui 3.2.4** - Web-based test runner interface

## Development Tools

- **ESLint 9** - Code linting with Next.js and TypeScript rules
- **pnpm** - Package manager (preferred over npm/yarn)
- **Turbopack** - Fast bundler for development

## Build System & Commands

### Development

```bash
pnpm dev          # Start development server with Turbopack
```

### Production

```bash
pnpm build        # Build for production
pnpm start        # Start production server
```

### Testing

```bash
pnpm test         # Run tests in watch mode
pnpm test:run     # Run tests once
pnpm test:ui      # Run tests with web UI
```

### Code Quality

```bash
pnpm lint         # Run ESLint checks
pnpm typecheck    # Run TypeScript type checking
```

## Configuration Notes

- Uses `@/*` path alias for `./src/*` imports
- Strict TypeScript configuration enabled
- ESLint extends Next.js core web vitals and TypeScript rules
- Geist fonts (sans and mono) loaded via next/font/google
- Vitest configured with jsdom environment for React component testing
- Test files use `.test.ts` and `.test.tsx` extensions
