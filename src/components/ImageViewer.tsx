import React from "react";
import { motion } from "framer-motion";
import { getKeywordColor } from "@/utils/keywords";
import { useImageRecognition } from "@/hooks/useImageRecognition";
import { LoadingDots } from "./LoadingDots";
// Import khuôn mẫu ZenImage để dùng cho mảng images và biến image
import { ZenImage } from "@/store/writerStore";

// 1. Định nghĩa Props cho ImageViewer
interface ImageViewerProps {
  image: ZenImage | null;
  images: ZenImage[];
  currentIndex: number;
  onClose: () => void;
  onChangeIndex: (newIndex: number) => void;
  onKeywordClick: (keyword: string) => void;
}

// Image Viewer Component
export const ImageViewer: React.FC<ImageViewerProps> = ({
  image,
  images,
  currentIndex,
  onClose,
  onChangeIndex,
  onKeywordClick,
}) => {
  // 2. Sử dụng hook AI Recognition với các kiểu dữ liệu đã được định nghĩa trong Hook
  const {
    predictions,
    isLoading: isRecognizing,
    error: recognitionError,
  } = useImageRecognition(image?.url || null, !!image);

  if (!image) return null;

  const effectiveKeyword = image.keyword || "N/A";
  const effectiveKeywordColor = image.keywordColor || getKeywordColor(image.keyword || "");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none fixed inset-0 z-40 flex"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="custom-scrollbar pointer-events-auto max-h-screen w-full overflow-y-auto bg-white shadow-2xl md:w-96"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 md:p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="text-charcoal mb-6 text-2xl font-light transition-colors hover:text-red-600"
            aria-label="Close"
          >
            ×
          </button>

          {/* Navigation */}
          <div className="text-charcoal/70 mb-8 flex items-center gap-2 text-sm">
            <button
              onClick={() => {
                if (!images || images.length === 0) return;
                const newIndex = (currentIndex - 1 + images.length) % images.length;
                onChangeIndex(newIndex);
              }}
              disabled={!images || images.length <= 1}
              className="hover:text-charcoal transition-colors disabled:cursor-not-allowed disabled:opacity-30"
            >
              Previous
            </button>
            <span>•</span>
            <button
              onClick={() => {
                if (!images || images.length === 0) return;
                const newIndex = (currentIndex + 1) % images.length;
                onChangeIndex(newIndex);
              }}
              disabled={!images || images.length <= 1}
              className="hover:text-charcoal transition-colors disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
            </button>
          </div>

          {/* Image Info */}
          <div className="space-y-6">
            <div>
              <p className="text-charcoal/60 mb-2 text-xs font-bold tracking-wider uppercase">
                keyword:
              </p>
              <button
                type="button"
                onClick={() =>
                  effectiveKeyword && effectiveKeyword !== "N/A" && onKeywordClick(effectiveKeyword)
                }
                className="font-modern text-charcoal inline-flex items-center rounded-full px-3 py-1 text-xs transition-colors hover:brightness-95"
                style={{
                  backgroundColor: effectiveKeywordColor,
                }}
              >
                {effectiveKeyword}
              </button>
            </div>

            <div>
              <p className="text-charcoal/60 mb-2 text-xs font-bold tracking-wider uppercase">
                title:
              </p>
              <p className="text-charcoal font-modern text-base">
                {image.alt_description || "Untitled"}
              </p>
            </div>

            <div>
              <p className="text-charcoal/60 mb-2 text-xs font-bold tracking-wider uppercase">
                artist:
              </p>
              <p className="text-charcoal font-modern text-base">
                {(() => {
                  const profileUrl =
                    image.photographer_profile ||
                    (image.photographer_username
                      ? `https://unsplash.com/@${image.photographer_username}?utm_source=zen-writing&utm_medium=referral`
                      : null);

                  if (profileUrl) {
                    const hasUtmParams = profileUrl.includes("utm_source=zen-writing");
                    let finalUrl = profileUrl;

                    if (!hasUtmParams) {
                      const separator = profileUrl.includes("?") ? "&" : "?";
                      finalUrl = `${profileUrl}${separator}utm_source=zen-writing&utm_medium=referral`;
                    }

                    return (
                      <a
                        href={finalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer underline decoration-transparent transition-colors hover:text-red-600"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        {image.photographer_name || "Unknown"}
                      </a>
                    );
                  }
                  return <span>{image.photographer_name || "Unknown"}</span>;
                })()}
              </p>
            </div>

            <div>
              <p className="text-charcoal/60 mb-2 text-xs font-bold tracking-wider uppercase">
                date:
              </p>
              <p className="text-charcoal font-modern text-base">c. {new Date().getFullYear()}</p>
            </div>

            <div>
              <p className="text-charcoal/60 mb-2 text-xs font-bold tracking-wider uppercase">
                dimensions:
              </p>
              <p className="text-charcoal font-modern text-base">Image: Variable</p>
            </div>

            <div>
              <p className="text-charcoal/60 mb-2 text-xs font-bold tracking-wider uppercase">
                mediums:
              </p>
              <p className="text-charcoal font-modern text-base">Digital Photography</p>
            </div>

            <div>
              <p className="text-charcoal/60 mb-2 text-xs font-bold tracking-wider uppercase">
                classifications:
              </p>
              <p className="text-charcoal font-modern text-base">Photograph</p>
            </div>

            {/* AI Recognition Results */}
            {isRecognizing && (
              <div>
                <p className="text-charcoal/60 mb-2 text-xs font-bold tracking-wider uppercase">
                  ai recognition:
                </p>
                <div className="flex items-center gap-2">
                  <LoadingDots />
                  <span className="text-charcoal/60 text-sm">Analyzing...</span>
                </div>
              </div>
            )}

            {predictions && predictions.length > 0 && (
              <div>
                <p className="text-charcoal/60 mb-2 text-xs font-bold tracking-wider uppercase">
                  ai recognition:
                </p>
                <div className="space-y-1">
                  {predictions.map((prediction: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-charcoal font-modern">{prediction.label}</span>
                      <span className="text-charcoal/60 text-xs">{prediction.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recognitionError && (
              <div>
                <p className="text-charcoal/60 mb-2 text-xs font-bold tracking-wider uppercase">
                  ai recognition:
                </p>
                <p className="font-modern text-sm text-red-600">{recognitionError}</p>
              </div>
            )}

            <div>
              <p className="text-charcoal/60 mb-2 text-xs font-bold tracking-wider uppercase">
                Object Number:
              </p>
              <p className="text-charcoal font-modern font-mono text-base">{image.id}</p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <a
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-charcoal inline-flex items-center gap-1 text-sm transition-colors hover:text-red-600"
              >
                More Info &gt;
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Image Display */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="bg-ivory/95 pointer-events-auto flex flex-1 items-center justify-center p-4 backdrop-blur-sm sm:p-6 md:p-8"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <motion.img
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          src={image.url}
          alt={image.alt_description || "Zen Writing Image"}
          className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          loading="eager"
        />
      </motion.div>
    </motion.div>
  );
};
