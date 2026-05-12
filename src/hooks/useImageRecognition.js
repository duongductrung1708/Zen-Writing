import { useState, useEffect, useRef } from "react";

// TẠO KHÓA BẢO VỆ GLOBAL Ở NGOÀI HOOK
// Để React Strict Mode (chạy useEffect 2 lần) không tải model 2 lần làm sập TensorFlow
let globalClassifierPromise = null;

export const useImageRecognition = (imageUrl, enabled = true) => {
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModelReady, setIsModelReady] = useState(false);
  
  const classifierRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !enabled) return;

    const initML5 = async () => {
      try {
        if (!window.ml5) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/ml5@latest/dist/ml5.min.js";
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load ML5"));
            document.head.appendChild(script);
          });
        }

        // Kỹ thuật Lock: Nếu chưa có ai gọi tải AI, thì mình gọi và lưu Promise lại
        if (!globalClassifierPromise) {
          globalClassifierPromise = window.ml5.imageClassifier("MobileNet");
        }

        // Chờ tải xong (Nếu chạy lần 2 do Strict Mode, nó chỉ việc đứng chờ Promise cũ hoàn thành)
        classifierRef.current = await globalClassifierPromise;
        setIsModelReady(true);
        
      } catch (err) {
        console.error("ML5 Init Error:", err);
        setError("Không thể tải hệ thống nhận diện AI.");
      }
    };

    initML5();
  }, [enabled]);

  useEffect(() => {
    const recognizeImage = async () => {
      if (!imageUrl || !enabled || !isModelReady || !classifierRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        const img = new Image();
        
        img.onload = async () => {
          try {
            const results = await classifierRef.current.classify(img);
            
            const formattedPredictions = results.slice(0, 3).map((result) => ({
              label: result.label,
              confidence: (result.confidence * 100).toFixed(1),
            }));

            setPredictions(formattedPredictions);
          } catch (err) {
            setError("Lỗi trong quá trình phân tích ảnh.");
          } finally {
            setIsLoading(false);
          }
        };

        img.onerror = () => {
          setError("Không thể đọc được dữ liệu ảnh.");
          setIsLoading(false);
        };

        img.src = imageUrl;
      } catch (err) {
        setError("Lỗi thiết lập hình ảnh.");
        setIsLoading(false);
      }
    };

    recognizeImage();
  }, [imageUrl, enabled, isModelReady]);

  return { predictions, isLoading, error, isModelReady };
};