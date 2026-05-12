import { create } from "zustand";
// Tận dụng luôn các Interface đã tạo ở file layout
import { Position, ImageSize } from "@/utils/layout";

// 1. Định nghĩa khuôn mẫu cho bức ảnh (Cực kỳ quan trọng)
export interface ZenImage {
  id: string;
  url: string;
  keyword: string;
  keywordColor?: string;
  alt_description?: string;
  photographer_name?: string;
  photographer_username?: string;
  photographer_profile?: string;
  download_location?: string;
}

// 2. Định nghĩa khuôn mẫu cho Thông báo
export interface NotificationType {
  message: string;
  type: "info" | "success" | "error" | "warning";
}

// 3. Khai báo TẤT CẢ các biến và hàm có trong Store
interface WriterState {
  text: string;
  setText: (updater: string | ((prev: string) => string)) => void;

  images: ZenImage[];
  setImages: (updater: ZenImage[] | ((prev: ZenImage[]) => ZenImage[])) => void;

  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;

  notification: NotificationType | null;
  setNotification: (notification: NotificationType | null) => void;

  panScale: number;
  setPanScale: (updater: number | ((prev: number) => number)) => void;

  panPosition: Position;
  setPanPosition: (updater: Position | ((prev: Position) => Position)) => void;

  selectedImage: ZenImage | null;
  selectedImageIndex: number;
  setSelectedImage: (selectedImage: ZenImage | null, selectedImageIndex?: number) => void;
  setSelectedImageIndex: (selectedImageIndex: number) => void;

  currentKeyword: string;
  setCurrentKeyword: (currentKeyword: string) => void;

  keywordsMap: Record<string, string>;
  setKeywordsMap: (
    updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => void;

  showExamples: boolean;
  setShowExamples: (updater: boolean | ((prev: boolean) => boolean)) => void;

  showPDFPreview: boolean;
  setShowPDFPreview: (showPDFPreview: boolean) => void;

  showDrawingCanvas: boolean;
  setShowDrawingCanvas: (showDrawingCanvas: boolean) => void;

  imagePositions: Position[];
  setImagePositions: (imagePositions: Position[]) => void;

  imageSizes: Record<string, ImageSize>;
  setImageSizes: (
    updater:
      | Record<string, ImageSize>
      | ((prev: Record<string, ImageSize>) => Record<string, ImageSize>)
  ) => void;
}

// 4. Khởi tạo Store với kiểu WriterState
export const useWriterStore = create<WriterState>((set) => ({
  text: "",
  // Đã sửa Bug: Hỗ trợ truyền hàm (prevText) => newText
  setText: (updater) =>
    set((state) => ({
      text: typeof updater === "function" ? updater(state.text) : updater,
    })),

  images: [],
  setImages: (updater) =>
    set((state) => ({
      images: typeof updater === "function" ? updater(state.images) : updater,
    })),

  isSearching: false,
  setIsSearching: (isSearching) => set({ isSearching }),

  notification: null,
  setNotification: (notification) => set({ notification }),

  panScale: 1,
  setPanScale: (updater) =>
    set((state) => ({
      panScale: typeof updater === "function" ? updater(state.panScale) : updater,
    })),

  panPosition: { x: 0, y: 0 },
  setPanPosition: (updater) =>
    set((state) => ({
      panPosition: typeof updater === "function" ? updater(state.panPosition) : updater,
    })),

  selectedImage: null,
  selectedImageIndex: -1,
  setSelectedImage: (selectedImage, selectedImageIndex = -1) =>
    set({ selectedImage, selectedImageIndex }),

  setSelectedImageIndex: (selectedImageIndex) =>
    set((state) => ({
      selectedImageIndex,
      selectedImage:
        selectedImageIndex >= 0 && selectedImageIndex < state.images.length
          ? state.images[selectedImageIndex]
          : null,
    })),

  currentKeyword: "",
  setCurrentKeyword: (currentKeyword) => set({ currentKeyword }),

  keywordsMap: {},
  setKeywordsMap: (updater) =>
    set((state) => ({
      keywordsMap: typeof updater === "function" ? updater(state.keywordsMap) : updater || {},
    })),

  showExamples: false,
  // Đã sửa Bug: Hỗ trợ truyền hàm (prev) => !prev
  setShowExamples: (updater) =>
    set((state) => ({
      showExamples: typeof updater === "function" ? updater(state.showExamples) : updater,
    })),

  showPDFPreview: false,
  setShowPDFPreview: (showPDFPreview) => set({ showPDFPreview }),

  showDrawingCanvas: false,
  setShowDrawingCanvas: (showDrawingCanvas) => set({ showDrawingCanvas }),

  imagePositions: [],
  setImagePositions: (imagePositions) => set({ imagePositions }),

  imageSizes: {},
  setImageSizes: (updater) =>
    set((state) => ({
      imageSizes: typeof updater === "function" ? updater(state.imageSizes) : updater || {},
    })),
}));
