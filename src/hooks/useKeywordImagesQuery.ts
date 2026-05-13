import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getKeywordColor } from "@/utils/keywords";
import { getUnsplashImages } from "@/server/images"; 
import { ZenImage } from "@/store/writerStore";

export const useKeywordImagesQuery = () => {
  const queryClient = useQueryClient();

  const fetchImagesByKeywords = useCallback(
    async (keywords: string[]): Promise<ZenImage[]> => {
      if (!keywords || keywords.length === 0) {
        return [];
      }

      // Lặp qua từng từ khóa
      const searchPromises = keywords.map(async (keyword: string, keywordIndex: number) => {
        try {
          // BÍ QUYẾT: Dùng React Query để CACHE TỪNG TỪ KHÓA RIÊNG BIỆT
          const cachedImage = await queryClient.fetchQuery({
            queryKey: ["imageByKeyword", keyword], // Chìa khóa độc lập cho từng từ
            queryFn: async () => {
              // Hàm này CHỈ CHẠY khi từ khóa này chưa từng được tìm kiếm trước đây
              const images = await getUnsplashImages({ data: keyword });

              if (images && images.length > 0) {
                const keywordColor = getKeywordColor(keyword);
                const randomIndex = Math.floor(Math.random() * images.length);
                const randomImage = images[randomIndex];

                return {
                  ...randomImage,
                  keyword,
                  keywordColor,
                } as ZenImage;
              }
              return null;
            },
            // Giữ cache vĩnh viễn trong phiên làm việc này, không bao giờ fetch lại từ cũ!
            staleTime: Infinity, 
            gcTime: 1000 * 60 * 60, // Dọn rác bộ nhớ sau 1 tiếng
            retry: 0,
          });

          if (cachedImage) {
            return {
              image: cachedImage,
              keywordIndex, // Giữ nguyên vị trí của từ khóa trong văn bản
            };
          }

          return null;
        } catch (error) {
          return null; 
        }
      });

      // Chờ toàn bộ các từ (cả cũ lẫn mới) xử lý xong
      const results = await Promise.all(searchPromises);
      
      // Sắp xếp lại ảnh cho đúng thứ tự xuất hiện của từ khóa trong văn bản
      const imagesWithOrder = results
        .filter((result): result is { image: ZenImage; keywordIndex: number } => result !== null)
        .sort((a, b) => a.keywordIndex - b.keywordIndex)
        .map((result) => result.image);

      return imagesWithOrder;
    },
    [queryClient]
  );

  // Không cần hàm bọc fetchWithCache bên ngoài nữa vì ta đã cache ở lõi rồi
  return { fetchImagesByKeywords };
};