/**
 * Volleyball Court Component Package
 *
 * A comprehensive, reusable volleyball court visualization component library
 * designed for npm distribution with tree-shaking support and minimal dependencies.
 *
 * @package @volleyball-visualizer/court
 * @version 1.0.0
 * @author Volleyball Visualizer Team
 * @license MIT
 */

// =============================================================================
// MAIN COMPONENT EXPORTS
// =============================================================================

/**
 * Primary volleyball court component - the main entry point
 * for most use cases. Includes full functionality with sensible defaults.
 */
export { VolleyballCourt } from "./VolleyballCourt";

/**
 * Provider component for advanced use cases requiring custom children
 * or direct access to court state and methods.
 */
export {
  VolleyballCourtProvider,
  useVolleyballCourt,
} from "./VolleyballCourtProvider";

/**
 * Error boundary component for robust error handling
 * in production environments.
 */
export { VolleyballCourtErrorBoundary } from "./VolleyballCourtErrorBoundary";

// =============================================================================
// LAYER COMPONENTS (Tree-shakeable)
// =============================================================================

/**
 * Individual layer components for advanced customization.
 * These can be imported separately for custom court implementations.
 */
export { CourtVisualization } from "./CourtVisualization";
export { PlayerLayer } from "./PlayerLayer";
export { ControlsLayer } from "./ControlsLayer";
export { ValidationLayer } from "./ValidationLayer";
export { NotificationLayer } from "./NotificationLayer";
export { ReadOnlyIndicator } from "./ReadOnlyIndicator";

// =============================================================================
// CONFIGURATION AND CUSTOMIZATION
// =============================================================================

/**
 * Configuration panel for runtime configuration changes
 */
export { ConfigurationPanel } from "./ConfigurationPanel";

/**
 * Configuration management utilities
 */
export {
  ConfigurationManager,
  ConfigurationBuilder,
  PlayerCustomization,
  RotationCustomization,
  ThemeCustomization,
  AdvancedConfiguration,
} from "./ConfigurationUtils";

// =============================================================================
// CONTROL COMPONENTS (Tree-shakeable)
// =============================================================================

/**
 * Individual control components for custom control layouts
 */
export {
  SystemSelector,
  RotationControls,
  FormationSelector,
  AnimationControls,
  ShareButton,
} from "./controls";

// =============================================================================
// PERSISTENCE AND SHARING
// =============================================================================

/**
 * Persistence manager for state saving and URL sharing
 */
export { VolleyballCourtPersistenceManager } from "./PersistenceManager";

// =============================================================================
// RULES ENGINE INTEGRATION
// =============================================================================

/**
 * Volleyball rules engine integration for position validation
 */
export { VolleyballCourtRulesIntegration } from "./VolleyballCourtRulesIntegration";

// =============================================================================
// UTILITIES AND HELPERS
// =============================================================================

/**
 * Court coordinate utilities for position calculations
 */
export * from "./courtCoordinates";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Core component and configuration types
 */
export type {
  // Main component props
  VolleyballCourtProps,
  VolleyballCourtConfig,
  VolleyballCourtState,

  // Player and position types
  PlayerDefinition,
  PlayerPosition,
  PositionData,
  RotationMapping,

  // Callback data types
  ViolationData,
  ShareData,
  ErrorData,
  RotationChangeData,
  FormationChangeData,
  PlayerDragData,
  ValidationStateData,
  ConfigurationChangeData,
  SystemChangeData,

  // Configuration types
  CustomPlayersConfig,
  CustomRotationsConfig,
  ValidationConfig,
  AnimationConfig,
  ControlsConfig,
  AppearanceConfig,
  AccessibilityConfig,
  PerformanceConfig,
  ExportConfig,
  LocalizationConfig,

  // Visual and layout types
  PlayerColorConfig,
  CourtDimensions,
  ConstraintBoundaries,
  ConstraintLine,
  BoundingBox,

  // Control component types
  ControlsLayerProps,
  ResetType,

  // System and formation types
  SystemType,
  FormationType,
} from "./types";

/**
 * Rules integration types
 */
export type {
  RulesIntegrationConfig,
  ScreenValidationResult,
  PositionValidationContext,
} from "./VolleyballCourtRulesIntegration";

// =============================================================================
// PRESET CONFIGURATIONS
// =============================================================================

/**
 * Pre-built configuration presets for common use cases
 */
