"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { SystemType, FormationType, PlayerPosition } from "@/types";
import {
  useEnhancedPositionManager,
  EnhancedPositionManager,
} from "@/hooks/useEnhancedPositionManager";
import {
  VolleyballCourtProps,
  VolleyballCourtConfig,
  VolleyballCourtState,
  PositionData,
  ViolationData,
  ShareData,
  ErrorData,
  ConstraintBoundaries,
  PlayerDefinition,
  RotationMapping,
} from "./types";

// Context interface
interface VolleyballCourtContextValue {
  // State
  state: VolleyballCourtState;

  // Position manager
  positionManager: EnhancedPositionManager;

  // State update methods
  setSystem: (system: SystemType) => void;
  setRotationIndex: (rotation: number) => void;
  setFormation: (formation: FormationType) => void;
  setIsAnimating: (animating: boolean) => void;
  setDraggedPlayer: (playerId: string | null) => void;
  setViolations: (violations: string[]) => void;
  setVisualGuidelines: (guidelines: ConstraintBoundaries) => void;
  setIsReadOnly: (readOnly: boolean) => void;
  setShowControls: (show: boolean) => void;
  setShareURL: (url: string) => void;
  setShowShareDialog: (show: boolean) => void;
  setError: (error: string | null) => void;

  // Configuration
  config: Required<VolleyballCourtConfig>;

  // Callback handlers
  handlePositionChange: (positions: Record<string, PlayerPosition>) => void;
  handleRotationChange: (rotation: number) => void;
  handleFormationChange: (formation: FormationType) => void;
  handleViolation: (violations: ViolationData[]) => void;
  handleShare: (shareData: ShareData) => void;
  handleError: (error: ErrorData) => void;
}

// Create context
const VolleyballCourtContext =
  createContext<VolleyballCourtContextValue | null>(null);

// Default configuration
const DEFAULT_CONFIG: Required<VolleyballCourtConfig> = {
  initialSystem: "5-1",
  initialRotation: 0,
  initialFormation: "base",
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
  rotations: {
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
    courtColor: "#2563eb",
    playerColors: {},
    showPlayerNames: true,
    showPositionLabels: true,
  },
};

// Provider props
interface VolleyballCourtProviderProps {
  children: React.ReactNode;
  config?: VolleyballCourtConfig;
  readOnly?: boolean;
  showControls?: boolean;
  enableSharing?: boolean;
  enablePersistence?: boolean;
  onPositionChange?: (positions: PositionData) => void;
  onRotationChange?: (rotation: number) => void;
  onFormationChange?: (formation: FormationType) => void;
  onViolation?: (violations: ViolationData[]) => void;
  onShare?: (shareData: ShareData) => void;
  onError?: (error: ErrorData) => void;
}

// Provider component
export function VolleyballCourtProvider({
  children,
  config: userConfig,
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
}: VolleyballCourtProviderProps) {
  // Merge user config with defaults
  const config = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...userConfig,
      players: {
        ...DEFAULT_CONFIG.players,
        ...userConfig?.players,
      },
      rotations: {
        ...DEFAULT_CONFIG.rotations,
        ...userConfig?.rotations,
      },
      controls: {
        ...DEFAULT_CONFIG.controls,
        ...userConfig?.controls,
      },
      validation: {
        ...DEFAULT_CONFIG.validation,
        ...userConfig?.validation,
      },
      appearance: {
        ...DEFAULT_CONFIG.appearance,
        ...userConfig?.appearance,
      },
    }),
    [userConfig]
  );

  // Initialize position manager
  const positionManager = useEnhancedPositionManager();

  // Initialize state
  const [state, setState] = React.useState<VolleyballCourtState>(() => ({
    system: config.initialSystem,
    rotationIndex: config.initialRotation,
    formation: config.initialFormation,
    isAnimating: false,
    draggedPlayer: null,
    violations: [],
    visualGuidelines: {
      horizontalLines: [],
      verticalLines: [],
    },
    isReadOnly: readOnly,
    showControls,
    shareURL: "",
    showShareDialog: false,
    positions: positionManager.getFormationPositions(
      config.initialSystem,
      config.initialRotation,
      config.initialFormation
    ),
    isLoading: false,
    error: null,
  }));

  // State update methods
  const setSystem = useCallback((system: SystemType) => {
    setState((prev) => ({ ...prev, system }));
  }, []);

  const setRotationIndex = useCallback((rotation: number) => {
    setState((prev) => ({ ...prev, rotationIndex: rotation }));
  }, []);

  const setFormation = useCallback((formation: FormationType) => {
    setState((prev) => ({ ...prev, formation }));
  }, []);

  const setIsAnimating = useCallback((animating: boolean) => {
    setState((prev) => ({ ...prev, isAnimating: animating }));
  }, []);

  const setDraggedPlayer = useCallback((playerId: string | null) => {
    setState((prev) => ({ ...prev, draggedPlayer: playerId }));
  }, []);

  const setViolations = useCallback((violations: string[]) => {
    setState((prev) => ({ ...prev, violations }));
  }, []);

  const setVisualGuidelines = useCallback(
    (guidelines: ConstraintBoundaries) => {
      setState((prev) => ({ ...prev, visualGuidelines: guidelines }));
    },
    []
  );

  const setIsReadOnly = useCallback((readOnly: boolean) => {
    setState((prev) => ({ ...prev, isReadOnly: readOnly }));
  }, []);

  const setShowControls = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showControls: show }));
  }, []);

  const setShareURL = useCallback((url: string) => {
    setState((prev) => ({ ...prev, shareURL: url }));
  }, []);

  const setShowShareDialog = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showShareDialog: show }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  // Update positions when state changes
  useEffect(() => {
    const positions = positionManager.getFormationPositions(
      state.system,
      state.rotationIndex,
      state.formation
    );
    setState((prev) => ({ ...prev, positions }));
  }, [state.system, state.rotationIndex, state.formation, positionManager]);

  // Callback handlers
  const handlePositionChange = useCallback(
    (positions: Record<string, PlayerPosition>) => {
      setState((prev) => ({ ...prev, positions }));

      if (onPositionChange) {
        const positionData: PositionData = {
          system: state.system,
          rotation: state.rotationIndex,
          formation: state.formation,
          positions,
        };
        onPositionChange(positionData);
      }
    },
    [state.system, state.rotationIndex, state.formation, onPositionChange]
  );

  const handleRotationChange = useCallback(
    (rotation: number) => {
      setRotationIndex(rotation);
      onRotationChange?.(rotation);
    },
    [setRotationIndex, onRotationChange]
  );

  const handleFormationChange = useCallback(
    (formation: FormationType) => {
      setFormation(formation);
      onFormationChange?.(formation);
    },
    [setFormation, onFormationChange]
  );

  const handleViolation = useCallback(
    (violations: ViolationData[]) => {
      const violationMessages = violations.map((v) => v.message);
      setViolations(violationMessages);
      onViolation?.(violations);
    },
    [setViolations, onViolation]
  );

  const handleShare = useCallback(
    (shareData: ShareData) => {
      setShareURL(shareData.url);
      onShare?.(shareData);
    },
    [setShareURL, onShare]
  );

  const handleError = useCallback(
    (error: ErrorData) => {
      setError(error.message);
      onError?.(error);
    },
    [setError, onError]
  );

  // Validate current formation when relevant state changes
  useEffect(() => {
    if (
      config.validation.enableRealTimeValidation &&
      state.formation !== "rotational"
    ) {
      const rotationMap = config.rotations[state.system][state.rotationIndex];
      const validation = positionManager.validateCurrentFormation(
        state.system,
        state.rotationIndex,
        state.formation,
        rotationMap
      );

      if (!validation.isValid) {
        const violations: ViolationData[] = validation.violations.map(
          (message) => ({
            code: "POSITIONING_VIOLATION",
            message,
            affectedPlayers: [],
            severity: "error" as const,
          })
        );
        handleViolation(violations);
      } else {
        setViolations([]);
      }
    }
  }, [
    state.system,
    state.rotationIndex,
    state.formation,
    state.positions,
    config.validation.enableRealTimeValidation,
    config.rotations,
    positionManager,
    handleViolation,
    setViolations,
  ]);

  // Context value
  const contextValue = useMemo<VolleyballCourtContextValue>(
    () => ({
      state,
      positionManager,
      setSystem,
      setRotationIndex,
      setFormation,
      setIsAnimating,
      setDraggedPlayer,
      setViolations,
      setVisualGuidelines,
      setIsReadOnly,
      setShowControls,
      setShareURL,
      setShowShareDialog,
      setError,
      config,
      handlePositionChange,
      handleRotationChange,
      handleFormationChange,
      handleViolation,
      handleShare,
      handleError,
    }),
    [
      state,
      positionManager,
      setSystem,
      setRotationIndex,
      setFormation,
      setIsAnimating,
      setDraggedPlayer,
      setViolations,
      setVisualGuidelines,
      setIsReadOnly,
      setShowControls,
      setShareURL,
      setShowShareDialog,
      setError,
      config,
      handlePositionChange,
      handleRotationChange,
      handleFormationChange,
      handleViolation,
      handleShare,
      handleError,
    ]
  );

  return (
    <VolleyballCourtContext.Provider value={contextValue}>
      {children}
    </VolleyballCourtContext.Provider>
  );
}

// Hook to use the context
export function useVolleyballCourt(): VolleyballCourtContextValue {
  const context = useContext(VolleyballCourtContext);
  if (!context) {
    throw new Error(
      "useVolleyballCourt must be used within a VolleyballCourtProvider"
    );
  }
  return context;
}

// Export context for testing
export { VolleyballCourtContext };
