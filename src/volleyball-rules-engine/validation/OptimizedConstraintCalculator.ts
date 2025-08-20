/**
 * Optimized constraint calculator with caching and incremental updates
 * Provides high-performance constraint calculation for real-time drag operations
 */

import type { PlayerState, RotationSlot } from "../types/PlayerState";
import type { PositionBounds } from "../types/ValidationResult";
import { ConstraintCalculator } from "./ConstraintCalculator";
import { PerformanceCache } from "../utils/PerformanceCache";
import { NeighborCalculator } from "../utils/NeighborCalculator";
import { ToleranceUtils } from "../utils/ToleranceUtils";
import { COORDINATE_SYSTEM } from "../types/CoordinateSystem";

/**
 * Incremental constraint update information
 */
interface ConstraintUpdate {
  slot: RotationSlot;
  oldPosition: { x: number; y: number };
  newPosition: { x: number; y: number };
  affectedSlots: RotationSlot[];
}

/**
 * Constraint calculation result with performance metadata
 */
interface OptimizedConstraintResult extends PositionBounds {
  calculationTime: number;
  cacheHit: boolean;
  affectedBySlots: RotationSlot[];
}

/**
 * Optimized constraint calculator with caching and incremental updates
 */
export class OptimizedConstraintCalculator {
  private static lastPositions = new Map<
    RotationSlot,
    { x: number; y: number }
  >();
  private static constraintDependencies = new Map<
    RotationSlot,
    Set<RotationSlot>
  >();

  // Performance tracking
  private static performanceMetrics = {
    totalCalculations: 0,
    cacheHits: 0,
    incrementalUpdates: 0,
    fullRecalculations: 0,
    averageCalculationTime: 0,
  };

  /**
   * Calculate constraints with caching and performance optimization
   * @param draggedSlot - The slot being dragged
   * @param currentPositions - Current positions of all players
   * @param isServer - Whether the dragged player is the server
   * @returns Optimized constraint result
   */
  static calculateOptimizedConstraints(
    draggedSlot: RotationSlot,
    currentPositions: Map<RotationSlot, PlayerState>,
    isServer: boolean = false
  ): OptimizedConstraintResult {
    const startTime = performance.now();

    // Try to get from cache first
    const cachedResult = PerformanceCache.getCachedConstraints(
      draggedSlot,
      currentPositions,
      isServer,
      () =>
        this.calculateConstraintsInternal(
          draggedSlot,
          currentPositions,
          isServer
        )
    );

    const calculationTime = performance.now() - startTime;
    const cacheHit = calculationTime < 0.1; // Assume cache hit if very fast

    // Update performance metrics
    this.updatePerformanceMetrics(calculationTime, cacheHit);

    // Get affected slots for metadata
    const affectedBySlots = this.getConstraintDependencies(draggedSlot);

    return {
      ...cachedResult,
      calculationTime,
      cacheHit,
      affectedBySlots,
    };
  }

  /**
   * Perform incremental constraint updates when a single player moves
   * @param update - Information about the position change
   * @param allPositions - All current player positions
   * @returns Map of updated constraints for affected slots
   */
  static performIncrementalUpdate(
    update: ConstraintUpdate,
    allPositions: Map<RotationSlot, PlayerState>
  ): Map<RotationSlot, OptimizedConstraintResult> {
    const results = new Map<RotationSlot, OptimizedConstraintResult>();

    // Invalidate cache for affected slots
    PerformanceCache.invalidateAffectedEntries(
      update.slot,
      Array.from(allPositions.keys())
    );

    // Recalculate constraints for affected slots only
    for (const affectedSlot of update.affectedSlots) {
      const player = allPositions.get(affectedSlot);
      if (player) {
        const result = this.calculateOptimizedConstraints(
          affectedSlot,
          allPositions,
          player.isServer
        );
        results.set(affectedSlot, result);
      }
    }

    // Update last known positions
    this.lastPositions.set(update.slot, update.newPosition);
    this.performanceMetrics.incrementalUpdates++;

    return results;
  }

