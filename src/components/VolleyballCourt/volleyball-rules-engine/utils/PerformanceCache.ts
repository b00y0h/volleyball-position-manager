/**
 * Performance cache system for constraint calculations and validation results
 * Provides memoization with cache invalidation on position changes
 */

import type { PlayerState, RotationSlot } from "../types/PlayerState";
import type { PositionBounds, OverlapResult } from "../types/ValidationResult";

/**
 * Cache key for constraint calculations
 */
interface ConstraintCacheKey {
  slot: RotationSlot;
  relevantPositions: string; // Serialized positions of relevant players
  isServer: boolean;
}

/**
 * Cache key for validation results
 */
interface ValidationCacheKey {
  lineupHash: string; // Hash of all player positions and server status
}

/**
 * Cache entry with timestamp for TTL
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

/**
 * Performance cache for constraint calculations and validation results
 */
export class PerformanceCache {
  private static constraintCache = new Map<
    string,
    CacheEntry<PositionBounds>
  >();
  private static validationCache = new Map<string, CacheEntry<OverlapResult>>();
  private static neighborCache = new Map<RotationSlot, RotationSlot[]>();

  // Cache configuration
  private static readonly MAX_CACHE_SIZE = 1000;
  private static readonly CACHE_TTL_MS = 30000; // 30 seconds
  private static readonly CLEANUP_INTERVAL_MS = 60000; // 1 minute

  // Performance metrics
  private static metrics = {
    constraintHits: 0,
    constraintMisses: 0,
    validationHits: 0,
    validationMisses: 0,
    cacheCleanups: 0,
  };

