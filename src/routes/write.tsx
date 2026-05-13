import React, { useEffect, useRef, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, PenTool } from "lucide-react";
import pkg from "lodash";
const { debounce } = pkg;

// Utils
import { extractKeywords, getKeywordColor } from "@/utils/keywords";
import { calculateMasonryLayout } from "@/utils/layout";

// Components
import { Notification } from "@/components/Notification";
import { Ruler } from "@/components/Ruler";
import { LoadingDots } from "@/components/LoadingDots";
import { EmptyState } from "@/components/EmptyState";
import { PanZoomContainer } from "@/components/PanZoomContainer";
import { ImageCard } from "@/components/ImageCard";
import { HighlightedTextEditor } from "@/components/HighlightedTextEditor";
import { PDFPreview } from "@/components/PDFPreview";
import { ImageViewer } from "@/components/ImageViewer";
import { DrawingCanvas } from "@/components/DrawingCanvas";
import { ExamplesDropdown } from "@/components/ExamplesDropdown";
import { useWriterStore } from "@/store/writerStore";
import { useKeywordImagesQuery } from "@/hooks/useKeywordImagesQuery";

// 1. Đăng ký Route cho hệ thống TanStack
export const Route = createFileRoute("/write")({
  component: Writer,
});

// 2. Khai báo Component chính
function Writer() {
  const {
    text,
    setText,
    images,
    setImages,
    isSearching,
    setIsSearching,
    notification,
    setNotification,
    panScale,
    setPanScale,
    panPosition,
    setPanPosition,
    selectedImage,
    selectedImageIndex,
    setSelectedImage,
    setSelectedImageIndex,
    setCurrentKeyword,
    keywordsMap,
    setKeywordsMap,
    showExamples,
    setShowExamples,
    showPDFPreview,
    setShowPDFPreview,
    showDrawingCanvas,
    setShowDrawingCanvas,
    imagePositions,
    setImagePositions,
    imageSizes,
    setImageSizes,
  } = useWriterStore();

  // Sửa lỗi 'never' bằng cách định danh rõ đây là HTMLDivElement
  const galleryContainerRef = useRef<HTMLDivElement>(null);

  const { fetchImagesByKeywords } = useKeywordImagesQuery();

  // Debounced search function - triggers TanStack Query fetch
  const debouncedSearch = useRef(
    debounce(async (keywords: string[]) => {
      if (!keywords || keywords.length === 0) {
        setImages([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        const uniqueImages = await fetchImagesByKeywords(keywords);

        // Debug: log keywords and images
        console.log("Keywords extracted:", keywords);
        console.log("Images fetched:", uniqueImages.length);
        console.log(
          "Image keywords:",
          uniqueImages.map((img: any) => img.keyword)
        );

        if (uniqueImages.length > 0) {
          setImages(uniqueImages);
          // Update keywords map with colors
          const newKeywordsMap: Record<string, string> = {};
          keywords.forEach((keyword: string) => {
            newKeywordsMap[keyword] = getKeywordColor(keyword);
          });
          setKeywordsMap((prev: Record<string, string>) => ({
            ...prev,
            ...newKeywordsMap,
          }));

          // Set current keyword to the last one (for backward compatibility)
          if (keywords.length > 0) {
            setCurrentKeyword(keywords[keywords.length - 1]);
          }
        } else {
          setImages([]);
          setNotification({
            message: "No images found for these keywords",
            type: "info",
          });
          setTimeout(() => setNotification(null), 3000);
        }
      } catch (error: any) {
        setNotification({
          message: error.response?.data?.error || "Failed to fetch images",
          type: "error",
        });
        setTimeout(() => setNotification(null), 3000);
        setImages([]);
      } finally {
        setIsSearching(false);
      }
    }, 800)
  ).current;

  // Handle text change
  useEffect(() => {
    const keywords = extractKeywords(text);
    debouncedSearch(keywords);
  }, [text, debouncedSearch]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Handle image click
  const handleImageClick = (image: any, index: number) => {
    setSelectedImage(image);
    setSelectedImageIndex(index);
    // Navigate to image position in canvas
    navigateToImagePosition(index);
  };

  // Handle image size load
  const handleImageSizeLoad = useCallback(
    (imageId: string, size: { width: number; height: number }) => {
      setImageSizes((prev: any) => {
        const newSizes = { ...prev, [imageId]: size };

        // Recalculate positions when all images have sizes
        if (images.length > 0) {
          const allSizesLoaded = images.every((img: any) => newSizes[img.id]);
          if (allSizesLoaded) {
            const positions = calculateMasonryLayout(
              images,
              images.map((img: any) => newSizes[img.id])
            );
            setImagePositions(positions);
          }
        }

        return newSizes;
      });
    },
    [images, setImagePositions, setImageSizes]
  );

  // Recalculate positions when images or sizes change
  useEffect(() => {
    if (images.length > 0 && Object.keys(imageSizes).length === images.length) {
      const positions = calculateMasonryLayout(
        images,
        images.map((img: any) => imageSizes[img.id] || { width: 300, height: 400 })
      );
      setImagePositions(positions);
    }
  }, [images, imageSizes, setImagePositions]);

  // Navigate to image position in canvas
  const navigateToImagePosition = useCallback(
    (index: number) => {
      if (index < 0 || index >= images.length || !imagePositions[index]) return;

      const imagePos = imagePositions[index];
      const imageSize = imageSizes[images[index].id] || {
        width: 300,
        height: 400,
      };
      const targetScale = 1.8;

      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        const galleryContainer = galleryContainerRef.current;
        if (galleryContainer) {
          const containerRect = galleryContainer.getBoundingClientRect();
          const innerContainer = galleryContainer.querySelector(".absolute");

          if (!innerContainer) return;

          // Get padding from computed styles (p-3 sm:p-4 md:p-6 lg:p-8)
          const computedStyle = window.getComputedStyle(innerContainer);
          const paddingTop = parseFloat(computedStyle.paddingTop) || 12;
          const paddingLeft = parseFloat(computedStyle.paddingLeft) || 12;

          // Calculate container center (viewport center) - this is the transform origin
          const containerCenterX = containerRect.width / 2;
          const containerCenterY = containerRect.height / 2;

          // Use actual image dimensions
          const imageWidth = imageSize.width;
          const imageHeight = imageSize.height;

          // Calculate the center of the image in canvas coordinates
          // imagePos is relative to the canvas (which starts at padding position)
          // So the actual position in the canvas is: imagePos.x + paddingLeft, imagePos.y + paddingTop
          const imageCenterX = imagePos.x + paddingLeft + imageWidth / 2;
          const imageCenterY = imagePos.y + paddingTop + imageHeight / 2;

          // With transform-origin: center, transforms are applied from the center of the container
          // The motion.div has w-full h-full, so its center = container center
          // To center the image in the viewport:
          // - The image center in scaled space: imageCenter * scale
          // - We want image center to be at viewport center
          // - So: finalPosition = viewportCenter - (imageCenter * scale)
          const finalX = containerCenterX - imageCenterX * targetScale;
          const finalY = containerCenterY - imageCenterY * targetScale;

          // Zoom in to focus on the image
          setPanScale(targetScale);

          // Animate to the position
          setPanPosition({
            x: finalX,
            y: finalY,
          });
        }
      }, 100);
    },
    [imagePositions, imageSizes, images, setPanPosition, setPanScale]
  );

  // Handle close viewer
  const handleCloseViewer = useCallback(() => {
    setSelectedImage(null);
    setSelectedImageIndex(-1);
    // Reset zoom when closing
    setPanScale(1);
    setPanPosition({ x: 0, y: 0 });
  }, [setPanPosition, setPanScale, setSelectedImage, setSelectedImageIndex]);

  // Handle navigation between images in viewer + canvas
  const handleChangeViewerIndex = useCallback(
    (newIndex: number) => {
      if (newIndex < 0 || newIndex >= images.length) return;
      setSelectedImageIndex(newIndex);
      setSelectedImage(images[newIndex]);
      navigateToImagePosition(newIndex);
    },
    [images, navigateToImagePosition, setSelectedImage, setSelectedImageIndex]
  );

  // Handle keyword click in viewer
  const handleKeywordClick = (keyword: string) => {
    if (!keyword) return;
    const index = images.findIndex((img: any) => img.keyword === keyword);
    if (index !== -1) {
      setSelectedImageIndex(index);
      setSelectedImage(images[index]);
      navigateToImagePosition(index);
    }
  };

  // Handle keyword click in text editor
  const handleKeywordClickInText = (keyword: string) => {
    if (!keyword) return;
    // Find first image with this keyword
    const index = images.findIndex((img: any) => img.keyword === keyword);
    if (index !== -1) {
      setSelectedImageIndex(index);
      setSelectedImage(images[index]);
      navigateToImagePosition(index);
    }
  };

  // Handle download - show preview first
  const handleDownload = () => {
    if (!text.trim() && images.length === 0) return;
    setShowPDFPreview(true);
  };

  // Handle drawing recognition result
  const handleDrawingRecognition = useCallback(
    async (recognizedLabel: string) => {
      if (!recognizedLabel) return;

      // Extract main keyword from label (e.g., "cat, tabby" -> "cat")
      const mainKeyword = recognizedLabel.split(",")[0].trim().toLowerCase();

      // Add to text editor or search directly
      setText((prevText: string) => {
        const newText = prevText ? `${prevText} ${mainKeyword}` : mainKeyword;
        return newText;
      });

      // Close drawing canvas
      setShowDrawingCanvas(false);

      // Show notification
      setNotification({
        message: `Recognized: ${mainKeyword}. Searching for images...`,
        type: "info",
      });
      setTimeout(() => setNotification(null), 3000);
    },
    [setNotification, setShowDrawingCanvas, setText]
  );

  // Close viewer on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedImage) {
        handleCloseViewer();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleCloseViewer, selectedImage]);

  return (
    <div className="bg-ivory flex min-h-screen flex-col md:flex-row">
      {/* Left Side - Editor */}
      <div className="flex w-full flex-col border-b border-gray-200 md:w-1/2 md:border-r md:border-b-0">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 md:px-12 md:pt-12 md:pb-4 lg:px-12 lg:pt-12">
          {/* Logo */}
          <div className="shrink-0">
            <img
              src="/assets/zen_logo.png"
              alt="Zen Writing Logo"
              className="h-4 w-4 object-contain sm:h-5 sm:w-5 md:h-6 md:w-6"
            />
          </div>

          {/* Examples - Center */}
          <ExamplesDropdown />

          {/* Action Buttons - Right */}
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDrawingCanvas(true)}
              className="text-gray-600 transition-colors hover:text-gray-900"
              title="Draw & Recognize"
            >
              <PenTool className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!text.trim() && images.length === 0}
              className="text-gray-600 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-300"
              title="Download PDF"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 px-4 pb-6 sm:px-6 sm:pb-8 md:px-12 md:pb-12 lg:px-12 lg:pb-12">
          {/* Main editor */}
          <div className="h-full">
            <HighlightedTextEditor
              value={text}
              onChange={setText}
              keywordsMap={keywordsMap}
              onKeywordClick={handleKeywordClickInText}
              placeholder="Begin your thoughts..."
            />
          </div>
        </div>
      </div>

      {/* Right Side - Gallery */}
      <div
        ref={galleryContainerRef}
        className="relative min-h-[600px] w-full bg-white sm:min-h-[700px] md:sticky md:top-0 md:h-screen md:w-1/2"
      >
        <div className="custom-scrollbar absolute inset-0 overflow-hidden p-3 sm:p-4 md:p-6 lg:p-8">
          {images.length === 0 && !isSearching && text.length === 0 && <EmptyState />}

          {isSearching && (
            <div className="flex h-64 items-center justify-center">
              <LoadingDots />
            </div>
          )}

          {images.length > 0 && (
            <AnimatePresence>
              <PanZoomContainer
                scale={panScale}
                setScale={setPanScale}
                position={panPosition}
                setPosition={setPanPosition}
              >
                {images.map((image: any, index: number) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    index={index}
                    onImageClick={handleImageClick}
                    position={imagePositions[index]}
                    size={imageSizes[image.id]}
                    onSizeLoad={handleImageSizeLoad}
                  />
                ))}
              </PanZoomContainer>
            </AnimatePresence>
          )}

          {images.length === 0 && !isSearching && text.length > 0 && (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center text-gray-400">
                <Search className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p className="text-sm">No images found</p>
              </div>
            </div>
          )}
        </div>

        {/* Ruler at bottom right corner */}
        <div className="absolute right-2 bottom-2 z-10 hidden sm:right-4 sm:bottom-4 sm:block">
          <Ruler scale={panScale} />
        </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && <Notification message={notification.message} type={notification.type} />}
      </AnimatePresence>

      {/* Image Viewer */}
      <AnimatePresence>
        {selectedImage && (
          <ImageViewer
            image={selectedImage}
            images={images}
            currentIndex={selectedImageIndex}
            onClose={handleCloseViewer}
            onChangeIndex={handleChangeViewerIndex}
            onKeywordClick={handleKeywordClick}
          />
        )}
      </AnimatePresence>

      {/* PDF Preview */}
      <AnimatePresence>
        {showPDFPreview && (
          <PDFPreview
            text={text}
            images={images}
            onClose={() => setShowPDFPreview(false)}
            onDownload={() => setShowPDFPreview(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawing Canvas */}
      <AnimatePresence>
        {showDrawingCanvas && (
          <DrawingCanvas
            onClose={() => setShowDrawingCanvas(false)}
            onRecognize={handleDrawingRecognition}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
