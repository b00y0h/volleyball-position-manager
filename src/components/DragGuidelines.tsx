"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GuidelineProps {
  horizontalLines: { y: number; label: string; playerId: string }[];
  verticalLines: { x: number; label: string; playerId: string }[];
  courtDimensions: { courtWidth: number; courtHeight: number };
  isDragging: boolean;
  draggedPlayerId?: string;
}

export function DragGuidelines({
  horizontalLines,
  verticalLines,
  courtDimensions,
  isDragging,
  draggedPlayerId,
}: GuidelineProps) {
  if (!isDragging) return null;

  return (
    <AnimatePresence>
      {isDragging && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Horizontal constraint lines */}
          {horizontalLines.map((line, index) => (
            <motion.g
              key={`h-${line.playerId}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Horizontal line */}
              <line
                x1={0}
                y1={line.y}
                x2={courtDimensions.courtWidth}
                y2={line.y}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="8 4"
                style={{
                  pointerEvents: "none",
                  filter: "drop-shadow(0 0 4px rgba(239, 68, 68, 0.4))",
                }}
              />
              
              {/* Line label */}
              <rect
                x={courtDimensions.courtWidth - 180}
                y={line.y - 12}
                width={175}
                height={20}
                rx={4}
                fill="rgba(239, 68, 68, 0.9)"
                stroke="rgba(220, 38, 38, 1)"
                strokeWidth={1}
                style={{ pointerEvents: "none" }}
              />
              <text
                x={courtDimensions.courtWidth - 92.5}
                y={line.y + 3}
                fontSize={10}
                fontWeight="600"
                textAnchor="middle"
                fill="white"
                style={{
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {line.label}
              </text>
              
              {/* Player indicator dot */}
              <circle
                cx={10}
                cy={line.y}
                r={6}
                fill="#ef4444"
                stroke="white"
                strokeWidth={2}
                style={{ pointerEvents: "none" }}
              />
              <text
                x={10}
                y={line.y + 4}
                fontSize={8}
                fontWeight="bold"
                textAnchor="middle"
                fill="white"
                style={{
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {line.playerId}
              </text>
            </motion.g>
          ))}

          {/* Vertical constraint lines */}
          {verticalLines.map((line, index) => (
            <motion.g
              key={`v-${line.playerId}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (horizontalLines.length + index) * 0.05 }}
            >
              {/* Vertical line */}
              <line
                x1={line.x}
                y1={0}
                x2={line.x}
                y2={courtDimensions.courtHeight}
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="8 4"
                style={{
                  pointerEvents: "none",
                  filter: "drop-shadow(0 0 4px rgba(59, 130, 246, 0.4))",
                }}
              />
              
              {/* Line label */}
              <rect
                x={line.x - 87.5}
                y={courtDimensions.courtHeight - 25}
                width={175}
                height={20}
                rx={4}
                fill="rgba(59, 130, 246, 0.9)"
                stroke="rgba(37, 99, 235, 1)"
                strokeWidth={1}
                style={{ pointerEvents: "none" }}
              />
              <text
                x={line.x}
                y={courtDimensions.courtHeight - 12}
                fontSize={10}
                fontWeight="600"
                textAnchor="middle"
                fill="white"
                style={{
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {line.label}
              </text>
              
              {/* Player indicator dot */}
              <circle
                cx={line.x}
                cy={10}
                r={6}
                fill="#3b82f6"
                stroke="white"
                strokeWidth={2}
                style={{ pointerEvents: "none" }}
              />
              <text
                x={line.x}
                y={14}
                fontSize={8}
                fontWeight="bold"
                textAnchor="middle"
                fill="white"
                style={{
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {line.playerId}
              </text>
            </motion.g>
          ))}

          {/* Attack line reference (always visible when dragging) */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.3 }}
          >
            <line
              x1={0}
              y1={courtDimensions.courtHeight * 0.3}
              x2={courtDimensions.courtWidth}
              y2={courtDimensions.courtHeight * 0.3}
              stroke="#10b981"
              strokeWidth={1}
              strokeDasharray="4 2"
              style={{ pointerEvents: "none" }}
            />
            <text
              x={5}
              y={courtDimensions.courtHeight * 0.3 - 5}
              fontSize={8}
              fill="#10b981"
              fontWeight="500"
              style={{
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              Attack Line (3m)
            </text>
          </motion.g>

          {/* Center line reference */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.4 }}
          >
            <line
              x1={courtDimensions.courtWidth / 2}
              y1={0}
              x2={courtDimensions.courtWidth / 2}
              y2={courtDimensions.courtHeight}
              stroke="#6b7280"
              strokeWidth={1}
              strokeDasharray="2 2"
              style={{ pointerEvents: "none" }}
            />
            <text
              x={courtDimensions.courtWidth / 2 + 5}
              y={15}
              fontSize={8}
              fill="#6b7280"
              fontWeight="500"
              style={{
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              Center
            </text>
          </motion.g>

          {/* Instructions overlay */}
          <motion.g
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <rect
              x={10}
              y={10}
              width={280}
              height={50}
              rx={6}
              fill="rgba(0, 0, 0, 0.8)"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={1}
              style={{ pointerEvents: "none" }}
            />
            <text
              x={20}
              y={28}
              fontSize={10}
              fontWeight="600"
              fill="white"
              style={{
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              Drag Guidelines Active
            </text>
            <text
              x={20}
              y={42}
              fontSize={9}
              fill="#d1d5db"
              style={{
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              Red lines: Cannot cross vertically
            </text>
            <text
              x={20}
              y={54}
              fontSize={9}
              fill="#d1d5db"
              style={{
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              Blue lines: Cannot cross horizontally
            </text>
          </motion.g>
        </motion.g>
      )}
    </AnimatePresence>
  );
}