"use client";
import React, { useMemo, useState, useCallback } from "react";
import { motion, PanInfo } from "framer-motion";
import {
  SystemType,
  FormationType,
  PlayerPosition,
  PLAYER_RADIUS,
} from "./types/positioning";
import { PositionManager } from "./hooks/usePositionManager";
import { ConstraintCalculator } from "./volleyball-rules-engine/validation/ConstraintCalculator";
import { OverlapValidator } from "./volleyball-rules-engine/validation/OverlapValidator";
import { StateConverter } from "./volleyball-rules-engine/utils/StateConverter";
import { RotationSlot } from "./volleyball-rules-engine/types/PlayerState";
import { CoordinateTransformer } from "./volleyball-rules-engine/utils/CoordinateTransformer";

interface Player {
  id: string;
  name: string;
  role: string;
}

interface EnhancedDraggablePlayerProps {
  player: Player;
  position: { x: number; y: number };
  positionManager: PositionManager;
  system: SystemType;
  rotation: number;
  formation: FormationType;
  courtDimensions: { courtWidth: number; courtHeight: number };
  rotationMap?: Record<number, string>;
  isReadOnly?: boolean;
  onDragStart?: (playerId: string) => void;
  onDragEnd?: (playerId: string, success: boolean) => void;
  onResetPosition?: (playerId: string) => void;
  onVolleyballRuleViolation?: (playerId: string, violations: string[]) => void;
  enableVolleyballRules?: boolean;
}

interface DragState {
  isDragging: boolean;
  startPosition: { x: number; y: number };
  isValidPosition: boolean;
  volleyballViolations: string[];
  constraintBounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export function EnhancedDraggablePlayer({
  player,
  position,
  positionManager,
  system,
  rotation,
  formation,
  courtDimensions,
  rotationMap,
  isReadOnly = false,
  onDragStart,
  onDragEnd,
  onResetPosition,
  onVolleyballRuleViolation,
  enableVolleyballRules = true,
}: EnhancedDraggablePlayerProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPosition: position,
    isValidPosition: true,
    volleyballViolations: [],
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const [showResetButton, setShowResetButton] = useState(false);

  // Get player's rotation slot
  const playerSlot = useMemo(() => {
    if (!rotationMap) return 1;
    const slotEntry = Object.entries(rotationMap).find(
      ([, id]) => id === player.id
    );
    return slotEntry ? (parseInt(slotEntry[0]) as RotationSlot) : 1;
  }, [rotationMap, player.id]);

  // Check if this position is customized
  const isCustomized = useMemo(() => {
    return positionManager.isPositionCustomized(
      system,
      rotation,
      formation,
      player.id
    );
  }, [positionManager, system, rotation, formation, player.id]);

  // Get visual styling based on customization status and drag state
  const getPlayerStyles = useMemo(() => {
    const baseStyles = {
      fill: isCustomized ? "#10b981" : "#3b82f6",
      stroke: isCustomized ? "#065f46" : "#1e40af",
      strokeWidth: isCustomized ? 2 : 2,
    };

    // Modify styles during drag
    if (dragState.isDragging) {
      baseStyles.fill = dragState.isValidPosition ? "#22c55e" : "#f87171";
      baseStyles.stroke = dragState.isValidPosition ? "#15803d" : "#b91c1c";
      baseStyles.strokeWidth = 3;
    }

    return baseStyles;
  }, [isCustomized, dragState.isDragging, dragState.isValidPosition]);

  // Validate if a position is within court boundaries
  const isWithinBounds = useCallback(
    (pos: { x: number; y: number }): boolean => {
      return (
        pos.x >= PLAYER_RADIUS &&
        pos.x <= courtDimensions.courtWidth - PLAYER_RADIUS &&
        pos.y >= PLAYER_RADIUS &&
        pos.y <= courtDimensions.courtHeight - PLAYER_RADIUS
      );
    },
    [courtDimensions.courtWidth, courtDimensions.courtHeight]
  );

  // Check if dragging is disabled for this formation
  const isDragDisabled = useMemo(() => {
    return isReadOnly || formation === "rotational";
  }, [isReadOnly, formation]);

  // Calculate constraint bounds using volleyball rules engine
  const calculateConstraintBounds = useCallback(
    (currentPos: { x: number; y: number }) => {
      if (
        !enableVolleyballRules ||
        !rotationMap ||
        formation === "rotational"
      ) {
        return undefined;
      }

      try {
        // Get all current positions
        const allPositions = positionManager.getFormationPositions(
          system,
          rotation,
          formation
        );

        // Convert to volleyball states
        const serverSlot = 1; // Default server slot, could be dynamic
        const volleyballStates = StateConverter.formationToVolleyballStates(
          allPositions,
          rotationMap,
          serverSlot
        );

        // Create position map by slot
        const positionMap = new Map();
        volleyballStates.forEach((state) => {
          positionMap.set(state.slot, state);
        });

        // Calculate constraints for this player
        const isServer = playerSlot === serverSlot;
        const bounds = ConstraintCalculator.calculateValidBounds(
          playerSlot,
          positionMap,
          isServer
        );

        if (bounds.isConstrained) {
          // Convert volleyball bounds back to screen coordinates
          const screenMinBounds = CoordinateTransformer.volleyballToScreen(
            bounds.minX,
            bounds.minY
          );
          const screenMaxBounds = CoordinateTransformer.volleyballToScreen(
            bounds.maxX,
            bounds.maxY
          );

          return {
            minX: screenMinBounds.x,
            maxX: screenMaxBounds.x,
            minY: screenMinBounds.y,
            maxY: screenMaxBounds.y,
          };
        }
      } catch (error) {
        console.warn("Error calculating constraint bounds:", error);
      }

      return undefined;
    },
    [
      enableVolleyballRules,
      rotationMap,
      formation,
      positionManager,
      system,
      rotation,
      playerSlot,
    ]
  );

  // Validate position using volleyball rules
  const validateVolleyballRules = useCallback(
    (newPosition: { x: number; y: number }) => {
      if (
        !enableVolleyballRules ||
        !rotationMap ||
        formation === "rotational"
      ) {
        return { isValid: true, violations: [] };
      }

      try {
        // Get all current positions
        const allPositions = positionManager.getFormationPositions(
          system,
          rotation,
          formation
        );

        // Update the position for this player
        const updatedPositions = {
          ...allPositions,
          [player.id]: {
            x: newPosition.x,
            y: newPosition.y,
            isCustom: true,
            lastModified: new Date(),
          },
        };

        // Convert to volleyball states
        const serverSlot = 1; // Default server slot
        const volleyballStates = StateConverter.formationToVolleyballStates(
          updatedPositions,
          rotationMap,
          serverSlot
        );

        // Validate using overlap validator
        const result = OverlapValidator.checkOverlap(volleyballStates);

        return {
          isValid: result.isLegal,
          violations: result.violations.map((v) => v.message),
        };
      } catch (error) {
        console.warn("Error validating volleyball rules:", error);
        return { isValid: true, violations: [] };
      }
    },
    [
      enableVolleyballRules,
      rotationMap,
      formation,
      positionManager,
      system,
      rotation,
      player.id,
    ]
  );

  // Handle drag start
  const handleDragStart = useCallback(() => {
    if (isDragDisabled) return;

    const constraintBounds = calculateConstraintBounds(position);

    setDragState({
      isDragging: true,
      startPosition: position,
      isValidPosition: true,
      volleyballViolations: [],
      constraintBounds,
    });

    onDragStart?.(player.id);
  }, [
    isDragDisabled,
    position,
    player.id,
    onDragStart,
    calculateConstraintBounds,
  ]);

  // Handle drag movement
  const handleDrag = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isDragDisabled || !dragState.isDragging) return;

