/**
 * State converter for bidirectional conversion between screen and volleyball coordinates
 * Integrates the volleyball rules engine with the existing visualizer coordinate system
 */

import { CoordinateTransformer, Point } from "./CoordinateTransformer";
import { PlayerState, RotationSlot, Role } from "../types/PlayerState";
import { PlayerPosition, FormationType, SystemType } from "../../types";
import { COORDINATE_SYSTEM } from "../types/CoordinateSystem";

/**
 * Screen-based player state (existing visualizer format)
 */
export interface ScreenPlayerState {
  id: string;
  displayName: string;
  role: string;
  slot: RotationSlot;
  x: number; // Screen pixels (0-600)
  y: number; // Screen pixels (0-360)
  isServer: boolean;
  isCustom: boolean;
  lastModified: Date;
}

/**
 * Volleyball-based player state (rules engine format)
 */
export interface VolleyballPlayerState extends PlayerState {
  // Inherits all PlayerState properties
  // Coordinates are in volleyball court meters (0-9 x, 0-11 y)
}

/**
 * Conversion utilities between screen and volleyball coordinate systems
 */
export class StateConverter {
  /**
   * Convert screen player state to volleyball player state
   * @param screenState - Player state in screen coordinates
   * @param slot - Rotation slot (1-6)
   * @param isServer - Whether this player is serving
   * @returns Player state in volleyball coordinates
   */
  static toVolleyballState(
    screenState: ScreenPlayerState,
    slot: RotationSlot,
    isServer: boolean = false
  ): VolleyballPlayerState {
    // Convert coordinates from screen to volleyball
    const vbCoords = CoordinateTransformer.screenToVolleyball(
      screenState.x,
      screenState.y
    );

    // Map role string to volleyball role type
    const role = this.mapToVolleyballRole(screenState.role);

    return {
      id: screenState.id,
      displayName: screenState.displayName,
      role,
      slot,
      x: vbCoords.x,
      y: vbCoords.y,
      isServer,
    };
  }

  /**
   * Convert volleyball player state to screen player state
   * @param vbState - Player state in volleyball coordinates
   * @returns Player state in screen coordinates
   */
  static toScreenState(vbState: VolleyballPlayerState): ScreenPlayerState {
    // Convert coordinates from volleyball to screen
    const screenCoords = CoordinateTransformer.volleyballToScreen(
      vbState.x,
      vbState.y
    );

    return {
      id: vbState.id,
      displayName: vbState.displayName,
      role: vbState.role,
      slot: vbState.slot,
      isServer: vbState.isServer,
      x: screenCoords.x,
      y: screenCoords.y,
      isCustom: true, // Assume converted positions are custom
      lastModified: new Date(),
    };
  }

  /**
   * Convert PlayerPosition to volleyball coordinates
   * @param position - PlayerPosition from existing system
   * @returns Point in volleyball coordinates
   */
  static playerPositionToVolleyball(position: PlayerPosition): Point {
    return CoordinateTransformer.screenToVolleyball(position.x, position.y);
  }

  /**
   * Convert volleyball coordinates to PlayerPosition
   * @param vbPoint - Point in volleyball coordinates
   * @param isCustom - Whether this is a custom position
   * @returns PlayerPosition for existing system
   */
  static volleyballToPlayerPosition(
    vbPoint: Point,
    isCustom: boolean = true
  ): PlayerPosition {
    const screenCoords = CoordinateTransformer.volleyballToScreen(
      vbPoint.x,
      vbPoint.y
    );

    return {
      x: screenCoords.x,
      y: screenCoords.y,
      isCustom,
      lastModified: new Date(),
    };
  }

  /**
   * Convert formation positions to volleyball player states
   * @param positions - Formation positions from existing system
   * @param rotationMap - Mapping from rotation slot to player ID
   * @param serverSlot - Which slot is serving (1-6)
   * @returns Array of volleyball player states
   */
  static formationToVolleyballStates(
    positions: Record<string, PlayerPosition>,
    rotationMap: Record<number, string>,
    serverSlot: RotationSlot = 1
  ): VolleyballPlayerState[] {
    const states: VolleyballPlayerState[] = [];

    // Convert each position to volleyball state
    for (const [slotStr, playerId] of Object.entries(rotationMap)) {
      const slot = parseInt(slotStr) as RotationSlot;
      const position = positions[playerId];

      if (position) {
        const vbCoords = CoordinateTransformer.screenToVolleyball(
          position.x,
          position.y
        );

        states.push({
          id: playerId,
          displayName: playerId, // Use ID as display name if not available
          role: "Unknown", // Default role
          slot,
          x: vbCoords.x,
          y: vbCoords.y,
          isServer: slot === serverSlot,
        });
      }
    }

    return states;
  }

