import React, { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Quote } from '../services/supabase/quotes';
import { QuoteCard } from './QuoteCard';

interface SwipeableQuoteCardProps {
  quote: Quote;
  onCancel?: (quoteId: string) => void;
  onSwipeCancel?: (quoteId: string) => void;
  onDelete?: (quoteId: string) => Promise<void>;
  onDownload?: (quoteId: string) => void;
  layout?: 'grid' | 'list';
  isCancelling?: boolean;
  isDeleting?: boolean;
}

// Check if device is touch-enabled (mobile)
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const SwipeableQuoteCard: React.FC<SwipeableQuoteCardProps> = ({
  quote,
  onCancel,
  onSwipeCancel,
  onDelete,
  onDownload,
  layout = 'grid',
  isCancelling,
  isDeleting,
}) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Can only swipe to cancel if quote is pending or processing
  const canCancel = quote.status === 'pending' || quote.status === 'processing';
  const showSwipe = canCancel && isTouchDevice();

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!showSwipe) return;
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!showSwipe || !isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    // Only allow left swipe
    if (diff < 0) {
      setDragX(Math.max(diff, -150));
    }
  };

  const handleTouchEnd = async () => {
    if (!showSwipe) return;
    setIsDragging(false);

    const threshold = -120;
    if (dragX < threshold && canCancel && onSwipeCancel) {
      setIsRemoving(true);
      await onSwipeCancel(quote.quote_id);
    }

    // Reset position
    setDragX(0);
  };

  // Calculate opacity for background
  const backgroundOpacity = Math.max(0, Math.min(1, Math.abs(dragX) / 100));

  // If swipe is not available (desktop), just render the card
  if (!showSwipe) {
    return (
      <div className="animate-fade-in">
        <QuoteCard
          quote={quote}
          onCancel={onCancel}
          onDelete={onDelete}
          onDownload={onDownload}
          layout={layout}
          isCancelling={isCancelling}
          isDeleting={isDeleting}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative ${isRemoving ? 'animate-slide-out-left' : 'animate-fade-in'}`}
    >
      {/* Background action indicator */}
      <div
        className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-end pr-6 overflow-hidden transition-opacity duration-200"
        style={{ opacity: backgroundOpacity }}
      >
        <div className="flex flex-col items-center gap-1 text-white">
          <Trash2 className="w-6 h-6" />
          <span className="text-xs font-medium">Cancel</span>
        </div>
      </div>

      {/* Swipeable card */}
      <div
        ref={cardRef}
        className="relative touch-pan-y transition-transform duration-200"
        style={{
          transform: `translateX(${dragX}px)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <QuoteCard
          quote={quote}
          onCancel={onCancel}
          onDelete={onDelete}
          onDownload={onDownload}
          layout={layout}
          isCancelling={isCancelling}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
};
