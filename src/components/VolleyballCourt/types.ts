/**
 * TypeScript interfaces for VolleyballCourt component
 */

import React from "react";
// Import common types that should be defined within this package
export type SystemType = "5-1" | "6-2";
export type FormationType = "rotational" | "serveReceive" | "base";

export interface PlayerPosition {
  x: number;
  y: number;
  isCustom?: boolean;
  lastModified?: Date;
}

// Constants for type validation
export const PLAYER_RADIUS = 20;

// Re-export types for consistency
export type { SystemType, FormationType, PlayerPosition };

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
  onPositionChange?: (data: PositionData) => void;
  onRotationChange?: (data: RotationChangeData) => void;
  onFormationChange?: (data: FormationChangeData) => void;
  onViolation?: (violations: ViolationData[]) => void;
  onShare?: (shareData: ShareData) => void;
  onError?: (error: ErrorData) => void;

  // Extended callbacks
  onPlayerDragStart?: (data: PlayerDragData) => void;
  onPlayerDragEnd?: (data: PlayerDragData) => void;
  onValidationStateChange?: (data: ValidationStateData) => void;
  onConfigurationChange?: (data: ConfigurationChangeData) => void;
  onSystemChange?: (data: SystemChangeData) => void;

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

export type PlayerRole = "S" | "OPP" | "OH" | "MB";

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
  timestamp: number;
  changedPlayers?: string[]; // List of player IDs that changed
  changeType?:
    | "drag"
    | "formation-change"
    | "rotation-change"
    | "reset"
    | "manual";
  metadata?: {
    previousPositions?: Record<string, PlayerPosition>;
    draggedPlayerId?: string;
    validationStatus?: "valid" | "invalid" | "warning";
  };
}

// Violation data for callbacks
export interface ViolationData {
  id: string; // Unique violation ID
  code: string;
  message: string;
  affectedPlayers: string[];
  severity: "error" | "warning" | "info";
  timestamp: number;
  violationType:
    | "positioning"
    | "rotation"
    | "formation"
    | "court-boundary"
    | "custom";
  context: {
    system: SystemType;
    rotation: number;
    formation: FormationType;
    positions: Record<string, PlayerPosition>;
  };
  metadata?: {
    rule?: string;
    suggestedFix?: string;
    autoFixAvailable?: boolean;
    educationalNote?: string;
  };
}

// Share data for callbacks
export interface ShareData {
  url: string;
  shortUrl?: string;
  qrCode?: string; // Base64 encoded QR code image
  config: VolleyballCourtConfig;
  positions: PositionData;
  timestamp: number;
  shareId?: string; // Unique identifier for this share
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    expiresAt?: number;
    isPublic?: boolean;
    shareMethod?: "url" | "qr" | "clipboard" | "email" | "social";
  };
}

// Error data for callbacks
export interface ErrorData {
  id: string; // Unique error ID
  type:
    | "validation"
    | "storage"
    | "network"
    | "permission"
    | "configuration"
    | "unknown";
  message: string;
  timestamp: number;
  severity: "low" | "medium" | "high" | "critical";
  details?: unknown;
  context?: {
    component?: string;
    action?: string;
    state?: Record<string, unknown>;
  };
  recovery?: {
    isRecoverable: boolean;
    suggestedActions?: string[];
    autoRecoveryAttempted?: boolean;
    retryable?: boolean;
  };
}

// Extended callback data interfaces
export interface RotationChangeData {
  previousRotation: number;
  newRotation: number;
  system: SystemType;
  formation: FormationType;
  timestamp: number;
  changeType: "manual" | "programmatic" | "animation";
  metadata?: {
    triggeredBy?: string; // Component or user action that triggered the change
    animationDuration?: number;
  };
}

export interface FormationChangeData {
  previousFormation: FormationType;
  newFormation: FormationType;
  system: SystemType;
  rotation: number;
  timestamp: number;
  changeType: "manual" | "programmatic";
  metadata?: {
    triggeredBy?: string;
    affectedPlayers?: string[];
  };
}

export interface PlayerDragData {
  playerId: string;
  playerName: string;
  playerRole: "S" | "Opp" | "OH" | "MB";
  startPosition?: PlayerPosition;
  currentPosition?: PlayerPosition;
  endPosition?: PlayerPosition;
  isValid: boolean;
  violations: ViolationData[];
  timestamp: number;
  metadata?: {
    dragDistance?: number;
    dragDuration?: number;
    snapToPosition?: PlayerPosition;
    constraintsBoundaries?: ConstraintBoundaries;
  };
}

export interface ValidationStateData {
  isValid: boolean;
  violations: ViolationData[];
  warnings: ViolationData[];
  system: SystemType;
  rotation: number;
  formation: FormationType;
  timestamp: number;
  metadata?: {
    validationMode?: "real-time" | "on-demand" | "on-change";
    performanceMetrics?: {
      validationTime: number;
      constraintCalculationTime: number;
    };
  };
}

export interface ConfigurationChangeData {
  changedKeys: string[];
  previousConfig: Partial<VolleyballCourtConfig>;
  newConfig: Partial<VolleyballCourtConfig>;
  timestamp: number;
  changeType: "user" | "preset" | "programmatic";
  metadata?: {
    triggeredBy?: string;
    affectedComponents?: string[];
  };
}

export interface SystemChangeData {
  previousSystem: SystemType;
  newSystem: SystemType;
  timestamp: number;
  changeType: "manual" | "programmatic";
  metadata?: {
    triggeredBy?: string;
    playersChanged?: boolean;
    rotationsChanged?: boolean;
    positionsReset?: boolean;
  };
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
  [playerId: string]: string | undefined;
  // Role-based colors
  S?: string; // Setter
  OPP?: string; // Opposite
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
