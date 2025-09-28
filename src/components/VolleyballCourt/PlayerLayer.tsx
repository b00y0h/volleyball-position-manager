"use client";
import React, { useMemo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EnhancedDraggablePlayer } from "./EnhancedDraggablePlayer";
import { DragGuidelines } from "./DragGuidelines";
import { PlayerLayerProps } from "./types";
import {
  VolleyballCourtRulesIntegration,
  type PositionValidationContext,
} from "./VolleyballCourtRulesIntegration";
import { RotationSlot } from "./volleyball-rules-engine/types/PlayerState";
import { useEnhancedPositionManager } from "./hooks/useEnhancedPositionManager";

/**
 * PlayerLayer component manages all player rendering and interactions
 * Integrates with volleyball rules engine for real-time validation and constraint calculation
 */
export function PlayerLayer({
  players,
  positions,
  rotationMap,
  formation,
  draggedPlayer,
  visualGuidelines,
  readOnly,
  courtDimensions,
  system = "5-1",
  rotation = 0,
  onDragStart,
  onDragEnd,
  onPositionChange,
  onResetPosition,
  onVolleyballRuleViolation,
}: PlayerLayerProps) {
  const [dragConstraints, setDragConstraints] = useState<{
    [playerId: string]: {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
    };
  }>({});

  const [violationState, setViolationState] = useState<{
    [playerId: string]: string[];
  }>({});

  // Create position manager instance for validation
  const positionManager = useEnhancedPositionManager();

  // Create rules integration instance
  const rulesIntegration = useMemo(() => {
    return new VolleyballCourtRulesIntegration({
      courtDimensions,
      enableRealTimeValidation: true,
      enableConstraintBoundaries: true,
      enablePositionSnapping: true,
      serverSlot: 1, // Default server slot
    });
  }, [courtDimensions]);

  // Calculate visual guidelines for drag operations
  const calculateDragGuidelines = useCallback(
    (draggedPlayerId: string) => {
      if (!draggedPlayerId || formation === "rotational") {
        return { horizontalLines: [], verticalLines: [] };
      }

      try {
        // Get the dragged player's slot
        const draggedSlot = Object.entries(rotationMap).find(
          ([, id]) => id === draggedPlayerId
        )?.[0];

        if (!draggedSlot) {
          return { horizontalLines: [], verticalLines: [] };
        }

        const slot = parseInt(draggedSlot) as RotationSlot;
        const isServer = slot === 1; // Default server slot

        // Create validation context
        const context: PositionValidationContext = {
          playerId: draggedPlayerId,
          slot,
          currentPosition: positions[draggedPlayerId],
          allPositions: positions,
          rotationMap,
          system,
          formation,
          isServer,
        };

        // Calculate constraint boundaries using rules integration
        const boundaries =
          rulesIntegration.calculateConstraintBoundaries(context);

        const horizontalLines: Array<{
          y: number;
          label: string;
          playerId: string;
        }> = [];
        const verticalLines: Array<{
          x: number;
          label: string;
          playerId: string;
        }> = [];

        // Convert constraint boundaries to drag guidelines
        boundaries.horizontalLines.forEach((line) => {
          horizontalLines.push({
            y: line.position,
            label: line.reason,
            playerId: draggedPlayerId,
          });
        });

        boundaries.verticalLines.forEach((line) => {
          verticalLines.push({
            x: line.position,
            label: line.reason,
            playerId: draggedPlayerId,
          });
        });

        return { horizontalLines, verticalLines };
      } catch (error) {
        console.warn("Error calculating drag guidelines:", error);
        return { horizontalLines: [], verticalLines: [] };
      }
    },
    [
      positions,
      rotationMap,
      formation,
      courtDimensions,
      system,
      rulesIntegration,
    ]
  );

  // Memoized drag guidelines
  const dragGuidelines = useMemo(() => {
    return draggedPlayer
      ? calculateDragGuidelines(draggedPlayer)
      : { horizontalLines: [], verticalLines: [] };
  }, [draggedPlayer, calculateDragGuidelines]);

  // Handle drag start with constraint calculation
  const handleDragStart = useCallback(
    (playerId: string) => {
      if (readOnly || formation === "rotational") return;

      try {
        // Get player's slot
        const slotEntry = Object.entries(rotationMap).find(
          ([, id]) => id === playerId
        );
        if (!slotEntry) return;

        const slot = parseInt(slotEntry[0]) as RotationSlot;
        const isServer = slot === 1; // Default server slot

        // Get drag constraints using rules integration
        const constraints = rulesIntegration.getDragConstraints(
          playerId,
          slot,
          positions,
          rotationMap,
          isServer
        );

        // Store constraints for this player
        if (constraints) {
          setDragConstraints((prev) => ({
            ...prev,
            [playerId]: constraints,
          }));
        }

        onDragStart(playerId);
      } catch (error) {
        console.warn("Error handling drag start:", error);
        onDragStart(playerId);
      }
    },
    [readOnly, formation, rotationMap, positions, rulesIntegration, onDragStart]
  );

  // Handle drag end with validation
  const handleDragEnd = useCallback(
    (playerId: string, success: boolean) => {
      // Clear constraints for this player
      setDragConstraints((prev) => {
        const updated = { ...prev };
        delete updated[playerId];
        return updated;
      });

      // Clear violations for this player
      setViolationState((prev) => {
        const updated = { ...prev };
        delete updated[playerId];
        return updated;
      });

      onDragEnd(playerId, success);
    },
    [onDragEnd]
  );

  // Handle position changes with validation
  const handlePositionChange = useCallback(
    (playerId: string, newPosition: { x: number; y: number }) => {
      try {
        // Validate the new position using volleyball rules
        const slotEntry = Object.entries(rotationMap).find(
          ([, id]) => id === playerId
        );
        if (!slotEntry) return;

        const slot = parseInt(slotEntry[0]) as RotationSlot;
        const isServer = slot === 1; // Default server slot

        // Create updated positions
        const updatedPositions = {
          ...positions,
          [playerId]: {
            x: newPosition.x,
            y: newPosition.y,
            isCustom: true,
            lastModified: new Date(),
          },
        };

        // Create validation context
        const context: PositionValidationContext = {
          playerId,
          slot,
          currentPosition: {
            x: newPosition.x,
            y: newPosition.y,
            isCustom: true,
            lastModified: new Date(),
          },
          allPositions: updatedPositions,
          rotationMap,
          system,
          formation,
          isServer,
        };

        // Validate using rules integration
        const validationResult =
          rulesIntegration.validatePlayerPosition(context);

        // Update violation state
        if (!validationResult.isValid) {
          const playerViolations = validationResult.violations.map(
            (v) => v.message
          );
          setViolationState((prev) => ({
            ...prev,
            [playerId]: playerViolations,
          }));
        } else {
          setViolationState((prev) => {
            const updated = { ...prev };
            delete updated[playerId];
            return updated;
          });
        }

        onPositionChange(playerId, {
          x: newPosition.x,
          y: newPosition.y,
          isCustom: true,
          lastModified: new Date(),
        });
      } catch (error) {
        console.warn("Error handling position change:", error);
        onPositionChange(playerId, {
          x: newPosition.x,
          y: newPosition.y,
          isCustom: true,
          lastModified: new Date(),
        });
      }
    },
    [
      positions,
      rotationMap,
      system,
      formation,
      rulesIntegration,
      onPositionChange,
    ]
  );

  // Handle volleyball rule violations
  const handleVolleyballRuleViolation = useCallback(
    (playerId: string, violations: string[]) => {
      setViolationState((prev) => ({
        ...prev,
        [playerId]: violations,
      }));
    },
    []
  );

  // Handle individual player reset
  const handleResetPosition = useCallback(
    (playerId: string) => {
      if (onResetPosition) {
        onResetPosition(playerId);
      }

      // Clear violations for this player
      setViolationState((prev) => {
        const updated = { ...prev };
        delete updated[playerId];
        return updated;
      });
    },
    [onResetPosition]
  );

  // Handle volleyball rule violations from child components
  const handleVolleyballRuleViolationFromChild = useCallback(
    (playerId: string, violations: string[]) => {
      setViolationState((prev) => ({
        ...prev,
        [playerId]: violations,
      }));

      // Also notify parent component
      onVolleyballRuleViolation?.(playerId, violations);
    },
    [onVolleyballRuleViolation]
  );

  return (
    <motion.g animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Drag Guidelines Layer */}
      <AnimatePresence>
        {draggedPlayer && (
          <DragGuidelines
            horizontalLines={dragGuidelines.horizontalLines}
            verticalLines={dragGuidelines.verticalLines}
            courtDimensions={{
              courtWidth: courtDimensions.width,
              courtHeight: courtDimensions.height,
            }}
            isDragging={!!draggedPlayer}
            draggedPlayerId={draggedPlayer}
          />
        )}
      </AnimatePresence>

      {/* Players Layer */}
      <g className="players-layer">
        {players.map((player) => {
          const position = positions[player.id];
          if (!position) return null;

          return (
            <EnhancedDraggablePlayer
              key={player.id}
              player={player}
              position={position}
              positionManager={positionManager}
              system={system}
              rotation={rotation}
              formation={formation}
              courtDimensions={{
                courtWidth: courtDimensions.width,
                courtHeight: courtDimensions.height,
              }}
              rotationMap={rotationMap}
              isReadOnly={readOnly}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onResetPosition={handleResetPosition}
              onVolleyballRuleViolation={handleVolleyballRuleViolationFromChild}
              enableVolleyballRules={true}
            />
          );
        })}
      </g>

      {/* Violation Indicators Layer */}
      <g className="violation-indicators">
        {Object.entries(violationState).map(([playerId, violations]) => {
          const position = positions[playerId];
          if (!position || violations.length === 0) return null;

          return (
            <motion.g
              key={`violation-${playerId}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              {/* Violation warning indicator */}
              <circle
                cx={position.x}
                cy={position.y - 35}
                r={8}
                fill="#ef4444"
                stroke="#dc2626"
                strokeWidth={2}
                style={{ pointerEvents: "none" }}
              />
              <text
                x={position.x}
                y={position.y - 31}
                fontSize={10}
                fontWeight="bold"
                textAnchor="middle"
                fill="white"
                style={{ pointerEvents: "none" }}
              >
                !
              </text>

              {/* Violation tooltip */}
              <g style={{ pointerEvents: "none" }}>
                <rect
                  x={position.x - 100}
                  y={position.y - 80}
                  width={200}
                  height={20 + violations.length * 12}
                  rx={4}
                  fill="rgba(239, 68, 68, 0.95)"
                  stroke="rgba(220, 38, 38, 1)"
                  strokeWidth={1}
                />
                <text
                  x={position.x}
                  y={position.y - 65}
                  fontSize={9}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="white"
                >
                  Rule Violations:
                </text>
                {violations.slice(0, 3).map((violation, index) => (
                  <text
                    key={index}
                    x={position.x}
                    y={position.y - 55 + index * 12}
                    fontSize={8}
                    textAnchor="middle"
                    fill="white"
                    style={{ maxWidth: "190px" }}
                  >
                    {violation.length > 30
                      ? `${violation.substring(0, 27)}...`
                      : violation}
                  </text>
                ))}
              </g>
            </motion.g>
          );
        })}
      </g>

      {/* Constraint Boundaries Visualization */}
      {draggedPlayer && dragConstraints[draggedPlayer] && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <rect
            x={dragConstraints[draggedPlayer].minX}
            y={dragConstraints[draggedPlayer].minY}
            width={
              dragConstraints[draggedPlayer].maxX -
              dragConstraints[draggedPlayer].minX
            }
            height={
              dragConstraints[draggedPlayer].maxY -
              dragConstraints[draggedPlayer].minY
            }
            fill="rgba(16, 185, 129, 0.1)"
            stroke="rgba(16, 185, 129, 0.5)"
            strokeWidth={2}
            strokeDasharray="4 4"
            style={{ pointerEvents: "none" }}
          />
        </motion.g>
      )}
    </motion.g>
  );
}
