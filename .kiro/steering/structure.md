# Project Structure

## Directory Organization

```
volleyball-visualizer/
├── .kiro/                    # Kiro AI assistant configuration
│   └── steering/            # AI guidance documents
├── src/                     # Source code
│   └── app/                 # Next.js App Router pages
│       ├── layout.tsx       # Root layout with fonts and metadata
│       ├── page.tsx         # Main volleyball visualizer component
│       ├── globals.css      # Global styles and Tailwind imports
│       └── favicon.ico      # Site icon
├── public/                  # Static assets
│   └── *.svg               # SVG icons and graphics
├── node_modules/           # Dependencies (auto-generated)
├── .next/                  # Next.js build output (auto-generated)
└── config files            # TypeScript, ESLint, Next.js, etc.
```

## Code Organization Patterns

### Component Structure

- Single-file components in TypeScript React (.tsx)
- Client components marked with `"use client"` directive
- Inline styles using Tailwind CSS classes
- Animation logic with Framer Motion

### State Management

- React hooks (useState, useEffect) for local state
- No external state management library currently used
- Component-level state for UI interactions

### Styling Approach

- Tailwind utility classes for styling
- CSS custom properties for theming (light/dark mode)
- Inline SVG for court visualization
- Responsive design with flexbox layouts

### File Naming Conventions

- React components: PascalCase (.tsx)
- Configuration files: lowercase with extensions
- Static assets: lowercase with descriptive names

## Import Patterns

- Use `@/*` alias for src imports
- External dependencies imported first
- React hooks and utilities grouped together
- Type imports use `import type` syntax
