import {
  PlayerPosition,
  FormationType,
  SystemType,
  COURT_DIMENSIONS,
} from "../types/positioning";

/**
 * Default position coordinates matching the current implementation
 */
const baseCoords = {
  1: { x: COURT_DIMENSIONS.width * 0.78, y: COURT_DIMENSIONS.height * 0.82 }, // right-back (1)
  2: { x: COURT_DIMENSIONS.width * 0.78, y: COURT_DIMENSIONS.height * 0.42 }, // right-front (2)
  3: { x: COURT_DIMENSIONS.width * 0.5, y: COURT_DIMENSIONS.height * 0.42 }, // middle-front (3)
  4: { x: COURT_DIMENSIONS.width * 0.22, y: COURT_DIMENSIONS.height * 0.42 }, // left-front (4)
  5: { x: COURT_DIMENSIONS.width * 0.22, y: COURT_DIMENSIONS.height * 0.82 }, // left-back (5)
  6: { x: COURT_DIMENSIONS.width * 0.5, y: COURT_DIMENSIONS.height * 0.82 }, // middle-back (6)
};

const serveReceiveCoords = {
  SR_right: {
    x: COURT_DIMENSIONS.width * 0.7,
    y: COURT_DIMENSIONS.height * 0.7,
  },
  SR_middle: {
    x: COURT_DIMENSIONS.width * 0.5,
    y: COURT_DIMENSIONS.height * 0.65,
  },
  SR_left: {
    x: COURT_DIMENSIONS.width * 0.3,
    y: COURT_DIMENSIONS.height * 0.7,
  },
  SR_frontRight: {
    x: COURT_DIMENSIONS.width * 0.72,
    y: COURT_DIMENSIONS.height * 0.5,
  },
  SR_frontLeft: {
    x: COURT_DIMENSIONS.width * 0.28,
    y: COURT_DIMENSIONS.height * 0.5,
  },
};

/**
 * Creates a default PlayerPosition object
 */
function createDefaultPosition(x: number, y: number): PlayerPosition {
  return {
    x,
    y,
    isCustom: false,
    lastModified: new Date(),
  };
}

/**
 * Gets default rotational positions for a given rotation
 */
export function getDefaultRotationalPositions(
  rotationIndex: number,
  rotationMap?: Record<number, string>
): Record<string, PlayerPosition> {
  const positions: Record<string, PlayerPosition> = {};

  // Convert position numbers to player IDs based on rotation
  for (let pos = 1; pos <= 6; pos++) {
    const coord = baseCoords[pos as keyof typeof baseCoords];
    const playerId = rotationMap ? rotationMap[pos] : `pos${pos}`;
    positions[playerId] = createDefaultPosition(coord.x, coord.y);
  }

  return positions;
}

/**
 * Gets default serve/receive positions based on rotation and system
 */
export function getDefaultServeReceivePositions(
  _rotationIndex: number,
  _system: SystemType,
  rotationMap?: Record<number, string>
): Record<string, PlayerPosition> {
  const positions: Record<string, PlayerPosition> = {};

  if (rotationMap) {
    // Use actual player IDs from rotation mapping for serve/receive formation
    // Map back-row players (typically positions 1, 5, 6) to serve receive positions
    const backRowPositions = [1, 5, 6];
    const frontRowPositions = [2, 3, 4];

    // Primary receivers (back-row players)
    backRowPositions.forEach((pos, index) => {
      const playerId = rotationMap[pos];
      if (playerId) {
        const coords = [
          serveReceiveCoords.SR_right,
          serveReceiveCoords.SR_left,
          serveReceiveCoords.SR_middle,
        ][index];
        positions[playerId] = createDefaultPosition(coords.x, coords.y);
      }
    });

    // Front-row players move to pockets
    frontRowPositions.forEach((pos, index) => {
      const playerId = rotationMap[pos];
      if (playerId) {
        const coords = [
          serveReceiveCoords.SR_frontRight,
          { x: COURT_DIMENSIONS.width * 0.5, y: COURT_DIMENSIONS.height * 0.45 },
          serveReceiveCoords.SR_frontLeft,
        ][index];
        positions[playerId] = createDefaultPosition(coords.x, coords.y);
      }
    });
  } else {
    // Fallback to generic positions
    positions["receiver1"] = createDefaultPosition(
      serveReceiveCoords.SR_right.x,
      serveReceiveCoords.SR_right.y
    );
    positions["receiver2"] = createDefaultPosition(
      serveReceiveCoords.SR_middle.x,
      serveReceiveCoords.SR_middle.y
    );
    positions["receiver3"] = createDefaultPosition(
      serveReceiveCoords.SR_left.x,
      serveReceiveCoords.SR_left.y
    );

    // Front-row players move to pockets
    positions["front1"] = createDefaultPosition(
      serveReceiveCoords.SR_frontRight.x,
      serveReceiveCoords.SR_frontRight.y
    );
    positions["front2"] = createDefaultPosition(
      serveReceiveCoords.SR_frontLeft.x,
      serveReceiveCoords.SR_frontLeft.y
    );
    positions["front3"] = createDefaultPosition(
      COURT_DIMENSIONS.width * 0.5,
      COURT_DIMENSIONS.height * 0.45
    );
  }

  return positions;
}

