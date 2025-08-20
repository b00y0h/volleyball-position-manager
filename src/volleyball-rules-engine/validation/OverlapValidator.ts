/**
 * Core overlap validation engine for volleyball positioning rules
 *
 * Validates player positioning according to FIVB/NFHS/NCAA overlap rules:
 * - Front row order: LF < MF < RF (left to right)
 * - Back row order: LB < MB < RB (left to right)
 * - Front/back order: Front players must be in front of back counterparts
 * - Server exemption: Server is exempt from overlap rules
 */

import type { PlayerState, RotationSlot } from "../types/PlayerState";
import type { OverlapResult, Violation } from "../types/ValidationResult";
import { ToleranceUtils } from "../utils/ToleranceUtils";
import { NeighborCalculator } from "../utils/NeighborCalculator";

/**
 * Core overlap validation engine
 */
export class OverlapValidator {
  /**
   * Main validation function that checks all overlap rules
   * @param lineup - Array of 6 players with their positions
   * @returns Validation result with any violations found
   */
  static checkOverlap(lineup: PlayerState[]): OverlapResult {
    // Input validation
    const inputErrors = this.validateInput(lineup);
    if (inputErrors.length > 0) {
      return {
        isLegal: false,
        violations: inputErrors,
      };
    }

    // Build position map by slot for easier access
    const positionMap = new Map<RotationSlot, PlayerState>();
    lineup.forEach((player) => {
      positionMap.set(player.slot, player);
    });

    // Collect all violations
    const violations: Violation[] = [];

    // Check front row order (LF < MF < RF)
    violations.push(...this.validateFrontRowOrder(positionMap));

    // Check back row order (LB < MB < RB)
    violations.push(...this.validateBackRowOrder(positionMap));

    // Check front/back relationships
    violations.push(...this.validateFrontBackOrder(positionMap));

    return {
      isLegal: violations.length === 0,
      violations,
    };
  }

  /**
   * Validate input lineup for basic requirements
   * @param lineup - Array of players to validate
   * @returns Array of input validation violations
   */
  private static validateInput(lineup: PlayerState[]): Violation[] {
    const violations: Violation[] = [];

    // Check player count
    if (lineup.length !== 6) {
      violations.push({
        code: "INVALID_LINEUP",
        slots: [],
        message: `Invalid lineup: expected 6 players, got ${lineup.length}`,
      });
      return violations; // Can't continue validation with wrong number of players
    }

    // Check for unique slots
    const slots = lineup.map((p) => p.slot);
    const uniqueSlots = new Set(slots);
    if (uniqueSlots.size !== 6) {
      const duplicateSlots = slots.filter(
        (slot, index) => slots.indexOf(slot) !== index
      );
      violations.push({
        code: "INVALID_LINEUP",
        slots: [...new Set(duplicateSlots)] as RotationSlot[],
        message: `Invalid lineup: duplicate rotation slots found: ${[
          ...new Set(duplicateSlots),
        ].join(", ")}`,
      });
    }

    // Check for exactly one server
    const servers = lineup.filter((p) => p.isServer);
    if (servers.length !== 1) {
      violations.push({
        code: "MULTIPLE_SERVERS",
        slots: servers.map((s) => s.slot),
        message: `Invalid lineup: expected exactly 1 server, got ${servers.length}`,
      });
    }

    // Check for valid slot numbers (1-6)
    const invalidSlots = lineup.filter(
      (p) => p.slot < 1 || p.slot > 6 || !Number.isInteger(p.slot)
    );
    if (invalidSlots.length > 0) {
      violations.push({
        code: "INVALID_LINEUP",
        slots: invalidSlots
          .map((p) => p.slot)
          .filter((s) => s >= 1 && s <= 6) as RotationSlot[],
        message: `Invalid lineup: invalid rotation slots found`,
      });
    }

    return violations;
  }

