"use client";
import React, { useState, useEffect, useCallback } from "react";
import { usePositionManager } from "@/hooks/usePositionManager";
import { DraggablePlayer } from "@/components";
import { SystemType, FormationType } from "@/types";
import { URLStateManager } from "@/utils/URLStateManager";

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
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [shareURL, setShareURL] = useState<string>("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [urlLoadStatus, setUrlLoadStatus] = useState<{
    loaded: boolean;
    source: "url" | "localStorage" | "default";
    message?: string;
  }>({ loaded: false, source: "default" });

  // Initialize position manager
  const positionManager = usePositionManager();

  // Check for URL parameters on initial load
  useEffect(() => {
    const loadFromURL = async () => {
      try {
        // Check if URL contains position data
        if (URLStateManager.hasPositionData(window.location.href)) {
          const urlData = URLStateManager.parseCurrentURL();

          if (urlData) {
            // URL data overrides localStorage data
            setSystem(urlData.system);
            setRotationIndex(urlData.rotation);

            // Load positions into position manager
            // This will override any localStorage data
            for (const [rotationKey, rotationData] of Object.entries(
              urlData.positions
            )) {
              const rotation = parseInt(rotationKey);

              if (
                rotationData.rotational &&
                Object.keys(rotationData.rotational).length > 0
              ) {
                positionManager.setFormationPositions(
                  urlData.system,
                  rotation,
                  "rotational",
                  rotationData.rotational
                );
              }
              if (
                rotationData.serveReceive &&
                Object.keys(rotationData.serveReceive).length > 0
              ) {
                positionManager.setFormationPositions(
                  urlData.system,
                  rotation,
                  "serveReceive",
                  rotationData.serveReceive
                );
              }
              if (
                rotationData.base &&
                Object.keys(rotationData.base).length > 0
              ) {
                positionManager.setFormationPositions(
                  urlData.system,
                  rotation,
                  "base",
                  rotationData.base
                );
              }
            }

            // Set read-only mode for shared URLs (can be toggled off)
            setIsReadOnly(true);
            setUrlLoadStatus({
              loaded: true,
              source: "url",
              message: "Loaded shared configuration from URL",
            });
          }
        } else {
          // No URL data, will use localStorage or defaults
          setUrlLoadStatus({
            loaded: true,
            source: "localStorage",
            message: "Using saved positions",
          });
        }
      } catch (error) {
        console.error("Failed to load from URL:", error);
        setUrlLoadStatus({
          loaded: true,
          source: "default",
          message: "Failed to load from URL, using defaults",
        });
      }
    };

    // Only run after position manager has finished loading
    if (!positionManager.isLoading) {
      loadFromURL();
    }
  }, [
    positionManager.isLoading,
    positionManager.setFormationPositions,
    positionManager,
  ]);

  // Helper function for delays
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Generate shareable URL
  const generateShareURL = useCallback(() => {
    try {
      const shareableURL = URLStateManager.generateShareableURL(
        system,
        rotationIndex,
        positionManager.positions[system]
      );
      setShareURL(shareableURL);
      setShowShareDialog(true);
    } catch (error) {
      console.error("Failed to generate share URL:", error);
      positionManager.clearError();
      // Set a temporary error state
      setTimeout(() => {
        alert(
          "Failed to generate shareable URL. The configuration may be too large."
        );
      }, 100);
    }
  }, [system, rotationIndex, positionManager]);

  // Copy URL to clipboard
  const copyShareURL = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareURL);
      alert("URL copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy URL:", error);
      // Fallback: select the text
      const urlInput = document.getElementById(
        "share-url-input"
      ) as HTMLInputElement;
      if (urlInput) {
        urlInput.select();
        urlInput.setSelectionRange(0, 99999);
        document.execCommand("copy");
        alert("URL copied to clipboard!");
      }
    }
  }, [shareURL]);

  // Make editable copy (exit read-only mode)
  const makeEditableCopy = useCallback(() => {
    setIsReadOnly(false);
    // Clear URL parameters to indicate this is now a local copy
    URLStateManager.clearURLParameters();
    setUrlLoadStatus({
      loaded: true,
      source: "localStorage",
      message: "Created editable copy - changes will be saved locally",
    });
  }, []);

  const players = system === "5-1" ? players5_1 : players6_2;
  const rotations = system === "5-1" ? rotations_5_1 : rotations_6_2;
  const rotationMap = rotations[rotationIndex];

  // Precompute serve-receive targets for the current rotation
  const SRtargets = getServeReceiveTargets(rotationMap);

  // Drag event handlers
  const handleDragStart = useCallback(
    (playerId: string) => {
      if (!isReadOnly) {
        setDraggedPlayer(playerId);
      }
    },
    [isReadOnly]
  );

  const handleDragEnd = useCallback(
    (playerId: string, success: boolean) => {
      setDraggedPlayer(null);
      if (success && !isReadOnly) {
        // Position was successfully updated by the position manager
        console.log(`Player ${playerId} position updated successfully`);
      }
    },
    [isReadOnly]
  );

  // Reset individual position handler
  const handleResetPosition = useCallback(
    (playerId: string) => {
      if (!isReadOnly) {
        positionManager.resetPosition(
          system,
          rotationIndex,
          formation,
          playerId
        );
      }
    },
    [positionManager, system, rotationIndex, formation, isReadOnly]
  );

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
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Volleyball Rotations Visualizer
        </h2>
        <div className="flex gap-2 flex-wrap">
          <select
            value={system}
            onChange={(e) => setSystem(e.target.value as SystemType)}
            className="px-3 py-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            disabled={isReadOnly}
          >
            <option value="5-1">5-1</option>
            <option value="6-2">6-2</option>
          </select>

          <button
            onClick={prevRotation}
            className="px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            disabled={isAnimating || isReadOnly}
          >
            Prev Rotation
          </button>
          <button
            onClick={nextRotation}
            className="px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            disabled={isAnimating || isReadOnly}
          >
            Next Rotation
          </button>

          {/* Rotation indicators */}
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Rotations:
            </span>
            {[0, 1, 2, 3, 4, 5].map((rot) => (
              <button
                key={rot}
                onClick={() =>
                  !isAnimating && !isReadOnly && setRotationIndex(rot)
                }
                className={`w-6 h-6 text-xs rounded-full border ${
                  rot === rotationIndex
                    ? "bg-blue-500 text-white border-blue-600"
                    : positionManager.isRotationCustomized(system, rot)
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                } ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isAnimating || isReadOnly}
                title={
                  positionManager.isRotationCustomized(system, rot)
                    ? `Rotation ${rot + 1} (Custom positions)`
                    : `Rotation ${rot + 1}`
                }
              >
                {rot + 1}
              </button>
            ))}
          </div>

          <button
            onClick={animateSRtoBase}
            className={`px-3 py-1 rounded text-white ${
              isAnimating || isReadOnly
                ? "bg-gray-500"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={isAnimating || isReadOnly}
          >
            {isAnimating ? "Animating..." : "Animate SR→Base"}
          </button>

          {/* Share button */}
          <button
            onClick={generateShareURL}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={isAnimating}
          >
            Share
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow flex-1">
          <div className="mb-2 flex items-center justify-between text-gray-900 dark:text-gray-100">
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
            <div className="mb-2 text-sm text-blue-600 dark:text-blue-400">
              Loading saved positions...
            </div>
          )}

          {positionManager.error && (
            <div className="mb-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
              Error: {positionManager.error}
              <button
                onClick={positionManager.clearError}
                className="ml-2 text-red-800 dark:text-red-300 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* URL load status */}
          {urlLoadStatus.loaded && urlLoadStatus.message && (
            <div
              className={`mb-2 text-sm p-2 rounded ${
                urlLoadStatus.source === "url"
                  ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20"
                  : urlLoadStatus.source === "localStorage"
                  ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20"
                  : "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20"
              }`}
            >
              {urlLoadStatus.message}
              {urlLoadStatus.source === "url" && (
                <button
                  onClick={() =>
                    setUrlLoadStatus({ ...urlLoadStatus, message: undefined })
                  }
                  className="ml-2 underline"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}

          {/* Read-only mode indicator */}
          {isReadOnly && (
            <div className="mb-2 text-sm text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 p-2 rounded flex items-center justify-between">
              <span>
                <strong>Read-only mode:</strong> Viewing shared configuration
              </span>
              <button
                onClick={makeEditableCopy}
                className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Make Editable Copy
              </button>
            </div>
          )}

          {draggedPlayer && !isReadOnly && (
            <div className="mb-2 text-sm text-green-600 dark:text-green-400">
              Dragging player: <strong>{draggedPlayer}</strong>
            </div>
          )}

          <div className="mb-3 flex items-center gap-3 flex-wrap">
            <label className="text-sm text-gray-900 dark:text-gray-100">
              Show formation:
            </label>
            <div className="relative">
              <select
                value={formation}
                onChange={(e) => setFormation(e.target.value as FormationType)}
                className="px-3 py-1 border rounded pr-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                disabled={isReadOnly}
              >
                <option value="rotational">
                  Rotational Position{" "}
                  {positionManager.isFormationCustomized(
                    system,
                    rotationIndex,
                    "rotational"
                  )
                    ? "●"
                    : ""}
                </option>
                <option value="serveReceive">
                  Serve/Receive{" "}
                  {positionManager.isFormationCustomized(
                    system,
                    rotationIndex,
                    "serveReceive"
                  )
                    ? "●"
                    : ""}
                </option>
                <option value="base">
                  Base (Attack){" "}
                  {positionManager.isFormationCustomized(
                    system,
                    rotationIndex,
                    "base"
                  )
                    ? "●"
                    : ""}
                </option>
              </select>
              {positionManager.isFormationCustomized(
                system,
                rotationIndex,
                formation
              ) && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full pointer-events-none"></div>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              (● indicates custom positions)
            </div>

            {/* Reset controls */}
            {!isReadOnly && (
              <div className="flex gap-2">
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
                    className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                    disabled={isAnimating}
                  >
                    Reset {formation}
                  </button>
                )}

                {positionManager.isRotationCustomized(
                  system,
                  rotationIndex
                ) && (
                  <button
                    onClick={() =>
                      positionManager.resetRotation(system, rotationIndex)
                    }
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    disabled={isAnimating}
                  >
                    Reset Rotation {rotationIndex + 1}
                  </button>
                )}

                {positionManager.isSystemCustomized(system) && (
                  <button
                    onClick={() => positionManager.resetSystem(system)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    disabled={isAnimating}
                  >
                    Reset All {system}
                  </button>
                )}
              </div>
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
                    onResetPosition={handleResetPosition}
                    isReadOnly={isReadOnly}
                  />
                );
              })}
            </svg>
          </div>

          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <div>
              <strong>Visual Indicators:</strong>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Default position</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span>Custom position</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Customization indicator</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-600 rounded-full"></div>
                <span>Rotation with custom positions</span>
              </div>
            </div>
            <div>
              <strong>Interactions:</strong> Drag players to customize positions
              • Hover for tooltips • Click × to reset individual positions
            </div>
          </div>
        </div>

        <div className="w-72 bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Roster / Rotation Table
          </h3>
          <table className="w-full text-sm text-gray-900 dark:text-gray-100">
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
                  <tr
                    key={pos}
                    className="border-t border-gray-200 dark:border-gray-700"
                  >
                    <td className="py-1">{pos}</td>
                    <td className="py-1">{p.name}</td>
                    <td className="py-1">{p.role}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Controls
            </h4>
            <ol className="text-sm mt-2 list-decimal ml-5 space-y-1 text-gray-700 dark:text-gray-300">
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

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Note: The starting rotation follows your specification: Setter in 1, OH1
        in 2, MB1 in 3. Opposite players are placed 3 positions away so they are
        diagonally opposite (e.g. Opp at 4 when Setter is at 1). Adjust player
        IDs to match your roster names and roles; the rotation generator will
        follow the same rules.
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Share Configuration
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Copy this URL to share your current volleyball formation
              configuration:
            </p>
            <div className="flex gap-2 mb-4">
              <input
                id="share-url-input"
                type="text"
                value={shareURL}
                readOnly
                className="flex-1 px-3 py-2 border rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={copyShareURL}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Copy
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              <strong>Note:</strong> This URL contains all your custom positions
              for the {system} system. Recipients will be able to view your
              formations and create their own editable copies.
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowShareDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
