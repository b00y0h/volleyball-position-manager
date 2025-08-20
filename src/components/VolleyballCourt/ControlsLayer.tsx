/**
 * ControlsLayer component - Configurable UI controls for the volleyball court
 */

import React from "react";
import { SystemType, FormationType } from "@/types";
import { ControlsLayerProps, ResetType } from "./types";
import { SystemSelector } from "./controls/SystemSelector";
import { RotationControls } from "./controls/RotationControls";
import { FormationSelector } from "./controls/FormationSelector";
import { ShareButton } from "./controls/ShareButton";
import { AnimationControls } from "./controls/AnimationControls";
import { ResetButton } from "@/components/ResetButton";

export const ControlsLayer: React.FC<ControlsLayerProps> = ({
  system,
  rotationIndex,
  formation,
  isAnimating,
  isReadOnly,
  controlsConfig,
  onSystemChange,
  onRotationChange,
  onFormationChange,
  onReset,
  onShare,
  onAnimate,
}) => {
  const {
    showSystemSelector = true,
    showRotationControls = true,
    showFormationSelector = true,
    showResetButton = true,
    showShareButton = true,
    showAnimateButton = true,
  } = controlsConfig;

  return (
    <div className="volleyball-court-controls space-y-4">
      {/* Top controls row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Volleyball Rotations Visualizer
          </h2>
          {isReadOnly && (
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              Read-Only
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* System Selector */}
          {showSystemSelector && (
            <SystemSelector
              system={system}
              onSystemChange={onSystemChange}
              isReadOnly={isReadOnly}
            />
          )}

          {/* Rotation Controls */}
          {showRotationControls && (
            <RotationControls
              rotationIndex={rotationIndex}
              onRotationChange={onRotationChange}
              isAnimating={isAnimating}
              isReadOnly={isReadOnly}
            />
          )}

          {/* Animation Controls */}
          {showAnimateButton && (
            <AnimationControls
              onAnimate={onAnimate}
              isAnimating={isAnimating}
              isReadOnly={isReadOnly}
            />
          )}

          {/* Share Button */}
          {showShareButton && (
            <ShareButton onShare={onShare} isAnimating={isAnimating} />
          )}
        </div>
      </div>

      {/* Formation and Reset controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Formation Selector */}
        {showFormationSelector && (
          <FormationSelector
            formation={formation}
            onFormationChange={onFormationChange}
            isReadOnly={isReadOnly}
          />
        )}

        {/* Reset Button */}
        {showResetButton && !isReadOnly && (
          <div className="ml-auto">
            <ResetButton
              system={system}
              rotation={rotationIndex}
              formation={formation}
              onResetCurrentRotation={() => onReset("current")}
              onResetAllRotations={() => onReset("all")}
              onResetSelectedFormation={() => onReset("formation")}
              onResetSystem={() => onReset("system")}
              isDisabled={isAnimating}
              hasCustomizations={{
                currentRotation: false, // Will be passed from parent
                allRotations: false,
                currentFormation: false,
                system: false,
              }}
              canUndo={false} // Will be passed from parent
              canRedo={false}
              onUndo={() => {}} // Will be passed from parent
              onRedo={() => {}}
              onShowPreview={() => {}} // Will be passed from parent
              getAffectedPositions={() => []} // Will be passed from parent
            />
          </div>
        )}
      </div>
    </div>
  );
};