  /**
   * Validate front row left-to-right order: LF < MF < RF
   * @param positions - Map of slot to player state
   * @returns Array of front row order violations
   */
  private static validateFrontRowOrder(
    positions: Map<RotationSlot, PlayerState>
  ): Violation[] {
    const violations: Violation[] = [];

    const lf = positions.get(4); // Left Front
    const mf = positions.get(3); // Middle Front
    const rf = positions.get(2); // Right Front

    if (!lf || !mf || !rf) {
      return violations; // Missing players, handled by input validation
    }

    // Skip validation if any front row player is the server
    if (lf.isServer || mf.isServer || rf.isServer) {
      return violations;
    }

    // Check LF < MF (LF must be to the left of MF)
    if (!ToleranceUtils.isLess(lf.x, mf.x)) {
      violations.push({
        code: "ROW_ORDER",
        slots: [4, 3], // LF, MF
        message: `Front row order violation: Left Front (${lf.displayName}) must be to the left of Middle Front (${mf.displayName})`,
        coordinates: {
          4: { x: lf.x, y: lf.y },
          3: { x: mf.x, y: mf.y },
        },
      });
    }

    // Check MF < RF (MF must be to the left of RF)
    if (!ToleranceUtils.isLess(mf.x, rf.x)) {
      violations.push({
        code: "ROW_ORDER",
        slots: [3, 2], // MF, RF
        message: `Front row order violation: Middle Front (${mf.displayName}) must be to the left of Right Front (${rf.displayName})`,
        coordinates: {
          3: { x: mf.x, y: mf.y },
          2: { x: rf.x, y: rf.y },
        },
      });
    }

    return violations;
  }

  /**
   * Validate back row left-to-right order: LB < MB < RB
   * @param positions - Map of slot to player state
   * @returns Array of back row order violations
   */
  private static validateBackRowOrder(
    positions: Map<RotationSlot, PlayerState>
  ): Violation[] {
    const violations: Violation[] = [];

    const lb = positions.get(5); // Left Back
    const mb = positions.get(6); // Middle Back
    const rb = positions.get(1); // Right Back

    if (!lb || !mb || !rb) {
      return violations; // Missing players, handled by input validation
    }

    // Skip validation if any back row player is the server
    if (lb.isServer || mb.isServer || rb.isServer) {
      return violations;
    }

    // Check LB < MB (LB must be to the left of MB)
    if (!ToleranceUtils.isLess(lb.x, mb.x)) {
      violations.push({
        code: "ROW_ORDER",
        slots: [5, 6], // LB, MB
        message: `Back row order violation: Left Back (${lb.displayName}) must be to the left of Middle Back (${mb.displayName})`,
        coordinates: {
          5: { x: lb.x, y: lb.y },
          6: { x: mb.x, y: mb.y },
        },
      });
    }

    // Check MB < RB (MB must be to the left of RB)
    if (!ToleranceUtils.isLess(mb.x, rb.x)) {
      violations.push({
        code: "ROW_ORDER",
        slots: [6, 1], // MB, RB
        message: `Back row order violation: Middle Back (${mb.displayName}) must be to the left of Right Back (${rb.displayName})`,
        coordinates: {
          6: { x: mb.x, y: mb.y },
          1: { x: rb.x, y: rb.y },
        },
      });
    }

    return violations;
  }

  /**
   * Validate front players are in front of their back counterparts
   * @param positions - Map of slot to player state
   * @returns Array of front/back order violations
   */
  private static validateFrontBackOrder(
    positions: Map<RotationSlot, PlayerState>
  ): Violation[] {
    const violations: Violation[] = [];

    // Check each front/back pair
    const pairs: Array<{
      front: RotationSlot;
      back: RotationSlot;
      name: string;
    }> = [
      { front: 4, back: 5, name: "Left" }, // LF ↔ LB
      { front: 3, back: 6, name: "Middle" }, // MF ↔ MB
      { front: 2, back: 1, name: "Right" }, // RF ↔ RB
    ];

    for (const pair of pairs) {
      const frontPlayer = positions.get(pair.front);
      const backPlayer = positions.get(pair.back);

      if (!frontPlayer || !backPlayer) {
        continue; // Missing players, handled by input validation
      }

      // Skip validation if either player in the pair is the server
      if (frontPlayer.isServer || backPlayer.isServer) {
        continue;
      }

      // Front player must have smaller y coordinate (closer to net)
      if (!ToleranceUtils.isLess(frontPlayer.y, backPlayer.y)) {
        violations.push({
          code: "FRONT_BACK",
          slots: [pair.front, pair.back],
          message: `Front/back order violation: ${pair.name} Front (${frontPlayer.displayName}) must be in front of ${pair.name} Back (${backPlayer.displayName})`,
          coordinates: {
            [pair.front]: { x: frontPlayer.x, y: frontPlayer.y },
            [pair.back]: { x: backPlayer.x, y: backPlayer.y },
          },
        });
      }
    }

    return violations;
  }

