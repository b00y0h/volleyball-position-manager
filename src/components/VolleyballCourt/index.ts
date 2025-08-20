/**
 * VolleyballCourt Component - Main Export
 *
 * A reusable, configurable volleyball court visualization component
 * with full integration of the volleyball rules engine.
 */

export { VolleyballCourt } from "./VolleyballCourt";
export { CourtVisualization } from "./CourtVisualization";
export {
  VolleyballCourtProvider,
  useVolleyballCourt,
} from "./VolleyballCourtProvider";
export { PlayerLayer } from "./PlayerLayer";
export { ControlsLayer } from "./ControlsLayer";
export * from "./controls";
export { VolleyballCourtRulesIntegration } from "./VolleyballCourtRulesIntegration";
export * from "./courtCoordinates";
export type {
  VolleyballCourtProps,
  VolleyballCourtConfig,
  PlayerDefinition,
  RotationMapping,
  PositionData,
  ViolationData,
  ShareData,
  ErrorData,
  CustomPlayersConfig,
  CustomRotationsConfig,
  ValidationConfig,
  AnimationConfig,
  ControlsConfig,
  PlayerColorConfig,
  CourtDimensions,
  ConstraintBoundaries,
  ConstraintLine,
  BoundingBox,
  ControlsLayerProps,
  ResetType,
} from "./types";

export type {
  RulesIntegrationConfig,
  ScreenValidationResult,
  PositionValidationContext,
} from "./VolleyballCourtRulesIntegration";
