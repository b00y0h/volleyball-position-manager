/**
 * Basic Usage Examples for Volleyball Rules Engine
 *
 * This file demonstrates the most common use cases for the volleyball rules engine,
 * including lineup validation, constraint calculation, and error handling.
 */

import {
  VolleyballRulesEngine,
  type PlayerState,
  type OverlapResult,
} from "../index";

// ============================================================================
// EXAMPLE 1: Basic Lineup Validation
// ============================================================================

/**
 * Example of validating a legal volleyball formation
 */
export function basicValidationExample() {
  console.log("=== Basic Validation Example ===");

  // Create a legal 5-1 formation in serve receive
  const legalFormation: PlayerState[] = [
    {
      id: "setter",
      displayName: "Sarah (S)",
      role: "S",
      slot: 1,
      x: 8.0,
      y: 6.0,
      isServer: true, // Server positioned in back right
    },
    {
      id: "opposite",
      displayName: "Mike (OPP)",
      role: "OPP",
      slot: 2,
      x: 7.0,
      y: 3.0,
      isServer: false,
    },
    {
      id: "middle1",
      displayName: "Alex (MB)",
      role: "MB1",
      slot: 3,
      x: 4.5,
      y: 3.0,
      isServer: false,
    },
    {
      id: "outside1",
      displayName: "Emma (OH)",
      role: "OH1",
      slot: 4,
      x: 2.0,
      y: 3.0,
      isServer: false,
    },
    {
      id: "libero",
      displayName: "Jordan (L)",
      role: "L",
      slot: 5,
      x: 1.0,
      y: 6.0,
      isServer: false,
    },
    {
      id: "middle2",
      displayName: "Taylor (MB)",
      role: "MB2",
      slot: 6,
      x: 4.5,
      y: 6.0,
      isServer: false,
    },
  ];

  // Validate the formation
  const result = VolleyballRulesEngine.validateLineup(legalFormation);

  console.log("Formation validation result:");
  console.log(`- Is legal: ${result.isLegal}`);
  console.log(`- Violations: ${result.violations.length}`);

  if (result.isLegal) {
    console.log("✅ Formation is legal and ready for play!");
  } else {
    console.log("❌ Formation has violations:");
    result.violations.forEach((violation, index) => {
      console.log(`  ${index + 1}. ${violation.message}`);
    });
  }

  return result;
}

// ============================================================================
// EXAMPLE 2: Handling Violations
// ============================================================================

/**
 * Example of detecting and explaining violations
 */
export function violationHandlingExample() {
  console.log("\n=== Violation Handling Example ===");

  // Create a formation with multiple violations
  const invalidFormation: PlayerState[] = [
    {
      id: "setter",
      displayName: "Sarah (S)",
      role: "S",
      slot: 1,
      x: 8.0,
      y: 6.0,
      isServer: false, // No server designated
    },
    {
      id: "opposite",
      displayName: "Mike (OPP)",
      role: "OPP",
      slot: 2,
      x: 3.0, // Positioned left of middle front (violation)
      y: 3.0,
      isServer: false,
    },
    {
      id: "middle1",
      displayName: "Alex (MB)",
      role: "MB1",
      slot: 3,
      x: 4.5,
      y: 7.0, // Positioned behind back row counterpart (violation)
      isServer: false,
    },
    {
      id: "outside1",
      displayName: "Emma (OH)",
      role: "OH1",
      slot: 4,
      x: 2.0,
      y: 3.0,
      isServer: false,
    },
    {
      id: "libero",
      displayName: "Jordan (L)",
      role: "L",
      slot: 5,
      x: 1.0,
      y: 6.0,
      isServer: false,
    },
    {
      id: "middle2",
      displayName: "Taylor (MB)",
      role: "MB2",
      slot: 6,
      x: 4.5,
      y: 6.0,
      isServer: false,
    },
  ];

  const result = VolleyballRulesEngine.validateLineup(invalidFormation);

  console.log("Violation analysis:");
  console.log(`- Is legal: ${result.isLegal}`);
  console.log(`- Number of violations: ${result.violations.length}`);

  if (!result.isLegal) {
    console.log("\nDetailed violation explanations:");
    result.violations.forEach((violation, index) => {
      const explanation = VolleyballRulesEngine.explainViolation(
        violation,
        invalidFormation
      );
      console.log(`\n${index + 1}. ${violation.code} Violation:`);
      console.log(`   ${explanation}`);
      console.log(`   Affected slots: [${violation.slots.join(", ")}]`);
    });
  }

  return result;
}

