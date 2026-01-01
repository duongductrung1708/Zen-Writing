import React from "react";
import { motion } from "framer-motion";

// Loading Dots Component
export const LoadingDots = () => {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0,
        }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0.2,
        }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0.4,
        }}
      />
    </div>
  );
};

