/**
 * React Integration Examples for Volleyball Rules Engine
 *
 * This file demonstrates how to integrate the volleyball rules engine
 * with React components for real-time validation and drag-and-drop functionality.
 */

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  VolleyballRulesEngine,
  type PlayerState,
  type PositionBounds,
  type OverlapResult,
} from "../index";

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Custom hook for managing volleyball player positions with validation
 */
export function useVolleyballPositions(initialPlayers: PlayerState[]) {
  const [players, setPlayers] = useState<PlayerState[]>(initialPlayers);
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
  const [constraints, setConstraints] = useState<Map<string, PositionBounds>>(
    new Map()
  );

  // Memoized validation result
  const validationResult = useMemo(() => {
    return VolleyballRulesEngine.validateLineup(players);
  }, [players]);

  // Update player position
  const updatePlayerPosition = useCallback(
    (playerId: string, x: number, y: number) => {
      setPlayers((prev) =>
        prev.map((player) =>
          player.id === playerId ? { ...player, x, y } : player
        )
      );
    },
    []
  );

  // Start dragging a player
  const startDrag = useCallback(
    (playerId: string) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      setDraggedPlayer(playerId);

      // Calculate constraints for the dragged player
      const playerConstraints = VolleyballRulesEngine.getPlayerConstraints(
        player.slot,
        players
      );
      setConstraints((prev) => new Map(prev).set(playerId, playerConstraints));
    },
    [players]
  );

  // End dragging
  const endDrag = useCallback(
    (playerId: string, finalX: number, finalY: number) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      // Snap to valid position
      const validPosition = VolleyballRulesEngine.snapToValidPosition(
        player.slot,
        { x: finalX, y: finalY },
        players
      );

      updatePlayerPosition(playerId, validPosition.x, validPosition.y);
      setDraggedPlayer(null);
      setConstraints((prev) => {
        const newConstraints = new Map(prev);
        newConstraints.delete(playerId);
        return newConstraints;
      });
    },
    [players, updatePlayerPosition]
  );

  // Check if position is valid
  const isPositionValid = useCallback(
    (playerId: string, x: number, y: number) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return false;

      return VolleyballRulesEngine.isValidPosition(
        player.slot,
        { x, y },
        players
      );
    },
    [players]
  );

  return {
    players,
    validationResult,
    draggedPlayer,
    constraints,
    updatePlayerPosition,
    startDrag,
    endDrag,
    isPositionValid,
  };
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Props for DraggablePlayer component
 */
interface DraggablePlayerProps {
  player: PlayerState;
  constraints?: PositionBounds;
  isDragging: boolean;
  onDragStart: () => void;
  onDrag: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  courtWidth: number;
  courtHeight: number;
}

/**
 * Draggable player component with constraint enforcement
 */
export function DraggablePlayer({
  player,
  constraints,
  isDragging,
  onDragStart,
  onDrag,
  onDragEnd,
  courtWidth,
  courtHeight,
}: DraggablePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Convert volleyball coordinates to screen coordinates
  const screenX = (player.x / 9) * courtWidth;
  const screenY = (player.y / 9) * courtHeight;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      const rect = playerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      setDragOffset({ x: offsetX, y: offsetY });

      onDragStart();
    },
    [onDragStart]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !playerRef.current) return;

      const courtRect =
        playerRef.current.parentElement?.getBoundingClientRect();
      if (!courtRect) return;

      // Calculate new position in screen coordinates
      let newScreenX = e.clientX - courtRect.left - dragOffset.x;
      let newScreenY = e.clientY - courtRect.top - dragOffset.y;

      // Convert to volleyball coordinates
      let newVbX = (newScreenX / courtWidth) * 9;
      let newVbY = (newScreenY / courtHeight) * 9;

      // Apply constraints if available
      if (constraints) {
        newVbX = Math.max(constraints.minX, Math.min(constraints.maxX, newVbX));
        newVbY = Math.max(constraints.minY, Math.min(constraints.maxY, newVbY));
      }

      onDrag(newVbX, newVbY);
    },
    [isDragging, dragOffset, courtWidth, courtHeight, constraints, onDrag]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const courtRect =
        playerRef.current?.parentElement?.getBoundingClientRect();
      if (!courtRect) return;

      // Calculate final position
      let finalScreenX = e.clientX - courtRect.left - dragOffset.x;
      let finalScreenY = e.clientY - courtRect.top - dragOffset.y;

      let finalVbX = (finalScreenX / courtWidth) * 9;
      let finalVbY = (finalScreenY / courtHeight) * 9;

      onDragEnd(finalVbX, finalVbY);
    },
    [isDragging, dragOffset, courtWidth, courtHeight, onDragEnd]
  );

  // Add global mouse event listeners during drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Get position label
  const positionLabel = VolleyballRulesEngine.getSlotLabel(player.slot);

  return (
    <div
      ref={playerRef}
      className={`
        absolute w-12 h-12 rounded-full border-2 cursor-move select-none
        flex items-center justify-center text-xs font-bold
        transition-colors duration-200
        ${
          isDragging
            ? "bg-blue-200 border-blue-500 z-10"
            : "bg-white border-gray-400"
        }
        ${player.isServer ? "ring-2 ring-yellow-400" : ""}
        hover:bg-gray-100
      `}
      style={{
        left: screenX - 24, // Center the 48px (w-12) circle
        top: screenY - 24,
      }}
      onMouseDown={handleMouseDown}
      title={`${player.displayName} (${positionLabel})`}
    >
      <div className="text-center">
        <div className="text-[10px] leading-none">{positionLabel}</div>
        <div className="text-[8px] leading-none text-gray-600">
          {player.slot}
        </div>
      </div>
    </div>
  );
}