// ============================================================================
// EXAMPLE 3: Position Information and Labeling
// ============================================================================

/**
 * Example of using position helper functions
 */
export function positionLabelingExample() {
  console.log("\n=== Position Labeling Example ===");

  console.log("Volleyball position information:");
  console.log("Slot | Label | Full Name     | Column | Row   | Description");
  console.log(
    "-----|-------|---------------|--------|-------|------------------"
  );

  for (let slot = 1; slot <= 6; slot++) {
    const rotationSlot = slot as any; // Type assertion for example
    const label = VolleyballRulesEngine.getSlotLabel(rotationSlot);
    const column = VolleyballRulesEngine.getSlotColumn(rotationSlot);
    const row = VolleyballRulesEngine.getSlotRow(rotationSlot);
    const description =
      VolleyballRulesEngine.getPositionDescription(rotationSlot);

    console.log(
      `  ${slot}  |  ${label}   | ${description.fullName.padEnd(
        13
      )} | ${column.padEnd(6)} | ${row.padEnd(5)} | ${description.abbreviation}`
    );
  }

  // Example of using position information in application logic
  const frontRowSlots = [2, 3, 4];
  const backRowSlots = [1, 5, 6];

  console.log("\nFront row positions:");
  frontRowSlots.forEach((slot) => {
    const description = VolleyballRulesEngine.getPositionDescription(
      slot as any
    );
    console.log(
      `- Slot ${slot}: ${description.fullName} (${description.abbreviation})`
    );
  });

  console.log("\nBack row positions:");
  backRowSlots.forEach((slot) => {
    const description = VolleyballRulesEngine.getPositionDescription(
      slot as any
    );
    console.log(
      `- Slot ${slot}: ${description.fullName} (${description.abbreviation})`
    );
  });
}

// ============================================================================
// EXAMPLE 4: Coordinate System Usage
// ============================================================================

/**
 * Example of working with the coordinate system
 */
export function coordinateSystemExample() {
  console.log("\n=== Coordinate System Example ===");

  // Display coordinate system information
  const coords = VolleyballRulesEngine.COORDINATE_SYSTEM;
  console.log("Volleyball court coordinate system:");
  console.log(
    `- Court width: ${coords.COURT_WIDTH}m (x: ${coords.LEFT_SIDELINE_X} to ${coords.RIGHT_SIDELINE_X})`
  );
  console.log(
    `- Court length: ${coords.COURT_LENGTH}m (y: ${coords.NET_Y} to ${coords.ENDLINE_Y})`
  );
  console.log(
    `- Service zone: y: ${coords.SERVICE_ZONE_START} to ${coords.SERVICE_ZONE_END}`
  );
  console.log(
    `- Tolerance: ±${coords.TOLERANCE}m (${coords.TOLERANCE * 100}cm)`
  );

  // Example coordinate conversions
  console.log("\nCoordinate conversion examples:");

  // Convert screen coordinates to volleyball coordinates
  const screenPoints = [
    { x: 0, y: 0, description: "Top-left corner" },
    { x: 300, y: 180, description: "Center of screen" },
    { x: 600, y: 360, description: "Bottom-right corner" },
  ];

  screenPoints.forEach((point) => {
    const vbCoords =
      VolleyballRulesEngine.convertCoordinates.screenToVolleyball(
        point.x,
        point.y
      );
    console.log(
      `- ${point.description}: (${point.x}, ${
        point.y
      }) screen → (${vbCoords.x.toFixed(1)}, ${vbCoords.y.toFixed(
        1
      )}) volleyball`
    );
  });

  // Convert volleyball coordinates to screen coordinates
  const vbPoints = [
    { x: 0, y: 0, description: "Net at left sideline" },
    { x: 4.5, y: 4.5, description: "Center of court" },
    { x: 9, y: 9, description: "Endline at right sideline" },
  ];

  vbPoints.forEach((point) => {
    const screenCoords =
      VolleyballRulesEngine.convertCoordinates.volleyballToScreen(
        point.x,
        point.y
      );
    console.log(
      `- ${point.description}: (${point.x}, ${point.y}) volleyball → (${screenCoords.x}, ${screenCoords.y}) screen`
    );
  });
}

