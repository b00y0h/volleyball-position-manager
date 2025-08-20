"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SystemType, FormationType } from '@/types';

interface ResetPreviewProps {
  isVisible: boolean;
  operation: 'current' | 'all' | 'formation' | 'system';
  system: SystemType;
  rotation?: number;
  formation?: FormationType;
  affectedPositions: string[];
  onClose: () => void;
}

const ResetPreview: React.FC<ResetPreviewProps> = ({
  isVisible,
  operation,
  system,
  rotation,
  formation,
  affectedPositions,
  onClose,
}) => {
  const getOperationTitle = () => {
    switch (operation) {
      case 'current':
        return `Reset Current Rotation (${rotation! + 1})`;
      case 'all':
        return `Reset All Rotations in ${formation}`;
      case 'formation':
        return `Reset Entire ${formation} Formation`;
      case 'system':
        return `Reset Entire ${system} System`;
      default:
        return 'Reset Preview';
    }
  };

  const getOperationDescription = () => {
    switch (operation) {
      case 'current':
        return `This will reset ${affectedPositions.length} customized position${affectedPositions.length === 1 ? '' : 's'} in rotation ${rotation! + 1} back to default${affectedPositions.length === 1 ? '' : 's'}.`;
      case 'all':
        return `This will reset all customized positions across all 6 rotations in the ${formation} formation back to defaults.`;
      case 'formation':
        return `This will reset all customized positions in the ${formation} formation across all rotations and systems back to defaults.`;
      case 'system':
        return `This will reset ALL customizations in the ${system} system across all formations and rotations. This is a complete system reset.`;
      default:
        return '';
    }
  };

  const getImpactLevel = (): 'low' | 'medium' | 'high' => {
    if (operation === 'system') return 'high';
    if (operation === 'formation' || operation === 'all') return 'medium';
    return 'low';
  };

  const impactLevel = getImpactLevel();
  
  const impactStyles = {
    low: {
      border: 'border-blue-200 dark:border-blue-800',
      background: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-300',
      icon: 'text-blue-500',
    },
    medium: {
      border: 'border-yellow-200 dark:border-yellow-800',
      background: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-700 dark:text-yellow-300',
      icon: 'text-yellow-500',
    },
    high: {
      border: 'border-red-200 dark:border-red-800',
      background: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-300',
      icon: 'text-red-500',
    },
  };

  const currentStyles = impactStyles[impactLevel];

  const getImpactIcon = () => {
    switch (impactLevel) {
      case 'low':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.168 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatPositionList = () => {
    if (affectedPositions.length === 0) {
      return [];
    }

    // Group positions by type for better display
    const grouped: Record<string, string[]> = {};
    
    affectedPositions.forEach(position => {
      let category = 'Players';
      
      if (position.includes('-R')) {
        // Format like "rotational-R1-S" -> "Rotational Formation"
        const parts = position.split('-');
        category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + ' Formation';
      }
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      // Clean up position name for display
      const cleanName = position.replace(/.*-R\d+-/, '').replace(/^R\d+-/, '');
      grouped[category].push(cleanName);
    });

    return Object.entries(grouped);
  };

  const groupedPositions = formatPositionList();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden ${currentStyles.border} border-2`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-4 ${currentStyles.background} border-b border-gray-200 dark:border-gray-700`}>
              <div className="flex items-start gap-3">
                <span className={currentStyles.icon}>
                  {getImpactIcon()}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Reset Preview
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {getOperationTitle()}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-96">
              <div className={`p-3 rounded-lg ${currentStyles.background} ${currentStyles.text} mb-4`}>
                <p className="text-sm">
                  {getOperationDescription()}
                </p>
              </div>

              {affectedPositions.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Affected Positions ({affectedPositions.length}):
                  </h4>
                  
                  <div className="space-y-3">
                    {groupedPositions.map(([category, positions]) => (
                      <div key={category} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                          {category}
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {positions.map((position, index) => (
                            <span
                              key={`${category}-${position}-${index}`}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-500"
                            >
                              {position}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-3 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No customized positions to reset.
                    <br />
                    All positions are already using defaults.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {impactLevel === 'high' 
                    ? 'This operation cannot be undone automatically. Use with caution.'
                    : 'This operation can be undone using Ctrl+Z.'
                  }
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResetPreview;