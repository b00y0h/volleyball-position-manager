/**
 * Position labeling and helper utilities for volleyball rules engine
 */

import type { RotationSlot, PlayerState } from "../types/PlayerState";

/**
 * Column position on the court
 */
export type Column = "Left" | "Middle" | "Right";

/**
 * Row position on the court
 */
export type Row = "Front" | "Back";

/**
 * Position description with detailed information
 */
export interface PositionDescription {
  slot: RotationSlot;
  label: string;
  fullName: string;
  column: Column;
  row: Row;
  abbreviation: string;
}

/**
 * Formation pattern analysis result
 */
export interface FormationPattern {
  name: string;
  description: string;
  isValid: boolean;
  characteristics: string[];
}

/**
 * Helper utilities for position labeling and formation analysis
 */
export class PositionHelpers {
  /**
   * Slot to position label mapping
   */
  private static readonly SLOT_LABELS: Record<RotationSlot, string> = {
    1: "RB", // Right Back
    2: "RF", // Right Front
    3: "MF", // Middle Front
    4: "LF", // Left Front
    5: "LB", // Left Back
    6: "MB", // Middle Back
  };

  /**
   * Slot to full position name mapping
   */
  private static readonly SLOT_FULL_NAMES: Record<RotationSlot, string> = {
    1: "Right Back",
    2: "Right Front",
    3: "Middle Front",
    4: "Left Front",
    5: "Left Back",
    6: "Middle Back",
  };

  /**
   * Slot to column mapping
   */
  private static readonly SLOT_COLUMNS: Record<RotationSlot, Column> = {
    1: "Right", // RB
    2: "Right", // RF
    3: "Middle", // MF
    4: "Left", // LF
    5: "Left", // LB
    6: "Middle", // MB
  };

  /**
   * Slot to row mapping
   */
  private static readonly SLOT_ROWS: Record<RotationSlot, Row> = {
    1: "Back", // RB
    2: "Front", // RF
    3: "Front", // MF
    4: "Front", // LF
    5: "Back", // LB
    6: "Back", // MB
  };

  /**
   * Get the position label for a rotation slot (e.g., 1 -> "RB")
   */
  static getSlotLabel(slot: RotationSlot): string {
    return this.SLOT_LABELS[slot];
  }

  /**
   * Get the full position name for a rotation slot (e.g., 1 -> "Right Back")
   */
  static getSlotFullName(slot: RotationSlot): string {
    return this.SLOT_FULL_NAMES[slot];
  }

  /**
   * Get the column (Left/Middle/Right) for a rotation slot
   */
  static getSlotColumn(slot: RotationSlot): Column {
    return this.SLOT_COLUMNS[slot];
  }

  /**
   * Get the row (Front/Back) for a rotation slot
   */
  static getSlotRow(slot: RotationSlot): Row {
    return this.SLOT_ROWS[slot];
  }

  /**
   * Get comprehensive position description for a slot
   */
  static getPositionDescription(slot: RotationSlot): PositionDescription {
    return {
      slot,
      label: this.getSlotLabel(slot),
      fullName: this.getSlotFullName(slot),
      column: this.getSlotColumn(slot),
      row: this.getSlotRow(slot),
      abbreviation: this.getSlotLabel(slot),
    };
  }

  /**
   * Get all slots in a specific column
   */
  static getSlotsInColumn(column: Column): RotationSlot[] {
    return (Object.keys(this.SLOT_COLUMNS) as unknown as string[])
      .map((slot) => parseInt(slot, 10) as RotationSlot)
      .filter((slot) => this.SLOT_COLUMNS[slot] === column)
      .sort((a, b) => a - b);
  }

  /**
   * Get all slots in a specific row
   */
  static getSlotsInRow(row: Row): RotationSlot[] {
    return (Object.keys(this.SLOT_ROWS) as unknown as string[])
      .map((slot) => parseInt(slot, 10) as RotationSlot)
      .filter((slot) => this.SLOT_ROWS[slot] === row)
      .sort((a, b) => a - b);
  }

  /**
   * Get front row slots (2, 3, 4)
   */
  static getFrontRowSlots(): RotationSlot[] {
    return this.getSlotsInRow("Front");
  }

  /**
   * Get back row slots (1, 5, 6)
   */
  static getBackRowSlots(): RotationSlot[] {
    return this.getSlotsInRow("Back");
  }

  /**
   * Get left column slots (4, 5)
   */
  static getLeftColumnSlots(): RotationSlot[] {
    return this.getSlotsInColumn("Left");
  }

  /**
   * Get middle column slots (3, 6)
   */
  static getMiddleColumnSlots(): RotationSlot[] {
    return this.getSlotsInColumn("Middle");
  }

  /**
   * Get right column slots (1, 2)
   */
  static getRightColumnSlots(): RotationSlot[] {
    return this.getSlotsInColumn("Right");
  }

  /**
   * Create user-friendly position display string
   */
  static formatPositionDisplay(
    slot: RotationSlot,
    includeSlotNumber = true
  ): string {
    const label = this.getSlotLabel(slot);
    const fullName = this.getSlotFullName(slot);

    if (includeSlotNumber) {
      return `${slot} - ${label} (${fullName})`;
    }
    return `${label} (${fullName})`;
  }

