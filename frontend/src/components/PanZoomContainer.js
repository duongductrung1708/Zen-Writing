import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

// Pan Zoom Container Component
export const PanZoomContainer = ({
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

