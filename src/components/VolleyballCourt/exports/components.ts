/**
 * Component-only exports for tree-shaking optimization
 * 
 * This module exports only the React components without utilities,
 * types, or configuration helpers to minimize bundle size when
 * only components are needed.
 * 
 * @module @volleyball-visualizer/court/components
 */

// Core components
export { VolleyballCourt } from "../VolleyballCourt";
export { VolleyballCourtProvider, useVolleyballCourt } from "../VolleyballCourtProvider";
export { VolleyballCourtErrorBoundary } from "../VolleyballCourtErrorBoundary";

// Layer components
export { CourtVisualization } from "../CourtVisualization";
export { PlayerLayer } from "../PlayerLayer";
export { ControlsLayer } from "../ControlsLayer";
export { ValidationLayer } from "../ValidationLayer";
export { NotificationLayer } from "../NotificationLayer";
export { ReadOnlyIndicator } from "../ReadOnlyIndicator";

// Configuration component
export { ConfigurationPanel } from "../ConfigurationPanel";

// Essential types for components
export type {
  VolleyballCourtProps,
  VolleyballCourtConfig,
  PlayerDefinition,
  PositionData,
  ViolationData,
  ShareData,
  ErrorData,
} from "../types";