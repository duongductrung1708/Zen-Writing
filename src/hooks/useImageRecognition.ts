import { useState, useEffect, useRef } from "react";

// 1. "Làm giấy khai sinh" cho thư viện ML5 để TS không báo lỗi window.ml5
declare global {
  interface Window {
    ml5: any;
  }
}

// 2. Định nghĩa khuôn mẫu cho Kết quả dự đoán
export interface Prediction {
  label: string;
  confidence: string;
}

// 3. Định nghĩa khuôn mẫu cho kết quả trả về của toàn bộ Hook
export interface ImageRecognitionResult {
  predictions: Prediction[];
  isLoading: boolean;
  error: string | null;
  isModelReady: boolean;
}

// TẠO KHÓA BẢO VỆ GLOBAL Ở NGOÀI HOOK
// Ép kiểu cho cỗ máy AI là một Promise
let globalClassifierPromise: Promise<any> | null = null;

export const useImageRecognition = (
  imageUrl: string | null,
  enabled: boolean = true
): ImageRecognitionResult => {
  // 4. Bơm kiểu dữ liệu vào các State
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);

  // Dùng any cho bộ não AI vì cấu trúc bên trong nó rất phức tạp
  const classifierRef = useRef<any>(null);

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

            // 5. Định danh biến result trong vòng lặp map
            const formattedPredictions = results.slice(0, 3).map((result: any) => ({
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
