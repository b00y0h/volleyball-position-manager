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
  rotationIndex: number
): Record<string, PlayerPosition> {
  const positions: Record<string, PlayerPosition> = {};

  // Convert position numbers to player IDs based on rotation
  for (let pos = 1; pos <= 6; pos++) {
    const coord = baseCoords[pos as keyof typeof baseCoords];
    positions[`pos${pos}`] = createDefaultPosition(coord.x, coord.y);
  }

  return positions;
}

/**
 * Gets default serve/receive positions based on rotation and system
 */
export function getDefaultServeReceivePositions(
  rotationIndex: number,
  system: SystemType
): Record<string, PlayerPosition> {
  const positions: Record<string, PlayerPosition> = {};

  // Primary receivers (back-row players)
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

  return positions;
}

/**
 * Gets default base attack positions with role-specific adjustments
 */
export function getDefaultBasePositions(
  rotationIndex: number,
  system: SystemType
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

    positions[`pos${pos}`] = createDefaultPosition(coord.x, coord.y);
  }

  return positions;
}

/**
 * Gets default positions for any formation type
 */
export function getDefaultPositions(
  formationType: FormationType,
  rotationIndex: number,
  system: SystemType
): Record<string, PlayerPosition> {
  switch (formationType) {
    case "rotational":
      return getDefaultRotationalPositions(rotationIndex);
    case "serveReceive":
      return getDefaultServeReceivePositions(rotationIndex, system);
    case "base":
      return getDefaultBasePositions(rotationIndex, system);
    default:
      return getDefaultRotationalPositions(rotationIndex);
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
  playerId: string
): PlayerPosition {
  const defaultPositions = getDefaultPositions(
    formationType,
    rotationIndex,
    system
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
