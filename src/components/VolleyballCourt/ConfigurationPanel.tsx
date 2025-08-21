"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  VolleyballCourtConfig,
  PlayerDefinition,
  AppearanceConfig,
  ValidationConfig,
  AnimationConfig,
  ControlsConfig,
  PlayerColorConfig,
} from "./types";
import { SystemType, FormationType } from "@/types";
import {
  ConfigurationManager,
  PlayerCustomization,
  ThemeCustomization,
  AdvancedConfiguration,
  ConfigurationBuilder,
} from "./ConfigurationUtils";

interface ConfigurationPanelProps {
  config: VolleyballCourtConfig;
  onChange: (config: VolleyballCourtConfig) => void;
  onPresetApply?: (presetName: string) => void;
  className?: string;
}

interface ConfigurationSection {
  id: string;
  title: string;
  icon: string;
  component: React.ComponentType<any>;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  config,
  onChange,
  onPresetApply,
  className = "",
}) => {
  const [activeSection, setActiveSection] = useState<string>("general");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["general"])
  );

  // Configuration sections
  const sections: ConfigurationSection[] = [
    {
      id: "general",
      title: "General",
      icon: "⚙️",
      component: GeneralSection,
    },
    {
      id: "players",
      title: "Players",
      icon: "👥",
      component: PlayersSection,
    },
    {
      id: "appearance",
      title: "Appearance",
      icon: "🎨",
      component: AppearanceSection,
    },
    {
      id: "controls",
      title: "Controls",
      icon: "🎮",
      component: ControlsSection,
    },
    {
      id: "validation",
      title: "Validation",
      icon: "✅",
      component: ValidationSection,
    },
    {
      id: "animation",
      title: "Animation",
      icon: "🎬",
      component: AnimationSection,
    },
    {
      id: "presets",
      title: "Presets",
      icon: "📋",
      component: PresetsSection,
    },
  ];

  const handleConfigChange = useCallback(
    (updates: Partial<VolleyballCourtConfig>) => {
      const newConfig = { ...config, ...updates };
      onChange(newConfig);
    },
    [config, onChange]
  );

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  return (
    <div className={`volleyball-court-config-panel ${className}`}>
      <div className="config-panel-header">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Court Configuration
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Customize the volleyball court appearance and behavior
        </p>
      </div>

      <div className="config-panel-content">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const SectionComponent = section.component;

          return (
            <div key={section.id} className="config-section">
              <button
                className="config-section-header"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isExpanded}
              >
                <span className="config-section-icon">{section.icon}</span>
                <span className="config-section-title">{section.title}</span>
                <span
                  className={`config-section-chevron ${
                    isExpanded ? "expanded" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {isExpanded && (
                <div className="config-section-content">
                  <SectionComponent
                    config={config}
                    onChange={handleConfigChange}
                    onPresetApply={onPresetApply}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .volleyball-court-config-panel {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          max-height: 600px;
          overflow-y: auto;
        }

        .config-panel-header {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .config-section {
          margin-bottom: 8px;
          border: 1px solid #f3f4f6;
          border-radius: 6px;
          overflow: hidden;
        }

        .config-section-header {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: #f9fafb;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .config-section-header:hover {
          background: #f3f4f6;
        }

        .config-section-icon {
          margin-right: 8px;
          font-size: 16px;
        }

        .config-section-title {
          flex: 1;
          text-align: left;
          font-weight: 500;
          color: #374151;
        }

        .config-section-chevron {
          transition: transform 0.2s;
          color: #6b7280;
        }

        .config-section-chevron.expanded {
          transform: rotate(180deg);
        }

        .config-section-content {
          padding: 16px;
          background: white;
        }

        @media (prefers-color-scheme: dark) {
          .volleyball-court-config-panel {
            background: #1f2937;
            border-color: #374151;
          }

          .config-section {
            border-color: #374151;
          }

          .config-section-header {
            background: #374151;
          }

          .config-section-header:hover {
            background: #4b5563;
          }

          .config-section-title {
            color: #f9fafb;
          }

          .config-section-content {
            background: #1f2937;
          }
        }
      `}</style>
    </div>
  );
};

