/**
 * Performance optimization demonstration
 * Shows how to use the performance-optimized components for high-performance scenarios
 */

import type { PlayerState, RotationSlot } from "../types/PlayerState";
import { OverlapValidator } from "../validation/OverlapValidator";
import { ConstraintCalculator } from "../validation/ConstraintCalculator";
import { OptimizedConstraintCalculator } from "../validation/OptimizedConstraintCalculator";
import { LazyViolationAnalyzer } from "../validation/LazyViolationAnalyzer";
import { PerformanceCache } from "../utils/PerformanceCache";
import { OptimizedCoordinateTransformer } from "../utils/OptimizedCoordinateTransformer";

/**
 * Example lineup for demonstration
 */
const createExampleLineup = (): PlayerState[] => [
  {
    id: "1",
    displayName: "Server",
    role: "S",
    slot: 1,
    x: 7.0,
    y: 7.0,
    isServer: true,
  },
  {
    id: "2",
    displayName: "Outside",
    role: "OPP",
    slot: 2,
    x: 7.0,
    y: 2.0,
    isServer: false,
  },
  {
    id: "3",
    displayName: "Middle",
    role: "MB1",
    slot: 3,
    x: 4.5,
    y: 2.0,
    isServer: false,
  },
  {
    id: "4",
    displayName: "Outside",
    role: "OH1",
    slot: 4,
    x: 2.0,
    y: 2.0,
    isServer: false,
  },
  {
    id: "5",
    displayName: "Libero",
    role: "L",
    slot: 5,
    x: 2.0,
    y: 7.0,
    isServer: false,
  },
  {
    id: "6",
    displayName: "Middle",
    role: "MB2",
    slot: 6,
    x: 4.5,
    y: 7.0,
    isServer: false,
  },
];

/**
 * Demonstrate basic validation with caching
 */
function demonstrateValidationCaching(): void {
  console.log("=== Validation Caching Demo ===");

  const lineup = createExampleLineup();

  // First validation (cache miss)
  console.time("First validation");
  const result1 = PerformanceCache.getCachedValidation(lineup, () =>
    OverlapValidator.checkOverlap(lineup)
  );
  console.timeEnd("First validation");

  // Second validation (cache hit)
  console.time("Second validation");
  const result2 = PerformanceCache.getCachedValidation(lineup, () =>
    OverlapValidator.checkOverlap(lineup)
  );
  console.timeEnd("Second validation");

  console.log("Results identical:", result1.isLegal === result2.isLegal);

  const metrics = PerformanceCache.getMetrics();
  console.log(
    "Cache hit rate:",
    (metrics.validationHitRate * 100).toFixed(1) + "%"
  );
  console.log("");
}

/**
 * Demonstrate optimized constraint calculation
 */
function demonstrateOptimizedConstraints(): void {
  console.log("=== Optimized Constraint Calculation Demo ===");

  const lineup = createExampleLineup();
  const positionMap = new Map<RotationSlot, PlayerState>();
  lineup.forEach((player) => positionMap.set(player.slot, player));

  // Standard constraint calculation
  console.time("Standard constraint calculation");
  const standardResult = ConstraintCalculator.calculateValidBounds(
    1,
    positionMap,
    false
  );
  console.timeEnd("Standard constraint calculation");

  // Optimized constraint calculation
  console.time("Optimized constraint calculation");
  const optimizedResult =
    OptimizedConstraintCalculator.calculateOptimizedConstraints(
      1,
      positionMap,
      false
    );
  console.timeEnd("Optimized constraint calculation");

  console.log("Standard bounds:", standardResult);
  console.log("Optimized bounds:", {
    minX: optimizedResult.minX,
    maxX: optimizedResult.maxX,
    minY: optimizedResult.minY,
    maxY: optimizedResult.maxY,
    calculationTime: optimizedResult.calculationTime.toFixed(3) + "ms",
    cacheHit: optimizedResult.cacheHit,
  });
  console.log("");
}

