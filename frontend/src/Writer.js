import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Download, X } from "lucide-react";
import axios from "axios";
import { debounce } from "lodash";
import jsPDF from "jspdf";
import "./index.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

// Keyword extraction function - extract all meaningful words
const extractKeywords = (text) => {
  if (!text || text.trim().length === 0) return [];

  const words = text.trim().split(/\s+/);
  const keywords = new Set(); // Use Set to avoid duplicates

  // Extract all words with length > 3
  words.forEach((word) => {
    const cleanWord = word.replace(/[^\w]/g, ""); // Remove punctuation
    if (cleanWord.length > 3) {
      keywords.add(cleanWord.toLowerCase());
    }
  });

  return Array.from(keywords);
};

// Notification component
const Notification = ({ message, type = "info" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-4 px-4 py-2 rounded-md text-sm ${
        type === "error"
          ? "bg-red-100 text-red-800"
          : "bg-gray-100 text-gray-800"
      } shadow-lg z-50`}
    >
      {message}
    </motion.div>
  );
};

// Ruler Component - Compact version with zoom-based values
const Ruler = ({ scale = 1 }) => {
  const totalTicks = 15; // Total number of tick marks (0-14)
  const labelPositions = [0, 4, 8, 12]; // Positions of labeled ticks
  const baseValues = [3, 12, 21, 30]; // Base values (without CM suffix)

  // Calculate scaled values based on zoom
  const scaledValues = baseValues.map((val) => Math.round(val * scale));

  return (
    <div className="relative w-64 h-5 border border-gray-300 rounded-sm bg-white/80 backdrop-blur-sm">
      {/* Base line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gray-600" />

      {/* Tick marks and labels */}
      {Array.from({ length: totalTicks + 1 }).map((_, index) => {
        const position = (index / totalTicks) * 100;
        const isLabeled = labelPositions.includes(index);
        const labelIndex = labelPositions.indexOf(index);

        return (
          <div
            key={index}
            className="absolute bottom-0"
            style={{ left: `${position}%`, transform: "translateX(-50%)" }}
          >
            {/* Tick mark */}
            <div className="w-px h-2 bg-gray-600" />

            {/* Label */}
            {isLabeled && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[8px] text-gray-600 font-sans whitespace-nowrap leading-none">
                {labelIndex === 0
                  ? `${scaledValues[labelIndex]}CM`
                  : scaledValues[labelIndex]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Loading Dots Component
const LoadingDots = () => {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0,
        }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0.2,
        }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0.4,
        }}
      />
    </div>
  );
};

// Empty state watermark - Wireframe blocks
const EmptyState = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 p-4 pointer-events-none md:p-6 lg:p-8"
    >
      <div className="grid h-full grid-cols-2 gap-4 md:gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Tall vertical block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.3, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-600 rounded flex-1 min-h-[200px]"
          />
          {/* Wide horizontal block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.3, y: 0 }}
            transition={{ delay: 0.2 }}
            className="h-32 bg-gray-600 rounded md:h-40"
          />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Top wide block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.3, y: 0 }}
            transition={{ delay: 0.15 }}
            className="h-32 bg-gray-600 rounded md:h-40"
          />
          {/* Two square blocks */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.3, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gray-600 rounded aspect-square"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.3, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-600 rounded aspect-square"
            />
          </div>
          {/* Bottom wide block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.3, y: 0 }}
            transition={{ delay: 0.35 }}
            className="h-32 bg-gray-600 rounded md:h-40"
          />
        </div>
      </div>
    </motion.div>
  );
};

// Pan Zoom Container Component
const PanZoomContainer = ({
  children,
  scale,
  setScale,
  position,
  setPosition,
}) => {
  const containerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPointRef = useRef({ x: 0, y: 0 });
  const lastTouchDistanceRef = useRef(0);
  const lastTouchCenterRef = useRef({ x: 0, y: 0 });
  const initialScaleRef = useRef(1);

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      setScale((prevScale) => Math.min(Math.max(0.5, prevScale + delta), 3));
    },
    [setScale]
  );

  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) {
      // Left mouse button
      setIsPanning(true);
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (isPanning) {
        const deltaX = e.clientX - lastPanPointRef.current.x;
        const deltaY = e.clientY - lastPanPointRef.current.y;
        setPosition((prevPos) => ({
          x: prevPos.x + deltaX,
          y: prevPos.y + deltaY,
        }));
        lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isPanning, setPosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Touch event handlers for mobile
  const getTouchDistance = (touch1, touch2) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touch1, touch2) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  const handleTouchStart = useCallback(
    (e) => {
      if (e.touches.length === 1) {
        // Single touch - start panning
        setIsPanning(true);
        lastPanPointRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      } else if (e.touches.length === 2) {
        // Two touches - prepare for pinch zoom
        setIsPanning(false);
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDistanceRef.current = getTouchDistance(touch1, touch2);
        lastTouchCenterRef.current = getTouchCenter(touch1, touch2);
        initialScaleRef.current = scale;
      }
    },
    [scale]
  );

  const handleTouchMove = useCallback(
    (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && isPanning) {
        // Single touch - panning
        const deltaX = e.touches[0].clientX - lastPanPointRef.current.x;
        const deltaY = e.touches[0].clientY - lastPanPointRef.current.y;
        setPosition((prevPos) => ({
          x: prevPos.x + deltaX,
          y: prevPos.y + deltaY,
        }));
        lastPanPointRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      } else if (e.touches.length === 2) {
        // Two touches - pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = getTouchDistance(touch1, touch2);
        const currentCenter = getTouchCenter(touch1, touch2);

        if (lastTouchDistanceRef.current > 0) {
          const scaleChange =
            currentDistance / lastTouchDistanceRef.current;
          const newScale = Math.min(
            Math.max(0.5, initialScaleRef.current * scaleChange),
            3
          );
          setScale(newScale);

          // Adjust position to zoom towards touch center
          const centerDeltaX = currentCenter.x - lastTouchCenterRef.current.x;
          const centerDeltaY = currentCenter.y - lastTouchCenterRef.current.y;
          setPosition((prevPos) => ({
            x: prevPos.x + centerDeltaX,
            y: prevPos.y + centerDeltaY,
          }));
        }

        lastTouchDistanceRef.current = currentDistance;
        lastTouchCenterRef.current = currentCenter;
      }
    },
    [isPanning, setPosition, setScale]
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    lastTouchDistanceRef.current = 0;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseup", handleMouseUp);
      container.addEventListener("mouseleave", handleMouseUp);
      container.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      container.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      container.addEventListener("touchend", handleTouchEnd);
      container.addEventListener("touchcancel", handleTouchEnd);

      return () => {
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseup", handleMouseUp);
        container.removeEventListener("mouseleave", handleMouseUp);
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
        container.removeEventListener("touchend", handleTouchEnd);
        container.removeEventListener("touchcancel", handleTouchEnd);
      };
    }
  }, [
    handleWheel,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ touchAction: "none" }}
    >
      <motion.div
        animate={{
          x: position.x,
          y: position.y,
          scale: scale,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full h-full origin-center"
        style={{
          minWidth: "200%",
          minHeight: "200%",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Image card component
const ImageCard = ({
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
                href={`${image.photographer_profile}${
                  image.photographer_profile.includes("?") ? "&" : "?"
                }utm_source=zen-writing&utm_medium=referral`}
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

// Random layout helper - calculates random positions with collision detection
const calculateMasonryLayout = (images, imageSizes) => {
  const positions = new Array(images.length);
  const placedRects = []; // Track placed rectangles for collision detection
  const gap = 20; // Minimum gap between images
  // Responsive canvas width based on screen size
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const isTablet = typeof window !== 'undefined' && window.innerWidth < 768;
  let canvasWidth = isMobile ? 400 : isTablet ? 600 : 1200; // Canvas width for random placement
  let canvasHeight = 2000; // Canvas height for random placement
  const maxAttempts = 200; // Increased attempts to find a non-overlapping position

  // Sort images by area (largest first) for better placement, but keep original index
  const imagesWithSizes = images.map((image, index) => ({
    image,
    originalIndex: index,
    size: imageSizes[index] || { width: 300, height: 400 },
    area: (imageSizes[index]?.width || 300) * (imageSizes[index]?.height || 400),
  })).sort((a, b) => b.area - a.area);

  // Helper function to check collision with proper gap
  const checkCollision = (x, y, width, height, rects) => {
    return rects.some((rect) => {
      // Check if rectangles overlap (with gap)
      const hasHorizontalOverlap = !(x + width + gap <= rect.x || x >= rect.x + rect.width + gap);
      const hasVerticalOverlap = !(y + height + gap <= rect.y || y >= rect.y + rect.height + gap);
      return hasHorizontalOverlap && hasVerticalOverlap;
    });
  };

  // Helper function to find a random position
  const findRandomPosition = (width, height) => {
    let attempts = 0;
    while (attempts < maxAttempts) {
      const x = Math.random() * (canvasWidth - width - gap * 2) + gap;
      const y = Math.random() * (canvasHeight - height - gap * 2) + gap;

      if (!checkCollision(x, y, width, height, placedRects)) {
        return { x, y };
      }
      attempts++;
    }
    
    // Fallback: Try grid-based placement if random fails
    const gridSize = 50;
    for (let gridY = gap; gridY < canvasHeight - height - gap; gridY += gridSize) {
      for (let gridX = gap; gridX < canvasWidth - width - gap; gridX += gridSize) {
        if (!checkCollision(gridX, gridY, width, height, placedRects)) {
          return { x: gridX, y: gridY };
        }
      }
    }
    
    // Last resort: Expand canvas and place at bottom
    const newY = canvasHeight + gap;
    canvasHeight = newY + height + gap;
    return { x: gap, y: newY };
  };

  // Place images (sorted by size for better collision avoidance)
  imagesWithSizes.forEach((item) => {
    const { size, originalIndex } = item;
    const position = findRandomPosition(size.width, size.height);

    // Store position at original index to maintain order
    positions[originalIndex] = { x: position.x, y: position.y };

    // Add to placed rectangles for collision detection
    placedRects.push({
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
    });
  });

  return positions;
};

// Helper function to get a keyword color
const getKeywordColor = (keyword) => {
  if (!keyword) return "#CEE8D7";

  // Simple hash to alternate colors in a stable way
  const hash =
    keyword.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) +
    keyword.length;

  return hash % 2 === 0 ? "#CEE8D7" : "#CAE2FF";
};

// Highlighted Text Editor Component
const HighlightedTextEditor = ({
  value,
  onChange,
  keywordsMap,
  onKeywordClick,
  placeholder,
}) => {
  const editorRef = useRef(null);
  const [isComposing, setIsComposing] = useState(false);
  const [cursorIndicatorTop, setCursorIndicatorTop] = useState(0);

  // Handle input
  const handleInput = (e) => {
    if (!isComposing) {
      const newValue = e.target.innerText;
      onChange(newValue);
    }
    // Update indicator position after input
    setTimeout(updateCursorIndicator, 0);
  };

  // Handle composition (for IME input)
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (e) => {
    setIsComposing(false);
    const newValue = e.target.innerText;
    onChange(newValue);
  };

  // Update cursor indicator position
  const updateCursorIndicator = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();
      
      // Calculate center of the text line relative to editor
      // Use rect.height to get the line height, then center the dot
      const lineCenter = rect.top + rect.height / 2;
      const top = lineCenter - editorRect.top;
      setCursorIndicatorTop(top);
    }
  }, []);

  // Handle click on highlighted keyword
  const handleClick = (e) => {
    const target = e.target;
    if (target.classList.contains("keyword-highlight")) {
      e.preventDefault();
      const keyword = target.dataset.keyword;
      if (keyword && onKeywordClick) {
        onKeywordClick(keyword);
      }
    }
    // Update indicator position after click
    setTimeout(updateCursorIndicator, 0);
  };

  // Handle key events to update indicator
  const handleKeyUp = useCallback(() => {
    setTimeout(updateCursorIndicator, 0);
  }, [updateCursorIndicator]);

  // Update content when value or keywordsMap changes
  useEffect(() => {
    if (editorRef.current && !isComposing) {
      // Render text with highlights
      const renderHighlightedText = () => {
        if (!value) return [];

        const parts = [];
        let lastIndex = 0;
        const text = value;

        // Find all keyword matches
        const matches = [];
        Object.keys(keywordsMap).forEach((keyword) => {
          const regex = new RegExp(
            `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "gi"
          );
          let match;
          while ((match = regex.exec(text)) !== null) {
            matches.push({
              keyword,
              start: match.index,
              end: match.index + match[0].length,
              original: match[0],
            });
          }
        });

        // Sort matches by start position
        matches.sort((a, b) => a.start - b.start);

        // Remove overlapping matches (keep first)
        const nonOverlapping = [];
        matches.forEach((match) => {
          const overlaps = nonOverlapping.some(
            (m) => match.start < m.end && match.end > m.start
          );
          if (!overlaps) {
            nonOverlapping.push(match);
          }
        });

        // Build parts array
        nonOverlapping.forEach((match) => {
          // Add text before match
          if (match.start > lastIndex) {
            parts.push({
              type: "text",
              content: text.substring(lastIndex, match.start),
            });
          }
          // Add highlighted keyword
          parts.push({
            type: "keyword",
            content: match.original,
            keyword: match.keyword,
            color: keywordsMap[match.keyword],
          });
          lastIndex = match.end;
        });

        // Add remaining text
        if (lastIndex < text.length) {
          parts.push({
            type: "text",
            content: text.substring(lastIndex),
          });
        }

        return parts.length > 0 ? parts : [{ type: "text", content: text }];
      };

      const parts = renderHighlightedText();
      const html = parts
        .map((part) => {
          if (part.type === "keyword") {
            return `<span class="keyword-highlight" data-keyword="${part.keyword}" style="background-color: ${part.color}; cursor: pointer; border-radius: 2px; padding: 0 2px;">${part.content}</span>`;
          }
          // Escape HTML characters but keep actual newline characters;
          // newlines will be rendered by CSS white-space: pre-wrap.
          return part.content
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        })
        .join("");

      // Save cursor position before updating
      const selection = window.getSelection();
      let savedOffset = 0;

      if (
        selection.rangeCount > 0 &&
        editorRef.current.contains(selection.anchorNode)
      ) {
        const range = selection.getRangeAt(0);
        // Calculate character offset from start of editor
        const preRange = document.createRange();
        preRange.selectNodeContents(editorRef.current);
        preRange.setEnd(range.startContainer, range.startOffset);
        savedOffset = preRange.toString().length;
      }

      // Get current plain text
      const currentText = editorRef.current.innerText || "";

      // Only update HTML if text content changed or keywordsMap changed
      // But don't update if user is actively typing (text matches)
      if (currentText !== value || Object.keys(keywordsMap).length > 0) {
        // If text doesn't match, update it first
        if (currentText !== value) {
          editorRef.current.innerText = value;
        }

        // Now apply highlights
        editorRef.current.innerHTML = html || "";

        // Restore cursor position
        if (savedOffset >= 0) {
          try {
            const newRange = document.createRange();
            const walker = document.createTreeWalker(
              editorRef.current,
              NodeFilter.SHOW_TEXT,
              null
            );

            let node;
            let offset = 0;
            let targetNode = null;
            let targetOffset = 0;

            while ((node = walker.nextNode())) {
              const nodeLength = node.textContent.length;

              if (offset + nodeLength >= savedOffset) {
                targetNode = node;
                targetOffset = savedOffset - offset;
                break;
              }

              offset += nodeLength;
            }

            if (targetNode) {
              newRange.setStart(
                targetNode,
                Math.min(targetOffset, targetNode.textContent.length)
              );
              newRange.setEnd(
                targetNode,
                Math.min(targetOffset, targetNode.textContent.length)
              );
              selection.removeAllRanges();
              selection.addRange(newRange);
            } else if (editorRef.current.lastChild) {
              // Place cursor at end
              const lastNode = editorRef.current.lastChild;
              const lastTextNode =
                lastNode.nodeType === Node.TEXT_NODE
                  ? lastNode
                  : lastNode.lastChild;
              if (lastTextNode && lastTextNode.nodeType === Node.TEXT_NODE) {
                newRange.setStart(
                  lastTextNode,
                  lastTextNode.textContent.length
                );
                newRange.setEnd(lastTextNode, lastTextNode.textContent.length);
                selection.removeAllRanges();
                selection.addRange(newRange);
              }
            }
          } catch (e) {
            // Ignore cursor restoration errors
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, keywordsMap, isComposing]);

  // Update indicator on selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      updateCursorIndicator();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [updateCursorIndicator]);

  return (
    <div className="relative w-full h-full">
      {/* Cursor indicator - blue dot on the left */}
      <div
        className="absolute left-0 z-10 w-2 h-2 transition-all duration-150 bg-blue-500 rounded-full pointer-events-none"
        style={{
          top: `${cursorIndicatorTop}px`,
          transform: "translateY(-50%)",
          opacity: cursorIndicatorTop > 0 ? 1 : 0,
        }}
      />
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onClick={handleClick}
        onKeyUp={handleKeyUp}
        className="w-full h-full pl-4 text-sm leading-relaxed placeholder-gray-400 transition-colors bg-transparent border-none outline-none resize-none sm:text-base text-charcoal font-modern md:text-lg lg:text-xl focus:placeholder-gray-300"
        style={{
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

// PDF Preview Component
const PDFPreview = ({ text, images, onClose, onDownload }) => {
  const previewRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPos = margin;

      // Add text
      if (text.trim()) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line) => {
          if (yPos > pageHeight - margin - 10) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.text(line, margin, yPos);
          yPos += 6;
        });
        yPos += 10;
      }

      // Add images
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const image = images[i];

          try {
            // Track download per Unsplash API requirements
            if (image.download_location) {
              try {
                await axios.post(`${API_BASE_URL}/api/track-download`, {
                  download_location: image.download_location,
                });
              } catch (error) {
                // Continue even if tracking fails
              }
            }

            // Load image
            const img = new Image();
            img.crossOrigin = "anonymous";

            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = image.url;
            });

            // Calculate image dimensions
            const imgWidth = img.width;
            const imgHeight = img.height;
            const aspectRatio = imgWidth / imgHeight;

            // Fit image to page width
            let displayWidth = maxWidth;
            let displayHeight = displayWidth / aspectRatio;

            // Check if image fits on current page
            if (yPos + displayHeight > pageHeight - margin) {
              pdf.addPage();
              yPos = margin;
            }

            // Add image to PDF
            pdf.addImage(
              img,
              "JPEG",
              margin,
              yPos,
              displayWidth,
              displayHeight
            );

            yPos += displayHeight + 10;

            // Add image caption with attribution per Unsplash API requirements
            if (yPos > pageHeight - margin - 10) {
              pdf.addPage();
              yPos = margin;
            }
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);

            // Attribution text
            const attributionText = image.photographer_name
              ? `Photo by ${image.photographer_name} on Unsplash`
              : "Photo from Unsplash";
            const attributionLines = pdf.splitTextToSize(
              attributionText,
              maxWidth
            );
            let currentYPos = yPos;
            for (const line of attributionLines) {
              if (currentYPos > pageHeight - margin - 10) {
                pdf.addPage();
                currentYPos = margin;
              }
              pdf.text(line, margin, currentYPos);
              currentYPos += 4;
            }

            // Image description if available
            if (image.alt_description) {
              const captionLines = pdf.splitTextToSize(
                image.alt_description,
                maxWidth
              );
              for (const line of captionLines) {
                if (currentYPos > pageHeight - margin - 10) {
                  pdf.addPage();
                  currentYPos = margin;
                }
                pdf.text(line, margin, currentYPos);
                currentYPos += 4;
              }
            }
            yPos = currentYPos + 5;
            pdf.setTextColor(0, 0, 0);
          } catch (error) {
            // Continue with next image
          }
        }
      }

      // Save PDF
      const fileName = `zen-writing-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(fileName);
      onClose();
    } catch (error) {
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col m-2 sm:m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sm:p-6">
          <h2 className="text-lg font-semibold sm:text-xl text-charcoal">PDF Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Preview Content */}
        <div
          ref={previewRef}
          className="flex-1 p-4 overflow-y-auto sm:p-6 md:p-8 bg-ivory custom-scrollbar"
        >
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            {/* Text Preview */}
            {text.trim() && (
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                  Text
                </h3>
                <div
                  className="text-sm leading-relaxed whitespace-pre-wrap text-charcoal font-modern"
                  style={{
                    fontFamily:
                      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                  }}
                >
                  {text}
                </div>
              </div>
            )}

            {/* Images Preview */}
            {images.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
                  Images ({images.length})
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className="overflow-hidden bg-white rounded-lg shadow-sm"
                    >
                      <img
                        src={image.url}
                        alt={image.alt_description || `Image ${index + 1}`}
                        className="object-cover w-full h-48"
                        loading="lazy"
                      />
                      {image.alt_description && (
                        <div className="p-3">
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {image.alt_description}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!text.trim() && images.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <p>No content to preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 sm:gap-3 sm:p-6">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm text-gray-600 transition-colors sm:text-base hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating || (!text.trim() && images.length === 0)}
            className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base text-white transition-colors rounded bg-charcoal hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Image Viewer Component
const ImageViewer = ({
  image,
  images,
  currentIndex,
  keyword,
  keywordColor,
  onClose,
  onPrevious,
  onNext,
  onNavigateToImage,
  onKeywordClick,
}) => {
  if (!image) return null;

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
                if (currentIndex > 0) {
                  const newIndex = currentIndex - 1;
                  onNavigateToImage(newIndex);
                  // Update image after navigation starts
                  setTimeout(() => {
                    onPrevious();
                  }, 50);
                }
              }}
              disabled={currentIndex === 0}
              className="transition-colors hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span>•</span>
            <button
              onClick={() => {
                if (currentIndex < images.length - 1) {
                  const newIndex = currentIndex + 1;
                  onNavigateToImage(newIndex);
                  // Update image after navigation starts
                  setTimeout(() => {
                    onNext();
                  }, 50);
                }
              }}
              disabled={currentIndex === images.length - 1}
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
                  keyword && onKeywordClick && onKeywordClick(keyword)
                }
                className="inline-flex items-center px-3 py-1 text-xs transition-colors rounded-full font-modern text-charcoal hover:brightness-95"
                style={{
                  backgroundColor:
                    keywordColor || getKeywordColor(keyword || ""),
                }}
              >
                {keyword || "N/A"}
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
                      ? `https://unsplash.com/@${image.photographer_username}`
                      : null);

                  if (profileUrl) {
                    const separator = profileUrl.includes("?") ? "&" : "?";
                    return (
                      <a
                        href={`${profileUrl}${separator}utm_source=zen-writing&utm_medium=referral`}
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

        // Get padding from computed styles (p-4 md:p-6 lg:p-8)
        const computedStyle = window.getComputedStyle(
          galleryContainer.querySelector(".absolute")
        );
        const paddingTop = parseFloat(computedStyle.paddingTop) || 24;
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 24;

        // Calculate container center (accounting for padding)
        const containerCenterX = containerRect.width / 2;
        const containerCenterY = containerRect.height / 2;

        // Use actual image dimensions
        const imageWidth = imageSize.width;
        const imageHeight = imageSize.height;

        // Calculate the center of the image in canvas coordinates
        // Add padding to account for container padding
        const imageCenterX = imagePos.x + imageWidth / 2 + paddingLeft;
        const imageCenterY = imagePos.y + imageHeight / 2 + paddingTop;

        // Calculate target position to center the image
        // With scale transformation, origin is center (0,0)
        // So we need: containerCenter - (imageCenter * scale)
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
            keyword={currentKeyword}
            keywordColor={getKeywordColor(currentKeyword || "")}
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
