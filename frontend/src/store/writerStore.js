import { create } from "zustand";

export const useWriterStore = create((set) => ({
  text: "",
  setText: (text) => set({ text }),

  images: [],
  setImages: (images) => set({ images }),

  isSearching: false,
  setIsSearching: (isSearching) => set({ isSearching }),

  notification: null,
  setNotification: (notification) => set({ notification }),

  panScale: 1,
  setPanScale: (updater) =>
    set((state) => ({
      panScale:
        typeof updater === "function" ? updater(state.panScale) : updater,
    })),

  panPosition: { x: 0, y: 0 },
  setPanPosition: (updater) =>
    set((state) => ({
      panPosition:
        typeof updater === "function" ? updater(state.panPosition) : updater,
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
      keywordsMap:
        typeof updater === "function"
          ? updater(state.keywordsMap)
          : updater || {},
    })),

  showExamples: false,
  setShowExamples: (showExamples) => set({ showExamples }),

  showPDFPreview: false,
  setShowPDFPreview: (showPDFPreview) => set({ showPDFPreview }),

  showDrawingCanvas: false,
  setShowDrawingCanvas: (showDrawingCanvas) => set({ showDrawingCanvas }),

  imagePositions: [],
  setImagePositions: (imagePositions) => set({ imagePositions }),

  imageSizes: {},
  setImageSizes: (updater) =>
    set((state) => ({
      imageSizes:
        typeof updater === "function" ? updater(state.imageSizes) : updater || {},
    })),
}));