  /**
   * Get a human-readable explanation of a violation
   * @param violation - The violation to explain
   * @param positions - Map of slot to player state for context
   * @returns Detailed explanation string
   */
  static explainViolation(
    violation: Violation,
    positions: Map<RotationSlot, PlayerState>
  ): string {
    const getPlayerName = (slot: RotationSlot): string => {
      const player = positions.get(slot);
      return player ? `${player.displayName} (slot ${slot})` : `slot ${slot}`;
    };

    const getSlotName = (slot: RotationSlot): string => {
      const names: Record<RotationSlot, string> = {
        1: "Right Back",
        2: "Right Front",
        3: "Middle Front",
        4: "Left Front",
        5: "Left Back",
        6: "Middle Back",
      };
      return names[slot];
    };

    switch (violation.code) {
      case "ROW_ORDER":
        if (violation.slots.length === 2) {
          const [slot1, slot2] = violation.slots;
          const player1 = getPlayerName(slot1);
          const player2 = getPlayerName(slot2);
          const pos1 = getSlotName(slot1);
          const pos2 = getSlotName(slot2);

          if (violation.coordinates) {
            const coord1 = violation.coordinates[slot1];
            const coord2 = violation.coordinates[slot2];
            return `${pos1} ${player1} at (${coord1.x.toFixed(
              2
            )}, ${coord1.y.toFixed(
              2
            )}) must be to the left of ${pos2} ${player2} at (${coord2.x.toFixed(
              2
            )}, ${coord2.y.toFixed(2)})`;
          }

          return `${pos1} ${player1} must be to the left of ${pos2} ${player2}`;
        }
        break;

      case "FRONT_BACK":
        if (violation.slots.length === 2) {
          const [frontSlot, backSlot] = violation.slots;
          const frontPlayer = getPlayerName(frontSlot);
          const backPlayer = getPlayerName(backSlot);
          const frontPos = getSlotName(frontSlot);
          const backPos = getSlotName(backSlot);

          if (violation.coordinates) {
            const frontCoord = violation.coordinates[frontSlot];
            const backCoord = violation.coordinates[backSlot];
            return `${frontPos} ${frontPlayer} at (${frontCoord.x.toFixed(
              2
            )}, ${frontCoord.y.toFixed(
              2
            )}) must be in front of ${backPos} ${backPlayer} at (${backCoord.x.toFixed(
              2
            )}, ${backCoord.y.toFixed(2)})`;
          }

          return `${frontPos} ${frontPlayer} must be in front of ${backPos} ${backPlayer}`;
        }
        break;

      case "MULTIPLE_SERVERS":
        const serverNames = violation.slots.map(getPlayerName).join(", ");
        return `Only one player can be the server. Currently serving: ${serverNames}`;

      case "INVALID_LINEUP":
        return violation.message;
    }

    return violation.message;
  }

  /**
   * Generate detailed violation information with specific violation detection
   * @param lineup - Array of players to analyze
   * @returns Array of detailed violations with enhanced messaging
   */
  static generateDetailedViolations(lineup: PlayerState[]): Violation[] {
    const result = this.checkOverlap(lineup);
    return result.violations.map((violation) =>
      this.enhanceViolation(violation, lineup)
    );
  }

  /**
   * Enhance a violation with additional context and detailed messaging
   * @param violation - Base violation to enhance
   * @param lineup - Full lineup for context
   * @returns Enhanced violation with detailed information
   */
  private static enhanceViolation(
    violation: Violation,
    lineup: PlayerState[]
  ): Violation {
    const positionMap = new Map<RotationSlot, PlayerState>();
    lineup.forEach((player) => positionMap.set(player.slot, player));

    switch (violation.code) {
      case "ROW_ORDER":
        return this.enhanceRowOrderViolation(violation, positionMap);
      case "FRONT_BACK":
        return this.enhanceFrontBackViolation(violation, positionMap);
      case "MULTIPLE_SERVERS":
        return this.enhanceMultipleServersViolation(violation, positionMap);
      case "INVALID_LINEUP":
        return this.enhanceInvalidLineupViolation(violation, positionMap);
      default:
        return violation;
    }
  }

