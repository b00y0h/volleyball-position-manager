"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  VolleyballCourtProps,
  VolleyballCourtConfig,
  CourtDimensions,
} from "./types";
import { SystemType, FormationType } from "@/types";
import { useEnhancedPositionManager } from "@/hooks/useEnhancedPositionManager";
import { CourtVisualization } from "./CourtVisualization";
import { calculateCourtDimensions } from "./courtCoordinates";

// Default configuration
const DEFAULT_CONFIG: Required<VolleyballCourtConfig> = {
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

// Function to merge configurations with defaults
function mergeConfig(
  userConfig?: VolleyballCourtConfig
): Required<VolleyballCourtConfig> {
  if (!userConfig) return DEFAULT_CONFIG;

  return {
    initialSystem: userConfig.initialSystem ?? DEFAULT_CONFIG.initialSystem,
    initialRotation:
      userConfig.initialRotation ?? DEFAULT_CONFIG.initialRotation,
    initialFormation:
      userConfig.initialFormation ?? DEFAULT_CONFIG.initialFormation,

    players: {
      "5-1": userConfig.players?.["5-1"] ?? DEFAULT_CONFIG.players["5-1"],
      "6-2": userConfig.players?.["6-2"] ?? DEFAULT_CONFIG.players["6-2"],
    },

    rotations: {
      "5-1": userConfig.rotations?.["5-1"] ?? DEFAULT_CONFIG.rotations["5-1"],
      "6-2": userConfig.rotations?.["6-2"] ?? DEFAULT_CONFIG.rotations["6-2"],
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

export const VolleyballCourt: React.FC<VolleyballCourtProps> = ({
  config,
  className = "",
  style,
  courtDimensions: customCourtDimensions,
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
  // Merge configuration with defaults
  const mergedConfig = useMemo(() => mergeConfig(config), [config]);

  // Track hydration to prevent SSR/client mismatch
  const [isHydrated, setIsHydrated] = useState(false);

  // Get window size for responsive court sizing
  const windowSize = useWindowSize();

  // Core state
  const [system, setSystem] = useState<SystemType>(mergedConfig.initialSystem);
  const [rotationIndex, setRotationIndex] = useState(
    mergedConfig.initialRotation
  );
  const [formation, setFormation] = useState<FormationType>(
    mergedConfig.initialFormation
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);

  // UI state
  const [violations, setViolations] = useState<string[]>([]);
  const [shareURL, setShareURL] = useState<string>("");
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Initialize position manager
  const positionManager = useEnhancedPositionManager();

  // Set hydrated flag after component mounts
  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
    return calculateCourtDimensions(
      windowSize.width,
      windowSize.height,
      customCourtDimensions
    );
  }, [windowSize.width, windowSize.height, isHydrated, customCourtDimensions]);

  // Determine theme for court visualization
  const courtTheme = useMemo(() => {
    if (mergedConfig.appearance.theme === "auto") {
      // Auto-detect theme based on system preference
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      return "light";
    }
    return mergedConfig.appearance.theme || "light";
  }, [mergedConfig.appearance.theme]);

  // Event handlers
  const handleSystemChange = useCallback(
    (newSystem: SystemType) => {
      setSystem(newSystem);
      onRotationChange?.(newSystem);
    },
    [onRotationChange]
  );

  const handleRotationChange = useCallback(
    (newRotation: number) => {
      setRotationIndex(newRotation);
      onRotationChange?.(newRotation);
    },
    [onRotationChange]
  );

  const handleFormationChange = useCallback(
    (newFormation: FormationType) => {
      setFormation(newFormation);
      onFormationChange?.(newFormation);
    },
    [onFormationChange]
  );

  const handleDragStart = useCallback(
    (playerId: string) => {
      if (!readOnly) {
        setDraggedPlayer(playerId);
        setViolations([]); // Clear violations when starting drag
      }
    },
    [readOnly]
  );

  const handleDragEnd = useCallback(
    (playerId: string, success: boolean) => {
      setDraggedPlayer(null);
      setViolations([]); // Clear violations when ending drag

      if (success && onPositionChange) {
        try {
          const allPositions = positionManager.getAllPositions(
            system,
            rotationIndex,
            formation
          );
          onPositionChange({
            system,
            rotation: rotationIndex,
            formation,
            positions: allPositions as Record<string, any>,
          });
        } catch (error) {
          onError?.({
            type: "validation",
            message: "Failed to get position data",
            details: error,
          });
        }
      }
    },
    [
      system,
      rotationIndex,
      formation,
      positionManager,
      onPositionChange,
      onError,
    ]
  );

  // Get current players and rotation mapping
  const currentPlayers = useMemo(() => {
    return customPlayers?.[system] ?? mergedConfig.players[system];
  }, [system, customPlayers, mergedConfig.players]);

  const currentRotations = useMemo(() => {
    return customRotations?.[system] ?? mergedConfig.rotations[system];
  }, [system, customRotations, mergedConfig.rotations]);

  const currentRotationMap = useMemo(() => {
    // Ensure we have valid rotations array
    if (
      !currentRotations ||
      !Array.isArray(currentRotations) ||
      currentRotations.length === 0
    ) {
      return {};
    }

    // Ensure rotation index is valid
    const validRotationIndex = Math.max(
      0,
      Math.min(rotationIndex, currentRotations.length - 1)
    );
    return currentRotations[validRotationIndex] || currentRotations[0] || {};
  }, [currentRotations, rotationIndex]);

  // Render placeholder during SSR or while loading
  if (!isHydrated || positionManager.isLoading) {
    return (
      <div
        className={`volleyball-court-loading ${className}`}
        style={{
          width: courtDimensions.width,
          height: courtDimensions.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          ...style,
        }}
      >
        <div className="text-gray-500">Loading volleyball court...</div>
      </div>
    );
  }

  // Error state
  if (positionManager.error) {
    return (
      <div
        className={`volleyball-court-error ${className}`}
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
          ...style,
        }}
      >
        <div className="text-red-600 font-medium mb-2">
          Error loading volleyball court
        </div>
        <div className="text-red-500 text-sm text-center">
          {positionManager.error}
        </div>
        <button
          onClick={positionManager.clearError}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className={`volleyball-court ${className}`}
      style={{
        width: courtDimensions.width,
        height: courtDimensions.height,
        position: "relative",
        backgroundColor: courtTheme === "dark" ? "#1f2937" : "#ffffff",
        border: `1px solid ${courtTheme === "dark" ? "#374151" : "#d1d5db"}`,
        borderRadius: "8px",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Court Visualization Layer */}
      <CourtVisualization
        dimensions={courtDimensions}
        theme={courtTheme}
        courtColor={mergedConfig.appearance.courtColor}
        showGrid={false} // Can be made configurable later
        showZones={true} // Can be made configurable later
        className="absolute inset-0"
      />

      {/* Temporary overlay with component info */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-lg">
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Volleyball Court Component
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            System: {system} | Rotation: {rotationIndex + 1} | Formation:{" "}
            {formation}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {courtDimensions.width} × {courtDimensions.height}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Court visualization layer active
          </div>
        </div>
      </div>

      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute top-2 left-2 text-xs text-gray-400 bg-white/80 dark:bg-gray-800/80 p-1 rounded">
          Players: {currentPlayers.length} | Rotations:{" "}
          {currentRotations.length} | ReadOnly: {readOnly ? "Yes" : "No"} |
          Theme: {courtTheme}
        </div>
      )}
    </div>
  );
};
