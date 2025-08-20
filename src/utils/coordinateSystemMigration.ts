/**
 * Coordinate system migration utilities for existing position data
 * Provides tools to migrate between different coordinate systems and versions
 */

import {
  CustomPositionsState,
  PlayerPosition,
  StoredPositions,
} from "@/types/positioning";
import { StateConverter } from "@/volleyball-rules-engine/utils/StateConverter";
import { CoordinateTransformer } from "@/volleyball-rules-engine/utils/CoordinateTransformer";
import { COORDINATE_SYSTEM } from "@/volleyball-rules-engine/types/CoordinateSystem";

/**
 * Migration metadata for tracking coordinate system versions
 */
export interface MigrationMetadata {
  version: string;
  coordinateSystem: "screen" | "volleyball" | "hybrid";
  migratedAt: string;
  originalVersion?: string;
  migrationNotes?: string[];
}

/**
 * Enhanced stored positions with migration metadata
 */
export interface MigratedStoredPositions extends StoredPositions {
  _migration?: MigrationMetadata;
}

/**
 * Migration result information
 */
export interface MigrationResult {
  success: boolean;
  migratedPositions?: MigratedStoredPositions;
  errors?: string[];
  warnings?: string[];
  summary: {
    totalPositions: number;
    migratedPositions: number;
    skippedPositions: number;
    errorPositions: number;
  };
}

/**
 * Coordinate system migration utilities
 */
export class CoordinateSystemMigration {
  private static readonly CURRENT_VERSION = "1.0.0";
  private static readonly SUPPORTED_VERSIONS = ["0.9.0", "1.0.0"];

