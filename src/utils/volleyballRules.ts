import { PlayerPosition, FormationType, SystemType, PLAYER_RADIUS } from "@/types";

export interface VolleyballPosition {
  id: string;
  zone: number; // 1-6 zones
  isBackRow: boolean;
  isFrontRow: boolean;
}

export interface OverlapConstraint {
  playerId: string;
  cannotOverlapWith: string[];
  horizontalConstraints: { leftOf?: string; rightOf?: string };
  verticalConstraints: { inFrontOf?: string; behind?: string };
}

export interface CourtZones {
  attackLine: number; // 3m line from net (10 feet)
  netLine: number;
  centerLine: number; // Middle of court horizontally
  courtWidth: number;
  courtHeight: number;
}

/**
 * Volleyball positioning rules and constraints based on official regulations
 */
export class VolleyballRulesValidator {
  private courtZones: CourtZones;
  
  constructor(courtWidth: number, courtHeight: number) {
    this.courtZones = {
      attackLine: courtHeight * 0.3, // Attack line is 3m from net (30% from top)
      netLine: courtHeight * 0.05, // Net line (5% from top)
      centerLine: courtWidth / 2, // Center line divides court horizontally
      courtWidth,
      courtHeight,
    };
  }

  /**
   * Get volleyball zone mapping for standard 6-player system
   */
  getVolleyballZones(): Record<string, VolleyballPosition> {
    return {
      "1": { id: "1", zone: 1, isBackRow: true, isFrontRow: false }, // Right back (server)
      "2": { id: "2", zone: 2, isBackRow: false, isFrontRow: true }, // Right front
      "3": { id: "3", zone: 3, isBackRow: false, isFrontRow: true }, // Middle front
      "4": { id: "4", zone: 4, isBackRow: false, isFrontRow: true }, // Left front
      "5": { id: "5", zone: 5, isBackRow: true, isFrontRow: false }, // Left back
      "6": { id: "6", zone: 6, isBackRow: true, isFrontRow: false }, // Middle back
    };
  }

  /**
   * Get zone constraints for each position (1-6) during serve/receive
   * Based on volleyball overlap rules:
   * - Front row players (2,3,4) cannot cross each other horizontally
   * - Back row players (1,5,6) cannot cross each other horizontally  
   * - Players cannot go behind directly adjacent players (not diagonal)
   */
  getZoneConstraints(): Record<number, OverlapConstraint> {
    return {
      1: {
        playerId: "1", 
        cannotOverlapWith: ["6", "5"],
        horizontalConstraints: { rightOf: "6", leftOf: "5" }, // Zone 1 between zones 6 and 5 (back row)
        verticalConstraints: { behind: "2" }, // Zone 1 must be behind zone 2 (directly above)
      },
      2: {
        playerId: "2", 
        cannotOverlapWith: ["3"],
        horizontalConstraints: { leftOf: "3" }, // Zone 2 must be to the left of zone 3
        verticalConstraints: { inFrontOf: "1" }, // Zone 2 must be in front of zone 1 (directly below)
      },
      3: {
        playerId: "3",
        cannotOverlapWith: ["2", "4"],
        horizontalConstraints: { rightOf: "2", leftOf: "4" }, // Zone 3 between zones 2 and 4
        verticalConstraints: { inFrontOf: "6" }, // Zone 3 must be in front of zone 6 (directly below)
      },
      4: {
        playerId: "4",
        cannotOverlapWith: ["3"],
        horizontalConstraints: { rightOf: "3" }, // Zone 4 must be to the right of zone 3
        verticalConstraints: { inFrontOf: "5" }, // Zone 4 must be in front of zone 5 (directly below)
      },
      5: {
        playerId: "5",
        cannotOverlapWith: ["1"],
        horizontalConstraints: { rightOf: "1" }, // Zone 5 must be to the right of zone 1 (back row)
        verticalConstraints: { behind: "4" }, // Zone 5 must be behind zone 4 (directly above)
      },
      6: {
        playerId: "6",
        cannotOverlapWith: ["1"],
        horizontalConstraints: { leftOf: "1" }, // Zone 6 must be to the left of zone 1 (back row constraint)
        verticalConstraints: { behind: "3" }, // Zone 6 must be behind zone 3 (directly above)
      },
    };
  }

