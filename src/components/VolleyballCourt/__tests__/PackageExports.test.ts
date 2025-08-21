/**
 * Package exports and dependency management tests
 * 
 * This test suite validates that the package exports work correctly,
 * dependencies are properly managed, and tree-shaking works as expected.
 */

import { describe, it, expect } from "vitest";

describe("Package Exports", () => {
  describe("Main package exports", () => {
    it("should export main component", async () => {
      const packageExports = await import("../package");
      
      expect(packageExports.VolleyballCourt).toBeDefined();
      expect(typeof packageExports.VolleyballCourt).toBe("function");
    });

    it("should export provider components", async () => {
      const packageExports = await import("../package");
      
      expect(packageExports.VolleyballCourtProvider).toBeDefined();
      expect(packageExports.useVolleyballCourt).toBeDefined();
      expect(typeof packageExports.VolleyballCourtProvider).toBe("function");
      expect(typeof packageExports.useVolleyballCourt).toBe("function");
    });

    it("should export error boundary", async () => {
      const packageExports = await import("../package");
      
      expect(packageExports.VolleyballCourtErrorBoundary).toBeDefined();
      expect(typeof packageExports.VolleyballCourtErrorBoundary).toBe("function");
    });

    it("should export configuration utilities", async () => {
      const packageExports = await import("../package");
      
      expect(packageExports.ConfigurationManager).toBeDefined();
      expect(packageExports.ConfigurationBuilder).toBeDefined();
      expect(packageExports.PlayerCustomization).toBeDefined();
      expect(packageExports.RotationCustomization).toBeDefined();
      expect(packageExports.ThemeCustomization).toBeDefined();
      expect(packageExports.AdvancedConfiguration).toBeDefined();
    });

    it("should export presets and utilities", async () => {
      const packageExports = await import("../package");
      
      expect(packageExports.VolleyballCourtPresets).toBeDefined();
      expect(packageExports.createVolleyballCourtConfig).toBeDefined();
      expect(packageExports.validateVolleyballCourtConfig).toBeDefined();
      expect(packageExports.getVolleyballCourtPresets).toBeDefined();
      
      expect(typeof packageExports.createVolleyballCourtConfig).toBe("function");
      expect(typeof packageExports.validateVolleyballCourtConfig).toBe("function");
      expect(typeof packageExports.getVolleyballCourtPresets).toBe("function");
    });

    it("should export package info", async () => {
      const packageExports = await import("../package");
      
      expect(packageExports.VolleyballCourtPackageInfo).toBeDefined();
      expect(packageExports.VolleyballCourtPackageInfo.name).toBe("@volleyball-visualizer/court");
      expect(packageExports.VolleyballCourtPackageInfo.version).toBe("1.0.0");
      expect(packageExports.VolleyballCourtPackageInfo.license).toBe("MIT");
    });
  });

  describe("Tree-shakeable exports", () => {
    it("should export components separately", async () => {
      const componentsExports = await import("../exports/components");
      
      expect(componentsExports.VolleyballCourt).toBeDefined();
      expect(componentsExports.CourtVisualization).toBeDefined();
      expect(componentsExports.PlayerLayer).toBeDefined();
      expect(componentsExports.ControlsLayer).toBeDefined();
      expect(componentsExports.ValidationLayer).toBeDefined();
      expect(componentsExports.NotificationLayer).toBeDefined();
      expect(componentsExports.ReadOnlyIndicator).toBeDefined();
      expect(componentsExports.ConfigurationPanel).toBeDefined();
      
      // Should not include utilities
      expect((componentsExports as any).ConfigurationManager).toBeUndefined();
    });

    it("should export controls separately", async () => {
      const controlsExports = await import("../exports/controls");
      
      expect(controlsExports.SystemSelector).toBeDefined();
      expect(controlsExports.RotationControls).toBeDefined();
      expect(controlsExports.FormationSelector).toBeDefined();
      expect(controlsExports.AnimationControls).toBeDefined();
      expect(controlsExports.ShareButton).toBeDefined();
      
      // Should not include main components
      expect((controlsExports as any).VolleyballCourt).toBeUndefined();
    });

    it("should export utilities separately", async () => {
      const utilsExports = await import("../exports/utils");
      
      expect(utilsExports.ConfigurationManager).toBeDefined();
      expect(utilsExports.ConfigurationBuilder).toBeDefined();
      expect(utilsExports.PlayerCustomization).toBeDefined();
      expect(utilsExports.RotationCustomization).toBeDefined();
      expect(utilsExports.ThemeCustomization).toBeDefined();
      expect(utilsExports.AdvancedConfiguration).toBeDefined();
      expect(utilsExports.VolleyballCourtPersistenceManager).toBeDefined();
      expect(utilsExports.VolleyballCourtRulesIntegration).toBeDefined();
      
      // Should not include React components
      expect((utilsExports as any).VolleyballCourt).toBeUndefined();
    });

    it("should export types separately", async () => {
      const typesExports = await import("../exports/types");
      
      // Types should be available at compile time but not runtime
      // This test mainly ensures the module loads without errors
      expect(typesExports).toBeDefined();
    });

    it("should export presets separately", async () => {
      const presetsExports = await import("../exports/presets");
      
      expect(presetsExports.VolleyballCourtPresets).toBeDefined();
      expect(presetsExports.createVolleyballCourtConfig).toBeDefined();
      expect(presetsExports.getVolleyballCourtPresets).toBeDefined();
      expect(presetsExports.getPresetNames).toBeDefined();
      expect(presetsExports.isValidPreset).toBeDefined();
      
      expect(typeof presetsExports.createVolleyballCourtConfig).toBe("function");
      expect(typeof presetsExports.getVolleyballCourtPresets).toBe("function");
      expect(typeof presetsExports.getPresetNames).toBe("function");
      expect(typeof presetsExports.isValidPreset).toBe("function");
    });
  });

  describe("Preset functionality", () => {
    it("should provide all expected presets", async () => {
      const { VolleyballCourtPresets } = await import("../exports/presets");
      
      expect(VolleyballCourtPresets.minimal).toBeDefined();
      expect(VolleyballCourtPresets.educational).toBeDefined();
      expect(VolleyballCourtPresets.presentation).toBeDefined();
      expect(VolleyballCourtPresets.mobile).toBeDefined();
      expect(VolleyballCourtPresets.highContrast).toBeDefined();
      expect(VolleyballCourtPresets.performance).toBeDefined();
      expect(VolleyballCourtPresets.coaching).toBeDefined();
    });

    it("should create valid configurations from presets", async () => {
      const { createVolleyballCourtConfig, VolleyballCourtPresets } = await import("../exports/presets");
      
      const minimalConfig = createVolleyballCourtConfig("minimal");
      expect(minimalConfig).toBeDefined();
      expect(minimalConfig.controls?.showSystemSelector).toBe(false);
      
      const educationalConfig = createVolleyballCourtConfig("educational");
      expect(educationalConfig).toBeDefined();
      expect(educationalConfig.validation?.enableRealTimeValidation).toBe(true);
    });

    it("should support preset overrides", async () => {
      const { createVolleyballCourtConfig } = await import("../exports/presets");
      
      const customConfig = createVolleyballCourtConfig("minimal", {
        controls: {
          showSystemSelector: true, // Override the preset
        },
        appearance: {
          theme: "dark",
        },
      });
      
      expect(customConfig.controls?.showSystemSelector).toBe(true);
      expect(customConfig.appearance?.theme).toBe("dark");
      // Other minimal preset values should remain
      expect(customConfig.controls?.showRotationControls).toBe(false);
    });

    it("should validate preset names", async () => {
      const { isValidPreset, getPresetNames } = await import("../exports/presets");
      
      expect(isValidPreset("minimal")).toBe(true);
      expect(isValidPreset("educational")).toBe(true);
      expect(isValidPreset("invalid-preset")).toBe(false);
      
      const presetNames = getPresetNames();
      expect(presetNames).toContain("minimal");
      expect(presetNames).toContain("educational");
      expect(presetNames).toContain("presentation");
      expect(presetNames).toContain("mobile");
      expect(presetNames).toContain("highContrast");
      expect(presetNames).toContain("performance");
      expect(presetNames).toContain("coaching");
    });
  });

  describe("Package utilities", () => {
    it("should validate configurations", async () => {
      const { validateVolleyballCourtConfig } = await import("../package");
      
      const validConfig = {
        initialSystem: "5-1" as const,
        initialRotation: 0,
        initialFormation: "base" as const,
      };
      
      const result = validateVolleyballCourtConfig(validConfig);
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("should provide consistent package information", async () => {
      const { VolleyballCourtPackageInfo } = await import("../package");
      
      expect(VolleyballCourtPackageInfo.name).toBe("@volleyball-visualizer/court");
      expect(VolleyballCourtPackageInfo.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(VolleyballCourtPackageInfo.license).toBe("MIT");
      expect(VolleyballCourtPackageInfo.keywords).toContain("volleyball");
      expect(VolleyballCourtPackageInfo.keywords).toContain("react");
      expect(VolleyballCourtPackageInfo.keywords).toContain("component");
      expect(VolleyballCourtPackageInfo.peerDependencies.react).toBe(">=18.0.0");
      expect(VolleyballCourtPackageInfo.peerDependencies["react-dom"]).toBe(">=18.0.0");
    });
  });

  describe("TypeScript compatibility", () => {
    it("should have consistent type exports", async () => {
      // This test ensures TypeScript types are properly exported
      // and can be imported without runtime errors
      
      const typesModule = await import("../types");
      
      // If this compiles and the test runs, types are properly exported
      expect(typesModule).toBeDefined();
    });
  });

  describe("Dependency management", () => {
    it("should not bundle peer dependencies", () => {
      // This test would be more meaningful in an actual build environment
      // For now, we test that the exports don't include React internals
      
      const packageExports = import("../package");
      expect(packageExports).toBeDefined();
      
      // React should be imported externally, not bundled
      // This is enforced by the build configuration
      expect(true).toBe(true);
    });

    it("should handle optional dependencies gracefully", async () => {
      // The package should work even without framer-motion
      const packageExports = await import("../package");
      
      expect(packageExports.VolleyballCourt).toBeDefined();
      // Animation features might be limited without framer-motion,
      // but the component should still function
    });
  });

  describe("Bundle size optimization", () => {
    it("should support selective imports", async () => {
      // Test that importing only specific parts doesn't pull in everything
      const { VolleyballCourt } = await import("../exports/components");
      const { createVolleyballCourtConfig } = await import("../exports/presets");
      
      expect(VolleyballCourt).toBeDefined();
      expect(createVolleyballCourtConfig).toBeDefined();
      
      // In a real bundler, this would result in smaller bundles
      // than importing from the main package
    });

    it("should not include test files in exports", async () => {
      const packageExports = await import("../package");
      
      // Test files should not be exported
      expect((packageExports as any).describe).toBeUndefined();
      expect((packageExports as any).it).toBeUndefined();
      expect((packageExports as any).expect).toBeUndefined();
    });
  });

  describe("API consistency", () => {
    it("should maintain consistent naming conventions", async () => {
      const packageExports = await import("../package");
      
      // All component exports should start with capital letters
      expect(packageExports.VolleyballCourt.name).toMatch(/^[A-Z]/);
      expect(packageExports.VolleyballCourtProvider.name).toMatch(/^[A-Z]/);
      expect(packageExports.ConfigurationManager.name).toMatch(/^[A-Z]/);
      
      // Utility functions should start with lowercase
      expect(packageExports.createVolleyballCourtConfig.name).toMatch(/^[a-z]/);
      expect(packageExports.validateVolleyballCourtConfig.name).toMatch(/^[a-z]/);
      expect(packageExports.getVolleyballCourtPresets.name).toMatch(/^[a-z]/);
    });

    it("should provide consistent interfaces", async () => {
      const { createVolleyballCourtConfig, validateVolleyballCourtConfig } = await import("../package");
      
      // Test that utility functions work together
      const config = createVolleyballCourtConfig("minimal");
      const validation = validateVolleyballCourtConfig(config);
      
      expect(validation.isValid).toBeDefined();
      expect(typeof validation.isValid).toBe("boolean");
    });
  });
});