/**
 * Props for ValidationDisplay component
 */
interface ValidationDisplayProps {
  validationResult: OverlapResult;
  players: PlayerState[];
  className?: string;
}

/**
 * Component to display validation results and violations
 */
export function ValidationDisplay({
  validationResult,
  players,
  className = "",
}: ValidationDisplayProps) {
  if (validationResult.isLegal) {
    return (
      <div
        className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}
      >
        <div className="flex items-center text-green-800">
          <span className="text-lg mr-2">✅</span>
          <span className="font-semibold">Formation is legal</span>
        </div>
        <p className="text-sm text-green-600 mt-1">
          All players are positioned according to volleyball overlap rules.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}
    >
      <div className="flex items-center text-red-800 mb-3">
        <span className="text-lg mr-2">❌</span>
        <span className="font-semibold">
          {validationResult.violations.length} violation
          {validationResult.violations.length !== 1 ? "s" : ""} found
        </span>
      </div>

      <div className="space-y-2">
        {validationResult.violations.map((violation, index) => {
          const explanation = VolleyballRulesEngine.explainViolation(
            violation,
            players
          );

          return (
            <div
              key={index}
              className="p-3 bg-white border border-red-200 rounded"
            >
              <div className="font-medium text-red-800 text-sm">
                {violation.code.replace("_", " ")} Violation
              </div>
              <div className="text-sm text-red-600 mt-1">{explanation}</div>
              {violation.slots.length > 0 && (
                <div className="text-xs text-red-500 mt-1">
                  Affected slots: {violation.slots.join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Props for ConstraintDisplay component
 */
interface ConstraintDisplayProps {
  constraints: PositionBounds;
  playerName: string;
  className?: string;
}

/**
 * Component to display current drag constraints
 */
export function ConstraintDisplay({
  constraints,
  playerName,
  className = "",
}: ConstraintDisplayProps) {
  return (
    <div
      className={`p-3 bg-blue-50 border border-blue-200 rounded-lg ${className}`}
    >
      <div className="font-semibold text-blue-800 text-sm mb-2">
        Constraints for {playerName}
      </div>

      <div className="text-xs text-blue-600 space-y-1">
        <div>
          X: {constraints.minX.toFixed(2)}m to {constraints.maxX.toFixed(2)}m
        </div>
        <div>
          Y: {constraints.minY.toFixed(2)}m to {constraints.maxY.toFixed(2)}m
        </div>

        {constraints.constraintReasons.length > 0 && (
          <div className="mt-2">
            <div className="font-medium">Reasons:</div>
            <ul className="list-disc list-inside ml-2">
              {constraints.constraintReasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Props for VolleyballCourt component
 */
interface VolleyballCourtProps {
  players: PlayerState[];
  onPlayerPositionChange: (playerId: string, x: number, y: number) => void;
  onDragStart: (playerId: string) => void;
  onDragEnd: (playerId: string, x: number, y: number) => void;
  draggedPlayer: string | null;
  constraints: Map<string, PositionBounds>;
  width?: number;
  height?: number;
}

/**
 * Main volleyball court component with draggable players
 */
export function VolleyballCourt({
  players,
  onPlayerPositionChange,
  onDragStart,
  onDragEnd,
  draggedPlayer,
  constraints,
  width = 600,
  height = 360,
}: VolleyballCourtProps) {
  return (
    <div className="relative">
      {/* Court background */}
      <svg
        width={width}
        height={height}
        className="border border-gray-400 bg-orange-100"
      >
        {/* Court lines */}
        <defs>
          <pattern
            id="courtLines"
            patternUnits="userSpaceOnUse"
            width="100"
            height="60"
          >
            <path
              d="M 0 0 L 100 0 L 100 60 L 0 60 Z"
              fill="none"
              stroke="#8B4513"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Net line */}
        <line x1="0" y1="0" x2={width} y2="0" stroke="#333" strokeWidth="3" />

        {/* Sidelines */}
        <line x1="0" y1="0" x2="0" y2={height} stroke="#333" strokeWidth="2" />
        <line
          x1={width}
          y1="0"
          x2={width}
          y2={height}
          stroke="#333"
          strokeWidth="2"
        />

        {/* Endline */}
        <line
          x1="0"
          y1={height}
          x2={width}
          y2={height}
          stroke="#333"
          strokeWidth="2"
        />

        {/* Attack line (3m from net) */}
        <line
          x1="0"
          y1={height / 3}
          x2={width}
          y2={height / 3}
          stroke="#666"
          strokeWidth="1"
          strokeDasharray="5,5"
        />

        {/* Center line markers */}
        <circle cx={width / 2} cy="0" r="3" fill="#333" />

        {/* Position labels */}
        <text
          x={width * 0.15}
          y={height * 0.25}
          textAnchor="middle"
          className="text-xs fill-gray-600"
        >
          LF (4)
        </text>
        <text
          x={width * 0.5}
          y={height * 0.25}
          textAnchor="middle"
          className="text-xs fill-gray-600"
        >
          MF (3)
        </text>
        <text
          x={width * 0.85}
          y={height * 0.25}
          textAnchor="middle"
          className="text-xs fill-gray-600"
        >
          RF (2)
        </text>
        <text
          x={width * 0.15}
          y={height * 0.75}
          textAnchor="middle"
          className="text-xs fill-gray-600"
        >
          LB (5)
        </text>
        <text
          x={width * 0.5}
          y={height * 0.75}
          textAnchor="middle"
          className="text-xs fill-gray-600"
        >
          MB (6)
        </text>
        <text
          x={width * 0.85}
          y={height * 0.75}
          textAnchor="middle"
          className="text-xs fill-gray-600"
        >
          RB (1)
        </text>
      </svg>

      {/* Players */}
      {players.map((player) => (
        <DraggablePlayer
          key={player.id}
          player={player}
          constraints={constraints.get(player.id)}
          isDragging={draggedPlayer === player.id}
          onDragStart={() => onDragStart(player.id)}
          onDrag={(x, y) => onPlayerPositionChange(player.id, x, y)}
          onDragEnd={(x, y) => onDragEnd(player.id, x, y)}
          courtWidth={width}
          courtHeight={height}
        />
      ))}
    </div>
  );
}

/**
 * Complete volleyball rules engine demo component
 */
export function VolleyballRulesDemo() {
  // Initial formation
  const initialPlayers: PlayerState[] = [
    {
      id: "1",
      displayName: "Setter",
      role: "S",
      slot: 1,
      x: 8.0,
      y: 6.0,
      isServer: true,
    },
    {
      id: "2",
      displayName: "Opposite",
      role: "OPP",
      slot: 2,
      x: 7.0,
      y: 3.0,
      isServer: false,
    },
    {
      id: "3",
      displayName: "Middle",
      role: "MB1",
      slot: 3,
      x: 4.5,
      y: 3.0,
      isServer: false,
    },
    {
      id: "4",
      displayName: "Outside",
      role: "OH1",
      slot: 4,
      x: 2.0,
      y: 3.0,
      isServer: false,
    },
    {
      id: "5",
      displayName: "Libero",
      role: "L",
      slot: 5,
      x: 1.0,
      y: 6.0,
      isServer: false,
    },
    {
      id: "6",
      displayName: "Middle Back",
      role: "MB2",
      slot: 6,
      x: 4.5,
      y: 6.0,
      isServer: false,
    },
  ];

  const {
    players,
    validationResult,
    draggedPlayer,
    constraints,
    updatePlayerPosition,
    startDrag,
    endDrag,
  } = useVolleyballPositions(initialPlayers);

  const draggedPlayerData = draggedPlayer
    ? players.find((p) => p.id === draggedPlayer)
    : null;
  const draggedPlayerConstraints = draggedPlayer
    ? constraints.get(draggedPlayer)
    : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        🏐 Volleyball Rules Engine Demo
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Court */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Interactive Court</h2>
          <VolleyballCourt
            players={players}
            onPlayerPositionChange={updatePlayerPosition}
            onDragStart={startDrag}
            onDragEnd={endDrag}
            draggedPlayer={draggedPlayer}
            constraints={constraints}
          />
          <p className="text-sm text-gray-600 mt-2">
            Drag players to reposition them. Constraints are enforced in
            real-time.
          </p>
        </div>

        {/* Validation and Info */}
        <div className="space-y-4">
          <ValidationDisplay
            validationResult={validationResult}
            players={players}
          />

          {draggedPlayerData && draggedPlayerConstraints && (
            <ConstraintDisplay
              constraints={draggedPlayerConstraints}
              playerName={draggedPlayerData.displayName}
            />
          )}

          {/* Player list */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">
              Current Formation
            </h3>
            <div className="space-y-1 text-sm">
              {players.map((player) => {
                const positionLabel = VolleyballRulesEngine.getSlotLabel(
                  player.slot
                );
                const description =
                  VolleyballRulesEngine.getPositionDescription(player.slot);

                return (
                  <div key={player.id} className="flex justify-between">
                    <span>
                      {player.displayName} ({positionLabel})
                      {player.isServer && " 🏐"}
                    </span>
                    <span className="text-gray-500">
                      ({player.x.toFixed(1)}, {player.y.toFixed(1)})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VolleyballRulesDemo;
