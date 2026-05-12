import { createServerFn } from '@tanstack/react-start';
import axios from 'axios';

// Đây là Server Function - Nó chạy hoàn toàn trên Node.js
export const getUnsplashImages = createServerFn({ method: 'GET' })
  .inputValidator((keyword: string) => keyword)
  .handler(async ({ data: keyword }) => {
    if (!keyword || keyword.trim().length === 0) {
      throw new Error("Keyword is required");
    }

    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!unsplashAccessKey) {
      throw new Error("Unsplash API key not configured");
    }

    try {
      const response = await axios.get("https://api.unsplash.com/search/photos", {
        params: {
          query: keyword,
          per_page: 6,
          orientation: "portrait",
          content_filter: "high",
        },
        headers: {
          Authorization: `Client-ID ${unsplashAccessKey}`,
          "Accept-Version": "v1",
        },
      });

      const sanitizedImages = response.data.results.map((photo: any) => {
        const imageData = {
          id: photo.id,
          url: photo.urls.regular,
          alt_description: photo.alt_description || photo.description || "Unsplash image",
          photographer_name: photo.user?.name || "Unknown",
          photographer_username: photo.user?.username || null,
          photographer_profile: photo.user?.links?.html || null,
          download_location: photo.links?.download_location || null,
        };

        if (!imageData.photographer_profile && imageData.photographer_username) {
          imageData.photographer_profile = `https://unsplash.com/@${imageData.photographer_username}?utm_source=zen-writing&utm_medium=referral`;
        }

        if (
          imageData.photographer_profile &&
          !imageData.photographer_profile.includes("utm_source=zen-writing")
        ) {
          const separator = imageData.photographer_profile.includes("?") ? "&" : "?";
          imageData.photographer_profile = `${imageData.photographer_profile}${separator}utm_source=zen-writing&utm_medium=referral`;
        }

        return imageData;
      });

      return sanitizedImages;
    } catch (error: any) {
      console.error("Unsplash Error:", error.message);
      return [];
    }
  });