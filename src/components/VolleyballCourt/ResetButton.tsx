"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SystemType, FormationType } from "./types";
import { useNotifications } from "../NotificationSystem";

export interface ResetOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  destructive?: boolean;
  requiresConfirmation?: boolean;
  shortcut?: string;
}

interface ResetResult {
  success: boolean;
  affectedPositions: number;
  error?: string;
}

interface ResetButtonProps {
  system: SystemType;
  rotation: number;
  formation: FormationType;
  onResetCurrentRotation: () => Promise<ResetResult>;
  onResetAllRotations: () => Promise<ResetResult>;
  onResetSelectedFormation: () => Promise<ResetResult>;
  onResetSystem: () => Promise<ResetResult>;
  isDisabled?: boolean;
  hasCustomizations: {
    currentRotation: boolean;
    allRotations: boolean;
    currentFormation: boolean;
    system: boolean;
  };
  className?: string;
  // Undo/Redo capabilities
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => Promise<boolean>;
  onRedo?: () => Promise<boolean>;
  // Preview functionality
  onShowPreview?: (
    operation: "current" | "all" | "formation" | "system",
    affectedPositions: string[]
  ) => void;
  getAffectedPositions?: (
    operation: "current" | "all" | "formation" | "system"
  ) => string[];
}

