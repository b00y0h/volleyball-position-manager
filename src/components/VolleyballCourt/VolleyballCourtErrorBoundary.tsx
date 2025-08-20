"use client";

import React, { Component, ReactNode } from "react";
import { ErrorData } from "./types";

interface VolleyballCourtErrorBoundaryState {
  hasError: boolean;
  errorType: "render" | "validation" | "storage" | "rules-engine" | "unknown";
  errorMessage: string;
  errorDetails?: unknown;
}

interface VolleyballCourtErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: ErrorData) => void;
  fallbackComponent?: (error: ErrorData, resetError: () => void) => ReactNode;
  courtDimensions?: { width: number; height: number };
}

export class VolleyballCourtErrorBoundary extends Component<
  VolleyballCourtErrorBoundaryProps,
  VolleyballCourtErrorBoundaryState
> {
  constructor(props: VolleyballCourtErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorType: "unknown",
      errorMessage: "",
      errorDetails: null,
    };
  }

  static getDerivedStateFromError(
    error: Error
  ): VolleyballCourtErrorBoundaryState {
    // Categorize error based on error message or stack trace
    let errorType: VolleyballCourtErrorBoundaryState["errorType"] = "unknown";

    if (
      error.message.includes("validation") ||
      error.message.includes("rules")
    ) {
      errorType = "validation";
    } else if (
      error.message.includes("storage") ||
      error.message.includes("localStorage")
    ) {
      errorType = "storage";
    } else if (
      error.message.includes("VolleyballRulesEngine") ||
      error.stack?.includes("volleyball-rules-engine")
    ) {
      errorType = "rules-engine";
    } else if (
      error.message.includes("render") ||
      error.stack?.includes("render")
    ) {
      errorType = "render";
    }

    return {
      hasError: true,
      errorType,
      errorMessage: error.message,
      errorDetails: error.stack,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "VolleyballCourtErrorBoundary caught an error:",
      error,
      errorInfo
    );

    // Categorize error for callback (same logic as getDerivedStateFromError)
    let errorType: "validation" | "storage" | "network" | "unknown" = "unknown";

    if (
      error.message.includes("validation") ||
      error.message.includes("rules")
    ) {
      errorType = "validation";
    } else if (
      error.message.includes("storage") ||
      error.message.includes("localStorage")
    ) {
      errorType = "storage";
    }

    // Create error data for callback
    const errorData: ErrorData = {
      type: errorType,
      message: error.message,
      details: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    };

    // Call optional error callback
    this.props.onError?.(errorData);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      errorType: "unknown",
      errorMessage: "",
      errorDetails: null,
    });
  };

  getErrorRecoveryStrategy() {
    switch (this.state.errorType) {
      case "validation":
        return {
          title: "Validation Error",
          description:
            "There was an issue with position validation. The court will continue to work with basic functionality.",
          actions: [
            {
              label: "Continue with Basic Mode",
              action: this.resetError,
              primary: true,
            },
            {
              label: "Reload Page",
              action: () => window.location.reload(),
              primary: false,
            },
          ],
        };

      case "storage":
        return {
          title: "Storage Error",
          description:
            "Unable to save or load positions. Your changes may not be persisted.",
          actions: [
            {
              label: "Continue without Saving",
              action: this.resetError,
              primary: true,
            },
            {
              label: "Reload Page",
              action: () => window.location.reload(),
              primary: false,
            },
          ],
        };

      case "rules-engine":
        return {
          title: "Rules Engine Error",
          description:
            "The volleyball rules validation system encountered an error. Basic positioning will still work.",
          actions: [
            {
              label: "Continue without Rules",
              action: this.resetError,
              primary: true,
            },
            {
              label: "Reload Page",
              action: () => window.location.reload(),
              primary: false,
            },
          ],
        };

      case "render":
        return {
          title: "Rendering Error",
          description:
            "There was an issue rendering the volleyball court component.",
          actions: [
            { label: "Try Again", action: this.resetError, primary: true },
            {
              label: "Reload Page",
              action: () => window.location.reload(),
              primary: false,
            },
          ],
        };

      default:
        return {
          title: "Unexpected Error",
          description:
            "An unexpected error occurred in the volleyball court component.",
          actions: [
            { label: "Try Again", action: this.resetError, primary: true },
            {
              label: "Reload Page",
              action: () => window.location.reload(),
              primary: false,
            },
          ],
        };
    }
  }

  renderFallbackUI() {
    const { courtDimensions } = this.props;
    const recovery = this.getErrorRecoveryStrategy();

    // Use custom fallback if provided
    if (this.props.fallbackComponent) {
      const errorData: ErrorData = {
        type:
          this.state.errorType === "validation"
            ? "validation"
            : this.state.errorType === "storage"
            ? "storage"
            : "unknown",
        message: this.state.errorMessage,
        details: this.state.errorDetails,
      };
      return this.props.fallbackComponent(errorData, this.resetError);
    }

    // Default fallback UI with court-like dimensions
    const fallbackStyle: React.CSSProperties = {
      width: courtDimensions?.width || 600,
      height: courtDimensions?.height || 360,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fef2f2",
      border: "2px solid #fecaca",
      borderRadius: "8px",
      padding: "20px",
      position: "relative",
    };

    return (
      <div style={fallbackStyle} className="volleyball-court-error">
        {/* Error Icon */}
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Error Title */}
        <h3 className="text-lg font-semibold text-red-700 mb-2 text-center">
          {recovery.title}
        </h3>

        {/* Error Description */}
        <p className="text-sm text-red-600 text-center mb-6 max-w-md">
          {recovery.description}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          {recovery.actions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                action.primary
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <details className="w-full max-w-md">
            <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800 mb-2">
              Show Technical Details
            </summary>
            <div className="bg-red-100 p-3 rounded text-xs text-red-800 overflow-auto max-h-32">
              <div className="font-medium mb-1">
                Error Type: {this.state.errorType}
              </div>
              <div className="mb-2">Message: {this.state.errorMessage}</div>
              {this.state.errorDetails && (
                <pre className="whitespace-pre-wrap text-xs">
                  {typeof this.state.errorDetails === "string"
                    ? this.state.errorDetails
                    : JSON.stringify(this.state.errorDetails, null, 2)}
                </pre>
              )}
            </div>
          </details>
        )}

        {/* Court outline to maintain visual context */}
        <div className="absolute inset-4 border-2 border-red-300 border-dashed rounded opacity-30 pointer-events-none" />
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderFallbackUI();
    }

    return this.props.children;
  }
}

export default VolleyballCourtErrorBoundary;
