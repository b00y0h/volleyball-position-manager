"use client";

import React, { useState, useEffect, useMemo } from "react";
import { VolleyballCourtProps, ViolationData, ErrorData } from "./types";
import {
  VolleyballCourtProvider,
  useVolleyballCourt,
} from "./VolleyballCourtProvider";
import { CourtVisualization } from "./CourtVisualization";
import { calculateCourtDimensions } from "./courtCoordinates";
import { VolleyballCourtErrorBoundary } from "./VolleyballCourtErrorBoundary";
import { ValidationLayer } from "./ValidationLayer";
import { NotificationLayer } from "./NotificationLayer";
import { ReadOnlyIndicator } from "./ReadOnlyIndicator";
import { ConfigurationManager } from "./ConfigurationUtils";


// Internal component that uses the context
const VolleyballCourtInternal: React.FC = () => {
  const { state, config, hasURLData, persistenceManager } =
    useVolleyballCourt();

  // Track hydration to prevent SSR/client mismatch
  const [isHydrated, setIsHydrated] = useState(false);

  // Track errors and violations for notification system
  const [errors, setErrors] = useState<ErrorData[]>([]);
  const [violations, setViolations] = useState<ViolationData[]>([]);

  // Get window size for responsive court sizing
  const windowSize = useWindowSize();

  // Set hydrated flag after component mounts
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Convert state violations to ViolationData format
  useEffect(() => {
    const violationData: ViolationData[] = state.violations.map(
      (violation, index) => ({
        code: `VIOLATION_${index}`,
        message: violation,
        affectedPlayers: [], // Would need to be populated by rules engine
        severity: "error" as const,
      })
    );
    setViolations(violationData);
  }, [state.violations]);

  // Handle errors from state
  useEffect(() => {
    if (state.error) {
      const errorData: ErrorData = {
        type: "unknown",
        message: state.error,
        details: null,
      };
      setErrors([errorData]);
    } else {
      setErrors([]);
    }
  }, [state.error]);

  // Calculate responsive court dimensions
  const courtDimensions = useMemo(() => {
    if (!isHydrated) {
      // Use base dimensions during SSR to match initial render
      return {
        width: BASE_COURT_WIDTH,
        height: BASE_COURT_HEIGHT,
        aspectRatio: COURT_ASPECT_RATIO,
      };
    }
    return calculateCourtDimensions(windowSize.width, windowSize.height);
  }, [windowSize.width, windowSize.height, isHydrated]);

  // Determine theme for court visualization
  const courtTheme = useMemo(() => {
    if (config.appearance.theme === "auto") {
      // Auto-detect theme based on system preference
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      return "light";
    }
    return config.appearance.theme || "light";
  }, [config.appearance.theme]);

  // Render placeholder during SSR or while loading
  if (!isHydrated || state.isLoading) {
    return (
      <div
        className="volleyball-court-loading"
        style={{
          width: courtDimensions.width,
          height: courtDimensions.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
        }}
      >
        <div className="text-gray-500">Loading volleyball court...</div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div
        className="volleyball-court-error"
        style={{
          width: courtDimensions.width,
          height: courtDimensions.height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <div className="text-red-600 font-medium mb-2">
          Error loading volleyball court
        </div>
        <div className="text-red-500 text-sm text-center">{state.error}</div>
      </div>
    );
  }

  // Handle clearing URL data to enable editing
  const handleClearURL = () => {
    persistenceManager.clearURL();
    // Force a page reload to clear the URL state
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="volleyball-court-container">
      {/* Read-only indicator */}
      <ReadOnlyIndicator
        isReadOnly={state.isReadOnly}
        hasURLData={hasURLData()}
        onClearURL={handleClearURL}
        className="mb-2"
      />

      <div
        className="volleyball-court"
        style={{
          width: courtDimensions.width,
          height: courtDimensions.height,
          position: "relative",
          backgroundColor: courtTheme === "dark" ? "#1f2937" : "#ffffff",
          border: `1px solid ${courtTheme === "dark" ? "#374151" : "#d1d5db"}`,
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {/* Court Visualization Layer */}
        <CourtVisualization
          dimensions={courtDimensions}
          theme={courtTheme}
          courtColor={config.appearance.courtColor}
          showGrid={false} // Can be made configurable later
          showZones={true} // Can be made configurable later
          className="absolute inset-0"
        />

        {/* Validation Layer - Shows rule violations */}
        {config.validation?.showViolationDetails && violations.length > 0 && (
          <ValidationLayer
            violations={violations}
            showDetails={config.validation.showViolationDetails}
            onDismiss={() => setViolations([])}
          />
        )}

        {/* Temporary overlay with component info */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-lg">
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Volleyball Court Component
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            System: {state.system} | Rotation: {state.rotationIndex + 1} |
            Formation: {state.formation}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {courtDimensions.width} × {courtDimensions.height}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Context provider active - State management working
          </div>
          {violations.length > 0 && (
            <div className="text-xs text-red-500 mt-1">
              {violations.length} violation{violations.length > 1 ? "s" : ""}{" "}
              detected
            </div>
          )}
        </div>
      </div>

      </div>

      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute top-2 left-2 text-xs text-gray-400 bg-white/80 dark:bg-gray-800/80 p-1 rounded">
          Players: {config.players[state.system].length} | ReadOnly:{" "}
          {state.isReadOnly ? "Yes" : "No"} | Theme: {courtTheme} | Violations:{" "}
          {state.violations.length} | Errors: {errors.length}
        </div>
      )}
    </div>
  );
};

// Base court dimensions (aspect ratio 5:3 for volleyball court)
const BASE_COURT_WIDTH = 600;
const BASE_COURT_HEIGHT = 360;
const COURT_ASPECT_RATIO = BASE_COURT_WIDTH / BASE_COURT_HEIGHT;

// Custom hook for window size tracking
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial size

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}

// Note: calculateCourtDimensions is now imported from courtCoordinates.ts

// Main component that wraps the internal component with the provider
export const VolleyballCourt: React.FC<VolleyballCourtProps> = ({
  config,
  className = "",
  style,
  courtDimensions,
  readOnly = false,
  showControls = true,
  enableSharing = true,
  enablePersistence = true,
  onPositionChange,
  onRotationChange,
  onFormationChange,
  onViolation,
  onShare,
  onError,
  customPlayers,
  customRotations,
  validationConfig,
  animationConfig,
}) => {
  // Merge custom configurations into the main config
  const mergedConfig = useMemo(() => {
    const baseConfig = config || {};

    // Merge custom players if provided (with proper type handling)
    if (customPlayers) {
      baseConfig.players = {
        "5-1": customPlayers["5-1"] || baseConfig.players?.["5-1"] || [],
        "6-2": customPlayers["6-2"] || baseConfig.players?.["6-2"] || [],
      };
    }

    // Merge custom rotations if provided (with proper type handling)
    if (customRotations) {
      baseConfig.rotations = {
        "5-1": customRotations["5-1"] || baseConfig.rotations?.["5-1"] || [],
        "6-2": customRotations["6-2"] || baseConfig.rotations?.["6-2"] || [],
      };
    }

    // Merge validation config if provided
    if (validationConfig) {
      baseConfig.validation = {
        ...baseConfig.validation,
        ...validationConfig,
      };
    }

    return baseConfig;
  }, [config, customPlayers, customRotations, validationConfig]);

  // Calculate court dimensions for error boundary
  const errorBoundaryDimensions = useMemo(() => {
    if (courtDimensions) {
      return courtDimensions;
    }
    // Use base dimensions as fallback
    return {
      width: BASE_COURT_WIDTH,
      height: BASE_COURT_HEIGHT,
    };
  }, [courtDimensions]);

  return (
    <div className={className} style={style}>
      <NotificationLayer>
        <VolleyballCourtErrorBoundary
          onError={onError}
          courtDimensions={errorBoundaryDimensions}
        >
          <VolleyballCourtProvider
            config={mergedConfig}
            readOnly={readOnly}
            showControls={showControls}
            enableSharing={enableSharing}
            enablePersistence={enablePersistence}
            onPositionChange={onPositionChange}
            onRotationChange={onRotationChange}
            onFormationChange={onFormationChange}
            onViolation={onViolation}
            onShare={onShare}
            onError={onError}
          >
            <VolleyballCourtInternal />
          </VolleyballCourtProvider>
        </VolleyballCourtErrorBoundary>
      </NotificationLayer>
    </div>
  );
};
