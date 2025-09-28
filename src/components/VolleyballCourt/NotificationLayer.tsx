"use client";

import React, { useEffect, useRef } from "react";
import {
  NotificationProvider,
  useNotifications,
  NotificationType,
} from "./NotificationSystem";
import { ErrorData, ViolationData } from "./types";

interface NotificationLayerProps {
  children: React.ReactNode;
  errors?: ErrorData[];
  violations?: ViolationData[];
  onErrorNotification?: (error: ErrorData) => void;
  onViolationNotification?: (violations: ViolationData[]) => void;
}

// Internal component that uses the notification context
const NotificationLayerInternal: React.FC<{
  children: React.ReactNode;
  errors?: ErrorData[];
  violations?: ViolationData[];
  onErrorNotification?: (error: ErrorData) => void;
  onViolationNotification?: (violations: ViolationData[]) => void;
}> = ({
  children,
  errors = [],
  violations = [],
  onErrorNotification,
  onViolationNotification,
}) => {
  const { addNotification } = useNotifications();
  const processedErrors = useRef(new Set<string>());
  const processedViolations = useRef(new Set<string>());

  // Handle error notifications
  useEffect(() => {
    errors.forEach((error) => {
      const errorKey = `${error.type}-${error.message}`;

      if (!processedErrors.current.has(errorKey)) {
        processedErrors.current.add(errorKey);

        const notificationType: NotificationType =
          error.type === "validation"
            ? "warning"
            : error.type === "storage"
            ? "info"
            : "error";

        const title =
          error.type === "validation"
            ? "Validation Issue"
            : error.type === "storage"
            ? "Storage Issue"
            : error.type === "network"
            ? "Network Issue"
            : "System Error";

        addNotification({
          type: notificationType,
          title,
          message: error.message,
          duration: error.type === "validation" ? 8000 : 5000,
          persistent: error.type === "unknown",
          actions:
            error.type === "unknown"
              ? [
                  {
                    label: "Reload",
                    onClick: () => window.location.reload(),
                    variant: "primary",
                  },
                  {
                    label: "Dismiss",
                    onClick: () => {},
                    variant: "secondary",
                  },
                ]
              : undefined,
        });

        onErrorNotification?.(error);
      }
    });
  }, [errors, addNotification, onErrorNotification]);

  // Handle violation notifications (only for severe violations)
  useEffect(() => {
    const severeViolations = violations.filter((v) => v.severity === "error");

    if (severeViolations.length > 0) {
      const violationKey = severeViolations
        .map((v) => v.code)
        .sort()
        .join("-");

      if (!processedViolations.current.has(violationKey)) {
        processedViolations.current.add(violationKey);

        addNotification({
          type: "warning",
          title: "Rule Violations Detected",
          message: `${severeViolations.length} positioning rule${
            severeViolations.length > 1 ? "s" : ""
          } violated. Check the validation display for details.`,
          duration: 6000,
        });

        onViolationNotification?.(severeViolations);
      }
    }
  }, [violations, addNotification, onViolationNotification]);

  // Clear processed violations when violations are resolved
  useEffect(() => {
    if (violations.length === 0) {
      processedViolations.current.clear();
    }
  }, [violations]);

  // Clear processed errors when errors are resolved
  useEffect(() => {
    if (errors.length === 0) {
      processedErrors.current.clear();
    }
  }, [errors]);

  return <>{children}</>;
};

// Main NotificationLayer component that provides the notification context
export const NotificationLayer: React.FC<NotificationLayerProps> = ({
  children,
  errors,
  violations,
  onErrorNotification,
  onViolationNotification,
}) => {
  return (
    <NotificationProvider maxNotifications={3}>
      <NotificationLayerInternal
        errors={errors}
        violations={violations}
        onErrorNotification={onErrorNotification}
        onViolationNotification={onViolationNotification}
      >
        {children}
      </NotificationLayerInternal>
    </NotificationProvider>
  );
};

export default NotificationLayer;
