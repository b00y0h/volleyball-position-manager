/**
 * TypeScript interfaces for VolleyballCourt component
 */

import React from "react";
import { SystemType, FormationType, PlayerPosition } from "@/types";

// Core component props
export interface VolleyballCourtProps {
  // Configuration
  config?: VolleyballCourtConfig;

  // Styling
  className?: string;
  style?: React.CSSProperties;
  courtDimensions?: CourtDimensions;

  // Behavior
  readOnly?: boolean;
  showControls?: boolean;
  enableSharing?: boolean;
  enablePersistence?: boolean;

  // Event callbacks
  onPositionChange?: (positions: PositionData) => void;
  onRotationChange?: (rotation: number) => void;
  onFormationChange?: (formation: FormationType) => void;
  onViolation?: (violations: ViolationData[]) => void;
  onShare?: (shareData: ShareData) => void;
  onError?: (error: ErrorData) => void;

  // Advanced configuration
  customPlayers?: CustomPlayersConfig;
  customRotations?: CustomRotationsConfig;
  validationConfig?: ValidationConfig;
  animationConfig?: AnimationConfig;
}

// Main configuration object
export interface VolleyballCourtConfig {
  // Initial state
  initialSystem?: SystemType;
  initialRotation?: number;
  initialFormation?: FormationType;

  // Player configuration
  players?: {
    "5-1": PlayerDefinition[];
    "6-2": PlayerDefinition[];
  };

  // Rotation configuration
  rotations?: {
    "5-1": RotationMapping[];
    "6-2": RotationMapping[];
  };

  // UI configuration
  controls?: ControlsConfig;

  // Validation configuration
  validation?: ValidationConfig;

  // Appearance configuration
  appearance?: AppearanceConfig;

  // Animation configuration
  animation?: AnimationConfig;

  // Interaction configuration
  interaction?: InteractionConfig;

  // Accessibility configuration
  accessibility?: AccessibilityConfig;

  // Performance configuration
  performance?: PerformanceConfig;

  // Localization configuration
  localization?: LocalizationConfig;

  // Export configuration
  export?: ExportConfig;

  // Custom configuration for extensibility
  custom?: Record<string, unknown>;
}

// Player definition
export interface PlayerDefinition {
  id: string;
  name: string;
  role: PlayerRole;
  color?: string;
  number?: number;
  avatar?: string; // URL to player image
  customData?: Record<string, unknown>; // For extensibility
  locked?: boolean; // Prevent dragging
  hidden?: boolean; // Hide from display
  size?: number; // Custom size multiplier
}

export type PlayerRole = "S" | "Opp" | "OH" | "MB";

// Rotation mapping
export interface RotationMapping {
  [position: number]: string; // position -> playerId
}

// Position data for callbacks
export interface PositionData {
  system: SystemType;
  rotation: number;
  formation: FormationType;
  positions: Record<string, PlayerPosition>;
}

// Violation data for callbacks
export interface ViolationData {
  code: string;
  message: string;
  affectedPlayers: string[];
  severity: "error" | "warning";
}

// Share data for callbacks
export interface ShareData {
  url: string;
  config: VolleyballCourtConfig;
  positions: PositionData;
}

// Error data for callbacks
export interface ErrorData {
  type: "validation" | "storage" | "network" | "unknown";
  message: string;
  details?: unknown;
}

// Configuration sub-interfaces
export interface ControlsConfig {
  showSystemSelector?: boolean;
  showRotationControls?: boolean;
  showFormationSelector?: boolean;
  showResetButton?: boolean;
  showShareButton?: boolean;
  showAnimateButton?: boolean;
  showUndoRedoButtons?: boolean;
  showPositionLockButtons?: boolean;
  showValidationToggle?: boolean;
  controlsPosition?: "top" | "bottom" | "left" | "right" | "overlay";
  controlsStyle?: "compact" | "expanded" | "minimal";
  customControls?: CustomControlConfig[];
}

export interface CustomControlConfig {
  id: string;
  label: string;
  icon?: string;
  position: number; // Order in controls
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}

export interface ValidationConfig {
  enableRealTimeValidation?: boolean;
  showConstraintBoundaries?: boolean;
  enablePositionSnapping?: boolean;
  showViolationDetails?: boolean;
  snapTolerance?: number;
  constraintLineWidth?: number;
  constraintLineColor?: string;
  violationDisplayDuration?: number;
  enableEducationalMessages?: boolean;
  strictMode?: boolean; // Enforce all rules strictly
  customRules?: CustomRuleConfig[];
}

export interface CustomRuleConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: "error" | "warning" | "info";
  validator: (
    positions: Record<string, PlayerPosition>,
    context: ValidationContext
  ) => boolean;
  message: string;
}

export interface ValidationContext {
  system: SystemType;
  rotation: number;
  formation: FormationType;
  courtDimensions: CourtDimensions;
}

export interface AppearanceConfig {
  theme?: "light" | "dark" | "auto";
  courtColor?: string;
  courtBackgroundColor?: string;
  lineColor?: string;
  netColor?: string;
  playerColors?: PlayerColorConfig;
  playerSize?: number;
  showPlayerNames?: boolean;
  showPositionLabels?: boolean;
  showPlayerNumbers?: boolean;
  showCourtGrid?: boolean;
  showCourtZones?: boolean;
  customCSS?: string;
  fontFamily?: string;
  fontSize?: {
    playerNames?: number;
    positionLabels?: number;
    violations?: number;
  };
}

