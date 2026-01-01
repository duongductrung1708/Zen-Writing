// Random layout helper - calculates random positions with collision detection
export const calculateMasonryLayout = (images, imageSizes) => {
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

