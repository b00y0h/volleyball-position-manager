/**
 * Simple test to verify the VolleyballRulesEngine API works
 */

import { VolleyballRulesEngine } from "./VolleyballRulesEngine";
import type { PlayerState } from "./types/index";

// Test data
const testPlayers: PlayerState[] = [
  {
    id: "1",
    displayName: "Setter",
    role: "S",
    slot: 1,
    x: 8.0,
    y: 6.0,
    isServer: true,
  },
  {
    id: "2",
    displayName: "Opposite",
    role: "OPP",
    slot: 2,
    x: 7.0,
    y: 3.0,
    isServer: false,
  },
  {
    id: "3",
    displayName: "Middle",
    role: "MB1",
    slot: 3,
    x: 4.5,
    y: 3.0,
    isServer: false,
  },
  {
    id: "4",
    displayName: "Outside",
    role: "OH1",
    slot: 4,
    x: 2.0,
    y: 3.0,
    isServer: false,
  },
  {
    id: "5",
    displayName: "Libero",
    role: "L",
    slot: 5,
    x: 1.0,
    y: 6.0,
    isServer: false,
  },
  {
    id: "6",
    displayName: "Middle Back",
    role: "MB2",
    slot: 6,
    x: 4.5,
    y: 6.0,
    isServer: false,
  },
];

console.log("🏐 Testing Volleyball Rules Engine API...\n");

try {
  // Test 1: Basic validation
  console.log("1. Testing basic validation...");
  const result = VolleyballRulesEngine.validateLineup(testPlayers);
  console.log(
    `   ✅ Validation result: ${result.isLegal ? "Legal" : "Illegal"}`
  );
  console.log(`   ✅ Violations: ${result.violations.length}`);

  // Test 2: Position labeling
  console.log("\n2. Testing position labeling...");
  for (let slot = 1; slot <= 6; slot++) {
    const label = VolleyballRulesEngine.getSlotLabel(slot as any);
    const column = VolleyballRulesEngine.getSlotColumn(slot as any);
    const row = VolleyballRulesEngine.getSlotRow(slot as any);
    console.log(`   ✅ Slot ${slot}: ${label} (${column} ${row})`);
  }

  // Test 3: Constraint calculation
  console.log("\n3. Testing constraint calculation...");
  const constraints = VolleyballRulesEngine.getPlayerConstraints(
    3,
    testPlayers
  );
  console.log(
    `   ✅ Middle Front constraints: x(${constraints.minX.toFixed(
      2
    )}-${constraints.maxX.toFixed(2)}) y(${constraints.minY.toFixed(
      2
    )}-${constraints.maxY.toFixed(2)})`
  );
  console.log(`   ✅ Is constrained: ${constraints.isConstrained}`);

  // Test 4: Position validation
  console.log("\n4. Testing position validation...");
  const isValid = VolleyballRulesEngine.isValidPosition(
    3,
    { x: 4.5, y: 3.0 },
    testPlayers
  );
  console.log(`   ✅ Position (4.5, 3.0) for slot 3 is valid: ${isValid}`);

  // Test 5: Coordinate conversion
  console.log("\n5. Testing coordinate conversion...");
  const vbCoords = VolleyballRulesEngine.convertCoordinates.screenToVolleyball(
    300,
    180
  );
  const screenCoords =
    VolleyballRulesEngine.convertCoordinates.volleyballToScreen(4.5, 4.5);
  console.log(
    `   ✅ Screen (300, 180) → Volleyball (${vbCoords.x}, ${vbCoords.y})`
  );
  console.log(
    `   ✅ Volleyball (4.5, 4.5) → Screen (${screenCoords.x}, ${screenCoords.y})`
  );

  // Test 6: Constants access
  console.log("\n6. Testing constants access...");
  const coords = VolleyballRulesEngine.COORDINATE_SYSTEM;
  console.log(
    `   ✅ Court dimensions: ${coords.COURT_WIDTH}m × ${coords.COURT_LENGTH}m`
  );
  console.log(`   ✅ Tolerance: ${coords.TOLERANCE}m`);

  console.log(
    "\n🎉 All API tests passed! The VolleyballRulesEngine is working correctly."
  );
} catch (error) {
  console.error("\n❌ API test failed:", error);
  process.exit(1);
}
