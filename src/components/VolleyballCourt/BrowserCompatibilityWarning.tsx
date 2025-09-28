"use client";

import React, { useState, useEffect } from "react";

export function BrowserCompatibilityWarning() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Simple browser compatibility check
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isDesktop = !isTouchDevice;
    
    if (isDesktop) {
      setShowWarning(true);
    }
  }, []);

  if (!showWarning) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3">
      <div className="flex-shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600 dark:text-blue-400">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
          Recommendation
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-200">
          Consider using a touch-enabled device for better interaction
        </p>
      </div>
      <button
        onClick={() => setShowWarning(false)}
        className="flex-shrink-0 text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  );
}