/**
 * Demonstrate batch constraint calculations
 */
function demonstrateBatchConstraints(): void {
  console.log("=== Batch Constraint Calculation Demo ===");

  const lineup = createExampleLineup();
  const positionMap = new Map<RotationSlot, PlayerState>();
  lineup.forEach((player) => positionMap.set(player.slot, player));

  const slots: RotationSlot[] = [1, 2, 3, 4, 5, 6];

  console.time("Batch constraint calculation");
  const batchResults = OptimizedConstraintCalculator.batchCalculateConstraints(
    slots,
    positionMap
  );
  console.timeEnd("Batch constraint calculation");

  console.log("Calculated constraints for", batchResults.size, "slots");

  for (const [slot, result] of batchResults) {
    console.log(
      `Slot ${slot}: ${result.calculationTime.toFixed(3)}ms, cache hit: ${
        result.cacheHit
      }`
    );
  }
  console.log("");
}

/**
 * Demonstrate lazy violation analysis
 */
function demonstrateLazyViolations(): void {
  console.log("=== Lazy Violation Analysis Demo ===");

  // Create lineup with violations
  const lineupWithViolations: PlayerState[] = [
    {
      id: "1",
      displayName: "Player 1",
      role: "S",
      slot: 1,
      x: 7.0,
      y: 7.0,
      isServer: false,
    },
    {
      id: "2",
      displayName: "Player 2",
      role: "OPP",
      slot: 2,
      x: 7.0,
      y: 2.0,
      isServer: false,
    },
    {
      id: "3",
      displayName: "Player 3",
      role: "MB1",
      slot: 3,
      x: 8.0,
      y: 2.0,
      isServer: false,
    }, // Violation
    {
      id: "4",
      displayName: "Player 4",
      role: "OH1",
      slot: 4,
      x: 2.0,
      y: 8.0,
      isServer: false,
    }, // Violation
    {
      id: "5",
      displayName: "Player 5",
      role: "L",
      slot: 5,
      x: 2.0,
      y: 7.0,
      isServer: false,
    },
    {
      id: "6",
      displayName: "Player 6",
      role: "MB2",
      slot: 6,
      x: 4.5,
      y: 7.0,
      isServer: true,
    }, // Multiple servers
  ];

  console.time("Lazy result creation");
  const lazyResult =
    LazyViolationAnalyzer.createLazyOverlapResult(lineupWithViolations);
  console.timeEnd("Lazy result creation");

  console.log("Is legal:", lazyResult.isLegal);
  console.log("Violation count:", lazyResult.getViolationCount());
  console.log("Severity:", lazyResult.getSeverity());

  // Access detailed information (lazy evaluation)
  console.time("Detail calculation");
  const messages = lazyResult.getUserFriendlyMessages();
  console.timeEnd("Detail calculation");

  console.log("User-friendly messages:");
  messages.forEach((message) => console.log("  -", message));
  console.log("");
}

/**
 * Demonstrate coordinate transformation optimizations
 */
function demonstrateCoordinateOptimizations(): void {
  console.log("=== Coordinate Transformation Optimizations Demo ===");

  const testPoints = [
    { x: 100, y: 50 },
    { x: 300, y: 180 },
    { x: 500, y: 300 },
  ];

  console.time("Standard transformations");
  testPoints.forEach((point) => {
    OptimizedCoordinateTransformer.screenToVolleyballFast(point.x, point.y);
  });
  console.timeEnd("Standard transformations");

  console.time("Batch transformations");
  OptimizedCoordinateTransformer.batchScreenToVolleyball(testPoints);
  console.timeEnd("Batch transformations");

  // Demonstrate validation
  const validationResults =
    OptimizedCoordinateTransformer.batchValidatePositions(
      testPoints.map((p) =>
        OptimizedCoordinateTransformer.screenToVolleyballFast(p.x, p.y)
      ),
      false
    );

  console.log("Validation results:", validationResults);
  console.log("");
}