  /**
   * Create compact position display string
   */
  static formatCompactDisplay(slot: RotationSlot): string {
    return `${slot}${this.getSlotLabel(slot)}`;
  }

  /**
   * Analyze formation pattern based on player positions
   */
  static analyzeFormationPattern(players: PlayerState[]): FormationPattern {
    if (players.length !== 6) {
      return {
        name: "Invalid",
        description: "Formation must have exactly 6 players",
        isValid: false,
        characteristics: [`Player count: ${players.length}`],
      };
    }

    const characteristics: string[] = [];
    const frontRowPlayers = players.filter(
      (p) => this.getSlotRow(p.slot) === "Front"
    );
    const backRowPlayers = players.filter(
      (p) => this.getSlotRow(p.slot) === "Back"
    );

    characteristics.push(`Front row: ${frontRowPlayers.length} players`);
    characteristics.push(`Back row: ${backRowPlayers.length} players`);

    // Analyze server position
    const servers = players.filter((p) => p.isServer);
    if (servers.length === 1) {
      const server = servers[0];
      const serverPos = this.getPositionDescription(server.slot);
      characteristics.push(
        `Server: ${serverPos.label} (${serverPos.fullName})`
      );

      // Check if server is in service zone
      if (server.y > 9.0) {
        characteristics.push("Server in service zone");
      }
    } else {
      characteristics.push(`Invalid server count: ${servers.length}`);
    }

    // Analyze formation spread
    const xPositions = players.map((p) => p.x).sort((a, b) => a - b);
    const yPositions = players.map((p) => p.y).sort((a, b) => a - b);
    const xSpread = xPositions[xPositions.length - 1] - xPositions[0];
    const ySpread = yPositions[yPositions.length - 1] - yPositions[0];

    characteristics.push(`X-axis spread: ${xSpread.toFixed(2)}m`);
    characteristics.push(`Y-axis spread: ${ySpread.toFixed(2)}m`);

    // Determine formation type based on characteristics
    let formationName = "Custom";
    let description = "Custom formation";

    if (frontRowPlayers.length === 3 && backRowPlayers.length === 3) {
      if (xSpread > 6.0) {
        formationName = "Spread";
        description = "Wide spread formation covering full court width";
      } else if (xSpread < 3.0) {
        formationName = "Compact";
        description = "Compact formation with players close together";
      } else {
        formationName = "Standard";
        description = "Standard volleyball formation";
      }
    }

    return {
      name: formationName,
      description,
      isValid:
        servers.length === 1 &&
        frontRowPlayers.length === 3 &&
        backRowPlayers.length === 3,
      characteristics,
    };
  }

  /**
   * Get position relationships for a given slot
   */
  static getPositionRelationships(slot: RotationSlot): {
    neighbors: RotationSlot[];
    counterpart: RotationSlot | null;
    sameRow: RotationSlot[];
    sameColumn: RotationSlot[];
  } {
    const row = this.getSlotRow(slot);
    const column = this.getSlotColumn(slot);

    // Get same row and column slots (excluding the slot itself)
    const sameRow = this.getSlotsInRow(row).filter((s) => s !== slot);
    const sameColumn = this.getSlotsInColumn(column).filter((s) => s !== slot);

    // Get counterpart (front/back pair in same column)
    const counterpart = sameColumn.length > 0 ? sameColumn[0] : null;

    // Get neighbors (adjacent slots in same row)
    const neighbors: RotationSlot[] = [];
    if (row === "Front") {
      // Front row: 4 (LF) - 3 (MF) - 2 (RF)
      if (slot === 4) neighbors.push(3); // LF -> MF
      if (slot === 3) neighbors.push(4, 2); // MF -> LF, RF
      if (slot === 2) neighbors.push(3); // RF -> MF
    } else {
      // Back row: 5 (LB) - 6 (MB) - 1 (RB)
      if (slot === 5) neighbors.push(6); // LB -> MB
      if (slot === 6) neighbors.push(5, 1); // MB -> LB, RB
      if (slot === 1) neighbors.push(6); // RB -> MB
    }

    return {
      neighbors,
      counterpart,
      sameRow,
      sameColumn,
    };
  }

  /**
   * Check if two slots are adjacent (neighbors in same row)
   */
  static areAdjacent(slot1: RotationSlot, slot2: RotationSlot): boolean {
    const relationships = this.getPositionRelationships(slot1);
    return relationships.neighbors.includes(slot2);
  }

  /**
   * Check if two slots are counterparts (front/back pair in same column)
   */
  static areCounterparts(slot1: RotationSlot, slot2: RotationSlot): boolean {
    const relationships = this.getPositionRelationships(slot1);
    return relationships.counterpart === slot2;
  }

  /**
   * Get all valid rotation slot numbers
   */
  static getAllSlots(): RotationSlot[] {
    return [1, 2, 3, 4, 5, 6];
  }

  /**
   * Validate that a slot number is valid
   */
  static isValidSlot(slot: unknown): slot is RotationSlot {
    return (
      typeof slot === "number" &&
      Number.isInteger(slot) &&
      slot >= 1 &&
      slot <= 6
    );
  }
}
