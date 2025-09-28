import { PlayerPosition, FormationType, SystemType, PLAYER_RADIUS } from "../types";

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  severity: "error" | "warning";
  field?: string;
  details?: Record<string, unknown>;
}

export interface ValidationWarning {
  code: string;
  message: string;
  suggestion: string;
}

export interface CourtBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class EnhancedPositionValidator {
  private courtBounds: CourtBounds;
  
  constructor(courtWidth: number, courtHeight: number) {
    this.courtBounds = {
      minX: PLAYER_RADIUS,
      maxX: courtWidth - PLAYER_RADIUS,
      minY: PLAYER_RADIUS,
      maxY: courtHeight - PLAYER_RADIUS,
    };
  }

  updateCourtDimensions(courtWidth: number, courtHeight: number): void {
    this.courtBounds = {
      minX: PLAYER_RADIUS,
      maxX: courtWidth - PLAYER_RADIUS,
      minY: PLAYER_RADIUS,
      maxY: courtHeight - PLAYER_RADIUS,
    };
  }

  validatePosition(
    position: { x: number; y: number },
    playerId: string,
    formation: FormationType,
    rotation: number,
    existingPositions: Record<string, PlayerPosition> = {}
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // 1. Basic coordinate validation
    this.validateCoordinates(position, errors);

    // 2. Court boundary validation
    this.validateBoundaries(position, playerId, errors, warnings, suggestions);

    // 3. Collision detection
    this.validateCollisions(position, playerId, existingPositions, errors, suggestions);

    // 4. Formation-specific validation
    this.validateFormationRules(position, playerId, formation, rotation, warnings, suggestions);

    // 5. Performance warnings
    this.validatePerformance(position, formation, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  private validateCoordinates(
    position: { x: number; y: number },
    errors: ValidationError[]
  ): void {
    if (typeof position.x !== "number" || typeof position.y !== "number") {
      errors.push({
        code: "INVALID_COORDINATES",
        message: "Position coordinates must be numbers",
        severity: "error",
        field: "position",
      });
      return;
    }

    if (isNaN(position.x) || isNaN(position.y)) {
      errors.push({
        code: "NAN_COORDINATES",
        message: "Position coordinates cannot be NaN",
        severity: "error",
        field: "position",
      });
      return;
    }

    if (!isFinite(position.x) || !isFinite(position.y)) {
      errors.push({
        code: "INFINITE_COORDINATES",
        message: "Position coordinates must be finite numbers",
        severity: "error",
        field: "position",
      });
    }
  }

  private validateBoundaries(
    position: { x: number; y: number },
    playerId: string,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    const { minX, maxX, minY, maxY } = this.courtBounds;

    if (position.x < minX) {
      errors.push({
        code: "OUT_OF_BOUNDS_LEFT",
        message: `Player ${playerId} is too far left (x: ${position.x.toFixed(1)})`,
        severity: "error",
        field: "x",
        details: { minX, currentX: position.x },
      });
      suggestions.push(`Move player ${playerId} to the right (minimum x: ${minX})`);
    }

    if (position.x > maxX) {
      errors.push({
        code: "OUT_OF_BOUNDS_RIGHT",
        message: `Player ${playerId} is too far right (x: ${position.x.toFixed(1)})`,
        severity: "error",
        field: "x",
        details: { maxX, currentX: position.x },
      });
      suggestions.push(`Move player ${playerId} to the left (maximum x: ${maxX})`);
    }

    if (position.y < minY) {
      errors.push({
        code: "OUT_OF_BOUNDS_TOP",
        message: `Player ${playerId} is too far up (y: ${position.y.toFixed(1)})`,
        severity: "error",
        field: "y",
        details: { minY, currentY: position.y },
      });
      suggestions.push(`Move player ${playerId} down (minimum y: ${minY})`);
    }

    if (position.y > maxY) {
      errors.push({
        code: "OUT_OF_BOUNDS_BOTTOM",
        message: `Player ${playerId} is too far down (y: ${position.y.toFixed(1)})`,
        severity: "error",
        field: "y",
        details: { maxY, currentY: position.y },
      });
      suggestions.push(`Move player ${playerId} up (maximum y: ${maxY})`);
    }

    // Warning for positions very close to boundaries
    const warningMargin = PLAYER_RADIUS * 1.5;
    
    if (position.x < minX + warningMargin && position.x >= minX) {
      warnings.push({
        code: "NEAR_LEFT_BOUNDARY",
        message: `Player ${playerId} is very close to the left boundary`,
        suggestion: "Consider moving slightly to the right for better positioning",
      });
    }

    if (position.x > maxX - warningMargin && position.x <= maxX) {
      warnings.push({
        code: "NEAR_RIGHT_BOUNDARY",
        message: `Player ${playerId} is very close to the right boundary`,
        suggestion: "Consider moving slightly to the left for better positioning",
      });
    }
  }

  private validateCollisions(
    position: { x: number; y: number },
    playerId: string,
    existingPositions: Record<string, PlayerPosition>,
    errors: ValidationError[],
    suggestions: string[]
  ): void {
    const minDistance = PLAYER_RADIUS * 2 + 6; // Minimum safe distance
    
    for (const [otherPlayerId, otherPosition] of Object.entries(existingPositions)) {
      if (otherPlayerId === playerId) continue;

      const distance = Math.sqrt(
        Math.pow(position.x - otherPosition.x, 2) + 
        Math.pow(position.y - otherPosition.y, 2)
      );

      if (distance < minDistance) {
        errors.push({
          code: "PLAYER_COLLISION",
          message: `Player ${playerId} would overlap with ${otherPlayerId}`,
          severity: "error",
          details: {
            distance: distance.toFixed(1),
            minDistance,
            collidingWith: otherPlayerId,
          },
        });
        
        suggestions.push(
          `Move player ${playerId} at least ${(minDistance - distance).toFixed(1)}px away from ${otherPlayerId}`
        );
      }
    }
  }

  private validateFormationRules(
    position: { x: number; y: number },
    playerId: string,
    formation: FormationType,
    rotation: number,
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    const courtWidth = this.courtBounds.maxX + PLAYER_RADIUS;
    const courtHeight = this.courtBounds.maxY + PLAYER_RADIUS;

    switch (formation) {
      case "rotational":
        this.validateRotationalPosition(position, playerId, rotation, courtWidth, courtHeight, warnings, suggestions);
        break;
      case "serveReceive":
        this.validateServeReceivePosition(position, playerId, courtWidth, courtHeight, warnings, suggestions);
        break;
      case "base":
        this.validateBasePosition(position, playerId, courtWidth, courtHeight, warnings, suggestions);
        break;
    }
  }

  private validateRotationalPosition(
    position: { x: number; y: number },
    playerId: string,
    rotation: number,
    courtWidth: number,
    courtHeight: number,
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    // Check if player is significantly out of their rotational zone
    const netLine = courtHeight * 0.3;
    
    // Basic front/back row validation based on typical volleyball rules
    if (playerId.includes("1") || playerId.includes("6") || playerId.includes("5")) {
      // Back row players
      if (position.y < netLine + 50) {
        warnings.push({
          code: "BACK_ROW_TOO_FORWARD",
          message: `Back row player ${playerId} may be too close to the net`,
          suggestion: "Consider moving further back to maintain proper rotation spacing",
        });
      }
    } else {
      // Front row players
      if (position.y > netLine + 50) {
        warnings.push({
          code: "FRONT_ROW_TOO_BACK",
          message: `Front row player ${playerId} may be too far from the net`,
          suggestion: "Consider moving closer to the net for better attack positioning",
        });
      }
    }
  }

  private validateServeReceivePosition(
    position: { x: number; y: number },
    playerId: string,
    courtWidth: number,
    courtHeight: number,
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    // Serve receive typically happens in the back 2/3 of the court
    const optimalReceiveZone = courtHeight * 0.4; // From 40% back
    
    if (position.y < optimalReceiveZone) {
      warnings.push({
        code: "SR_TOO_FORWARD",
        message: `Player ${playerId} may be too forward for serve receive`,
        suggestion: "Move back to better receive serves, especially deep ones",
      });
    }

    // Check for proper court coverage
    if (position.x < courtWidth * 0.1 || position.x > courtWidth * 0.9) {
      warnings.push({
        code: "SR_POOR_COVERAGE",
        message: `Player ${playerId} may leave too much court uncovered`,
        suggestion: "Adjust position to provide better court coverage for serve receive",
      });
    }
  }

  private validateBasePosition(
    position: { x: number; y: number },
    playerId: string,
    courtWidth: number,
    courtHeight: number,
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    // Base position validation for attack formations
    const netLine = courtHeight * 0.3;
    
    // Setters should typically be near the net in base position
    if (playerId.includes("S")) {
      if (position.y > netLine + 30) {
        warnings.push({
          code: "SETTER_TOO_BACK",
          message: `Setter ${playerId} may be too far from the net`,
          suggestion: "Move closer to the net for better setting position",
        });
      }
    }
    
    // Outside hitters should have good approach angles
    if (playerId.includes("OH")) {
      if (position.y > netLine + 80) {
        warnings.push({
          code: "OH_APPROACH_DISTANCE",
          message: `Outside hitter ${playerId} may need better approach distance`,
          suggestion: "Adjust position for optimal attack approach angle",
        });
      }
    }
  }

  private validatePerformance(
    position: { x: number; y: number },
    formation: FormationType,
    warnings: ValidationWarning[]
  ): void {
    // Check for positions that might cause performance issues
    const courtWidth = this.courtBounds.maxX + PLAYER_RADIUS;
    const courtHeight = this.courtBounds.maxY + PLAYER_RADIUS;
    
    // Warn about positions that are very close to specific values that might cause rendering issues
    const problematicValues = [0, courtWidth, courtHeight];
    const tolerance = 1;
    
    problematicValues.forEach(value => {
      if (Math.abs(position.x - value) < tolerance || Math.abs(position.y - value) < tolerance) {
        warnings.push({
          code: "POTENTIAL_RENDERING_ISSUE",
          message: "Position is very close to a boundary value",
          suggestion: "Slight adjustment may improve visual rendering",
        });
      }
    });
  }

  // Helper method to get user-friendly error message
  static getErrorMessage(error: ValidationError): string {
    const codeMessages: Record<string, string> = {
      INVALID_COORDINATES: "The position contains invalid coordinate values.",
      NAN_COORDINATES: "The position coordinates are not valid numbers.",
      INFINITE_COORDINATES: "The position coordinates are too large.",
      OUT_OF_BOUNDS_LEFT: "This position is too far to the left of the court.",
      OUT_OF_BOUNDS_RIGHT: "This position is too far to the right of the court.", 
      OUT_OF_BOUNDS_TOP: "This position is too high up on the court.",
      OUT_OF_BOUNDS_BOTTOM: "This position is too low on the court.",
      PLAYER_COLLISION: "This position would cause players to overlap.",
    };

    return codeMessages[error.code] || error.message;
  }

  // Helper method to suggest fixes
  static getSuggestion(error: ValidationError): string {
    const codeSuggestions: Record<string, string> = {
      OUT_OF_BOUNDS_LEFT: "Try dragging the player more to the right.",
      OUT_OF_BOUNDS_RIGHT: "Try dragging the player more to the left.",
      OUT_OF_BOUNDS_TOP: "Try dragging the player down towards the court.",
      OUT_OF_BOUNDS_BOTTOM: "Try dragging the player up towards the net.",
      PLAYER_COLLISION: "Move the player to a position with more space around them.",
    };

    return codeSuggestions[error.code] || "Please adjust the player position and try again.";
  }
}