// ============================================================================
// EXAMPLE 5: Real-time Position Validation
// ============================================================================

/**
 * Example of real-time position validation during player movement
 */
export function realTimeValidationExample() {
  console.log("\n=== Real-time Validation Example ===");

  // Create a base formation
  const baseFormation: PlayerState[] = [
    {
      id: "1",
      displayName: "P1",
      role: "S",
      slot: 1,
      x: 8.0,
      y: 6.0,
      isServer: true,
    },
    {
      id: "2",
      displayName: "P2",
      role: "OPP",
      slot: 2,
      x: 7.0,
      y: 3.0,
      isServer: false,
    },
    {
      id: "3",
      displayName: "P3",
      role: "MB1",
      slot: 3,
      x: 4.5,
      y: 3.0,
      isServer: false,
    },
    {
      id: "4",
      displayName: "P4",
      role: "OH1",
      slot: 4,
      x: 2.0,
      y: 3.0,
      isServer: false,
    },
    {
      id: "5",
      displayName: "P5",
      role: "L",
      slot: 5,
      x: 1.0,
      y: 6.0,
      isServer: false,
    },
    {
      id: "6",
      displayName: "P6",
      role: "MB2",
      slot: 6,
      x: 4.5,
      y: 6.0,
      isServer: false,
    },
  ];

  console.log("Testing position validation for Middle Front (slot 3):");

  // Test various positions for the middle front player
  const testPositions = [
    { x: 4.5, y: 3.0, description: "Current position" },
    { x: 3.0, y: 3.0, description: "Moved left (should be valid)" },
    { x: 1.5, y: 3.0, description: "Too far left (invalid - left of LF)" },
    { x: 7.5, y: 3.0, description: "Too far right (invalid - right of RF)" },
    { x: 4.5, y: 7.0, description: "Too far back (invalid - behind MB)" },
  ];

  testPositions.forEach((pos) => {
    const isValid = VolleyballRulesEngine.isValidPosition(
      3,
      pos,
      baseFormation
    );
    const status = isValid ? "✅ Valid" : "❌ Invalid";
    console.log(`- ${pos.description}: (${pos.x}, ${pos.y}) → ${status}`);
  });

  // Show constraints for the middle front player
  console.log("\nConstraints for Middle Front (slot 3):");
  const constraints = VolleyballRulesEngine.getPlayerConstraints(
    3,
    baseFormation
  );
  console.log(
    `- X range: ${constraints.minX.toFixed(2)} to ${constraints.maxX.toFixed(
      2
    )}`
  );
  console.log(
    `- Y range: ${constraints.minY.toFixed(2)} to ${constraints.maxY.toFixed(
      2
    )}`
  );
  console.log(`- Is constrained: ${constraints.isConstrained}`);

  if (constraints.constraintReasons.length > 0) {
    console.log("- Constraint reasons:");
    constraints.constraintReasons.forEach((reason) => {
      console.log(`  • ${reason}`);
    });
  }
}

// ============================================================================
// MAIN DEMO FUNCTION
// ============================================================================

/**
 * Run all basic usage examples
 */
export function runBasicUsageExamples() {
  console.log("🏐 Volleyball Rules Engine - Basic Usage Examples\n");

  try {
    basicValidationExample();
    violationHandlingExample();
    positionLabelingExample();
    coordinateSystemExample();
    realTimeValidationExample();

    console.log("\n✅ All examples completed successfully!");
  } catch (error) {
    console.error("\n❌ Error running examples:", error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runBasicUsageExamples();
}