  /**
   * Get overlap constraints for each position during service (deprecated - use getZoneConstraints)
   */
  getOverlapConstraints(): Record<string, OverlapConstraint> {
    return {
      "1": {
        playerId: "1",
        cannotOverlapWith: ["2", "6"],
        horizontalConstraints: { leftOf: "2" },
        verticalConstraints: { behind: "2" },
      },
      "2": {
        playerId: "2",
        cannotOverlapWith: ["1", "3"],
        horizontalConstraints: { rightOf: "1", leftOf: "3" },
        verticalConstraints: { inFrontOf: "1" },
      },
      "3": {
        playerId: "3",
        cannotOverlapWith: ["2", "4", "6"],
        horizontalConstraints: { rightOf: "2", leftOf: "4" },
        verticalConstraints: { inFrontOf: "6" },
      },
      "4": {
        playerId: "4",
        cannotOverlapWith: ["3", "5"],
        horizontalConstraints: { rightOf: "3" },
        verticalConstraints: { inFrontOf: "5" },
      },
      "5": {
        playerId: "5",
        cannotOverlapWith: ["4", "6"],
        horizontalConstraints: { rightOf: "6" },
        verticalConstraints: { behind: "4" },
      },
      "6": {
        playerId: "6",
        cannotOverlapWith: ["5", "1", "3"],
        horizontalConstraints: { leftOf: "5", rightOf: "1" },
        verticalConstraints: { behind: "3", inFrontOf: "1" },
      },
    };
  }

  /**
   * Validate volleyball-specific positioning rules
   */
  validateVolleyballPosition(
    position: { x: number; y: number },
    playerId: string,
    formation: FormationType,
    allPositions: Record<string, PlayerPosition>,
    rotationMap?: Record<number, string>
  ): {
    isValid: boolean;
    violations: string[];
    overlapViolations: { violatedWith: string; type: 'horizontal' | 'vertical' }[];
  } {
    const violations: string[] = [];
    const overlapViolations: { violatedWith: string; type: 'horizontal' | 'vertical' }[] = [];
    
    // If no rotation map provided, or not in serve/receive formation, skip overlap validation
    if (!rotationMap || formation !== "serveReceive") {
      return { isValid: true, violations, overlapViolations };
    }

    // Find the zone number for this player
    const playerZoneEntry = Object.entries(rotationMap).find(([, pid]) => pid === playerId);
    if (!playerZoneEntry) {
      violations.push(`Player ${playerId} not found in rotation`);
      return { isValid: false, violations, overlapViolations };
    }

    const playerZone = parseInt(playerZoneEntry[0]);
    const constraints = this.getZoneConstraints()[playerZone];

    if (!constraints) {
      violations.push(`No constraints found for zone ${playerZone}`);
      return { isValid: false, violations, overlapViolations };
    }

    // Only validate overlap rules for serve/receive formation
    // Base/attack formation has no overlap rules per user requirements
    if (formation === "serveReceive") {
      this.validateZoneOverlapRules(position, playerZone, allPositions, rotationMap, constraints, violations, overlapViolations);
    }

    // Validate attack line restrictions for back row players
    const zones = this.getVolleyballZones();
    const playerZoneInfo = zones[playerZone.toString()];
    if (playerZoneInfo && playerZoneInfo.isBackRow && formation === "base") {
      this.validateBackRowAttackRestrictions(position, playerId, violations);
    }

    return {
      isValid: violations.length === 0,
      violations,
      overlapViolations,
    };
  }

