# Volleyball Court Component

A comprehensive, reusable volleyball court visualization component for React with drag-and-drop positioning, rules validation, and extensive customization options.

[![NPM Version](https://img.shields.io/npm/v/@volleyball-visualizer/court.svg)](https://www.npmjs.com/package/@volleyball-visualizer/court)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@volleyball-visualizer/court.svg)](https://bundlephobia.com/package/@volleyball-visualizer/court)
[![License](https://img.shields.io/npm/l/@volleyball-visualizer/court.svg)](https://github.com/volleyball-visualizer/court/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Features

- 🏐 **Complete Volleyball Rules Engine** - Built-in validation for 5-1 and 6-2 systems
- 🎯 **Drag & Drop Interface** - Intuitive player positioning with real-time validation
- 🎨 **Highly Customizable** - Extensive theming, styling, and configuration options
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- ♿ **Accessibility First** - Full keyboard navigation and screen reader support
- 🌙 **Dark Mode Support** - Built-in light and dark theme support
- 📊 **Analytics Ready** - Comprehensive callback system for tracking and analytics
- 🔗 **URL Sharing** - Generate shareable links for formations
- 💾 **Persistence** - Automatic state saving with localStorage integration
- 🌳 **Tree Shakeable** - Modular exports for optimal bundle size
- 📖 **TypeScript Support** - Full type definitions included

## Installation

```bash
npm install @volleyball-visualizer/court
```

### Peer Dependencies

```bash
npm install react react-dom
```

### Optional Dependencies

```bash
# For enhanced animations (recommended)
npm install framer-motion
```

## Quick Start

```tsx
import React from 'react';
import { VolleyballCourt } from '@volleyball-visualizer/court';

function App() {
  return (
    <VolleyballCourt
      config={{
        initialSystem: '5-1',
        initialRotation: 0,
        initialFormation: 'base'
      }}
      onPositionChange={(data) => {
        console.log('Position changed:', data);
      }}
    />
  );
}

export default App;
```

## Import Options

### Complete Package (Recommended)
```tsx
import { VolleyballCourt, VolleyballCourtPresets } from '@volleyball-visualizer/court';
```

### Tree-Shakeable Imports
```tsx
// Components only
import { VolleyballCourt } from '@volleyball-visualizer/court/components';

// Controls only
import { SystemSelector, RotationControls } from '@volleyball-visualizer/court/controls';

// Utilities only
import { ConfigurationManager } from '@volleyball-visualizer/court/utils';

// Types only
import type { VolleyballCourtConfig } from '@volleyball-visualizer/court/types';

// Presets only
import { VolleyballCourtPresets } from '@volleyball-visualizer/court/presets';
```

## Configuration Presets

Use pre-built configurations for common use cases:

```tsx
import { VolleyballCourt, createVolleyballCourtConfig } from '@volleyball-visualizer/court';

// Educational preset with all features
const educationalConfig = createVolleyballCourtConfig('educational');

// Minimal preset for simple displays
const minimalConfig = createVolleyballCourtConfig('minimal');

// Mobile-optimized preset
const mobileConfig = createVolleyballCourtConfig('mobile', {
  appearance: {
    courtColor: '#custom-color'
  }
});

function App() {
  return <VolleyballCourt config={educationalConfig} />;
}
```

Available presets:
- `minimal` - Simple display with minimal controls
- `educational` - Full features for learning
- `presentation` - Optimized for presentations
- `mobile` - Mobile-friendly configuration
- `highContrast` - Accessibility-focused
- `performance` - Optimized for large displays
- `coaching` - Full analytics and export features

## Advanced Usage

### Custom Player Configuration

```tsx
import { VolleyballCourt, PlayerCustomization } from '@volleyball-visualizer/court';

const customPlayers = PlayerCustomization.createCustomPlayerSet('5-1', [
  { name: 'John Doe', role: 'S', number: 1, color: '#ff0000' },
  { name: 'Jane Smith', role: 'Opp', number: 2, color: '#00ff00' },
  // ... more players
]);

const config = {
  players: {
    '5-1': customPlayers,
    '6-2': [] // Use defaults
  }
};
```

### Real-time Validation

```tsx
import { VolleyballCourt } from '@volleyball-visualizer/court';

function App() {
  return (
    <VolleyballCourt
      config={{
        validation: {
          enableRealTimeValidation: true,
          showConstraintBoundaries: true,
          strictMode: true
        }
      }}
      onViolation={(violations) => {
        violations.forEach(violation => {
          console.log(`Violation: ${violation.message}`);
          if (violation.metadata?.autoFixAvailable) {
            // Suggest auto-fix to user
          }
        });
      }}
    />
  );
}
```

### Provider Pattern for Complex Apps

```tsx
import { VolleyballCourtProvider, useVolleyballCourt } from '@volleyball-visualizer/court';

function CustomControls() {
  const { state, setRotation, setFormation } = useVolleyballCourt();
  
  return (
    <div>
      <button onClick={() => setRotation((state.rotationIndex + 1) % 6)}>
        Next Rotation
      </button>
      <span>Current: {state.formation}</span>
    </div>
  );
}

function App() {
  return (
    <VolleyballCourtProvider config={{ initialSystem: '5-1' }}>
      <CustomControls />
      {/* Court visualization will be rendered by provider */}
    </VolleyballCourtProvider>
  );
}
```

## API Reference

### VolleyballCourtProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `VolleyballCourtConfig` | `{}` | Main configuration object |
| `className` | `string` | `undefined` | Additional CSS classes |
| `onPositionChange` | `(data: PositionData) => void` | `undefined` | Called when positions change |
| `onRotationChange` | `(data: RotationChangeData) => void` | `undefined` | Called when rotation changes |
| `onFormationChange` | `(data: FormationChangeData) => void` | `undefined` | Called when formation changes |
| `onViolation` | `(violations: ViolationData[]) => void` | `undefined` | Called when violations occur |
| `onShare` | `(data: ShareData) => void` | `undefined` | Called when sharing |
| `onError` | `(error: ErrorData) => void` | `undefined` | Called when errors occur |

### VolleyballCourtConfig

```tsx
interface VolleyballCourtConfig {
  // Initial state
  initialSystem?: '5-1' | '6-2';
  initialRotation?: number; // 0-5
  initialFormation?: 'rotational' | 'serveReceive' | 'base';
  
  // Player configuration
  players?: {
    '5-1': PlayerDefinition[];
    '6-2': PlayerDefinition[];
  };
  
  // UI configuration
  controls?: ControlsConfig;
  validation?: ValidationConfig;
  appearance?: AppearanceConfig;
  animation?: AnimationConfig;
  accessibility?: AccessibilityConfig;
  
  // Advanced
  performance?: PerformanceConfig;
  export?: ExportConfig;
  localization?: LocalizationConfig;
}
```

## Styling and Theming

### CSS Custom Properties

The component uses CSS custom properties for theming:

```css
.volleyball-court {
  --court-bg: #ffffff;
  --court-border: #d1d5db;
  --player-color: #3b82f6;
  --violation-color: #ef4444;
  --text-color: #111827;
}

.dark .volleyball-court {
  --court-bg: #1f2937;
  --court-border: #374151;
  --text-color: #f9fafb;
}
```

### Custom Themes

```tsx
const darkOceanTheme = {
  theme: 'dark',
  courtColor: '#1e293b',
  courtBackgroundColor: '#0f172a',
  playerColors: {
    S: '#06b6d4',    // Cyan for setter
    Opp: '#f59e0b',  // Amber for opposite
    OH: '#3b82f6',   // Blue for outside hitters
    MB: '#ef4444',   // Red for middle blockers
  }
};
```

## Error Handling

```tsx
import { VolleyballCourtErrorBoundary } from '@volleyball-visualizer/court';

function App() {
  return (
    <VolleyballCourtErrorBoundary
      fallback={<div>Something went wrong with the court!</div>}
      onError={(error) => {
        console.error('Court error:', error);
        // Send to error tracking service
      }}
    >
      <VolleyballCourt config={config} />
    </VolleyballCourtErrorBoundary>
  );
}
```

## Performance Optimization

### Bundle Size Optimization

```tsx
// Instead of importing everything
import { VolleyballCourt, ConfigurationManager } from '@volleyball-visualizer/court';

// Import only what you need
import { VolleyballCourt } from '@volleyball-visualizer/court/components';
import { ConfigurationManager } from '@volleyball-visualizer/court/utils';
```

### Performance Configuration

```tsx
const performanceConfig = {
  performance: {
    enableVirtualization: true, // For large courts
    debounceMs: 100,           // Debounce drag events
    throttleMs: 50,            // Throttle validation
  },
  animation: {
    enableAnimations: false,   // Disable for better performance
  }
};
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```tsx
import type {
  VolleyballCourtConfig,
  PositionData,
  ViolationData,
  PlayerDefinition
} from '@volleyball-visualizer/court/types';

const config: VolleyballCourtConfig = {
  initialSystem: '5-1', // Type-safe
  validation: {
    enableRealTimeValidation: true
  }
};

const handlePositionChange = (data: PositionData) => {
  // data is fully typed
  console.log(`System: ${data.system}, Rotation: ${data.rotation}`);
};
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Support

- 📖 [Documentation](https://volleyball-visualizer.github.io/court)
- 🐛 [Issue Tracker](https://github.com/volleyball-visualizer/court/issues)
- 💬 [Discussions](https://github.com/volleyball-visualizer/court/discussions)
- 📧 [Email Support](mailto:support@volleyball-visualizer.com)