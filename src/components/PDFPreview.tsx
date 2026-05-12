import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Download, X } from "lucide-react";
import jsPDF from "jspdf";

import { trackUnsplashDownload } from "@/server/track-download";
// 1. Import khuôn mẫu ZenImage đã tạo từ Store
import { ZenImage } from "@/store/writerStore";

// 2. Định nghĩa khuôn mẫu cho các Props truyền vào Component này
interface PDFPreviewProps {
  text: string;
  images: ZenImage[];
  onClose: () => void;
  onDownload?: () => void; // Dấu ? nghĩa là tham số này có thể có hoặc không (optional)
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ text, images, onClose, onDownload }) => {
  // 3. Khai báo rõ Ref này dùng cho thẻ <div>
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

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
        lines.forEach((line: string) => {
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
            // GỌI SERVER FUNCTION ĐỂ TRACK DOWNLOAD
            if (image.download_location) {
              try {
                await trackUnsplashDownload({ data: image.download_location });
              } catch (error) {
                console.error("Tracking failed, but continuing PDF generation...", error);
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
            pdf.addImage(img, "JPEG", margin, yPos, displayWidth, displayHeight);

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
            const attributionLines = pdf.splitTextToSize(attributionText, maxWidth);

            let currentYPos = yPos;
            for (const line of attributionLines) {
              if (currentYPos > pageHeight - margin - 10) {
                pdf.addPage();
                currentYPos = margin;
              }
              pdf.text(line as string, margin, currentYPos); // Ép kiểu an toàn cho jsPDF
              currentYPos += 4;
            }

            // Image description if available
            if (image.alt_description) {
              const captionLines = pdf.splitTextToSize(image.alt_description, maxWidth);
              for (const line of captionLines) {
                if (currentYPos > pageHeight - margin - 10) {
                  pdf.addPage();
                  currentYPos = margin;
                }
                pdf.text(line as string, margin, currentYPos);
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
      const fileName = `zen-writing-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);

      if (onDownload) onDownload();
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
        className="m-2 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl sm:m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:p-6">
          <h2 className="text-charcoal text-lg font-semibold sm:text-xl">PDF Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Preview Content */}
        <div
          ref={previewRef}
          className="bg-ivory custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6 md:p-8"
        >
          <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
            {/* Text Preview */}
            {text.trim() && (
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                  Text
                </h3>
                <div
                  className="text-charcoal font-modern text-sm leading-relaxed whitespace-pre-wrap"
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
                  {images.map((image: ZenImage, index: number) => (
                    <div key={image.id} className="overflow-hidden rounded-lg bg-white shadow-sm">
                      <img
                        src={image.url}
                        alt={image.alt_description || `Image ${index + 1}`}
                        className="h-48 w-full object-cover"
                        loading="lazy"
                      />
                      {image.alt_description && (
                        <div className="p-3">
                          <p className="line-clamp-2 text-xs text-gray-600">
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
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 p-4 sm:gap-3 sm:p-6">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm text-gray-600 transition-colors hover:text-gray-900 sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating || (!text.trim() && images.length === 0)}
            className="bg-charcoal flex items-center gap-1.5 rounded px-4 py-2 text-sm text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:px-6 sm:text-base"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
