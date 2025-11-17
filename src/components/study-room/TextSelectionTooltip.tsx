import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TextSelectionTooltipProps {
  onExplain: (selectedText: string) => void;
  className?: string;
}

export function TextSelectionTooltip({ onExplain, className }: TextSelectionTooltipProps) {
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const tooltipRef = useRef<HTMLDivElement>(null);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTextSelection = useCallback(() => {
    // Clear any existing timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    // Add a small delay to avoid showing tooltip for accidental selections
    selectionTimeoutRef.current = setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setTooltipPosition(null);
        setSelectedText("");
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();
      
      if (!selectedText || selectedText.length < 3) {
        setTooltipPosition(null);
        setSelectedText("");
        return;
      }

      // Get bounding rect of the selection
      const rect = range.getBoundingClientRect();
      
      // Calculate tooltip position (above the selection)
      const x = rect.left + rect.width / 2;
      const y = rect.top - 10; // 10px above the selection
      
      setTooltipPosition({ x, y });
      setSelectedText(selectedText);
    }, 100); // 100ms delay
  }, []);

  const handleExplainClick = useCallback(() => {
    if (selectedText) {
      onExplain(selectedText);
      setTooltipPosition(null);
      setSelectedText("");
      
      // Clear the selection
      window.getSelection()?.removeAllRanges();
    }
  }, [selectedText, onExplain]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
      setTooltipPosition(null);
      setSelectedText("");
    }
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Hide tooltip on Escape key
    if (event.key === "Escape") {
      setTooltipPosition(null);
      setSelectedText("");
      window.getSelection()?.removeAllRanges();
    }
  }, []);

  useEffect(() => {
    // Listen for text selection events
    document.addEventListener("mouseup", handleTextSelection);
    document.addEventListener("selectionchange", handleTextSelection);
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mouseup", handleTextSelection);
      document.removeEventListener("selectionchange", handleTextSelection);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      
      // Clear timeout on unmount
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [handleTextSelection, handleClickOutside, handleKeyDown]);

  if (!tooltipPosition || !selectedText) return null;

  return (
    <div
      ref={tooltipRef}
      className={cn(
        "fixed z-50 bg-background border border-border shadow-lg rounded-lg p-2",
        "transform -translate-x-1/2 -translate-y-full",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        className
      )}
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
      }}
    >
      <Button
        onClick={handleExplainClick}
        size="sm"
        variant="ghost"
        className="h-10 sm:h-8 px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
      >
        <MessageCircle className="h-4 w-4 mr-1" />
        Explicar isso
      </Button>
      
      {/* Arrow pointing down to the selection */}
      <div 
        className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border"
      />
    </div>
  );
}