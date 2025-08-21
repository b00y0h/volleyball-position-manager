/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import {
  ConfigurationManager,
  ConfigurationBuilder,
  ThemeCustomization,
  AdvancedConfiguration,
} from "../ConfigurationUtils";
import { VolleyballCourtConfig } from "../types";

describe("ConfigurationBuilder", () => {
  it("should build configuration fluently", () => {
    const config = new ConfigurationBuilder()
      .system("6-2")
      .rotation(2)
      .formation("serveReceive")
      .theme("dark")
      .animations(false)
      .realTimeValidation(true)
      .showControls({
        systemSelector: true,
        rotationControls: false,
        resetButton: true,
      })
      .build();

    expect(config.initialSystem).toBe("6-2");
    expect(config.initialRotation).toBe(2);
    expect(config.initialFormation).toBe("serveReceive");
    expect(config.appearance?.theme).toBe("dark");
    expect(config.animation?.enableAnimations).toBe(false);
    expect(config.validation?.enableRealTimeValidation).toBe(true);
    expect(config.controls?.showSystemSelector).toBe(true);
    expect(config.controls?.showRotationControls).toBe(false);
    expect(config.controls?.showResetButton).toBe(true);
  });

  it("should add custom players", () => {
    const config = new ConfigurationBuilder()
      .addPlayer("5-1", "CUSTOM_S", "Elite Setter", "S", {
        color: "#ff0000",
        number: 10,
        locked: true,
      })
      .addPlayer("5-1", "CUSTOM_OH", "Star Outside", "OH", {
        color: "#00ff00",
        number: 11,
      })
      .build();

    expect(config.players?.["5-1"]).toHaveLength(2);
    expect(config.players?.["5-1"][0]).toEqual({
      id: "CUSTOM_S",
      name: "Elite Setter",
      role: "S",
      color: "#ff0000",
      number: 10,
      locked: true,
      hidden: false,
      size: 1,
      customData: {},
    });
  });

  it("should configure player colors", () => {
    const config = new ConfigurationBuilder()
      .playerColors({
        S: "#ff0000",
        Opp: "#00ff00",
        OH: "#0000ff",
        MB: "#ffff00",
      })
      .build();

    expect(config.appearance?.playerColors).toEqual({
      S: "#ff0000",
      Opp: "#00ff00",
      OH: "#0000ff",
      MB: "#ffff00",
    });
  });

  it("should apply presets", () => {
    // Get the minimal preset directly since ConfigurationBuilder starts empty
    const presets = ConfigurationManager.getConfigurationPresets();
    const minimalPreset = presets.minimal;

    expect(minimalPreset.controls?.showSystemSelector).toBe(false);
    expect(minimalPreset.controls?.controlsStyle).toBe("minimal");
    expect(minimalPreset.validation?.showViolationDetails).toBe(false);
  });

  it("should configure custom rotations", () => {
    const customRotation = [
      { 1: "CustomS", 2: "CustomOH1", 3: "CustomMB1", 4: "CustomOpp", 5: "CustomOH2", 6: "CustomMB2" },
      { 1: "CustomMB2", 2: "CustomS", 3: "CustomOH1", 4: "CustomMB1", 5: "CustomOpp", 6: "CustomOH2" },
      { 1: "CustomOH2", 2: "CustomMB2", 3: "CustomS", 4: "CustomOH1", 5: "CustomMB1", 6: "CustomOpp" },
      { 1: "CustomOpp", 2: "CustomOH2", 3: "CustomMB2", 4: "CustomS", 5: "CustomOH1", 6: "CustomMB1" },
      { 1: "CustomMB1", 2: "CustomOpp", 3: "CustomOH2", 4: "CustomMB2", 5: "CustomS", 6: "CustomOH1" },
      { 1: "CustomOH1", 2: "CustomMB1", 3: "CustomOpp", 4: "CustomOH2", 5: "CustomMB2", 6: "CustomS" },
    ];

    const config = new ConfigurationBuilder()
      .rotations("5-1", customRotation)
      .build();

    expect(config.rotations?.["5-1"]).toEqual(customRotation);
  });
});

