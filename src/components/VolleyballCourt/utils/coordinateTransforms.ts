import { COURT_DIMENSIONS } from "../types/positioning";

/**
 * Coordinate transformation utilities for position management
 */

/**
 * Converts screen coordinates to court coordinates
 */
export function screenToCourtCoordinates(
  screenX: number,
  screenY: number,
  svgElement: SVGSVGElement
): { x: number; y: number } {
  const rect = svgElement.getBoundingClientRect();
  const scaleX = COURT_DIMENSIONS.width / rect.width;
  const scaleY = COURT_DIMENSIONS.height / rect.height;

  const courtX = (screenX - rect.left) * scaleX;
  const courtY = (screenY - rect.top) * scaleY;

  return { x: courtX, y: courtY };
}

/**
 * Converts court coordinates to screen coordinates
 */
export function courtToScreenCoordinates(
  courtX: number,
  courtY: number,
  svgElement: SVGSVGElement
): { x: number; y: number } {
  const rect = svgElement.getBoundingClientRect();
  const scaleX = rect.width / COURT_DIMENSIONS.width;
  const scaleY = rect.height / COURT_DIMENSIONS.height;

  const screenX = courtX * scaleX + rect.left;
  const screenY = courtY * scaleY + rect.top;

  return { x: screenX, y: screenY };
}

/**
 * Normalizes coordinates to ensure they're within valid ranges
 */
export function normalizeCoordinates(
  x: number,
  y: number
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(COURT_DIMENSIONS.width, x)),
    y: Math.max(0, Math.min(COURT_DIMENSIONS.height, y)),
  };
}

/**
 * Calculates relative position as percentage of court dimensions
 */
export function getRelativePosition(
  x: number,
  y: number
): { x: number; y: number } {
  return {
    x: x / COURT_DIMENSIONS.width,
    y: y / COURT_DIMENSIONS.height,
  };
}

/**
 * Converts relative position (0-1) back to absolute coordinates
 */
export function getAbsolutePosition(
  relativeX: number,
  relativeY: number
): { x: number; y: number } {
  return {
    x: relativeX * COURT_DIMENSIONS.width,
    y: relativeY * COURT_DIMENSIONS.height,
  };
}

/**
 * Snaps position to a grid for consistent positioning
 */
export function snapToGrid(
  x: number,
  y: number,
  gridSize: number = 10
): { x: number; y: number } {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}

/**
 * Calculates the center point between multiple positions
 */
export function getCenterPoint(positions: Array<{ x: number; y: number }>): {
  x: number;
  y: number;
} {
  if (positions.length === 0) {
    return { x: COURT_DIMENSIONS.width / 2, y: COURT_DIMENSIONS.height / 2 };
  }

  const sum = positions.reduce(
    (acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y }),
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / positions.length,
    y: sum.y / positions.length,
  };
}

/**
 * Rotates a point around a center point by a given angle (in degrees)
 */
export function rotatePoint(
  point: { x: number; y: number },
  center: { x: number; y: number },
  angleDegrees: number
): { x: number; y: number } {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Calculates the bounding box for a set of positions
 */
export function getBoundingBox(positions: Array<{ x: number; y: number }>): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (positions.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: COURT_DIMENSIONS.width,
      maxY: COURT_DIMENSIONS.height,
      width: COURT_DIMENSIONS.width,
      height: COURT_DIMENSIONS.height,
    };
  }

  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
