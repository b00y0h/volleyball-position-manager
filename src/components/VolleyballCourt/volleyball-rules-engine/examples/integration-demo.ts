/**
 * Integration demo showing how the volleyball rules engine integrates
 * with the existing coordinate system and components
 */

import { StateConverter } from "../utils/StateConverter";
import { OverlapValidator } from "../validation/OverlapValidator";
import { ConstraintCalculator } from "../validation/ConstraintCalculator";
import { PlayerPosition } from "../../types";
import { RotationSlot } from "../types/PlayerState";

/**
 * Demo: Converting existing screen positions to volleyball validation
 */
export function demoScreenToVolleyballValidation() {
  console.log("=== Screen to Volleyball Validation Demo ===");

  // Simulate existing screen positions (600x360 pixels)
  const screenPositions: Record<string, PlayerPosition> = {
    "1": { x: 500, y: 300, isCustom: true, lastModified: new Date() }, // RB
    "2": { x: 500, y: 100, isCustom: true, lastModified: new Date() }, // RF
    "3": { x: 300, y: 100, isCustom: true, lastModified: new Date() }, // MF
    "4": { x: 100, y: 100, isCustom: true, lastModified: new Date() }, // LF
    "5": { x: 100, y: 300, isCustom: true, lastModified: new Date() }, // LB
    "6": { x: 300, y: 300, isCustom: true, lastModified: new Date() }, // MB
  };

  // Rotation mapping (slot -> player ID)
  const rotationMap: Record<number, string> = {
    1: "1", // RB
    2: "2", // RF
    3: "3", // MF
    4: "4", // LF
    5: "5", // LB
    6: "6", // MB
  };

  console.log("Original screen positions:", screenPositions);

  // Convert to volleyball states
  const volleyballStates = StateConverter.formationToVolleyballStates(
    screenPositions,
    rotationMap,
    1 // Player 1 is serving
  );

  console.log("Converted volleyball states:", volleyballStates);

  // Validate using volleyball rules
  const validationResult = OverlapValidator.checkOverlap(volleyballStates);

  console.log("Validation result:", {
    isLegal: validationResult.isLegal,
    violations: validationResult.violations.map((v) => ({
      code: v.code,
      message: v.message,
      slots: v.slots,
    })),
  });

  return { screenPositions, volleyballStates, validationResult };
}

/**
 * Demo: Real-time constraint calculation during drag operations
 */
