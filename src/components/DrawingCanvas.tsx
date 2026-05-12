import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Undo, Redo, Download, Palette, Sparkles, Circle } from "lucide-react";
import { Prediction } from "@/hooks/useImageRecognition";

// 1. Định nghĩa khuôn mẫu Props
interface DrawingCanvasProps {
  onClose: () => void;
  onRecognize: (keyword: string) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onClose, onRecognize }) => {
  // 2. Khai báo rõ kiểu cho các Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoRecognize, setAutoRecognize] = useState<boolean>(true);
  const [brushSize, setBrushSize] = useState<number>(8);
  const [brushColor, setBrushColor] = useState<string>("#000000");
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showBrushSizePicker, setShowBrushSizePicker] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const ml5Ref = useRef<any>(null);
  const classifierRef = useRef<any>(null);
  const recognitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const brushSizePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPredictions([]);
    setError(null);
    setIsRecognizing(false);
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  // 3. Logic Resize & Setup Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const currentWidth = canvas.width;
        const currentHeight = canvas.height;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;

        if (currentWidth !== newWidth || currentHeight !== newHeight) {
          const currentImageData = canvas.toDataURL();

          canvas.width = newWidth;
          canvas.height = newHeight;

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (currentWidth > 0 && currentHeight > 0) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = currentImageData;
          }
        }

        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
    };
  }, [brushColor, brushSize]);

  // Khởi tạo lịch sử
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length > 0) return;

    const imageData = canvas.toDataURL();
    setHistory([imageData]);
    setHistoryIndex(0);
  }, [history.length]);

  // 4. Load ML5 Library (Dùng DoodleNet)
  useEffect(() => {
    const loadML5 = async () => {
      try {
        if (window.ml5) {
          ml5Ref.current = window.ml5;
        } else {
          await new Promise<void>((resolve, reject) => {
            const existingScript = document.querySelector('script[src*="ml5"]');
            if (existingScript && window.ml5) {
              ml5Ref.current = window.ml5;
              resolve();
              return;
            }

            const script = document.createElement("script");
            script.src = "https://unpkg.com/ml5@latest/dist/ml5.min.js";
            script.onload = () => {
              ml5Ref.current = window.ml5;
              resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (ml5Ref.current) {
          const ml5Instance = ml5Ref.current.default || ml5Ref.current;

          ml5Instance
            .imageClassifier("DoodleNet")
            .then((classifier: any) => {
              classifierRef.current = classifier;
              console.log("Sketch classifier initialized with DoodleNet!");
            })
            .catch((err: any) => {
              console.error("Failed to initialize classifier:", err);
              setError("Failed to initialize recognition");
            });
        }
      } catch (err) {
        console.error("Failed to load ML5:", err);
        setError("ML5.js is not available");
      }
    };

    loadML5();
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL();
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(imageData);
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const startDrawing = useCallback(
    (e: any) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      isDrawingRef.current = true;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

      if (clientX === undefined || clientY === undefined) return;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [brushColor, brushSize]
  );

  const draw = useCallback(
    (e: any) => {
      if (!isDrawingRef.current) return;
      if (e.cancelable) {
        e.preventDefault();
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

      if (clientX === undefined || clientY === undefined) return;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [brushColor, brushSize]
  );

  // 5. Logic Nhận diện AI
  const recognizeDrawing = useCallback(async () => {
    if (!classifierRef.current) {
      setError("Recognition model is still loading. Please wait...");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let hasContent = false;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (!(r === 255 && g === 255 && b === 255) && a > 0) {
        hasContent = true;
        break;
      }
    }

    if (!hasContent) {
      setError("Please draw something first");
      return;
    }

    setIsRecognizing(true);
    setError(null);
    setPredictions([]);

    try {
      const processedCanvas = document.createElement("canvas");
      processedCanvas.width = 224;
      processedCanvas.height = 224;
      const processedCtx = processedCanvas.getContext("2d");
      if (!processedCtx) return;

      processedCtx.fillStyle = "#FFFFFF";
      processedCtx.fillRect(0, 0, processedCanvas.width, processedCanvas.height);

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCtx.fillStyle = "#FFFFFF";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);

      processedCtx.drawImage(tempCanvas, 0, 0, processedCanvas.width, processedCanvas.height);

      const imageDataUrl = processedCanvas.toDataURL("image/png");
      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageDataUrl;
      });

      const results = await classifierRef.current.classify(img);

      const formattedPredictions = results.slice(0, 5).map((result: any) => ({
        label: result.label,
        confidence: (result.confidence * 100).toFixed(1),
      }));

      setPredictions(formattedPredictions);

      if (formattedPredictions.length > 0 && onRecognize) {
        const topLabel = formattedPredictions[0].label;
        const mainKeyword = topLabel.split(",")[0].trim().toLowerCase();
        onRecognize(mainKeyword);
      }
    } catch (err) {
      console.error("Recognition error:", err);
      setError("Failed to recognize drawing");
    } finally {
      setIsRecognizing(false);
    }
  }, [onRecognize]);

  const stopDrawing = useCallback(
    (e?: any) => {
      if (e && e.cancelable) {
        e.preventDefault();
      }

      if (isDrawingRef.current) {
        requestAnimationFrame(() => {
          saveToHistory();
        });
      }

      isDrawingRef.current = false;

      if (autoRecognize && classifierRef.current) {
        if (recognitionTimeoutRef.current) {
          clearTimeout(recognitionTimeoutRef.current);
        }

        recognitionTimeoutRef.current = setTimeout(() => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          let hasContent = false;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (!(r === 255 && g === 255 && b === 255) && a > 0) {
              hasContent = true;
              break;
            }
          }

          if (hasContent && !isRecognizing) {
            recognizeDrawing();
          }
        }, 500);
      }
    },
    [autoRecognize, isRecognizing, recognizeDrawing, saveToHistory]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const newIndex = historyIndex - 1;
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHistoryIndex(newIndex);
      };
      img.src = history[newIndex];
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const newIndex = historyIndex + 1;
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHistoryIndex(newIndex);
      };
      img.src = history[newIndex];
    }
  }, [history, historyIndex]);

  const saveDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `drawing-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    saveToHistory();

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    setPredictions([]);
    setError(null);
  }, [brushColor, brushSize, saveToHistory]);

  // Đóng picker khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (showColorPicker && colorPickerRef.current && !colorPickerRef.current.contains(target)) {
        setShowColorPicker(false);
      }
      if (
        showBrushSizePicker &&
        brushSizePickerRef.current &&
        !brushSizePickerRef.current.contains(target)
      ) {
        setShowBrushSizePicker(false);
      }
    };

    if (showColorPicker || showBrushSizePicker) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showColorPicker, showBrushSizePicker]);

  // Touch handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      startDrawing(e);
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      draw(e);
    };
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      stopDrawing(e);
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [startDrawing, draw, stopDrawing]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative flex h-full w-full flex-col overflow-hidden bg-white md:mx-4 md:h-auto md:max-h-[90vh] md:w-full md:max-w-4xl md:rounded-2xl md:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="from-ivory relative flex shrink-0 items-center justify-between border-b border-gray-200/50 bg-linear-to-r to-white px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600/10 md:h-10 md:w-10">
              <Sparkles className="h-4 w-4 text-red-600 md:h-5 md:w-5" />
            </div>
            <div>
              <h2 className="text-charcoal text-lg font-semibold md:text-xl">Draw & Recognize</h2>
              <p className="text-charcoal/60 hidden text-xs md:block">
                Sketch your idea and let AI find images
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal/70 rounded-lg p-2 transition-all hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 shrink-0 bg-linear-to-br from-gray-50 to-gray-100 md:h-[450px] md:flex-none">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-charcoal/20 text-center">
              <Sparkles className="mx-auto mb-2 h-8 w-8 md:h-12 md:w-12" />
              <p className="text-xs font-medium">Start drawing...</p>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 h-full w-full cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{ touchAction: "none" }}
          />
        </div>

        <div className="shrink-0 border-t border-gray-200/50 bg-linear-to-b from-white to-gray-50/50 p-3 md:p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/50 pb-2 md:mb-3 md:gap-3 md:pb-3">
            <div className="flex items-center gap-1">
              <div className="relative" ref={brushSizePickerRef}>
                <button
                  onClick={() => {
                    setShowBrushSizePicker(!showBrushSizePicker);
                    setShowColorPicker(false);
                  }}
                  className="flex items-center gap-1.5 rounded border border-gray-200 bg-white px-2 py-1.5 transition-colors hover:bg-gray-100"
                >
                  <Circle
                    className="text-charcoal h-4 w-4"
                    style={{
                      width: `${Math.max(8, brushSize * 0.8)}px`,
                      height: `${Math.max(8, brushSize * 0.8)}px`,
                    }}
                  />
                  <span className="text-charcoal min-w-[28px] text-xs font-medium">
                    {brushSize}px
                  </span>
                </button>
                <AnimatePresence>
                  {showBrushSizePicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute bottom-full left-0 z-20 min-w-[180px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
                    >
                      <div className="mb-2">
                        <label className="text-charcoal/70 mb-2 block text-xs font-medium">
                          Size: {brushSize}px
                        </label>
                        <input
                          type="range"
                          min="2"
                          max="30"
                          value={brushSize}
                          onChange={(e) => setBrushSize(Number(e.target.value))}
                          className="w-full accent-red-600"
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-2">
                        {[4, 8, 12, 16, 20].map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              setBrushSize(size);
                              setShowBrushSizePicker(false);
                            }}
                            className={`rounded p-1.5 transition-colors ${
                              brushSize === size
                                ? "bg-red-50 text-red-600"
                                : "text-charcoal hover:bg-gray-100"
                            }`}
                          >
                            <Circle
                              className="h-4 w-4"
                              style={{ width: `${size * 0.6}px`, height: `${size * 0.6}px` }}
                            />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative" ref={colorPickerRef}>
                <button
                  onClick={() => {
                    setShowColorPicker(!showColorPicker);
                    setShowBrushSizePicker(false);
                  }}
                  className="flex items-center gap-1.5 rounded border border-gray-200 bg-white px-2 py-1.5 transition-colors hover:bg-gray-100"
                >
                  <div
                    className="h-4 w-4 rounded border border-gray-300"
                    style={{ backgroundColor: brushColor }}
                  />
                  <Palette className="text-charcoal h-4 w-4" />
                </button>
                <AnimatePresence>
                  {showColorPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute bottom-full left-0 z-20 min-w-[200px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
                    >
                      <input
                        type="color"
                        value={brushColor}
                        onChange={(e) => setBrushColor(e.target.value)}
                        className="mb-3 h-8 w-full cursor-pointer rounded border border-gray-200"
                      />
                      <div className="grid grid-cols-8 gap-1.5">
                        {[
                          "#000000",
                          "#FFFFFF",
                          "#FF0000",
                          "#00FF00",
                          "#0000FF",
                          "#FFFF00",
                          "#FF00FF",
                          "#00FFFF",
                          "#FFA500",
                          "#800080",
                          "#FFC0CB",
                          "#A52A2A",
                          "#808080",
                          "#FFD700",
                          "#4B0082",
                          "#FF6347",
                        ].map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              setBrushColor(color);
                              setShowColorPicker(false);
                            }}
                            className={`h-6 w-6 rounded border transition-all hover:scale-110 ${brushColor === color ? "scale-110 ring-2 ring-red-500 ring-offset-1" : "border-gray-300"}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="text-charcoal/70 rounded-lg p-2 hover:text-red-600 disabled:opacity-30"
              >
                <Undo className="h-4 w-4" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="text-charcoal/70 rounded-lg p-2 hover:text-red-600 disabled:opacity-30"
              >
                <Redo className="h-4 w-4" />
              </button>
              <button
                onClick={saveDrawing}
                className="text-charcoal/70 rounded-lg p-2 hover:text-red-600"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                onClick={clearCanvas}
                className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
              <button
                onClick={recognizeDrawing}
                disabled={isRecognizing}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isRecognizing ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                  {isRecognizing ? "Recognizing..." : "Recognize"}
                </span>
              </button>
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-gray-100">
              <input
                type="checkbox"
                checked={autoRecognize}
                onChange={(e) => setAutoRecognize(e.target.checked)}
                className="h-3.5 w-3.5 rounded text-red-600"
              />
              <span className="text-charcoal font-medium">Auto-recognize</span>
            </label>
          </div>
        </div>

        <AnimatePresence>
          {(predictions.length > 0 || error) && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="max-h-48 overflow-y-auto border-t border-gray-200 bg-white"
            >
              <div className="p-4">
                {error && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}
                {predictions.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-red-600" />
                      <h3 className="text-charcoal text-sm font-semibold uppercase">
                        Recognition Results
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {predictions.map((prediction, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                        >
                          <span className="text-sm font-medium capitalize">{prediction.label}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 rounded-full bg-gray-200">
                              <div
                                className="h-full rounded-full bg-red-600"
                                style={{ width: `${prediction.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold">{prediction.confidence}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