  /**
   * Validate overlap rules between adjacent players
   */
  private validateOverlapRules(
    position: { x: number; y: number },
    playerId: string,
    allPositions: Record<string, PlayerPosition>,
    constraints: OverlapConstraint,
    violations: string[],
    overlapViolations: { violatedWith: string; type: 'horizontal' | 'vertical' }[]
  ): void {
    // Check horizontal constraints (left/right positioning)
    if (constraints.horizontalConstraints.leftOf) {
      const rightPlayer = constraints.horizontalConstraints.leftOf;
      const rightPosition = allPositions[rightPlayer];
      if (rightPosition && position.x >= rightPosition.x) {
        violations.push(`Player ${playerId} must be to the left of player ${rightPlayer}`);
        overlapViolations.push({ violatedWith: rightPlayer, type: 'horizontal' });
      }
    }

    if (constraints.horizontalConstraints.rightOf) {
      const leftPlayer = constraints.horizontalConstraints.rightOf;
      const leftPosition = allPositions[leftPlayer];
      if (leftPosition && position.x <= leftPosition.x) {
        violations.push(`Player ${playerId} must be to the right of player ${leftPlayer}`);
        overlapViolations.push({ violatedWith: leftPlayer, type: 'horizontal' });
      }
    }

    // Check vertical constraints (front/back positioning)
    if (constraints.verticalConstraints.inFrontOf) {
      const backPlayer = constraints.verticalConstraints.inFrontOf;
      const backPosition = allPositions[backPlayer];
      if (backPosition && position.y >= backPosition.y) {
        violations.push(`Player ${playerId} must be in front of player ${backPlayer}`);
        overlapViolations.push({ violatedWith: backPlayer, type: 'vertical' });
      }
    }

    if (constraints.verticalConstraints.behind) {
      const frontPlayer = constraints.verticalConstraints.behind;
      const frontPosition = allPositions[frontPlayer];
      if (frontPosition && position.y <= frontPosition.y) {
        violations.push(`Player ${playerId} must be behind player ${frontPlayer}`);
        overlapViolations.push({ violatedWith: frontPlayer, type: 'vertical' });
      }
    }
  }

  /**
   * Validate overlap rules between adjacent players using zone-based constraints
   */
  private validateZoneOverlapRules(
    position: { x: number; y: number },
    playerZone: number,
    allPositions: Record<string, PlayerPosition>,
    rotationMap: Record<number, string>,
    constraints: OverlapConstraint,
    violations: string[],
    overlapViolations: { violatedWith: string; type: 'horizontal' | 'vertical' }[]
  ): void {
    // Check horizontal constraints (left/right positioning)
    if (constraints.horizontalConstraints.leftOf) {
      const rightZone = parseInt(constraints.horizontalConstraints.leftOf);
      const rightPlayerId = rotationMap[rightZone];
      const rightPosition = allPositions[rightPlayerId];
      if (rightPosition && position.x >= rightPosition.x) {
        violations.push(`Player in zone ${playerZone} must be to the left of player in zone ${rightZone}`);
        overlapViolations.push({ violatedWith: rightPlayerId, type: 'horizontal' });
      }
    }

    if (constraints.horizontalConstraints.rightOf) {
      const leftZone = parseInt(constraints.horizontalConstraints.rightOf);
      const leftPlayerId = rotationMap[leftZone];
      const leftPosition = allPositions[leftPlayerId];
      if (leftPosition && position.x <= leftPosition.x) {
        violations.push(`Player in zone ${playerZone} must be to the right of player in zone ${leftZone}`);
        overlapViolations.push({ violatedWith: leftPlayerId, type: 'horizontal' });
      }
    }

    // Check vertical constraints (front/back positioning)
    if (constraints.verticalConstraints.inFrontOf) {
      const backZone = parseInt(constraints.verticalConstraints.inFrontOf);
      const backPlayerId = rotationMap[backZone];
      const backPosition = allPositions[backPlayerId];
      if (backPosition && position.y >= backPosition.y) {
        violations.push(`Player in zone ${playerZone} must be in front of player in zone ${backZone}`);
        overlapViolations.push({ violatedWith: backPlayerId, type: 'vertical' });
      }
    }

    if (constraints.verticalConstraints.behind) {
      const frontZone = parseInt(constraints.verticalConstraints.behind);
      const frontPlayerId = rotationMap[frontZone];
      const frontPosition = allPositions[frontPlayerId];
      if (frontPosition && position.y <= frontPosition.y) {
        violations.push(`Player in zone ${playerZone} must be behind player in zone ${frontZone}`);
        overlapViolations.push({ violatedWith: frontPlayerId, type: 'vertical' });
      }
    }
  }

  /**
   * Validate back row player attack line restrictions
   */
  private validateBackRowAttackRestrictions(
    position: { x: number; y: number },
    playerId: string,
    violations: string[]
  ): void {
    // Back row players cannot attack from in front of the attack line
    if (position.y < this.courtZones.attackLine) {
      violations.push(`Back row player ${playerId} cannot be positioned in front of the attack line for attacks`);
    }
  }

