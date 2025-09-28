/**
 * Lazy evaluation system for detailed violation information generation
 * Only calculates detailed violation data when explicitly requested
 */

import type { PlayerState, RotationSlot } from "../types/PlayerState";
import type { OverlapResult, Violation } from "../types/ValidationResult";
import { OverlapValidator } from "./OverlapValidator";
import { PerformanceCache } from "../utils/PerformanceCache";

/**
 * Lazy violation with deferred detail calculation
 */
interface LazyViolation extends Omit<Violation, "message"> {
  getMessage: () => string;
  getDetailedMessage: () => string;
  getCoordinates: () =>
    | { [slot: number]: { x: number; y: number } }
    | undefined;
  getSuggestedFix: () => string | undefined;
  getAffectedPlayers: () => PlayerState[];
}

/**
 * Lazy overlap result with deferred calculations
 */
interface LazyOverlapResult {
  isLegal: boolean;
  violations: LazyViolation[];
  getViolationCount: () => number;
  getSeverity: () => "none" | "minor" | "major" | "critical";
  getUserFriendlyMessages: () => string[];
  getViolationSummary: () => {
    totalViolations: number;
    violationTypes: Record<string, number>;
    affectedSlots: RotationSlot[];
    severity: "none" | "minor" | "major" | "critical";
  };
}

/**
 * Violation detail calculation functions
 */
interface ViolationDetailCalculators {
  message: () => string;
  detailedMessage: () => string;
  coordinates: () => { [slot: number]: { x: number; y: number } } | undefined;
  suggestedFix: () => string | undefined;
  affectedPlayers: () => PlayerState[];
}

/**
 * Lazy evaluation system for violation analysis
 */
export class LazyViolationAnalyzer {
  private static detailCache = new Map<string, any>();

  /**
   * Create a lazy overlap result that defers expensive calculations
   * @param lineup - Array of players to analyze
   * @returns Lazy overlap result
   */
  static createLazyOverlapResult(lineup: PlayerState[]): LazyOverlapResult {
    // Perform basic validation immediately (this is fast)
    const basicResult = PerformanceCache.getCachedValidation(lineup, () =>
      OverlapValidator.checkOverlap(lineup)
    );

    // Create lazy violations
    const lazyViolations = basicResult.violations.map((violation) =>
      this.createLazyViolation(violation, lineup)
    );

    return {
      isLegal: basicResult.isLegal,
      violations: lazyViolations,

      getViolationCount: () => lazyViolations.length,

      getSeverity: this.memoize(
        `severity:${this.getLineupHash(lineup)}`,
        () => {
          const summary = OverlapValidator.getViolationSummary(
            basicResult.violations
          );
          return summary.severity;
        }
      ),

      getUserFriendlyMessages: this.memoize(
        `messages:${this.getLineupHash(lineup)}`,
        () => {
          return OverlapValidator.generateUserFriendlyMessages(
            basicResult.violations
          );
        }
      ),

      getViolationSummary: this.memoize(
        `summary:${this.getLineupHash(lineup)}`,
        () => {
          return OverlapValidator.getViolationSummary(basicResult.violations);
        }
      ),
    };
  }

  /**
   * Create a lazy violation with deferred detail calculations
   * @param violation - Base violation
   * @param lineup - Full lineup for context
   * @returns Lazy violation
   */
  private static createLazyViolation(
    violation: Violation,
    lineup: PlayerState[]
  ): LazyViolation {
    const violationId = this.getViolationId(violation, lineup);
    const positionMap = new Map<RotationSlot, PlayerState>();
    lineup.forEach((player) => positionMap.set(player.slot, player));

    const calculators = this.createDetailCalculators(violation, positionMap);

    return {
      code: violation.code,
      slots: violation.slots,

      getMessage: this.memoize(`message:${violationId}`, calculators.message),

      getDetailedMessage: this.memoize(
        `detailed:${violationId}`,
        calculators.detailedMessage
      ),

      getCoordinates: this.memoize(
        `coords:${violationId}`,
        calculators.coordinates
      ),

      getSuggestedFix: this.memoize(
        `fix:${violationId}`,
        calculators.suggestedFix
      ),

      getAffectedPlayers: this.memoize(
        `players:${violationId}`,
        calculators.affectedPlayers
      ),
    };
  }

  /**
   * Create detail calculation functions for a violation
   * @param violation - Base violation
   * @param positions - Position map
   * @returns Detail calculators
   */
  private static createDetailCalculators(
    violation: Violation,
    positions: Map<RotationSlot, PlayerState>
  ): ViolationDetailCalculators {
    return {
      message: () => {
        return OverlapValidator.explainViolation(violation, positions);
      },

      detailedMessage: () => {
        const enhanced = OverlapValidator.generateDetailedViolations(
          Array.from(positions.values())
        ).find(
          (v) =>
            v.code === violation.code &&
            this.arraysEqual(v.slots, violation.slots)
        );
        return enhanced?.message || violation.message;
      },

      coordinates: () => {
        return (
          violation.coordinates ||
          this.calculateCoordinates(violation, positions)
        );
      },

      suggestedFix: () => {
        return this.generateSuggestedFix(violation, positions);
      },

      affectedPlayers: () => {
        return violation.slots
          .map((slot) => positions.get(slot))
          .filter(Boolean) as PlayerState[];
      },
    };
  }

  /**
   * Generate suggested fix for a violation
   * @param violation - The violation to fix
   * @param positions - Position map
   * @returns Suggested fix string
   */
  private static generateSuggestedFix(
    violation: Violation,
    positions: Map<RotationSlot, PlayerState>
  ): string | undefined {
    switch (violation.code) {
      case "ROW_ORDER":
        return this.generateRowOrderFix(violation, positions);
      case "FRONT_BACK":
        return this.generateFrontBackFix(violation, positions);
      case "MULTIPLE_SERVERS":
        return "Designate only one player as the server.";
      case "INVALID_LINEUP":
        return "Ensure exactly 6 players with unique rotation slots (1-6).";
      default:
        return undefined;
    }
  }