  /**
   * Batch calculate constraints for multiple slots
   * @param slots - Array of slots to calculate constraints for
   * @param positions - Current positions of all players
   * @returns Map of constraint results
   */
  static batchCalculateConstraints(
    slots: RotationSlot[],
    positions: Map<RotationSlot, PlayerState>
  ): Map<RotationSlot, OptimizedConstraintResult> {
    const results = new Map<RotationSlot, OptimizedConstraintResult>();

    // Sort slots by dependency order to maximize cache efficiency
    const sortedSlots = this.sortSlotsByDependencies(slots);

    for (const slot of sortedSlots) {
      const player = positions.get(slot);
      if (player) {
        const result = this.calculateOptimizedConstraints(
          slot,
          positions,
          player.isServer
        );
        results.set(slot, result);
      }
    }

    return results;
  }

  /**
   * Check if constraints need recalculation based on position changes
   * @param currentPositions - Current player positions
   * @returns Array of slots that need constraint recalculation
   */
  static getSlotsThatNeedRecalculation(
    currentPositions: Map<RotationSlot, PlayerState>
  ): RotationSlot[] {
    const slotsToRecalculate: RotationSlot[] = [];

    for (const [slot, player] of currentPositions) {
      const lastPosition = this.lastPositions.get(slot);

      if (
        !lastPosition ||
        !ToleranceUtils.isEqual(lastPosition.x, player.x) ||
        !ToleranceUtils.isEqual(lastPosition.y, player.y)
      ) {
        // This slot moved, so it and its dependents need recalculation
        slotsToRecalculate.push(slot);

        // Add dependent slots
        const dependents = this.getSlotsDependentOn(slot);
        slotsToRecalculate.push(...dependents);
      }
    }

    return [...new Set(slotsToRecalculate)]; // Remove duplicates
  }

