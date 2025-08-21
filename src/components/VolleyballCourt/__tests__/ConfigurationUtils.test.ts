/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  ConfigurationManager,
  PlayerCustomization,
  RotationCustomization,
} from "../ConfigurationUtils";
import {
  VolleyballCourtConfig,
  PlayerDefinition,
  AppearanceConfig,
  ValidationConfig,
  AnimationConfig,
} from "../types";
import { SystemType } from "@/types";

describe("ConfigurationManager", () => {
  describe("validateConfig", () => {
    it("should validate a complete valid configuration", () => {
      const validConfig: VolleyballCourtConfig = {
        initialSystem: "5-1",
        initialRotation: 0,
        initialFormation: "base",
        players: {
          "5-1": [
            { id: "S", name: "Setter", role: "S", number: 1 },
            { id: "Opp", name: "Opposite", role: "Opp", number: 2 },
            { id: "OH1", name: "Outside 1", role: "OH", number: 3 },
            { id: "OH2", name: "Outside 2", role: "OH", number: 4 },
            { id: "MB1", name: "Middle 1", role: "MB", number: 5 },
            { id: "MB2", name: "Middle 2", role: "MB", number: 6 },
          ],
          "6-2": [
            { id: "S1", name: "Setter 1", role: "S", number: 1 },
            { id: "S2", name: "Setter 2", role: "S", number: 2 },
            { id: "OH1", name: "Outside 1", role: "OH", number: 3 },
            { id: "OH2", name: "Outside 2", role: "OH", number: 4 },
            { id: "MB1", name: "Middle 1", role: "MB", number: 5 },
            { id: "MB2", name: "Middle 2", role: "MB", number: 6 },
          ],
        },
        appearance: {
          theme: "light",
          courtColor: "#2563eb",
          playerSize: 1,
        },
      };

      const result = ConfigurationManager.validateConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect invalid player configuration", () => {
      const invalidConfig: VolleyballCourtConfig = {
        players: {
          "5-1": [
            { id: "S", name: "Setter", role: "S" },
            { id: "S", name: "Duplicate", role: "S" }, // Duplicate ID
            { id: "OH1", name: "Outside 1", role: "OH" },
            { id: "OH2", name: "Outside 2", role: "OH" },
            { id: "MB1", name: "Middle 1", role: "MB" },
          ], // Missing one player
          "6-2": [],
        },
      };

      const result = ConfigurationManager.validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("5-1 system must have exactly 6 players");
      expect(result.errors).toContain("Duplicate player ID: S");
      expect(result.errors).toContain("5-1 system must have exactly 1 setter");
    });

    it("should detect invalid appearance configuration", () => {
      const invalidConfig: VolleyballCourtConfig = {
        appearance: {
          theme: "invalid" as any,
          courtColor: "not-a-color",
          playerSize: -1,
        },
      };

      const result = ConfigurationManager.validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid theme "invalid". Must be "light", "dark", or "auto"'
      );
      expect(result.warnings).toContain(
        "Invalid color format for courtColor: not-a-color"
      );
      expect(result.warnings).toContain(
        "Player size should be between 0.1 and 5"
      );
    });
  });

  describe("validatePlayersConfig", () => {
    it("should validate correct player counts for each system", () => {
      const validPlayers = {
        "5-1": [
          { id: "S", name: "Setter", role: "S" as const },
          { id: "Opp", name: "Opposite", role: "Opp" as const },
          { id: "OH1", name: "Outside 1", role: "OH" as const },
          { id: "OH2", name: "Outside 2", role: "OH" as const },
          { id: "MB1", name: "Middle 1", role: "MB" as const },
          { id: "MB2", name: "Middle 2", role: "MB" as const },
        ],
        "6-2": [
          { id: "S1", name: "Setter 1", role: "S" as const },
          { id: "S2", name: "Setter 2", role: "S" as const },
          { id: "OH1", name: "Outside 1", role: "OH" as const },
          { id: "OH2", name: "Outside 2", role: "OH" as const },
          { id: "MB1", name: "Middle 1", role: "MB" as const },
          { id: "MB2", name: "Middle 2", role: "MB" as const },
        ],
      };

      const result = ConfigurationManager.validatePlayersConfig(validPlayers);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect incorrect setter counts", () => {
      const invalidPlayers = {
        "5-1": [
          { id: "S1", name: "Setter 1", role: "S" as const },
          { id: "S2", name: "Setter 2", role: "S" as const }, // Too many setters
          { id: "OH1", name: "Outside 1", role: "OH" as const },
          { id: "OH2", name: "Outside 2", role: "OH" as const },
          { id: "MB1", name: "Middle 1", role: "MB" as const },
          { id: "MB2", name: "Middle 2", role: "MB" as const },
        ],
        "6-2": [
          { id: "S1", name: "Setter 1", role: "S" as const }, // Too few setters
          { id: "Opp", name: "Opposite", role: "Opp" as const },
          { id: "OH1", name: "Outside 1", role: "OH" as const },
          { id: "OH2", name: "Outside 2", role: "OH" as const },
          { id: "MB1", name: "Middle 1", role: "MB" as const },
          { id: "MB2", name: "Middle 2", role: "MB" as const },
        ],
      };

      const result = ConfigurationManager.validatePlayersConfig(invalidPlayers);
      expect(result.errors).toContain("5-1 system must have exactly 1 setter");
      expect(result.errors).toContain("6-2 system must have exactly 2 setters");
    });

    it("should detect duplicate player IDs and numbers", () => {
      const invalidPlayers = {
        "5-1": [
          { id: "S", name: "Setter", role: "S" as const, number: 1 },
          { id: "S", name: "Duplicate ID", role: "Opp" as const, number: 1 }, // Duplicate ID and number
          { id: "OH1", name: "Outside 1", role: "OH" as const },
          { id: "OH2", name: "Outside 2", role: "OH" as const },
          { id: "MB1", name: "Middle 1", role: "MB" as const },
          { id: "MB2", name: "Middle 2", role: "MB" as const },
        ],
        "6-2": [],
      };

      const result = ConfigurationManager.validatePlayersConfig(invalidPlayers);
      expect(result.errors).toContain("Duplicate player ID: S");
      expect(result.warnings).toContain("Duplicate player number: 1");
    });
  });

  describe("validateRotationsConfig", () => {
    it("should validate correct rotation mappings", () => {
      const validRotations = {
        "5-1": [
          { 1: "S", 2: "MB1", 3: "Opp", 4: "MB2", 5: "OH1", 6: "OH2" },
          { 1: "OH2", 2: "S", 3: "MB1", 4: "Opp", 5: "MB2", 6: "OH1" },
          { 1: "OH1", 2: "OH2", 3: "S", 4: "MB1", 5: "Opp", 6: "MB2" },
          { 1: "MB2", 2: "OH1", 3: "OH2", 4: "S", 5: "MB1", 6: "Opp" },
          { 1: "Opp", 2: "MB2", 3: "OH1", 4: "OH2", 5: "S", 6: "MB1" },
          { 1: "MB1", 2: "Opp", 3: "MB2", 4: "OH1", 5: "OH2", 6: "S" },
        ],
        "6-2": [
          { 1: "S1", 2: "MB1", 3: "S2", 4: "MB2", 5: "OH1", 6: "OH2" },
          { 1: "OH2", 2: "S1", 3: "MB1", 4: "S2", 5: "MB2", 6: "OH1" },
          { 1: "OH1", 2: "OH2", 3: "S1", 4: "MB1", 5: "S2", 6: "MB2" },
          { 1: "MB2", 2: "OH1", 3: "OH2", 4: "S1", 5: "MB1", 6: "S2" },
          { 1: "S2", 2: "MB2", 3: "OH1", 4: "OH2", 5: "S1", 6: "MB1" },
          { 1: "MB1", 2: "S2", 3: "MB2", 4: "OH1", 5: "OH2", 6: "S1" },
        ],
      };

      const result =
        ConfigurationManager.validateRotationsConfig(validRotations);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect incorrect rotation counts", () => {
      const invalidRotations = {
        "5-1": [
          { 1: "S", 2: "MB1", 3: "Opp", 4: "MB2", 5: "OH1", 6: "OH2" },
          // Missing rotations
        ],
        "6-2": [],
      };

      const result =
        ConfigurationManager.validateRotationsConfig(invalidRotations);
      expect(result.errors).toContain(
        "5-1 system must have exactly 6 rotations"
      );
    });

    it("should detect missing positions in rotations", () => {
      const invalidRotations = {
        "5-1": [
          { 1: "S", 2: "MB1", 3: "Opp", 4: "MB2", 5: "OH1" } as any, // Missing position 6
          { 1: "OH2", 2: "S", 3: "MB1", 4: "Opp", 5: "MB2", 6: "OH1" },
          { 1: "OH1", 2: "OH2", 3: "S", 4: "MB1", 5: "Opp", 6: "MB2" },
          { 1: "MB2", 2: "OH1", 3: "OH2", 4: "S", 5: "MB1", 6: "Opp" },
          { 1: "Opp", 2: "MB2", 3: "OH1", 4: "OH2", 5: "S", 6: "MB1" },
          { 1: "MB1", 2: "Opp", 3: "MB2", 4: "OH1", 5: "OH2", 6: "S" },
        ],
        "6-2": [],
      };

      const result =
        ConfigurationManager.validateRotationsConfig(invalidRotations);
      expect(result.errors).toContain(
        "Rotation 1 must have exactly 6 positions"
      );
      expect(result.errors).toContain("Rotation 1 missing position 6");
    });
  });

  describe("isValidColor", () => {
    it("should validate hex colors", () => {
      expect(ConfigurationManager.isValidColor("#ff0000")).toBe(true);
      expect(ConfigurationManager.isValidColor("#FF0000")).toBe(true);
      expect(ConfigurationManager.isValidColor("#f00")).toBe(true);
      expect(ConfigurationManager.isValidColor("#F00")).toBe(true);
      expect(ConfigurationManager.isValidColor("ff0000")).toBe(false);
      expect(ConfigurationManager.isValidColor("#gg0000")).toBe(false);
    });

    it("should validate rgb/rgba colors", () => {
      expect(ConfigurationManager.isValidColor("rgb(255, 0, 0)")).toBe(true);
      expect(ConfigurationManager.isValidColor("rgba(255, 0, 0, 0.5)")).toBe(
        true
      );
      expect(ConfigurationManager.isValidColor("rgb(255,0,0)")).toBe(true);
      expect(ConfigurationManager.isValidColor("rgba(255,0,0,0.5)")).toBe(true);
      expect(ConfigurationManager.isValidColor("rgb(256, 0, 0)")).toBe(true); // Still matches pattern
      expect(ConfigurationManager.isValidColor("rgb(255, 0)")).toBe(false);
    });

    it("should validate hsl/hsla colors", () => {
      expect(ConfigurationManager.isValidColor("hsl(0, 100%, 50%)")).toBe(true);
      expect(ConfigurationManager.isValidColor("hsla(0, 100%, 50%, 0.5)")).toBe(
        true
      );
      expect(ConfigurationManager.isValidColor("hsl(0,100%,50%)")).toBe(true);
      expect(ConfigurationManager.isValidColor("hsl(0, 100, 50%)")).toBe(false);
    });

    it("should validate named colors", () => {
      expect(ConfigurationManager.isValidColor("red")).toBe(true);
      expect(ConfigurationManager.isValidColor("blue")).toBe(true);
      expect(ConfigurationManager.isValidColor("transparent")).toBe(true);
      expect(ConfigurationManager.isValidColor("currentColor")).toBe(true);
      expect(ConfigurationManager.isValidColor("notacolor")).toBe(false);
    });
  });

  describe("mergeConfigurations", () => {
    it("should merge configurations correctly", () => {
      const defaultConfig = {
        initialSystem: "5-1" as SystemType,
        players: {
          "5-1": [{ id: "S", name: "Default Setter", role: "S" as const }],
          "6-2": [],
        },
        rotations: {
          "5-1": [{ 1: "S", 2: "OH1", 3: "MB1", 4: "Opp", 5: "OH2", 6: "MB2" }],
          "6-2": [],
        },
        controls: {
          customControls: [],
        },
        validation: {
          customRules: [],
        },
        appearance: {
          theme: "light" as const,
          courtColor: "#blue",
          playerColors: {},
          fontSize: {},
        },
        animation: {
          customTransitions: {},
        },
        accessibility: {
          customAriaLabels: {},
        },
        localization: {
          translations: {},
        },
        custom: {},
      } as any;

      const userConfig = {
        initialSystem: "6-2" as SystemType,
        players: {
          "5-1": [{ id: "S", name: "Custom Setter", role: "S" as const }],
          "6-2": [],
        },
        appearance: {
          courtColor: "#red",
        },
      };

      const merged = ConfigurationManager.mergeConfigurations(
        defaultConfig,
        userConfig
      );

      expect(merged.initialSystem).toBe("6-2");
      expect(merged.players["5-1"][0].name).toBe("Custom Setter");
      expect(merged.appearance.theme).toBe("light"); // From default
      expect(merged.appearance.courtColor).toBe("#red"); // From user
    });
  });

  describe("createCustomPlayer", () => {
    it("should create a custom player with all options", () => {
      const player = ConfigurationManager.createCustomPlayer(
        "TEST",
        "Test Player",
        "S",
        {
          color: "#ff0000",
          number: 10,
          locked: true,
          size: 1.5,
          customData: { position: "setter" },
        }
      );

      expect(player).toEqual({
        id: "TEST",
        name: "Test Player",
        role: "S",
        color: "#ff0000",
        number: 10,
        locked: true,
        hidden: false,
        size: 1.5,
        customData: { position: "setter" },
      });
    });

    it("should create a custom player with minimal options", () => {
      const player = ConfigurationManager.createCustomPlayer(
        "SIMPLE",
        "Simple Player",
        "OH"
      );

      expect(player).toEqual({
        id: "SIMPLE",
        name: "Simple Player",
        role: "OH",
        locked: false,
        hidden: false,
        size: 1,
        customData: {},
      });
    });
  });

  describe("getConfigurationPresets", () => {
    it("should return all expected presets", () => {
      const presets = ConfigurationManager.getConfigurationPresets();

      expect(presets).toHaveProperty("minimal");
      expect(presets).toHaveProperty("educational");
      expect(presets).toHaveProperty("presentation");
      expect(presets).toHaveProperty("highContrast");
      expect(presets).toHaveProperty("performance");
    });

    it("should have valid minimal preset", () => {
      const presets = ConfigurationManager.getConfigurationPresets();
      const minimal = presets.minimal;

      expect(minimal.controls?.showSystemSelector).toBe(false);
      expect(minimal.controls?.showRotationControls).toBe(false);
      expect(minimal.validation?.showViolationDetails).toBe(false);
      expect(minimal.appearance?.showPlayerNames).toBe(false);
    });

    it("should have valid educational preset", () => {
      const presets = ConfigurationManager.getConfigurationPresets();
      const educational = presets.educational;

      expect(educational.validation?.enableRealTimeValidation).toBe(true);
      expect(educational.validation?.showConstraintBoundaries).toBe(true);
      expect(educational.validation?.enableEducationalMessages).toBe(true);
      expect(educational.validation?.strictMode).toBe(true);
    });
  });
});

