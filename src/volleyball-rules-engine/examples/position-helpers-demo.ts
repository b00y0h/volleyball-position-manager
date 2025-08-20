/**
 * Demonstration of PositionHelpers functionality
 */

import { PositionHelpers } from "../utils/PositionHelpers";
import type { PlayerState, RotationSlot } from "../types/PlayerState";

// Create a sample lineup for demonstration
const createSampleLineup = (): PlayerState[] => [
  {
    id: "player1",
    displayName: "Alice",
    role: "S",
    slot: 1, // RB
    x: 7.5,
    y: 7.0,
    isServer: false,
  },
  {
    id: "player2",
    displayName: "Bob",
    role: "OPP",
    slot: 2, // RF
    x: 8.0,
    y: 2.0,
    isServer: true,
  },
  {
    id: "player3",
    displayName: "Charlie",
    role: "MB1",
    slot: 3, // MF
    x: 4.5,
    y: 2.0,
    isServer: false,
  },
  {
    id: "player4",
    displayName: "Diana",
    role: "OH1",
    slot: 4, // LF
    x: 1.0,
    y: 2.0,
    isServer: false,
  },
  {
    id: "player5",
    displayName: "Eve",
    role: "L",
    slot: 5, // LB
    x: 2.0,
    y: 7.0,
    isServer: false,
  },
  {
    id: "player6",
    displayName: "Frank",
    role: "MB2",
    slot: 6, // MB
    x: 4.5,
    y: 7.0,
    isServer: false,
  },
];

/**
 * Demonstrate basic position labeling functionality
 */
export function demonstratePositionLabeling(): void {
  console.log("=== Position Labeling Demo ===");

  const allSlots: RotationSlot[] = [1, 2, 3, 4, 5, 6];

  allSlots.forEach((slot) => {
    const label = PositionHelpers.getSlotLabel(slot);
    const fullName = PositionHelpers.getSlotFullName(slot);
    const column = PositionHelpers.getSlotColumn(slot);
    const row = PositionHelpers.getSlotRow(slot);
    const display = PositionHelpers.formatPositionDisplay(slot);
    const compact = PositionHelpers.formatCompactDisplay(slot);

    console.log(`Slot ${slot}:`);
    console.log(`  Label: ${label}`);
    console.log(`  Full Name: ${fullName}`);
    console.log(`  Column: ${column}`);
    console.log(`  Row: ${row}`);
    console.log(`  Display: ${display}`);
    console.log(`  Compact: ${compact}`);
    console.log();
  });
}

/**
 * Demonstrate position grouping functionality
 */
export function demonstratePositionGrouping(): void {
  console.log("=== Position Grouping Demo ===");

  console.log("Front Row Slots:", PositionHelpers.getFrontRowSlots());
  console.log("Back Row Slots:", PositionHelpers.getBackRowSlots());
  console.log("Left Column Slots:", PositionHelpers.getLeftColumnSlots());
  console.log("Middle Column Slots:", PositionHelpers.getMiddleColumnSlots());
  console.log("Right Column Slots:", PositionHelpers.getRightColumnSlots());
  console.log();
}

/**
 * Demonstrate position relationships functionality
 */
export function demonstratePositionRelationships(): void {
  console.log("=== Position Relationships Demo ===");

  const allSlots: RotationSlot[] = [1, 2, 3, 4, 5, 6];

  allSlots.forEach((slot) => {
    const relationships = PositionHelpers.getPositionRelationships(slot);
    const label = PositionHelpers.getSlotLabel(slot);

    console.log(`${label} (${slot}) relationships:`);
    console.log(
      `  Neighbors: ${relationships.neighbors
        .map((s) => PositionHelpers.getSlotLabel(s))
        .join(", ")}`
    );
    console.log(
      `  Counterpart: ${
        relationships.counterpart
          ? PositionHelpers.getSlotLabel(relationships.counterpart)
          : "None"
      }`
    );
    console.log(
      `  Same Row: ${relationships.sameRow
        .map((s) => PositionHelpers.getSlotLabel(s))
        .join(", ")}`
    );
    console.log(
      `  Same Column: ${relationships.sameColumn
        .map((s) => PositionHelpers.getSlotLabel(s))
        .join(", ")}`
    );
    console.log();
  });
}

/**
 * Demonstrate formation analysis functionality
 */
export function demonstrateFormationAnalysis(): void {
  console.log("=== Formation Analysis Demo ===");

  const lineup = createSampleLineup();
  const pattern = PositionHelpers.analyzeFormationPattern(lineup);

  console.log("Formation Analysis Results:");
  console.log(`  Name: ${pattern.name}`);
  console.log(`  Description: ${pattern.description}`);
  console.log(`  Is Valid: ${pattern.isValid}`);
  console.log("  Characteristics:");
  pattern.characteristics.forEach((char) => {
    console.log(`    - ${char}`);
  });
  console.log();
}

/**
 * Demonstrate adjacency and counterpart checking
 */
export function demonstrateRelationshipChecking(): void {
  console.log("=== Relationship Checking Demo ===");

  // Test adjacency
  console.log("Adjacent pairs:");
  console.log(`  LF-MF (4-3): ${PositionHelpers.areAdjacent(4, 3)}`);
  console.log(`  MF-RF (3-2): ${PositionHelpers.areAdjacent(3, 2)}`);
  console.log(`  LB-MB (5-6): ${PositionHelpers.areAdjacent(5, 6)}`);
  console.log(`  MB-RB (6-1): ${PositionHelpers.areAdjacent(6, 1)}`);
  console.log(
    `  LF-RF (4-2): ${PositionHelpers.areAdjacent(4, 2)} (should be false)`
  );
  console.log();

  // Test counterparts
  console.log("Counterpart pairs:");
  console.log(`  LF-LB (4-5): ${PositionHelpers.areCounterparts(4, 5)}`);
  console.log(`  MF-MB (3-6): ${PositionHelpers.areCounterparts(3, 6)}`);
  console.log(`  RF-RB (2-1): ${PositionHelpers.areCounterparts(2, 1)}`);
  console.log(
    `  LF-MF (4-3): ${PositionHelpers.areCounterparts(4, 3)} (should be false)`
  );
  console.log();
}

/**
 * Run all demonstrations
 */
export function runAllDemonstrations(): void {
  console.log("🏐 PositionHelpers Demonstration\n");

  demonstratePositionLabeling();
  demonstratePositionGrouping();
  demonstratePositionRelationships();
  demonstrateFormationAnalysis();
  demonstrateRelationshipChecking();

  console.log("✅ All demonstrations completed!");
}

// Run demonstrations if this file is executed directly
if (require.main === module) {
  runAllDemonstrations();
}
