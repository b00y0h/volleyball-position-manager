/**
 * Type definitions exports for tree-shaking optimization
 * 
 * This module exports only TypeScript type definitions
 * without any runtime code.
 * 
 * @module @volleyball-visualizer/court/types
 */

// Core component and configuration types
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
} from "../types";

// Rules integration types
export type {
  RulesIntegrationConfig,
  ScreenValidationResult,
  PositionValidationContext,
} from "../VolleyballCourtRulesIntegration";