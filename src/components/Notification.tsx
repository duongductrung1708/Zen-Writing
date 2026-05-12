import React from "react";
import { motion } from "framer-motion";

// 1. Định nghĩa khuôn mẫu cho các Props truyền vào
export interface NotificationProps {
  message: string;
  // 2. Union Type: Ép buộc type chỉ được nằm trong 4 chữ này (giống với Store)
  // Dấu ? báo hiệu rằng tham số này có thể bỏ trống (optional)
  type?: "info" | "success" | "error" | "warning";
}

// Notification component
export const Notification: React.FC<NotificationProps> = ({ message, type = "info" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 right-4 left-4 rounded-md px-4 py-2 text-sm sm:right-4 sm:left-auto ${
        type === "error" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
      } z-50 shadow-lg`}
    >
      {message}
    </motion.div>
  );
};
