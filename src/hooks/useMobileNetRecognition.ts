import { useState, useRef, useEffect, useCallback, RefObject } from "react";
import { Prediction } from "./useImageRecognition";

export const useDoodleRecognition = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  onRecognize?: (keyword: string) => void
) => {
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoRecognize, setAutoRecognize] = useState<boolean>(true);

  const ml5Ref = useRef<any>(null);
  const classifierRef = useRef<any>(null);
  const recognitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Khởi tạo ML5
  useEffect(() => {
    const loadML5 = async () => {
      try {
        if (window.ml5) {
          ml5Ref.current = window.ml5;
        } else {
          await new Promise<void>((resolve, reject) => {
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
          ml5Instance.imageClassifier("MobileNet").then((classifier: any) => {
            classifierRef.current = classifier;
          });
        }
      } catch (err) {
        setError("ML5.js is not available");
      }
    };
    loadML5();

    return () => {
      if (recognitionTimeoutRef.current) clearTimeout(recognitionTimeoutRef.current);
    };
  }, []);

  const recognizeDrawing = useCallback(async () => {
    if (!classifierRef.current) {
      setError("Model is loading...");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Kiểm tra xem canvas có trống không
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasContent = false;
    for (let i = 0; i < imageData.length; i += 4) {
      if (
        !(imageData[i] === 255 && imageData[i + 1] === 255 && imageData[i + 2] === 255) &&
        imageData[i + 3] > 0
      ) {
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
      const pCtx = processedCanvas.getContext("2d");
      if (!pCtx) return;

      pCtx.fillStyle = "#FFFFFF";
      pCtx.fillRect(0, 0, 224, 224);
      pCtx.drawImage(canvas, 0, 0, 224, 224);

      // Nhận diện thẳng từ Canvas
      const results = await classifierRef.current.classify(processedCanvas);
      const formatted = results.slice(0, 5).map((r: any) => ({
        label: r.label,
        confidence: (r.confidence * 100).toFixed(1),
      }));

      setPredictions(formatted);
      if (formatted.length > 0 && onRecognize) {
        onRecognize(formatted[0].label.split(",")[0].trim().toLowerCase());
      }
    } catch (err) {
      setError("Failed to recognize drawing");
    } finally {
      setIsRecognizing(false);
    }
  }, [canvasRef, onRecognize]);

  const triggerAutoRecognize = useCallback(() => {
    if (!autoRecognize || !classifierRef.current) return;
    if (recognitionTimeoutRef.current) clearTimeout(recognitionTimeoutRef.current);

    recognitionTimeoutRef.current = setTimeout(() => {
      recognizeDrawing();
    }, 500);
  }, [autoRecognize, recognizeDrawing]);

  return {
    isRecognizing,
    predictions,
    error,
    setPredictions,
    setError,
    autoRecognize,
    setAutoRecognize,
    recognizeDrawing,
    triggerAutoRecognize,
  };
};
