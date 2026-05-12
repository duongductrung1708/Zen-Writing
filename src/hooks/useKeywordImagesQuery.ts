import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getKeywordColor } from "@/utils/keywords";
import { getUnsplashImages } from "@/server/images";

// 1. Import khuôn mẫu ZenImage mà chúng ta đã vất vả định nghĩa ở Store
import { ZenImage } from "@/store/writerStore";

export const useKeywordImagesQuery = () => {
  const queryClient = useQueryClient();

  // 2. Ép kiểu đầu vào (keywords là mảng string) và đầu ra (trả về mảng ZenImage)
  const fetchImagesByKeywords = useCallback(async (keywords: string[]): Promise<ZenImage[]> => {
    if (!keywords || keywords.length === 0) {
      return [];
    }

    const searchPromises = keywords.map(async (keyword: string, keywordIndex: number) => {
      try {
        const images = await getUnsplashImages({ data: keyword });

        if (images && images.length > 0) {
          const keywordColor = getKeywordColor(keyword);
          const randomIndex = Math.floor(Math.random() * images.length);
          const randomImage = images[randomIndex];

          return {
            // Ép kiểu object này cho chuẩn form ZenImage
            image: {
              ...randomImage,
              keyword,
              keywordColor,
            } as ZenImage,
            keywordIndex,
          };
        }

        return null;
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.all(searchPromises);

    // 3. Kỹ thuật "Type Guard" trong TS để lọc bỏ giá trị null an toàn
    const imagesWithOrder = results
      .filter((result): result is { image: ZenImage; keywordIndex: number } => result !== null)
      .sort((a, b) => a.keywordIndex - b.keywordIndex)
      .map((result) => result.image);

    if (imagesWithOrder.length === 0) {
      return [];
    }

    return imagesWithOrder;
  }, []);

  const fetchWithCache = useCallback(
    (keywords: string[]): Promise<ZenImage[]> =>
      queryClient.fetchQuery({
        queryKey: ["imagesByKeywords", keywords],
        queryFn: () => fetchImagesByKeywords(keywords),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 0,
      }),
    [queryClient, fetchImagesByKeywords]
  );

  return { fetchImagesByKeywords: fetchWithCache };
};
