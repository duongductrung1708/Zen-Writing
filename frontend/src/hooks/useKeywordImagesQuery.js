import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { getKeywordColor } from "../utils/keywords";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

/**
 * Hook to fetch images for a list of keywords using TanStack Query.
 * - Keeps Unsplash calls cached per keyword list.
 * - Returns a function you can call manually (good for debounced search).
 */
export const useKeywordImagesQuery = () => {
  const queryClient = useQueryClient();

  const fetchImagesByKeywords = useCallback(async (keywords) => {
    if (!keywords || keywords.length === 0) {
      return [];
    }

    // Search for all keywords in parallel - only get 1 random image per keyword
    // Keep results in order to preserve keyword order
    const searchPromises = keywords.map(async (keyword, keywordIndex) => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/images`, {
          params: { keyword },
        });

        if (response.data.images && response.data.images.length > 0) {
          const keywordColor = getKeywordColor(keyword);
          const randomIndex = Math.floor(
            Math.random() * response.data.images.length
          );
          const randomImage = response.data.images[randomIndex];

          return {
            image: {
              ...randomImage,
              keyword,
              keywordColor,
            },
            keywordIndex, // Preserve original keyword order
          };
        }

        return null; // No image found for this keyword
      } catch (error) {
        return null; // Error fetching for this keyword
      }
    });

    const results = await Promise.all(searchPromises);
    
    // Filter out null results and sort by original keyword order
    const imagesWithOrder = results
      .filter((result) => result !== null)
      .sort((a, b) => a.keywordIndex - b.keywordIndex)
      .map((result) => result.image);

    if (imagesWithOrder.length === 0) {
      return [];
    }

    // Keep ALL images - don't remove duplicates based on image.id
    // Each keyword should have its own entry, even if the image is the same
    // This ensures navigation works correctly for all keywords
    return imagesWithOrder;
  }, []);

  const fetchWithCache = useCallback(
    (keywords) =>
      queryClient.fetchQuery({
        queryKey: ["imagesByKeywords", keywords],
        queryFn: () => fetchImagesByKeywords(keywords),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 0,
        refetchOnWindowFocus: false,
      }),
    [queryClient, fetchImagesByKeywords]
  );

  return { fetchImagesByKeywords: fetchWithCache };
};

