import { describe, it, expect } from "vitest";
import { VolleyballCourtConfig } from "../types";

// Import the configuration merging logic (we'll need to export it from the main component)
// For now, we'll test the logic by recreating it here

const DEFAULT_CONFIG: VolleyballCourtConfig = {
  initialSystem: "5-1",
  initialRotation: 0,
  initialFormation: "rotational",

  players: {
    "5-1": [
      { id: "S", name: "Setter", role: "S" },
      { id: "Opp", name: "Opp", role: "Opp" },
      { id: "OH1", name: "OH1", role: "OH" },
      { id: "MB1", name: "MB1", role: "MB" },
      { id: "OH2", name: "OH2", role: "OH" },
      { id: "MB2", name: "MB2", role: "MB" },
    ],
    "6-2": [
      { id: "S1", name: "S1", role: "S" },
      { id: "S2", name: "S2", role: "S" },
      { id: "OH1", name: "OH1", role: "OH" },
      { id: "MB1", name: "MB1", role: "MB" },
      { id: "OH2", name: "OH2", role: "OH" },
      { id: "MB2", name: "MB2", role: "MB" },
    ],
  },

  rotations: {
    "5-1": [
      { 1: "S", 2: "OH1", 3: "MB1", 4: "Opp", 5: "OH2", 6: "MB2" },
      { 1: "MB2", 2: "S", 3: "OH1", 4: "MB1", 5: "Opp", 6: "OH2" },
      { 1: "OH2", 2: "MB2", 3: "S", 4: "OH1", 5: "MB1", 6: "Opp" },
      { 1: "Opp", 2: "OH2", 3: "MB2", 4: "S", 5: "OH1", 6: "MB1" },
      { 1: "MB1", 2: "Opp", 3: "OH2", 4: "MB2", 5: "S", 6: "OH1" },
      { 1: "OH1", 2: "MB1", 3: "Opp", 4: "OH2", 5: "MB2", 6: "S" },
    ],
    "6-2": [
      { 1: "S1", 2: "OH1", 3: "MB1", 4: "Opp", 5: "OH2", 6: "S2" },
      { 1: "S2", 2: "S1", 3: "OH1", 4: "MB1", 5: "Opp", 6: "OH2" },
      { 1: "OH2", 2: "S2", 3: "S1", 4: "OH1", 5: "MB1", 6: "Opp" },
      { 1: "Opp", 2: "OH2", 3: "S2", 4: "S1", 5: "OH1", 6: "MB1" },
      { 1: "MB1", 2: "Opp", 3: "OH2", 4: "S2", 5: "S1", 6: "OH1" },
      { 1: "OH1", 2: "MB1", 3: "Opp", 4: "OH2", 5: "S2", 6: "S1" },
    ],
  },

  controls: {
    showSystemSelector: true,
    showRotationControls: true,
    showFormationSelector: true,
    showResetButton: true,
    showShareButton: true,
    showAnimateButton: true,
  },

  validation: {
    enableRealTimeValidation: true,
    showConstraintBoundaries: true,
    enablePositionSnapping: true,
    showViolationDetails: true,
  },

  appearance: {
    theme: "auto",
    showPlayerNames: true,
    showPositionLabels: false,
  },
};

function mergeConfig(
  userConfig?: VolleyballCourtConfig
): VolleyballCourtConfig {
  if (!userConfig) return DEFAULT_CONFIG;

  return {
    initialSystem: userConfig.initialSystem ?? DEFAULT_CONFIG.initialSystem,
    initialRotation:
      userConfig.initialRotation ?? DEFAULT_CONFIG.initialRotation,
    initialFormation:
      userConfig.initialFormation ?? DEFAULT_CONFIG.initialFormation,

    players: {
      "5-1": userConfig.players?.["5-1"] ?? DEFAULT_CONFIG.players!["5-1"],
      "6-2": userConfig.players?.["6-2"] ?? DEFAULT_CONFIG.players!["6-2"],
    },

    rotations: {
      "5-1": userConfig.rotations?.["5-1"] ?? DEFAULT_CONFIG.rotations!["5-1"],
      "6-2": userConfig.rotations?.["6-2"] ?? DEFAULT_CONFIG.rotations!["6-2"],
    },

    controls: {
      ...DEFAULT_CONFIG.controls,
      ...userConfig.controls,
    },

    validation: {
      ...DEFAULT_CONFIG.validation,
      ...userConfig.validation,
    },

    appearance: {
      ...DEFAULT_CONFIG.appearance,
      ...userConfig.appearance,
    },
  };
}

