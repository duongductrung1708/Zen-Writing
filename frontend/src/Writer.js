import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download } from "lucide-react";
import axios from "axios";
import { debounce } from "lodash";
import "./index.css";

// Utils
import { extractKeywords, getKeywordColor } from "./utils/keywords";
import { calculateMasonryLayout } from "./utils/layout";

// Components
import { Notification } from "./components/Notification";
import { Ruler } from "./components/Ruler";
import { LoadingDots } from "./components/LoadingDots";
import { EmptyState } from "./components/EmptyState";
import { PanZoomContainer } from "./components/PanZoomContainer";
import { ImageCard } from "./components/ImageCard";
import { HighlightedTextEditor } from "./components/HighlightedTextEditor";
import { PDFPreview } from "./components/PDFPreview";
import { ImageViewer } from "./components/ImageViewer";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

function Writer() {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState(null);
  const [panScale, setPanScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(-1);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [keywordsMap, setKeywordsMap] = useState({}); // Map of keyword -> color
  const [showExamples, setShowExamples] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [imagePositions, setImagePositions] = useState([]);
  const [imageSizes, setImageSizes] = useState({}); // Map of imageId -> {width, height}
  const galleryContainerRef = useRef(null);

  // Debounced search function - search for all keywords
  const debouncedSearch = useRef(
    debounce(async (keywords) => {
      if (!keywords || keywords.length === 0) {
        setImages([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        // Search for all keywords in parallel - only get 1 random image per keyword
        const searchPromises = keywords.map(async (keyword) => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/images`, {
          params: { keyword },
        });
        if (response.data.images && response.data.images.length > 0) {
              const keywordColor = getKeywordColor(keyword);
              // Pick a random image from the results
              const randomIndex = Math.floor(Math.random() * response.data.images.length);
              const randomImage = response.data.images[randomIndex];
              return [{
                ...randomImage,
            keyword,
                keywordColor,
              }];
            }
            return [];
          } catch (error) {
            return [];
          }
        });

        const results = await Promise.all(searchPromises);
        const allImages = results.flat();

        if (allImages.length > 0) {
          // Remove duplicate images based on image.id
          const uniqueImagesMap = new Map();
          allImages.forEach((image) => {
            if (!uniqueImagesMap.has(image.id)) {
              uniqueImagesMap.set(image.id, image);
            }
          });
          const uniqueImages = Array.from(uniqueImagesMap.values());

          setImages(uniqueImages);
          // Reset image sizes and positions when new images are loaded
          setImageSizes({});
          setImagePositions([]);

          // Update keywords map with colors
          const newKeywordsMap = {};
          keywords.forEach((keyword) => {
            newKeywordsMap[keyword] = getKeywordColor(keyword);
          });
          setKeywordsMap((prev) => ({
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
      } catch (error) {
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
  const handleImageClick = (image, index) => {
    setSelectedImage(image);
    setSelectedImageIndex(index);
    // Navigate to image position in canvas
    navigateToImagePosition(index);
  };

  // Handle image size load
  const handleImageSizeLoad = useCallback(
    (imageId, size) => {
      setImageSizes((prev) => {
        const newSizes = { ...prev, [imageId]: size };

        // Recalculate positions when all images have sizes
        if (images.length > 0) {
          const allSizesLoaded = images.every((img) => newSizes[img.id]);
          if (allSizesLoaded) {
            const positions = calculateMasonryLayout(
              images,
              images.map((img) => newSizes[img.id])
            );
            setImagePositions(positions);
          }
        }

        return newSizes;
      });
    },
    [images]
  );

  // Recalculate positions when images or sizes change
  useEffect(() => {
    if (images.length > 0 && Object.keys(imageSizes).length === images.length) {
      const positions = calculateMasonryLayout(
        images,
        images.map((img) => imageSizes[img.id] || { width: 300, height: 400 })
      );
      setImagePositions(positions);
    }
  }, [images, imageSizes]);

  // Navigate to image position in canvas
  const navigateToImagePosition = (index) => {
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
  };

  // Handle close viewer
  const handleCloseViewer = () => {
    setSelectedImage(null);
    setSelectedImageIndex(-1);
    // Reset zoom when closing
    setPanScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Handle navigation
  const handlePrevious = () => {
    if (selectedImageIndex > 0) {
      const newIndex = selectedImageIndex - 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(images[newIndex]);
    }
  };

  const handleNext = () => {
    if (selectedImageIndex < images.length - 1) {
      const newIndex = selectedImageIndex + 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(images[newIndex]);
    }
  };

  // Handle keyword click in viewer
  const handleKeywordClick = (keyword) => {
    if (!keyword) return;
    const index = images.findIndex((img) => img.keyword === keyword);
    if (index !== -1) {
      navigateToImagePosition(index);
    }
  };

  // Handle keyword click in text editor
  const handleKeywordClickInText = (keyword) => {
    if (!keyword) return;
    // Find first image with this keyword
    const index = images.findIndex((img) => img.keyword === keyword);
    if (index !== -1) {
      navigateToImagePosition(index);
    }
  };

  // Handle download - show preview first
  const handleDownload = () => {
    if (!text.trim() && images.length === 0) return;
    setShowPDFPreview(true);
  };

  // Close viewer on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && selectedImage) {
        handleCloseViewer();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedImage]);

  return (
    <div className="flex flex-col min-h-screen bg-ivory md:flex-row">
      {/* Left Side - Editor */}
      <div className="flex flex-col w-full border-b border-gray-200 md:w-1/2 md:border-b-0 md:border-r">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 md:px-12 lg:px-12 md:pt-12 lg:pt-12 md:pb-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              src="/assets/zen_logo.png"
              alt="Zen Writing Logo"
              className="object-contain w-4 h-4 sm:w-5 sm:h-5 md:h-6 md:w-6"
            />
          </div>

          {/* Examples - Center */}
          <div className="relative flex justify-center flex-1">
            <div className="relative examples-dropdown-container">
              <button
                type="button"
                tabIndex={1}
                onClick={() => setShowExamples((prev) => !prev)}
                className="group inline-flex flex-col items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-gray-600"
              >
                <span className="font-semibold text-[0.7rem] sm:text-[0.8rem]">
                  Examples
                </span>
                <span className="relative w-full h-px overflow-hidden bg-gray-200">
                  <span className="absolute inset-0 transition-transform duration-200 origin-center scale-x-0 bg-gray-600 group-hover:scale-x-100" />
                </span>
              </button>

              {/* Examples Dropdown */}
              <AnimatePresence>
                {showExamples && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 w-[calc(100vw-2rem)] max-w-96 sm:w-96 max-h-[60vh] overflow-y-auto custom-scrollbar z-50"
                    style={{ left: "-205%" }}
                  >
                    <div className="p-3 space-y-2 text-xs text-gray-700 sm:p-4 sm:space-y-3 sm:text-sm">
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => {
                          setText(
                            "Give me a quiet, reflective writing prompt about memory and place."
                          );
                          setShowExamples(false);
                        }}
                        className="text-sm underline transition-colors underline-offset-4 decoration-gray-400 hover:decoration-gray-700 hover:text-red-600 sm:text-lg"
            style={{
                          textDecoration: "none",
                          textAlign: "center",
                          display: "block",
                          margin: "0 auto",
                          marginTop: "0.75rem",
                        }}
                      >
                        Give me a writing prompt
                      </button>
                      <p
                        className="pt-2 text-gray-500"
                        style={{
                          textAlign: "center",
                          display: "block",
                          margin: "0 auto",
                          fontSize: "1.2rem",
                          marginTop: "1rem",
                        }}
                      >
                        Popular texts you can explore:
                      </p>
                      <ul className="space-y-2" style={{ marginTop: "1rem", listStyleType: "circle", marginLeft: "1rem" }}>
                        <li>
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => {
                              setText(
                                'After reading "Dear One Absent This Long While" by Lisa Olstein, write a letter to someone you haven\'t spoken to in years.'
                              );
                              setShowExamples(false);
                            }}
                            className="w-full py-1 text-left transition-colors hover:text-red-600"
                          >
                            <em>Dear One Absent This Long While</em> by Lisa
                            Olstein
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => {
                              setText(
                                'After reading "Sticks" by George Saunders, write a very short story about a family ritual told in less than 300 words.'
                              );
                              setShowExamples(false);
                            }}
                            className="w-full py-1 text-left transition-colors hover:text-red-600"
                          >
                            <em>Sticks</em> by George Saunders
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => {
                              setText(
                                'After reading "Tomorrow at Dawn" by Victor Hugo, write a poem that describes a journey to meet someone important.'
                              );
                              setShowExamples(false);
                            }}
                            className="w-full py-1 text-left transition-colors hover:text-red-600"
                          >
                            <em>Tomorrow at Dawn</em> by Victor Hugo
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => {
                              setText(
                                'After reading "The old pond" by Matsuo Bashō, write a three-line poem that captures a tiny, quiet moment.'
                              );
                              setShowExamples(false);
                            }}
                            className="w-full py-1 text-left transition-colors hover:text-red-600"
                          >
                            <em>The old pond</em> by Matsuo Bashō
                          </button>
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Download Button - Right */}
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!text.trim() && images.length === 0}
              className="text-gray-600 transition-colors hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
              title="Download PDF"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5 md:h-6 md:w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 px-4 pb-6 sm:px-6 sm:pb-8 md:px-12 lg:px-12 md:pb-12 lg:pb-12">
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
        className="relative w-full bg-white md:w-1/2 md:sticky md:top-0 md:h-screen min-h-[600px] sm:min-h-[700px]"
      >
        <div className="absolute inset-0 p-3 overflow-hidden sm:p-4 custom-scrollbar md:p-6 lg:p-8">
          {images.length === 0 && !isSearching && text.length === 0 && (
            <EmptyState />
          )}

          {isSearching && (
            <div className="flex items-center justify-center h-64">
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
                {images.map((image, index) => (
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
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No images found</p>
              </div>
            </div>
          )}
        </div>

        {/* Ruler at bottom right corner */}
        <div className="absolute z-10 hidden bottom-2 right-2 sm:bottom-4 sm:right-4 sm:block">
          <Ruler scale={panScale} />
        </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
          />
        )}
      </AnimatePresence>

      {/* Image Viewer */}
      <AnimatePresence>
        {selectedImage && (
          <ImageViewer
            image={selectedImage}
            images={images}
            currentIndex={selectedImageIndex}
            keyword={selectedImage.keyword || currentKeyword}
            keywordColor={selectedImage.keywordColor || getKeywordColor(selectedImage.keyword || currentKeyword || "")}
            onClose={handleCloseViewer}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onNavigateToImage={navigateToImagePosition}
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
    </div>
  );
}

export default Writer;
