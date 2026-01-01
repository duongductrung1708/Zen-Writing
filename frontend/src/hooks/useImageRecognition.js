import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for image recognition using ML5.js
 * @param {string} imageUrl - URL of the image to recognize
 * @param {boolean} enabled - Whether recognition is enabled
 * @returns {object} - Recognition results and loading state
 */
export const useImageRecognition = (imageUrl, enabled = true) => {
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const classifierRef = useRef(null);
  const imageRef = useRef(null);
  const ml5Ref = useRef(null);

  useEffect(() => {
    // Load ML5.js dynamically
    const loadML5 = async () => {
      try {
        // Try to import from npm package first
        try {
          const ml5Module = await import("ml5");
          // ML5 v1.x exports as default or named export
          ml5Ref.current = ml5Module.default || ml5Module.ml5 || ml5Module;
        } catch (importError) {
          // If npm import fails, try loading from CDN
          console.log("ML5 npm package not found, trying CDN...");
          if (window.ml5) {
            ml5Ref.current = window.ml5;
          } else {
            // Load from CDN
            await new Promise((resolve, reject) => {
              // Check if script already exists
              const existingScript = document.querySelector('script[src*="ml5"]');
              if (existingScript) {
                if (window.ml5) {
                  ml5Ref.current = window.ml5;
                  resolve();
                  return;
                }
                existingScript.addEventListener("load", () => {
                  ml5Ref.current = window.ml5;
                  resolve();
                });
                return;
              }

              const script = document.createElement("script");
              script.src = "https://unpkg.com/ml5@latest/dist/ml5.min.js";
              script.onload = () => {
                ml5Ref.current = window.ml5;
                resolve();
              };
              script.onerror = () => {
                reject(new Error("Failed to load ML5 from CDN"));
              };
              document.head.appendChild(script);
            });
          }
        }

        // Initialize ML5 classifier
        if (ml5Ref.current) {
          // ML5 v1.x API: ml5.imageClassifier() or ml5.imageClassifier('MobileNet')
          const ml5Instance = ml5Ref.current.default || ml5Ref.current;
          
          ml5Instance.imageClassifier("MobileNet")
            .then((classifier) => {
              classifierRef.current = classifier;
            })
            .catch((err) => {
              console.error("Failed to initialize ML5 classifier:", err);
              setError("Failed to initialize image recognition");
            });
        }
      } catch (err) {
        console.error("Failed to load ML5:", err);
        setError("ML5.js is not available. Please install ml5 package or ensure CDN is accessible.");
      }
    };

    if (enabled) {
      loadML5();
    }

    return () => {
      classifierRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    const recognizeImage = async () => {
      if (!imageUrl || !enabled || !classifierRef.current) {
        return;
      }

      setIsLoading(true);
      setError(null);
      setPredictions([]);

      try {
        // Create an image element to load the image
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = async () => {
          try {
            // Classify the image
            const results = await classifierRef.current.classify(img);
            
            // Format results: get top 5 predictions
            const formattedPredictions = results
              .slice(0, 5)
              .map((result) => ({
                label: result.label,
                confidence: (result.confidence * 100).toFixed(1),
              }));

            setPredictions(formattedPredictions);
          } catch (err) {
            console.error("Recognition error:", err);
            setError("Failed to recognize image");
          } finally {
            setIsLoading(false);
          }
        };

        img.onerror = () => {
          setError("Failed to load image for recognition");
          setIsLoading(false);
        };

        img.src = imageUrl;
        imageRef.current = img;
      } catch (err) {
        console.error("Recognition setup error:", err);
        setError("Failed to setup image recognition");
        setIsLoading(false);
      }
    };

    // Add a delay to ensure classifier is ready
    const timer = setTimeout(() => {
      if (classifierRef.current) {
        recognizeImage();
      } else {
        setIsLoading(false);
        setError("Image recognition model is still loading. Please try again in a moment.");
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [imageUrl, enabled]);

  return {
    predictions,
    isLoading,
    error,
  };
};

