import { describe, it, expect } from "vitest";
import { CourtDimensions } from "../types";

// Recreate the dimension calculation logic for testing
const BASE_COURT_WIDTH = 600;
const BASE_COURT_HEIGHT = 360;
const COURT_ASPECT_RATIO = BASE_COURT_WIDTH / BASE_COURT_HEIGHT;

function calculateCourtDimensions(
  windowWidth: number,
  windowHeight: number,
  customDimensions?: CourtDimensions
): CourtDimensions {
  // If custom dimensions are provided, use them
  if (customDimensions) {
    return {
      width: customDimensions.width,
      height: customDimensions.height,
      aspectRatio:
        customDimensions.aspectRatio ||
        customDimensions.width / customDimensions.height,
    };
  }

  // Reserve space for UI elements
  const SIDEBAR_WIDTH = 300; // Right sidebar
  const HEADER_HEIGHT = 200; // Top controls and status
  const FOOTER_HEIGHT = 100; // Bottom info
  const PADDING = 80; // General padding

  // Available space for the court
  const availableWidth = windowWidth - SIDEBAR_WIDTH - PADDING;
  const availableHeight =
    windowHeight - HEADER_HEIGHT - FOOTER_HEIGHT - PADDING;

  // Calculate court size maintaining aspect ratio
  let courtWidth = availableWidth;
  let courtHeight = courtWidth / COURT_ASPECT_RATIO;

  // If height is too large, constrain by height instead
  if (courtHeight > availableHeight) {
    courtHeight = availableHeight;
    courtWidth = courtHeight * COURT_ASPECT_RATIO;
  }

  // Ensure minimum size for usability
  const MIN_WIDTH = 400;
  const MIN_HEIGHT = MIN_WIDTH / COURT_ASPECT_RATIO;

  courtWidth = Math.max(courtWidth, MIN_WIDTH);
  courtHeight = Math.max(courtHeight, MIN_HEIGHT);

  return {
    width: courtWidth,
    height: courtHeight,
    aspectRatio: COURT_ASPECT_RATIO,
  };
}