describe("PlayerCustomization", () => {
  describe("createCustomPlayerSet", () => {
    it("should create a complete player set for 5-1 system", () => {
      const playerData = [
        { name: "John Setter", role: "S" as const, number: 1 },
        { name: "Jane Opposite", role: "Opp" as const, number: 2 },
        { name: "Bob Outside 1", role: "OH" as const, number: 3 },
        { name: "Alice Outside 2", role: "OH" as const, number: 4 },
        { name: "Charlie Middle 1", role: "MB" as const, number: 5 },
        { name: "Diana Middle 2", role: "MB" as const, number: 6 },
      ];

      const players = PlayerCustomization.createCustomPlayerSet(
        "5-1",
        playerData
      );

      expect(players).toHaveLength(6);
      expect(players[0]).toEqual({
        id: "S1",
        name: "John Setter",
        role: "S",
        number: 1,
      });
      expect(players[1]).toEqual({
        id: "Opp2",
        name: "Jane Opposite",
        role: "Opp",
        number: 2,
      });
    });

    it("should throw error for incorrect player count", () => {
      const playerData = [
        { name: "John Setter", role: "S" as const },
        { name: "Jane Opposite", role: "Opp" as const },
      ];

      expect(() => {
        PlayerCustomization.createCustomPlayerSet("5-1", playerData);
      }).toThrow("5-1 system requires exactly 6 players");
    });
  });

  describe("applyColorScheme", () => {
    const testPlayers: PlayerDefinition[] = [
      { id: "S", name: "Setter", role: "S" },
      { id: "Opp", name: "Opposite", role: "Opp" },
      { id: "OH1", name: "Outside 1", role: "OH" },
    ];

    it("should apply role-based colors", () => {
      const coloredPlayers = PlayerCustomization.applyColorScheme(
        testPlayers,
        "role"
      );

      expect(coloredPlayers[0].color).toBe("#10b981"); // Setter green
      expect(coloredPlayers[1].color).toBe("#f59e0b"); // Opposite amber
      expect(coloredPlayers[2].color).toBe("#3b82f6"); // OH blue
    });

    it("should apply custom colors", () => {
      const customColors = {
        S: "#ff0000",
        Opp: "#00ff00",
        OH1: "#0000ff",
      };

      const coloredPlayers = PlayerCustomization.applyColorScheme(
        testPlayers,
        "custom",
        customColors
      );

      expect(coloredPlayers[0].color).toBe("#ff0000");
      expect(coloredPlayers[1].color).toBe("#00ff00");
      expect(coloredPlayers[2].color).toBe("#0000ff");
    });

    it("should generate position-based colors", () => {
      const coloredPlayers = PlayerCustomization.applyColorScheme(
        testPlayers,
        "position"
      );

      // Should generate consistent colors based on player ID
      expect(coloredPlayers[0].color).toMatch(/^hsl\(\d+, 70%, 50%\)$/);
      expect(coloredPlayers[1].color).toMatch(/^hsl\(\d+, 70%, 50%\)$/);
      expect(coloredPlayers[2].color).toMatch(/^hsl\(\d+, 70%, 50%\)$/);

      // Same player ID should generate same color
      const coloredAgain = PlayerCustomization.applyColorScheme(
        testPlayers,
        "position"
      );
      expect(coloredPlayers[0].color).toBe(coloredAgain[0].color);
    });
  });

  describe("getRoleColor", () => {
    it("should return correct colors for each role", () => {
      expect(PlayerCustomization.getRoleColor("S")).toBe("#10b981");
      expect(PlayerCustomization.getRoleColor("Opp")).toBe("#f59e0b");
      expect(PlayerCustomization.getRoleColor("OH")).toBe("#3b82f6");
      expect(PlayerCustomization.getRoleColor("MB")).toBe("#ef4444");
    });
  });
});

