// Định nghĩa các khuôn mẫu (Interface) để tái sử dụng
export interface ImageSize {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

// Hình chữ nhật (Rect) sẽ bao gồm cả tọa độ và kích thước
interface Rect extends Position, ImageSize {}

export const calculateMasonryLayout = (
  images: any[], // Tạm dùng any[], sẽ thay bằng ZenImage sau
  imageSizes: ImageSize[]
): Position[] => {
  const positions: Position[] = new Array(images.length);
  const placedRects: Rect[] = []; // Theo dõi các ảnh đã đặt để check va chạm
  const PADDING = 80; // Khoảng không gian "thở" giữa các bức ảnh chuẩn Zen

  // Lấy điểm neo trung tâm (Bắt đầu thả ảnh từ giữa khu vực Gallery)
  const startX = typeof window !== "undefined" ? window.innerWidth / 4 : 400;
  const startY = typeof window !== "undefined" ? window.innerHeight / 4 : 300;

  // Giữ lại thuật toán tối ưu của bạn: Ưu tiên xếp ảnh to (diện tích lớn) trước
  const imagesWithSizes = images
    .map((image, index) => ({
      originalIndex: index, // Giữ index gốc để map đúng với state của React
      size: imageSizes[index] || { width: 300, height: 400 },
      area: (imageSizes[index]?.width || 300) * (imageSizes[index]?.height || 400),
    }))
    .sort((a, b) => b.area - a.area);

  // Hàm kiểm tra va chạm (Đã tích hợp PADDING)
  const checkCollision = (x: number, y: number, width: number, height: number): boolean => {
    return placedRects.some((rect) => {
      // Logic: Nếu KHÔNG nằm hoàn toàn ở trái, phải, trên, hoặc dưới -> Có va chạm
      const hasHorizontalOverlap = !(
        x + width + PADDING <= rect.x || x >= rect.x + rect.width + PADDING
      );
      const hasVerticalOverlap = !(
        y + height + PADDING <= rect.y || y >= rect.y + rect.height + PADDING
      );
      return hasHorizontalOverlap && hasVerticalOverlap;
    });
  };

  // Vòng lặp thả ảnh
  imagesWithSizes.forEach((item) => {
    const { size, originalIndex } = item;
    let placed = false;
    let attempts = 0;
    let radius = 20; // Bán kính dò tìm ban đầu rất nhỏ để tụ quanh tâm

    // Dò tìm vị trí trống theo đường xoắn ốc lan dần ra xa
    while (!placed && attempts < 2000) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;

      const targetX = startX + r * Math.cos(angle);
      const targetY = startY + r * Math.sin(angle);

      if (!checkCollision(targetX, targetY, size.width, size.height)) {
        // Chốt vị trí và lưu vào mảng dựa trên index gốc
        positions[originalIndex] = { x: targetX, y: targetY };
        placedRects.push({
          x: targetX,
          y: targetY,
          width: size.width,
          height: size.height,
        });
        placed = true;
      } else {
        // Nếu đè lên ảnh khác, tăng số lần thử và nới rộng bán kính
        attempts++;
        if (attempts % 15 === 0) {
          radius += 50;
        }
      }
    }

    // Fallback an toàn: Nếu dò 2000 lần vẫn kẹt (rất hiếm), xếp nối tiếp xuống dưới
    if (!placed) {
      const fallbackX = startX + originalIndex * 150;
      const fallbackY = startY + originalIndex * 150;
      positions[originalIndex] = { x: fallbackX, y: fallbackY };
      placedRects.push({ x: fallbackX, y: fallbackY, width: size.width, height: size.height });
    }
  });

  return positions;
};