export const VolleyballCourtPresets = {
  /**
   * Minimal configuration for simple displays
   */
  minimal: {
    controls: {
      showSystemSelector: false,
      showRotationControls: false,
      showFormationSelector: false,
      showResetButton: false,
      showShareButton: false,
      showAnimateButton: false,
    },
    validation: {
      enableRealTimeValidation: false,
      showViolationDetails: false,
    },
    appearance: {
      showPlayerNames: false,
      showPositionLabels: false,
    },
  },

  /**
   * Educational configuration with all features enabled
   */
  educational: {
    controls: {
      showSystemSelector: true,
      showRotationControls: true,
      showFormationSelector: true,
      showResetButton: true,
      showShareButton: true,
      showAnimateButton: true,
    },
    validation: {
      enableRealTimeValidation: true,
      showConstraintBoundaries: true,
      showViolationDetails: true,
      enableEducationalMessages: true,
      strictMode: true,
    },
    appearance: {
      showPlayerNames: true,
      showPlayerNumbers: true,
      showPositionLabels: true,
    },
  },

  /**
   * Presentation configuration optimized for displays
   */
  presentation: {
    controls: {
      showSystemSelector: true,
      showRotationControls: true,
      showFormationSelector: true,
      controlsPosition: "bottom" as const,
      controlsStyle: "expanded" as const,
    },
    animation: {
      enableAnimations: true,
      animationDuration: 500,
      staggerDelay: 100,
    },
    appearance: {
      showPlayerNames: true,
      playerSize: 1.2,
    },
  },

  /**
   * Mobile-optimized configuration
   */
  mobile: {
    controls: {
      controlsPosition: "bottom" as const,
      controlsStyle: "compact" as const,
    },
    appearance: {
      showPlayerNames: false,
      playerSize: 1.3,
    },
    validation: {
      showConstraintBoundaries: false,
    },
  },

  /**
   * High contrast configuration for accessibility
   */
  highContrast: {
    appearance: {
      theme: "dark" as const,
      playerColors: {
        S: "#00ff00", // Bright green for setter
        OPP: "#ffff00", // Bright yellow for opposite
        OH: "#00ffff", // Bright cyan for outside hitters
        MB: "#ff00ff", // Bright magenta for middle blockers
        violation: "#ff0000", // Bright red for violations
      },
      courtColor: "#000000",
      fontSize: {
        playerNames: 16,
        violations: 18,
      },
    },
    accessibility: {
      enableHighContrast: true,
      enableScreenReader: true,
    },
  },
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Utility function to create a volleyball court with preset configuration
 *
 * @param preset - The preset name to use
 * @param overrides - Optional configuration overrides
 * @returns Complete volleyball court configuration
 */
export function createVolleyballCourtConfig(
  preset: keyof typeof VolleyballCourtPresets,
  overrides?: Partial<VolleyballCourtConfig>
): VolleyballCourtConfig {
  const baseConfig = VolleyballCourtPresets[preset];

  // Simple merge without ConfigurationManager dependency
  const merged = {
    ...baseConfig,
    ...overrides,
  } as VolleyballCourtConfig;

  // Deep merge nested objects
  if (overrides?.controls && baseConfig.controls) {
    merged.controls = { ...baseConfig.controls, ...overrides.controls };
  }
  if (overrides?.validation && baseConfig.validation) {
    merged.validation = { ...baseConfig.validation, ...overrides.validation };
  }
  if (overrides?.appearance && baseConfig.appearance) {
    merged.appearance = { ...baseConfig.appearance, ...overrides.appearance };
  }
  if (overrides?.animation && baseConfig.animation) {
    merged.animation = { ...baseConfig.animation, ...overrides.animation };
  }

  return merged;
}

/**
 * Utility function to validate a volleyball court configuration
 *
 * @param config - The configuration to validate
 * @returns Validation result with errors and warnings
 */
export function validateVolleyballCourtConfig(config: VolleyballCourtConfig) {
  // Simple validation without ConfigurationManager dependency
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (config.initialSystem && !["5-1", "6-2"].includes(config.initialSystem)) {
    errors.push(`Invalid system: ${config.initialSystem}`);
  }

  if (
    config.initialRotation !== undefined &&
    (config.initialRotation < 0 || config.initialRotation > 5)
  ) {
    errors.push(`Invalid rotation: ${config.initialRotation}`);
  }

  if (
    config.initialFormation &&
    !["rotational", "serveReceive", "base"].includes(config.initialFormation)
  ) {
    errors.push(`Invalid formation: ${config.initialFormation}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Utility function to get all available configuration presets
 *
 * @returns Object containing all preset configurations
 */
export function getVolleyballCourtPresets() {
  return VolleyballCourtPresets;
}

// =============================================================================
// VERSION INFORMATION
// =============================================================================

/**
 * Package version and build information
 */
export const VolleyballCourtPackageInfo = {
  name: "@volleyball-visualizer/court",
  version: "1.0.0",
  buildDate: new Date().toISOString(),
  license: "MIT",
  homepage: "https://github.com/volleyball-visualizer/court",
  bugs: "https://github.com/volleyball-visualizer/court/issues",
  repository: {
    type: "git",
    url: "https://github.com/volleyball-visualizer/court.git",
  },
  keywords: [
    "volleyball",
    "visualization",
    "react",
    "component",
    "sports",
    "court",
    "formation",
    "drag-and-drop",
  ],
  peerDependencies: {
    react: ">=18.0.0",
    "react-dom": ">=18.0.0",
  },
  optionalDependencies: {
    "framer-motion": ">=10.0.0",
  },
} as const;