  /**
   * Get visual guidelines for drag constraints
   */
  getVisualConstraints(
    playerId: string,
    allPositions: Record<string, PlayerPosition>,
    formation: FormationType,
    rotationMap?: Record<number, string>
  ): {
    horizontalLines: { y: number; label: string; playerId: string }[];
    verticalLines: { x: number; label: string; playerId: string }[];
    constraintZones: { minX?: number; maxX?: number; minY?: number; maxY?: number };
  } {
    const horizontalLines: { y: number; label: string; playerId: string }[] = [];
    const verticalLines: { x: number; label: string; playerId: string }[] = [];
    let constraintZones: { minX?: number; maxX?: number; minY?: number; maxY?: number } = {};

    if (formation !== "serveReceive" || !rotationMap) {
      return { horizontalLines, verticalLines, constraintZones };
    }

    // Find the zone number for this player
    const playerZoneEntry = Object.entries(rotationMap).find(([, pid]) => pid === playerId);
    if (!playerZoneEntry) {
      return { horizontalLines, verticalLines, constraintZones };
    }

    const playerZone = parseInt(playerZoneEntry[0]);
    const constraints = this.getZoneConstraints()[playerZone];
    if (!constraints) {
      return { horizontalLines, verticalLines, constraintZones };
    }

    // Add horizontal constraint lines (can't cross vertically)
    if (constraints.verticalConstraints.inFrontOf) {
      const backZone = parseInt(constraints.verticalConstraints.inFrontOf);
      const backPlayerId = rotationMap[backZone];
      const backPosition = allPositions[backPlayerId];
      if (backPosition) {
        horizontalLines.push({
          y: backPosition.y,
          label: `Cannot cross behind zone ${backZone}`,
          playerId: backPlayerId,
        });
        constraintZones.maxY = backPosition.y - 1;
      }
    }

    if (constraints.verticalConstraints.behind) {
      const frontZone = parseInt(constraints.verticalConstraints.behind);
      const frontPlayerId = rotationMap[frontZone];
      const frontPosition = allPositions[frontPlayerId];
      if (frontPosition) {
        horizontalLines.push({
          y: frontPosition.y,
          label: `Cannot cross in front of zone ${frontZone}`,
          playerId: frontPlayerId,
        });
        constraintZones.minY = frontPosition.y + 1;
      }
    }

    // Add vertical constraint lines (can't cross horizontally)
    if (constraints.horizontalConstraints.leftOf) {
      const rightZone = parseInt(constraints.horizontalConstraints.leftOf);
      const rightPlayerId = rotationMap[rightZone];
      const rightPosition = allPositions[rightPlayerId];
      if (rightPosition) {
        verticalLines.push({
          x: rightPosition.x,
          label: `Cannot cross right of zone ${rightZone}`,
          playerId: rightPlayerId,
        });
        constraintZones.maxX = rightPosition.x - 1;
      }
    }

    if (constraints.horizontalConstraints.rightOf) {
      const leftZone = parseInt(constraints.horizontalConstraints.rightOf);
      const leftPlayerId = rotationMap[leftZone];
      const leftPosition = allPositions[leftPlayerId];
      if (leftPosition) {
        verticalLines.push({
          x: leftPosition.x,
          label: `Cannot cross left of zone ${leftZone}`,
          playerId: leftPlayerId,
        });
        constraintZones.minX = leftPosition.x + 1;
      }
    }

    return { horizontalLines, verticalLines, constraintZones };
  }

  /**
   * Check if a position change is valid according to volleyball rules
   */
  isValidVolleyballMove(
    fromPosition: { x: number; y: number },
    toPosition: { x: number; y: number },
    playerId: string,
    formation: FormationType,
    allPositions: Record<string, PlayerPosition>
  ): boolean {
    const validation = this.validateVolleyballPosition(toPosition, playerId, formation, allPositions);
    return validation.isValid;
  }

  /**
   * Get attack line position for visual reference
   */
  getAttackLineY(): number {
    return this.courtZones.attackLine;
  }

  /**
   * Get center line position for visual reference
   */
  getCenterLineX(): number {
    return this.courtZones.centerLine;
  }

  /**
   * Update court dimensions
   */
  updateCourtDimensions(courtWidth: number, courtHeight: number): void {
    this.courtZones = {
      attackLine: courtHeight * 0.3,
      netLine: courtHeight * 0.05,
      centerLine: courtWidth / 2,
      courtWidth,
      courtHeight,
    };
  }
}