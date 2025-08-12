"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { usePositionManager } from "@/hooks/usePositionManager";
import { DraggablePlayer } from "@/components";
import { SystemType, FormationType } from "@/types";

// Volleyball Rotations Visualizer — UPDATED
// - Corrected rotation generation to ensure: Opposite players are 3 positions away (diagonal),
//   i.e. pos + 3 (mod 6).
// - Rotations are now generated programmatically from a single starting rotation so Rotation 2,
//   Rotation 3, ... follow the standard clockwise rotation order.
// - Added a dropdown to choose the displayed formation: "rotational position" (default),
//   "serve/receive", and "base". Selecting any option animates players to that formation.
// - Keeps Next/Prev rotation controls and a small Animate button for scripted sequences.

const courtWidth = 600;
const courtHeight = 360;

const baseCoords: Record<number, { x: number; y: number }> = {
  1: { x: courtWidth * 0.78, y: courtHeight * 0.82 }, // right-back (1)
  2: { x: courtWidth * 0.78, y: courtHeight * 0.42 }, // right-front (2)
  3: { x: courtWidth * 0.5, y: courtHeight * 0.42 }, // middle-front (3)
  4: { x: courtWidth * 0.22, y: courtHeight * 0.42 }, // left-front (4)
  5: { x: courtWidth * 0.22, y: courtHeight * 0.82 }, // left-back (5)
  6: { x: courtWidth * 0.5, y: courtHeight * 0.82 }, // middle-back (6)
};

const serveReceiveCoords = {
  SR_right: { x: courtWidth * 0.7, y: courtHeight * 0.7 },
  SR_middle: { x: courtWidth * 0.5, y: courtHeight * 0.65 },
  SR_left: { x: courtWidth * 0.3, y: courtHeight * 0.7 },
  SR_frontRight: { x: courtWidth * 0.72, y: courtHeight * 0.5 },
  SR_frontLeft: { x: courtWidth * 0.28, y: courtHeight * 0.5 },
};

// Player type definition
interface Player {
  id: string;
  name: string;
  role: string;
}

// Players for 5-1 (single setter) — you can rename these to match your roster
const players5_1: Player[] = [
  { id: "S", name: "Setter", role: "S" },
  { id: "Opp", name: "Opp", role: "Opp" },
  { id: "OH1", name: "OH1", role: "OH" },
  { id: "MB1", name: "MB1", role: "MB" },
  { id: "OH2", name: "OH2", role: "OH" },
  { id: "MB2", name: "MB2", role: "MB" },
];

// Players for 6-2 (two setters)
const players6_2: Player[] = [
  { id: "S1", name: "S1", role: "S" },
  { id: "S2", name: "S2", role: "S" },
  { id: "OH1", name: "OH1", role: "OH" },
  { id: "MB1", name: "MB1", role: "MB" },
  { id: "OH2", name: "OH2", role: "OH" },
  { id: "MB2", name: "MB2", role: "MB" },
];

// Starting rotation (Rotation 1) — matches your requirement:
// Setter in 1, OH1 in 2, MB1 in 3.
// Opposite = 3 positions away (pos + 3), OH2 opposite OH1, MB2 opposite MB1.
const baseRotation5_1 = {
  1: "S",
  2: "OH1",
  3: "MB1",
  4: "Opp",
  5: "OH2",
  6: "MB2",
};

// For 6-2, place the two setters at 1 and 6 so the acting setter is the back-row setter when appropriate
const baseRotation6_2 = {
  1: "S1",
  2: "OH1",
  3: "MB1",
  4: "Opp",
  5: "OH2",
  6: "S2",
};

function generateRotationsFrom(baseMap: Record<number, string>) {
  // produce an array of 6 rotation maps following clockwise rotation rules
  const maps: Record<number, string>[] = [];
  let cur = { ...baseMap };
  for (let r = 0; r < 6; r++) {
    maps.push({ ...cur });
    const next: Record<number, string> = {};
    // next[pos] = cur[pos+1] (where pos+1 wraps 1..6)
    for (let pos = 1; pos <= 6; pos++) {
      const from = (pos % 6) + 1; // 1->2, 2->3, ... 6->1
      next[pos] = cur[from];
    }
    cur = next;
  }
  return maps;
}

const rotations_5_1 = generateRotationsFrom(baseRotation5_1);
const rotations_6_2 = generateRotationsFrom(baseRotation6_2);

