import React from "react";

// Ruler Component - Compact version with zoom-based values
export const Ruler = ({ scale = 1 }) => {
  const totalTicks = 15; // Total number of tick marks (0-14)
  const labelPositions = [0, 4, 8, 12]; // Positions of labeled ticks
  const baseValues = [3, 12, 21, 30]; // Base values (without CM suffix)

  // Calculate scaled values based on zoom
  const scaledValues = baseValues.map((val) => Math.round(val * scale));

  return (
    <div className="relative h-5 w-64 rounded-sm border border-gray-300 bg-white/80 backdrop-blur-sm">
      {/* Base line */}
      <div className="absolute bottom-0 left-0 h-px w-full bg-gray-600" />

      {/* Tick marks and labels */}
      {Array.from({ length: totalTicks + 1 }).map((_, index) => {
        const position = (index / totalTicks) * 100;
        const isLabeled = labelPositions.includes(index);
        const labelIndex = labelPositions.indexOf(index);

        return (
          <div
            key={index}
            className="absolute bottom-0"
            style={{ left: `${position}%`, transform: "translateX(-50%)" }}
          >
            {/* Tick mark */}
            <div className="h-2 w-px bg-gray-600" />

            {/* Label */}
            {isLabeled && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 transform font-sans text-[8px] leading-none whitespace-nowrap text-gray-600">
                {labelIndex === 0 ? `${scaledValues[labelIndex]}CM` : scaledValues[labelIndex]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