  /**
   * Optimize constraint calculation order based on dependencies
   * @param slots - Slots to calculate constraints for
   * @returns Optimally ordered slots
   */
  static optimizeCalculationOrder(slots: RotationSlot[]): RotationSlot[] {
    // Create dependency graph
    const dependencies = new Map<RotationSlot, Set<RotationSlot>>();
    const inDegree = new Map<RotationSlot, number>();

    // Initialize
    for (const slot of slots) {
      dependencies.set(slot, this.getConstraintDependencies(slot));
      inDegree.set(slot, 0);
    }

    // Calculate in-degrees
    for (const [slot, deps] of dependencies) {
      for (const dep of deps) {
        if (slots.includes(dep)) {
          inDegree.set(slot, (inDegree.get(slot) || 0) + 1);
        }
      }
    }

    // Topological sort
    const result: RotationSlot[] = [];
    const queue: RotationSlot[] = [];

    // Start with slots that have no dependencies
    for (const [slot, degree] of inDegree) {
      if (degree === 0) {
        queue.push(slot);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      // Update in-degrees of dependent slots
      for (const slot of slots) {
        const deps = dependencies.get(slot) || new Set();
        if (deps.has(current)) {
          const newDegree = (inDegree.get(slot) || 0) - 1;
          inDegree.set(slot, newDegree);
          if (newDegree === 0) {
            queue.push(slot);
          }
        }
      }
    }

    return result;
  }

  /**
   * Get performance metrics for constraint calculations
   * @returns Performance metrics object
   */
  static getPerformanceMetrics(): typeof OptimizedConstraintCalculator.performanceMetrics & {
    cacheMetrics: ReturnType<typeof PerformanceCache.getMetrics>;
  } {
    return {
      ...this.performanceMetrics,
      cacheMetrics: PerformanceCache.getMetrics(),
    };
  }

  /**
   * Reset performance tracking
   */
  static resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      totalCalculations: 0,
      cacheHits: 0,
      incrementalUpdates: 0,
      fullRecalculations: 0,
      averageCalculationTime: 0,
    };
    this.lastPositions.clear();
  }

  /**
   * Internal constraint calculation (delegates to base calculator)
   * @param slot - Rotation slot
   * @param positions - Player positions
   * @param isServer - Server status
   * @returns Position bounds
   */
  private static calculateConstraintsInternal(
    slot: RotationSlot,
    positions: Map<RotationSlot, PlayerState>,
    isServer: boolean
  ): PositionBounds {
    return ConstraintCalculator.calculateValidBounds(slot, positions, isServer);
  }

  /**
   * Get slots that this slot's constraints depend on
   * @param slot - The slot to get dependencies for
   * @returns Set of dependent slots
   */
  private static getConstraintDependencies(slot: RotationSlot): RotationSlot[] {
    if (this.constraintDependencies.has(slot)) {
      return Array.from(this.constraintDependencies.get(slot)!);
    }

    const dependencies = new Set<RotationSlot>();
    const neighbors = NeighborCalculator.getAllNeighbors(slot);

    // Add direct neighbors
    if (neighbors.left) dependencies.add(neighbors.left);
    if (neighbors.right) dependencies.add(neighbors.right);
    if (neighbors.counterpart) dependencies.add(neighbors.counterpart);

    this.constraintDependencies.set(slot, dependencies);
    return Array.from(dependencies);
  }

  /**
   * Get slots that depend on this slot for their constraints
   * @param slot - The slot to find dependents for
   * @returns Array of dependent slots
   */
  private static getSlotsDependentOn(slot: RotationSlot): RotationSlot[] {
    const dependents: RotationSlot[] = [];

    for (let s = 1; s <= 6; s++) {
      const testSlot = s as RotationSlot;
      const dependencies = this.getConstraintDependencies(testSlot);
      if (dependencies.includes(slot)) {
        dependents.push(testSlot);
      }
    }

    return dependents;
  }

  /**
   * Sort slots by their dependency relationships
   * @param slots - Slots to sort
   * @returns Sorted slots
   */
  private static sortSlotsByDependencies(
    slots: RotationSlot[]
  ): RotationSlot[] {
    return slots.sort((a, b) => {
      const aDeps = this.getConstraintDependencies(a).length;
      const bDeps = this.getConstraintDependencies(b).length;

      // Slots with fewer dependencies first
      if (aDeps !== bDeps) {
        return aDeps - bDeps;
      }

      // Then by slot number
      return a - b;
    });
  }

  /**
   * Update performance metrics
   * @param calculationTime - Time taken for calculation
   * @param cacheHit - Whether this was a cache hit
   */
  private static updatePerformanceMetrics(
    calculationTime: number,
    cacheHit: boolean
  ): void {
    this.performanceMetrics.totalCalculations++;

    if (cacheHit) {
      this.performanceMetrics.cacheHits++;
    } else {
      this.performanceMetrics.fullRecalculations++;
    }

    // Update average calculation time
    const total = this.performanceMetrics.totalCalculations;
    const currentAvg = this.performanceMetrics.averageCalculationTime;
    this.performanceMetrics.averageCalculationTime =
      (currentAvg * (total - 1) + calculationTime) / total;
  }

  /**
   * Precompute constraint dependencies for all slots
   */
  static precomputeDependencies(): void {
    for (let slot = 1; slot <= 6; slot++) {
      this.getConstraintDependencies(slot as RotationSlot);
    }
  }

  /**
   * Warm up the cache with common constraint calculations
   * @param commonFormations - Array of common player formations
   */
  static warmUpCache(commonFormations: PlayerState[][]): void {
    for (const formation of commonFormations) {
      const positionMap = new Map<RotationSlot, PlayerState>();
      formation.forEach((player) => positionMap.set(player.slot, player));

      // Calculate constraints for all slots in this formation
      for (const player of formation) {
        this.calculateOptimizedConstraints(
          player.slot,
          positionMap,
          player.isServer
        );
      }
    }
  }
}
