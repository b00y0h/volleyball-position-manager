/**
 * Configuration presets exports for tree-shaking optimization
 *
 * This module exports pre-built configuration presets and
 * related utility functions.
 *
 * @module @volleyball-visualizer/court/presets
 */

import { VolleyballCourtConfig } from "../types";

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

  /**
   * Performance optimized configuration for large displays
   */
  performance: {
    animation: {
      enableAnimations: false,
    },
    validation: {
      enableRealTimeValidation: false,
    },
    performance: {
      enableVirtualization: true,
      debounceMs: 100,
      throttleMs: 50,
    },
  },

  /**
   * Coaching configuration with full analytics
   */
  coaching: {
    controls: {
      showSystemSelector: true,
      showRotationControls: true,
      showFormationSelector: true,
      showResetButton: true,
      showShareButton: true,
      showAnimateButton: true,
      showUndoRedoButtons: true,
    },
    validation: {
      enableRealTimeValidation: true,
      showConstraintBoundaries: true,
      showViolationDetails: true,
      enableEducationalMessages: true,
      strictMode: false, // Allow some flexibility for coaching
    },
    appearance: {
      showPlayerNames: true,
      showPlayerNumbers: true,
      showPositionLabels: true,
    },
    export: {
      enableImageExport: true,
      enableDataExport: true,
    },
  },
} as const;

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
 * Utility function to get all available configuration presets
 *
 * @returns Object containing all preset configurations
 */
export function getVolleyballCourtPresets() {
  return VolleyballCourtPresets;
}

/**
 * Utility function to list available preset names
 *
 * @returns Array of preset names
 */
export function getPresetNames(): (keyof typeof VolleyballCourtPresets)[] {
  return Object.keys(
    VolleyballCourtPresets
  ) as (keyof typeof VolleyballCourtPresets)[];
}

/**
 * Utility function to validate a preset name
 *
 * @param preset - The preset name to validate
 * @returns True if the preset exists
 */
export function isValidPreset(
  preset: string
): preset is keyof typeof VolleyballCourtPresets {
  return preset in VolleyballCourtPresets;
}
