/**
 * Configuration utilities for VolleyballCourt component
 * Handles configuration validation, merging, and customization
 */

import {
  VolleyballCourtConfig,
  PlayerDefinition,
  RotationMapping,
  AppearanceConfig,
  ValidationConfig,
  AnimationConfig,
  ControlsConfig,
  InteractionConfig,
  AccessibilityConfig,
  PerformanceConfig,
  LocalizationConfig,
  ExportConfig,
  CustomRuleConfig,
  ValidationContext,
  PlayerColorConfig,
} from "./types";
import { SystemType, FormationType, PlayerPosition } from "./types";

/**
 * Configuration validation and utilities
 */
export class ConfigurationManager {
  /**
   * Validates a complete configuration object
   */
  static validateConfig(config: VolleyballCourtConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate players configuration
    if (config.players) {
      const playerValidation = this.validatePlayersConfig(config.players);
      errors.push(...playerValidation.errors);
      warnings.push(...playerValidation.warnings);
    }

    // Validate rotations configuration
    if (config.rotations) {
      const rotationValidation = this.validateRotationsConfig(
        config.rotations,
        config.players
      );
      errors.push(...rotationValidation.errors);
      warnings.push(...rotationValidation.warnings);
    }

    // Validate appearance configuration
    if (config.appearance) {
      const appearanceValidation = this.validateAppearanceConfig(
        config.appearance
      );
      errors.push(...appearanceValidation.errors);
      warnings.push(...appearanceValidation.warnings);
    }

    // Validate animation configuration
    if (config.animation) {
      const animationValidation = this.validateAnimationConfig(
        config.animation
      );
      errors.push(...animationValidation.errors);
      warnings.push(...animationValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates players configuration
   */
  static validatePlayersConfig(players: {
    "5-1": PlayerDefinition[];
    "6-2": PlayerDefinition[];
  }): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate 5-1 system players
    if (players["5-1"]) {
      if (players["5-1"].length !== 6) {
        errors.push("5-1 system must have exactly 6 players");
      }

      const playerValidation = this.validatePlayerDefinitions(
        players["5-1"],
        "5-1"
      );
      errors.push(...playerValidation.errors);
      warnings.push(...playerValidation.warnings);
    }

    // Validate 6-2 system players
    if (players["6-2"]) {
      if (players["6-2"].length !== 6) {
        errors.push("6-2 system must have exactly 6 players");
      }

      const playerValidation = this.validatePlayerDefinitions(
        players["6-2"],
        "6-2"
      );
      errors.push(...playerValidation.errors);
      warnings.push(...playerValidation.warnings);
    }

    return { errors, warnings };
  }

  /**
   * Validates individual player definitions
   */
  static validatePlayerDefinitions(
    players: PlayerDefinition[],
    system: SystemType
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const playerIds = new Set<string>();
    const playerNumbers = new Set<number>();

    for (const player of players) {
      // Check for duplicate IDs
      if (playerIds.has(player.id)) {
        errors.push(`Duplicate player ID: ${player.id}`);
      }
      playerIds.add(player.id);

      // Check for duplicate numbers
      if (player.number && playerNumbers.has(player.number)) {
        warnings.push(`Duplicate player number: ${player.number}`);
      }
      if (player.number) {
        playerNumbers.add(player.number);
      }

      // Validate player ID format
      if (!player.id || player.id.trim() === "") {
        errors.push("Player ID cannot be empty");
      }

      // Validate player name
      if (!player.name || player.name.trim() === "") {
        warnings.push(`Player ${player.id} has no name`);
      }

      // Validate player role
      const validRoles = ["S", "OPP", "OH", "MB"];
      if (!validRoles.includes(player.role)) {
        errors.push(
          `Invalid role "${player.role}" for player ${
            player.id
          }. Must be one of: ${validRoles.join(", ")}`
        );
      }

      // Validate color format if provided
      if (player.color && !this.isValidColor(player.color)) {
        warnings.push(
          `Invalid color format "${player.color}" for player ${player.id}`
        );
      }

      // Validate number range
      if (player.number && (player.number < 1 || player.number > 99)) {
        warnings.push(
          `Player number ${player.number} for ${player.id} should be between 1 and 99`
        );
      }

      // Validate size multiplier
      if (player.size && (player.size < 0.1 || player.size > 5)) {
        warnings.push(
          `Player size ${player.size} for ${player.id} should be between 0.1 and 5`
        );
      }
    }

    // System-specific validations
    if (system === "5-1") {
      const setters = players.filter((p) => p.role === "S");
      if (setters.length !== 1) {
        errors.push("5-1 system must have exactly 1 setter");
      }
    } else if (system === "6-2") {
      const setters = players.filter((p) => p.role === "S");
      if (setters.length !== 2) {
        errors.push("6-2 system must have exactly 2 setters");
      }
    }

    return { errors, warnings };
  }

  /**
   * Validates rotations configuration
   */
  static validateRotationsConfig(
    rotations: {
      "5-1": RotationMapping[];
      "6-2": RotationMapping[];
    },
    players?: {
      "5-1": PlayerDefinition[];
      "6-2": PlayerDefinition[];
    }
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate 5-1 rotations
    if (rotations["5-1"]) {
      if (rotations["5-1"].length !== 6) {
        errors.push("5-1 system must have exactly 6 rotations");
      }

      const rotationValidation = this.validateRotationMappings(
        rotations["5-1"],
        players?.["5-1"],
        "5-1"
      );
      errors.push(...rotationValidation.errors);
      warnings.push(...rotationValidation.warnings);
    }

    // Validate 6-2 rotations
    if (rotations["6-2"]) {
      if (rotations["6-2"].length !== 6) {
        errors.push("6-2 system must have exactly 6 rotations");
      }

      const rotationValidation = this.validateRotationMappings(
        rotations["6-2"],
        players?.["6-2"],
        "6-2"
      );
      errors.push(...rotationValidation.errors);
      warnings.push(...rotationValidation.warnings);
    }

    return { errors, warnings };
  }

  /**
   * Validates rotation mappings
   */
  static validateRotationMappings(
    rotations: RotationMapping[],
    players?: PlayerDefinition[],
    system?: SystemType
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const playerIds = players ? new Set(players.map((p) => p.id)) : null;

    rotations.forEach((rotation, rotationIndex) => {
      const positions = Object.keys(rotation).map(Number).sort();
      const expectedPositions = [1, 2, 3, 4, 5, 6];

      // Check all positions are present
      if (positions.length !== 6) {
        errors.push(
          `Rotation ${rotationIndex + 1} must have exactly 6 positions`
        );
      }

      // Check positions are 1-6
      for (const pos of expectedPositions) {
        if (!positions.includes(pos)) {
          errors.push(`Rotation ${rotationIndex + 1} missing position ${pos}`);
        }
      }

      // Check for duplicate player assignments
      const assignedPlayers = Object.values(rotation);
      const uniquePlayers = new Set(assignedPlayers);
      if (assignedPlayers.length !== uniquePlayers.size) {
        errors.push(
          `Rotation ${rotationIndex + 1} has duplicate player assignments`
        );
      }

      // Check player IDs exist if players are provided
      if (playerIds) {
        for (const playerId of assignedPlayers) {
          if (!playerIds.has(playerId)) {
            errors.push(
              `Rotation ${
                rotationIndex + 1
              } references unknown player: ${playerId}`
            );
          }
        }
      }
    });

    return { errors, warnings };
  }

  /**
   * Validates appearance configuration
   */
  static validateAppearanceConfig(appearance: AppearanceConfig): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate theme
    if (
      appearance.theme &&
      !["light", "dark", "auto"].includes(appearance.theme)
    ) {
      errors.push(
        `Invalid theme "${appearance.theme}". Must be "light", "dark", or "auto"`
      );
    }

    // Validate colors
    const colorFields = [
      "courtColor",
      "courtBackgroundColor",
      "lineColor",
      "netColor",
    ];
    for (const field of colorFields) {
      const color = appearance[field as keyof AppearanceConfig] as string;
      if (color && !this.isValidColor(color)) {
        warnings.push(`Invalid color format for ${field}: ${color}`);
      }
    }

    // Validate player colors
    if (appearance.playerColors) {
      const playerColorValidation = this.validatePlayerColors(
        appearance.playerColors
      );
      warnings.push(...playerColorValidation.warnings);
    }

    // Validate player size
    if (
      appearance.playerSize &&
      (appearance.playerSize < 0.1 || appearance.playerSize > 5)
    ) {
      warnings.push("Player size should be between 0.1 and 5");
    }

    // Validate font sizes
    if (appearance.fontSize) {
      const fontSizes = appearance.fontSize;
      if (fontSizes.playerNames && fontSizes.playerNames < 6) {
        warnings.push("Player names font size should be at least 6px");
      }
      if (fontSizes.positionLabels && fontSizes.positionLabels < 6) {
        warnings.push("Position labels font size should be at least 6px");
      }
      if (fontSizes.violations && fontSizes.violations < 8) {
        warnings.push("Violations font size should be at least 8px");
      }
    }

    return { errors, warnings };
  }

  /**
   * Validates player colors configuration
   */
  static validatePlayerColors(playerColors: PlayerColorConfig): {
    warnings: string[];
  } {
    const warnings: string[] = [];

    for (const [key, color] of Object.entries(playerColors)) {
      if (color && !this.isValidColor(color)) {
        warnings.push(`Invalid color format for ${key}: ${color}`);
      }
    }

    return { warnings };
  }

  /**
   * Validates animation configuration
   */
  static validateAnimationConfig(animation: AnimationConfig): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate animation duration
    if (
      animation.animationDuration &&
      (animation.animationDuration < 0 || animation.animationDuration > 5000)
    ) {
      warnings.push("Animation duration should be between 0 and 5000ms");
    }

    // Validate stagger delay
    if (
      animation.staggerDelay &&
      (animation.staggerDelay < 0 || animation.staggerDelay > 1000)
    ) {
      warnings.push("Stagger delay should be between 0 and 1000ms");
    }

    // Validate custom transitions
    if (animation.customTransitions) {
      for (const [key, transition] of Object.entries(
        animation.customTransitions
      )) {
        if (transition.duration < 0 || transition.duration > 5000) {
          warnings.push(
            `Custom transition "${key}" duration should be between 0 and 5000ms`
          );
        }
        if (
          transition.delay &&
          (transition.delay < 0 || transition.delay > 2000)
        ) {
          warnings.push(
            `Custom transition "${key}" delay should be between 0 and 2000ms`
          );
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Checks if a color string is valid (hex, rgb, rgba, hsl, or named color)
   */
  static isValidColor(color: string): boolean {
    // Check hex colors
    if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
      return true;
    }

    // Check rgb/rgba colors
    if (
      /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/i.test(color)
    ) {
      return true;
    }

    // Check hsl/hsla colors
    if (
      /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/i.test(color)
    ) {
      return true;
    }

    // Check named colors (basic set)
    const namedColors = [
      "red",
      "green",
      "blue",
      "yellow",
      "orange",
      "purple",
      "pink",
      "brown",
      "black",
      "white",
      "gray",
      "grey",
      "transparent",
      "currentcolor",
    ];
    if (namedColors.includes(color.toLowerCase())) {
      return true;
    }

    return false;
  }

  /**
   * Merges user configuration with default configuration
   */
  static mergeConfigurations(
    defaultConfig: Required<VolleyballCourtConfig>,
    userConfig?: VolleyballCourtConfig
  ): Required<VolleyballCourtConfig> {
    if (!userConfig) {
      return defaultConfig;
    }

    return {
      ...defaultConfig,
      ...userConfig,
      players: {
        "5-1": userConfig.players?.["5-1"] || defaultConfig.players["5-1"],
        "6-2": userConfig.players?.["6-2"] || defaultConfig.players["6-2"],
      },
      rotations: {
        "5-1": userConfig?.rotations?.["5-1"] || defaultConfig.rotations["5-1"],
        "6-2": userConfig.rotations?.["6-2"] || defaultConfig.rotations["6-2"],
      },
      controls: {
        ...defaultConfig.controls,
        ...userConfig.controls,
        customControls: [
          ...defaultConfig.controls.customControls,
          ...(userConfig.controls?.customControls || []),
        ],
      },
      validation: {
        ...defaultConfig.validation,
        ...userConfig.validation,
        customRules: [
          ...defaultConfig.validation.customRules,
          ...(userConfig.validation?.customRules || []),
        ],
      },
      appearance: {
        ...defaultConfig.appearance,
        ...userConfig.appearance,
        playerColors: {
          ...defaultConfig.appearance.playerColors,
          ...userConfig.appearance?.playerColors,
        },
        fontSize: {
          ...defaultConfig.appearance.fontSize,
          ...userConfig.appearance?.fontSize,
        },
      },
      animation: {
        ...defaultConfig.animation,
        ...userConfig.animation,
        customTransitions: {
          ...defaultConfig.animation.customTransitions,
          ...userConfig.animation?.customTransitions,
        },
      },
      interaction: {
        ...defaultConfig.interaction,
        ...userConfig.interaction,
      },
      accessibility: {
        ...defaultConfig.accessibility,
        ...userConfig.accessibility,
        customAriaLabels: {
          ...defaultConfig.accessibility.customAriaLabels,
          ...userConfig.accessibility?.customAriaLabels,
        },
      },
      performance: {
        ...defaultConfig.performance,
        ...userConfig.performance,
      },
      localization: {
        ...defaultConfig.localization,
        ...userConfig.localization,
        translations: {
          ...defaultConfig.localization.translations,
          ...userConfig.localization?.translations,
        },
      },
      export: {
        ...defaultConfig.export,
        ...userConfig.export,
      },
      custom: {
        ...defaultConfig.custom,
        ...userConfig.custom,
      },
    };
  }

  /**
   * Creates a custom player configuration
   */
  static createCustomPlayer(
    id: string,
    name: string,
    role: "S" | "OPP" | "OH" | "MB",
    options?: {
      color?: string;
      number?: number;
      avatar?: string;
      locked?: boolean;
      hidden?: boolean;
      size?: number;
      customData?: Record<string, unknown>;
    }
  ): PlayerDefinition {
    return {
      id,
      name,
      role,
      color: options?.color,
      number: options?.number,
      avatar: options?.avatar,
      locked: options?.locked || false,
      hidden: options?.hidden || false,
      size: options?.size || 1,
      customData: options?.customData || {},
    };
  }

  /**
   * Creates a custom rotation mapping
   */
  static createCustomRotation(playerMappings: {
    [position: number]: string;
  }): RotationMapping {
    // Validate that all positions 1-6 are mapped
    const positions = Object.keys(playerMappings).map(Number).sort();
    const expectedPositions = [1, 2, 3, 4, 5, 6];

    for (const pos of expectedPositions) {
      if (!positions.includes(pos)) {
        throw new Error(`Missing position ${pos} in rotation mapping`);
      }
    }

    return playerMappings;
  }

  /**
   * Creates a custom rule configuration
   */
  static createCustomRule(
    id: string,
    name: string,
    description: string,
    validator: (
      positions: Record<string, PlayerPosition>,
      context: ValidationContext
    ) => boolean,
    message: string,
    options?: {
      enabled?: boolean;
      severity?: "error" | "warning" | "info";
    }
  ): CustomRuleConfig {
    return {
      id,
      name,
      description,
      enabled: options?.enabled ?? true,
      severity: options?.severity || "error",
      validator,
      message,
    };
  }

  /**
   * Applies theme-based styling
   */
  static applyThemeStyles(
    theme: "light" | "dark",
    customStyles?: Partial<AppearanceConfig>
  ): AppearanceConfig {
    const baseTheme: AppearanceConfig = {
      theme,
      courtColor: theme === "dark" ? "#1f2937" : "#2563eb",
      courtBackgroundColor: theme === "dark" ? "#111827" : "#ffffff",
      lineColor: theme === "dark" ? "#f9fafb" : "#ffffff",
      netColor: theme === "dark" ? "#f9fafb" : "#000000",
      playerColors: {
        S: theme === "dark" ? "#34d399" : "#10b981",
        OPP: theme === "dark" ? "#fbbf24" : "#f59e0b",
        OH: theme === "dark" ? "#60a5fa" : "#3b82f6",
        MB: theme === "dark" ? "#f87171" : "#ef4444",
        frontRow: theme === "dark" ? "#f9fafb" : "#1f2937",
        backRow: theme === "dark" ? "#d1d5db" : "#6b7280",
        serving: theme === "dark" ? "#fcd34d" : "#fbbf24",
        dragging: theme === "dark" ? "#a78bfa" : "#8b5cf6",
        violation: theme === "dark" ? "#f87171" : "#dc2626",
      },
      playerSize: 1,
      showPlayerNames: true,
      showPositionLabels: true,
      showPlayerNumbers: false,
      showCourtGrid: false,
      showCourtZones: true,
      customCSS: "",
      fontFamily: "system-ui, sans-serif",
      fontSize: {
        playerNames: 12,
        positionLabels: 10,
        violations: 14,
      },
    };

    return {
      ...baseTheme,
      ...customStyles,
      playerColors: {
        ...baseTheme.playerColors,
        ...customStyles?.playerColors,
      },
      fontSize: {
        ...baseTheme.fontSize,
        ...customStyles?.fontSize,
      },
    };
  }

  /**
   * Generates configuration presets for common use cases
   */
  static getConfigurationPresets(): Record<
    string,
    Partial<VolleyballCourtConfig>
  > {
    return {
      // Minimal configuration for embedding
      minimal: {
        controls: {
          showSystemSelector: false,
          showRotationControls: false,
          showFormationSelector: false,
          showResetButton: false,
          showShareButton: false,
          showAnimateButton: false,
          controlsStyle: "minimal",
        },
        validation: {
          showViolationDetails: false,
          showConstraintBoundaries: false,
        },
        appearance: {
          showPlayerNames: false,
          showPositionLabels: false,
        },
      },

      // Educational configuration with detailed feedback
      educational: {
        validation: {
          enableRealTimeValidation: true,
          showConstraintBoundaries: true,
          showViolationDetails: true,
          enableEducationalMessages: true,
          strictMode: true,
        },
        appearance: {
          showPlayerNames: true,
          showPositionLabels: true,
          showPlayerNumbers: true,
          showCourtGrid: true,
        },
        controls: {
          showValidationToggle: true,
          controlsStyle: "expanded",
        },
      },

      // Presentation mode for coaches
      presentation: {
        controls: {
          showSystemSelector: true,
          showRotationControls: true,
          showFormationSelector: true,
          showAnimateButton: true,
          controlsPosition: "bottom",
          controlsStyle: "expanded",
        },
        animation: {
          enableAnimations: true,
          enableFormationTransitions: true,
          enableRotationAnimations: true,
          animationDuration: 500,
        },
        appearance: {
          showPlayerNames: true,
          showPlayerNumbers: true,
          playerSize: 1.2,
        },
      },

      // High contrast for accessibility
      highContrast: {
        appearance: {
          theme: "dark",
          playerColors: {
            S: "#00ff00",
            OPP: "#ffff00",
            OH: "#00ffff",
            MB: "#ff00ff",
            frontRow: "#ffffff",
            backRow: "#cccccc",
            serving: "#ffaa00",
            dragging: "#ff0000",
            violation: "#ff0000",
          },
          courtColor: "#000000",
          courtBackgroundColor: "#000000",
          lineColor: "#ffffff",
          netColor: "#ffffff",
        },
        accessibility: {
          enableHighContrast: true,
          enableScreenReader: true,
          announceViolations: true,
          focusIndicatorStyle: "glow",
        },
      },

      // Performance optimized for large displays
      performance: {
        performance: {
          enableVirtualization: true,
          enableCaching: true,
          debounceValidation: 200,
          throttleDragUpdates: 32,
        },
        animation: {
          enableAnimations: false,
          enableDragAnimations: false,
        },
        validation: {
          enableRealTimeValidation: false,
        },
      },
    };
  }
}

/**
 * Player customization utilities
 */
export class PlayerCustomization {
  /**
   * Creates a complete custom player set for a system
   */
  static createCustomPlayerSet(
    system: SystemType,
    playerData: Array<{
      name: string;
      role: "S" | "OPP" | "OH" | "MB";
      number?: number;
      color?: string;
    }>
  ): PlayerDefinition[] {
    if (playerData.length !== 6) {
      throw new Error(`${system} system requires exactly 6 players`);
    }

    return playerData.map((data, index) => ({
      id: `${data.role}${index + 1}`,
      name: data.name,
      role: data.role,
      number: data.number || index + 1,
      color: data.color,
    }));
  }

  /**
   * Applies color scheme to players
   */
  static applyColorScheme(
    players: PlayerDefinition[],
    colorScheme: "role" | "position" | "custom",
    customColors?: Record<string, string>
  ): PlayerDefinition[] {
    return players.map((player) => {
      let color: string;

      switch (colorScheme) {
        case "role":
          color = this.getRoleColor(player.role);
          break;
        case "position":
          color = this.getPositionColor(player.id);
          break;
        case "custom":
          color = customColors?.[player.id] || player.color || "#6b7280";
          break;
        default:
          color = player.color || "#6b7280";
      }

      return { ...player, color };
    });
  }

  /**
   * Gets default color for a role
   */
  static getRoleColor(role: "S" | "OPP" | "OH" | "MB"): string {
    const roleColors = {
      S: "#10b981", // Green for setters
      OPP: "#f59e0b", // Amber for opposite
      OH: "#3b82f6", // Blue for outside hitters
      MB: "#ef4444", // Red for middle blockers
    };
    return roleColors[role];
  }

  /**
   * Gets default color for a position
   */
  static getPositionColor(playerId: string): string {
    // Generate consistent color based on player ID
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
      hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }
}

/**
 * Rotation customization utilities
 */
export class RotationCustomization {
  /**
   * Creates custom rotations based on a formation pattern
   */
  static createFormationRotations(
    system: SystemType,
    baseFormation: RotationMapping,
    players: PlayerDefinition[]
  ): RotationMapping[] {
    const rotations: RotationMapping[] = [];
    const playerIds = players.map((p) => p.id);

    // Create 6 rotations by rotating players clockwise
    for (let rotation = 0; rotation < 6; rotation++) {
      const rotationMapping: RotationMapping = {};

      for (let position = 1; position <= 6; position++) {
        // Calculate the rotated position
        const originalPosition = ((position - rotation - 1 + 6) % 6) + 1;
        const playerId = baseFormation[originalPosition];
        rotationMapping[position] = playerId;
      }

      rotations.push(rotationMapping);
    }

    return rotations;
  }

  /**
   * Validates that rotations follow volleyball rules
   */
  static validateRotationSequence(
    rotations: RotationMapping[],
    system: SystemType
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (rotations.length !== 6) {
      errors.push("Must have exactly 6 rotations");
      return { isValid: false, errors };
    }

    // Check that each rotation is a valid rotation of the first
    const firstRotation = rotations[0];
    const playerIds = Object.values(firstRotation);

    for (let i = 1; i < rotations.length; i++) {
      const currentRotation = rotations[i];
      const currentPlayerIds = Object.values(currentRotation);

      // Check same players are used
      if (
        !playerIds.every((id) => currentPlayerIds.includes(id)) ||
        playerIds.length !== currentPlayerIds.length
      ) {
        errors.push(`Rotation ${i + 1} uses different players than rotation 1`);
      }

      // Check rotation pattern (each player should move one position clockwise)
      for (let pos = 1; pos <= 6; pos++) {
        const expectedPlayerId = firstRotation[((pos - i - 1 + 6) % 6) + 1];
        const actualPlayerId = currentRotation[pos];
        if (expectedPlayerId !== actualPlayerId) {
          errors.push(
            `Rotation ${
              i + 1
            } position ${pos} should have ${expectedPlayerId} but has ${actualPlayerId}`
          );
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

/**
 * Configuration builder for fluent API
 */
export class ConfigurationBuilder {
  private config: Partial<VolleyballCourtConfig> = {};

  /**
   * Sets the initial system type
   */
  system(system: SystemType): ConfigurationBuilder {
    this.config.initialSystem = system;
    return this;
  }

  /**
   * Sets the initial rotation
   */
  rotation(rotation: number): ConfigurationBuilder {
    this.config.initialRotation = rotation;
    return this;
  }

  /**
   * Sets the initial formation
   */
  formation(formation: FormationType): ConfigurationBuilder {
    this.config.initialFormation = formation;
    return this;
  }

  /**
   * Configures players for a system
   */
  players(
    system: SystemType,
    players: PlayerDefinition[]
  ): ConfigurationBuilder {
    if (!this.config.players) {
      this.config.players = { "5-1": [], "6-2": [] };
    }
    this.config.players[system] = players;
    return this;
  }

  /**
   * Adds a custom player
   */
  addPlayer(
    system: SystemType,
    id: string,
    name: string,
    role: "S" | "OPP" | "OH" | "MB",
    options?: {
      color?: string;
      number?: number;
      avatar?: string;
      locked?: boolean;
      hidden?: boolean;
      size?: number;
    }
  ): ConfigurationBuilder {
    if (!this.config.players) {
      this.config.players = { "5-1": [], "6-2": [] };
    }
    if (!this.config.players[system]) {
      this.config.players[system] = [];
    }

    const player = ConfigurationManager.createCustomPlayer(
      id,
      name,
      role,
      options
    );
    this.config.players[system].push(player);
    return this;
  }

  /**
   * Configures rotations for a system
   */
  rotations(
    system: SystemType,
    rotations: RotationMapping[]
  ): ConfigurationBuilder {
    if (!this.config.rotations) {
      this.config.rotations = { "5-1": [], "6-2": [] };
    }
    this.config.rotations[system] = rotations;
    return this;
  }

  /**
   * Configures appearance settings
   */
  appearance(appearance: Partial<AppearanceConfig>): ConfigurationBuilder {
    this.config.appearance = {
      ...this.config.appearance,
      ...appearance,
    };
    return this;
  }

  /**
   * Sets the theme
   */
  theme(theme: "light" | "dark" | "auto"): ConfigurationBuilder {
    if (!this.config.appearance) {
      this.config.appearance = {};
    }
    this.config.appearance.theme = theme;
    return this;
  }

  /**
   * Configures player colors
   */
  playerColors(colors: Partial<PlayerColorConfig>): ConfigurationBuilder {
    if (!this.config.appearance) {
      this.config.appearance = {};
    }
    this.config.appearance.playerColors = {
      ...this.config.appearance.playerColors,
      ...colors,
    };
    return this;
  }

  /**
   * Configures controls
   */
  controls(controls: Partial<ControlsConfig>): ConfigurationBuilder {
    this.config.controls = {
      ...this.config.controls,
      ...controls,
    };
    return this;
  }

  /**
   * Shows or hides specific controls
   */
  showControls(controls: {
    systemSelector?: boolean;
    rotationControls?: boolean;
    formationSelector?: boolean;
    resetButton?: boolean;
    shareButton?: boolean;
    animateButton?: boolean;
  }): ConfigurationBuilder {
    if (!this.config.controls) {
      this.config.controls = {};
    }

    Object.assign(this.config.controls, {
      showSystemSelector: controls.systemSelector,
      showRotationControls: controls.rotationControls,
      showFormationSelector: controls.formationSelector,
      showResetButton: controls.resetButton,
      showShareButton: controls.shareButton,
      showAnimateButton: controls.animateButton,
    });
    return this;
  }

  /**
   * Configures validation settings
   */
  validation(validation: Partial<ValidationConfig>): ConfigurationBuilder {
    this.config.validation = {
      ...this.config.validation,
      ...validation,
    };
    return this;
  }

  /**
   * Enables or disables real-time validation
   */
  realTimeValidation(enabled: boolean): ConfigurationBuilder {
    if (!this.config.validation) {
      this.config.validation = {};
    }
    this.config.validation.enableRealTimeValidation = enabled;
    return this;
  }

  /**
   * Configures animation settings
   */
  animation(animation: Partial<AnimationConfig>): ConfigurationBuilder {
    this.config.animation = {
      ...this.config.animation,
      ...animation,
    };
    return this;
  }

  /**
   * Enables or disables animations
   */
  animations(enabled: boolean): ConfigurationBuilder {
    if (!this.config.animation) {
      this.config.animation = {};
    }
    this.config.animation.enableAnimations = enabled;
    return this;
  }

  /**
   * Applies a preset configuration
   */
  preset(presetName: string): ConfigurationBuilder {
    const presets = ConfigurationManager.getConfigurationPresets();
    const preset = presets[presetName];
    if (preset) {
      this.config = ConfigurationManager.mergeConfigurations(
        this.config as Required<VolleyballCourtConfig>,
        preset
      );
    }
    return this;
  }

  /**
   * Builds the final configuration
   */
  build(): VolleyballCourtConfig {
    return this.config;
  }
}

/**
 * Theme customization utilities
 */
export class ThemeCustomization {
  /**
   * Creates a custom theme configuration
   */
  static createCustomTheme(
    name: string,
    baseTheme: "light" | "dark",
    customizations: {
      courtColor?: string;
      courtBackgroundColor?: string;
      lineColor?: string;
      netColor?: string;
      playerColors?: Partial<PlayerColorConfig>;
      fontSize?: {
        playerNames?: number;
        positionLabels?: number;
        violations?: number;
      };
    }
  ): AppearanceConfig {
    const baseConfig = ConfigurationManager.applyThemeStyles(baseTheme);

    return {
      ...baseConfig,
      courtColor: customizations.courtColor || baseConfig.courtColor,
      courtBackgroundColor:
        customizations.courtBackgroundColor || baseConfig.courtBackgroundColor,
      lineColor: customizations.lineColor || baseConfig.lineColor,
      netColor: customizations.netColor || baseConfig.netColor,
      playerColors: {
        ...baseConfig.playerColors,
        ...customizations.playerColors,
      },
      fontSize: {
        ...baseConfig.fontSize,
        ...customizations.fontSize,
      },
    };
  }

  /**
   * Creates a color palette for players based on a base color
   */
  static createPlayerColorPalette(
    baseColor: string,
    options?: {
      saturation?: number;
      lightness?: number;
      hueShift?: number;
    }
  ): PlayerColorConfig {
    const { saturation = 70, lightness = 50, hueShift = 60 } = options || {};

    // Extract hue from base color (simplified - assumes HSL format)
    let baseHue = 0;
    if (baseColor.startsWith("hsl")) {
      const match = baseColor.match(/hsl\((\d+),/);
      if (match) {
        baseHue = parseInt(match[1]);
      }
    }

    return {
      S: `hsl(${baseHue}, ${saturation}%, ${lightness}%)`,
      Opp: `hsl(${(baseHue + hueShift) % 360}, ${saturation}%, ${lightness}%)`,
      OH: `hsl(${
        (baseHue + hueShift * 2) % 360
      }, ${saturation}%, ${lightness}%)`,
      MB: `hsl(${
        (baseHue + hueShift * 3) % 360
      }, ${saturation}%, ${lightness}%)`,
      frontRow: `hsl(${baseHue}, ${saturation - 20}%, ${lightness - 20}%)`,
      backRow: `hsl(${baseHue}, ${saturation - 30}%, ${lightness - 30}%)`,
      serving: `hsl(${(baseHue + 30) % 360}, ${saturation + 10}%, ${
        lightness + 10
      }%)`,
      dragging: `hsl(${(baseHue + 180) % 360}, ${saturation}%, ${lightness}%)`,
      violation: `hsl(0, 80%, 60%)`, // Always red for violations
    };
  }

  /**
   * Gets predefined color schemes
   */
  static getColorSchemes(): Record<string, PlayerColorConfig> {
    return {
      default: {
        S: "#10b981", // Green
        OPP: "#f59e0b", // Amber
        OH: "#3b82f6", // Blue
        MB: "#ef4444", // Red
        frontRow: "#1f2937",
        backRow: "#6b7280",
        serving: "#fbbf24",
        dragging: "#8b5cf6",
        violation: "#dc2626",
      },
      ocean: {
        S: "#0891b2", // Cyan
        OPP: "#0284c7", // Sky
        OH: "#1d4ed8", // Blue
        MB: "#4338ca", // Indigo
        frontRow: "#0f172a",
        backRow: "#475569",
        serving: "#06b6d4",
        dragging: "#7c3aed",
        violation: "#dc2626",
      },
      forest: {
        S: "#059669", // Emerald
        OPP: "#65a30d", // Lime
        OH: "#16a34a", // Green
        MB: "#15803d", // Green
        frontRow: "#14532d",
        backRow: "#4b5563",
        serving: "#84cc16",
        dragging: "#a855f7",
        violation: "#dc2626",
      },
      sunset: {
        S: "#ea580c", // Orange
        OPP: "#dc2626", // Red
        OH: "#c2410c", // Orange
        MB: "#991b1b", // Red
        frontRow: "#431407",
        backRow: "#6b7280",
        serving: "#f97316",
        dragging: "#9333ea",
        violation: "#dc2626",
      },
      monochrome: {
        S: "#000000",
        OPP: "#374151",
        OH: "#6b7280",
        MB: "#9ca3af",
        frontRow: "#111827",
        backRow: "#4b5563",
        serving: "#1f2937",
        dragging: "#6366f1",
        violation: "#dc2626",
      },
    };
  }
}

/**
 * Advanced configuration utilities
 */
export class AdvancedConfiguration {
  /**
   * Creates a configuration for specific use cases
   */
  static createUseCaseConfiguration(
    useCase: "training" | "presentation" | "analysis" | "mobile" | "print"
  ): Partial<VolleyballCourtConfig> {
    const presets = ConfigurationManager.getConfigurationPresets();

    switch (useCase) {
      case "training":
        return presets.training || presets.educational;
      case "presentation":
        return presets.presentation;
      case "analysis":
        return {
          ...presets.educational,
          controls: {
            ...presets.educational.controls,
            showUndoRedoButtons: true,
            showValidationToggle: true,
          },
          validation: {
            ...presets.educational.validation,
            enableEducationalMessages: true,
            strictMode: false,
          },
        };
      case "mobile":
        return presets.mobile;
      case "print":
        return presets.print;
      default:
        return presets.educational;
    }
  }

  /**
   * Creates a responsive configuration based on screen size
   */
  static createResponsiveConfiguration(
    screenWidth: number,
    screenHeight: number
  ): Partial<VolleyballCourtConfig> {
    const isMobile = screenWidth < 768;
    const isTablet = screenWidth >= 768 && screenWidth < 1024;
    const isDesktop = screenWidth >= 1024;

    if (isMobile) {
      return {
        controls: {
          controlsPosition: "bottom",
          controlsStyle: "compact",
          showFormationSelector: false,
          showAnimateButton: false,
        },
        appearance: {
          playerSize: 1.2,
          showPlayerNames: false,
          showPlayerNumbers: true,
          fontSize: {
            playerNames: 10,
            positionLabels: 8,
            violations: 12,
          },
        },
        performance: {
          throttleDragUpdates: 32,
          debounceValidation: 150,
        },
      };
    } else if (isTablet) {
      return {
        controls: {
          controlsPosition: "top",
          controlsStyle: "compact",
        },
        appearance: {
          playerSize: 1.1,
          showPlayerNames: true,
          showPlayerNumbers: true,
        },
      };
    } else {
      return {
        controls: {
          controlsPosition: "top",
          controlsStyle: "expanded",
        },
        appearance: {
          playerSize: 1.0,
          showPlayerNames: true,
          showPlayerNumbers: true,
          showPositionLabels: true,
        },
      };
    }
  }

  /**
   * Creates an accessibility-optimized configuration
   */
  static createAccessibilityConfiguration(options?: {
    highContrast?: boolean;
    largeText?: boolean;
    reducedMotion?: boolean;
    screenReader?: boolean;
  }): Partial<VolleyballCourtConfig> {
    const { highContrast, largeText, reducedMotion, screenReader } =
      options || {};

    return {
      accessibility: {
        enableScreenReader: screenReader !== false,
        enableKeyboardNavigation: true,
        enableHighContrast: highContrast || false,
        announceViolations: true,
        focusIndicatorStyle: "glow",
      },
      appearance: {
        ...(highContrast && {
          theme: "dark",
          playerColors: ThemeCustomization.getColorSchemes().monochrome,
        }),
        ...(largeText && {
          fontSize: {
            playerNames: 16,
            positionLabels: 14,
            violations: 18,
          },
          playerSize: 1.3,
        }),
      },
      animation: {
        ...(reducedMotion && {
          enableAnimations: false,
          enableDragAnimations: false,
          enableFormationTransitions: false,
          enableRotationAnimations: false,
        }),
      },
      validation: {
        showViolationDetails: true,
        enableEducationalMessages: true,
      },
    };
  }

  /**
   * Validates configuration compatibility
   */
  static validateConfigurationCompatibility(config: VolleyballCourtConfig): {
    isCompatible: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for conflicting settings
    if (
      config.animation?.enableAnimations === false &&
      config.animation?.bounceOnViolation
    ) {
      warnings.push(
        "Bounce on violation is enabled but animations are disabled"
      );
      suggestions.push("Enable animations or disable bounce on violation");
    }

    if (
      config.appearance?.theme === "dark" &&
      config.export?.enableImageExport
    ) {
      suggestions.push(
        "Consider using light theme for better print/export quality"
      );
    }

    if (
      config.performance?.enableVirtualization &&
      config.animation?.enableAnimations
    ) {
      warnings.push("Virtualization and animations may conflict");
      suggestions.push("Consider disabling animations for better performance");
    }

    if (
      config.accessibility?.enableHighContrast &&
      !config.appearance?.playerColors
    ) {
      suggestions.push(
        "Define custom high-contrast player colors for better accessibility"
      );
    }

    return {
      isCompatible: warnings.length === 0,
      warnings,
      suggestions,
    };
  }
}
