/**
 * Utility functions exports for tree-shaking optimization
 * 
 * This module exports utility functions, configuration managers,
 * and helper classes without React components.
 * 
 * @module @volleyball-visualizer/court/utils
 */

// Configuration utilities
export {
  ConfigurationManager,
  ConfigurationBuilder,
  PlayerCustomization,
  RotationCustomization,
  ThemeCustomization,
  AdvancedConfiguration,
} from "../ConfigurationUtils";

// Persistence utilities
export { VolleyballCourtPersistenceManager } from "../PersistenceManager";

// Rules engine integration
export { VolleyballCourtRulesIntegration } from "../VolleyballCourtRulesIntegration";

// Court coordinate utilities
export * from "../courtCoordinates";

// Utility types
export type {
  RulesIntegrationConfig,
  ScreenValidationResult,
  PositionValidationContext,
} from "../VolleyballCourtRulesIntegration";

export type {
  CustomPlayersConfig,
  CustomRotationsConfig,
  ValidationConfig,
  AnimationConfig,
  AppearanceConfig,
  AccessibilityConfig,
  PerformanceConfig,
  ExportConfig,
  LocalizationConfig,
  PlayerColorConfig,
  CourtDimensions,
  ConstraintBoundaries,
  ConstraintLine,
  BoundingBox,
} from "../types";