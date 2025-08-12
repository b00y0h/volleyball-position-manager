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

### Code Quality

```bash
pnpm lint         # Run ESLint checks
```

## Configuration Notes

- Uses `@/*` path alias for `./src/*` imports
- Strict TypeScript configuration enabled
- ESLint extends Next.js core web vitals and TypeScript rules
- Geist fonts (sans and mono) loaded via next/font/google
