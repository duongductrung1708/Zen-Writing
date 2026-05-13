import { useRef, useState, useCallback, useEffect, RefObject } from "react";

export const useCanvasDrawing = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);

  const [brushSize, setBrushSize] = useState<number>(8);
  const [brushColor, setBrushColor] = useState<string>("#000000");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Resize Canvas khi đổi kích thước màn hình
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
            img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [brushColor, brushSize]);

  // Lưu frame đầu tiên vào lịch sử
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length > 0) return;
    setHistory([canvas.toDataURL()]);
    setHistoryIndex(0);
  }, [history.length]);

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

  const startDrawing = useCallback((e: any) => {
    if (e.cancelable) e.preventDefault();
    isDrawingRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    if (clientX === undefined || clientY === undefined) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  }, [brushColor, brushSize]);

  const draw = useCallback((e: any) => {
    if (!isDrawingRef.current) return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    if (clientX === undefined || clientY === undefined) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  }, []);

  const stopDrawing = useCallback((e?: any) => {
    if (e && e.cancelable) e.preventDefault();
    if (isDrawingRef.current) {
      requestAnimationFrame(() => saveToHistory());
    }
    isDrawingRef.current = false;
  }, [saveToHistory]);

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
  }, [brushColor, brushSize, saveToHistory]);

  const saveDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `drawing-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  return {
    canvasRef,
    brushSize, setBrushSize,
    brushColor, setBrushColor,
    historyIndex, historyLength: history.length,
    startDrawing, draw, stopDrawing,
    undo, redo, clearCanvas, saveDrawing
  };
};