  static {
    // Start periodic cache cleanup
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanupExpiredEntries(), this.CLEANUP_INTERVAL_MS);
    }
  }

  /**
   * Get cached constraint bounds or calculate new ones
   * @param slot - Rotation slot
   * @param positions - Current positions of all players
   * @param isServer - Whether the player is the server
   * @param calculator - Function to calculate constraints if not cached
   * @returns Cached or calculated position bounds
   */
  static getCachedConstraints(
    slot: RotationSlot,
    positions: Map<RotationSlot, PlayerState>,
    isServer: boolean,
    calculator: () => PositionBounds
  ): PositionBounds {
    const cacheKey = this.generateConstraintCacheKey(slot, positions, isServer);
    const cached = this.constraintCache.get(cacheKey);

    if (cached && this.isEntryValid(cached)) {
      cached.accessCount++;
      this.metrics.constraintHits++;
      return cached.value;
    }

    // Calculate new constraints
    const constraints = calculator();

    // Store in cache
    this.constraintCache.set(cacheKey, {
      value: constraints,
      timestamp: Date.now(),
      accessCount: 1,
    });

    this.metrics.constraintMisses++;
    this.enforceMaxCacheSize(this.constraintCache);

    return constraints;
  }

  /**
   * Get cached validation result or calculate new one
   * @param lineup - Array of players
   * @param validator - Function to validate if not cached
   * @returns Cached or calculated validation result
   */
  static getCachedValidation(
    lineup: PlayerState[],
    validator: () => OverlapResult
  ): OverlapResult {
    const cacheKey = this.generateValidationCacheKey(lineup);
    const cached = this.validationCache.get(cacheKey);

    if (cached && this.isEntryValid(cached)) {
      cached.accessCount++;
      this.metrics.validationHits++;
      return cached.value;
    }

    // Calculate new validation
    const result = validator();

    // Store in cache
    this.validationCache.set(cacheKey, {
      value: result,
      timestamp: Date.now(),
      accessCount: 1,
    });

    this.metrics.validationMisses++;
    this.enforceMaxCacheSize(this.validationCache);

    return result;
  }

  /**
   * Get cached neighbor relationships for a slot
   * @param slot - Rotation slot
   * @param calculator - Function to calculate neighbors if not cached
   * @returns Array of relevant neighbor slots
   */
  static getCachedNeighbors(
    slot: RotationSlot,
    calculator: () => RotationSlot[]
  ): RotationSlot[] {
    if (this.neighborCache.has(slot)) {
      return this.neighborCache.get(slot)!;
    }

    const neighbors = calculator();
    this.neighborCache.set(slot, neighbors);
    return neighbors;
  }

  /**
   * Invalidate cache entries affected by a position change
   * @param changedSlot - The slot that changed position
   * @param allSlots - All slots in the lineup
   */
  static invalidateAffectedEntries(
    changedSlot: RotationSlot,
    allSlots: RotationSlot[]
  ): void {
    // Get slots that are affected by this change
    const affectedSlots = this.getAffectedSlots(changedSlot);

    // Remove constraint cache entries for affected slots
    const constraintKeysToRemove: string[] = [];
    for (const [key] of this.constraintCache) {
      const keySlot = this.extractSlotFromConstraintKey(key);
      if (affectedSlots.includes(keySlot)) {
        constraintKeysToRemove.push(key);
      }
    }

    constraintKeysToRemove.forEach((key) => this.constraintCache.delete(key));

    // Clear all validation cache entries since any position change affects validation
    this.validationCache.clear();
  }

  /**
   * Clear all cache entries
   */
  static clearAll(): void {
    this.constraintCache.clear();
    this.validationCache.clear();
    this.neighborCache.clear();
    this.resetMetrics();
  }

  /**
   * Get cache performance metrics
   * @returns Object containing cache hit/miss statistics
   */
  static getMetrics(): {
    constraintHitRate: number;
    validationHitRate: number;
    totalConstraintRequests: number;
    totalValidationRequests: number;
    cacheSize: {
      constraints: number;
      validations: number;
      neighbors: number;
    };
    metrics: typeof PerformanceCache.metrics;
  } {
    const totalConstraintRequests =
      this.metrics.constraintHits + this.metrics.constraintMisses;
    const totalValidationRequests =
      this.metrics.validationHits + this.metrics.validationMisses;

    return {
      constraintHitRate:
        totalConstraintRequests > 0
          ? this.metrics.constraintHits / totalConstraintRequests
          : 0,
      validationHitRate:
        totalValidationRequests > 0
          ? this.metrics.validationHits / totalValidationRequests
          : 0,
      totalConstraintRequests,
      totalValidationRequests,
      cacheSize: {
        constraints: this.constraintCache.size,
        validations: this.validationCache.size,
        neighbors: this.neighborCache.size,
      },
      metrics: { ...this.metrics },
    };
  }

  /**
   * Generate cache key for constraint calculations
   * @param slot - Rotation slot
   * @param positions - Current positions
   * @param isServer - Server status
   * @returns Cache key string
   */
  private static generateConstraintCacheKey(
    slot: RotationSlot,
    positions: Map<RotationSlot, PlayerState>,
    isServer: boolean
  ): string {
    // Get only positions that affect this slot's constraints
    const relevantSlots = this.getRelevantSlots(slot);
    const relevantPositions = relevantSlots
      .map((s) => {
        const player = positions.get(s);
        return player
          ? `${s}:${player.x.toFixed(3)},${player.y.toFixed(3)},${
              player.isServer
            }`
          : "";
      })
      .filter(Boolean)
      .join("|");

    return `${slot}:${isServer}:${relevantPositions}`;
  }

  /**
   * Generate cache key for validation results
   * @param lineup - Array of players
   * @returns Cache key string
   */
  private static generateValidationCacheKey(lineup: PlayerState[]): string {
    // Sort by slot to ensure consistent key generation
    const sortedLineup = [...lineup].sort((a, b) => a.slot - b.slot);

    const lineupString = sortedLineup
      .map((p) => `${p.slot}:${p.x.toFixed(3)},${p.y.toFixed(3)},${p.isServer}`)
      .join("|");

    // Use a simple hash function for shorter keys
    return this.simpleHash(lineupString).toString();
  }

  /**
   * Get slots that are relevant for constraint calculation of a given slot
   * @param slot - The slot to get relevant slots for
   * @returns Array of relevant slot numbers
   */
  private static getRelevantSlots(slot: RotationSlot): RotationSlot[] {
    // Use cached neighbors if available
    return this.getCachedNeighbors(slot, () => {
      const relevant: RotationSlot[] = [slot];

      // Add neighbors based on volleyball rules
      if (slot === 1) {
        // RB
        relevant.push(2, 6); // RF (right neighbor), MB (left neighbor)
      } else if (slot === 2) {
        // RF
        relevant.push(1, 3); // RB (counterpart), MF (left neighbor)
      } else if (slot === 3) {
        // MF
        relevant.push(2, 4, 6); // RF (right neighbor), LF (left neighbor), MB (counterpart)
      } else if (slot === 4) {
        // LF
        relevant.push(3, 5); // MF (right neighbor), LB (counterpart)
      } else if (slot === 5) {
        // LB
        relevant.push(4, 6); // LF (counterpart), MB (right neighbor)
      } else if (slot === 6) {
        // MB
        relevant.push(1, 3, 5); // RB (right neighbor), MF (counterpart), LB (left neighbor)
      }

      return relevant;
    });
  }

  /**
   * Get slots affected by a position change
   * @param changedSlot - The slot that changed
   * @returns Array of affected slots
   */
  private static getAffectedSlots(changedSlot: RotationSlot): RotationSlot[] {
    // When a slot changes, it affects itself and its neighbors
    const affected = new Set<RotationSlot>([changedSlot]);

    // Add all slots that consider this slot as relevant
    for (let slot = 1; slot <= 6; slot++) {
      const relevantSlots = this.getRelevantSlots(slot as RotationSlot);
      if (relevantSlots.includes(changedSlot)) {
        affected.add(slot as RotationSlot);
      }
    }

    return Array.from(affected);
  }

  /**
   * Extract slot number from constraint cache key
   * @param key - Cache key
   * @returns Slot number
   */
  private static extractSlotFromConstraintKey(key: string): RotationSlot {
    const slotStr = key.split(":")[0];
    return parseInt(slotStr) as RotationSlot;
  }

  /**
   * Check if cache entry is still valid (not expired)
   * @param entry - Cache entry to check
   * @returns True if entry is valid
   */
  private static isEntryValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < this.CACHE_TTL_MS;
  }

  /**
   * Enforce maximum cache size by removing least recently used entries
   * @param cache - Cache to enforce size limit on
   */
  private static enforceMaxCacheSize<T>(
    cache: Map<string, CacheEntry<T>>
  ): void {
    if (cache.size <= this.MAX_CACHE_SIZE) {
      return;
    }

    // Convert to array and sort by access count and timestamp
    const entries = Array.from(cache.entries()).sort((a, b) => {
      const [, entryA] = a;
      const [, entryB] = b;

      // First sort by access count (ascending)
      if (entryA.accessCount !== entryB.accessCount) {
        return entryA.accessCount - entryB.accessCount;
      }

      // Then by timestamp (ascending - older first)
      return entryA.timestamp - entryB.timestamp;
    });

    // Remove oldest/least accessed entries
    const entriesToRemove = entries.slice(0, cache.size - this.MAX_CACHE_SIZE);
    entriesToRemove.forEach(([key]) => cache.delete(key));
  }

  /**
   * Clean up expired cache entries
   */
  private static cleanupExpiredEntries(): void {
    const now = Date.now();
    let removedCount = 0;

    // Clean constraint cache
    for (const [key, entry] of this.constraintCache) {
      if (now - entry.timestamp >= this.CACHE_TTL_MS) {
        this.constraintCache.delete(key);
        removedCount++;
      }
    }

    // Clean validation cache
    for (const [key, entry] of this.validationCache) {
      if (now - entry.timestamp >= this.CACHE_TTL_MS) {
        this.validationCache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.metrics.cacheCleanups++;
    }
  }

  /**
   * Simple hash function for generating cache keys
   * @param str - String to hash
   * @returns Hash value
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Reset performance metrics
   */
  private static resetMetrics(): void {
    this.metrics = {
      constraintHits: 0,
      constraintMisses: 0,
      validationHits: 0,
      validationMisses: 0,
      cacheCleanups: 0,
    };
  }
}
