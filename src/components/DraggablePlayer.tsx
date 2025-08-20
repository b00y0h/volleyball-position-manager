"use client";
import React, { useMemo, useState, useCallback } from "react";
import { motion, PanInfo } from "framer-motion";
import {
  SystemType,
  FormationType,
  PlayerPosition,
  PLAYER_RADIUS,
} from "@/types";
import { PositionManager } from "@/hooks/usePositionManager";
import { VolleyballRulesValidator } from "@/utils/volleyballRules";

interface Player {
  id: string;
  name: string;
  role: string;
}

interface DraggablePlayerProps {
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
}

interface DragState {
  isDragging: boolean;
  startPosition: { x: number; y: number };
  isValidPosition: boolean;
  volleyballViolations: string[];
}

export function DraggablePlayer({
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
}: DraggablePlayerProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPosition: position,
    isValidPosition: true,
    volleyballViolations: [],
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const [showResetButton, setShowResetButton] = useState(false);

  // Create volleyball rules validator
  const volleyballValidator = useMemo(() => {
    return new VolleyballRulesValidator(
      courtDimensions.courtWidth,
      courtDimensions.courtHeight
    );
  }, [courtDimensions.courtWidth, courtDimensions.courtHeight]);

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
      // Higher contrast colors that work well in both light and dark modes
      fill: isCustomized ? "#10b981" : "#3b82f6", // Brighter green for custom, bright blue for default
      stroke: isCustomized ? "#065f46" : "#1e40af", // Darker stroke for better contrast
      strokeWidth: isCustomized ? 2 : 2, // Increased stroke width for better visibility
    };

    // Modify styles during drag
    if (dragState.isDragging) {
      baseStyles.fill = dragState.isValidPosition ? "#22c55e" : "#f87171"; // Lighter versions for better visibility during drag
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

  // Handle drag start
  const handleDragStart = useCallback(() => {
    if (isReadOnly) return;

    setDragState({
      isDragging: true,
      startPosition: position,
      isValidPosition: true,
      volleyballViolations: [],
    });

    onDragStart?.(player.id);
  }, [isReadOnly, position, player.id, onDragStart]);

  // Handle drag movement
  const handleDrag = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isReadOnly || !dragState.isDragging) return;

      // Calculate new position based on drag offset
      const newPosition = {
        x: dragState.startPosition.x + info.offset.x,
        y: dragState.startPosition.y + info.offset.y,
      };

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

      // Get all current positions for volleyball rules validation
      const allPositions = positionManager.getAllPositions(system, rotation, formation) as Record<string, PlayerPosition>;
      
      // Validate volleyball-specific rules
      const volleyballValidation = volleyballValidator.validateVolleyballPosition(
        newPosition,
        player.id,
        formation,
        allPositions,
        rotationMap
      );

      const isValid = withinBounds && validation.isValid && volleyballValidation.isValid;

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
      isReadOnly,
      dragState.isDragging,
      dragState.startPosition,
      isWithinBounds,
      positionManager,
      system,
      rotation,
      formation,
      player.id,
      volleyballValidator,
      onVolleyballRuleViolation,
    ]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isReadOnly || !dragState.isDragging) return;

      const finalPosition = {
        x: dragState.startPosition.x + info.offset.x,
        y: dragState.startPosition.y + info.offset.y,
      };

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
      isReadOnly,
      dragState.isDragging,
      dragState.startPosition,
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
    if (isReadOnly) return "not-allowed";
    if (dragState.isDragging) {
      return dragState.isValidPosition ? "grabbing" : "not-allowed";
    }
    return "grab";
  }, [isReadOnly, dragState.isDragging, dragState.isValidPosition]);

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
      drag={!isReadOnly}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileHover={
        !isReadOnly && !dragState.isDragging
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
      tabIndex={isReadOnly ? -1 : 0}
      aria-label={`Player ${player.id} in ${player.role} position. Zone ${player.id}. ${isCustomized ? 'Custom position' : 'Default position'}. ${isReadOnly ? 'Read-only mode' : 'Drag to reposition'}`}
      aria-describedby={`player-${player.id}-status`}
      aria-live="polite"
    >
      {/* Player circle - now 22px radius for better touch targets */}
      <circle
        cx={0}
        cy={0}
        r={PLAYER_RADIUS}
        {...getPlayerStyles}
        style={{
          filter: isCustomized
            ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
            : "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
          opacity: isReadOnly ? 0.7 : 1,
        }}
      />

      {/* Read-only overlay */}
      {isReadOnly && (
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

      {/* Player ID text - larger for better readability */}
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
        {isCustomized ? 'Custom position' : 'Default position'}
        {isReadOnly ? ', Read-only mode' : ', Interactive'}
        {dragState.isDragging ? (dragState.isValidPosition ? ', Valid position' : ', Invalid position') : ''}
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
                  {dragState.volleyballViolations.slice(0, 3).map((violation, index) => (
                    <text
                      key={index}
                      x={0}
                      y={-35 + index * 12}
                      fontSize={7}
                      textAnchor="middle"
                      fill="white"
                      style={{ maxWidth: "140px" }}
                    >
                      {violation.length > 25 ? `${violation.substring(0, 22)}...` : violation}
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
          {/* Tooltip background */}
          <rect
            x={-45}
            y={-45}
            width={90}
            height={isReadOnly ? 30 : 20}
            rx={4}
            fill="rgba(0, 0, 0, 0.8)"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={1}
          />
          {/* Tooltip text */}
          <text
            x={0}
            y={isReadOnly ? -38 : -32}
            fontSize={9}
            textAnchor="middle"
            fill="white"
            style={{
              fontWeight: "500",
            }}
          >
            {isCustomized ? "Custom Position" : "Default Position"}
          </text>
          {isReadOnly && (
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
              (Read-only)
            </text>
          )}
        </g>
      )}

      {/* Individual reset button */}
      {showResetButton &&
        !dragState.isDragging &&
        isCustomized &&
        !isReadOnly &&
        onResetPosition && (
          <g>
            {/* Reset button background */}
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
            {/* Reset icon (×) */}
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