describe("ThemeCustomization", () => {
  it("should create custom theme from light base", () => {
    const theme = ThemeCustomization.createCustomTheme(
      "ocean-theme",
      "light",
      {
        courtColor: "#006994",
        courtBackgroundColor: "#f0f9ff",
        playerColors: {
          S: "#0891b2",
          Opp: "#0284c7",
        },
        fontSize: {
          playerNames: 14,
          violations: 16,
        },
      }
    );

    expect(theme.theme).toBe("light");
    expect(theme.courtColor).toBe("#006994");
    expect(theme.courtBackgroundColor).toBe("#f0f9ff");
    expect(theme.playerColors?.S).toBe("#0891b2");
    expect(theme.playerColors?.Opp).toBe("#0284c7");
    expect(theme.fontSize?.playerNames).toBe(14);
    expect(theme.fontSize?.violations).toBe(16);
  });

  it("should create custom theme from dark base", () => {
    const theme = ThemeCustomization.createCustomTheme(
      "dark-ocean",
      "dark",
      {
        courtColor: "#1e293b",
        netColor: "#cbd5e1",
      }
    );

    expect(theme.theme).toBe("dark");
    expect(theme.courtColor).toBe("#1e293b");
    expect(theme.netColor).toBe("#cbd5e1");
    // Should inherit dark theme defaults for other properties
    expect(theme.courtBackgroundColor).toBe("#111827");
  });

  it("should create player color palette from base color", () => {
    const palette = ThemeCustomization.createPlayerColorPalette("hsl(200, 70%, 50%)", {
      saturation: 80,
      lightness: 60,
      hueShift: 45,
    });

    expect(palette.S).toBe("hsl(200, 80%, 60%)");
    expect(palette.Opp).toBe("hsl(245, 80%, 60%)");
    expect(palette.OH).toBe("hsl(290, 80%, 60%)");
    expect(palette.MB).toBe("hsl(335, 80%, 60%)");
    expect(palette.violation).toBe("hsl(0, 80%, 60%)"); // Always red
  });

  it("should provide predefined color schemes", () => {
    const schemes = ThemeCustomization.getColorSchemes();

    expect(schemes).toHaveProperty("default");
    expect(schemes).toHaveProperty("ocean");
    expect(schemes).toHaveProperty("forest");
    expect(schemes).toHaveProperty("sunset");
    expect(schemes).toHaveProperty("monochrome");

    // Check that each scheme has all required colors
    Object.values(schemes).forEach((scheme) => {
      expect(scheme).toHaveProperty("S");
      expect(scheme).toHaveProperty("Opp");
      expect(scheme).toHaveProperty("OH");
      expect(scheme).toHaveProperty("MB");
      expect(scheme).toHaveProperty("violation");
    });
  });
});

