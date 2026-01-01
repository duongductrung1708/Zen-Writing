import React from "react";
import { motion } from "framer-motion";

// Empty state watermark - Wireframe blocks
export const EmptyState = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 p-4 pointer-events-none md:p-6 lg:p-8"
    >
      <div className="grid h-full grid-cols-2 gap-4 md:gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Tall vertical block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.3, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-600 rounded flex-1 min-h-[200px]"
          />
          {/* Wide horizontal block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.3, y: 0 }}
            transition={{ delay: 0.2 }}
            className="h-32 bg-gray-600 rounded md:h-40"
          />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Top wide block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.3, y: 0 }}
            transition={{ delay: 0.15 }}
            className="h-32 bg-gray-600 rounded md:h-40"
          />
          {/* Two square blocks */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.3, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gray-600 rounded aspect-square"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.3, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-600 rounded aspect-square"
            />
          </div>
          {/* Bottom wide block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.3, y: 0 }}
            transition={{ delay: 0.35 }}
            className="h-32 bg-gray-600 rounded md:h-40"
          />
        </div>
      </div>
    </motion.div>
  );
};

