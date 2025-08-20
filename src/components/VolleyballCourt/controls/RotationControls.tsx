/**
 * RotationControls component - Controls for navigating between rotations
 */

import React from "react";

export interface RotationControlsProps {
  rotationIndex: number;
  onRotationChange: (rotation: number) => void;
  isAnimating?: boolean;
  isReadOnly?: boolean;
  className?: string;
  showRotationIndicators?: boolean;
  isRotationCustomized?: (rotation: number) => boolean;
}

export const RotationControls: React.FC<RotationControlsProps> = ({
  rotationIndex,
  onRotationChange,
  isAnimating = false,
  isReadOnly = false,
  className = "",
  showRotationIndicators = true,
  isRotationCustomized = () => false,
}) => {
  const nextRotation = () => {
    if (isAnimating || isReadOnly) return;
    onRotationChange((rotationIndex + 1) % 6);
  };

  const prevRotation = () => {
    if (isAnimating || isReadOnly) return;
    onRotationChange((rotationIndex + 5) % 6);
  };

  const goToRotation = (rotation: number) => {
    if (isAnimating || isReadOnly) return;
    onRotationChange(rotation);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Previous rotation button */}
      <button
        onClick={prevRotation}
        className={`px-3 py-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 ${
          isAnimating || isReadOnly
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
        disabled={isAnimating || isReadOnly}
        title={isReadOnly ? "Disabled in read-only mode" : "Previous rotation"}
        data-testid="prev-rotation-button"
      >
        Prev Rotation
      </button>

      {/* Next rotation button */}
      <button
        onClick={nextRotation}
        className={`px-3 py-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 ${
          isAnimating || isReadOnly
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
        disabled={isAnimating || isReadOnly}
        title={isReadOnly ? "Disabled in read-only mode" : "Next rotation"}
        data-testid="next-rotation-button"
      >
        Next Rotation
      </button>

      {/* Rotation indicators */}
      {showRotationIndicators && (
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Rotations:
          </span>
          {[0, 1, 2, 3, 4, 5].map((rot) => (
            <button
              key={rot}
              onClick={() => goToRotation(rot)}
              className={`w-6 h-6 text-xs rounded-full border ${
                rot === rotationIndex
                  ? "bg-blue-500 text-white border-blue-600"
                  : isRotationCustomized(rot)
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              } ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isAnimating || isReadOnly}
              title={
                isRotationCustomized(rot)
                  ? `Rotation ${rot + 1} (Custom positions)`
                  : `Rotation ${rot + 1}`
              }
              data-testid={`rotation-indicator-${rot}`}
            >
              {rot + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