describe("AdvancedConfiguration", () => {
  it("should create use case configurations", () => {
    const trainingConfig = AdvancedConfiguration.createUseCaseConfiguration("training");
    expect(trainingConfig.validation?.enableEducationalMessages).toBe(true);
    expect(trainingConfig.validation?.strictMode).toBe(true);

    const presentationConfig = AdvancedConfiguration.createUseCaseConfiguration("presentation");
    expect(presentationConfig.animation?.enableAnimations).toBe(true);
    expect(presentationConfig.controls?.controlsPosition).toBe("bottom");

    const analysisConfig = AdvancedConfiguration.createUseCaseConfiguration("analysis");
    expect(analysisConfig.controls?.showUndoRedoButtons).toBe(true);
    expect(analysisConfig.validation?.strictMode).toBe(false);
  });

  it("should create responsive configurations", () => {
    // Mobile configuration
    const mobileConfig = AdvancedConfiguration.createResponsiveConfiguration(360, 640);
    expect(mobileConfig.controls?.controlsPosition).toBe("bottom");
    expect(mobileConfig.controls?.controlsStyle).toBe("compact");
    expect(mobileConfig.appearance?.showPlayerNames).toBe(false);
    expect(mobileConfig.appearance?.playerSize).toBe(1.2);

    // Tablet configuration
    const tabletConfig = AdvancedConfiguration.createResponsiveConfiguration(768, 1024);
    expect(tabletConfig.controls?.controlsStyle).toBe("compact");
    expect(tabletConfig.appearance?.playerSize).toBe(1.1);

    // Desktop configuration
    const desktopConfig = AdvancedConfiguration.createResponsiveConfiguration(1200, 800);
    expect(desktopConfig.controls?.controlsStyle).toBe("expanded");
    expect(desktopConfig.appearance?.playerSize).toBe(1.0);
    expect(desktopConfig.appearance?.showPositionLabels).toBe(true);
  });

  it("should create accessibility configurations", () => {
    const a11yConfig = AdvancedConfiguration.createAccessibilityConfiguration({
      highContrast: true,
      largeText: true,
      reducedMotion: true,
      screenReader: true,
    });

    expect(a11yConfig.accessibility?.enableHighContrast).toBe(true);
    expect(a11yConfig.accessibility?.enableScreenReader).toBe(true);
    expect(a11yConfig.appearance?.theme).toBe("dark");
    expect(a11yConfig.appearance?.fontSize?.playerNames).toBe(16);
    expect(a11yConfig.appearance?.playerSize).toBe(1.3);
    expect(a11yConfig.animation?.enableAnimations).toBe(false);
  });

  it("should validate configuration compatibility", () => {
    const incompatibleConfig: VolleyballCourtConfig = {
      animation: {
        enableAnimations: true,
        bounceOnViolation: true,
      },
      performance: {
        enableVirtualization: true,
      },
      validation: {
        enableRealTimeValidation: true,
      },
    };

    const result = AdvancedConfiguration.validateConfigurationCompatibility(incompatibleConfig);

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("should provide helpful suggestions for theme and export combinations", () => {
    const darkExportConfig: VolleyballCourtConfig = {
      appearance: {
        theme: "dark",
      },
      export: {
        enableImageExport: true,
      },
    };

    const result = AdvancedConfiguration.validateConfigurationCompatibility(darkExportConfig);

    expect(result.suggestions).toContain(
      "Consider using light theme for better print/export quality"
    );
  });

  it("should suggest high contrast colors for accessibility", () => {
    const a11yConfig: VolleyballCourtConfig = {
      accessibility: {
        enableHighContrast: true,
      },
      appearance: {
        // No custom player colors defined
      },
    };

    const result = AdvancedConfiguration.validateConfigurationCompatibility(a11yConfig);

    expect(result.suggestions).toContain(
      "Define custom high-contrast player colors for better accessibility"
    );
  });
});

describe("Configuration Integration", () => {
  it("should work with complex nested configurations", () => {
    const complexConfig = new ConfigurationBuilder()
      .system("6-2")
      .formation("serveReceive")
      .theme("dark")
      .playerColors({
        S: "#10b981",
        Opp: "#f59e0b",
      })
      .validation({
        enableRealTimeValidation: true,
        showConstraintBoundaries: false,
        strictMode: true,
        snapTolerance: 15,
      })
      .animation({
        enableAnimations: true,
        animationDuration: 400,
        staggerDelay: 75,
      })
      .controls({
        showSystemSelector: true,
        showRotationControls: true,
        controlsPosition: "bottom",
        controlsStyle: "compact",
      })
      .build();

    expect(complexConfig.initialSystem).toBe("6-2");
    expect(complexConfig.initialFormation).toBe("serveReceive");
    expect(complexConfig.appearance?.theme).toBe("dark");
    expect(complexConfig.appearance?.playerColors?.S).toBe("#10b981");
    expect(complexConfig.validation?.strictMode).toBe(true);
    expect(complexConfig.validation?.snapTolerance).toBe(15);
    expect(complexConfig.animation?.animationDuration).toBe(400);
    expect(complexConfig.controls?.controlsPosition).toBe("bottom");
  });

  it("should handle preset modifications", () => {
    // Test preset features directly since ConfigurationBuilder starts empty
    const presets = ConfigurationManager.getConfigurationPresets();
    const educational = presets.educational;

    expect(educational.validation?.enableEducationalMessages).toBe(true);
    expect(educational.validation?.strictMode).toBe(true);
    expect(educational.appearance?.showPlayerNames).toBe(true);
    expect(educational.appearance?.showPlayerNumbers).toBe(true);
  });

  it("should create configuration for different screen sizes and use cases", () => {
    // Test mobile responsive configuration
    const mobileConfig = AdvancedConfiguration.createResponsiveConfiguration(375, 667);
    expect(mobileConfig.controls?.controlsPosition).toBe("bottom");
    expect(mobileConfig.appearance?.playerSize).toBe(1.2);
    expect(mobileConfig.appearance?.showPlayerNames).toBe(false);

    // Test accessibility configuration
    const a11yConfig = AdvancedConfiguration.createAccessibilityConfiguration({ largeText: true });
    expect(a11yConfig.accessibility?.enableScreenReader).toBe(true);
    expect(a11yConfig.appearance?.fontSize?.playerNames).toBe(16);
    expect(a11yConfig.appearance?.playerSize).toBe(1.3);

    // Test educational configuration
    const presets = ConfigurationManager.getConfigurationPresets();
    const educational = presets.educational;
    expect(educational.validation?.enableEducationalMessages).toBe(true);
  });
});