// General configuration section
const GeneralSection: React.FC<{
  config: VolleyballCourtConfig;
  onChange: (updates: Partial<VolleyballCourtConfig>) => void;
}> = ({ config, onChange }) => {
  return (
    <div className="config-general-section">
      <div className="config-field">
        <label className="config-label">Initial System</label>
        <select
          className="config-select"
          value={config.initialSystem || "5-1"}
          onChange={(e) =>
            onChange({ initialSystem: e.target.value as SystemType })
          }
        >
          <option value="5-1">5-1 System</option>
          <option value="6-2">6-2 System</option>
        </select>
      </div>

      <div className="config-field">
        <label className="config-label">Initial Rotation</label>
        <select
          className="config-select"
          value={config.initialRotation || 0}
          onChange={(e) =>
            onChange({ initialRotation: parseInt(e.target.value) })
          }
        >
          {[0, 1, 2, 3, 4, 5].map((rotation) => (
            <option key={rotation} value={rotation}>
              Rotation {rotation + 1}
            </option>
          ))}
        </select>
      </div>

      <div className="config-field">
        <label className="config-label">Initial Formation</label>
        <select
          className="config-select"
          value={config.initialFormation || "base"}
          onChange={(e) =>
            onChange({ initialFormation: e.target.value as FormationType })
          }
        >
          <option value="rotational">Rotational</option>
          <option value="serve-receive">Serve Receive</option>
          <option value="base">Base Attack</option>
        </select>
      </div>

      <style jsx>{`
        .config-general-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .config-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .config-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .config-select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          font-size: 14px;
        }

        .config-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        @media (prefers-color-scheme: dark) {
          .config-label {
            color: #f9fafb;
          }

          .config-select {
            background: #374151;
            border-color: #4b5563;
            color: #f9fafb;
          }
        }
      `}</style>
    </div>
  );
};