  /**
   * Migrate existing position data to support volleyball coordinate system
   * @param existingData - Existing stored positions data
   * @param options - Migration options
   * @returns Migration result with updated data
   */
  static migrateToVolleyballSupport(
    existingData: StoredPositions,
    options: {
      preserveOriginal?: boolean;
      validatePositions?: boolean;
      addMetadata?: boolean;
    } = {}
  ): MigrationResult {
    const {
      preserveOriginal = true,
      validatePositions = true,
      addMetadata = true,
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];
    let totalPositions = 0;
    let migratedPositions = 0;
    let skippedPositions = 0;
    let errorPositions = 0;

    try {
      // Create a copy of the existing data
      const migratedData: MigratedStoredPositions = preserveOriginal
        ? JSON.parse(JSON.stringify(existingData))
        : existingData;

      // Process each system
      for (const [systemKey, systemData] of Object.entries(
        migratedData.positions
      )) {
        if (!systemData || typeof systemData !== "object") {
          warnings.push(`Invalid system data for ${systemKey}`);
          continue;
        }

        // Process each rotation
        for (const [rotationKey, rotationData] of Object.entries(systemData)) {
          if (!rotationData || typeof rotationData !== "object") {
            warnings.push(
              `Invalid rotation data for ${systemKey}-${rotationKey}`
            );
            continue;
          }

          // Process each formation
          for (const [formationKey, formationData] of Object.entries(
            rotationData
          )) {
            if (!formationData || typeof formationData !== "object") {
              warnings.push(
                `Invalid formation data for ${systemKey}-${rotationKey}-${formationKey}`
              );
              continue;
            }

            // Process each player position
            for (const [playerId, position] of Object.entries(formationData)) {
              totalPositions++;

              try {
                const migratedPosition = this.migratePlayerPosition(
                  position as PlayerPosition,
                  playerId,
                  validatePositions
                );

                if (migratedPosition) {
                  (formationData as any)[playerId] = migratedPosition;
                  migratedPositions++;
                } else {
                  skippedPositions++;
                }
              } catch (error) {
                errors.push(
                  `Error migrating position for ${playerId} in ${systemKey}-${rotationKey}-${formationKey}: ${error}`
                );
                errorPositions++;
              }
            }
          }
        }
      }

      // Add migration metadata
      if (addMetadata) {
        migratedData._migration = {
          version: this.CURRENT_VERSION,
          coordinateSystem: "hybrid",
          migratedAt: new Date().toISOString(),
          originalVersion: existingData.version || "unknown",
          migrationNotes: [
            "Added volleyball coordinate system support",
            "Positions remain in screen coordinates for compatibility",
            "Volleyball rules engine can convert coordinates as needed",
          ],
        };
      }

      // Update version
      migratedData.version = this.CURRENT_VERSION;
      migratedData.lastModified = new Date();

      return {
        success: errors.length === 0,
        migratedPositions: migratedData,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        summary: {
          totalPositions,
          migratedPositions,
          skippedPositions,
          errorPositions,
        },
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Migration failed: ${error}`],
        summary: {
          totalPositions,
          migratedPositions,
          skippedPositions,
          errorPositions,
        },
      };
    }
  }

  /**
   * Migrate a single player position
   * @param position - Original player position
   * @param playerId - Player identifier
   * @param validate - Whether to validate the position
   * @returns Migrated position or null if skipped
   */
  private static migratePlayerPosition(
    position: PlayerPosition,
    playerId: string,
    validate: boolean
  ): PlayerPosition | null {
    // Check if position is already valid
    if (
      !position ||
      typeof position.x !== "number" ||
      typeof position.y !== "number"
    ) {
      throw new Error(`Invalid position data for player ${playerId}`);
    }

    // Validate coordinates if requested
    if (validate) {
      const isValidScreen = StateConverter.isValidCoordinates(
        { x: position.x, y: position.y },
        false // screen coordinates
      );

      if (!isValidScreen) {
        throw new Error(
          `Invalid screen coordinates for player ${playerId}: (${position.x}, ${position.y})`
        );
      }
    }

    // For now, we keep positions in screen coordinates for compatibility
    // The StateConverter will handle conversion to volleyball coordinates when needed
    return {
      ...position,
      lastModified: position.lastModified || new Date(),
      isCustom: position.isCustom ?? true,
    };
  }

  /**
   * Validate migrated data integrity
   * @param migratedData - Migrated position data
   * @returns Validation result
   */
  static validateMigratedData(migratedData: MigratedStoredPositions): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check version compatibility
      if (!this.SUPPORTED_VERSIONS.includes(migratedData.version)) {
        warnings.push(`Unsupported version: ${migratedData.version}`);
      }

      // Check migration metadata
      if (migratedData._migration) {
        if (!migratedData._migration.version) {
          warnings.push("Missing migration version");
        }
        if (!migratedData._migration.coordinateSystem) {
          warnings.push("Missing coordinate system information");
        }
      }

      // Validate position data structure
      if (!migratedData.positions) {
        errors.push("Missing positions data");
        return { isValid: false, errors, warnings };
      }

      // Validate each system
      for (const [systemKey, systemData] of Object.entries(
        migratedData.positions
      )) {
        if (!["5-1", "6-2"].includes(systemKey)) {
          warnings.push(`Unknown system: ${systemKey}`);
        }

        if (!systemData || typeof systemData !== "object") {
          errors.push(`Invalid system data for ${systemKey}`);
          continue;
        }

        // Validate rotations
        for (const [rotationKey, rotationData] of Object.entries(systemData)) {
          const rotationNum = parseInt(rotationKey);
          if (isNaN(rotationNum) || rotationNum < 1 || rotationNum > 6) {
            warnings.push(`Invalid rotation number: ${rotationKey}`);
          }

          if (!rotationData || typeof rotationData !== "object") {
            errors.push(
              `Invalid rotation data for ${systemKey}-${rotationKey}`
            );
            continue;
          }

          // Validate formations
          for (const [formationKey, formationData] of Object.entries(
            rotationData
          )) {
            if (
              !["rotational", "serveReceive", "base"].includes(formationKey)
            ) {
              warnings.push(`Unknown formation: ${formationKey}`);
            }

            if (!formationData || typeof formationData !== "object") {
              errors.push(
                `Invalid formation data for ${systemKey}-${rotationKey}-${formationKey}`
              );
              continue;
            }

            // Validate player positions
            for (const [playerId, position] of Object.entries(formationData)) {
              const positionData = position as PlayerPosition;

              if (
                typeof positionData.x !== "number" ||
                typeof positionData.y !== "number"
              ) {
                errors.push(
                  `Invalid coordinates for ${playerId} in ${systemKey}-${rotationKey}-${formationKey}`
                );
              }

              if (typeof positionData.isCustom !== "boolean") {
                warnings.push(
                  `Missing isCustom flag for ${playerId} in ${systemKey}-${rotationKey}-${formationKey}`
                );
              }
            }
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error}`],
        warnings,
      };
    }
  }

  /**
   * Create backup of existing data before migration
   * @param data - Data to backup
   * @returns Backup data with timestamp
   */
  static createBackup(
    data: StoredPositions
  ): StoredPositions & { _backup: { createdAt: string } } {
    return {
      ...JSON.parse(JSON.stringify(data)),
      _backup: {
        createdAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Restore data from backup
   * @param backupData - Backup data to restore
   * @returns Restored data without backup metadata
   */
  static restoreFromBackup(
    backupData: StoredPositions & { _backup?: any }
  ): StoredPositions {
    const restored = { ...backupData };
    delete (restored as any)._backup;
    return restored;
  }

  /**
   * Get coordinate system information for debugging
   * @returns Coordinate system details
   */
  static getCoordinateSystemInfo() {
    return {
      current: {
        version: this.CURRENT_VERSION,
        screen: {
          width: 600,
          height: 360,
          description: "Screen pixel coordinates used by existing visualizer",
        },
        volleyball: {
          width: COORDINATE_SYSTEM.COURT_WIDTH,
          height: COORDINATE_SYSTEM.COURT_LENGTH,
          serviceZoneEnd: COORDINATE_SYSTEM.SERVICE_ZONE_END,
          tolerance: COORDINATE_SYSTEM.TOLERANCE,
          description:
            "Volleyball court coordinates in meters used by rules engine",
        },
      },
      conversion: StateConverter.getCoordinateSystemInfo(),
      supported: this.SUPPORTED_VERSIONS,
    };
  }

  /**
   * Check if data needs migration
   * @param data - Position data to check
   * @returns Whether migration is needed
   */
  static needsMigration(data: StoredPositions): boolean {
    // Check if already migrated
    if ((data as MigratedStoredPositions)._migration) {
      return false;
    }

    // Check version
    if (!data.version || !this.SUPPORTED_VERSIONS.includes(data.version)) {
      return true;
    }

    return false;
  }

  /**
   * Get migration recommendations
   * @param data - Position data to analyze
   * @returns Migration recommendations
   */
  static getMigrationRecommendations(data: StoredPositions): {
    shouldMigrate: boolean;
    reasons: string[];
    risks: string[];
    benefits: string[];
  } {
    const reasons: string[] = [];
    const risks: string[] = [];
    const benefits: string[] = [];

    if (this.needsMigration(data)) {
      reasons.push("Data is from an older version");
      benefits.push("Enable volleyball rules validation");
      benefits.push("Support for constraint-based positioning");
      benefits.push("Improved coordinate system handling");
    }

    if (!data.version) {
      reasons.push("Missing version information");
      risks.push("Unknown data format compatibility");
    }

    // Count positions to assess migration complexity
    let positionCount = 0;
    try {
      for (const systemData of Object.values(data.positions)) {
        for (const rotationData of Object.values(systemData)) {
          for (const formationData of Object.values(rotationData)) {
            positionCount += Object.keys(formationData).length;
          }
        }
      }

      if (positionCount > 100) {
        risks.push("Large dataset - migration may take time");
      }
    } catch (error) {
      risks.push("Unable to analyze data structure");
    }

    return {
      shouldMigrate: reasons.length > 0,
      reasons,
      risks,
      benefits,
    };
  }
}
