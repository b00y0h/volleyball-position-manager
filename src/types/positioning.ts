/**
 * Core data structures for customizable player positioning
 */

export interface PlayerPosition {
  x: number;
  y: number;
  isCustom: boolean;
  lastModified: Date;
}

export interface FormationPositions {
  rotational: Record<string, PlayerPosition>;
  serveReceive: Record<string, PlayerPosition>;
  base: Record<string, PlayerPosition>;
}

export interface CustomPositionsState {
  [rotationIndex: number]: FormationPositions;
}

export interface URLPositionData {
  system: "5-1" | "6-2";
  rotation: number;
  positions: CustomPositionsState;
  version: string;
}

export interface StoredPositions {
  version: string;
  lastModified: Date;
  positions: {
    "5-1": CustomPositionsState;
    "6-2": CustomPositionsState;
  };
}

export interface URLParams {
  d: string; // compressed position data
  v: string; // version
  s: string; // system
  r: string; // rotation
}

export type FormationType = "rotational" | "serveReceive" | "base";
export type SystemType = "5-1" | "6-2";

// Court dimensions (matching current implementation)
export const COURT_DIMENSIONS = {
  width: 600,
  height: 360,
} as const;

// Player collision detection radius
export const PLAYER_RADIUS = 18;
export const MIN_PLAYER_DISTANCE = PLAYER_RADIUS * 2 + 6; // 42px minimum distance