  /**
   * Enhance row order violation with detailed positioning information
   */
  private static enhanceRowOrderViolation(
    violation: Violation,
    positions: Map<RotationSlot, PlayerState>
  ): Violation {
    if (violation.slots.length !== 2) return violation;

    const [slot1, slot2] = violation.slots;
    const player1 = positions.get(slot1);
    const player2 = positions.get(slot2);

    if (!player1 || !player2) return violation;

    const getSlotName = (slot: RotationSlot): string => {
      const names: Record<RotationSlot, string> = {
        1: "Right Back",
        2: "Right Front",
        3: "Middle Front",
        4: "Left Front",
        5: "Left Back",
        6: "Middle Back",
      };
      return names[slot];
    };

    const distance = Math.abs(player1.x - player2.x);
    const tolerance = 0.03; // 3cm tolerance

    return {
      ...violation,
      message: `Row order violation: ${getSlotName(slot1)} (${
        player1.displayName
      }) at x=${player1.x.toFixed(2)}m must be to the left of ${getSlotName(
        slot2
      )} (${player2.displayName}) at x=${player2.x.toFixed(
        2
      )}m. Current separation: ${distance.toFixed(
        3
      )}m (minimum required: ${tolerance.toFixed(3)}m)`,
      coordinates: {
        [slot1]: { x: player1.x, y: player1.y },
        [slot2]: { x: player2.x, y: player2.y },
      },
    };
  }

  /**
   * Enhance front/back violation with detailed positioning information
   */
  private static enhanceFrontBackViolation(
    violation: Violation,
    positions: Map<RotationSlot, PlayerState>
  ): Violation {
    if (violation.slots.length !== 2) return violation;

    const [frontSlot, backSlot] = violation.slots;
    const frontPlayer = positions.get(frontSlot);
    const backPlayer = positions.get(backSlot);

    if (!frontPlayer || !backPlayer) return violation;

    const getSlotName = (slot: RotationSlot): string => {
      const names: Record<RotationSlot, string> = {
        1: "Right Back",
        2: "Right Front",
        3: "Middle Front",
        4: "Left Front",
        5: "Left Back",
        6: "Middle Back",
      };
      return names[slot];
    };

    const distance = backPlayer.y - frontPlayer.y;
    const tolerance = 0.03; // 3cm tolerance

    return {
      ...violation,
      message: `Front/back violation: ${getSlotName(frontSlot)} (${
        frontPlayer.displayName
      }) at y=${frontPlayer.y.toFixed(2)}m must be in front of ${getSlotName(
        backSlot
      )} (${backPlayer.displayName}) at y=${backPlayer.y.toFixed(
        2
      )}m. Current separation: ${distance.toFixed(
        3
      )}m (minimum required: ${tolerance.toFixed(3)}m)`,
      coordinates: {
        [frontSlot]: { x: frontPlayer.x, y: frontPlayer.y },
        [backSlot]: { x: backPlayer.x, y: backPlayer.y },
      },
    };
  }

  /**
   * Enhance multiple servers violation with player details
   */
  private static enhanceMultipleServersViolation(
    violation: Violation,
    positions: Map<RotationSlot, PlayerState>
  ): Violation {
    const serverDetails = violation.slots
      .map((slot) => {
        const player = positions.get(slot);
        return player ? `${player.displayName} (slot ${slot})` : `slot ${slot}`;
      })
      .join(", ");

    return {
      ...violation,
      message: `Multiple servers detected: ${serverDetails}. Only one player can be designated as the server at serve contact.`,
      coordinates: violation.slots.reduce((coords, slot) => {
        const player = positions.get(slot);
        if (player) {
          coords[slot] = { x: player.x, y: player.y };
        }
        return coords;
      }, {} as { [slot: number]: { x: number; y: number } }),
    };
  }

