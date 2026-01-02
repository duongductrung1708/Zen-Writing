import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { LoadingDots } from "./LoadingDots";

// Image card component
export const ImageCard = ({
  image,
  index,
  onImageClick,
  position,
  size,
  onSizeLoad,
}) => {
  const imgRef = useRef(null);

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

  if (!position || !size) {
    // Show placeholder while loading size
    return (
      <motion.div
        className="absolute overflow-hidden bg-gray-100 rounded-lg shadow-lg"
        style={{
          width: "200px",
          height: "280px",
          x: position?.x || 0,
          y: position?.y || 0,
        }}
      >
        <div className="flex items-center justify-center w-full h-full">
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
      className="absolute overflow-hidden rounded-lg shadow-lg cursor-pointer group hover:shadow-2xl"
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        backgroundColor: image.keywordColor || "#FFFFFF",
      }}
    >
      <img
        ref={imgRef}
        src={image.url}
        alt={image.alt_description}
        className="object-cover w-full h-full pointer-events-none"
        loading="lazy"
        draggable={false}
      />
      <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:opacity-100">
        <div className="absolute bottom-0 left-0 right-0 p-3 text-xs text-white pointer-events-auto">
          <p className="font-medium truncate pointer-events-none">
            {image.alt_description}
          </p>
          <p className="text-white/80 text-[10px] mt-1">
            Photo by{" "}
            {image.photographer_profile ? (
              <a
                href={(() => {
                  // Check if UTM params already exist
                  const hasUtmParams = image.photographer_profile.includes("utm_source=zen-writing");
                  if (hasUtmParams) {
                    return image.photographer_profile;
                  }
                  const separator = image.photographer_profile.includes("?") ? "&" : "?";
                  return `${image.photographer_profile}${separator}utm_source=zen-writing&utm_medium=referral`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="underline pointer-events-auto hover:text-white"
                onClick={(e) => e.stopPropagation()}
              >
                {image.photographer_name}
              </a>
            ) : (
              <span className="pointer-events-none">
                {image.photographer_name}
              </span>
            )}{" "}
            on{" "}
            <a
              href={`https://unsplash.com/?utm_source=zen-writing&utm_medium=referral`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline pointer-events-auto hover:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              Unsplash
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