function getServeReceiveTargets(rotationMap: Record<number, string>) {
  // choose three primary receivers from back-row players in standard preference: 1 (right-back), 6 (mid-back), 5 (left-back)
  const receiverOrder = [1, 6, 5];
  const receivers = receiverOrder.map((pos) => rotationMap[pos]);
  const targets: Record<string, { x: number; y: number }> = {};
  if (receivers[0]) targets[receivers[0]] = serveReceiveCoords.SR_right;
  if (receivers[1]) targets[receivers[1]] = serveReceiveCoords.SR_middle;
  if (receivers[2]) targets[receivers[2]] = serveReceiveCoords.SR_left;
  return targets;
}
export default function Home() {
  const [system, setSystem] = useState<SystemType>("5-1");
  const [rotationIndex, setRotationIndex] = useState(0); // 0..5
  const [formation, setFormation] = useState<FormationType>("rotational");
  const [isAnimating, setIsAnimating] = useState(false);
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);

  // Initialize position manager
  const positionManager = usePositionManager();

  // Helper function for delays
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const players = system === "5-1" ? players5_1 : players6_2;
  const rotations = system === "5-1" ? rotations_5_1 : rotations_6_2;
  const rotationMap = rotations[rotationIndex];

  // Precompute serve-receive targets for the current rotation
  const SRtargets = getServeReceiveTargets(rotationMap);

  // Drag event handlers
  const handleDragStart = useCallback((playerId: string) => {
    setDraggedPlayer(playerId);
  }, []);

  const handleDragEnd = useCallback((playerId: string, success: boolean) => {
    setDraggedPlayer(null);
    if (success) {
      // Position was successfully updated by the position manager
      console.log(`Player ${playerId} position updated successfully`);
    }
  }, []);

  useEffect(() => {
    // When formation changes, briefly set an animating flag to disable changing rotation during transition
    setIsAnimating(true);
    const t = setTimeout(() => setIsAnimating(false), 700); // animation window (ms)
    return () => clearTimeout(t);
  }, [formation]);

  useEffect(() => {
    // reset formation to rotational when rotation or system changes
    setFormation("rotational");
  }, [rotationIndex, system]);

  function nextRotation() {
    if (isAnimating) return;
    setRotationIndex((r) => (r + 1) % 6);
  }
  function prevRotation() {
    if (isAnimating) return;
    setRotationIndex((r) => (r + 5) % 6);
  }

  // optional scripted animate from SR -> Base (kept for convenience)
  async function animateSRtoBase() {
    if (isAnimating) return;
    setIsAnimating(true);
    setFormation("serveReceive");
    await wait(900);
    setFormation("base");
    await wait(900);
    setFormation("rotational");
    setIsAnimating(false);
  }

  return (
    <div className="p-4 w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">
          Volleyball Rotations Visualizer
        </h2>
        <div className="flex gap-2">
          <select
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="5-1">5-1</option>
            <option value="6-2">6-2</option>
          </select>

          <button
            onClick={prevRotation}
            className="px-3 py-1 border rounded hover:bg-gray-100"
            disabled={isAnimating}
          >
            Prev Rotation
          </button>
          <button
            onClick={nextRotation}
            className="px-3 py-1 border rounded hover:bg-gray-100"
            disabled={isAnimating}
          >
            Next Rotation
          </button>

          <button
            onClick={animateSRtoBase}
            className={`px-3 py-1 rounded text-white ${
              isAnimating ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={isAnimating}
          >
            {isAnimating ? "Animating..." : "Animate SR→Base"}
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="bg-white p-4 rounded shadow flex-1">
          <div className="mb-2 flex items-center justify-between">
            <div>
              System: <strong>{system}</strong>
            </div>
            <div>
              Rotation: <strong>{rotationIndex + 1}</strong>
            </div>
            <div>
              Formation:{" "}
              <strong>
                {formation === "rotational"
                  ? "Rotational Position"
                  : formation === "serveReceive"
                  ? "Serve/Receive"
                  : "Base (Attack)"}{" "}
              </strong>
            </div>
          </div>

          {/* Position manager status */}
          {positionManager.isLoading && (
            <div className="mb-2 text-sm text-blue-600">
              Loading saved positions...
            </div>
          )}

          {positionManager.error && (
            <div className="mb-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              Error: {positionManager.error}
              <button
                onClick={positionManager.clearError}
                className="ml-2 text-red-800 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {draggedPlayer && (
            <div className="mb-2 text-sm text-green-600">
              Dragging player: <strong>{draggedPlayer}</strong>
            </div>
          )}

          <div className="mb-3 flex items-center gap-3">
            <label className="text-sm">Show formation:</label>
            <select
              value={formation}
              onChange={(e) => setFormation(e.target.value)}
              className="px-3 py-1 border rounded"
            >
              <option value="rotational">Rotational Position (default)</option>
              <option value="serveReceive">Serve/Receive</option>
              <option value="base">Base (Attack)</option>
            </select>
            <div className="text-xs text-gray-500">
              (Selecting an option animates players to that formation)
            </div>

            {/* Reset controls */}
            {positionManager.isFormationCustomized(
              system,
              rotationIndex,
              formation
            ) && (
              <button
                onClick={() =>
                  positionManager.resetFormation(
                    system,
                    rotationIndex,
                    formation
                  )
                }
                className="ml-3 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                disabled={isAnimating}
              >
                Reset {formation} positions
              </button>
            )}
          </div>

          <div className="w-full overflow-auto">
            <svg
              viewBox={`0 0 ${courtWidth} ${courtHeight}`}
              width="100%"
              height="auto"
              style={{
                cursor: draggedPlayer ? "grabbing" : "default",
                userSelect: "none",
              }}
            >
              <rect
                x={0}
                y={0}
                width={courtWidth}
                height={courtHeight}
                fill="#f7f7f9"
                stroke="#ccc"
                rx={8}
              />
              <line
                x1={0}
                y1={courtHeight * 0.12}
                x2={courtWidth}
                y2={courtHeight * 0.12}
                stroke="#333"
                strokeWidth={3}
              />
              <line
                x1={0}
                y1={courtHeight * 0.3}
                x2={courtWidth}
                y2={courtHeight * 0.3}
                stroke="#aaa"
                strokeDasharray="6 4"
              />

              {/* base position markers */}
              {Object.entries(baseCoords).map(([pos, c]) => (
                <g key={`marker-${pos}`}>
                  <circle cx={c.x} cy={c.y} r={6} fill="#ddd" />
                  <text x={c.x + 10} y={c.y + 4} fontSize={12} fill="#666">
                    {pos}
                  </text>
                </g>
              ))}

              {/* players */}
              {players.map((p) => {
                // Get position from position manager (includes custom positions)
                const position = positionManager.getPosition(
                  system,
                  rotationIndex,
                  formation,
                  p.id
                );

                // Fallback to calculated position if no position manager data
                let fallbackTarget = { x: -50, y: -50 };
                const myEntry = Object.entries(rotationMap).find(
                  ([, v]) => v === p.id
                );
                const posNum = myEntry ? Number(myEntry[0]) : null;

                if (formation === "rotational") {
                  if (posNum) fallbackTarget = baseCoords[posNum];
                } else if (formation === "serveReceive") {
                  if (SRtargets[p.id]) {
                    fallbackTarget = SRtargets[p.id];
                  } else if (posNum) {
                    fallbackTarget = { ...baseCoords[posNum] };
                    if (posNum === 2 || posNum === 3 || posNum === 4)
                      fallbackTarget.y -= 40;
                  }
                } else if (formation === "base") {
                  if (posNum) {
                    fallbackTarget = { ...baseCoords[posNum] };
                    if (p.role === "OH") {
                      if (posNum === 2) fallbackTarget.x += 18;
                      if (posNum === 4) fallbackTarget.x -= 18;
                      fallbackTarget.y -= 20;
                    }
                    if (p.role === "MB") {
                      if (posNum === 3) fallbackTarget.y -= 10;
                    }
                    if (p.role === "S") {
                      if (posNum === 1 || posNum === 6) fallbackTarget.y -= 10;
                    }
                  }
                }

                const finalPosition = position || fallbackTarget;

                return (
                  <DraggablePlayer
                    key={p.id}
                    player={p}
                    position={finalPosition}
                    positionManager={positionManager}
                    system={system}
                    rotation={rotationIndex}
                    formation={formation}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                );
              })}
            </svg>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Tip: Use the <em>Show formation</em> dropdown to switch between
            Rotational Position, Serve/Receive, and Base. The visualizer now
            generates rotations programmatically so Rotation 2, 3, ... follow
            standard clockwise rotation (e.g. Rotation 2 places the Setter at 6,
            OH1 at 1, MB1 at 2, etc.).
          </div>
        </div>

        <div className="w-72 bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Roster / Rotation Table</h3>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Pos</th>
                <th className="text-left">Player</th>
                <th className="text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(rotationMap).map(([pos, pid]) => {
                const p = players.find((x) => x.id === pid) || {
                  name: pid,
                  role: "",
                };
                return (
                  <tr key={pos} className="border-t">
                    <td className="py-1">{pos}</td>
                    <td className="py-1">{p.name}</td>
                    <td className="py-1">{p.role}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-4">
            <h4 className="font-medium">Controls</h4>
            <ol className="text-sm mt-2 list-decimal ml-5 space-y-1">
              <li>Switch system (5-1 or 6-2).</li>
              <li>
                Next/Prev to step rotations 1→6 (rotations move clockwise).
              </li>
              <li>
                Use the <em>Show formation</em> dropdown to animate between
                Rotational, Serve/Receive, and Base.
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Note: The starting rotation follows your specification: Setter in 1, OH1
        in 2, MB1 in 3. Opposite players are placed 3 positions away so they are
        diagonally opposite (e.g. Opp at 4 when Setter is at 1). Adjust player
        IDs to match your roster names and roles; the rotation generator will
        follow the same rules.
      </div>
    </div>
  );
}
