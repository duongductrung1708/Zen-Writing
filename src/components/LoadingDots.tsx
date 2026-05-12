import React from "react";
import { motion } from "framer-motion";

// Loading Dots Component
export const LoadingDots = () => {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <motion.div
        className="h-2 w-2 rounded-full bg-gray-400"
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
        className="h-2 w-2 rounded-full bg-gray-400"
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
        className="h-2 w-2 rounded-full bg-gray-400"
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
