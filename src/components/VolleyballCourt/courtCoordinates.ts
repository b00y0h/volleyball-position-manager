/**
 * Court coordinate system utilities for volleyball court positioning
 *
 * This module provides utilities for:
 * - Converting between different coordinate systems
 * - Calculating responsive court dimensions
 * - Generating position coordinates for different formations
 * - Scaling coordinates based on court size
 */

import { CourtDimensions } from "./types";
import { SystemType, FormationType, PlayerPosition } from "@/types";

// Base court dimensions (aspect ratio 5:3 for volleyball court)
export const BASE_COURT_WIDTH = 600;
export const BASE_COURT_HEIGHT = 360;
export const COURT_ASPECT_RATIO = BASE_COURT_WIDTH / BASE_COURT_HEIGHT;

/**
 * Calculate responsive court dimensions based on available space
 */
export function calculateCourtDimensions(
  windowWidth: number,
  windowHeight: number,
  customDimensions?: CourtDimensions
): CourtDimensions {
  // If custom dimensions are provided, use them
  if (customDimensions) {
    return {
      width: customDimensions.width,
      height: customDimensions.height,
      aspectRatio:
        customDimensions.aspectRatio ||
        customDimensions.width / customDimensions.height,
    };
  }

  // Reserve space for UI elements
  const SIDEBAR_WIDTH = 300; // Right sidebar
  const HEADER_HEIGHT = 200; // Top controls and status
  const FOOTER_HEIGHT = 100; // Bottom info
  const PADDING = 80; // General padding

  // Available space for the court
  const availableWidth = windowWidth - SIDEBAR_WIDTH - PADDING;
  const availableHeight =
    windowHeight - HEADER_HEIGHT - FOOTER_HEIGHT - PADDING;

  // Calculate court size maintaining aspect ratio
  let courtWidth = availableWidth;
  let courtHeight = courtWidth / COURT_ASPECT_RATIO;

  // If height is too large, constrain by height instead
  if (courtHeight > availableHeight) {
    courtHeight = availableHeight;
    courtWidth = courtHeight * COURT_ASPECT_RATIO;
  }

  // Ensure minimum size for usability
  const MIN_WIDTH = 400;
  const MIN_HEIGHT = MIN_WIDTH / COURT_ASPECT_RATIO;

  courtWidth = Math.max(courtWidth, MIN_WIDTH);
  courtHeight = Math.max(courtHeight, MIN_HEIGHT);

  return {
    width: courtWidth,
    height: courtHeight,
    aspectRatio: COURT_ASPECT_RATIO,
  };
}

/**
 * Scale coordinates from base dimensions to current court dimensions
 */
export function scaleCoordinates(
  coords: Record<number, PlayerPosition>,
  courtDimensions: CourtDimensions
): Record<number, PlayerPosition> {
  const scaleX = courtDimensions.width / BASE_COURT_WIDTH;
  const scaleY = courtDimensions.height / BASE_COURT_HEIGHT;

  const scaledCoords: Record<number, PlayerPosition> = {};
  for (const [key, coord] of Object.entries(coords)) {
    scaledCoords[parseInt(key)] = {
      x: coord.x * scaleX,
      y: coord.y * scaleY,
      isCustom: coord.isCustom,
      lastModified: coord.lastModified || new Date(),
    };
  }
  return scaledCoords;
}

/**
 * Generate base rotational position coordinates
 */
export function getBaseCoordinates(
  courtDimensions: CourtDimensions
): Record<number, PlayerPosition> {
  const { width, height } = courtDimensions;

  return {
    1: { x: width * 0.78, y: height * 0.82, isCustom: false, lastModified: new Date() }, // right-back (1)
    2: { x: width * 0.78, y: height * 0.42, isCustom: false, lastModified: new Date() }, // right-front (2)
    3: { x: width * 0.5, y: height * 0.42, isCustom: false, lastModified: new Date() }, // middle-front (3)
    4: { x: width * 0.22, y: height * 0.42, isCustom: false, lastModified: new Date() }, // left-front (4)
    5: { x: width * 0.22, y: height * 0.82, isCustom: false, lastModified: new Date() }, // left-back (5)
    6: { x: width * 0.5, y: height * 0.82, isCustom: false, lastModified: new Date() }, // middle-back (6)
  };
}

/**
 * Generate serve/receive formation coordinates
 */
export function getServeReceiveCoordinates(
  courtDimensions: CourtDimensions
): Record<string, PlayerPosition> {
  const { width, height } = courtDimensions;

  return {
    SR_right: { x: width * 0.7, y: height * 0.7, isCustom: false, lastModified: new Date() },
    SR_middle: { x: width * 0.5, y: height * 0.65, isCustom: false, lastModified: new Date() },
    SR_left: { x: width * 0.3, y: height * 0.7, isCustom: false, lastModified: new Date() },
    SR_frontRight: { x: width * 0.72, y: height * 0.5, isCustom: false, lastModified: new Date() },
    SR_frontLeft: { x: width * 0.28, y: height * 0.5, isCustom: false, lastModified: new Date() },
  };
}

/**
 * Generate serve/receive targets for specific players based on rotation
 */
export function getServeReceiveTargets(
  rotationMap: Record<number, string>,
  courtDimensions: CourtDimensions
): Record<string, PlayerPosition> {
  // Choose three primary receivers from back-row players in standard preference: 1 (right-back), 6 (mid-back), 5 (left-back)
  const receiverOrder = [1, 6, 5];
  const receivers = receiverOrder
    .map((pos) => rotationMap[pos])
    .filter(Boolean);
  const serveReceiveCoords = getServeReceiveCoordinates(courtDimensions);

  const targets: Record<string, PlayerPosition> = {};

  if (receivers[0]) targets[receivers[0]] = serveReceiveCoords.SR_right;
  if (receivers[1]) targets[receivers[1]] = serveReceiveCoords.SR_middle;
  if (receivers[2]) targets[receivers[2]] = serveReceiveCoords.SR_left;

  return targets;
}