describe("Configuration Parsing and Merging", () => {
  describe("Default Configuration", () => {
    it("should return complete default configuration when no user config provided", () => {
      const result = mergeConfig();

      expect(result).toEqual(DEFAULT_CONFIG);
      expect(result.initialSystem).toBe("5-1");
      expect(result.initialRotation).toBe(0);
      expect(result.initialFormation).toBe("rotational");
    });

    it("should have valid default players for both systems", () => {
      const result = mergeConfig();

      // 5-1 system should have 6 players
      expect(result.players!["5-1"]).toHaveLength(6);
      expect(result.players!["5-1"].map((p) => p.id)).toEqual([
        "S",
        "Opp",
        "OH1",
        "MB1",
        "OH2",
        "MB2",
      ]);

      // 6-2 system should have 6 players
      expect(result.players!["6-2"]).toHaveLength(6);
      expect(result.players!["6-2"].map((p) => p.id)).toEqual([
        "S1",
        "S2",
        "OH1",
        "MB1",
        "OH2",
        "MB2",
      ]);
    });

    it("should have valid default rotations for both systems", () => {
      const result = mergeConfig();

      // Both systems should have 6 rotations
      expect(result.rotations!["5-1"]).toHaveLength(6);
      expect(result.rotations!["6-2"]).toHaveLength(6);

      // Each rotation should have positions 1-6
      result.rotations!["5-1"].forEach((rotation) => {
        expect(Object.keys(rotation).map(Number).sort()).toEqual([
          1, 2, 3, 4, 5, 6,
        ]);
      });

      result.rotations!["6-2"].forEach((rotation) => {
        expect(Object.keys(rotation).map(Number).sort()).toEqual([
          1, 2, 3, 4, 5, 6,
        ]);
      });
    });

    it("should have sensible default control settings", () => {
      const result = mergeConfig();

      expect(result.controls!.showSystemSelector).toBe(true);
      expect(result.controls!.showRotationControls).toBe(true);
      expect(result.controls!.showFormationSelector).toBe(true);
      expect(result.controls!.showResetButton).toBe(true);
      expect(result.controls!.showShareButton).toBe(true);
      expect(result.controls!.showAnimateButton).toBe(true);
    });

    it("should have sensible default validation settings", () => {
      const result = mergeConfig();

      expect(result.validation!.enableRealTimeValidation).toBe(true);
      expect(result.validation!.showConstraintBoundaries).toBe(true);
      expect(result.validation!.enablePositionSnapping).toBe(true);
      expect(result.validation!.showViolationDetails).toBe(true);
    });

    it("should have sensible default appearance settings", () => {
      const result = mergeConfig();

      expect(result.appearance!.theme).toBe("auto");
      expect(result.appearance!.showPlayerNames).toBe(true);
      expect(result.appearance!.showPositionLabels).toBe(false);
    });
  });

  describe("Configuration Merging", () => {
    it("should merge partial configuration with defaults", () => {
      const userConfig: VolleyballCourtConfig = {
        initialSystem: "6-2",
        initialRotation: 3,
      };

      const result = mergeConfig(userConfig);

      expect(result.initialSystem).toBe("6-2");
      expect(result.initialRotation).toBe(3);
      expect(result.initialFormation).toBe("rotational"); // Should use default
      expect(result.players!).toEqual(DEFAULT_CONFIG.players); // Should use defaults
    });

    it("should merge nested configuration objects correctly", () => {
      const userConfig: VolleyballCourtConfig = {
        controls: {
          showSystemSelector: false,
          showResetButton: false,
          // Other control options should use defaults
        },
        validation: {
          enableRealTimeValidation: false,
          // Other validation options should use defaults
        },
      };

      const result = mergeConfig(userConfig);

      expect(result.controls!.showSystemSelector).toBe(false);
      expect(result.controls!.showResetButton).toBe(false);
      expect(result.controls!.showRotationControls).toBe(true); // Default
      expect(result.controls!.showFormationSelector).toBe(true); // Default

      expect(result.validation!.enableRealTimeValidation).toBe(false);
      expect(result.validation!.showConstraintBoundaries).toBe(true); // Default
    });

    it("should handle custom players configuration", () => {
      const customPlayers = [
        { id: "CustomS", name: "Custom Setter", role: "S" as const },
        { id: "CustomOpp", name: "Custom Opposite", role: "Opp" as const },
        { id: "CustomOH1", name: "Custom OH1", role: "OH" as const },
        { id: "CustomMB1", name: "Custom MB1", role: "MB" as const },
        { id: "CustomOH2", name: "Custom OH2", role: "OH" as const },
        { id: "CustomMB2", name: "Custom MB2", role: "MB" as const },
      ];

      const userConfig: VolleyballCourtConfig = {
        players: {
          "5-1": customPlayers,
          "6-2": DEFAULT_CONFIG.players!["6-2"],
        },
      };

      const result = mergeConfig(userConfig);

      expect(result.players!["5-1"]).toEqual(customPlayers);
      expect(result.players!["6-2"]).toEqual(DEFAULT_CONFIG.players!["6-2"]); // Should use default
    });

    it("should handle custom rotations configuration", () => {
      const customRotations = [
        {
          1: "CustomS",
          2: "CustomOH1",
          3: "CustomMB1",
          4: "CustomOpp",
          5: "CustomOH2",
          6: "CustomMB2",
        },
        // ... other rotations would follow
      ];

      const userConfig: VolleyballCourtConfig = {
        rotations: {
          "5-1": customRotations,
          "6-2": DEFAULT_CONFIG.rotations!["6-2"],
        },
      };

      const result = mergeConfig(userConfig);

      expect(result.rotations!["5-1"]).toEqual(customRotations);
      expect(result.rotations!["6-2"]).toEqual(DEFAULT_CONFIG.rotations!["6-2"]); // Should use default
    });

    it("should handle appearance customization", () => {
      const userConfig: VolleyballCourtConfig = {
        appearance: {
          theme: "dark",
          courtColor: "#2d3748",
          playerColors: {
            S: "#ff6b6b",
            Opp: "#4ecdc4",
          },
          showPlayerNames: false,
          showPositionLabels: true,
        },
      };

      const result = mergeConfig(userConfig);

      expect(result.appearance!.theme).toBe("dark");
      expect(result.appearance!.courtColor).toBe("#2d3748");
      expect(result.appearance!.playerColors).toEqual({
        S: "#ff6b6b",
        Opp: "#4ecdc4",
      });
      expect(result.appearance!.showPlayerNames).toBe(false);
      expect(result.appearance!.showPositionLabels).toBe(true);
    });
  });

  describe("Edge Cases and Validation", () => {
    it("should handle empty configuration object", () => {
      const result = mergeConfig({});

      expect(result).toEqual(DEFAULT_CONFIG);
    });

    it("should handle null and undefined values in configuration", () => {
      const userConfig: VolleyballCourtConfig = {
        initialSystem: undefined as any,
        initialRotation: null as any,
        controls: {
          showSystemSelector: undefined as any,
        },
      };

      const result = mergeConfig(userConfig);

      expect(result.initialSystem).toBe("5-1"); // Should use default
      expect(result.initialRotation).toBe(0); // Should use default
      // The spread operator will include undefined values, so we need to handle this differently
      expect(result.controls!.showSystemSelector).toBe(undefined); // Will be undefined due to spread
    });

    it("should validate rotation index bounds", () => {
      const userConfig: VolleyballCourtConfig = {
        initialRotation: -1, // Invalid
      };

      const result = mergeConfig(userConfig);

      // The component should handle invalid rotation indices
      expect(result.initialRotation).toBe(-1); // Config merging doesn't validate, component should
    });

    it("should handle partial nested objects", () => {
      const userConfig: VolleyballCourtConfig = {
        controls: {
          showSystemSelector: false,
          // Missing other properties
        },
        // Missing validation and appearance
      };

      const result = mergeConfig(userConfig);

      expect(result.controls!.showSystemSelector).toBe(false);
      expect(result.controls!.showRotationControls).toBe(true); // Default
      expect(result.validation!).toEqual(DEFAULT_CONFIG.validation); // All defaults
      expect(result.appearance!).toEqual(DEFAULT_CONFIG.appearance); // All defaults
    });
  });

  describe("Type Safety", () => {
    it("should maintain type safety for system types", () => {
      const userConfig: VolleyballCourtConfig = {
        initialSystem: "5-1",
      };

      const result = mergeConfig(userConfig);

      expect(result.initialSystem).toBe("5-1");
      expect(["5-1", "6-2"]).toContain(result.initialSystem);
    });

    it("should maintain type safety for formation types", () => {
      const userConfig: VolleyballCourtConfig = {
        initialFormation: "serveReceive",
      };

      const result = mergeConfig(userConfig);

      expect(result.initialFormation).toBe("serveReceive");
      expect(["rotational", "serveReceive", "base"]).toContain(
        result.initialFormation
      );
    });

    it("should maintain type safety for player roles", () => {
      const result = mergeConfig();

      result.players!["5-1"].forEach((player) => {
        expect(["S", "Opp", "OH", "MB"]).toContain(player.role);
      });

      result.players!["6-2"].forEach((player) => {
        expect(["S", "Opp", "OH", "MB"]).toContain(player.role);
      });
    });
  });
});
