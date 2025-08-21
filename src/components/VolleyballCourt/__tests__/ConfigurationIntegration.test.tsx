/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VolleyballCourt } from "../VolleyballCourt";
import { ConfigurationPanel } from "../ConfigurationPanel";
import {
  ConfigurationManager,
  PlayerCustomization,
} from "../ConfigurationUtils";
import { VolleyballCourtConfig, PlayerDefinition } from "../types";

// Mock the hooks and dependencies
vi.mock("@/hooks/useEnhancedPositionManager", () => ({
  useEnhancedPositionManager: () => ({
    getFormationPositions: vi.fn(() => ({})),
    validateCurrentFormation: vi.fn(() => ({ isValid: true, violations: [] })),
  }),
}));

vi.mock("../PersistenceManager", () => ({
  VolleyballCourtPersistenceManager: vi.fn(() => ({
    initialize: vi.fn(() => Promise.resolve(null)),
    save: vi.fn(),
    clear: vi.fn(),
    hasURLData: vi.fn(() => false),
    setReadOnly: vi.fn(),
    updateOptions: vi.fn(),
    generateShareURL: vi.fn(() => ({
      url: "test-url",
      config: {},
      positions: {},
    })),
    copyToClipboard: vi.fn(),
  })),
}));

describe("Configuration Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Custom Player Configuration", () => {
    it("should create and use custom players", () => {
      const customPlayers = PlayerCustomization.createCustomPlayerSet("5-1", [
        { name: "John Setter", role: "S", number: 10, color: "#ff0000" },
        { name: "Jane Opposite", role: "Opp", number: 11, color: "#00ff00" },
        { name: "Bob Outside 1", role: "OH", number: 12, color: "#0000ff" },
        { name: "Alice Outside 2", role: "OH", number: 13, color: "#ffff00" },
        { name: "Charlie Middle 1", role: "MB", number: 14, color: "#ff00ff" },
        { name: "Diana Middle 2", role: "MB", number: 15, color: "#00ffff" },
      ]);

      const config: VolleyballCourtConfig = {
        players: {
          "5-1": customPlayers,
          "6-2": [],
        },
      };

      const { container } = render(<VolleyballCourt config={config} />);

      expect(container).toBeInTheDocument();
      // The component should render without errors with custom players
    });

    it("should apply different color schemes to players", () => {
      const basePlayers: PlayerDefinition[] = [
        { id: "S", name: "Setter", role: "S" },
        { id: "Opp", name: "Opposite", role: "Opp" },
        { id: "OH1", name: "Outside 1", role: "OH" },
        { id: "OH2", name: "Outside 2", role: "OH" },
        { id: "MB1", name: "Middle 1", role: "MB" },
        { id: "MB2", name: "Middle 2", role: "MB" },
      ];

      // Test role-based colors
      const roleColoredPlayers = PlayerCustomization.applyColorScheme(
        basePlayers,
        "role"
      );
      expect(roleColoredPlayers[0].color).toBe("#10b981"); // Setter green

      // Test position-based colors
      const positionColoredPlayers = PlayerCustomization.applyColorScheme(
        basePlayers,
        "position"
      );
      expect(positionColoredPlayers[0].color).toMatch(/^hsl\(\d+, 70%, 50%\)$/);

      // Test custom colors
      const customColors = { S: "#123456", Opp: "#654321" };
      const customColoredPlayers = PlayerCustomization.applyColorScheme(
        basePlayers,
        "custom",
        customColors
      );
      expect(customColoredPlayers[0].color).toBe("#123456");
      expect(customColoredPlayers[1].color).toBe("#654321");
    });
  });

  describe("Appearance Configuration", () => {
    it("should apply theme-based styling", () => {
      const lightTheme = ConfigurationManager.applyThemeStyles("light");
      expect(lightTheme.theme).toBe("light");
      expect(lightTheme.courtColor).toBe("#2563eb");
      expect(lightTheme.courtBackgroundColor).toBe("#ffffff");

      const darkTheme = ConfigurationManager.applyThemeStyles("dark");
      expect(darkTheme.theme).toBe("dark");
      expect(darkTheme.courtColor).toBe("#1f2937");
      expect(darkTheme.courtBackgroundColor).toBe("#111827");
    });

    it("should merge custom appearance settings", () => {
      const customTheme = ConfigurationManager.applyThemeStyles("light", {
        courtColor: "#custom",
        playerSize: 1.5,
        showPlayerNames: false,
      });

      expect(customTheme.courtColor).toBe("#custom");
      expect(customTheme.playerSize).toBe(1.5);
      expect(customTheme.showPlayerNames).toBe(false);
      expect(customTheme.theme).toBe("light"); // Should keep base theme
    });
  });

  describe("Configuration Presets", () => {
    it("should provide all expected presets", () => {
      const presets = ConfigurationManager.getConfigurationPresets();

      expect(presets).toHaveProperty("minimal");
      expect(presets).toHaveProperty("educational");
      expect(presets).toHaveProperty("presentation");
      expect(presets).toHaveProperty("highContrast");
      expect(presets).toHaveProperty("performance");
    });

    it("should apply minimal preset correctly", () => {
      const presets = ConfigurationManager.getConfigurationPresets();
      const minimalConfig = { ...presets.minimal };

      expect(minimalConfig.controls?.showSystemSelector).toBe(false);
      expect(minimalConfig.controls?.showRotationControls).toBe(false);
      expect(minimalConfig.controls?.controlsStyle).toBe("minimal");
      expect(minimalConfig.validation?.showViolationDetails).toBe(false);
      expect(minimalConfig.appearance?.showPlayerNames).toBe(false);
    });

    it("should apply educational preset correctly", () => {
      const presets = ConfigurationManager.getConfigurationPresets();
      const educationalConfig = { ...presets.educational };

      expect(educationalConfig.validation?.enableRealTimeValidation).toBe(true);
      expect(educationalConfig.validation?.showConstraintBoundaries).toBe(true);
      expect(educationalConfig.validation?.enableEducationalMessages).toBe(
        true
      );
      expect(educationalConfig.validation?.strictMode).toBe(true);
      expect(educationalConfig.appearance?.showPlayerNames).toBe(true);
      expect(educationalConfig.appearance?.showPositionLabels).toBe(true);
    });

    it("should apply high contrast preset correctly", () => {
      const presets = ConfigurationManager.getConfigurationPresets();
      const highContrastConfig = { ...presets.highContrast };

      expect(highContrastConfig.appearance?.theme).toBe("dark");
      expect(highContrastConfig.appearance?.playerColors?.S).toBe("#00ff00");
      expect(highContrastConfig.accessibility?.enableHighContrast).toBe(true);
      expect(highContrastConfig.accessibility?.enableScreenReader).toBe(true);
    });
  });

  describe("Configuration Validation", () => {
    it("should validate complete configuration", () => {
      const validConfig: VolleyballCourtConfig = {
        initialSystem: "5-1",
        players: {
          "5-1": [
            { id: "S", name: "Setter", role: "S" },
            { id: "Opp", name: "Opposite", role: "Opp" },
            { id: "OH1", name: "Outside 1", role: "OH" },
            { id: "OH2", name: "Outside 2", role: "OH" },
            { id: "MB1", name: "Middle 1", role: "MB" },
            { id: "MB2", name: "Middle 2", role: "MB" },
          ],
          "6-2": [
            { id: "S1", name: "Setter 1", role: "S" },
            { id: "S2", name: "Setter 2", role: "S" },
            { id: "OH1", name: "Outside 1", role: "OH" },
            { id: "OH2", name: "Outside 2", role: "OH" },
            { id: "MB1", name: "Middle 1", role: "MB" },
            { id: "MB2", name: "Middle 2", role: "MB" },
          ],
        },
        appearance: {
          theme: "light",
          courtColor: "#2563eb",
        },
        validation: {
          enableRealTimeValidation: true,
        },
      };

      const result = ConfigurationManager.validateConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect and report configuration errors", () => {
      const invalidConfig: VolleyballCourtConfig = {
        players: {
          "5-1": [
            { id: "S", name: "Setter", role: "S" },
            { id: "S", name: "Duplicate", role: "S" }, // Duplicate ID
          ], // Wrong count
          "6-2": [],
        },
        appearance: {
          theme: "invalid" as any,
          courtColor: "not-a-color",
        },
      };

      const result = ConfigurationManager.validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("Configuration Merging", () => {
    it("should merge user configuration with defaults", () => {
      const defaultConfig = {
        initialSystem: "5-1" as const,
        appearance: {
          theme: "light" as const,
          courtColor: "#blue",
          showPlayerNames: true,
        },
        validation: {
          enableRealTimeValidation: true,
          strictMode: false,
        },
      } as any;

      const userConfig = {
        initialSystem: "6-2" as const,
        appearance: {
          courtColor: "#red",
        },
        validation: {
          strictMode: true,
        },
      };

      const merged = ConfigurationManager.mergeConfigurations(
        defaultConfig,
        userConfig
      );

      expect(merged.initialSystem).toBe("6-2"); // User override
      expect(merged.appearance.theme).toBe("light"); // Default preserved
      expect(merged.appearance.courtColor).toBe("#red"); // User override
      expect(merged.appearance.showPlayerNames).toBe(true); // Default preserved
      expect(merged.validation.enableRealTimeValidation).toBe(true); // Default preserved
      expect(merged.validation.strictMode).toBe(true); // User override
    });

    it("should handle deep merging of nested objects", () => {
      const defaultConfig = {
        appearance: {
          playerColors: {
            S: "#green",
            Opp: "#orange",
            OH: "#blue",
          },
          fontSize: {
            playerNames: 12,
            positionLabels: 10,
          },
        },
      } as any;

      const userConfig = {
        appearance: {
          playerColors: {
            S: "#custom-green",
            MB: "#red",
          },
          fontSize: {
            playerNames: 14,
          },
        },
      };

      const merged = ConfigurationManager.mergeConfigurations(
        defaultConfig,
        userConfig
      );

      expect(merged.appearance.playerColors?.S).toBe("#custom-green"); // User override
      expect(merged.appearance.playerColors?.Opp).toBe("#orange"); // Default preserved
      expect(merged.appearance.playerColors?.MB).toBe("#red"); // User addition
      expect(merged.appearance.fontSize?.playerNames).toBe(14); // User override
      expect(merged.appearance.fontSize?.positionLabels).toBe(10); // Default preserved
    });
  });

  describe("Custom Rules Configuration", () => {
    it("should create and validate custom rules", () => {
      const customRule = ConfigurationManager.createCustomRule(
        "test-rule",
        "Test Rule",
        "A test validation rule",
        (positions, context) => {
          // Simple test: all players must be in valid positions
          return Object.keys(positions).length === 6;
        },
        "All 6 players must be positioned",
        { severity: "warning" }
      );

      expect(customRule.id).toBe("test-rule");
      expect(customRule.name).toBe("Test Rule");
      expect(customRule.severity).toBe("warning");
      expect(customRule.enabled).toBe(true);

      // Test the validator function
      const result = customRule.validator(
        { p1: { x: 0, y: 0, isCustom: false, lastModified: new Date() }, p2: { x: 1, y: 1, isCustom: false, lastModified: new Date() } },
        {} as any
      );
      expect(result).toBe(false); // Only 2 players, should fail
    });
  });

  describe("VolleyballCourt with Custom Configuration", () => {
    it("should render with comprehensive custom configuration", () => {
      const customConfig: VolleyballCourtConfig = {
        initialSystem: "6-2",
        initialRotation: 2,
        initialFormation: "serveReceive",
        players: {
          "5-1": [],
          "6-2": PlayerCustomization.createCustomPlayerSet("6-2", [
            { name: "Alice Setter", role: "S", number: 1 },
            { name: "Bob Setter", role: "S", number: 2 },
            { name: "Charlie OH", role: "OH", number: 3 },
            { name: "Diana OH", role: "OH", number: 4 },
            { name: "Eve MB", role: "MB", number: 5 },
            { name: "Frank MB", role: "MB", number: 6 },
          ]),
        },
        appearance: ConfigurationManager.applyThemeStyles("dark", {
          playerSize: 1.2,
          showPlayerNumbers: true,
        }),
        validation: {
          enableRealTimeValidation: true,
          showConstraintBoundaries: true,
          strictMode: true,
        },
        animation: {
          enableAnimations: true,
          animationDuration: 500,
          staggerDelay: 100,
        },
        controls: {
          showSystemSelector: true,
          showRotationControls: true,
          showFormationSelector: true,
          controlsPosition: "bottom",
          controlsStyle: "expanded",
        },
      };

      const { container } = render(
        <VolleyballCourt
          config={customConfig}
          readOnly={false}
          showControls={true}
        />
      );

      expect(container).toBeInTheDocument();
      // Should render without errors with comprehensive configuration
    });

    it("should handle configuration changes through ConfigurationPanel", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      const initialConfig: VolleyballCourtConfig = {
        initialSystem: "5-1",
        appearance: {
          theme: "light",
          showPlayerNames: true,
        },
      };

      render(
        <ConfigurationPanel config={initialConfig} onChange={mockOnChange} />
      );

      // Apply a preset
      const educationalButton = screen.getByText("Educational");
      await user.click(educationalButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          validation: expect.objectContaining({
            enableRealTimeValidation: true,
            showConstraintBoundaries: true,
            enableEducationalMessages: true,
            strictMode: true,
          }),
        })
      );
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle invalid configuration gracefully", () => {
      // Mock console.warn to avoid test output noise
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const invalidConfig: VolleyballCourtConfig = {
        players: {
          "5-1": [], // Invalid: empty players array
          "6-2": [],
        },
        appearance: {
          theme: "invalid" as any,
        },
      };

      const { container } = render(<VolleyballCourt config={invalidConfig} />);

      expect(container).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should provide helpful error messages for common mistakes", () => {
      const invalidConfig: VolleyballCourtConfig = {
        players: {
          "5-1": [
            { id: "S1", name: "Setter 1", role: "S" },
            { id: "S2", name: "Setter 2", role: "S" }, // Too many setters for 5-1
          ],
          "6-2": [],
        },
      };

      const result = ConfigurationManager.validateConfig(invalidConfig);
      expect(result.errors).toContain("5-1 system must have exactly 1 setter");
      expect(result.errors).toContain("5-1 system must have exactly 6 players");
    });
  });

  describe("Performance with Large Configurations", () => {
    it("should handle complex configurations efficiently", () => {
      const complexConfig: VolleyballCourtConfig = {
        players: {
          "5-1": Array.from({ length: 6 }, (_, i) => ({
            id: `player-${i}`,
            name: `Player ${i + 1}`,
            role: ["S", "Opp", "OH", "OH", "MB", "MB"][i] as any,
            customData: { stats: { points: i * 10, blocks: i * 2 } },
          })),
          "6-2": Array.from({ length: 6 }, (_, i) => ({
            id: `player-6-2-${i}`,
            name: `6-2 Player ${i + 1}`,
            role: ["S", "S", "OH", "OH", "MB", "MB"][i] as any,
            customData: { stats: { points: i * 15, blocks: i * 3 } },
          })),
        },
        validation: {
          customRules: Array.from({ length: 10 }, (_, i) =>
            ConfigurationManager.createCustomRule(
              `rule-${i}`,
              `Rule ${i}`,
              `Description ${i}`,
              () => true,
              `Message ${i}`
            )
          ),
        },
        appearance: {
          playerColors: Object.fromEntries(
            Array.from({ length: 20 }, (_, i) => [
              `player-${i}`,
              `#${i.toString(16).padStart(6, "0")}`,
            ])
          ),
        },
      };

      const startTime = performance.now();
      const result = ConfigurationManager.validateConfig(complexConfig);
      const endTime = performance.now();

      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});