  /**
   * Convert volleyball player states back to formation positions
   * @param states - Array of volleyball player states
   * @returns Formation positions for existing system
   */
  static volleyballStatesToFormation(
    states: VolleyballPlayerState[]
  ): Record<string, PlayerPosition> {
    const positions: Record<string, PlayerPosition> = {};

    for (const state of states) {
      const screenCoords = CoordinateTransformer.volleyballToScreen(
        state.x,
        state.y
      );

      positions[state.id] = {
        x: screenCoords.x,
        y: screenCoords.y,
        isCustom: true,
        lastModified: new Date(),
      };
    }

    return positions;
  }

  /**
   * Create rotation map from volleyball player states
   * @param states - Array of volleyball player states
   * @returns Rotation map (slot -> player ID)
   */
  static createRotationMap(
    states: VolleyballPlayerState[]
  ): Record<number, string> {
    const rotationMap: Record<number, string> = {};

    for (const state of states) {
      rotationMap[state.slot] = state.id;
    }

    return rotationMap;
  }

  /**
   * Find the serving player from volleyball states
   * @param states - Array of volleyball player states
   * @returns Rotation slot of the server, or 1 if none found
   */
  static findServerSlot(states: VolleyballPlayerState[]): RotationSlot {
    const server = states.find((state) => state.isServer);
    return server ? server.slot : 1;
  }

  /**
   * Validate that coordinates are within acceptable bounds for the target system
   * @param point - Point to validate
   * @param isVolleyball - Whether point is in volleyball coordinates
   * @param allowServiceZone - Whether to allow service zone coordinates
   * @returns True if coordinates are valid
   */
  static isValidCoordinates(
    point: Point,
    isVolleyball: boolean = true,
    allowServiceZone: boolean = false
  ): boolean {
    if (isVolleyball) {
      return CoordinateTransformer.isValidPosition(
        point.x,
        point.y,
        allowServiceZone
      );
    } else {
      // Screen coordinates validation
      return point.x >= 0 && point.x <= 600 && point.y >= 0 && point.y <= 360;
    }
  }

  /**
   * Normalize coordinates to ensure they are within valid bounds
   * @param point - Point to normalize
   * @param isVolleyball - Whether point is in volleyball coordinates
   * @param allowServiceZone - Whether to allow service zone coordinates
   * @returns Normalized point
   */
  static normalizeCoordinates(
    point: Point,
    isVolleyball: boolean = true,
    allowServiceZone: boolean = false
  ): Point {
    if (isVolleyball) {
      return CoordinateTransformer.normalizeCoordinates(
        point.x,
        point.y,
        allowServiceZone
      );
    } else {
      // Screen coordinates normalization
      return {
        x: Math.max(0, Math.min(600, point.x)),
        y: Math.max(0, Math.min(360, point.y)),
      };
    }
  }

  /**
   * Map string role to volleyball role type
   * @param roleString - Role as string
   * @returns Volleyball role type
   */
  private static mapToVolleyballRole(roleString: string): Role {
    const roleMap: Record<string, Role> = {
      setter: "S",
      opposite: "OPP",
      "outside-hitter": "OH1",
      "outside-hitter-1": "OH1",
      "outside-hitter-2": "OH2",
      "middle-blocker": "MB1",
      "middle-blocker-1": "MB1",
      "middle-blocker-2": "MB2",
      libero: "L",
      "defensive-specialist": "DS",
      S: "S",
      OPP: "OPP",
      OH1: "OH1",
      OH2: "OH2",
      MB1: "MB1",
      MB2: "MB2",
      L: "L",
      DS: "DS",
    };

    return roleMap[roleString.toLowerCase()] || "Unknown";
  }

  /**
   * Get coordinate system information
   * @returns Object with coordinate system details
   */
  static getCoordinateSystemInfo() {
    return {
      volleyball: {
        width: COORDINATE_SYSTEM.COURT_WIDTH,
        height: COORDINATE_SYSTEM.COURT_LENGTH,
        serviceZoneEnd: COORDINATE_SYSTEM.SERVICE_ZONE_END,
        tolerance: COORDINATE_SYSTEM.TOLERANCE,
      },
      screen: {
        width: 600,
        height: 360,
      },
      scalingFactors: CoordinateTransformer.getScalingFactors(),
    };
  }

  /**
   * Create migration utilities for existing position data
   * @param existingPositions - Existing position data structure
   * @returns Migrated position data with volleyball coordinate support
   */
  static migrateExistingPositions(
    existingPositions: Record<string, any>
  ): Record<string, any> {
    // This would be used to migrate existing saved positions
    // to include volleyball coordinate metadata
    const migrated = { ...existingPositions };

    // Add volleyball coordinate system metadata
    migrated._coordinateSystem = {
      version: "1.0.0",
      type: "hybrid", // Supports both screen and volleyball coordinates
      migratedAt: new Date().toISOString(),
    };

    return migrated;
  }
}
