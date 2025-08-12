"use client";
import React, { useMemo, useState, useCallback } from "react";
import { motion, PanInfo } from "framer-motion";
import {
  SystemType,
  FormationType,
  COURT_DIMENSIONS,
  PLAYER_RADIUS,
} from "@/types";
import { PositionManager } from "@/hooks/usePositionManager";

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
  isReadOnly?: boolean;
  onDragStart?: (playerId: string) => void;
  onDragEnd?: (playerId: string, success: boolean) => void;
}

interface DragState {
  isDragging: boolean;
  startPosition: { x: number; y: number };
  isValidPosition: boolean;
}

export function DraggablePlayer({
  player,
  position,
  positionManager,
  system,
  rotation,
  formation,
  isReadOnly = false,
  onDragStart,
  onDragEnd,
}: DraggablePlayerProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPosition: position,
    isValidPosition: true,
  });

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
      fill: isCustomized ? "#059669" : "#1d4ed8", // Green for custom, blue for default
      stroke: isCustomized ? "#047857" : "#1e40af",
      strokeWidth: isCustomized ? 2 : 1,
    };

    // Modify styles during drag
    if (dragState.isDragging) {
      baseStyles.fill = dragState.isValidPosition ? "#10b981" : "#ef4444";
      baseStyles.stroke = dragState.isValidPosition ? "#047857" : "#dc2626";
      baseStyles.strokeWidth = 3;
    }

    return baseStyles;
  }, [isCustomized, dragState.isDragging, dragState.isValidPosition]);

  // Validate if a position is within court boundaries
  const isWithinBounds = useCallback(
    (pos: { x: number; y: number }): boolean => {
      return (
        pos.x >= PLAYER_RADIUS &&
        pos.x <= COURT_DIMENSIONS.width - PLAYER_RADIUS &&
        pos.y >= PLAYER_RADIUS &&
        pos.y <= COURT_DIMENSIONS.height - PLAYER_RADIUS
      );
    },
    []
  );

  // Handle drag start
  const handleDragStart = useCallback(() => {
    if (isReadOnly) return;

    setDragState({
      isDragging: true,
      startPosition: position,
      isValidPosition: true,
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
        newPosition
      );

      const isValid = withinBounds && validation.isValid;

      setDragState((prev) => ({
        ...prev,
        isValidPosition: isValid,
      }));
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
    if (isReadOnly) return "default";
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
    >
      {/* Player circle */}
      <circle
        cx={0}
        cy={0}
        r={18}
        {...getPlayerStyles}
        style={{
          filter: isCustomized
            ? "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
            : "none",
        }}
      />

      {/* Player ID text */}
      <text
        x={0}
        y={5}
        fontSize={10}
        textAnchor="middle"
        fill="white"
        style={{
          pointerEvents: "none",
          userSelect: "none",
          fontWeight: isCustomized ? "bold" : "normal",
        }}
      >
        {player.id}
      </text>

      {/* Customization indicator */}
      {isCustomized && (
        <circle
          cx={12}
          cy={-12}
          r={4}
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth={1}
          style={{
            pointerEvents: "none",
          }}
        />
      )}

      {/* Drag feedback indicators */}
      {dragState.isDragging && (
        <>
          {/* Drag outline */}
          <circle
            cx={0}
            cy={0}
            r={22}
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
          )}
        </>
      )}
    </motion.g>
  );
}