/**
 * Generate base attack formation coordinates with role-specific adjustments
 */
export function getBaseAttackCoordinates(
  rotationMap: Record<number, string>,
  players: Array<{ id: string; role: string }>,
  courtDimensions: CourtDimensions
): Record<string, PlayerPosition> {
  const baseCoords = getBaseCoordinates(courtDimensions);
  const targets: Record<string, PlayerPosition> = {};

  const scaleX = courtDimensions.width / BASE_COURT_WIDTH;
  const scaleY = courtDimensions.height / BASE_COURT_HEIGHT;

  // Apply role-specific positioning adjustments
  for (const [positionStr, playerId] of Object.entries(rotationMap)) {
    const position = parseInt(positionStr);
    const player = players.find((p) => p.id === playerId);

    if (!player || !baseCoords[position]) continue;

    let adjustedCoords = { ...baseCoords[position] };

    // Role-specific adjustments for base attack formation
    switch (player.role) {
      case "OH": // Outside Hitter
        if (position === 2) adjustedCoords.x += 18 * scaleX;
        if (position === 4) adjustedCoords.x -= 18 * scaleX;
        adjustedCoords.y -= 20 * scaleY;
        break;

      case "MB": // Middle Blocker
        if (position === 3) adjustedCoords.y -= 10 * scaleY;
        break;

      case "S": // Setter
        if (position === 1 || position === 6) adjustedCoords.y -= 10 * scaleY;
        break;

      // Opposite and other roles use base positions
      default:
        break;
    }

    targets[playerId] = adjustedCoords;
  }

  return targets;
}

/**
 * Calculate formation-specific coordinates for a player
 */
export function getFormationCoordinates(
  playerId: string,
  formation: FormationType,
  rotationMap: Record<number, string>,
  players: Array<{ id: string; role: string }>,
  courtDimensions: CourtDimensions
): PlayerPosition | null {
  const baseCoords = getBaseCoordinates(courtDimensions);

  // Find player's position number
  const positionEntry = Object.entries(rotationMap).find(
    ([, id]) => id === playerId
  );
  if (!positionEntry) return null;

  const position = parseInt(positionEntry[0]);
  const player = players.find((p) => p.id === playerId);
  if (!player) return null;

  switch (formation) {
    case "rotational":
      return baseCoords[position] || null;

    case "serveReceive": {
      const srTargets = getServeReceiveTargets(rotationMap, courtDimensions);
      if (srTargets[playerId]) {
        return srTargets[playerId];
      }

      // Non-receivers move slightly forward from base position
      const basePos = baseCoords[position];
      if (!basePos) return null;

      const scaleY = courtDimensions.height / BASE_COURT_HEIGHT;
      if (position === 2 || position === 3 || position === 4) {
        return {
          ...basePos,
          y: basePos.y - 40 * scaleY,
        };
      }
      return basePos;
    }

    case "base": {
      const baseAttackCoords = getBaseAttackCoordinates(
        rotationMap,
        players,
        courtDimensions
      );
      return baseAttackCoords[playerId] || baseCoords[position] || null;
    }

    default:
      return baseCoords[position] || null;
  }
}

/**
 * Convert screen coordinates to volleyball court coordinates
 * (for integration with volleyball rules engine)
 */
export function screenToVolleyballCoordinates(
  screenPosition: PlayerPosition,
  courtDimensions: CourtDimensions
): { x: number; y: number } {
  // Normalize to 0-1 range
  const normalizedX = screenPosition.x / courtDimensions.width;
  const normalizedY = screenPosition.y / courtDimensions.height;

  // Convert to volleyball coordinate system (typically -1 to 1 or 0 to 1)
  // This will depend on the volleyball rules engine coordinate system
  return {
    x: normalizedX * 2 - 1, // Convert to -1 to 1 range
    y: normalizedY * 2 - 1, // Convert to -1 to 1 range
  };
}

/**
 * Convert volleyball court coordinates to screen coordinates
 * (for integration with volleyball rules engine)
 */
export function volleyballToScreenCoordinates(
  vbPosition: { x: number; y: number },
  courtDimensions: CourtDimensions
): PlayerPosition {
  // Convert from volleyball coordinate system to normalized 0-1 range
  const normalizedX = (vbPosition.x + 1) / 2; // Convert from -1 to 1 range to 0-1
  const normalizedY = (vbPosition.y + 1) / 2; // Convert from -1 to 1 range to 0-1

  // Scale to screen coordinates
  return {
    x: normalizedX * courtDimensions.width,
    y: normalizedY * courtDimensions.height,
  };
}

/**
 * Check if a position is within court boundaries
 */
export function isPositionInBounds(
  position: PlayerPosition,
  courtDimensions: CourtDimensions,
  margin: number = 20
): boolean {
  return (
    position.x >= margin &&
    position.x <= courtDimensions.width - margin &&
    position.y >= margin &&
    position.y <= courtDimensions.height - margin
  );
}

/**
 * Clamp position to court boundaries
 */
export function clampPositionToBounds(
  position: PlayerPosition,
  courtDimensions: CourtDimensions,
  margin: number = 20
): PlayerPosition {
  return {
    x: Math.max(margin, Math.min(position.x, courtDimensions.width - margin)),
    y: Math.max(margin, Math.min(position.y, courtDimensions.height - margin)),
    isCustom: position.isCustom,
  };
}
