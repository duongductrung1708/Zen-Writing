import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Download, X } from "lucide-react";
import axios from "axios";
import jsPDF from "jspdf";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

// PDF Preview Component
export const PDFPreview = ({ text, images, onClose, onDownload }) => {
  const previewRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPos = margin;

      // Add text
      if (text.trim()) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line) => {
          if (yPos > pageHeight - margin - 10) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.text(line, margin, yPos);
          yPos += 6;
        });
        yPos += 10;
      }

      // Add images
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const image = images[i];

          try {
            // Track download per Unsplash API requirements
            if (image.download_location) {
              try {
                await axios.post(`${API_BASE_URL}/api/track-download`, {
                  download_location: image.download_location,
                });
              } catch (error) {
                // Continue even if tracking fails
              }
            }

            // Load image
            const img = new Image();
            img.crossOrigin = "anonymous";

            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = image.url;
            });

            // Calculate image dimensions
            const imgWidth = img.width;
            const imgHeight = img.height;
            const aspectRatio = imgWidth / imgHeight;

            // Fit image to page width
            let displayWidth = maxWidth;
            let displayHeight = displayWidth / aspectRatio;

            // Check if image fits on current page
            if (yPos + displayHeight > pageHeight - margin) {
              pdf.addPage();
              yPos = margin;
            }

            // Add image to PDF
            pdf.addImage(
              img,
              "JPEG",
              margin,
              yPos,
              displayWidth,
              displayHeight
            );

            yPos += displayHeight + 10;

            // Add image caption with attribution per Unsplash API requirements
            if (yPos > pageHeight - margin - 10) {
              pdf.addPage();
              yPos = margin;
            }
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);

            // Attribution text
            const attributionText = image.photographer_name
              ? `Photo by ${image.photographer_name} on Unsplash`
              : "Photo from Unsplash";
            const attributionLines = pdf.splitTextToSize(
              attributionText,
              maxWidth
            );
            let currentYPos = yPos;
            for (const line of attributionLines) {
              if (currentYPos > pageHeight - margin - 10) {
                pdf.addPage();
                currentYPos = margin;
              }
              pdf.text(line, margin, currentYPos);
              currentYPos += 4;
            }

            // Image description if available
            if (image.alt_description) {
              const captionLines = pdf.splitTextToSize(
                image.alt_description,
                maxWidth
              );
              for (const line of captionLines) {
                if (currentYPos > pageHeight - margin - 10) {
                  pdf.addPage();
                  currentYPos = margin;
                }
                pdf.text(line, margin, currentYPos);
                currentYPos += 4;
              }
            }
            yPos = currentYPos + 5;
            pdf.setTextColor(0, 0, 0);
          } catch (error) {
            // Continue with next image
          }
        }
      }

      // Save PDF
      const fileName = `zen-writing-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(fileName);
      onClose();
    } catch (error) {
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col m-2 sm:m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sm:p-6">
          <h2 className="text-lg font-semibold sm:text-xl text-charcoal">PDF Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Preview Content */}
        <div
          ref={previewRef}
          className="flex-1 p-4 overflow-y-auto sm:p-6 md:p-8 bg-ivory custom-scrollbar"
        >
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            {/* Text Preview */}
            {text.trim() && (
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                  Text
                </h3>
                <div
                  className="text-sm leading-relaxed whitespace-pre-wrap text-charcoal font-modern"
                  style={{
                    fontFamily:
                      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                  }}
                >
                  {text}
                </div>
              </div>
            )}

            {/* Images Preview */}
            {images.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
                  Images ({images.length})
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className="overflow-hidden bg-white rounded-lg shadow-sm"
                    >
                      <img
                        src={image.url}
                        alt={image.alt_description || `Image ${index + 1}`}
                        className="object-cover w-full h-48"
                        loading="lazy"
                      />
                      {image.alt_description && (
                        <div className="p-3">
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {image.alt_description}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!text.trim() && images.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <p>No content to preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 sm:gap-3 sm:p-6">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm text-gray-600 transition-colors sm:text-base hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating || (!text.trim() && images.length === 0)}
            className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base text-white transition-colors rounded bg-charcoal hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

