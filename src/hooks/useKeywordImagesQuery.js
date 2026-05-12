import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getKeywordColor } from "../utils/keywords";
// 1. Import hàm từ Backend thẳng vào Frontend như một vị thần
import { getUnsplashImages } from "../server/images"; 

export const useKeywordImagesQuery = () => {
  const queryClient = useQueryClient();

  const fetchImagesByKeywords = useCallback(async (keywords) => {
    if (!keywords || keywords.length === 0) {
      return [];
    }

    const searchPromises = keywords.map(async (keyword, keywordIndex) => {
      try {
        // 2. GỌI TRỰC TIẾP HÀM BẰNG RPC (Không cần Axios, Không lo 404!)
        // TanStack sẽ tự động bọc cái này thành 1 API Call ngầm.
        const images = await getUnsplashImages({ data: keyword });

        if (images && images.length > 0) {
          const keywordColor = getKeywordColor(keyword);
          const randomIndex = Math.floor(Math.random() * images.length);
          const randomImage = images[randomIndex];

          return {
            image: {
              ...randomImage,
              keyword,
              keywordColor,
            },
            keywordIndex,
          };
        }

        return null;
      } catch (error) {
        return null; 
      }
    });

    const results = await Promise.all(searchPromises);
    
    const imagesWithOrder = results
      .filter((result) => result !== null)
      .sort((a, b) => a.keywordIndex - b.keywordIndex)
      .map((result) => result.image);

    if (imagesWithOrder.length === 0) {
      return [];
    }

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