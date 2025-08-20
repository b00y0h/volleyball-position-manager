/**
 * ShareButton component - Button for generating and sharing URLs
 */

import React, { useState, useCallback } from "react";

export interface ShareButtonProps {
  onShare: () => void;
  isAnimating?: boolean;
  className?: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  onShare,
  isAnimating = false,
  className = "",
  variant = "primary",
  size = "md",
}) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (isAnimating || isSharing) return;

    setIsSharing(true);
    try {
      await onShare();
    } catch (error) {
      console.error("Share failed:", error);
    } finally {
      setIsSharing(false);
    }
  }, [onShare, isAnimating, isSharing]);

  const getButtonClasses = () => {
    const baseClasses =
      "rounded font-medium transition-colors flex items-center gap-2";

    const sizeClasses = {
      sm: "px-2 py-1 text-sm",
      md: "px-3 py-1",
      lg: "px-4 py-2 text-lg",
    };

    const variantClasses = {
      primary: "bg-green-600 text-white hover:bg-green-700",
      secondary:
        "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600",
    };

    const disabledClasses =
      isAnimating || isSharing ? "opacity-50 cursor-not-allowed" : "";

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`;
  };

  return (
    <button
      onClick={handleShare}
      className={getButtonClasses()}
      disabled={isAnimating || isSharing}
      title={
        isAnimating
          ? "Please wait for animation to complete"
          : isSharing
          ? "Generating share URL..."
          : "Share current configuration"
      }
      data-testid="share-button"
    >
      {isSharing ? (
        <>
          <svg
            className="w-4 h-4 animate-spin"
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
          Sharing...
        </>
      ) : (
        <>
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
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
            />
          </svg>
          Share
        </>
      )}
    </button>
  );
};
