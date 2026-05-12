import React, { useRef, useState, useEffect, useCallback } from "react";

// 1. Định nghĩa các khuôn mẫu dữ liệu
interface HighlightPart {
  type: "text" | "keyword";
  content: string;
  keyword?: string;
  color?: string;
}

interface Match {
  keyword: string;
  start: number;
  end: number;
  original: string;
}

interface HighlightedTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  keywordsMap: Record<string, string>;
  onKeywordClick: (keyword: string) => void;
  placeholder?: string;
}

// Highlighted Text Editor Component
export const HighlightedTextEditor: React.FC<HighlightedTextEditorProps> = ({
  value,
  onChange,
  keywordsMap,
  onKeywordClick,
  placeholder,
}) => {
  // 2. Định danh rõ ràng editorRef là HTMLDivElement (vì dùng contentEditable)
  const editorRef = useRef<HTMLDivElement>(null);
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [cursorIndicatorTop, setCursorIndicatorTop] = useState<number>(0);

  // Handle input
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (!isComposing) {
      const newValue = (e.target as HTMLDivElement).innerText;
      onChange(newValue);
    }
    // Update indicator position after input
    setTimeout(updateCursorIndicator, 0);
  };

  // Handle composition (for IME input như gõ tiếng Việt Telex/VNI)
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLDivElement>) => {
    setIsComposing(false);
    const newValue = (e.target as HTMLDivElement).innerText;
    onChange(newValue);
  };

  // Update cursor indicator position
  const updateCursorIndicator = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();

      // Calculate center of the text line relative to editor
      const lineCenter = rect.top + rect.height / 2;
      const top = lineCenter - editorRect.top;
      setCursorIndicatorTop(top);
    }
  }, []);

  // Handle click on highlighted keyword
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("keyword-highlight")) {
      e.preventDefault();
      const keyword = target.dataset.keyword;
      if (keyword && onKeywordClick) {
        onKeywordClick(keyword);
      }
    }
    // Update indicator position after click
    setTimeout(updateCursorIndicator, 0);
  };

  // Handle key events to update indicator
  const handleKeyUp = useCallback(() => {
    setTimeout(updateCursorIndicator, 0);
  }, [updateCursorIndicator]);

  // Update content khi giá trị hoặc keywordsMap thay đổi
  useEffect(() => {
    if (editorRef.current && !isComposing) {
      const renderHighlightedText = (): HighlightPart[] => {
        if (!value) return [];

        const parts: HighlightPart[] = [];
        let lastIndex = 0;
        const text = value;

        const matches: Match[] = [];
        Object.keys(keywordsMap).forEach((keyword) => {
          const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
          let match;
          while ((match = regex.exec(text)) !== null) {
            matches.push({
              keyword,
              start: match.index,
              end: match.index + match[0].length,
              original: match[0],
            });
          }
        });

        matches.sort((a, b) => a.start - b.start);

        const nonOverlapping: Match[] = [];
        matches.forEach((match) => {
          const overlaps = nonOverlapping.some((m) => match.start < m.end && match.end > m.start);
          if (!overlaps) {
            nonOverlapping.push(match);
          }
        });

        nonOverlapping.forEach((match) => {
          if (match.start > lastIndex) {
            parts.push({
              type: "text",
              content: text.substring(lastIndex, match.start),
            });
          }
          parts.push({
            type: "keyword",
            content: match.original,
            keyword: match.keyword,
            color: keywordsMap[match.keyword],
          });
          lastIndex = match.end;
        });

        if (lastIndex < text.length) {
          parts.push({
            type: "text",
            content: text.substring(lastIndex),
          });
        }

        return parts.length > 0 ? parts : [{ type: "text", content: text }];
      };

      const parts = renderHighlightedText();
      const html = parts
        .map((part) => {
          if (part.type === "keyword") {
            return `<span class="keyword-highlight" data-keyword="${part.keyword}" style="background-color: ${part.color}; cursor: pointer; border-radius: 2px; padding: 0 2px;">${part.content}</span>`;
          }
          return part.content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        })
        .join("");

      const selection = window.getSelection();
      let savedOffset = 0;

      if (
        selection &&
        selection.rangeCount > 0 &&
        editorRef.current.contains(selection.anchorNode)
      ) {
        const range = selection.getRangeAt(0);
        const preRange = document.createRange();
        preRange.selectNodeContents(editorRef.current);
        preRange.setEnd(range.startContainer, range.startOffset);
        savedOffset = preRange.toString().length;
      }

      const currentText = editorRef.current.innerText || "";

      if (currentText !== value || Object.keys(keywordsMap).length > 0) {
        if (currentText !== value) {
          editorRef.current.innerText = value;
        }

        editorRef.current.innerHTML = html || "";

        if (selection && savedOffset >= 0) {
          try {
            const newRange = document.createRange();
            const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT, null);

            let node: Node | null;
            let offset = 0;
            let targetNode: Node | null = null;
            let targetOffset = 0;

            while ((node = walker.nextNode())) {
              const nodeLength = node.textContent?.length || 0;

              if (offset + nodeLength >= savedOffset) {
                targetNode = node;
                targetOffset = savedOffset - offset;
                break;
              }

              offset += nodeLength;
            }

            if (targetNode) {
              newRange.setStart(
                targetNode,
                Math.min(targetOffset, targetNode.textContent?.length || 0)
              );
              newRange.setEnd(
                targetNode,
                Math.min(targetOffset, targetNode.textContent?.length || 0)
              );
              selection.removeAllRanges();
              selection.addRange(newRange);
            } else if (editorRef.current.lastChild) {
              const lastNode = editorRef.current.lastChild;
              const lastTextNode =
                lastNode.nodeType === Node.TEXT_NODE ? lastNode : lastNode.lastChild;
              if (lastTextNode && lastTextNode.nodeType === Node.TEXT_NODE) {
                newRange.setStart(lastTextNode, lastTextNode.textContent?.length || 0);
                newRange.setEnd(lastTextNode, lastTextNode.textContent?.length || 0);
                selection.removeAllRanges();
                selection.addRange(newRange);
              }
            }
          } catch (e) {
            // Ignore cursor restoration errors
          }
        }
      }
    }
  }, [value, keywordsMap, isComposing]);

  // Update indicator on selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      updateCursorIndicator();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [updateCursorIndicator]);

  return (
    <div className="relative h-full w-full">
      {/* Cursor indicator - blue dot on the left */}
      <div
        className="pointer-events-none absolute left-0 z-10 h-2 w-2 rounded-full bg-blue-500 transition-all duration-150"
        style={{
          top: `${cursorIndicatorTop}px`,
          transform: "translateY(-50%)",
          opacity: cursorIndicatorTop > 0 ? 1 : 0,
        }}
      />
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onClick={handleClick}
        onKeyUp={handleKeyUp}
        className="text-charcoal font-modern h-full w-full resize-none border-none bg-transparent pl-4 text-sm leading-relaxed placeholder-gray-400 transition-colors outline-none focus:placeholder-gray-300 sm:text-base md:text-lg lg:text-xl"
        style={{
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};
