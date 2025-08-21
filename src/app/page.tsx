"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { VolleyballCourt } from "@/components/VolleyballCourt";
import { SystemType, FormationType, PlayerPosition } from "@/types";
import { URLStateManager } from "@/utils/URLStateManager";
import { useNotifications } from "@/components/NotificationSystem";
import { BrowserCompatibilityWarning } from "@/components/BrowserCompatibilityWarning";

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
export default function Home() {
  const [system, setSystem] = useState<SystemType>("5-1");
  const [rotationIndex, setRotationIndex] = useState(0); // 0..5
  const [formation, setFormation] = useState<FormationType>("rotational");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [shareURL, setShareURL] = useState<string>("");
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Initialize notification system
  const { addNotification } = useNotifications();

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

  // Create configuration object for VolleyballCourt component
  const volleyballCourtConfig = useMemo(() => ({
    initialSystem: system,
    initialRotation: rotationIndex,
    initialFormation: formation,
    
    // Controls configuration
    controls: {
      showSystemSelector: true,
      showRotationControls: true,
      showFormationSelector: true,
      showResetButton: true,
      showShareButton: true,
      showAnimateButton: true,
      controlsPosition: "top" as const,
      controlsStyle: "expanded" as const,
    },
    
    // Validation configuration
    validation: {
      enableRealTimeValidation: true,
      showConstraintBoundaries: formation === "rotational",
      showViolationDetails: true,
      strictMode: false,
      enableEducationalMessages: true,
    },
    
    // Appearance configuration
    appearance: {
      showPlayerNames: true,
      showPlayerNumbers: false,
      showPositionLabels: true,
      playerSize: 1.0,
      theme: "light" as const,
    },
    
    // Animation configuration
    animation: {
      enableAnimations: true,
      animationDuration: 700,
      staggerDelay: 100,
    },
    
    // Player configuration
    players: {
      "5-1": players5_1.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role as "S" | "Opp" | "OH" | "MB",
      })),
      "6-2": players6_2.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role as "S" | "Opp" | "OH" | "MB",
      })),
    },
    
    // Rotation mappings
    rotations: {
      "5-1": rotations_5_1,
      "6-2": rotations_6_2,
    },
  }), [system, rotationIndex, formation, isReadOnly]);

  // Callback handlers for VolleyballCourt component
  const handleSystemChange = useCallback((data: any) => {
    setSystem(data.system);
  }, []);

  const handleRotationChange = useCallback((data: any) => {
    setRotationIndex(data.rotation);
  }, []);

  const handleFormationChange = useCallback((data: any) => {
    setFormation(data.formation);
  }, []);

  const handlePositionChange = useCallback((data: any) => {
    // Position changes are handled internally by the component
    // We can add notifications here if needed
    if (data.success) {
      addNotification({
        type: "success",
        title: "Position Updated",
        message: `${data.playerId} has been moved to a new position.`,
        duration: 2000,
      });
    }
  }, [addNotification]);

  const handleViolation = useCallback((data: any) => {
    // Handle volleyball rule violations
    if (data.violations && data.violations.length > 0) {
      addNotification({
        type: "warning",
        title: "Rule Violation",
        message: data.violations[0], // Show first violation
        duration: 4000,
      });
    }
  }, [addNotification]);

  const handleShare = useCallback((data: any) => {
    setShareURL(data.url);
    setShowShareDialog(true);
  }, []);

  const handleError = useCallback((data: any) => {
    addNotification({
      type: "error",
      title: "Error",
      message: data.message || "An error occurred",
      duration: 5000,
    });
  }, [addNotification]);


  return (
    <div className="p-4 w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Volleyball Rotations Visualizer
          </h2>
        </div>
      </div>

      {/* Replace all the complex UI with VolleyballCourt component */}
      <div className="mb-4">
        <VolleyballCourt
          config={volleyballCourtConfig}
          readOnly={isReadOnly}
          onSystemChange={handleSystemChange}
          onRotationChange={handleRotationChange}
          onFormationChange={handleFormationChange}
          onPositionChange={handlePositionChange}
          onViolation={handleViolation}
          onShare={handleShare}
          onError={handleError}
        />
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

      {/* Browser Compatibility Warning */}
      <BrowserCompatibilityWarning />
    </div>
  );
}
