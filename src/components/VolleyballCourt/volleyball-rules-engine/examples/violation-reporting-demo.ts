/**
 * Demonstration of enhanced violation reporting and messaging functionality
 * This example shows how to use the detailed violation detection and user-friendly messaging
 */

import { OverlapValidator } from "../validation/OverlapValidator";
import type { PlayerState } from "../types/PlayerState";

// Create a lineup with multiple violations for demonstration
const problematicLineup: PlayerState[] = [
  {
    id: "player1",
    displayName: "Alice Johnson",
    role: "OH1",
    slot: 1, // Right Back
    x: 7.0,
    y: 6.0,
    isServer: true,
  },
  {
    id: "player2",
    displayName: "Bob Smith",
    role: "OPP",
    slot: 2, // Right Front
    x: 2.0, // Too far left - should be rightmost front player
    y: 3.0,
    isServer: false,
  },
  {
    id: "player3",
    displayName: "Carol Davis",
    role: "MB1",
    slot: 3, // Middle Front
    x: 4.5,
    y: 7.0, // Behind the back row - violation
    isServer: false,
  },
  {
    id: "player4",
    displayName: "David Wilson",
    role: "OH2",
    slot: 4, // Left Front
    x: 7.0, // Too far right - should be leftmost front player
    y: 3.0,
    isServer: false,
  },
  {
    id: "player5",
    displayName: "Eve Brown",
    role: "L",
    slot: 5, // Left Back
    x: 2.0,
    y: 6.0,
    isServer: false,
  },
  {
    id: "player6",
    displayName: "Frank Miller",
    role: "MB2",
    slot: 6, // Middle Back
    x: 4.5,
    y: 6.0,
    isServer: true, // Second server - violation
  },
];

console.log("=== Volleyball Rules Engine - Violation Reporting Demo ===\n");

// 1. Basic validation
console.log("1. Basic Validation:");
const basicResult = OverlapValidator.checkOverlap(problematicLineup);
console.log(`Formation is legal: ${basicResult.isLegal}`);
console.log(`Number of violations: ${basicResult.violations.length}\n`);

// 2. Enhanced detailed violations
console.log("2. Enhanced Detailed Violations:");
const detailedViolations =
  OverlapValidator.generateDetailedViolations(problematicLineup);
detailedViolations.forEach((violation, index) => {
  console.log(`Violation ${index + 1}:`);
  console.log(`  Code: ${violation.code}`);
  console.log(`  Affected slots: ${violation.slots.join(", ")}`);
  console.log(`  Message: ${violation.message}`);
  if (violation.coordinates) {
    console.log(`  Coordinates:`);
    Object.entries(violation.coordinates).forEach(([slot, coord]) => {
      console.log(
        `    Slot ${slot}: (${coord.x.toFixed(2)}, ${coord.y.toFixed(2)})`
      );
    });
  }
  console.log("");
});

// 3. Violation summary statistics
console.log("3. Violation Summary:");
const summary = OverlapValidator.getViolationSummary(detailedViolations);
console.log(`Total violations: ${summary.totalViolations}`);
console.log(`Severity level: ${summary.severity}`);
console.log(`Affected slots: ${summary.affectedSlots.join(", ")}`);
console.log(`Violation types:`);
Object.entries(summary.violationTypes).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});
console.log("");

// 4. User-friendly messages
console.log("4. User-Friendly Messages:");
const userMessages =
  OverlapValidator.generateUserFriendlyMessages(detailedViolations);
userMessages.forEach((message) => {
  console.log(message);
});
console.log("");

// 5. Individual violation explanations
console.log("5. Individual Violation Explanations:");
const positionMap = new Map();
problematicLineup.forEach((player) => positionMap.set(player.slot, player));

detailedViolations.forEach((violation, index) => {
  const explanation = OverlapValidator.explainViolation(violation, positionMap);
  console.log(`Explanation ${index + 1}: ${explanation}`);
});
console.log("");

// 6. Demonstrate with a legal formation
console.log("6. Legal Formation Example:");
const legalLineup: PlayerState[] = [
  {
    id: "p1",
    displayName: "Player 1",
    role: "L",
    slot: 1,
    x: 7.0,
    y: 6.0,
    isServer: false,
  },
  {
    id: "p2",
    displayName: "Player 2",
    role: "OPP",
    slot: 2,
    x: 7.0,
    y: 3.0,
    isServer: false,
  },
  {
    id: "p3",
    displayName: "Player 3",
    role: "MB1",
    slot: 3,
    x: 4.5,
    y: 3.0,
    isServer: false,
  },
  {
    id: "p4",
    displayName: "Player 4",
    role: "OH1",
    slot: 4,
    x: 2.0,
    y: 3.0,
    isServer: false,
  },
  {
    id: "p5",
    displayName: "Player 5",
    role: "OH2",
    slot: 5,
    x: 2.0,
    y: 6.0,
    isServer: false,
  },
  {
    id: "p6",
    displayName: "Player 6",
    role: "S",
    slot: 6,
    x: 4.5,
    y: 6.0,
    isServer: true,
  },
];

const legalResult = OverlapValidator.checkOverlap(legalLineup);
const legalMessages = OverlapValidator.generateUserFriendlyMessages(
  legalResult.violations
);
console.log("Legal formation result:");
legalMessages.forEach((message) => {
  console.log(message);
});

console.log("\n=== Demo Complete ===");