export interface PlayerColorConfig {
  [playerId: string]: string;
  // Role-based colors
  S?: string; // Setter
  Opp?: string; // Opposite
  OH?: string; // Outside Hitter
  MB?: string; // Middle Blocker
  // System-based colors
  frontRow?: string;
  backRow?: string;
  // Special states
  serving?: string;
  dragging?: string;
  violation?: string;
}

export interface AnimationConfig {
  enableAnimations?: boolean;
  animationDuration?: number;
  easing?: string;
  enableDragAnimations?: boolean;
  enableFormationTransitions?: boolean;
  enableRotationAnimations?: boolean;
  staggerDelay?: number; // Delay between player animations
  bounceOnViolation?: boolean;
  highlightOnHover?: boolean;
  customTransitions?: {
    [key: string]: {
      duration: number;
      easing: string;
      delay?: number;
    };
  };
}

export interface CustomPlayersConfig {
  "5-1"?: PlayerDefinition[];
  "6-2"?: PlayerDefinition[];
}

export interface CustomRotationsConfig {
  "5-1"?: RotationMapping[];
  "6-2"?: RotationMapping[];
}

// Advanced configuration interfaces
export interface InteractionConfig {
  enableDragAndDrop?: boolean;
  enableKeyboardNavigation?: boolean;
  enableTouchGestures?: boolean;
  dragConstraints?: "strict" | "loose" | "none";
  multiSelectEnabled?: boolean;
  contextMenuEnabled?: boolean;
  doubleClickAction?: "reset" | "lock" | "edit" | "none";
}

export interface AccessibilityConfig {
  enableScreenReader?: boolean;
  enableKeyboardNavigation?: boolean;
  enableHighContrast?: boolean;
  announceViolations?: boolean;
  customAriaLabels?: Record<string, string>;
  focusIndicatorStyle?: "outline" | "highlight" | "glow";
}

export interface PerformanceConfig {
  enableVirtualization?: boolean;
  debounceValidation?: number;
  throttleDragUpdates?: number;
  enableLazyLoading?: boolean;
  maxHistorySize?: number;
  enableCaching?: boolean;
}

export interface LocalizationConfig {
  language?: string;
  translations?: Record<string, Record<string, string>>;
  dateFormat?: string;
  numberFormat?: string;
  rtlSupport?: boolean;
}

export interface ExportConfig {
  enableImageExport?: boolean;
  enableDataExport?: boolean;
  exportFormats?: ("png" | "svg" | "pdf" | "json" | "csv")[];
  defaultImageSize?: { width: number; height: number };
  includeMetadata?: boolean;
}

// Court dimensions
export interface CourtDimensions {
  width: number;
  height: number;
  aspectRatio?: number;
}

// Visual constraint boundaries
export interface ConstraintBoundaries {
  horizontalLines: ConstraintLine[];
  verticalLines: ConstraintLine[];
  validArea?: BoundingBox;
}

export interface ConstraintLine {
  position: number;
  type: "min" | "max";
  reason: string;
}

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Internal state interface
export interface VolleyballCourtState {
  // Core state
  system: SystemType;
  rotationIndex: number;
  formation: FormationType;
  isAnimating: boolean;
  draggedPlayer: string | null;

  // Validation state
  violations: string[];
  visualGuidelines: ConstraintBoundaries;

  // UI state
  isReadOnly: boolean;
  showControls: boolean;
  shareURL: string;
  showShareDialog: boolean;

  // Position state (managed by useEnhancedPositionManager)
  positions: Record<string, PlayerPosition>; // Position data
  isLoading: boolean;
  error: string | null;
}

// Sub-component prop interfaces
export interface CourtVisualizationProps {
  dimensions: CourtDimensions;
  theme: "light" | "dark";
  courtColor?: string;
  showGrid?: boolean;
  showZones?: boolean;
  className?: string;
}

export interface PlayerLayerProps {
  players: PlayerDefinition[];
  positions: Record<string, PlayerPosition>;
  rotationMap: Record<number, string>;
  formation: FormationType;
  draggedPlayer: string | null;
  visualGuidelines: ConstraintBoundaries;
  readOnly: boolean;
  courtDimensions: CourtDimensions;
  system?: SystemType;
  rotation?: number;
  onDragStart: (playerId: string) => void;
  onDragEnd: (playerId: string, success: boolean) => void;
  onPositionChange: (playerId: string, position: PlayerPosition) => void;
  onResetPosition?: (playerId: string) => void;
  onVolleyballRuleViolation?: (playerId: string, violations: string[]) => void;
}

export interface ControlsLayerProps {
  system: SystemType;
  rotationIndex: number;
  formation: FormationType;
  isAnimating: boolean;
  isReadOnly: boolean;
  controlsConfig: ControlsConfig;
  onSystemChange: (system: SystemType) => void;
  onRotationChange: (rotation: number) => void;
  onFormationChange: (formation: FormationType) => void;
  onReset: (type: ResetType) => void;
  onShare: () => void;
  onAnimate: () => void;
}

export type ResetType = "current" | "all" | "formation" | "system";

export interface ValidationLayerProps {
  violations: ViolationData[];
  showDetails: boolean;
  onDismiss?: () => void;
}
