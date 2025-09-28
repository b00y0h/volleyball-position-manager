"use client";

import React, { useMemo } from "react";
import { CourtVisualizationProps } from "./types";

/**
 * CourtVisualization component - Renders the SVG volleyball court
 *
 * This component extracts the court rendering logic from the main page
 * and provides a reusable, configurable court visualization with:
 * - Responsive sizing and aspect ratio maintenance
 * - Theming support for light/dark mode
 * - Court zones and position markers
 * - Clean SVG structure for overlaying players and guidelines
 */
export const CourtVisualization: React.FC<CourtVisualizationProps> = ({
  dimensions,
  theme = "light",
  courtColor,
  showGrid = false,
  showZones = true,
  className = "",
}) => {
  // Calculate theme-based colors
  const colors = useMemo(() => {
    const isDark = theme === "dark";

    return {
      // Court background
      courtBackground: courtColor || (isDark ? "#374151" : "#f7f7f9"),

      // Court borders and lines
      courtBorder: isDark ? "#6b7280" : "#ccc",
      netLine: isDark ? "#e5e7eb" : "#333",
      attackLine: isDark ? "#9ca3af" : "#aaa",

      // Position markers
      positionMarker: isDark ? "#4b5563" : "#ddd",
      positionText: isDark ? "#9ca3af" : "#666",

      // Grid lines (if enabled)
      gridLines: isDark ? "#4b5563" : "#e5e7eb",
    };
  }, [theme, courtColor]);

  // Calculate court zones and markers
  const courtElements = useMemo(() => {
    const { width, height } = dimensions;

    // Base position coordinates (scaled to current dimensions)
    const basePositions = {
      1: { x: width * 0.78, y: height * 0.82 }, // right-back
      2: { x: width * 0.78, y: height * 0.42 }, // right-front
      3: { x: width * 0.5, y: height * 0.42 }, // middle-front
      4: { x: width * 0.22, y: height * 0.42 }, // left-front
      5: { x: width * 0.22, y: height * 0.82 }, // left-back
      6: { x: width * 0.5, y: height * 0.82 }, // middle-back
    };

    // Court lines
    const netLine = {
      x1: 0,
      y1: height * 0.12,
      x2: width,
      y2: height * 0.12,
    };

    const attackLine = {
      x1: 0,
      y1: height * 0.3,
      x2: width,
      y2: height * 0.3,
    };

    // Grid lines (if enabled)
    const gridLines = showGrid
      ? {
          vertical: [
            { x: width * 0.33, y1: 0, y2: height },
            { x: width * 0.67, y1: 0, y2: height },
          ],
          horizontal: [
            { x1: 0, x2: width, y: height * 0.5 },
            { x1: 0, x2: width, y: height * 0.7 },
          ],
        }
      : null;

    return {
      basePositions,
      netLine,
      attackLine,
      gridLines,
    };
  }, [dimensions, showGrid]);

  return (
    <svg
      data-testid="volleyball-court-visualization"
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      width="100%"
      height={dimensions.height}
      className={`volleyball-court-svg ${className}`}
      style={{
        userSelect: "none",
        display: "block",
      }}
    >
      {/* Court background */}
      <rect
        x={0}
        y={0}
        width={dimensions.width}
        height={dimensions.height}
        fill={colors.courtBackground}
        stroke={colors.courtBorder}
        strokeWidth={2}
        rx={8}
        ry={8}
      />

      {/* Grid lines (optional) */}
      {courtElements.gridLines && (
        <g className="court-grid" opacity={0.3}>
          {courtElements.gridLines.vertical.map((line, index) => (
            <line
              key={`grid-v-${index}`}
              x1={line.x}
              y1={line.y1}
              x2={line.x}
              y2={line.y2}
              stroke={colors.gridLines}
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          ))}
          {courtElements.gridLines.horizontal.map((line, index) => (
            <line
              key={`grid-h-${index}`}
              x1={line.x1}
              y1={line.y}
              x2={line.x2}
              y2={line.y}
              stroke={colors.gridLines}
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          ))}
        </g>
      )}

      {/* Net line */}
      <line
        className="net-line"
        x1={courtElements.netLine.x1}
        y1={courtElements.netLine.y1}
        x2={courtElements.netLine.x2}
        y2={courtElements.netLine.y2}
        stroke={colors.netLine}
        strokeWidth={3}
      />

      {/* Attack line */}
      <line
        className="attack-line"
        x1={courtElements.attackLine.x1}
        y1={courtElements.attackLine.y1}
        x2={courtElements.attackLine.x2}
        y2={courtElements.attackLine.y2}
        stroke={colors.attackLine}
        strokeWidth={2}
        strokeDasharray="6 4"
      />

      {/* Court zones (if enabled) */}
      {showZones && (
        <g className="court-zones" opacity={0.1}>
          {/* Front row zone */}
          <rect
            x={0}
            y={dimensions.height * 0.12}
            width={dimensions.width}
            height={dimensions.height * 0.18}
            fill={colors.attackLine}
          />

          {/* Back row zone */}
          <rect
            x={0}
            y={dimensions.height * 0.3}
            width={dimensions.width}
            height={dimensions.height * 0.7}
            fill={colors.positionMarker}
          />
        </g>
      )}

      {/* Base position markers */}
      <g className="position-markers">
        {Object.entries(courtElements.basePositions).map(
          ([position, coords]) => (
            <g
              key={`marker-${position}`}
              className={`position-marker-${position}`}
            >
              <circle
                cx={coords.x}
                cy={coords.y}
                r={6}
                fill={colors.positionMarker}
                stroke={colors.courtBorder}
                strokeWidth={1}
                opacity={0.6}
              />
              <text
                x={coords.x + 12}
                y={coords.y + 4}
                fontSize={12}
                fill={colors.positionText}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="500"
              >
                {position}
              </text>
            </g>
          )
        )}
      </g>

      {/* Court labels */}
      <g className="court-labels" opacity={0.7}>
        <text
          x={dimensions.width / 2}
          y={dimensions.height * 0.06}
          fontSize={14}
          fill={colors.positionText}
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
        >
          Net
        </text>

        <text
          x={dimensions.width / 2}
          y={dimensions.height * 0.25}
          fontSize={12}
          fill={colors.positionText}
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          opacity={0.8}
        >
          Attack Line
        </text>
      </g>
    </svg>
  );
};

export default CourtVisualization;
