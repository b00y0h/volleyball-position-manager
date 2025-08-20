"use client";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  OverlapResult,
  Violation,
} from "@/volleyball-rules-engine/types/ValidationResult";

interface ValidationDisplayProps {
  validationResult: OverlapResult;
  onViolationClick?: (violation: Violation) => void;
  showDetails?: boolean;
  className?: string;
}

interface ViolationItemProps {
  violation: Violation;
  index: number;
  onClick?: (violation: Violation) => void;
  showDetails: boolean;
}

function ViolationItem({
  violation,
  index,
  onClick,
  showDetails,
}: ViolationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getViolationIcon = (code: string) => {
    switch (code) {
      case "ROW_ORDER":
        return "↔️";
      case "FRONT_BACK":
        return "↕️";
      case "MULTIPLE_SERVERS":
        return "🏐";
      case "INVALID_LINEUP":
        return "⚠️";
      default:
        return "❌";
    }
  };

  const getViolationColor = (code: string) => {
    switch (code) {
      case "ROW_ORDER":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "FRONT_BACK":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "MULTIPLE_SERVERS":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "INVALID_LINEUP":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.1 }}
      className={`border rounded-lg p-3 ${getViolationColor(violation.code)}`}
    >
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => {
          if (showDetails) {
            setIsExpanded(!isExpanded);
          }
          onClick?.(violation);
        }}
      >
        <div className="flex items-start space-x-2 flex-1">
          <span className="text-lg" role="img" aria-label={violation.code}>
            {getViolationIcon(violation.code)}
          </span>
          <div className="flex-1">
            <p className="font-medium text-sm">{violation.message}</p>
            {violation.slots.length > 0 && (
              <p className="text-xs opacity-75 mt-1">
                Affected slots: {violation.slots.join(", ")}
              </p>
            )}
          </div>
        </div>
        {showDetails && (
          <button
            className="ml-2 text-xs opacity-60 hover:opacity-100 transition-opacity"
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && showDetails && violation.coordinates && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-current border-opacity-20"
          >
            <h4 className="text-xs font-semibold mb-2">Player Coordinates:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(violation.coordinates).map(([slot, coords]) => (
                <div key={slot} className="flex justify-between">
                  <span>Slot {slot}:</span>
                  <span>
                    ({coords.x.toFixed(1)}, {coords.y.toFixed(1)})
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ValidationDisplay({
  validationResult,
  onViolationClick,
  showDetails = false,
  className = "",
}: ValidationDisplayProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const summary = useMemo(() => {
    const violationsByType = validationResult.violations.reduce(
      (acc, violation) => {
        acc[violation.code] = (acc[violation.code] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const affectedSlots = new Set<number>();
    validationResult.violations.forEach((violation) => {
      violation.slots.forEach((slot) => affectedSlots.add(slot));
    });

    return {
      totalViolations: validationResult.violations.length,
      violationsByType,
      affectedSlots: Array.from(affectedSlots).sort(),
    };
  }, [validationResult.violations]);

  if (validationResult.isLegal) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center space-x-2">
          <span
            className="text-green-600 text-xl"
            role="img"
            aria-label="Valid"
          >
            ✅
          </span>
          <div>
            <h3 className="text-green-800 font-semibold">Formation Valid</h3>
            <p className="text-green-600 text-sm">
              All players are positioned according to volleyball rules.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-red-50 border border-red-200 rounded-lg ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-red-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className="text-red-600 text-xl"
              role="img"
              aria-label="Invalid"
            >
              ❌
            </span>
            <div>
              <h3 className="text-red-800 font-semibold">
                Formation Invalid ({summary.totalViolations} violation
                {summary.totalViolations !== 1 ? "s" : ""})
              </h3>
              <p className="text-red-600 text-sm">
                {summary.affectedSlots.length > 0 && (
                  <>Affecting slots: {summary.affectedSlots.join(", ")}</>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-red-600 hover:text-red-800 transition-colors p-1"
            aria-label={
              isCollapsed ? "Expand violations" : "Collapse violations"
            }
          >
            {isCollapsed ? "▼" : "▲"}
          </button>
        </div>

        {/* Summary */}
        {Object.keys(summary.violationsByType).length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(summary.violationsByType).map(([type, count]) => (
              <span
                key={type}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700"
              >
                {type.replace("_", " ")}: {count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Violations List */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4"
          >
            <div className="space-y-3">
              <AnimatePresence>
                {validationResult.violations.map((violation, index) => (
                  <ViolationItem
                    key={`${violation.code}-${index}`}
                    violation={violation}
                    index={index}
                    onClick={onViolationClick}
                    showDetails={showDetails}
                  />
                ))}
              </AnimatePresence>
            </div>

            {showDetails && (
              <div className="mt-4 pt-4 border-t border-red-200">
                <h4 className="text-sm font-semibold text-red-800 mb-2">
                  Volleyball Rules Reference:
                </h4>
                <ul className="text-xs text-red-600 space-y-1">
                  <li>
                    • Front row players (LF, MF, RF) must maintain left-to-right
                    order
                  </li>
                  <li>
                    • Back row players (LB, MB, RB) must maintain left-to-right
                    order
                  </li>
                  <li>
                    • Front row players must be positioned in front of their
                    back row counterparts
                  </li>
                  <li>• Only one player may serve at a time</li>
                  <li>
                    • Server is exempt from overlap rules while in service zone
                  </li>
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ValidationDisplay;
