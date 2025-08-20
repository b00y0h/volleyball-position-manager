/**
 * ReadOnlyIndicator - Shows when the court is in read-only mode from a shared URL
 */

import React from "react";

export interface ReadOnlyIndicatorProps {
  isReadOnly: boolean;
  hasURLData: boolean;
  onClearURL?: () => void;
  className?: string;
}

export const ReadOnlyIndicator: React.FC<ReadOnlyIndicatorProps> = ({
  isReadOnly,
  hasURLData,
  onClearURL,
  className = "",
}) => {
  if (!isReadOnly || !hasURLData) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm ${className}`}
      data-testid="read-only-indicator"
    >
      <svg
        className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-blue-800 dark:text-blue-200">
        Viewing shared configuration (read-only)
      </span>
      {onClearURL && (
        <button
          onClick={onClearURL}
          className="ml-auto text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
          title="Clear URL and enable editing"
        >
          Enable editing
        </button>
      )}
    </div>
  );
};
