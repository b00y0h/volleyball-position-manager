"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
// import { ValidationDisplay } from "@/components/ValidationDisplay";
import { ValidationLayerProps, ViolationData } from "./types";
import {
  OverlapResult,
  Violation,
  ViolationCode,
} from "./volleyball-rules-engine/types/ValidationResult";
import { RotationSlot } from "./volleyball-rules-engine/types/PlayerState";

export const ValidationLayer: React.FC<ValidationLayerProps> = ({
  violations,
  showDetails,
  onDismiss,
}) => {
  // Convert ViolationData to OverlapResult format for ValidationDisplay
  const validationResult = useMemo((): OverlapResult => {
    if (violations.length === 0) {
      return {
        isLegal: true,
        violations: [],
      };
    }

    // Convert ViolationData to Violation format
    const convertedViolations: Violation[] = violations.map((violation) => ({
      code: violation.code as ViolationCode,
      message: violation.message,
      slots: violation.affectedPlayers.map((playerId) => {
        // Extract slot number from player ID if it follows a pattern like "player-1"
        const match = playerId.match(/(\d+)$/);
        return match ? (parseInt(match[1], 10) as RotationSlot) : 1;
      }),
      // Add empty coordinates since we don't have them in ViolationData
      coordinates: {},
    }));

    return {
      isLegal: false,
      violations: convertedViolations,
    };
  }, [violations]);

  // Handle violation click for highlighting or navigation
  const handleViolationClick = (violation: Violation) => {
    // Could be used to highlight affected players or navigate to them
    console.log("Violation clicked:", violation);
  };

  if (violations.length === 0) {
    return null; // Don't render anything if there are no violations
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-4 left-4 right-4 z-10"
      >
        <div className="relative">
          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="absolute -top-2 -right-2 z-20 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-lg"
              aria-label="Dismiss violations"
            >
              ×
            </button>
          )}

          {/* ValidationDisplay component - temporarily replaced with simple display */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <h3 className="text-red-800 font-medium mb-2">
              Volleyball Rule Violations ({violations.length})
            </h3>
            {violations.map((violation, index) => (
              <div key={index} className="text-red-700 text-sm mb-1">
                • {violation.message}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ValidationLayer;
