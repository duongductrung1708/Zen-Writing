import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Undo, Redo, Download, Palette, Sparkles, Circle } from "lucide-react";
import { useCanvasDrawing } from "@/hooks/useCanvasDrawing";
import { useDoodleRecognition } from "@/hooks/useMobileNetRecognition";

interface DrawingCanvasProps {
  onClose: () => void;
  onRecognize: (keyword: string) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onClose, onRecognize }) => {
  const {
    canvasRef,
    brushSize,
    setBrushSize,
    brushColor,
    setBrushColor,
    historyIndex,
    historyLength,
    startDrawing,
    draw,
    stopDrawing: baseStopDrawing,
    undo,
    redo,
    clearCanvas: baseClearCanvas,
    saveDrawing,
  } = useCanvasDrawing();

  const {
    isRecognizing,
    predictions,
    error,
    setPredictions,
    setError,
    autoRecognize,
    setAutoRecognize,
    recognizeDrawing,
    triggerAutoRecognize,
  } = useDoodleRecognition(canvasRef, onRecognize);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBrushSizePicker, setShowBrushSizePicker] = useState(false);

  const colorPickerRef = useRef<HTMLDivElement>(null);
  const brushSizePickerRef = useRef<HTMLDivElement>(null);

  // Nối 2 Hook lại với nhau: Ngừng vẽ thì kích hoạt AI
  const handleStopDrawing = (e?: any) => {
    baseStopDrawing(e);
    triggerAutoRecognize();
  };

  const handleClearCanvas = () => {
    baseClearCanvas();
    setPredictions([]);
    setError(null);
  };

  // Đóng Menu nổi khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (showColorPicker && colorPickerRef.current && !colorPickerRef.current.contains(target))
        setShowColorPicker(false);
      if (
        showBrushSizePicker &&
        brushSizePickerRef.current &&
        !brushSizePickerRef.current.contains(target)
      )
        setShowBrushSizePicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showColorPicker, showBrushSizePicker]);

  // Gắn sự kiện cảm ứng (Touch) cho Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      startDrawing(e);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      draw(e);
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleStopDrawing(e);
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [startDrawing, draw, handleStopDrawing, canvasRef]);

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
        {/* Header */}
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

        {/* Khung Canvas */}
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
            onMouseUp={handleStopDrawing}
            onMouseLeave={handleStopDrawing}
            style={{ touchAction: "none" }}
          />
        </div>

        {/* Thanh công cụ (Toolbar) */}
        <div className="shrink-0 border-t border-gray-200/50 bg-linear-to-b from-white to-gray-50/50 p-3 md:p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/50 pb-2 md:mb-3 md:gap-3 md:pb-3">
            <div className="flex items-center gap-1">
              {/* Nút chọn nét cọ */}
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
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-full left-0 z-20 mb-1 min-w-[180px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
                    >
                      <input
                        type="range"
                        min="2"
                        max="30"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="mb-2 w-full accent-red-600"
                      />
                      <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-2">
                        {[4, 8, 12, 16, 20].map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setBrushSize(s);
                              setShowBrushSizePicker(false);
                            }}
                            className={`rounded p-1.5 ${brushSize === s ? "bg-red-50 text-red-600" : "hover:bg-gray-100"}`}
                          >
                            <Circle style={{ width: `${s * 0.6}px`, height: `${s * 0.6}px` }} />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Nút chọn màu */}
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
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-full left-0 z-20 mb-1 min-w-[200px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
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
                        ].map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              setBrushColor(color);
                              setShowColorPicker(false);
                            }}
                            className={`h-6 w-6 rounded border ${brushColor === color ? "scale-110 ring-2 ring-red-500" : "border-gray-300"}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Các nút điều hướng File */}
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
                disabled={historyIndex >= historyLength - 1}
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
                onClick={handleClearCanvas}
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

        {/* Kết quả AI */}
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
                      {predictions.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                        >
                          <span className="text-sm font-medium capitalize">{p.label}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 rounded-full bg-gray-200">
                              <div
                                className="h-full rounded-full bg-red-600"
                                style={{ width: `${p.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold">{p.confidence}%</span>
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
