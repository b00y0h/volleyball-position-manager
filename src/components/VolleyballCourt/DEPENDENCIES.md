# Volleyball Court Component - Dependencies

This document outlines the dependency management strategy for the Volleyball Court Component package to ensure minimal bundle size and maximum compatibility.

## Dependency Strategy

### Peer Dependencies (Required)

These dependencies must be provided by the consuming application:

#### React & React DOM
```json
{
  "react": ">=18.0.0",
  "react-dom": ">=18.0.0"
}
```

**Reasoning**: 
- React 18+ provides essential features like Concurrent Rendering and Suspense
- Most modern React applications already include these dependencies
- Avoiding bundling React reduces package size significantly (React ~42KB, React-DOM ~130KB)

**Version Support**:
- ✅ React 18.x - Full support with all features
- ✅ React 19.x - Full support with latest features
- ❌ React 17.x and below - Not supported (missing concurrent features)

### Optional Dependencies (Enhanced Features)

These dependencies provide enhanced functionality but are not required:

#### Framer Motion (Animation Library)
```json
{
  "framer-motion": ">=10.0.0"
}
```

**Reasoning**:
- Provides smooth, performance-optimized animations
- Enhances user experience but not essential for core functionality
- When absent, component falls back to CSS transitions
- Significant size impact (~100KB), so kept optional

**Fallback Behavior**:
- Without Framer Motion: Basic CSS transitions for state changes
- With Framer Motion: Smooth spring animations, gesture support, complex transitions

**Usage Example**:
```tsx
// Component automatically detects framer-motion availability
import { VolleyballCourt } from '@volleyball-visualizer/court';

// Animation features available if framer-motion is installed
const config = {
  animation: {
    enableAnimations: true, // Will use framer-motion if available
    animationDuration: 300,
    staggerDelay: 50
  }
};
```

## No Runtime Dependencies

The package is designed to have **zero runtime dependencies** beyond peer dependencies:

### Why Zero Dependencies?

1. **Bundle Size**: Each dependency adds to the final bundle size
2. **Security**: Fewer dependencies = smaller attack surface
3. **Maintenance**: No risk of transitive dependency issues
4. **Compatibility**: Reduced likelihood of version conflicts

### Self-Contained Implementation

Instead of external dependencies, the package includes:

- **State Management**: Custom React hooks and context
- **Validation Logic**: Built-in volleyball rules engine
- **Coordinate Systems**: Custom court positioning calculations
- **Event Handling**: Native DOM event management
- **URL Management**: Built-in persistence and sharing utilities
- **Type System**: Comprehensive TypeScript definitions

## Development Dependencies

These are only needed during development/build and are not included in the published package:

### Build Tools
```json
{
  "@rollup/plugin-commonjs": "^25.0.0",
  "@rollup/plugin-node-resolve": "^15.0.0",
  "@rollup/plugin-typescript": "^11.0.0",
  "rollup": "^3.0.0",
  "rollup-plugin-dts": "^5.0.0",
  "rollup-plugin-peer-deps-external": "^2.2.4",
  "rollup-plugin-terser": "^7.0.0"
}
```

### Testing Framework
```json
{
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "@vitest/ui": "^1.0.0",
  "vitest": "^1.0.0",
  "jsdom": "^22.0.0"
}
```

### TypeScript
```json
{
  "typescript": "^5.0.0",
  "@types/react": "^18.0.0",
  "@types/react-dom": "^18.0.0"
}
```

### Code Quality
```json
{
  "eslint": "^8.0.0",
  "@size-limit/preset-small-lib": "^8.0.0",
  "bundlesize": "^0.18.0"
}
```

## Bundle Size Analysis

### Core Package Sizes

| Export | Gzipped | Minified | Description |
|--------|---------|----------|-------------|
| Main (`@volleyball-visualizer/court`) | ~15KB | ~45KB | Complete package |
| Components only | ~12KB | ~35KB | React components only |
| Utils only | ~3KB | ~8KB | Utilities without components |
| Types only | ~0KB | ~0KB | TypeScript definitions only |
| Presets only | ~1KB | ~2KB | Configuration presets |

### Comparison with Dependencies