// Players configuration section
const PlayersSection: React.FC<{
  config: VolleyballCourtConfig;
  onChange: (updates: Partial<VolleyballCourtConfig>) => void;
}> = ({ config, onChange }) => {
  const [selectedSystem, setSelectedSystem] = useState<SystemType>("5-1");
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);

  const currentPlayers = config.players?.[selectedSystem] || [];

  const handlePlayerUpdate = useCallback(
    (playerId: string, updates: Partial<PlayerDefinition>) => {
      const updatedPlayers = currentPlayers.map((player) =>
        player.id === playerId ? { ...player, ...updates } : player
      );

      onChange({
        players: {
          ...config.players,
          [selectedSystem]: updatedPlayers,
        },
      });
    },
    [currentPlayers, config.players, selectedSystem, onChange]
  );

  const applyColorScheme = useCallback(
    (scheme: "role" | "position" | "custom") => {
      const updatedPlayers = PlayerCustomization.applyColorScheme(
        currentPlayers,
        scheme
      );

      onChange({
        players: {
          ...config.players,
          [selectedSystem]: updatedPlayers,
        },
      });
    },
    [currentPlayers, config.players, selectedSystem, onChange]
  );

  return (
    <div className="config-players-section">
      <div className="config-field">
        <label className="config-label">System</label>
        <select
          className="config-select"
          value={selectedSystem}
          onChange={(e) => setSelectedSystem(e.target.value as SystemType)}
        >
          <option value="5-1">5-1 System</option>
          <option value="6-2">6-2 System</option>
        </select>
      </div>

      <div className="config-field">
        <label className="config-label">Color Scheme</label>
        <div className="color-scheme-buttons">
          <button
            className="config-button"
            onClick={() => applyColorScheme("role")}
          >
            By Role
          </button>
          <button
            className="config-button"
            onClick={() => applyColorScheme("position")}
          >
            By Position
          </button>
        </div>
      </div>

      <div className="players-list">
        {currentPlayers.map((player) => (
          <div key={player.id} className="player-item">
            <div className="player-info">
              <div
                className="player-color"
                style={{ backgroundColor: player.color || "#6b7280" }}
              />
              <div className="player-details">
                <div className="player-name">{player.name}</div>
                <div className="player-role">{player.role}</div>
              </div>
              <button
                className="edit-button"
                onClick={() =>
                  setEditingPlayer(
                    editingPlayer === player.id ? null : player.id
                  )
                }
              >
                ✏️
              </button>
            </div>

            {editingPlayer === player.id && (
              <div className="player-editor">
                <div className="config-field">
                  <label className="config-label">Name</label>
                  <input
                    className="config-input"
                    type="text"
                    value={player.name}
                    onChange={(e) =>
                      handlePlayerUpdate(player.id, { name: e.target.value })
                    }
                  />
                </div>

                <div className="config-field">
                  <label className="config-label">Number</label>
                  <input
                    className="config-input"
                    type="number"
                    min="1"
                    max="99"
                    value={player.number || ""}
                    onChange={(e) =>
                      handlePlayerUpdate(player.id, {
                        number: parseInt(e.target.value) || undefined,
                      })
                    }
                  />
                </div>

                <div className="config-field">
                  <label className="config-label">Color</label>
                  <input
                    className="config-input"
                    type="color"
                    value={player.color || "#6b7280"}
                    onChange={(e) =>
                      handlePlayerUpdate(player.id, { color: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .config-players-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .color-scheme-buttons {
          display: flex;
          gap: 8px;
        }

        .config-button {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .config-button:hover {
          background: #f3f4f6;
        }

        .players-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .player-item {
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .player-info {
          display: flex;
          align-items: center;
          padding: 12px;
          gap: 12px;
        }

        .player-color {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #e5e7eb;
        }

        .player-details {
          flex: 1;
        }

        .player-name {
          font-weight: 500;
          color: #374151;
        }

        .player-role {
          font-size: 12px;
          color: #6b7280;
        }

        .edit-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
        }

        .player-editor {
          padding: 12px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .config-input {
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }

        .config-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        @media (prefers-color-scheme: dark) {
          .config-button {
            background: #374151;
            border-color: #4b5563;
            color: #f9fafb;
          }

          .config-button:hover {
            background: #4b5563;
          }

          .player-item {
            border-color: #374151;
          }

          .player-name {
            color: #f9fafb;
          }

          .player-role {
            color: #9ca3af;
          }

          .player-editor {
            background: #374151;
            border-color: #4b5563;
          }

          .config-input {
            background: #4b5563;
            border-color: #6b7280;
            color: #f9fafb;
          }
        }
      `}</style>
    </div>
  );
};

// Appearance configuration section
const AppearanceSection: React.FC<{
  config: VolleyballCourtConfig;
  onChange: (updates: Partial<VolleyballCourtConfig>) => void;
}> = ({ config, onChange }) => {
  const handleAppearanceChange = useCallback(
    (updates: Partial<AppearanceConfig>) => {
      onChange({
        appearance: {
          ...config.appearance,
          ...updates,
        },
      });
    },
    [config.appearance, onChange]
  );

  const applyColorScheme = useCallback(
    (schemeName: string) => {
      const schemes = ThemeCustomization.getColorSchemes();
      const scheme = schemes[schemeName];
      if (scheme) {
        handleAppearanceChange({ playerColors: scheme });
      }
    },
    [handleAppearanceChange]
  );

  return (
    <div className="config-appearance-section">
      <div className="config-field">
        <label className="config-label">Theme</label>
        <select
          className="config-select"
          value={config.appearance?.theme || "auto"}
          onChange={(e) =>
            handleAppearanceChange({
              theme: e.target.value as "light" | "dark" | "auto",
            })
          }
        >
          <option value="auto">Auto</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div className="config-field">
        <label className="config-label">Court Color</label>
        <input
          className="config-input"
          type="color"
          value={config.appearance?.courtColor || "#2563eb"}
          onChange={(e) =>
            handleAppearanceChange({ courtColor: e.target.value })
          }
        />
      </div>

      <div className="config-field">
        <label className="config-label">Player Size</label>
        <input
          className="config-input"
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={config.appearance?.playerSize || 1}
          onChange={(e) =>
            handleAppearanceChange({ playerSize: parseFloat(e.target.value) })
          }
        />
        <span className="range-value">
          {config.appearance?.playerSize || 1}x
        </span>
      </div>

      <div className="config-field">
        <label className="config-label">Color Schemes</label>
        <div className="color-scheme-grid">
          {Object.keys(ThemeCustomization.getColorSchemes()).map(
            (schemeName) => (
              <button
                key={schemeName}
                className="color-scheme-button"
                onClick={() => applyColorScheme(schemeName)}
              >
                {schemeName}
              </button>
            )
          )}
        </div>
      </div>

      <div className="config-checkboxes">
        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.appearance?.showPlayerNames !== false}
            onChange={(e) =>
              handleAppearanceChange({ showPlayerNames: e.target.checked })
            }
          />
          Show Player Names
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.appearance?.showPlayerNumbers || false}
            onChange={(e) =>
              handleAppearanceChange({ showPlayerNumbers: e.target.checked })
            }
          />
          Show Player Numbers
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.appearance?.showPositionLabels !== false}
            onChange={(e) =>
              handleAppearanceChange({ showPositionLabels: e.target.checked })
            }
          />
          Show Position Labels
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.appearance?.showCourtGrid || false}
            onChange={(e) =>
              handleAppearanceChange({ showCourtGrid: e.target.checked })
            }
          />
          Show Court Grid
        </label>
      </div>

      <style jsx>{`
        .config-appearance-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .range-value {
          font-size: 12px;
          color: #6b7280;
          margin-left: 8px;
        }

        .color-scheme-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 8px;
        }

        .color-scheme-button {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          font-size: 12px;
          cursor: pointer;
          text-transform: capitalize;
          transition: background-color 0.2s;
        }

        .color-scheme-button:hover {
          background: #f3f4f6;
        }

        .config-checkboxes {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .config-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
        }

        .config-checkbox input {
          margin: 0;
        }

        @media (prefers-color-scheme: dark) {
          .range-value {
            color: #9ca3af;
          }

          .color-scheme-button {
            background: #374151;
            border-color: #4b5563;
            color: #f9fafb;
          }

          .color-scheme-button:hover {
            background: #4b5563;
          }

          .config-checkbox {
            color: #f9fafb;
          }
        }
      `}</style>
    </div>
  );
};

// Controls configuration section
const ControlsSection: React.FC<{
  config: VolleyballCourtConfig;
  onChange: (updates: Partial<VolleyballCourtConfig>) => void;
}> = ({ config, onChange }) => {
  const handleControlsChange = useCallback(
    (updates: Partial<ControlsConfig>) => {
      onChange({
        controls: {
          ...config.controls,
          ...updates,
        },
      });
    },
    [config.controls, onChange]
  );

  return (
    <div className="config-controls-section">
      <div className="config-field">
        <label className="config-label">Controls Position</label>
        <select
          className="config-select"
          value={config.controls?.controlsPosition || "top"}
          onChange={(e) =>
            handleControlsChange({
              controlsPosition: e.target.value as
                | "top"
                | "bottom"
                | "left"
                | "right"
                | "overlay",
            })
          }
        >
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="overlay">Overlay</option>
        </select>
      </div>

      <div className="config-field">
        <label className="config-label">Controls Style</label>
        <select
          className="config-select"
          value={config.controls?.controlsStyle || "expanded"}
          onChange={(e) =>
            handleControlsChange({
              controlsStyle: e.target.value as
                | "compact"
                | "expanded"
                | "minimal",
            })
          }
        >
          <option value="minimal">Minimal</option>
          <option value="compact">Compact</option>
          <option value="expanded">Expanded</option>
        </select>
      </div>

      <div className="config-checkboxes">
        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.controls?.showSystemSelector !== false}
            onChange={(e) =>
              handleControlsChange({ showSystemSelector: e.target.checked })
            }
          />
          System Selector
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.controls?.showRotationControls !== false}
            onChange={(e) =>
              handleControlsChange({ showRotationControls: e.target.checked })
            }
          />
          Rotation Controls
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.controls?.showFormationSelector !== false}
            onChange={(e) =>
              handleControlsChange({ showFormationSelector: e.target.checked })
            }
          />
          Formation Selector
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.controls?.showResetButton !== false}
            onChange={(e) =>
              handleControlsChange({ showResetButton: e.target.checked })
            }
          />
          Reset Button
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.controls?.showShareButton !== false}
            onChange={(e) =>
              handleControlsChange({ showShareButton: e.target.checked })
            }
          />
          Share Button
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.controls?.showAnimateButton !== false}
            onChange={(e) =>
              handleControlsChange({ showAnimateButton: e.target.checked })
            }
          />
          Animate Button
        </label>
      </div>

      <style jsx>{`
        .config-controls-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .config-checkboxes {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .config-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
        }

        .config-checkbox input {
          margin: 0;
        }

        @media (prefers-color-scheme: dark) {
          .config-checkbox {
            color: #f9fafb;
          }
        }
      `}</style>
    </div>
  );
};

// Validation configuration section
const ValidationSection: React.FC<{
  config: VolleyballCourtConfig;
  onChange: (updates: Partial<VolleyballCourtConfig>) => void;
}> = ({ config, onChange }) => {
  const handleValidationChange = useCallback(
    (updates: Partial<ValidationConfig>) => {
      onChange({
        validation: {
          ...config.validation,
          ...updates,
        },
      });
    },
    [config.validation, onChange]
  );

  return (
    <div className="config-validation-section">
      <div className="config-checkboxes">
        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.validation?.enableRealTimeValidation !== false}
            onChange={(e) =>
              handleValidationChange({
                enableRealTimeValidation: e.target.checked,
              })
            }
          />
          Real-time Validation
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.validation?.showConstraintBoundaries !== false}
            onChange={(e) =>
              handleValidationChange({
                showConstraintBoundaries: e.target.checked,
              })
            }
          />
          Show Constraint Boundaries
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.validation?.enablePositionSnapping !== false}
            onChange={(e) =>
              handleValidationChange({
                enablePositionSnapping: e.target.checked,
              })
            }
          />
          Position Snapping
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.validation?.showViolationDetails !== false}
            onChange={(e) =>
              handleValidationChange({ showViolationDetails: e.target.checked })
            }
          />
          Show Violation Details
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.validation?.enableEducationalMessages !== false}
            onChange={(e) =>
              handleValidationChange({
                enableEducationalMessages: e.target.checked,
              })
            }
          />
          Educational Messages
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.validation?.strictMode || false}
            onChange={(e) =>
              handleValidationChange({ strictMode: e.target.checked })
            }
          />
          Strict Mode
        </label>
      </div>

      <div className="config-field">
        <label className="config-label">Snap Tolerance</label>
        <input
          className="config-input"
          type="range"
          min="5"
          max="50"
          value={config.validation?.snapTolerance || 10}
          onChange={(e) =>
            handleValidationChange({ snapTolerance: parseInt(e.target.value) })
          }
        />
        <span className="range-value">
          {config.validation?.snapTolerance || 10}px
        </span>
      </div>

      <style jsx>{`
        .config-validation-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .config-checkboxes {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .config-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
        }

        .config-checkbox input {
          margin: 0;
        }

        .range-value {
          font-size: 12px;
          color: #6b7280;
          margin-left: 8px;
        }

        @media (prefers-color-scheme: dark) {
          .config-checkbox {
            color: #f9fafb;
          }

          .range-value {
            color: #9ca3af;
          }
        }
      `}</style>
    </div>
  );
};

// Animation configuration section
const AnimationSection: React.FC<{
  config: VolleyballCourtConfig;
  onChange: (updates: Partial<VolleyballCourtConfig>) => void;
}> = ({ config, onChange }) => {
  const handleAnimationChange = useCallback(
    (updates: Partial<AnimationConfig>) => {
      onChange({
        animation: {
          ...config.animation,
          ...updates,
        },
      });
    },
    [config.animation, onChange]
  );

  return (
    <div className="config-animation-section">
      <div className="config-checkboxes">
        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.animation?.enableAnimations !== false}
            onChange={(e) =>
              handleAnimationChange({ enableAnimations: e.target.checked })
            }
          />
          Enable Animations
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.animation?.enableDragAnimations !== false}
            onChange={(e) =>
              handleAnimationChange({ enableDragAnimations: e.target.checked })
            }
          />
          Drag Animations
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.animation?.enableFormationTransitions !== false}
            onChange={(e) =>
              handleAnimationChange({
                enableFormationTransitions: e.target.checked,
              })
            }
          />
          Formation Transitions
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.animation?.enableRotationAnimations !== false}
            onChange={(e) =>
              handleAnimationChange({
                enableRotationAnimations: e.target.checked,
              })
            }
          />
          Rotation Animations
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.animation?.bounceOnViolation !== false}
            onChange={(e) =>
              handleAnimationChange({ bounceOnViolation: e.target.checked })
            }
          />
          Bounce on Violation
        </label>

        <label className="config-checkbox">
          <input
            type="checkbox"
            checked={config.animation?.highlightOnHover !== false}
            onChange={(e) =>
              handleAnimationChange({ highlightOnHover: e.target.checked })
            }
          />
          Highlight on Hover
        </label>
      </div>

      <div className="config-field">
        <label className="config-label">Animation Duration</label>
        <input
          className="config-input"
          type="range"
          min="100"
          max="1000"
          step="50"
          value={config.animation?.animationDuration || 300}
          onChange={(e) =>
            handleAnimationChange({
              animationDuration: parseInt(e.target.value),
            })
          }
        />
        <span className="range-value">
          {config.animation?.animationDuration || 300}ms
        </span>
      </div>

      <div className="config-field">
        <label className="config-label">Stagger Delay</label>
        <input
          className="config-input"
          type="range"
          min="0"
          max="200"
          step="10"
          value={config.animation?.staggerDelay || 50}
          onChange={(e) =>
            handleAnimationChange({ staggerDelay: parseInt(e.target.value) })
          }
        />
        <span className="range-value">
          {config.animation?.staggerDelay || 50}ms
        </span>
      </div>

      <style jsx>{`
        .config-animation-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .config-checkboxes {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .config-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
        }

        .config-checkbox input {
          margin: 0;
        }

        .range-value {
          font-size: 12px;
          color: #6b7280;
          margin-left: 8px;
        }

        @media (prefers-color-scheme: dark) {
          .config-checkbox {
            color: #f9fafb;
          }

          .range-value {
            color: #9ca3af;
          }
        }
      `}</style>
    </div>
  );
};

// Presets configuration section
const PresetsSection: React.FC<{
  config: VolleyballCourtConfig;
  onChange: (updates: Partial<VolleyballCourtConfig>) => void;
  onPresetApply?: (presetName: string) => void;
}> = ({ config, onChange, onPresetApply }) => {
  const presets = useMemo(
    () => ConfigurationManager.getConfigurationPresets(),
    []
  );

  const handlePresetApply = useCallback(
    (presetName: string) => {
      const preset = presets[presetName];
      if (preset) {
        onChange(preset);
        onPresetApply?.(presetName);
      }
    },
    [presets, onChange, onPresetApply]
  );

  return (
    <div className="config-presets-section">
      <p className="presets-description">
        Apply predefined configurations for common use cases
      </p>

      <div className="presets-grid">
        {Object.entries(presets).map(([presetName, preset]) => (
          <div key={presetName} className="preset-card">
            <h4 className="preset-title">{presetName}</h4>
            <p className="preset-description">
              {getPresetDescription(presetName)}
            </p>
            <button
              className="preset-button"
              onClick={() => handlePresetApply(presetName)}
            >
              Apply
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .config-presets-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .presets-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .presets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .preset-card {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          background: white;
        }

        .preset-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 4px 0;
          text-transform: capitalize;
        }

        .preset-description {
          font-size: 12px;
          color: #6b7280;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }

        .preset-button {
          width: 100%;
          padding: 6px 12px;
          border: 1px solid #3b82f6;
          border-radius: 4px;
          background: #3b82f6;
          color: white;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .preset-button:hover {
          background: #2563eb;
        }

        @media (prefers-color-scheme: dark) {
          .presets-description {
            color: #9ca3af;
          }

          .preset-card {
            background: #374151;
            border-color: #4b5563;
          }

          .preset-title {
            color: #f9fafb;
          }

          .preset-description {
            color: #9ca3af;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to get preset descriptions
function getPresetDescription(presetName: string): string {
  const descriptions: Record<string, string> = {
    minimal: "Clean, simple interface for embedding",
    educational: "Full validation and educational features",
    presentation: "Optimized for coaching and presentations",
    highContrast: "High contrast colors for accessibility",
    performance: "Optimized for performance on large displays",
    tournament: "Competition-ready with strict validation",
    training: "Full-featured training environment",
    mobile: "Optimized for mobile devices",
    print: "Print and export friendly styling",
  };
  return descriptions[presetName] || "Custom configuration preset";
}
