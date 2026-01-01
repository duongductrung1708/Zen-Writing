import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  RotateCcw,
  Undo,
  Redo,
  Download,
  Palette,
  Sparkles,
  Circle,
} from "lucide-react";

export const DrawingCanvas = ({ onClose, onRecognize }) => {
  const canvasRef = useRef(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [error, setError] = useState(null);
  const [autoRecognize, setAutoRecognize] = useState(true);
  const [brushSize, setBrushSize] = useState(8);
  const [brushColor, setBrushColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBrushSizePicker, setShowBrushSizePicker] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const ml5Ref = useRef(null);
  const classifierRef = useRef(null);
  const recognitionTimeoutRef = useRef(null);
  const isDrawingRef = useRef(false);
  const colorPickerRef = useRef(null);
  const brushSizePickerRef = useRef(null);

  useEffect(() => {
    setPredictions([]);
    setError(null);
    setIsRecognizing(false);
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length > 0) return;

    const imageData = canvas.toDataURL();
    setHistory([imageData]);
    setHistoryIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadML5 = async () => {
      try {
        try {
          const ml5Module = await import("ml5");
          ml5Ref.current = ml5Module.default || ml5Module.ml5 || ml5Module;
        } catch (importError) {
          if (window.ml5) {
            ml5Ref.current = window.ml5;
          } else {
            await new Promise((resolve, reject) => {
              const existingScript =
                document.querySelector('script[src*="ml5"]');
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
        }

        if (ml5Ref.current) {
          const ml5Instance = ml5Ref.current.default || ml5Ref.current;

          ml5Instance
            .imageClassifier("MobileNet")
            .then((classifier) => {
              classifierRef.current = classifier;
              console.log("Sketch classifier initialized");
            })
            .catch((err) => {
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
    (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      isDrawingRef.current = true;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

      if (!clientX || !clientY) return;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const ctx = canvas.getContext("2d");
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
    (e) => {
      if (!isDrawingRef.current) return;
      if (e.cancelable) {
        e.preventDefault();
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

      if (!clientX || !clientY) return;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [brushColor, brushSize]
  );

  const recognizeDrawing = useCallback(async () => {
    if (!classifierRef.current) {
      setError("Recognition model is still loading. Please wait...");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
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

      processedCtx.fillStyle = "#FFFFFF";
      processedCtx.fillRect(
        0,
        0,
        processedCanvas.width,
        processedCanvas.height
      );

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");

      tempCtx.fillStyle = "#FFFFFF";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);

      processedCtx.drawImage(
        tempCanvas,
        0,
        0,
        processedCanvas.width,
        processedCanvas.height
      );

      const imageDataUrl = processedCanvas.toDataURL("image/png");
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageDataUrl;
      });

      const results = await classifierRef.current.classify(img);

      const formattedPredictions = results.slice(0, 5).map((result) => ({
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
    (e) => {
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
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    setPredictions([]);
    setError(null);
  }, [brushColor, brushSize, saveToHistory]);

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showColorPicker && colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
      if (showBrushSizePicker && brushSizePickerRef.current && !brushSizePickerRef.current.contains(e.target)) {
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e) => {
      e.preventDefault();
      startDrawing(e);
    };
    const handleTouchMove = (e) => {
      e.preventDefault();
      draw(e);
    };
    const handleTouchEnd = (e) => {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm md:bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full h-full md:w-full md:max-w-4xl md:h-auto md:mx-4 md:max-h-[90vh] overflow-hidden bg-white md:shadow-2xl md:rounded-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center justify-between flex-shrink-0 px-4 py-3 border-b md:px-6 md:py-4 bg-gradient-to-r from-ivory to-white border-gray-200/50">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full md:w-10 md:h-10 bg-red-600/10">
              <Sparkles className="w-4 h-4 text-red-600 md:w-5 md:h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold md:text-xl text-charcoal">
                Draw & Recognize
              </h2>
              <p className="hidden text-xs md:block text-charcoal/60">
                Sketch your idea and let AI find images
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 transition-all rounded-lg text-charcoal/70 hover:text-red-600 hover:bg-red-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex-1 md:h-[450px] md:flex-none flex-shrink-0 min-h-0 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-charcoal/20">
              <Sparkles className="w-8 h-8 mx-auto mb-2 md:w-12 md:h-12" />
              <p className="text-xs font-medium">Start drawing...</p>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 w-full h-full cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{ touchAction: "none" }}
          />
        </div>

        <div className="flex-shrink-0 p-3 border-t md:p-4 bg-gradient-to-b from-white to-gray-50/50 border-gray-200/50">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b md:gap-3 md:pb-3 md:mb-3 border-gray-200/50">
            <div className="flex items-center gap-1">
              {/* Brush Size - Compact like Google Docs */}
              <div className="relative" ref={brushSizePickerRef}>
                <button
                  onClick={() => {
                    setShowBrushSizePicker(!showBrushSizePicker);
                    setShowColorPicker(false);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors border border-gray-200 bg-white"
                  title={`Brush size: ${brushSize}px`}
                >
                  <Circle className="w-4 h-4 text-charcoal" style={{ width: `${Math.max(8, brushSize * 0.8)}px`, height: `${Math.max(8, brushSize * 0.8)}px` }} />
                  <span className="text-xs font-medium text-charcoal min-w-[28px]">{brushSize}px</span>
                </button>
                <AnimatePresence>
                  {showBrushSizePicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 z-20 mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-lg bottom-full min-w-[180px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="mb-2">
                        <label className="block mb-2 text-xs font-medium text-charcoal/70">Size: {brushSize}px</label>
                        <input
                          type="range"
                          min="2"
                          max="30"
                          value={brushSize}
                          onChange={(e) => setBrushSize(Number(e.target.value))}
                          className="w-full accent-red-600"
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100">
                        {[4, 8, 12, 16, 20].map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              setBrushSize(size);
                              setShowBrushSizePicker(false);
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              brushSize === size ? "bg-red-50 text-red-600" : "hover:bg-gray-100 text-charcoal"
                            }`}
                            title={`${size}px`}
                          >
                            <Circle className="w-4 h-4" style={{ width: `${size * 0.6}px`, height: `${size * 0.6}px` }} />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Color Picker - Compact like Google Docs */}
              <div className="relative" ref={colorPickerRef}>
                <button
                  onClick={() => {
                    setShowColorPicker(!showColorPicker);
                    setShowBrushSizePicker(false);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors border border-gray-200 bg-white"
                  title="Choose color"
                >
                  <div
                    className="w-4 h-4 border border-gray-300 rounded"
                    style={{ backgroundColor: brushColor }}
                  />
                  <Palette className="w-4 h-4 text-charcoal" />
                </button>
                <AnimatePresence>
                  {showColorPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 z-20 mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-lg bottom-full min-w-[200px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Custom Color Input */}
                      <div className="mb-3">
                        <input
                          type="color"
                          value={brushColor}
                          onChange={(e) => {
                            setBrushColor(e.target.value);
                          }}
                          className="w-full h-8 border border-gray-200 rounded cursor-pointer"
                        />
                      </div>
                      
                      {/* Quick Color Presets */}
                      <div className="grid grid-cols-8 gap-1.5">
                        {[
                          "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF",
                          "#FFA500", "#800080", "#FFC0CB", "#A52A2A", "#808080", "#FFD700", "#4B0082", "#FF6347",
                        ].map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              setBrushColor(color);
                              setShowColorPicker(false);
                            }}
                            className={`w-6 h-6 rounded border transition-all hover:scale-110 ${
                              brushColor === color
                                ? "ring-2 ring-red-500 ring-offset-1 scale-110"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                            style={{
                              backgroundColor: color,
                              borderColor: color === "#FFFFFF" ? "#d1d5db" : undefined,
                            }}
                            title={color}
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
                className="p-2 md:p-2.5 transition-all rounded-lg text-charcoal/70 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                title="Undo"
              >
                <Undo className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 md:p-2.5 transition-all rounded-lg text-charcoal/70 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                title="Redo"
              >
                <Redo className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <button
                onClick={saveDrawing}
                className="p-2 md:p-2.5 transition-all rounded-lg text-charcoal/70 hover:text-red-600 hover:bg-red-50"
                title="Save drawing"
              >
                <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          </div>

          {/* Bottom row: Drawing controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                onClick={clearCanvas}
                className="flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-all bg-gray-100 rounded-lg text-charcoal hover:bg-gray-200 hover:shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
              <button
                onClick={recognizeDrawing}
                disabled={isRecognizing}
                className="flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-white transition-all bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {isRecognizing ? (
                  <>
                    <div className="w-3 h-3 md:w-3.5 md:h-3.5 border-2 border-white rounded-full border-t-transparent animate-spin" />
                    <span className="hidden sm:inline">Recognizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Recognize</span>
                  </>
                )}
              </button>
            </div>
            <label className="flex items-center gap-1.5 md:gap-2 px-2 py-1.5 text-xs transition-colors rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={autoRecognize}
                onChange={(e) => setAutoRecognize(e.target.checked)}
                className="w-3.5 h-3.5 text-red-600 rounded focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              />
              <span className="hidden text-xs font-medium text-charcoal sm:inline">
                Auto-recognize
              </span>
              <span className="text-xs font-medium text-charcoal sm:hidden">
                Auto
              </span>
            </label>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {(predictions.length > 0 || error) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-y-auto border-t border-gray-200/50 bg-gradient-to-b from-white to-gray-50/30 max-h-48"
            >
              <div className="p-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 mb-4 text-sm font-medium text-red-700 border border-red-200 rounded-lg bg-red-50"
                  >
                    {error}
                  </motion.div>
                )}
                {predictions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-red-600" />
                      <h3 className="text-sm font-semibold tracking-wide uppercase text-charcoal">
                        Recognition Results
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {predictions.map((prediction, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between p-3 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md"
                        >
                          <span className="text-sm font-medium capitalize text-charcoal">
                            {prediction.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 overflow-hidden bg-gray-200 rounded-full">
                              <div
                                className="h-full transition-all rounded-full bg-gradient-to-r from-red-500 to-red-600"
                                style={{ width: `${prediction.confidence}%` }}
                              />
                            </div>
                            <span className="w-12 text-xs font-semibold text-right text-charcoal/70">
                              {prediction.confidence}%
                            </span>
                          </div>
                        </motion.div>
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
