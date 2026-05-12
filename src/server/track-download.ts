import { createServerFn } from '@tanstack/react-start';
import axios from 'axios';

// Định nghĩa hàm Server để track download
export const trackUnsplashDownload = createServerFn({ method: 'POST' })
  .inputValidator((url: string) => url) // Nhận vào cái link download_location của ảnh
  .handler(async ({ data: downloadUrl }) => {
    if (!downloadUrl) {
      throw new Error("Missing download URL");
    }

    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!unsplashAccessKey) {
      console.error("Unsplash API key not configured");
      return { success: false };
    }

    try {
      // Bắn 1 request ẩn về Unsplash để báo cáo lượt tải
      await axios.get(downloadUrl, {
        headers: {
          Authorization: `Client-ID ${unsplashAccessKey}`,
        },
      });

      return { success: true };
    } catch (error: any) {
      console.error("Failed to track Unsplash download:", error.message);
      return { success: false };
    }
  });