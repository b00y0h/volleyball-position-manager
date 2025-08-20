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
}

// Player definition
export interface PlayerDefinition {
  id: string;
  name: string;
  role: PlayerRole;
  color?: string;
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
  details?: any;
}

// Configuration sub-interfaces
export interface ControlsConfig {
  showSystemSelector?: boolean;
  showRotationControls?: boolean;
  showFormationSelector?: boolean;
  showResetButton?: boolean;
  showShareButton?: boolean;
  showAnimateButton?: boolean;
}

export interface ValidationConfig {
  enableRealTimeValidation?: boolean;
  showConstraintBoundaries?: boolean;
  enablePositionSnapping?: boolean;
  showViolationDetails?: boolean;
}

export interface AppearanceConfig {
  theme?: "light" | "dark" | "auto";
  courtColor?: string;
  playerColors?: PlayerColorConfig;
  showPlayerNames?: boolean;
  showPositionLabels?: boolean;
}

export interface PlayerColorConfig {
  [playerId: string]: string;
}

export interface AnimationConfig {
  enableAnimations?: boolean;
  animationDuration?: number;
  easing?: string;
}

export interface CustomPlayersConfig {
  "5-1"?: PlayerDefinition[];
  "6-2"?: PlayerDefinition[];
}

export interface CustomRotationsConfig {
  "5-1"?: RotationMapping[];
  "6-2"?: RotationMapping[];
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
  positions: any; // Will be typed based on position manager
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
  onDragStart: (playerId: string) => void;
  onDragEnd: (playerId: string, success: boolean) => void;
  onPositionChange: (playerId: string, position: PlayerPosition) => void;
  onResetPosition?: (playerId: string) => void;
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
