import React, { useRef, useState, useEffect, useCallback } from "react";

// Highlighted Text Editor Component
export const HighlightedTextEditor = ({
  value,
  onChange,
  keywordsMap,
  onKeywordClick,
  placeholder,
}) => {
  const editorRef = useRef(null);
  const [isComposing, setIsComposing] = useState(false);
  const [cursorIndicatorTop, setCursorIndicatorTop] = useState(0);

  // Handle input
  const handleInput = (e) => {
    if (!isComposing) {
      const newValue = e.target.innerText;
      onChange(newValue);
    }
    // Update indicator position after input
    setTimeout(updateCursorIndicator, 0);
  };

  // Handle composition (for IME input)
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (e) => {
    setIsComposing(false);
    const newValue = e.target.innerText;
    onChange(newValue);
  };

  // Update cursor indicator position
  const updateCursorIndicator = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();
      
      // Calculate center of the text line relative to editor
      // Use rect.height to get the line height, then center the dot
      const lineCenter = rect.top + rect.height / 2;
      const top = lineCenter - editorRect.top;
      setCursorIndicatorTop(top);
    }
  }, []);

  // Handle click on highlighted keyword
  const handleClick = (e) => {
    const target = e.target;
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

  // Update content when value or keywordsMap changes
  useEffect(() => {
    if (editorRef.current && !isComposing) {
      // Render text with highlights
      const renderHighlightedText = () => {
        if (!value) return [];

        const parts = [];
        let lastIndex = 0;
        const text = value;

        // Find all keyword matches
        const matches = [];
        Object.keys(keywordsMap).forEach((keyword) => {
          const regex = new RegExp(
            `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "gi"
          );
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

        // Sort matches by start position
        matches.sort((a, b) => a.start - b.start);

        // Remove overlapping matches (keep first)
        const nonOverlapping = [];
        matches.forEach((match) => {
          const overlaps = nonOverlapping.some(
            (m) => match.start < m.end && match.end > m.start
          );
          if (!overlaps) {
            nonOverlapping.push(match);
          }
        });

        // Build parts array
        nonOverlapping.forEach((match) => {
          // Add text before match
          if (match.start > lastIndex) {
            parts.push({
              type: "text",
              content: text.substring(lastIndex, match.start),
            });
          }
          // Add highlighted keyword
          parts.push({
            type: "keyword",
            content: match.original,
            keyword: match.keyword,
            color: keywordsMap[match.keyword],
          });
          lastIndex = match.end;
        });

        // Add remaining text
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
          // Escape HTML characters but keep actual newline characters;
          // newlines will be rendered by CSS white-space: pre-wrap.
          return part.content
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        })
        .join("");

      // Save cursor position before updating
      const selection = window.getSelection();
      let savedOffset = 0;

      if (
        selection.rangeCount > 0 &&
        editorRef.current.contains(selection.anchorNode)
      ) {
        const range = selection.getRangeAt(0);
        // Calculate character offset from start of editor
        const preRange = document.createRange();
        preRange.selectNodeContents(editorRef.current);
        preRange.setEnd(range.startContainer, range.startOffset);
        savedOffset = preRange.toString().length;
      }

      // Get current plain text
      const currentText = editorRef.current.innerText || "";

      // Only update HTML if text content changed or keywordsMap changed
      // But don't update if user is actively typing (text matches)
      if (currentText !== value || Object.keys(keywordsMap).length > 0) {
        // If text doesn't match, update it first
        if (currentText !== value) {
          editorRef.current.innerText = value;
        }

        // Now apply highlights
        editorRef.current.innerHTML = html || "";

        // Restore cursor position
        if (savedOffset >= 0) {
          try {
            const newRange = document.createRange();
            const walker = document.createTreeWalker(
              editorRef.current,
              NodeFilter.SHOW_TEXT,
              null
            );

            let node;
            let offset = 0;
            let targetNode = null;
            let targetOffset = 0;

            while ((node = walker.nextNode())) {
              const nodeLength = node.textContent.length;

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
                Math.min(targetOffset, targetNode.textContent.length)
              );
              newRange.setEnd(
                targetNode,
                Math.min(targetOffset, targetNode.textContent.length)
              );
              selection.removeAllRanges();
              selection.addRange(newRange);
            } else if (editorRef.current.lastChild) {
              // Place cursor at end
              const lastNode = editorRef.current.lastChild;
              const lastTextNode =
                lastNode.nodeType === Node.TEXT_NODE
                  ? lastNode
                  : lastNode.lastChild;
              if (lastTextNode && lastTextNode.nodeType === Node.TEXT_NODE) {
                newRange.setStart(
                  lastTextNode,
                  lastTextNode.textContent.length
                );
                newRange.setEnd(lastTextNode, lastTextNode.textContent.length);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="relative w-full h-full">
      {/* Cursor indicator - blue dot on the left */}
      <div
        className="absolute left-0 z-10 w-2 h-2 transition-all duration-150 bg-blue-500 rounded-full pointer-events-none"
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
        className="w-full h-full pl-4 text-sm leading-relaxed placeholder-gray-400 transition-colors bg-transparent border-none outline-none resize-none sm:text-base text-charcoal font-modern md:text-lg lg:text-xl focus:placeholder-gray-300"
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

