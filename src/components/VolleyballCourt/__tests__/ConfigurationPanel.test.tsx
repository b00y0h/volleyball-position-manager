/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigurationPanel } from "../ConfigurationPanel";
import { VolleyballCourtConfig } from "../types";

describe("ConfigurationPanel", () => {
  const mockOnChange = vi.fn();
  const mockOnClose = vi.fn();

  const defaultConfig: VolleyballCourtConfig = {
    initialSystem: "5-1",
    initialRotation: 0,
    initialFormation: "base",
    players: {
      "5-1": [
        { id: "S", name: "Setter", role: "S", number: 1 },
        { id: "Opp", name: "Opposite", role: "Opp", number: 2 },
        { id: "OH1", name: "Outside 1", role: "OH", number: 3 },
        { id: "OH2", name: "Outside 2", role: "OH", number: 4 },
        { id: "MB1", name: "Middle 1", role: "MB", number: 5 },
        { id: "MB2", name: "Middle 2", role: "MB", number: 6 },
      ],
      "6-2": [
        { id: "S1", name: "Setter 1", role: "S", number: 1 },
        { id: "S2", name: "Setter 2", role: "S", number: 2 },
        { id: "OH1", name: "Outside 1", role: "OH", number: 3 },
        { id: "OH2", name: "Outside 2", role: "OH", number: 4 },
        { id: "MB1", name: "Middle 1", role: "MB", number: 5 },
        { id: "MB2", name: "Middle 2", role: "MB", number: 6 },
      ],
    },
    appearance: {
      theme: "light",
      courtColor: "#2563eb",
      showPlayerNames: true,
    },
    validation: {
      enableRealTimeValidation: true,
      showConstraintBoundaries: true,
    },
    animation: {
      enableAnimations: true,
      animationDuration: 300,
    },
    controls: {
      showSystemSelector: true,
      showRotationControls: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render configuration panel with all tabs", () => {
    render(
      <ConfigurationPanel
        config={defaultConfig}
        onChange={mockOnChange}
      />
    );

    expect(
      screen.getByText("Volleyball Court Configuration")
    ).toBeInTheDocument();
    expect(screen.getByText("Players")).toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByText("Validation")).toBeInTheDocument();
    expect(screen.getByText("Animation")).toBeInTheDocument();
    expect(screen.getByText("Controls")).toBeInTheDocument();
    expect(screen.getByText("Advanced")).toBeInTheDocument();
  });

  it("should render close button when onClose is provided", () => {
    render(
      <ConfigurationPanel
        config={defaultConfig}
        onChange={mockOnChange}
      />
    );

    const closeButton = screen.getByText("✕");
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it("should not render close button when onClose is not provided", () => {
    render(
      <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
    );

    expect(screen.queryByText("✕")).not.toBeInTheDocument();
  });

  it("should display validation errors and warnings", () => {
    const invalidConfig: VolleyballCourtConfig = {
      players: {
        "5-1": [
          { id: "S", name: "Setter", role: "S" },
          { id: "S", name: "Duplicate", role: "S" }, // Duplicate ID
        ],
        "6-2": [],
      },
      appearance: {
        theme: "invalid" as any,
      },
    };

    render(
      <ConfigurationPanel config={invalidConfig} onChange={mockOnChange} />
    );

    expect(screen.getByText("Configuration Errors:")).toBeInTheDocument();
    expect(screen.getByText("Configuration Warnings:")).toBeInTheDocument();
  });

  it("should render preset buttons and apply presets", async () => {
    const user = userEvent.setup();

    render(
      <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
    );

    const minimalButton = screen.getByText("Minimal");
    expect(minimalButton).toBeInTheDocument();

    await user.click(minimalButton);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        controls: expect.objectContaining({
          showSystemSelector: false,
          showRotationControls: false,
          controlsStyle: "minimal",
        }),
      })
    );
  });

  describe("Players Tab", () => {
    it("should display players for selected system", () => {
      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      // Players tab should be active by default
      expect(screen.getByDisplayValue("Setter")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Opposite")).toBeInTheDocument();
    });

    it("should allow switching between systems", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      const systemSelect = screen.getByDisplayValue("5-1 System");
      await user.selectOptions(systemSelect, "6-2");

      expect(screen.getByDisplayValue("Setter 1")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Setter 2")).toBeInTheDocument();
    });

    it("should allow updating player properties", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      const nameInput = screen.getByDisplayValue("Setter");
      await user.clear(nameInput);
      await user.type(nameInput, "New Setter Name");

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          players: expect.objectContaining({
            "5-1": expect.arrayContaining([
              expect.objectContaining({
                id: "S",
                name: "New Setter Name",
                role: "S",
              }),
            ]),
          }),
        })
      );
    });

    it("should allow adding new players", async () => {
      const user = userEvent.setup();

      const configWithFewerPlayers = {
        ...defaultConfig,
        players: {
          "5-1": [{ id: "S", name: "Setter", role: "S" as const }],
          "6-2": [],
        },
      };

      render(
        <ConfigurationPanel
          config={configWithFewerPlayers}
          onChange={mockOnChange}
        />
      );

      const addButton = screen.getByText("+ Add Player");
      await user.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          players: expect.objectContaining({
            "5-1": expect.arrayContaining([
              expect.objectContaining({ id: "S" }),
              expect.objectContaining({ id: "Player2" }),
            ]),
          }),
        })
      );
    });

    it("should disable add button when at maximum players", () => {
      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      const addButton = screen.getByText("+ Add Player");
      expect(addButton).toBeDisabled();
    });

    it("should allow removing players", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      const removeButtons = screen.getAllByText("Remove");
      await user.click(removeButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          players: expect.objectContaining({
            "5-1": expect.arrayContaining([
              expect.not.objectContaining({ id: "S" }),
            ]),
          }),
        })
      );
    });
  });

  describe("Appearance Tab", () => {
    it("should allow changing theme", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Appearance"));

      const themeSelect = screen.getByDisplayValue("Light");
      await user.selectOptions(themeSelect, "dark");

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            theme: "dark",
          }),
        })
      );
    });

    it("should allow changing court colors", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Appearance"));

      const courtColorInput = screen.getByLabelText("Court Color:");
      fireEvent.change(courtColorInput, { target: { value: "#ff0000" } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            courtColor: "#ff0000",
          }),
        })
      );
    });

    it("should allow toggling display options", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Appearance"));

      const showNamesCheckbox = screen.getByLabelText("Show Player Names");
      await user.click(showNamesCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            showPlayerNames: false,
          }),
        })
      );
    });

    it("should allow adjusting player size", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Appearance"));

      const sizeSlider = screen.getByLabelText(/Player Size:/);
      fireEvent.change(sizeSlider, { target: { value: "1.5" } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            playerSize: 1.5,
          }),
        })
      );
    });
  });

  describe("Validation Tab", () => {
    it("should allow toggling validation options", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Validation"));

      const realTimeCheckbox = screen.getByLabelText(
        "Enable Real-time Validation"
      );
      await user.click(realTimeCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          validation: expect.objectContaining({
            enableRealTimeValidation: false,
          }),
        })
      );
    });

    it("should allow adjusting snap tolerance", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Validation"));

      const toleranceSlider = screen.getByLabelText(/Snap Tolerance:/);
      fireEvent.change(toleranceSlider, { target: { value: "20" } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          validation: expect.objectContaining({
            snapTolerance: 20,
          }),
        })
      );
    });
  });

  describe("Animation Tab", () => {
    it("should allow toggling animation options", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Animation"));

      const animationsCheckbox = screen.getByLabelText("Enable Animations");
      await user.click(animationsCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          animation: expect.objectContaining({
            enableAnimations: false,
          }),
        })
      );
    });

    it("should allow adjusting animation duration", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Animation"));

      const durationSlider = screen.getByLabelText(/Animation Duration:/);
      fireEvent.change(durationSlider, { target: { value: "500" } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          animation: expect.objectContaining({
            animationDuration: 500,
          }),
        })
      );
    });
  });

  describe("Controls Tab", () => {
    it("should allow toggling control visibility", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Controls"));

      const systemSelectorCheckbox = screen.getByLabelText("System Selector");
      await user.click(systemSelectorCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          controls: expect.objectContaining({
            showSystemSelector: false,
          }),
        })
      );
    });

    it("should allow changing controls position", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Controls"));

      const positionSelect = screen.getByLabelText("Controls Position:");
      await user.selectOptions(positionSelect, "bottom");

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          controls: expect.objectContaining({
            controlsPosition: "bottom",
          }),
        })
      );
    });

    it("should allow changing controls style", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Controls"));

      const styleSelect = screen.getByLabelText("Controls Style:");
      await user.selectOptions(styleSelect, "compact");

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          controls: expect.objectContaining({
            controlsStyle: "compact",
          }),
        })
      );
    });
  });

  describe("Advanced Tab", () => {
    it("should display JSON configuration", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Advanced"));

      const textarea = screen.getByPlaceholderText(
        "Enter JSON configuration..."
      );
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue(JSON.stringify(defaultConfig, null, 2));
    });

    it("should allow updating configuration via JSON", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Advanced"));

      const textarea = screen.getByPlaceholderText(
        "Enter JSON configuration..."
      );
      const newConfig = { ...defaultConfig, initialSystem: "6-2" };

      await user.clear(textarea);
      await user.type(textarea, JSON.stringify(newConfig, null, 2));

      const applyButton = screen.getByText("Apply Configuration");
      await user.click(applyButton);

      expect(mockOnChange).toHaveBeenCalledWith(newConfig);
    });

    it("should show error for invalid JSON", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Advanced"));

      const textarea = screen.getByPlaceholderText(
        "Enter JSON configuration..."
      );
      await user.clear(textarea);
      await user.type(textarea, "invalid json");

      expect(screen.getByText(/Error:/)).toBeInTheDocument();

      const applyButton = screen.getByText("Apply Configuration");
      expect(applyButton).toBeDisabled();
    });

    it("should reset JSON to current configuration", async () => {
      const user = userEvent.setup();

      render(
        <ConfigurationPanel config={defaultConfig} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Advanced"));

      const textarea = screen.getByPlaceholderText(
        "Enter JSON configuration..."
      );
      await user.clear(textarea);
      await user.type(textarea, "invalid json");

      const resetButton = screen.getByText("Reset to Current");
      await user.click(resetButton);

      expect(textarea).toHaveValue(JSON.stringify(defaultConfig, null, 2));
      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    });
  });

  it("should apply custom CSS class", () => {
    const { container } = render(
      <ConfigurationPanel
        config={defaultConfig}
        onChange={mockOnChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("volleyball-court-config-panel");
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
