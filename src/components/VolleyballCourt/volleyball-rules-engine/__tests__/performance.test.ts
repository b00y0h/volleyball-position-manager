/**
 * Performance tests and benchmarks for the volleyball rules engine
 * Tests constraint calculation, validation, and caching performance
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import type { PlayerState, RotationSlot } from "../types/PlayerState";
import { OverlapValidator } from "../validation/OverlapValidator";
import { ConstraintCalculator } from "../validation/ConstraintCalculator";
import { OptimizedConstraintCalculator } from "../validation/OptimizedConstraintCalculator";
import { LazyViolationAnalyzer } from "../validation/LazyViolationAnalyzer";
import { PerformanceCache } from "../utils/PerformanceCache";
import { OptimizedCoordinateTransformer } from "../utils/OptimizedCoordinateTransformer";
import { CoordinateTransformer } from "../utils/CoordinateTransformer";

/**
 * Performance benchmark result
 */
interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  operationsPerSecond: number;
}

/**
 * Test data generator for performance tests
 */
class PerformanceTestData {
  /**
   * Generate a valid lineup for testing
   */
  static generateValidLineup(): PlayerState[] {
    return [
      {
        id: "1",
        displayName: "Player 1",
        role: "S",
        slot: 1,
        x: 7.0,
        y: 7.0,
        isServer: true,
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
        x: 4.5,
        y: 2.0,
        isServer: false,
      },
      {
        id: "4",
        displayName: "Player 4",
        role: "OH1",
        slot: 4,
        x: 2.0,
        y: 2.0,
        isServer: false,
      },
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
        isServer: false,
      },
    ];
  }

  /**
   * Generate multiple valid lineups with variations
   */
  static generateMultipleLineups(count: number): PlayerState[][] {
    const lineups: PlayerState[][] = [];

    for (let i = 0; i < count; i++) {
      const baseLineup = this.generateValidLineup();

      // Add small variations to positions
      const variation = i * 0.1;
      const lineup = baseLineup.map((player) => ({
        ...player,
        x: Math.max(
          0.5,
          Math.min(8.5, player.x + (Math.random() - 0.5) * variation)
        ),
        y: Math.max(
          0.5,
          Math.min(8.5, player.y + (Math.random() - 0.5) * variation)
        ),
      }));

      lineups.push(lineup);
    }

    return lineups;
  }

  /**
   * Generate lineup with violations for testing
   */
  static generateLineupWithViolations(): PlayerState[] {
    return [
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
      }, // Violation: MF > RF
      {
        id: "4",
        displayName: "Player 4",
        role: "OH1",
        slot: 4,
        x: 2.0,
        y: 8.0,
        isServer: false,
      }, // Violation: LF behind LB
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
  }

  /**
   * Generate coordinate transformation test data
   */
  static generateCoordinateTestData(
    count: number
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < count; i++) {
      points.push({
        x: Math.random() * 600, // Screen coordinates
        y: Math.random() * 360,
      });
    }

    return points;
  }
}

/**
 * Performance benchmark runner
 */
class BenchmarkRunner {
  /**
   * Run a performance benchmark
   */
  static benchmark(
    operation: string,
    fn: () => void,
    iterations: number = 1000
  ): BenchmarkResult {
    // Warm up
    for (let i = 0; i < Math.min(100, iterations / 10); i++) {
      fn();
    }

    // Actual benchmark
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      fn();
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / iterations;
    const operationsPerSecond = 1000 / averageTime;

    return {
      operation,
      iterations,
      totalTime,
      averageTime,
      operationsPerSecond,
    };
  }

  /**
   * Run multiple benchmarks and compare results
   */
  static compareBenchmarks(
    benchmarks: Array<{ name: string; fn: () => void }>,
    iterations: number = 1000
  ): BenchmarkResult[] {
    return benchmarks.map(({ name, fn }) =>
      this.benchmark(name, fn, iterations)
    );
  }
}