  /**
   * Generate fix suggestion for row order violations
   * @param violation - Row order violation
   * @param positions - Position map
   * @returns Fix suggestion
   */
  private static generateRowOrderFix(
    violation: Violation,
    positions: Map<RotationSlot, PlayerState>
  ): string {
    if (violation.slots.length !== 2)
      return "Adjust player positions to maintain proper row order.";

    const [slot1, slot2] = violation.slots;
    const player1 = positions.get(slot1);
    const player2 = positions.get(slot2);

    if (!player1 || !player2)
      return "Adjust player positions to maintain proper row order.";

    const slotNames: Record<RotationSlot, string> = {
      1: "Right Back",
      2: "Right Front",
      3: "Middle Front",
      4: "Left Front",
      5: "Left Back",
      6: "Middle Back",
    };

    if (player1.x > player2.x) {
      return `Move ${slotNames[slot1]} (${player1.displayName}) to the left of ${slotNames[slot2]} (${player2.displayName}).`;
    } else {
      return `Increase separation between ${slotNames[slot1]} and ${slotNames[slot2]} to at least 3cm.`;
    }
  }

  /**
   * Generate fix suggestion for front/back violations
   * @param violation - Front/back violation
   * @param positions - Position map
   * @returns Fix suggestion
   */
  private static generateFrontBackFix(
    violation: Violation,
    positions: Map<RotationSlot, PlayerState>
  ): string {
    if (violation.slots.length !== 2)
      return "Adjust player positions to maintain proper front/back order.";

    const [frontSlot, backSlot] = violation.slots;
    const frontPlayer = positions.get(frontSlot);
    const backPlayer = positions.get(backSlot);

    if (!frontPlayer || !backPlayer)
      return "Adjust player positions to maintain proper front/back order.";

    const slotNames: Record<RotationSlot, string> = {
      1: "Right Back",
      2: "Right Front",
      3: "Middle Front",
      4: "Left Front",
      5: "Left Back",
      6: "Middle Back",
    };

    if (frontPlayer.y >= backPlayer.y) {
      return `Move ${slotNames[frontSlot]} (${frontPlayer.displayName}) closer to the net than ${slotNames[backSlot]} (${backPlayer.displayName}).`;
    } else {
      return `Increase front/back separation between ${slotNames[frontSlot]} and ${slotNames[backSlot]} to at least 3cm.`;
    }
  }

  /**
   * Calculate coordinates for a violation if not already present
   * @param violation - The violation
   * @param positions - Position map
   * @returns Coordinates object
   */
  private static calculateCoordinates(
    violation: Violation,
    positions: Map<RotationSlot, PlayerState>
  ): { [slot: number]: { x: number; y: number } } {
    const coordinates: { [slot: number]: { x: number; y: number } } = {};

    for (const slot of violation.slots) {
      const player = positions.get(slot);
      if (player) {
        coordinates[slot] = { x: player.x, y: player.y };
      }
    }

    return coordinates;
  }

  /**
   * Create a memoized function that caches its result
   * @param key - Cache key
   * @param fn - Function to memoize
   * @returns Memoized function
   */
  private static memoize<T>(key: string, fn: () => T): () => T {
    return () => {
      if (this.detailCache.has(key)) {
        return this.detailCache.get(key);
      }

      const result = fn();
      this.detailCache.set(key, result);
      return result;
    };
  }

  /**
   * Generate a unique ID for a violation
   * @param violation - The violation
   * @param lineup - The lineup
   * @returns Unique violation ID
   */
  private static getViolationId(
    violation: Violation,
    lineup: PlayerState[]
  ): string {
    const lineupHash = this.getLineupHash(lineup);
    const slotsStr = violation.slots.sort().join(",");
    return `${violation.code}:${slotsStr}:${lineupHash}`;
  }

  /**
   * Generate a hash for a lineup
   * @param lineup - Array of players
   * @returns Lineup hash
   */
  private static getLineupHash(lineup: PlayerState[]): string {
    const sortedLineup = [...lineup].sort((a, b) => a.slot - b.slot);
    const lineupString = sortedLineup
      .map((p) => `${p.slot}:${p.x.toFixed(3)},${p.y.toFixed(3)},${p.isServer}`)
      .join("|");

    return this.simpleHash(lineupString).toString();
  }

  /**
   * Simple hash function
   * @param str - String to hash
   * @returns Hash value
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Check if two arrays are equal
   * @param arr1 - First array
   * @param arr2 - Second array
   * @returns True if arrays are equal
   */
  private static arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return sorted1.every((val, index) => val === sorted2[index]);
  }

  /**
   * Clear the detail cache
   */
  static clearCache(): void {
    this.detailCache.clear();
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  static getCacheStats(): {
    detailCacheSize: number;
  } {
    return {
      detailCacheSize: this.detailCache.size,
    };
  }

  /**
   * Preload common violation details into cache
   * @param commonViolations - Array of common violations with lineups
   */
  static preloadCommonDetails(
    commonViolations: Array<{ violation: Violation; lineup: PlayerState[] }>
  ): void {
    for (const { violation, lineup } of commonViolations) {
      const lazyViolation = this.createLazyViolation(violation, lineup);

      // Trigger calculation of all details to cache them
      lazyViolation.getMessage();
      lazyViolation.getDetailedMessage();
      lazyViolation.getCoordinates();
      lazyViolation.getSuggestedFix();
      lazyViolation.getAffectedPlayers();
    }
  }
}