  /**
   * Enhance invalid lineup violation with specific details
   */
  private static enhanceInvalidLineupViolation(
    violation: Violation,
    positions: Map<RotationSlot, PlayerState>
  ): Violation {
    // The message is already detailed from the input validation
    return {
      ...violation,
      coordinates: violation.slots.reduce((coords, slot) => {
        const player = positions.get(slot);
        if (player) {
          coords[slot] = { x: player.x, y: player.y };
        }
        return coords;
      }, {} as { [slot: number]: { x: number; y: number } }),
    };
  }

  /**
   * Get violation summary statistics
   * @param violations - Array of violations to summarize
   * @returns Summary object with violation counts and affected slots
   */
  static getViolationSummary(violations: Violation[]): {
    totalViolations: number;
    violationTypes: Record<string, number>;
    affectedSlots: RotationSlot[];
    severity: "none" | "minor" | "major" | "critical";
  } {
    const violationTypes: Record<string, number> = {};
    const affectedSlotsSet = new Set<RotationSlot>();

    violations.forEach((violation) => {
      violationTypes[violation.code] =
        (violationTypes[violation.code] || 0) + 1;
      violation.slots.forEach((slot) => affectedSlotsSet.add(slot));
    });

    const totalViolations = violations.length;
    let severity: "none" | "minor" | "major" | "critical" = "none";

    if (totalViolations === 0) {
      severity = "none";
    } else if (totalViolations === 1 && violations[0].code === "ROW_ORDER") {
      severity = "minor";
    } else if (totalViolations <= 2) {
      severity = "major";
    } else {
      severity = "critical";
    }

    return {
      totalViolations,
      violationTypes,
      affectedSlots: Array.from(affectedSlotsSet).sort(),
      severity,
    };
  }

  /**
   * Generate user-friendly violation messages for UI display
   * @param violations - Array of violations
   * @returns Array of formatted messages for user display
   */
  static generateUserFriendlyMessages(violations: Violation[]): string[] {
    if (violations.length === 0) {
      return [
        "All players are positioned correctly according to volleyball overlap rules.",
      ];
    }

    const messages: string[] = [];
    const summary = this.getViolationSummary(violations);

    // Add summary message
    if (summary.totalViolations === 1) {
      messages.push("1 positioning violation detected:");
    } else {
      messages.push(
        `${summary.totalViolations} positioning violations detected:`
      );
    }

    // Add specific violation messages
    violations.forEach((violation, index) => {
      messages.push(`${index + 1}. ${violation.message}`);
    });

    // Add helpful context
    if (summary.violationTypes["ROW_ORDER"]) {
      messages.push(
        "💡 Tip: Players in the same row must be positioned left to right in their designated order."
      );
    }

    if (summary.violationTypes["FRONT_BACK"]) {
      messages.push(
        "💡 Tip: Front row players must be positioned closer to the net than their back row counterparts."
      );
    }

    if (summary.violationTypes["MULTIPLE_SERVERS"]) {
      messages.push(
        "💡 Tip: Only one player can be designated as the server at the moment of serve contact."
      );
    }

    return messages;
  }

  /**
   * Check if a specific position would create violations for a player
   * @param slot - The slot being tested
   * @param testPosition - The position to test
   * @param otherPositions - Positions of other players
   * @param isServer - Whether the player is the server
   * @returns True if the position would be valid
   */
  static isPositionValid(
    slot: RotationSlot,
    testPosition: { x: number; y: number },
    otherPositions: Map<RotationSlot, PlayerState>,
    isServer: boolean = false
  ): boolean {
    // Create a temporary lineup with the test position
    const testPlayer: PlayerState = {
      id: "test",
      displayName: "Test Player",
      role: "Unknown",
      slot,
      x: testPosition.x,
      y: testPosition.y,
      isServer,
    };

    // Build test lineup
    const testLineup: PlayerState[] = [testPlayer];
    for (const [otherSlot, otherPlayer] of otherPositions) {
      if (otherSlot !== slot) {
        testLineup.push(otherPlayer);
      }
    }

    // If we don't have 6 players, we can't validate properly
    if (testLineup.length !== 6) {
      return true; // Allow positioning when lineup is incomplete
    }

    // Check if this position would create violations
    const result = this.checkOverlap(testLineup);
    return result.isLegal;
  }
}
