/**
 * AnimationControls component - Controls for scripted animations
 */

import React from "react";

export interface AnimationControlsProps {
  onAnimate: () => void;
  isAnimating?: boolean;
  isReadOnly?: boolean;
  className?: string;
  animationLabel?: string;
  variant?: "primary" | "secondary";
}

export const AnimationControls: React.FC<AnimationControlsProps> = ({
  onAnimate,
  isAnimating = false,
  isReadOnly = false,
  className = "",
  animationLabel = "Animate SR→Base",
  variant = "primary",
}) => {
  const getButtonClasses = () => {
    const baseClasses =
      "px-3 py-1 rounded text-white font-medium transition-colors";

    const variantClasses = {
      primary: "bg-blue-600 hover:bg-blue-700",
      secondary: "bg-gray-600 hover:bg-gray-700",
    };

    const disabledClasses =
      isAnimating || isReadOnly
        ? "bg-gray-500 cursor-not-allowed"
        : variantClasses[variant];

    return `${baseClasses} ${disabledClasses} ${className}`;
  };

  const getButtonText = () => {
    if (isAnimating) return "Animating...";
    return animationLabel;
  };

  const getTitle = () => {
    if (isReadOnly) return "Disabled in read-only mode";
    if (isAnimating) return "Animation in progress";
    return "Play scripted animation sequence";
  };

  return (
    <button
      onClick={onAnimate}
      className={getButtonClasses()}
      disabled={isAnimating || isReadOnly}
      title={getTitle()}
      data-testid="animation-button"
    >
      {getButtonText()}
    </button>
  );
};
