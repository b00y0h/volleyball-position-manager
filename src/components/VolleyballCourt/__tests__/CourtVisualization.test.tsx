/**
 * Unit tests for CourtVisualization component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CourtVisualization } from "../CourtVisualization";
import { CourtDimensions } from "../types";

describe("CourtVisualization", () => {
  const defaultDimensions: CourtDimensions = {
    width: 600,
    height: 360,
    aspectRatio: 600 / 360,
  };

  describe("Basic Rendering", () => {
    it("renders SVG with correct viewBox", () => {
      render(<CourtVisualization dimensions={defaultDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("viewBox", "0 0 600 360");
    });

    it("renders with custom dimensions", () => {
      const customDimensions: CourtDimensions = {
        width: 800,
        height: 480,
        aspectRatio: 800 / 480,
      };

      render(<CourtVisualization dimensions={customDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");
      expect(svg).toHaveAttribute("viewBox", "0 0 800 480");
    });

    it("applies custom className", () => {
      render(
        <CourtVisualization
          dimensions={defaultDimensions}
          className="custom-court"
        />
      );

      const svg = screen.getByTestId("volleyball-court-visualization");
      expect(svg).toHaveClass("volleyball-court-svg", "custom-court");
    });
  });

  describe("Court Elements", () => {
    it("renders court background rectangle", () => {
      render(<CourtVisualization dimensions={defaultDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");
      const courtBackground = svg.querySelector("rect");

      expect(courtBackground).toBeInTheDocument();
      expect(courtBackground).toHaveAttribute("width", "600");
      expect(courtBackground).toHaveAttribute("height", "360");
      expect(courtBackground).toHaveAttribute("rx", "8");
    });

    it("renders net line", () => {
      render(<CourtVisualization dimensions={defaultDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");
      const netLine = svg.querySelector(".net-line");

      expect(netLine).toBeInTheDocument();
      expect(netLine).toHaveAttribute("x1", "0");
      expect(netLine).toHaveAttribute("x2", "600");
      expect(parseFloat(netLine.getAttribute("y1") || "0")).toBeCloseTo(
        43.2,
        1
      ); // 360 * 0.12
      expect(parseFloat(netLine.getAttribute("y2") || "0")).toBeCloseTo(
        43.2,
        1
      );
      expect(netLine).toHaveAttribute("stroke-width", "3");
    });

    it("renders attack line", () => {
      render(<CourtVisualization dimensions={defaultDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");
      const attackLine = svg.querySelector(".attack-line");

      expect(attackLine).toBeInTheDocument();
      expect(attackLine).toHaveAttribute("x1", "0");
      expect(attackLine).toHaveAttribute("x2", "600");
      expect(attackLine).toHaveAttribute("y1", "108"); // 360 * 0.3
      expect(attackLine).toHaveAttribute("y2", "108");
      expect(attackLine).toHaveAttribute("stroke-dasharray", "6 4");
    });

    it("renders position markers", () => {
      render(<CourtVisualization dimensions={defaultDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");
      const positionMarkers = svg.querySelectorAll(".position-markers circle");

      expect(positionMarkers).toHaveLength(6); // 6 positions

      // Check first position marker (position 1)
      const position1Marker = svg.querySelector(".position-marker-1 circle");
      expect(position1Marker).toBeInTheDocument();
      expect(position1Marker).toHaveAttribute("cx", "468"); // 600 * 0.78
      expect(position1Marker).toHaveAttribute("cy", "295.2"); // 360 * 0.82
      expect(position1Marker).toHaveAttribute("r", "6");
    });

    it("renders position labels", () => {
      render(<CourtVisualization dimensions={defaultDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");
      const positionLabels = svg.querySelectorAll(".position-markers text");

      expect(positionLabels).toHaveLength(6);

      // Check that all positions 1-6 are labeled
      const labelTexts = Array.from(positionLabels).map(
        (label) => label.textContent
      );
      expect(labelTexts).toEqual(["1", "2", "3", "4", "5", "6"]);
    });

    it("renders court labels", () => {
      render(<CourtVisualization dimensions={defaultDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");
      const courtLabels = svg.querySelectorAll(".court-labels text");

      expect(courtLabels).toHaveLength(2);
      expect(courtLabels[0]).toHaveTextContent("Net");
      expect(courtLabels[1]).toHaveTextContent("Attack Line");
    });
  });

  describe("Theming", () => {
    it("applies light theme colors by default", () => {
      render(<CourtVisualization dimensions={defaultDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");
      const courtBackground = svg.querySelector("rect");

      expect(courtBackground).toHaveAttribute("fill", "#f7f7f9");
      expect(courtBackground).toHaveAttribute("stroke", "#ccc");
    });

    it("applies dark theme colors", () => {
      render(
        <CourtVisualization dimensions={defaultDimensions} theme="dark" />
      );

      const svg = screen.getByTestId("volleyball-court-visualization");
      const courtBackground = svg.querySelector("rect");

      expect(courtBackground).toHaveAttribute("fill", "#374151");
      expect(courtBackground).toHaveAttribute("stroke", "#6b7280");
    });

    it("applies custom court color", () => {
      render(
        <CourtVisualization
          dimensions={defaultDimensions}
          courtColor="#ff0000"
        />
      );

      const svg = screen.getByTestId("volleyball-court-visualization");
      const courtBackground = svg.querySelector("rect");

      expect(courtBackground).toHaveAttribute("fill", "#ff0000");
    });
  });

  describe("Optional Features", () => {
    it("renders grid lines when showGrid is true", () => {
      render(
        <CourtVisualization dimensions={defaultDimensions} showGrid={true} />
      );

      const svg = screen.getByTestId("volleyball-court-visualization");
      const gridGroup = svg.querySelector(".court-grid");

      expect(gridGroup).toBeInTheDocument();

      // Should have vertical and horizontal grid lines
      const gridLines = gridGroup?.querySelectorAll("line");
      expect(gridLines).toHaveLength(4); // 2 vertical + 2 horizontal
    });

    it("does not render grid lines by default", () => {
      render(<CourtVisualization dimensions={defaultDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");
      const gridGroup = svg.querySelector(".court-grid");

      expect(gridGroup).not.toBeInTheDocument();
    });

    it("renders court zones when showZones is true (default)", () => {
      render(<CourtVisualization dimensions={defaultDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");
      const zonesGroup = svg.querySelector(".court-zones");

      expect(zonesGroup).toBeInTheDocument();

      const zoneRects = zonesGroup?.querySelectorAll("rect");
      expect(zoneRects).toHaveLength(2); // Front row + back row zones
    });

    it("does not render court zones when showZones is false", () => {
      render(
        <CourtVisualization dimensions={defaultDimensions} showZones={false} />
      );

      const svg = screen.getByTestId("volleyball-court-visualization");
      const zonesGroup = svg.querySelector(".court-zones");

      expect(zonesGroup).not.toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("scales elements proportionally with different dimensions", () => {
      const smallDimensions: CourtDimensions = {
        width: 300,
        height: 180,
        aspectRatio: 300 / 180,
      };

      render(<CourtVisualization dimensions={smallDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");

      // Check that position markers scale correctly
      const position1Marker = svg.querySelector(".position-marker-1 circle");
      expect(position1Marker).toHaveAttribute("cx", "234"); // 300 * 0.78
      expect(position1Marker).toHaveAttribute("cy", "147.6"); // 180 * 0.82

      // Check that lines scale correctly
      const netLine = svg.querySelector(".net-line");
      expect(netLine).toHaveAttribute("x2", "300");
      expect(parseFloat(netLine?.getAttribute("y1") || "0")).toBeCloseTo(
        21.6,
        1
      ); // 180 * 0.12
    });

    it("maintains aspect ratio with different court sizes", () => {
      const wideDimensions: CourtDimensions = {
        width: 1200,
        height: 720,
        aspectRatio: 1200 / 720,
      };

      render(<CourtVisualization dimensions={wideDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");
      expect(svg).toHaveAttribute("viewBox", "0 0 1200 720");

      // Verify proportional scaling
      const position3Marker = svg.querySelector(".position-marker-3 circle");
      expect(position3Marker).toHaveAttribute("cx", "600"); // 1200 * 0.5
      expect(position3Marker).toHaveAttribute("cy", "302.4"); // 720 * 0.42
    });
  });

  describe("Accessibility", () => {
    it("has proper SVG structure for screen readers", () => {
      render(<CourtVisualization dimensions={defaultDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");
      expect(svg).toHaveAttribute(
        "data-testid",
        "volleyball-court-visualization"
      );
      expect(svg.tagName).toBe("svg");
    });

    it("uses semantic grouping for court elements", () => {
      render(<CourtVisualization dimensions={defaultDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");

      expect(svg.querySelector(".position-markers")).toBeInTheDocument();
      expect(svg.querySelector(".court-labels")).toBeInTheDocument();
      expect(svg.querySelector(".net-line")).toBeInTheDocument();
      expect(svg.querySelector(".attack-line")).toBeInTheDocument();
    });

    it("uses readable fonts for text elements", () => {
      render(<CourtVisualization dimensions={defaultDimensions} />);

      const svg = screen.getByTestId("volleyball-court-visualization");
      const textElements = svg.querySelectorAll("text");

      textElements.forEach((text) => {
        expect(text).toHaveAttribute(
          "font-family",
          "system-ui, -apple-system, sans-serif"
        );
      });
    });
  });
});
