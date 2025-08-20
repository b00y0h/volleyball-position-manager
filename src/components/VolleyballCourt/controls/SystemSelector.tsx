/**
 * SystemSelector component - Dropdown for selecting volleyball system (5-1 or 6-2)
 */

import React from "react";
import { SystemType } from "@/types";

export interface SystemSelectorProps {
  system: SystemType;
  onSystemChange: (system: SystemType) => void;
  isReadOnly?: boolean;
  className?: string;
}

export const SystemSelector: React.FC<SystemSelectorProps> = ({
  system,
  onSystemChange,
  isReadOnly = false,
  className = "",
}) => {
  return (
    <select
      value={system}
      onChange={(e) => onSystemChange(e.target.value as SystemType)}
      className={`px-3 py-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 ${
        isReadOnly ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      disabled={isReadOnly}
      title={
        isReadOnly ? "Disabled in read-only mode" : "Select volleyball system"
      }
      data-testid="system-selector"
    >
      <option value="5-1">5-1</option>
      <option value="6-2">6-2</option>
    </select>
  );
};