export const ResetButton: React.FC<ResetButtonProps> = ({
  system,
  rotation,
  formation,
  onResetCurrentRotation,
  onResetAllRotations,
  onResetSelectedFormation,
  onResetSystem,
  isDisabled = false,
  hasCustomizations,
  className = "",
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onShowPreview,
  getAffectedPositions,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
    destructive: boolean;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { addNotification } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isDisabled) return;

      // Ctrl+R - Reset Current Rotation
      if (
        event.ctrlKey &&
        event.key === "r" &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        handleResetCurrentRotation();
      }

      // Ctrl+Shift+R - Reset All Rotations
      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key === "R" &&
        !event.altKey
      ) {
        event.preventDefault();
        handleResetAllRotations();
      }

      // Ctrl+Alt+R - Reset Formation
      if (
        event.ctrlKey &&
        event.altKey &&
        event.key === "r" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        handleResetFormation();
      }

      // Ctrl+Z - Undo
      if (
        event.ctrlKey &&
        event.key === "z" &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        handleUndo();
      }

      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if (
        (event.ctrlKey &&
          event.key === "y" &&
          !event.shiftKey &&
          !event.altKey) ||
        (event.ctrlKey && event.shiftKey && event.key === "Z" && !event.altKey)
      ) {
        event.preventDefault();
        handleRedo();
      }

      // Escape to close dropdown
      if (event.key === "Escape") {
        setIsOpen(false);
        setShowConfirmation(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDisabled]);

  const handleResetCurrentRotation = async () => {
    if (!hasCustomizations.currentRotation) {
      addNotification({
        type: "info",
        title: "No Changes to Reset",
        message: `Rotation ${rotation + 1} is already using default positions.`,
        duration: 3000,
      });
      return;
    }

    setIsOpen(false);
    try {
      const result = await onResetCurrentRotation();
      if (result.success) {
        addNotification({
          type: "success",
          title: "Rotation Reset",
          message: `Successfully reset rotation ${
            rotation + 1
          } to default positions. ${result.affectedPositions} position${
            result.affectedPositions === 1 ? "" : "s"
          } restored.`,
          duration: 4000,
        });
      } else {
        addNotification({
          type: "error",
          title: "Reset Failed",
          message:
            result.error || "Failed to reset rotation. Please try again.",
          duration: 5000,
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Reset Failed",
        message: "Failed to reset rotation. Please try again.",
        duration: 5000,
      });
    }
  };

  const handleResetAllRotations = async () => {
    if (!hasCustomizations.allRotations) {
      addNotification({
        type: "info",
        title: "No Changes to Reset",
        message: "All rotations are already using default positions.",
        duration: 3000,
      });
      return;
    }

    showConfirmationDialog(
      "Reset All Rotations",
      `This will reset all 6 rotations in the ${formation} formation to their default positions. This action cannot be undone automatically.`,
      async () => {
        try {
          const result = await onResetAllRotations();
          if (result.success) {
            addNotification({
              type: "success",
              title: "All Rotations Reset",
              message: `Successfully reset all rotations in ${formation} formation to default positions. ${
                result.affectedPositions
              } position${result.affectedPositions === 1 ? "" : "s"} restored.`,
              duration: 4000,
            });
          } else {
            addNotification({
              type: "error",
              title: "Reset Failed",
              message:
                result.error ||
                "Failed to reset all rotations. Please try again.",
              duration: 5000,
            });
          }
        } catch (error) {
          addNotification({
            type: "error",
            title: "Reset Failed",
            message: "Failed to reset all rotations. Please try again.",
            duration: 5000,
          });
        }
      },
      true
    );
  };

  const handleResetFormation = async () => {
    if (!hasCustomizations.currentFormation) {
      addNotification({
        type: "info",
        title: "No Changes to Reset",
        message: `The ${formation} formation is already using default positions.`,
        duration: 3000,
      });
      return;
    }

    showConfirmationDialog(
      "Reset Formation",
      `This will reset all positions in the ${formation} formation across all rotations to their defaults.`,
      async () => {
        try {
          const result = await onResetSelectedFormation();
          if (result.success) {
            addNotification({
              type: "success",
              title: "Formation Reset",
              message: `Successfully reset ${formation} formation to default positions. ${
                result.affectedPositions
              } position${result.affectedPositions === 1 ? "" : "s"} restored.`,
              duration: 4000,
            });
          } else {
            addNotification({
              type: "error",
              title: "Reset Failed",
              message:
                result.error || "Failed to reset formation. Please try again.",
              duration: 5000,
            });
          }
        } catch (error) {
          addNotification({
            type: "error",
            title: "Reset Failed",
            message: "Failed to reset formation. Please try again.",
            duration: 5000,
          });
        }
      },
      true
    );
  };

  const handleResetSystem = async () => {
    if (!hasCustomizations.system) {
      addNotification({
        type: "info",
        title: "No Changes to Reset",
        message: `The ${system} system is already using default positions.`,
        duration: 3000,
      });
      return;
    }

    showConfirmationDialog(
      "Reset Entire System",
      `This will reset ALL customizations in the ${system} system across all formations and rotations. This is a destructive action that cannot be undone automatically.`,
      async () => {
        try {
          const result = await onResetSystem();
          if (result.success) {
            addNotification({
              type: "success",
              title: "System Reset",
              message: `Successfully reset entire ${system} system to default positions. ${
                result.affectedPositions
              } position${result.affectedPositions === 1 ? "" : "s"} restored.`,
              duration: 4000,
            });
          } else {
            addNotification({
              type: "error",
              title: "Reset Failed",
              message:
                result.error || "Failed to reset system. Please try again.",
              duration: 5000,
            });
          }
        } catch (error) {
          addNotification({
            type: "error",
            title: "Reset Failed",
            message: "Failed to reset system. Please try again.",
            duration: 5000,
          });
        }
      },
      true
    );
  };

  const showConfirmationDialog = (
    title: string,
    message: string,
    action: () => Promise<void>,
    destructive: boolean = false
  ) => {
    setConfirmationData({ title, message, action, destructive });
    setShowConfirmation(true);
    setIsOpen(false);
  };

  const executeConfirmedAction = async () => {
    if (confirmationData) {
      await confirmationData.action();
    }
    setShowConfirmation(false);
    setConfirmationData(null);
  };

  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setConfirmationData(null);
  };

  const handleUndo = async () => {
    if (!canUndo || !onUndo) {
      addNotification({
        type: "info",
        title: "Undo Not Available",
        message: "No actions to undo.",
        duration: 2000,
      });
      return;
    }

    try {
      const success = await onUndo();
      if (success) {
        addNotification({
          type: "success",
          title: "Action Undone",
          message: "Successfully undid the last action.",
          duration: 3000,
        });
      } else {
        addNotification({
          type: "error",
          title: "Undo Failed",
          message: "Failed to undo the last action.",
          duration: 4000,
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Undo Error",
        message: "An error occurred while undoing the action.",
        duration: 4000,
      });
    }
  };

  const handleRedo = async () => {
    if (!canRedo || !onRedo) {
      addNotification({
        type: "info",
        title: "Redo Not Available",
        message: "No actions to redo.",
        duration: 2000,
      });
      return;
    }

    try {
      const success = await onRedo();
      if (success) {
        addNotification({
          type: "success",
          title: "Action Redone",
          message: "Successfully redid the last action.",
          duration: 3000,
        });
      } else {
        addNotification({
          type: "error",
          title: "Redo Failed",
          message: "Failed to redo the last action.",
          duration: 4000,
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Redo Error",
        message: "An error occurred while redoing the action.",
        duration: 4000,
      });
    }
  };

  const handleShowPreview = (
    operation: "current" | "all" | "formation" | "system"
  ) => {
    if (onShowPreview && getAffectedPositions) {
      const affectedPositions = getAffectedPositions(operation);
      onShowPreview(operation, affectedPositions);
    }
  };

  const resetOptions: ResetOption[] = [
    // Undo/Redo options (shown first if available)
    ...(canUndo
      ? [
          {
            id: "undo",
            label: "Undo Last Action",
            description: "Undo the most recent reset operation",
            shortcut: "Ctrl+Z",
            action: handleUndo,
            icon: (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            ),
          },
        ]
      : []),
    ...(canRedo
      ? [
          {
            id: "redo",
            label: "Redo Last Action",
            description: "Redo the most recently undone operation",
            shortcut: "Ctrl+Y",
            action: handleRedo,
            icon: (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6"
                />
              </svg>
            ),
          },
        ]
      : []),
    // Reset options
    {
      id: "current-rotation",
      label: "Reset Current Rotation",
      description: `Reset rotation ${rotation + 1} only`,
      shortcut: "Ctrl+R",
      action: handleResetCurrentRotation,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
    },
    {
      id: "all-rotations",
      label: "Reset All Rotations",
      description: `Reset all 6 rotations in ${formation}`,
      shortcut: "Ctrl+Shift+R",
      action: handleResetAllRotations,
      destructive: true,
      requiresConfirmation: true,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      id: "current-formation",
      label: "Reset Formation",
      description: `Reset entire ${formation} formation`,
      shortcut: "Ctrl+Alt+R",
      action: handleResetFormation,
      destructive: true,
      requiresConfirmation: true,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
    },
    {
      id: "entire-system",
      label: "Reset Entire System",
      description: `Reset all customizations in ${system} system`,
      action: handleResetSystem,
      destructive: true,
      requiresConfirmation: true,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  const availableOptions = resetOptions.filter((option) => {
    switch (option.id) {
      case "undo":
        return canUndo;
      case "redo":
        return canRedo;
      case "current-rotation":
        return hasCustomizations.currentRotation;
      case "all-rotations":
        return hasCustomizations.allRotations;
      case "current-formation":
        return hasCustomizations.currentFormation;
      case "entire-system":
        return hasCustomizations.system;
      default:
        return false;
    }
  });

  const hasAnyCustomizations = Object.values(hasCustomizations).some(Boolean);
  const hasAnyAvailableActions = hasAnyCustomizations || canUndo || canRedo;

  return (
    <>
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          disabled={isDisabled || !hasAnyAvailableActions}
          className={`
            flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
            ${
              isDisabled || !hasAnyAvailableActions
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            }
          `}
          title={
            !hasAnyAvailableActions
              ? "No actions available"
              : "Reset and undo/redo options"
          }
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reset
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
            >
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700 mb-1">
                  Reset Options
                </div>

                {availableOptions.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No actions available
                  </div>
                ) : (
                  <div className="space-y-1">
                    {availableOptions.map((option, index) => {
                      // Add separator between undo/redo and reset options
                      const isUndoRedo =
                        option.id === "undo" || option.id === "redo";
                      const nextOption = availableOptions[index + 1];
                      const nextIsReset =
                        nextOption && !["undo", "redo"].includes(nextOption.id);
                      const showSeparator = isUndoRedo && nextIsReset;

                      return (
                        <React.Fragment key={option.id}>
                          <button
                            onClick={option.action}
                            className={`
                              w-full flex items-start gap-3 px-3 py-2 text-left text-sm rounded-md transition-colors duration-150
                              ${
                                option.destructive
                                  ? "hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400"
                                  : isUndoRedo
                                  ? "hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                              }
                            `}
                          >
                            <span
                              className={`mt-0.5 ${
                                option.destructive
                                  ? "text-red-500"
                                  : isUndoRedo
                                  ? "text-blue-500"
                                  : "text-gray-400"
                              }`}
                            >
                              {option.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {option.label}
                                </span>
                                {option.shortcut && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                    {option.shortcut}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {option.description}
                              </p>
                            </div>
                          </button>
                          {showSeparator && (
                            <div className="border-t border-gray-200 dark:border-gray-600 my-2" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Use keyboard shortcuts for quick access
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmation && confirmationData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={cancelConfirmation}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      confirmationData.destructive
                        ? "bg-red-100 dark:bg-red-900/20"
                        : "bg-blue-100 dark:bg-blue-900/20"
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 ${
                        confirmationData.destructive
                          ? "text-red-600 dark:text-red-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.168 19.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {confirmationData.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {confirmationData.message}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-750 px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={cancelConfirmation}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedAction}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors duration-150 ${
                    confirmationData.destructive
                      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                  } focus:ring-2 focus:ring-opacity-50`}
                >
                  {confirmationData.destructive ? "Reset" : "Confirm"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