/**
 * Demonstrate incremental updates
 */
function demonstrateIncrementalUpdates(): void {
  console.log("=== Incremental Updates Demo ===");

  const lineup = createExampleLineup();
  const positionMap = new Map<RotationSlot, PlayerState>();
  lineup.forEach((player) => positionMap.set(player.slot, player));

  // Initial constraint calculation
  console.time("Initial constraints");
  const initialResults =
    OptimizedConstraintCalculator.batchCalculateConstraints(
      [1, 2, 3, 4, 5, 6],
      positionMap
    );
  console.timeEnd("Initial constraints");

  // Simulate player movement
  const updatedPlayer = { ...positionMap.get(1)!, x: 7.5, y: 7.2 };
  positionMap.set(1, updatedPlayer);

  // Incremental update
  console.time("Incremental update");
  const updateInfo = {
    slot: 1 as RotationSlot,
    oldPosition: { x: 7.0, y: 7.0 },
    newPosition: { x: 7.5, y: 7.2 },
    affectedSlots: [1, 2, 6] as RotationSlot[], // Slots that need recalculation
  };

  const incrementalResults =
    OptimizedConstraintCalculator.performIncrementalUpdate(
      updateInfo,
      positionMap
    );
  console.timeEnd("Incremental update");

  console.log(
    "Updated constraints for",
    incrementalResults.size,
    "affected slots"
  );
  console.log("");
}

/**
 * Show performance metrics
 */
function showPerformanceMetrics(): void {
  console.log("=== Performance Metrics ===");

  const cacheMetrics = PerformanceCache.getMetrics();
  console.log("Cache Metrics:");
  console.log(
    "  Constraint hit rate:",
    (cacheMetrics.constraintHitRate * 100).toFixed(1) + "%"
  );
  console.log(
    "  Validation hit rate:",
    (cacheMetrics.validationHitRate * 100).toFixed(1) + "%"
  );
  console.log("  Cache sizes:", cacheMetrics.cacheSize);

  const constraintMetrics =
    OptimizedConstraintCalculator.getPerformanceMetrics();
  console.log("Constraint Calculator Metrics:");
  console.log("  Total calculations:", constraintMetrics.totalCalculations);
  console.log("  Cache hits:", constraintMetrics.cacheHits);
  console.log("  Incremental updates:", constraintMetrics.incrementalUpdates);
  console.log(
    "  Average calculation time:",
    constraintMetrics.averageCalculationTime.toFixed(3) + "ms"
  );

  const coordinateStats = OptimizedCoordinateTransformer.getCacheStats();
  console.log("Coordinate Transformer Cache:", coordinateStats);

  const lazyStats = LazyViolationAnalyzer.getCacheStats();
  console.log("Lazy Analyzer Cache:", lazyStats);
  console.log("");
}

/**
 * Run all performance demonstrations
 */
function runPerformanceDemo(): void {
  console.log("🏐 Volleyball Rules Engine - Performance Optimization Demo\n");

  demonstrateValidationCaching();
  demonstrateOptimizedConstraints();
  demonstrateBatchConstraints();
  demonstrateLazyViolations();
  demonstrateCoordinateOptimizations();
  demonstrateIncrementalUpdates();
  showPerformanceMetrics();

  console.log("✅ Performance demo completed!");
}

// Export for use in other modules
export {
  runPerformanceDemo,
  demonstrateValidationCaching,
  demonstrateOptimizedConstraints,
  demonstrateBatchConstraints,
  demonstrateLazyViolations,
  demonstrateCoordinateOptimizations,
  demonstrateIncrementalUpdates,
  showPerformanceMetrics,
};

// Run demo if this file is executed directly
if (typeof require !== "undefined" && require.main === module) {
  runPerformanceDemo();
}