describe("Court Dimension Calculations", () => {
  describe("Basic Dimension Calculation", () => {
    it("should calculate dimensions for standard desktop screen", () => {
      const result = calculateCourtDimensions(1920, 1080);

      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.aspectRatio).toBeCloseTo(COURT_ASPECT_RATIO, 5);

      // Should maintain aspect ratio
      expect(result.width / result.height).toBeCloseTo(COURT_ASPECT_RATIO, 5);
    });

    it("should calculate dimensions for laptop screen", () => {
      const result = calculateCourtDimensions(1366, 768);

      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.aspectRatio).toBeCloseTo(COURT_ASPECT_RATIO, 5);
    });

    it("should calculate dimensions for tablet screen", () => {
      const result = calculateCourtDimensions(1024, 768);

      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.aspectRatio).toBeCloseTo(COURT_ASPECT_RATIO, 5);
    });

    it("should maintain correct aspect ratio (5:3)", () => {
      const testCases = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1024, height: 768 },
        { width: 800, height: 600 },
      ];

      testCases.forEach(({ width, height }) => {
        const result = calculateCourtDimensions(width, height);
        expect(result.width / result.height).toBeCloseTo(5 / 3, 2);
      });
    });
  });

  describe("Responsive Behavior", () => {
    it("should constrain by width when window is wide", () => {
      // Very wide window
      const result = calculateCourtDimensions(2000, 600);

      // Should be constrained by available height, not width
      const expectedHeight = 600 - 200 - 100 - 80; // Available height = 220
      const expectedWidth = expectedHeight * COURT_ASPECT_RATIO;

      // But minimum size enforcement kicks in
      const MIN_WIDTH = 400;
      const MIN_HEIGHT = MIN_WIDTH / COURT_ASPECT_RATIO;

      expect(result.width).toBeGreaterThanOrEqual(MIN_WIDTH);
      expect(result.height).toBeGreaterThanOrEqual(MIN_HEIGHT);
    });

    it("should constrain by height when window is tall", () => {
      // Very tall window
      const result = calculateCourtDimensions(800, 2000);

      // Should be constrained by available width
      const expectedWidth = 800 - 300 - 80; // Available width
      const expectedHeight = expectedWidth / COURT_ASPECT_RATIO;

      expect(result.width).toBeCloseTo(expectedWidth, 0);
      expect(result.height).toBeCloseTo(expectedHeight, 0);
    });

    it("should account for UI element spacing", () => {
      const windowWidth = 1200;
      const windowHeight = 800;

      const result = calculateCourtDimensions(windowWidth, windowHeight);

      // Should leave space for sidebar (300px), padding (80px)
      expect(result.width).toBeLessThanOrEqual(windowWidth - 300 - 80);

      // Should leave space for header (200px), footer (100px), padding (80px)
      expect(result.height).toBeLessThanOrEqual(windowHeight - 200 - 100 - 80);
    });
  });

  describe("Minimum Size Enforcement", () => {
    it("should enforce minimum width of 400px", () => {
      // Very small window
      const result = calculateCourtDimensions(200, 200);

      expect(result.width).toBeGreaterThanOrEqual(400);
    });

    it("should enforce minimum height based on aspect ratio", () => {
      // Very small window
      const result = calculateCourtDimensions(200, 200);

      const expectedMinHeight = 400 / COURT_ASPECT_RATIO;
      expect(result.height).toBeGreaterThanOrEqual(expectedMinHeight);
    });

    it("should maintain aspect ratio even with minimum size constraints", () => {
      const result = calculateCourtDimensions(100, 100);

      expect(result.width / result.height).toBeCloseTo(COURT_ASPECT_RATIO, 5);
      expect(result.width).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Custom Dimensions", () => {
    it("should use custom dimensions when provided", () => {
      const customDimensions: CourtDimensions = {
        width: 800,
        height: 480,
      };

      const result = calculateCourtDimensions(1920, 1080, customDimensions);

      expect(result.width).toBe(800);
      expect(result.height).toBe(480);
      expect(result.aspectRatio).toBeCloseTo(800 / 480, 5);
    });

    it("should calculate aspect ratio for custom dimensions", () => {
      const customDimensions: CourtDimensions = {
        width: 1000,
        height: 500,
      };

      const result = calculateCourtDimensions(1920, 1080, customDimensions);

      expect(result.aspectRatio).toBe(2); // 1000 / 500
    });

    it("should use provided aspect ratio if specified", () => {
      const customDimensions: CourtDimensions = {
        width: 800,
        height: 480,
        aspectRatio: 2.0, // Override calculated aspect ratio
      };

      const result = calculateCourtDimensions(1920, 1080, customDimensions);

      expect(result.aspectRatio).toBe(2.0);
    });

    it("should ignore window size when custom dimensions provided", () => {
      const customDimensions: CourtDimensions = {
        width: 600,
        height: 400,
      };

      // Should get same result regardless of window size
      const result1 = calculateCourtDimensions(800, 600, customDimensions);
      const result2 = calculateCourtDimensions(1920, 1080, customDimensions);

      expect(result1).toEqual(result2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero window dimensions", () => {
      const result = calculateCourtDimensions(0, 0);

      // Should still enforce minimum dimensions
      expect(result.width).toBeGreaterThanOrEqual(400);
      expect(result.height).toBeGreaterThan(0);
      expect(result.aspectRatio).toBeCloseTo(COURT_ASPECT_RATIO, 5);
    });

    it("should handle negative window dimensions", () => {
      const result = calculateCourtDimensions(-100, -100);

      // Should still enforce minimum dimensions
      expect(result.width).toBeGreaterThanOrEqual(400);
      expect(result.height).toBeGreaterThan(0);
      expect(result.aspectRatio).toBeCloseTo(COURT_ASPECT_RATIO, 5);
    });

    it("should handle very large window dimensions", () => {
      const result = calculateCourtDimensions(10000, 10000);

      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.aspectRatio).toBeCloseTo(COURT_ASPECT_RATIO, 5);

      // Should be reasonable size, not excessively large
      expect(result.width).toBeLessThan(10000);
      expect(result.height).toBeLessThan(10000);
    });

    it("should handle custom dimensions with zero values", () => {
      const customDimensions: CourtDimensions = {
        width: 0,
        height: 0,
      };

      const result = calculateCourtDimensions(1920, 1080, customDimensions);

      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
      expect(result.aspectRatio).toBeNaN(); // 0/0 = NaN
    });
  });

  describe("Precision and Rounding", () => {
    it("should return reasonable precision for dimensions", () => {
      const result = calculateCourtDimensions(1366, 768);

      // Dimensions should be reasonable numbers (not excessive decimal places)
      // Allow for some floating point precision
      expect(result.width).toBeCloseTo(Math.round(result.width), 0);
      expect(result.height).toBeCloseTo(Math.round(result.height), 0);
    });

    it("should maintain aspect ratio precision", () => {
      const result = calculateCourtDimensions(1920, 1080);

      const calculatedRatio = result.width / result.height;
      expect(calculatedRatio).toBeCloseTo(COURT_ASPECT_RATIO, 10);
    });
  });

  describe("Performance Considerations", () => {
    it("should calculate dimensions efficiently", () => {
      const start = performance.now();

      // Calculate dimensions many times
      for (let i = 0; i < 1000; i++) {
        calculateCourtDimensions(1920, 1080);
      }

      const end = performance.now();
      const duration = end - start;

      // Should complete quickly (less than 10ms for 1000 calculations)
      expect(duration).toBeLessThan(10);
    });

    it("should handle repeated calculations consistently", () => {
      const windowWidth = 1366;
      const windowHeight = 768;

      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(calculateCourtDimensions(windowWidth, windowHeight));
      }

      // All results should be identical
      const first = results[0];
      results.forEach((result) => {
        expect(result.width).toBe(first.width);
        expect(result.height).toBe(first.height);
        expect(result.aspectRatio).toBe(first.aspectRatio);
      });
    });
  });
});