describe("RotationCustomization", () => {
  describe("createFormationRotations", () => {
    it("should create 6 rotations from base formation", () => {
      const baseFormation = {
        1: "S",
        2: "MB1",
        3: "Opp",
        4: "MB2",
        5: "OH1",
        6: "OH2",
      };

      const players: PlayerDefinition[] = [
        { id: "S", name: "Setter", role: "S" },
        { id: "MB1", name: "Middle 1", role: "MB" },
        { id: "Opp", name: "Opposite", role: "Opp" },
        { id: "MB2", name: "Middle 2", role: "MB" },
        { id: "OH1", name: "Outside 1", role: "OH" },
        { id: "OH2", name: "Outside 2", role: "OH" },
      ];

      const rotations = RotationCustomization.createFormationRotations(
        "5-1",
        baseFormation,
        players
      );

      expect(rotations).toHaveLength(6);

      // First rotation should match base formation
      expect(rotations[0]).toEqual(baseFormation);

      // Second rotation should be rotated clockwise
      expect(rotations[1]).toEqual({
        1: "OH2",
        2: "S",
        3: "MB1",
        4: "Opp",
        5: "MB2",
        6: "OH1",
      });
    });
  });

  describe("validateRotationSequence", () => {
    it("should validate correct rotation sequence", () => {
      const validRotations = [
        { 1: "S", 2: "MB1", 3: "Opp", 4: "MB2", 5: "OH1", 6: "OH2" },
        { 1: "OH2", 2: "S", 3: "MB1", 4: "Opp", 5: "MB2", 6: "OH1" },
        { 1: "OH1", 2: "OH2", 3: "S", 4: "MB1", 5: "Opp", 6: "MB2" },
        { 1: "MB2", 2: "OH1", 3: "OH2", 4: "S", 5: "MB1", 6: "Opp" },
        { 1: "Opp", 2: "MB2", 3: "OH1", 4: "OH2", 5: "S", 6: "MB1" },
        { 1: "MB1", 2: "Opp", 3: "MB2", 4: "OH1", 5: "OH2", 6: "S" },
      ];

      const result = RotationCustomization.validateRotationSequence(
        validRotations,
        "5-1"
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect incorrect rotation count", () => {
      const invalidRotations = [
        { 1: "S", 2: "MB1", 3: "Opp", 4: "MB2", 5: "OH1", 6: "OH2" },
        // Missing rotations
      ];

      const result = RotationCustomization.validateRotationSequence(
        invalidRotations,
        "5-1"
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Must have exactly 6 rotations");
    });

    it("should detect incorrect rotation pattern", () => {
      const invalidRotations = [
        { 1: "S", 2: "MB1", 3: "Opp", 4: "MB2", 5: "OH1", 6: "OH2" },
        { 1: "OH2", 2: "S", 3: "MB1", 4: "Opp", 5: "MB2", 6: "OH1" },
        { 1: "OH1", 2: "OH2", 3: "S", 4: "MB1", 5: "Opp", 6: "MB2" },
        { 1: "MB2", 2: "OH1", 3: "OH2", 4: "S", 5: "MB1", 6: "Opp" },
        { 1: "Opp", 2: "MB2", 3: "OH1", 4: "OH2", 5: "S", 6: "MB1" },
        { 1: "WRONG", 2: "Opp", 3: "MB2", 4: "OH1", 5: "OH2", 6: "S" }, // Wrong player
      ];

      const result = RotationCustomization.validateRotationSequence(
        invalidRotations,
        "5-1"
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