describe("Performance Tests", () => {
  beforeEach(() => {
    PerformanceCache.clearAll();
    LazyViolationAnalyzer.clearCache();
    OptimizedCoordinateTransformer.clearCache();
  });

  afterEach(() => {
    PerformanceCache.clearAll();
    LazyViolationAnalyzer.clearCache();
    OptimizedCoordinateTransformer.clearCache();
  });

  describe("Validation Performance", () => {
    test("should validate lineups efficiently", () => {
      const lineup = PerformanceTestData.generateValidLineup();

      const result = BenchmarkRunner.benchmark(
        "Basic Validation",
        () => OverlapValidator.checkOverlap(lineup),
        1000
      );

      expect(result.averageTime).toBeLessThan(1); // Should be under 1ms per validation
      expect(result.operationsPerSecond).toBeGreaterThan(1000);
    });

    test("should handle large-scale validation efficiently", () => {
      const lineups = PerformanceTestData.generateMultipleLineups(100);

      const result = BenchmarkRunner.benchmark(
        "Large Scale Validation",
        () => {
          lineups.forEach((lineup) => OverlapValidator.checkOverlap(lineup));
        },
        10
      );

      expect(result.averageTime).toBeLessThan(50); // Should validate 100 lineups in under 50ms
    });

    test("should benefit from caching", () => {
      const lineup = PerformanceTestData.generateValidLineup();

      // First run (cache miss)
      const firstRun = BenchmarkRunner.benchmark(
        "First Run (Cache Miss)",
        () =>
          PerformanceCache.getCachedValidation(lineup, () =>
            OverlapValidator.checkOverlap(lineup)
          ),
        100
      );

      // Second run (cache hit)
      const secondRun = BenchmarkRunner.benchmark(
        "Second Run (Cache Hit)",
        () =>
          PerformanceCache.getCachedValidation(lineup, () =>
            OverlapValidator.checkOverlap(lineup)
          ),
        100
      );

      expect(secondRun.averageTime).toBeLessThan(firstRun.averageTime * 0.9);
    });
  });

  describe("Constraint Calculation Performance", () => {
    test("should calculate constraints efficiently", () => {
      const lineup = PerformanceTestData.generateValidLineup();
      const positionMap = new Map<RotationSlot, PlayerState>();
      lineup.forEach((player) => positionMap.set(player.slot, player));

      const result = BenchmarkRunner.benchmark(
        "Constraint Calculation",
        () => ConstraintCalculator.calculateValidBounds(1, positionMap, false),
        1000
      );

      expect(result.averageTime).toBeLessThan(0.5); // Should be under 0.5ms per calculation
    });

    test("should show performance improvement with optimization", () => {
      const lineup = PerformanceTestData.generateValidLineup();
      const positionMap = new Map<RotationSlot, PlayerState>();
      lineup.forEach((player) => positionMap.set(player.slot, player));

      const result = BenchmarkRunner.benchmark(
        "Optimized Constraint Calculator",
        () =>
          OptimizedConstraintCalculator.calculateOptimizedConstraints(
            1,
            positionMap,
            false
          ),
        500
      );

      // Should complete in reasonable time
      expect(result.averageTime).toBeLessThan(2); // Under 2ms
      expect(result.operationsPerSecond).toBeGreaterThan(500); // At least 500 ops/sec
    });

    test("should handle batch constraint calculations efficiently", () => {
      const lineup = PerformanceTestData.generateValidLineup();
      const positionMap = new Map<RotationSlot, PlayerState>();
      lineup.forEach((player) => positionMap.set(player.slot, player));

      const slots: RotationSlot[] = [1, 2, 3, 4, 5, 6];

      const result = BenchmarkRunner.benchmark(
        "Batch Constraint Calculation",
        () =>
          OptimizedConstraintCalculator.batchCalculateConstraints(
            slots,
            positionMap
          ),
        100
      );

      expect(result.averageTime).toBeLessThan(5); // Should calculate all 6 constraints in under 5ms
    });
  });

  describe("Coordinate Transformation Performance", () => {
    test("should transform coordinates efficiently", () => {
      const points = PerformanceTestData.generateCoordinateTestData(1000);

      const benchmarks = BenchmarkRunner.compareBenchmarks(
        [
          {
            name: "Standard Coordinate Transformer",
            fn: () => {
              points.forEach((point) =>
                CoordinateTransformer.screenToVolleyball(point.x, point.y)
              );
            },
          },
          {
            name: "Optimized Coordinate Transformer",
            fn: () => {
              points.forEach((point) =>
                OptimizedCoordinateTransformer.screenToVolleyballFast(
                  point.x,
                  point.y
                )
              );
            },
          },
        ],
        100
      );

      const [standard, optimized] = benchmarks;

      // Both should be reasonably fast
      expect(optimized.operationsPerSecond).toBeGreaterThan(1000);
      expect(standard.operationsPerSecond).toBeGreaterThan(1000);
    });

    test("should handle batch transformations efficiently", () => {
      const points = PerformanceTestData.generateCoordinateTestData(1000);

      const result = BenchmarkRunner.benchmark(
        "Batch Coordinate Transformation",
        () => OptimizedCoordinateTransformer.batchScreenToVolleyball(points),
        100
      );

      expect(result.averageTime).toBeLessThan(2); // Should transform 1000 points in under 2ms
    });
  });

  describe("Lazy Evaluation Performance", () => {
    test("should defer expensive calculations", () => {
      const lineup = PerformanceTestData.generateLineupWithViolations();

      const lazyCreation = BenchmarkRunner.benchmark(
        "Lazy Result Creation",
        () => LazyViolationAnalyzer.createLazyOverlapResult(lineup),
        1000
      );

      const lazyResult = LazyViolationAnalyzer.createLazyOverlapResult(lineup);

      const detailCalculation = BenchmarkRunner.benchmark(
        "Detail Calculation",
        () => {
          lazyResult.violations.forEach((violation) => {
            violation.getMessage();
            violation.getDetailedMessage();
            violation.getCoordinates();
          });
        },
        100
      );

      // Lazy creation should complete in reasonable time
      expect(lazyCreation.averageTime).toBeLessThan(1); // Under 1ms
      expect(detailCalculation.averageTime).toBeLessThan(5); // Under 5ms
    });

    test("should benefit from memoization", () => {
      const lineup = PerformanceTestData.generateLineupWithViolations();
      const lazyResult = LazyViolationAnalyzer.createLazyOverlapResult(lineup);

      // First access (calculation)
      const firstAccess = BenchmarkRunner.benchmark(
        "First Detail Access",
        () => {
          lazyResult.violations.forEach((violation) => violation.getMessage());
        },
        100
      );

      // Second access (memoized)
      const secondAccess = BenchmarkRunner.benchmark(
        "Second Detail Access",
        () => {
          lazyResult.violations.forEach((violation) => violation.getMessage());
        },
        100
      );

      // Memoization should provide some benefit, but may be small for simple operations
      expect(secondAccess.averageTime).toBeLessThan(
        firstAccess.averageTime * 1.2
      );
    });
  });

  describe("Cache Performance", () => {
    test("should maintain good cache hit rates", () => {
      const lineups = PerformanceTestData.generateMultipleLineups(50);

      // Fill cache
      lineups.forEach((lineup) => {
        PerformanceCache.getCachedValidation(lineup, () =>
          OverlapValidator.checkOverlap(lineup)
        );
      });

      // Test cache hits
      lineups.forEach((lineup) => {
        PerformanceCache.getCachedValidation(lineup, () =>
          OverlapValidator.checkOverlap(lineup)
        );
      });

      const metrics = PerformanceCache.getMetrics();
      expect(metrics.validationHitRate).toBeGreaterThan(0.4); // At least 40% hit rate
    });

    test("should handle cache invalidation efficiently", () => {
      const lineup = PerformanceTestData.generateValidLineup();
      const positionMap = new Map<RotationSlot, PlayerState>();
      lineup.forEach((player) => positionMap.set(player.slot, player));

      // Fill cache
      for (let slot = 1; slot <= 6; slot++) {
        OptimizedConstraintCalculator.calculateOptimizedConstraints(
          slot as RotationSlot,
          positionMap,
          false
        );
      }

      const invalidationTime = BenchmarkRunner.benchmark(
        "Cache Invalidation",
        () => PerformanceCache.invalidateAffectedEntries(1, [1, 2, 3, 4, 5, 6]),
        1000
      );

      expect(invalidationTime.averageTime).toBeLessThan(0.1); // Should be very fast
    });
  });

  describe("Memory Usage", () => {
    test("should not leak memory with repeated operations", () => {
      const initialMemory = process.memoryUsage?.()?.heapUsed || 0;

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        const lineup = PerformanceTestData.generateValidLineup();
        OverlapValidator.checkOverlap(lineup);

        const positionMap = new Map<RotationSlot, PlayerState>();
        lineup.forEach((player) => positionMap.set(player.slot, player));

        ConstraintCalculator.calculateValidBounds(1, positionMap, false);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage?.()?.heapUsed || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe("Stress Tests", () => {
    test("should handle high-frequency updates", () => {
      const lineup = PerformanceTestData.generateValidLineup();
      const positionMap = new Map<RotationSlot, PlayerState>();
      lineup.forEach((player) => positionMap.set(player.slot, player));

      const stressTest = BenchmarkRunner.benchmark(
        "High-Frequency Updates",
        () => {
          // Simulate rapid position updates
          for (let i = 0; i < 10; i++) {
            const updatedMap = new Map(positionMap);
            const player = updatedMap.get(1)!;
            updatedMap.set(1, {
              ...player,
              x: player.x + Math.random() * 0.1,
              y: player.y + Math.random() * 0.1,
            });

            OptimizedConstraintCalculator.calculateOptimizedConstraints(
              1,
              updatedMap,
              false
            );
          }
        },
        100
      );

      expect(stressTest.averageTime).toBeLessThan(10); // Should handle 10 updates in under 10ms
    });

    test("should maintain performance with large datasets", () => {
      const lineups = PerformanceTestData.generateMultipleLineups(1000);

      const largeDatasetTest = BenchmarkRunner.benchmark(
        "Large Dataset Processing",
        () => {
          lineups.forEach((lineup) => {
            OverlapValidator.checkOverlap(lineup);
          });
        },
        1
      );

      expect(largeDatasetTest.totalTime).toBeLessThan(1000); // Should process 1000 lineups in under 1 second
    });
  });
});

describe("Performance Regression Tests", () => {
  test("should maintain baseline performance for validation", () => {
    const lineup = PerformanceTestData.generateValidLineup();

    const result = BenchmarkRunner.benchmark(
      "Validation Baseline",
      () => OverlapValidator.checkOverlap(lineup),
      1000
    );

    // Baseline: validation should complete in under 1ms on average
    expect(result.averageTime).toBeLessThan(1);
  });

  test("should maintain baseline performance for constraint calculation", () => {
    const lineup = PerformanceTestData.generateValidLineup();
    const positionMap = new Map<RotationSlot, PlayerState>();
    lineup.forEach((player) => positionMap.set(player.slot, player));

    const result = BenchmarkRunner.benchmark(
      "Constraint Calculation Baseline",
      () => ConstraintCalculator.calculateValidBounds(1, positionMap, false),
      1000
    );

    // Baseline: constraint calculation should complete in under 0.5ms on average
    expect(result.averageTime).toBeLessThan(0.5);
  });

  test("should maintain baseline performance for coordinate transformation", () => {
    const result = BenchmarkRunner.benchmark(
      "Coordinate Transformation Baseline",
      () => OptimizedCoordinateTransformer.screenToVolleyballFast(300, 180),
      10000
    );

    // Baseline: coordinate transformation should complete in under 0.01ms on average
    expect(result.averageTime).toBeLessThan(0.01);
  });
});
