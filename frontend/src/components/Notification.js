import React from "react";
import { motion } from "framer-motion";

// Notification component
export const Notification = ({ message, type = "info" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-4 px-4 py-2 rounded-md text-sm ${
        type === "error"
          ? "bg-red-100 text-red-800"
          : "bg-gray-100 text-gray-800"
      } shadow-lg z-50`}
    >
      {message}
    </motion.div>
  );
};

