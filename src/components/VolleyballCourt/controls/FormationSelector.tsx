/**
 * FormationSelector component - Dropdown for selecting formation type
 */

import React from "react";
import { FormationType } from "@/types";

export interface FormationSelectorProps {
  formation: FormationType;
  onFormationChange: (formation: FormationType) => void;
  isReadOnly?: boolean;
  className?: string;
  showCustomizationIndicator?: boolean;
  isFormationCustomized?: (formation: FormationType) => boolean;
}

export const FormationSelector: React.FC<FormationSelectorProps> = ({
  formation,
  onFormationChange,
  isReadOnly = false,
  className = "",
  showCustomizationIndicator = true,
  isFormationCustomized = () => false,
}) => {
  const getFormationLabel = (formationType: FormationType) => {
    const labels = {
      rotational: "Rotational Position",
      serveReceive: "Serve/Receive",
      base: "Base (Attack)",
    };

    const label = labels[formationType];
    const isCustom =
      showCustomizationIndicator && isFormationCustomized(formationType);

    return isCustom ? `${label} ●` : label;
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <label className="text-sm text-gray-900 dark:text-gray-100">
        Show formation:
      </label>
      <div className="relative">
        <select
          value={formation}
          onChange={(e) => onFormationChange(e.target.value as FormationType)}
          className={`px-3 py-1 border rounded pr-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 ${
            isReadOnly ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isReadOnly}
          title={
            isReadOnly ? "Disabled in read-only mode" : "Select formation type"
          }
          data-testid="formation-selector"
        >
          <option value="rotational">{getFormationLabel("rotational")}</option>
          <option value="serveReceive">
            {getFormationLabel("serveReceive")}
          </option>
          <option value="base">{getFormationLabel("base")}</option>
        </select>

        {/* Visual indicator for customized formations */}
        {showCustomizationIndicator && isFormationCustomized(formation) && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full pointer-events-none"></div>
        )}
      </div>

      {showCustomizationIndicator && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          (● indicates custom positions)
        </div>
      )}
    </div>
  );
};
