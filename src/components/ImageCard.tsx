import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { LoadingDots } from "./LoadingDots";
import { ZenImage } from "@/store/writerStore";
import { Position, ImageSize } from "@/utils/layout";

// 1. Định nghĩa khuôn mẫu Props cho ImageCard
interface ImageCardProps {
  image: ZenImage;
  index: number;
  onImageClick: (image: ZenImage, index: number) => void;
  position?: Position; // Có thể undefined lúc đang load
  size?: ImageSize; // Có thể undefined lúc đang load
  onSizeLoad?: (imageId: string, size: ImageSize) => void;
}

// Image card component
export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  index,
  onImageClick,
  position,
  size,
  onSizeLoad,
}) => {
  // 2. Khai báo rõ ref dùng cho thẻ img
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!size) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Calculate display size maintaining aspect ratio
        // Max width: 300px, Max height: 400px
        const maxWidth = 300;
        const maxHeight = 400;
        const aspectRatio = img.width / img.height;

        let width = maxWidth;
        let height = maxWidth / aspectRatio;

        if (height > maxHeight) {
          height = maxHeight;
          width = maxHeight * aspectRatio;
        }

        if (onSizeLoad) {
          onSizeLoad(image.id, { width, height });
        }
      };
      img.onerror = () => {
        // Use default size if image fails to load
        if (onSizeLoad) {
          onSizeLoad(image.id, { width: 300, height: 400 });
        }
      };
      img.src = image.url;
    }
  }, [image.url, image.id, size, onSizeLoad]);

  // 3. Xử lý trạng thái Loading hiển thị Placeholder
  if (!position || !size) {
    return (
      <motion.div
        className="absolute overflow-hidden rounded-lg bg-gray-100 shadow-lg"
        style={{
          width: "200px",
          height: "280px",
          x: position?.x || 0,
          y: position?.y || 0,
        }}
      >
        <div className="flex h-full w-full items-center justify-center">
          <LoadingDots />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.8,
        x: position.x,
        y: position.y,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        x: position.x,
        y: position.y,
      }}
      exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
      whileHover={{ scale: 1.05, zIndex: 50 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      onClick={() => onImageClick(image, index)}
      className="group absolute cursor-pointer overflow-hidden rounded-lg shadow-lg hover:shadow-2xl"
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        backgroundColor: image.keywordColor || "#FFFFFF",
      }}
    >
      <img
        ref={imgRef}
        src={image.url}
        alt={image.alt_description || "Zen Writing Art"}
        className="pointer-events-none h-full w-full object-cover"
        loading="lazy"
        draggable={false}
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="pointer-events-auto absolute right-0 bottom-0 left-0 p-3 text-xs text-white">
          <p className="pointer-events-none truncate font-medium">
            {image.alt_description || "Untitled Artwork"}
          </p>
          <p className="mt-1 text-[10px] text-white/80">
            Photo by{" "}
            {image.photographer_profile ? (
              <a
                href={(() => {
                  const profile = image.photographer_profile as string;
                  const hasUtmParams = profile.includes("utm_source=zen-writing");
                  if (hasUtmParams) return profile;
                  const separator = profile.includes("?") ? "&" : "?";
                  return `${profile}${separator}utm_source=zen-writing&utm_medium=referral`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto underline hover:text-white"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                {image.photographer_name}
              </a>
            ) : (
              <span className="pointer-events-none">{image.photographer_name}</span>
            )}{" "}
            on{" "}
            <a
              href={`https://unsplash.com/?utm_source=zen-writing&utm_medium=referral`}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto underline hover:text-white"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              Unsplash
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  );
};