      // Calculate new position based on drag offset
      let newPosition = {
        x: dragState.startPosition.x + info.offset.x,
        y: dragState.startPosition.y + info.offset.y,
      };

      // Apply constraint bounds if available
      if (dragState.constraintBounds) {
        newPosition.x = Math.max(
          dragState.constraintBounds.minX,
          Math.min(dragState.constraintBounds.maxX, newPosition.x)
        );
        newPosition.y = Math.max(
          dragState.constraintBounds.minY,
          Math.min(dragState.constraintBounds.maxY, newPosition.y)
        );
      }

      // Check if position is within bounds
      const withinBounds = isWithinBounds(newPosition);

      // Validate position using position manager
      const validation = positionManager.validatePosition(
        system,
        rotation,
        formation,
        player.id,
        newPosition,
        courtDimensions.courtWidth,
        courtDimensions.courtHeight
      );

      // Validate volleyball-specific rules
      const volleyballValidation = validateVolleyballRules(newPosition);

      const isValid =
        withinBounds && validation.isValid && volleyballValidation.isValid;

      setDragState((prev) => ({
        ...prev,
        isValidPosition: isValid,
        volleyballViolations: volleyballValidation.violations,
      }));

      // Notify parent component of volleyball rule violations
      if (volleyballValidation.violations.length > 0) {
        onVolleyballRuleViolation?.(player.id, volleyballValidation.violations);
      }
    },
    [
      isDragDisabled,
      dragState.isDragging,
      dragState.startPosition,
      dragState.constraintBounds,
      isWithinBounds,
      positionManager,
      system,
      rotation,
      formation,
      player.id,
      courtDimensions,
      validateVolleyballRules,
      onVolleyballRuleViolation,
    ]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isDragDisabled || !dragState.isDragging) return;

      let finalPosition = {
        x: dragState.startPosition.x + info.offset.x,
        y: dragState.startPosition.y + info.offset.y,
      };

      // Apply constraint bounds if available
      if (dragState.constraintBounds) {
        finalPosition.x = Math.max(
          dragState.constraintBounds.minX,
          Math.min(dragState.constraintBounds.maxX, finalPosition.x)
        );
        finalPosition.y = Math.max(
          dragState.constraintBounds.minY,
          Math.min(dragState.constraintBounds.maxY, finalPosition.y)
        );
      }

      let success = false;

      // Only update position if it's valid
      if (dragState.isValidPosition && isWithinBounds(finalPosition)) {
        success = positionManager.setPosition(
          system,
          rotation,
          formation,
          player.id,
          finalPosition
        );
      }

      // Reset drag state
      setDragState({
        isDragging: false,
        startPosition: position,
        isValidPosition: true,
        volleyballViolations: [],
      });

      onDragEnd?.(player.id, success);
    },
    [
      isDragDisabled,
      dragState.isDragging,
      dragState.startPosition,
      dragState.constraintBounds,
      dragState.isValidPosition,
      isWithinBounds,
      positionManager,
      system,
      rotation,
      formation,
      player.id,
      position,
      onDragEnd,
    ]
  );

  // Get cursor style based on drag state
  const getCursorStyle = useCallback(() => {
    if (isDragDisabled) return "not-allowed";
    if (dragState.isDragging) {
      return dragState.isValidPosition ? "grabbing" : "not-allowed";
    }
    return "grab";
  }, [isDragDisabled, dragState.isDragging, dragState.isValidPosition]);

  return (
    <motion.g
      initial={false}
      animate={{
        x: position.x,
        y: position.y,
        scale: dragState.isDragging
          ? dragState.isValidPosition
            ? 1.1
            : 0.9
          : 1,
        opacity: dragState.isDragging ? 0.8 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 28,
        duration: 0.3,
      }}
      drag={!isDragDisabled}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileHover={
        !isDragDisabled && !dragState.isDragging
          ? {
              scale: 1.05,
              transition: { duration: 0.2 },
            }
          : {}
      }
      style={{
        cursor: getCursorStyle(),
      }}
      onMouseEnter={() => {
        setShowTooltip(true);
        setShowResetButton(true);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
        setShowResetButton(false);
      }}
      role="button"
      tabIndex={isDragDisabled ? -1 : 0}
      aria-label={`Player ${player.id} in ${
        player.role
      } position. Zone ${playerSlot}. ${
        isCustomized ? "Custom position" : "Default position"
      }. ${
        isDragDisabled
          ? formation === "rotational"
            ? "Rotational positions cannot be moved"
            : "Read-only mode"
          : "Drag to reposition"
      }`}
      aria-describedby={`player-${player.id}-status`}
      aria-live="polite"
    >
      {/* Player circle */}
      <circle
        cx={0}
        cy={0}
        r={PLAYER_RADIUS}
        {...getPlayerStyles}
        style={{
          filter: isCustomized
            ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
            : "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
          opacity: isDragDisabled ? 0.7 : 1,
        }}
      />

      {/* Constraint bounds visualization during drag */}
      {dragState.isDragging &&
        dragState.constraintBounds &&
        enableVolleyballRules && (
          <rect
            x={dragState.constraintBounds.minX - position.x}
            y={dragState.constraintBounds.minY - position.y}
            width={
              dragState.constraintBounds.maxX - dragState.constraintBounds.minX
            }
            height={
              dragState.constraintBounds.maxY - dragState.constraintBounds.minY
            }
            fill="none"
            stroke="#10b981"
            strokeWidth={1}
            strokeDasharray="2 2"
            opacity={0.5}
            style={{ pointerEvents: "none" }}
          />
        )}

      {/* Disabled overlay */}
      {isDragDisabled && (
        <circle
          cx={0}
          cy={0}
          r={PLAYER_RADIUS}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth={2}
          strokeDasharray="3 3"
          style={{
            pointerEvents: "none",
          }}
        />
      )}

      {/* Player ID text */}
      <text
        x={0}
        y={6}
        fontSize={12}
        textAnchor="middle"
        fill="white"
        style={{
          pointerEvents: "none",
          userSelect: "none",
          fontWeight: "bold",
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
        }}
      >
        {player.id}
      </text>

      {/* Volleyball rules indicator */}
      {enableVolleyballRules && (
        <circle
          cx={-15}
          cy={-15}
          r={4}
          fill="#3b82f6"
          stroke="#1e40af"
          strokeWidth={1}
          style={{
            pointerEvents: "none",
          }}
        />
      )}

      {/* Customization indicator */}
      {isCustomized && (
        <circle
          cx={15}
          cy={-15}
          r={5}
          fill="#fcd34d"
          stroke="#d97706"
          strokeWidth={1.5}
          style={{
            pointerEvents: "none",
          }}
        />
      )}

      {/* Hidden status text for screen readers */}
      <text
        id={`player-${player.id}-status`}
        x={0}
        y={0}
        style={{
          opacity: 0,
          pointerEvents: "none",
          fontSize: 0,
        }}
      >
        {isCustomized ? "Custom position" : "Default position"}
        {isDragDisabled
          ? formation === "rotational"
            ? ", Rotational positions cannot be moved"
            : ", Read-only mode"
          : ", Interactive"}
        {dragState.isDragging
          ? dragState.isValidPosition
            ? ", Valid position"
            : ", Invalid position"
          : ""}
        {enableVolleyballRules ? ", Volleyball rules enabled" : ""}
      </text>

      {/* Drag feedback indicators */}
      {dragState.isDragging && (
        <>
          {/* Drag outline */}
          <circle
            cx={0}
            cy={0}
            r={PLAYER_RADIUS + 4}
            fill="none"
            stroke={dragState.isValidPosition ? "#10b981" : "#ef4444"}
            strokeWidth={2}
            strokeDasharray="4 4"
            style={{
              pointerEvents: "none",
            }}
          />

          {/* Invalid position indicator */}
          {!dragState.isValidPosition && (
            <>
              <text
                x={0}
                y={-30}
                fontSize={8}
                textAnchor="middle"
                fill="#ef4444"
                style={{
                  pointerEvents: "none",
                  userSelect: "none",
                  fontWeight: "bold",
                }}
              >
                Invalid
              </text>

              {/* Volleyball violations tooltip */}
              {dragState.volleyballViolations.length > 0 && (
                <g style={{ pointerEvents: "none" }}>
                  <rect
                    x={-75}
                    y={-60}
                    width={150}
                    height={20 + dragState.volleyballViolations.length * 12}
                    rx={4}
                    fill="rgba(239, 68, 68, 0.95)"
                    stroke="rgba(220, 38, 38, 1)"
                    strokeWidth={1}
                  />
                  <text
                    x={0}
                    y={-45}
                    fontSize={8}
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="white"
                  >
                    Volleyball Rule Violations:
                  </text>
                  {dragState.volleyballViolations
                    .slice(0, 3)
                    .map((violation, index) => (
                      <text
                        key={index}
                        x={0}
                        y={-35 + index * 12}
                        fontSize={7}
                        textAnchor="middle"
                        fill="white"
                        style={{ maxWidth: "140px" }}
                      >
                        {violation.length > 25
                          ? `${violation.substring(0, 22)}...`
                          : violation}
                      </text>
                    ))}
                </g>
              )}
            </>
          )}
        </>
      )}

      {/* Hover tooltip */}
      {showTooltip && !dragState.isDragging && (
        <g style={{ pointerEvents: "none" }}>
          <rect
            x={-45}
            y={-45}
            width={90}
            height={isDragDisabled ? 30 : 20}
            rx={4}
            fill="rgba(0, 0, 0, 0.8)"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={1}
          />
          <text
            x={0}
            y={isDragDisabled ? -38 : -32}
            fontSize={9}
            textAnchor="middle"
            fill="white"
            style={{
              fontWeight: "500",
            }}
          >
            {isCustomized ? "Custom Position" : "Default Position"}
          </text>
          {isDragDisabled && (
            <text
              x={0}
              y={-26}
              fontSize={8}
              textAnchor="middle"
              fill="#fbbf24"
              style={{
                fontWeight: "500",
              }}
            >
              {formation === "rotational" ? "(Read-only)" : "(Read-only)"}
            </text>
          )}
        </g>
      )}

      {/* Individual reset button */}
      {showResetButton &&
        !dragState.isDragging &&
        isCustomized &&
        !isDragDisabled &&
        onResetPosition && (
          <g>
            <circle
              cx={24}
              cy={-24}
              r={10}
              fill="rgba(239, 68, 68, 0.9)"
              stroke="rgba(220, 38, 38, 1)"
              strokeWidth={1}
              style={{
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onResetPosition(player.id);
              }}
              role="button"
              tabIndex={0}
              aria-label={`Reset player ${player.id} to default position`}
            />
            <text
              x={24}
              y={-19}
              fontSize={12}
              textAnchor="middle"
              fill="white"
              style={{
                fontWeight: "bold",
                cursor: "pointer",
                pointerEvents: "none",
              }}
            >
              ×
            </text>
          </g>
        )}
    </motion.g>
  );
}