/**
 * Gets default base attack positions with role-specific adjustments
 */
export function getDefaultBasePositions(
  _rotationIndex: number,
  _system: SystemType,
  rotationMap?: Record<number, string>
): Record<string, PlayerPosition> {
  const positions: Record<string, PlayerPosition> = {};

  // Start with base coordinates and apply role-specific adjustments
  for (let pos = 1; pos <= 6; pos++) {
    const coord = { ...baseCoords[pos as keyof typeof baseCoords] };

    // Apply position-specific adjustments for base formation
    if (pos === 2) {
      // right-front
      coord.x += 18; // OH opens up for attack
      coord.y -= 20;
    } else if (pos === 4) {
      // left-front
      coord.x -= 18; // OH opens up for attack
      coord.y -= 20;
    } else if (pos === 3) {
      // middle-front
      coord.y -= 10; // MB steps up slightly
    } else if (pos === 1 || pos === 6) {
      // back-row setters
      coord.y -= 10; // Setters step up slightly
    }

    const playerId = rotationMap ? rotationMap[pos] : `pos${pos}`;
    positions[playerId] = createDefaultPosition(coord.x, coord.y);
  }

  return positions;
}

/**
 * Gets default positions for any formation type
 */
export function getDefaultPositions(
  formationType: FormationType,
  _rotationIndex: number,
  _system: SystemType,
  rotationMap?: Record<number, string>
): Record<string, PlayerPosition> {
  switch (formationType) {
    case "rotational":
      return getDefaultRotationalPositions(_rotationIndex, rotationMap);
    case "serveReceive":
      return getDefaultServeReceivePositions(_rotationIndex, _system, rotationMap);
    case "base":
      return getDefaultBasePositions(_rotationIndex, _system, rotationMap);
    default:
      return getDefaultRotationalPositions(_rotationIndex, rotationMap);
  }
}

/**
 * Checks if a position is at its default location (within tolerance)
 */
export function isPositionDefault(
  position: PlayerPosition,
  defaultPosition: PlayerPosition,
  tolerance: number = 5
): boolean {
  const dx = Math.abs(position.x - defaultPosition.x);
  const dy = Math.abs(position.y - defaultPosition.y);
  return dx <= tolerance && dy <= tolerance && !position.isCustom;
}

/**
 * Resets a position to its default values
 */
export function resetToDefault(
  formationType: FormationType,
  rotationIndex: number,
  system: SystemType,
  playerId: string,
  rotationMap?: Record<number, string>
): PlayerPosition {
  const defaultPositions = getDefaultPositions(
    formationType,
    rotationIndex,
    system,
    rotationMap
  );
  const defaultPosition = defaultPositions[playerId];

  if (defaultPosition) {
    return {
      ...defaultPosition,
      isCustom: false,
      lastModified: new Date(),
    };
  }

  // Fallback to center court if no default found
  return createDefaultPosition(
    COURT_DIMENSIONS.width / 2,
    COURT_DIMENSIONS.height / 2
  );
}

/**
 * Enhanced getDefaultPositions that works with rotation configurations
 * This function creates positions using player IDs from rotation mappings
 */
export function getDefaultPositionsWithRotation(
  formationType: FormationType,
  rotationIndex: number,
  system: SystemType,
  rotationConfig?: Record<number, string>[]
): Record<string, PlayerPosition> {
  // Get the rotation mapping for the specified rotation
  const rotationMap = rotationConfig?.[rotationIndex];

  // Use the enhanced function that accepts rotation mappings
  return getDefaultPositions(formationType, rotationIndex, system, rotationMap);
}
