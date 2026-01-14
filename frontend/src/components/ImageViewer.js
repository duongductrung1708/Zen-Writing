import React from "react";
import { motion } from "framer-motion";
import { getKeywordColor } from "../utils/keywords";
import { useImageRecognition } from "../hooks/useImageRecognition";
import { LoadingDots } from "./LoadingDots";

// Image Viewer Component
export const ImageViewer = ({
  image,
  images,
  currentIndex,
  onClose,
  onChangeIndex,
  onKeywordClick,
}) => {
  // Use image recognition hook
  const { predictions, isLoading: isRecognizing, error: recognitionError } =
    useImageRecognition(image?.url, !!image);

  if (!image) return null;

  const effectiveKeyword = image.keyword || "N/A";
  const effectiveKeywordColor =
    image.keywordColor || getKeywordColor(image.keyword || "");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex pointer-events-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-h-screen overflow-y-auto bg-white shadow-2xl pointer-events-auto md:w-96 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 md:p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="mb-6 text-2xl font-light transition-colors text-charcoal hover:text-red-600"
            aria-label="Close"
          >
            ×
          </button>

          {/* Navigation */}
          <div className="flex items-center gap-2 mb-8 text-sm text-charcoal/70">
            <button
              onClick={() => {
                if (!onChangeIndex) return;
                if (!images || images.length === 0) return;
                const newIndex =
                  (currentIndex - 1 + images.length) % images.length;
                onChangeIndex(newIndex);
              }}
              disabled={!images || images.length <= 1}
              className="transition-colors hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span>•</span>
            <button
              onClick={() => {
                if (!onChangeIndex) return;
                if (!images || images.length === 0) return;
                const newIndex = (currentIndex + 1) % images.length;
                onChangeIndex(newIndex);
              }}
              disabled={!images || images.length <= 1}
              className="transition-colors hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          {/* Image Info */}
          <div className="space-y-6">
            <div>
              <p
                className="mb-2 text-xs tracking-wider uppercase text-charcoal/60"
                style={{ fontWeight: "bold" }}
              >
                keyword:
              </p>
              <button
                type="button"
                onClick={() =>
                  effectiveKeyword &&
                  effectiveKeyword !== "N/A" &&
                  onKeywordClick &&
                  onKeywordClick(effectiveKeyword)
                }
                className="inline-flex items-center px-3 py-1 text-xs transition-colors rounded-full font-modern text-charcoal hover:brightness-95"
                style={{
                  backgroundColor: effectiveKeywordColor,
                }}
              >
                {effectiveKeyword}
              </button>
            </div>

            <div>
              <p
                className="mb-2 text-xs tracking-wider uppercase text-charcoal/60"
                style={{ fontWeight: "bold" }}
              >
                title:
              </p>
              <p className="text-base text-charcoal font-modern">
                {image.alt_description || "Untitled"}
              </p>
            </div>

            <div>
              <p
                className="mb-2 text-xs tracking-wider uppercase text-charcoal/60"
                style={{ fontWeight: "bold" }}
              >
                artist:
              </p>
              <p className="text-base text-charcoal font-modern">
                {(() => {
                  const profileUrl =
                    image.photographer_profile ||
                    (image.photographer_username
                      ? `https://unsplash.com/@${image.photographer_username}?utm_source=zen-writing&utm_medium=referral`
                      : null);

                  if (profileUrl) {
                    // Check if UTM params already exist
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
                        className="underline transition-colors cursor-pointer hover:text-red-600"
                        onClick={(e) => e.stopPropagation()}
                        style={{ textDecoration: "none" }}
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
              <p
                className="mb-2 text-xs tracking-wider uppercase text-charcoal/60"
                style={{ fontWeight: "bold" }}
              >
                date:
              </p>
              <p className="text-base text-charcoal font-modern">
                c. {new Date().getFullYear()}
              </p>
            </div>

            <div>
              <p
                className="mb-2 text-xs tracking-wider uppercase text-charcoal/60"
                style={{ fontWeight: "bold" }}
              >
                dimensions:
              </p>
              <p className="text-base text-charcoal font-modern">
                Image: Variable
              </p>
            </div>

            <div>
              <p
                className="mb-2 text-xs tracking-wider uppercase text-charcoal/60"
                style={{ fontWeight: "bold" }}
              >
                mediums:
              </p>
              <p className="text-base text-charcoal font-modern">
                Digital Photography
              </p>
            </div>

            <div>
              <p
                className="mb-2 text-xs tracking-wider uppercase text-charcoal/60"
                style={{ fontWeight: "bold" }}
              >
                classifications:
              </p>
              <p className="text-base text-charcoal font-modern">Photograph</p>
            </div>

            {/* AI Recognition Results */}
            {isRecognizing && (
              <div>
                <p
                  className="mb-2 text-xs tracking-wider uppercase text-charcoal/60"
                  style={{ fontWeight: "bold" }}
                >
                  ai recognition:
                </p>
                <div className="flex items-center gap-2">
                  <LoadingDots />
                  <span className="text-sm text-charcoal/60">Analyzing...</span>
                </div>
              </div>
            )}

            {predictions && predictions.length > 0 && (
              <div>
                <p
                  className="mb-2 text-xs tracking-wider uppercase text-charcoal/60"
                  style={{ fontWeight: "bold" }}
                >
                  ai recognition:
                </p>
                <div className="space-y-1">
                  {predictions.map((prediction, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-charcoal font-modern">
                        {prediction.label}
                      </span>
                      <span className="text-charcoal/60 text-xs">
                        {prediction.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recognitionError && (
              <div>
                <p
                  className="mb-2 text-xs tracking-wider uppercase text-charcoal/60"
                  style={{ fontWeight: "bold" }}
                >
                  ai recognition:
                </p>
                <p className="text-sm text-red-600 font-modern">
                  {recognitionError}
                </p>
              </div>
            )}

            <div>
              <p
                className="mb-2 text-xs tracking-wider uppercase text-charcoal/60"
                style={{ fontWeight: "bold" }}
              >
                Object Number:
              </p>
              <p className="font-mono text-base text-charcoal font-modern">
                {image.id}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <a
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm transition-colors text-charcoal hover:text-red-600"
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
        className="flex items-center justify-center flex-1 p-4 pointer-events-auto sm:p-6 md:p-8 bg-ivory/95 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.img
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          src={image.url}
          alt={image.alt_description}
          className="object-contain max-w-full max-h-full rounded-lg shadow-2xl"
          loading="eager"
        />
      </motion.div>
    </motion.div>
  );
};

