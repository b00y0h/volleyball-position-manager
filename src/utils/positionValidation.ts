import {
  PlayerPosition,
  COURT_DIMENSIONS,
  MIN_PLAYER_DISTANCE,
  FormationType,
} from "../types/positioning";

/**
 * Validates if a position is within court boundaries
 */
export function isWithinCourtBounds(x: number, y: number): boolean {
  return (
    x >= 0 &&
    x <= COURT_DIMENSIONS.width &&
    y >= 0 &&
    y <= COURT_DIMENSIONS.height
  );
}

/**
 * Calculates distance between two positions
 */
export function calculateDistance(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Checks if a position would collide with existing player positions
 */
export function checkCollision(
  newPosition: { x: number; y: number },
  existingPositions: Record<string, PlayerPosition>,
  excludePlayerId?: string
): boolean {
  for (const [playerId, position] of Object.entries(existingPositions)) {
    if (excludePlayerId && playerId === excludePlayerId) {
      continue;
    }

    const distance = calculateDistance(newPosition, position);
    if (distance < MIN_PLAYER_DISTANCE) {
      return true; // Collision detected
    }
  }
  return false;
}

/**
 * Validates position based on formation-specific rules
 */
export function validateFormationPosition(
  position: { x: number; y: number },
  playerId: string,
  formationType: FormationType,
  rotationIndex: number
): { isValid: boolean; reason?: string } {
  // Basic boundary check
  if (!isWithinCourtBounds(position.x, position.y)) {
    return { isValid: false, reason: "Position is outside court boundaries" };
  }

  // Formation-specific validation rules
  switch (formationType) {
    case "rotational":
      // For rotational positions, maintain basic court positioning rules
      return validateRotationalPosition(position, playerId, rotationIndex);

    case "serveReceive":
      // For serve/receive, back-row players should be in back court
      return validateServeReceivePosition(position, playerId, rotationIndex);

    case "base":
      // For base formation, front-row players should be in attack positions
      return validateBasePosition(position, playerId, rotationIndex);

    default:
      return { isValid: true };
  }
}

/**
 * Validates rotational position constraints
 */
function validateRotationalPosition(
  _position: { x: number; y: number },
  _playerId: string,
  _rotationIndex: number
): { isValid: boolean; reason?: string } {
  // Basic validation - players should maintain relative positioning
  // This is a simplified version - more complex rules can be added
  return { isValid: true };
}

/**
 * Validates serve/receive position constraints
 */
function validateServeReceivePosition(
  _position: { x: number; y: number },
  _playerId: string,
  _rotationIndex: number
): { isValid: boolean; reason?: string } {
  // Back-row players should generally be in back court for serve receive
  // This is a simplified validation - more specific rules can be added
  return { isValid: true };
}

/**
 * Validates base formation position constraints
 */
function validateBasePosition(
  _position: { x: number; y: number },
  _playerId: string,
  _rotationIndex: number
): { isValid: boolean; reason?: string } {
  // Front-row players should be positioned for attack
  // This is a simplified validation - more specific rules can be added
  return { isValid: true };
}

/**
 * Finds the nearest valid position if the current position is invalid
 */
export function findNearestValidPosition(
  targetPosition: { x: number; y: number },
  existingPositions: Record<string, PlayerPosition>,
  excludePlayerId?: string
): { x: number; y: number } {
  let { x, y } = targetPosition;

  // Constrain to court boundaries
  x = Math.max(0, Math.min(COURT_DIMENSIONS.width, x));
  y = Math.max(0, Math.min(COURT_DIMENSIONS.height, y));

  // If no collision, return the constrained position
  if (!checkCollision({ x, y }, existingPositions, excludePlayerId)) {
    return { x, y };
  }

  // Find nearest position without collision using spiral search
  const step = 5;
  const maxRadius = 100;

  for (let radius = step; radius <= maxRadius; radius += step) {
    for (let angle = 0; angle < 360; angle += 15) {
      const radians = (angle * Math.PI) / 180;
      const testX = x + radius * Math.cos(radians);
      const testY = y + radius * Math.sin(radians);

      if (
        isWithinCourtBounds(testX, testY) &&
        !checkCollision(
          { x: testX, y: testY },
          existingPositions,
          excludePlayerId
        )
      ) {
        return { x: testX, y: testY };
      }
    }
  }

  // Fallback to original position if no valid position found
  return { x, y };
}
