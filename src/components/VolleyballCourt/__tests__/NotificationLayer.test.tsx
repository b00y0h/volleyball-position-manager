import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationLayer } from "../NotificationLayer";
import { ErrorData, ViolationData } from "../types";

// Mock the NotificationSystem components
const mockAddNotification = vi.fn();
const mockRemoveNotification = vi.fn();
const mockClearAll = vi.fn();

vi.mock("@/components/NotificationSystem", () => ({
  NotificationProvider: ({ children }: any) => (
    <div data-testid="notification-provider">{children}</div>
  ),
  useNotifications: () => ({
    notifications: [],
    addNotification: mockAddNotification,
    removeNotification: mockRemoveNotification,
    clearAll: mockClearAll,
  }),
}));

describe("NotificationLayer", () => {
  const mockOnErrorNotification = vi.fn();
  const mockOnViolationNotification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleErrors: ErrorData[] = [
    {
      type: "validation",
      message: "Position validation failed",
      details: { code: "INVALID_POSITION" },
    },
    {
      type: "storage",
      message: "Unable to save to localStorage",
      details: null,
    },
  ];

  const sampleViolations: ViolationData[] = [
    {
      code: "ROW_ORDER",
      message: "Front row order violation",
      affectedPlayers: ["player-1", "player-2"],
      severity: "error",
    },
    {
      code: "OVERLAP",
      message: "Player overlap detected",
      affectedPlayers: ["player-3"],
      severity: "warning",
    },
  ];

  it("renders children within NotificationProvider", () => {
    render(
      <NotificationLayer>
        <div>Test content</div>
      </NotificationLayer>
    );

    expect(screen.getByTestId("notification-provider")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("creates error notifications for each error", async () => {
    render(
      <NotificationLayer errors={sampleErrors}>
        <div>Test content</div>
      </NotificationLayer>
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledTimes(2);
    });

    // Check validation error notification
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: "warning",
      title: "Validation Issue",
      message: "Position validation failed",
      duration: 8000,
      persistent: false,
      actions: undefined,
    });

    // Check storage error notification
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: "info",
      title: "Storage Issue",
      message: "Unable to save to localStorage",
      duration: 5000,
      persistent: false,
      actions: undefined,
    });
  });

  it("creates notifications for severe violations only", async () => {
    render(
      <NotificationLayer violations={sampleViolations}>
        <div>Test content</div>
      </NotificationLayer>
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledTimes(1);
    });

    expect(mockAddNotification).toHaveBeenCalledWith({
      type: "warning",
      title: "Rule Violations Detected",
      message:
        "1 positioning rule violated. Check the validation display for details.",
      duration: 6000,
    });
  });

  it("handles multiple severe violations", async () => {
    const multipleErrorViolations: ViolationData[] = [
      {
        code: "ROW_ORDER",
        message: "Front row order violation",
        affectedPlayers: ["player-1"],
        severity: "error",
      },
      {
        code: "FRONT_BACK",
        message: "Front-back positioning violation",
        affectedPlayers: ["player-2"],
        severity: "error",
      },
    ];

    render(
      <NotificationLayer violations={multipleErrorViolations}>
        <div>Test content</div>
      </NotificationLayer>
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: "warning",
        title: "Rule Violations Detected",
        message:
          "2 positioning rules violated. Check the validation display for details.",
        duration: 6000,
      });
    });
  });

  it("ignores warning-level violations for notifications", async () => {
    const warningViolations: ViolationData[] = [
      {
        code: "MINOR_ISSUE",
        message: "Minor positioning issue",
        affectedPlayers: ["player-1"],
        severity: "warning",
      },
    ];

    render(
      <NotificationLayer violations={warningViolations}>
        <div>Test content</div>
      </NotificationLayer>
    );

    // Should not create any notifications for warning-level violations
    await waitFor(() => {
      expect(mockAddNotification).not.toHaveBeenCalled();
    });
  });

  it("calls error notification callback", async () => {
    render(
      <NotificationLayer
        errors={sampleErrors}
        onErrorNotification={mockOnErrorNotification}
      >
        <div>Test content</div>
      </NotificationLayer>
    );

    await waitFor(() => {
      expect(mockOnErrorNotification).toHaveBeenCalledTimes(2);
      expect(mockOnErrorNotification).toHaveBeenCalledWith(sampleErrors[0]);
      expect(mockOnErrorNotification).toHaveBeenCalledWith(sampleErrors[1]);
    });
  });

  it("calls violation notification callback", async () => {
    render(
      <NotificationLayer
        violations={sampleViolations}
        onViolationNotification={mockOnViolationNotification}
      >
        <div>Test content</div>
      </NotificationLayer>
    );

    await waitFor(() => {
      expect(mockOnViolationNotification).toHaveBeenCalledWith([
        {
          code: "ROW_ORDER",
          message: "Front row order violation",
          affectedPlayers: ["player-1", "player-2"],
          severity: "error",
        },
      ]);
    });
  });

  it("prevents duplicate error notifications", async () => {
    const { rerender } = render(
      <NotificationLayer errors={sampleErrors}>
        <div>Test content</div>
      </NotificationLayer>
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledTimes(2);
    });

    // Re-render with same errors
    rerender(
      <NotificationLayer errors={sampleErrors}>
        <div>Test content</div>
      </NotificationLayer>
    );

    // Should not create duplicate notifications
    expect(mockAddNotification).toHaveBeenCalledTimes(2);
  });

  it("prevents duplicate violation notifications", async () => {
    const { rerender } = render(
      <NotificationLayer violations={sampleViolations}>
        <div>Test content</div>
      </NotificationLayer>
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledTimes(1);
    });

    // Re-render with same violations
    rerender(
      <NotificationLayer violations={sampleViolations}>
        <div>Test content</div>
      </NotificationLayer>
    );

    // Should not create duplicate notifications
    expect(mockAddNotification).toHaveBeenCalledTimes(1);
  });

  it("handles unknown error type with persistent notification", async () => {
    const unknownError: ErrorData[] = [
      {
        type: "unknown",
        message: "Unknown system error",
        details: null,
      },
    ];

    render(
      <NotificationLayer errors={unknownError}>
        <div>Test content</div>
      </NotificationLayer>
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: "error",
        title: "System Error",
        message: "Unknown system error",
        duration: 5000,
        persistent: true,
        actions: [
          {
            label: "Reload",
            onClick: expect.any(Function),
            variant: "primary",
          },
          {
            label: "Dismiss",
            onClick: expect.any(Function),
            variant: "secondary",
          },
        ],
      });
    });
  });

  it("handles network error type", async () => {
    const networkError: ErrorData[] = [
      {
        type: "network",
        message: "Network connection failed",
        details: null,
      },
    ];

    render(
      <NotificationLayer errors={networkError}>
        <div>Test content</div>
      </NotificationLayer>
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: "error",
        title: "Network Issue",
        message: "Network connection failed",
        duration: 5000,
        persistent: false,
        actions: undefined,
      });
    });
  });

  it("clears processed violations when violations are resolved", async () => {
    const { rerender } = render(
      <NotificationLayer violations={sampleViolations}>
        <div>Test content</div>
      </NotificationLayer>
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledTimes(1);
    });

    // Clear violations
    rerender(
      <NotificationLayer violations={[]}>
        <div>Test content</div>
      </NotificationLayer>
    );

    // Add same violations again - should create new notification
    rerender(
      <NotificationLayer violations={sampleViolations}>
        <div>Test content</div>
      </NotificationLayer>
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledTimes(2);
    });
  });

  it("clears processed errors when errors are resolved", async () => {
    const { rerender } = render(
      <NotificationLayer errors={sampleErrors}>
        <div>Test content</div>
      </NotificationLayer>
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledTimes(2);
    });

    // Clear errors
    rerender(
      <NotificationLayer errors={[]}>
        <div>Test content</div>
      </NotificationLayer>
    );

    // Add same errors again - should create new notifications
    rerender(
      <NotificationLayer errors={sampleErrors}>
        <div>Test content</div>
      </NotificationLayer>
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledTimes(4);
    });
  });

  it("handles empty arrays gracefully", () => {
    render(
      <NotificationLayer errors={[]} violations={[]}>
        <div>Test content</div>
      </NotificationLayer>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  it("handles undefined props gracefully", () => {
    render(
      <NotificationLayer>
        <div>Test content</div>
      </NotificationLayer>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
    expect(mockAddNotification).not.toHaveBeenCalled();
  });
});