| Package | Size Impact | Why Avoided |
|---------|-------------|-------------|
| lodash | ~25KB | Custom utilities are lighter |
| moment.js | ~67KB | Native Date APIs sufficient |
| uuid | ~5KB | Simple ID generation implemented |
| classnames | ~2KB | Template literals work fine |
| immer | ~12KB | Simple object spreading sufficient |

## Installation Guide

### Minimal Installation
For basic functionality with CSS transitions:

```bash
npm install @volleyball-visualizer/court react react-dom
```

### Enhanced Installation
For full animation capabilities:

```bash
npm install @volleyball-visualizer/court react react-dom framer-motion
```

### TypeScript Installation
For TypeScript projects (types included):

```bash
npm install @volleyball-visualizer/court react react-dom
npm install -D @types/react @types/react-dom
```

## Compatibility Matrix

### Node.js Versions
- ✅ Node 16.x - Minimum supported version
- ✅ Node 18.x - Recommended LTS version
- ✅ Node 20.x - Latest LTS version

### Package Managers
- ✅ npm 8+ - Full support
- ✅ yarn 1.22+ - Full support
- ✅ pnpm 7+ - Full support
- ✅ bun 1.0+ - Full support

### Bundlers
- ✅ Webpack 5+ - Full tree-shaking support
- ✅ Vite 4+ - Optimal build performance
- ✅ Rollup 3+ - Perfect tree-shaking
- ✅ Parcel 2+ - Zero-config support
- ✅ esbuild - Fast development builds

### React Frameworks
- ✅ Next.js 13+ - SSR/SSG compatible
- ✅ Vite + React - Optimal DX
- ✅ Create React App 5+ - Full support
- ✅ Remix 1.0+ - Works with SSR
- ✅ Gatsby 5+ - Static site compatible

## Tree Shaking Guide

The package is optimized for tree-shaking to minimize bundle size:

### Import Strategies

**❌ Don't import everything:**
```tsx
import * from '@volleyball-visualizer/court'; // Imports everything
```

**✅ Import only what you need:**
```tsx
// For just the main component
import { VolleyballCourt } from '@volleyball-visualizer/court/components';

// For utilities only
import { ConfigurationManager } from '@volleyball-visualizer/court/utils';

// For types only
import type { VolleyballCourtConfig } from '@volleyball-visualizer/court/types';
```

### Bundle Analysis

To analyze your bundle size:

```bash
# Using webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js

# Using source-map-explorer
npm install --save-dev source-map-explorer
npx source-map-explorer build/static/js/*.js
```

## Peer Dependency Warnings

### Handling Missing Peer Dependencies

The package gracefully handles missing optional dependencies:

```tsx
// This works even without framer-motion
import { VolleyballCourt } from '@volleyball-visualizer/court';

// Animations will fallback to CSS transitions
const App = () => (
  <VolleyballCourt 
    config={{ 
      animation: { enableAnimations: true } // Safe to enable
    }} 
  />
);
```

### Suppressing Warnings

If you don't want animation features and want to suppress peer dependency warnings:

```json
// package.json
{
  "pnpm": {
    "peerDependencyRules": {
      "ignoreMissing": ["framer-motion"]
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **"React is not defined" error**
   - Ensure React is installed as a peer dependency
   - Check your bundler configuration for React externals

2. **Large bundle size**
   - Use tree-shakeable imports
   - Verify your bundler supports ES modules
   - Check for duplicate React instances

3. **TypeScript errors**
   - Install @types/react and @types/react-dom
   - Ensure TypeScript version is 4.5+

4. **Animation not working**
   - Install framer-motion for enhanced animations
   - Check console for missing dependency warnings

### Bundle Size Optimization

```tsx
// ✅ Optimal imports for minimal bundle
import { VolleyballCourt } from '@volleyball-visualizer/court/components';
import { createVolleyballCourtConfig } from '@volleyball-visualizer/court/presets';

// ✅ Type-only imports (zero runtime cost)
import type { VolleyballCourtConfig } from '@volleyball-visualizer/court/types';

const App = () => {
  const config = createVolleyballCourtConfig('minimal');
  return <VolleyballCourt config={config} />;
};
```

## Support

For dependency-related issues:
- 📖 [Installation Guide](README.md#installation)
- 🐛 [Issue Tracker](https://github.com/volleyball-visualizer/court/issues)
- 💬 [Bundle Size Discussion](https://github.com/volleyball-visualizer/court/discussions/categories/bundle-size)