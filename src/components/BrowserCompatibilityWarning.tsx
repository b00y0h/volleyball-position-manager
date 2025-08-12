"use client";

import React, { useState } from "react";
import { useBrowserSupport } from "@/hooks/useBrowserSupport";
import { useNotifications } from "@/components/NotificationSystem";

export function BrowserCompatibilityWarning() {
  const browserSupport = useBrowserSupport();
  const { addNotification } = useNotifications();
  const [hasShownWarning, setHasShownWarning] = useState(false);

  React.useEffect(() => {
    if (!browserSupport.isLoading && !browserSupport.isSupported && !hasShownWarning) {
      setHasShownWarning(true);
      
      addNotification({
        type: "warning",
        title: "Browser Compatibility Issue",
        message: `Some features may not work properly in ${browserSupport.capabilities.browserName}`,
        persistent: true,
        actions: [
          {
            label: "Show Details",
            onClick: () => {
              addNotification({
                type: "info",
                title: "Unsupported Features",
                message: `Missing: ${browserSupport.unsupportedFeatures.join(", ")}`,
                duration: 8000,
              });
            },
            variant: "secondary",
          },
          {
            label: "Continue Anyway",
            onClick: () => {},
            variant: "primary",
          },
        ],
      });
    }

    // Show recommendations for better experience
    if (!browserSupport.isLoading && browserSupport.recommendations.length > 0 && !hasShownWarning) {
      browserSupport.recommendations.forEach((recommendation, index) => {
        setTimeout(() => {
          addNotification({
            type: "info",
            title: "Recommendation",
            message: recommendation,
            duration: 6000,
          });
        }, index * 2000); // Stagger recommendations
      });
    }
  }, [browserSupport, addNotification, hasShownWarning]);

  // Show loading state
  if (browserSupport.isLoading) {
    return (
      <div className="fixed bottom-4 left-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Checking browser compatibility...
        </div>
      </div>
    );
  }

  // Show critical compatibility issues
  if (!browserSupport.isSupported) {
    return (
      <div className="fixed bottom-4 left-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="font-medium text-red-800 dark:text-red-200">
              Limited Browser Support
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              {browserSupport.capabilities.browserName} {browserSupport.capabilities.browserVersion} may not support all features.
            </p>
            <details className="mt-2">
              <summary className="text-xs text-red-600 dark:text-red-300 cursor-pointer hover:text-red-800 dark:hover:text-red-100">
                Show missing features
              </summary>
              <ul className="text-xs text-red-600 dark:text-red-300 mt-1 ml-4 list-disc">
                {browserSupport.unsupportedFeatures.map(feature => (
                  <li key={feature}>{feature.replace(/([A-Z])/g, ' $1').toLowerCase()}</li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </div>
    );
  }

  return null;
}