export function demoRealTimeConstraints() {
  console.log("\n=== Real-time Constraint Calculation Demo ===");

  // Setup initial positions
  const positions: Record<string, PlayerPosition> = {
    "1": { x: 500, y: 300, isCustom: true, lastModified: new Date() },
    "2": { x: 500, y: 100, isCustom: true, lastModified: new Date() },
    "3": { x: 300, y: 100, isCustom: true, lastModified: new Date() },
    "4": { x: 100, y: 100, isCustom: true, lastModified: new Date() },
    "5": { x: 100, y: 300, isCustom: true, lastModified: new Date() },
    "6": { x: 300, y: 300, isCustom: true, lastModified: new Date() },
  };

  const rotationMap = { 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6" };
  const serverSlot: RotationSlot = 1;

  // Convert to volleyball states
  const volleyballStates = StateConverter.formationToVolleyballStates(
    positions,
    rotationMap,
    serverSlot
  );

  // Create position map by slot
  const positionMap = new Map();
  volleyballStates.forEach((state) => {
    positionMap.set(state.slot, state);
  });

  // Calculate constraints for middle front player (slot 3)
  const playerSlot: RotationSlot = 3;
  const isServer = playerSlot === serverSlot;

  const constraints = ConstraintCalculator.calculateValidBounds(
    playerSlot,
    positionMap,
    isServer
  );

  console.log(`Constraints for player in slot ${playerSlot}:`, {
    isConstrained: constraints.isConstrained,
    bounds: constraints.isConstrained
      ? {
          minX: constraints.minX,
          maxX: constraints.maxX,
          minY: constraints.minY,
          maxY: constraints.maxY,
        }
      : "No constraints",
    reasons: constraints.constraintReasons,
  });

  // Test position validation
  const testPosition = { x: 4.5, y: 2.5 }; // Middle front area
  const isValid = ConstraintCalculator.isPositionValid(
    playerSlot,
    testPosition,
    positionMap,
    isServer
  );

  console.log(
    `Test position (${testPosition.x}, ${testPosition.y}) is valid:`,
    isValid
  );

  // Test snapping to valid position
  const invalidPosition = { x: 1.0, y: 2.5 }; // Too far left
  const snappedPosition = ConstraintCalculator.snapToValidPosition(
    playerSlot,
    invalidPosition,
    positionMap,
    isServer
  );

  console.log(
    `Invalid position (${invalidPosition.x}, ${invalidPosition.y}) snapped to:`,
    snappedPosition
  );

  return { constraints, testPosition, isValid, snappedPosition };
}

/**
 * Demo: Violation detection and reporting
 */
export function demoViolationDetection() {
  console.log("\n=== Violation Detection Demo ===");

  // Create positions with intentional violations
  const violatingPositions: Record<string, PlayerPosition> = {
    "1": { x: 500, y: 300, isCustom: true, lastModified: new Date() }, // RB - OK
    "2": { x: 500, y: 100, isCustom: true, lastModified: new Date() }, // RF - OK
    "3": { x: 100, y: 100, isCustom: true, lastModified: new Date() }, // MF - VIOLATION: should be between LF and RF
    "4": { x: 300, y: 100, isCustom: true, lastModified: new Date() }, // LF - VIOLATION: should be left of MF
    "5": { x: 100, y: 300, isCustom: true, lastModified: new Date() }, // LB - OK
    "6": { x: 300, y: 300, isCustom: true, lastModified: new Date() }, // MB - OK
  };

  const rotationMap = { 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6" };

  // Convert to volleyball states
  const volleyballStates = StateConverter.formationToVolleyballStates(
    violatingPositions,
    rotationMap,
    1
  );

  // Validate
  const result = OverlapValidator.checkOverlap(volleyballStates);

  console.log("Violation detection results:");
  console.log("Is legal formation:", result.isLegal);
  console.log("Number of violations:", result.violations.length);

  result.violations.forEach((violation, index) => {
    console.log(`Violation ${index + 1}:`, {
      code: violation.code,
      message: violation.message,
      affectedSlots: violation.slots,
      coordinates: violation.coordinates,
    });
  });

  return result;
}

/**
 * Demo: Coordinate system migration
 */
export function demoCoordinateSystemMigration() {
  console.log("\n=== Coordinate System Migration Demo ===");

  // Simulate legacy position data
  const legacyPositions = {
    version: "0.9.0",
    lastModified: new Date(),
    positions: {
      "5-1": {
        1: {
          rotational: {
            "1": { x: 500, y: 300, isCustom: false, lastModified: new Date() },
            "2": { x: 500, y: 100, isCustom: false, lastModified: new Date() },
          },
          serveReceive: {
            "1": { x: 480, y: 320, isCustom: true, lastModified: new Date() },
            "2": { x: 520, y: 80, isCustom: true, lastModified: new Date() },
          },
          base: {},
        },
      },
      "6-2": {},
    },
  };

  console.log("Legacy position data:", legacyPositions);

  // Demonstrate coordinate conversion
  const screenPos = { x: 300, y: 180 };
  const vbPos = StateConverter.playerPositionToVolleyball({
    ...screenPos,
    isCustom: true,
    lastModified: new Date(),
  });

  console.log(
    `Screen position (${screenPos.x}, ${
      screenPos.y
    }) converts to volleyball (${vbPos.x.toFixed(2)}, ${vbPos.y.toFixed(2)})`
  );

  const backToScreen = StateConverter.volleyballToPlayerPosition(vbPos);
  console.log(
    `Back to screen: (${backToScreen.x.toFixed(1)}, ${backToScreen.y.toFixed(
      1
    )})`
  );

  // Show coordinate system info
  const coordInfo = StateConverter.getCoordinateSystemInfo();
  console.log("Coordinate system information:", {
    volleyball: coordInfo.volleyball,
    screen: coordInfo.screen,
    scalingFactors: coordInfo.scalingFactors,
  });

  return { legacyPositions, coordInfo };
}

/**
 * Demo: Complete integration workflow
 */
export function demoCompleteIntegration() {
  console.log("\n=== Complete Integration Workflow Demo ===");

  // 1. Start with screen positions from existing system
  const screenPositions: Record<string, PlayerPosition> = {
    "1": { x: 450, y: 280, isCustom: true, lastModified: new Date() },
    "2": { x: 480, y: 120, isCustom: true, lastModified: new Date() },
    "3": { x: 300, y: 110, isCustom: true, lastModified: new Date() },
    "4": { x: 120, y: 115, isCustom: true, lastModified: new Date() },
    "5": { x: 150, y: 285, isCustom: true, lastModified: new Date() },
    "6": { x: 320, y: 290, isCustom: true, lastModified: new Date() },
  };

  const rotationMap = { 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6" };

  console.log("1. Starting screen positions:", screenPositions);

  // 2. Convert to volleyball coordinates for validation
  const volleyballStates = StateConverter.formationToVolleyballStates(
    screenPositions,
    rotationMap,
    1
  );

  console.log("2. Converted to volleyball coordinates");

  // 3. Validate formation
  const validation = OverlapValidator.checkOverlap(volleyballStates);
  console.log("3. Validation result:", {
    isLegal: validation.isLegal,
    violationCount: validation.violations.length,
  });

  // 4. Calculate constraints for a player
  const positionMap = new Map();
  volleyballStates.forEach((state) => positionMap.set(state.slot, state));

  const constraints = ConstraintCalculator.calculateValidBounds(
    3,
    positionMap,
    false
  );
  console.log("4. Constraints for middle front player:", {
    isConstrained: constraints.isConstrained,
    hasConstraints: constraints.constraintReasons.length > 0,
  });

  // 5. Simulate drag operation
  const newScreenPosition = { x: 280, y: 105 }; // Slightly left
  const newVbPosition = StateConverter.playerPositionToVolleyball({
    ...newScreenPosition,
    isCustom: true,
    lastModified: new Date(),
  });

  const isValidMove = ConstraintCalculator.isPositionValid(
    3,
    newVbPosition,
    positionMap,
    false
  );

  console.log("5. Drag validation:", {
    newScreenPosition,
    newVbPosition: {
      x: newVbPosition.x.toFixed(2),
      y: newVbPosition.y.toFixed(2),
    },
    isValid: isValidMove,
  });

  // 6. Update positions and re-validate
  if (isValidMove) {
    const updatedPositions = {
      ...screenPositions,
      "3": { ...newScreenPosition, isCustom: true, lastModified: new Date() },
    };

    const updatedStates = StateConverter.formationToVolleyballStates(
      updatedPositions,
      rotationMap,
      1
    );

    const finalValidation = OverlapValidator.checkOverlap(updatedStates);
    console.log("6. Final validation after move:", {
      isLegal: finalValidation.isLegal,
      violationCount: finalValidation.violations.length,
    });
  }

  return {
    originalPositions: screenPositions,
    validation,
    constraints,
    dragResult: { newPosition: newScreenPosition, isValid: isValidMove },
  };
}

/**
 * Run all integration demos
 */
export function runAllIntegrationDemos() {
  console.log("🏐 Volleyball Rules Engine Integration Demos 🏐\n");

  try {
    const demo1 = demoScreenToVolleyballValidation();
    const demo2 = demoRealTimeConstraints();
    const demo3 = demoViolationDetection();
    const demo4 = demoCoordinateSystemMigration();
    const demo5 = demoCompleteIntegration();

    console.log("\n✅ All integration demos completed successfully!");

    return {
      screenToVolleyball: demo1,
      realTimeConstraints: demo2,
      violationDetection: demo3,
      coordinateMigration: demo4,
      completeIntegration: demo5,
    };
  } catch (error) {
    console.error("❌ Demo failed:", error);
    throw error;
  }
}

// Export for use in other files
export default {
  demoScreenToVolleyballValidation,
  demoRealTimeConstraints,
  demoViolationDetection,
  demoCoordinateSystemMigration,
  demoCompleteIntegration,
  runAllIntegrationDemos,
};
