import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2, XCircle } from 'lucide-react';
import { Quote } from '../services/supabase/quotes';
import { QuoteCard } from './QuoteCard';

interface SwipeableQuoteCardProps {
  quote: Quote;
  onCancel?: (quoteId: string) => void;
  onDelete?: (quoteId: string) => void;
  onSwipeCancel?: (quoteId: string) => void;
  onSwipeDelete?: (quoteId: string) => void;
  onDownload?: (quoteId: string) => void;
  onClick?: (quoteId: string) => void;
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
  onDelete,
  onSwipeCancel,
  onSwipeDelete,
  onDownload,
  onClick,
  layout = 'grid',
  isCancelling,
  isDeleting,
}) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const x = useMotionValue(0);

  // Calculate background opacity based on swipe distance
  const backgroundOpacity = useTransform(x, [-200, -100, 0, 100, 200], [1, 0.8, 0, 0.8, 1]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  // Always define these transforms (Hooks must be called in same order)
  const cancelOpacity = useTransform(x, [-200, 0], [1, 0]);
  const deleteOpacity = useTransform(x, [0, 200], [0, 1]);

  // Swipe left = cancel (for pending/processing)
  // Swipe right = delete (for cancelled quotes only)
  const canCancel = quote.status === 'pending' || quote.status === 'processing';
  const canDelete = quote.status === 'cancelled';
  const showSwipe = (canCancel || canDelete) && isTouchDevice();

  const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 120;

    // Swipe left to cancel (pending/processing quotes)
    if (info.offset.x < -threshold && canCancel && onSwipeCancel) {
      setIsRemoving(true);
      await onSwipeCancel(quote.quote_id);
    }
    // Swipe right to delete (cancelled quotes)
    else if (info.offset.x > threshold && canDelete && onSwipeDelete) {
      setIsRemoving(true);
      await onSwipeDelete(quote.quote_id);
    }
  };

  // Container animation variants
  const containerVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      height: 0,
      transition: { duration: 0.2, ease: 'easeIn' }
    },
  };

  // If swipe is not available (desktop), just render the card with animation
  if (!showSwipe) {
    return (
      <motion.div
        layout
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <QuoteCard
          quote={quote}
          onCancel={onCancel}
          onDelete={onDelete}
          onDownload={onDownload}
          onClick={onClick}
          layout={layout}
          isCancelling={isCancelling}
          isDeleting={isDeleting}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      variants={containerVariants}
      initial="initial"
      animate={isRemoving ? 'exit' : 'animate'}
      exit="exit"
      className="relative"
    >
      {/* Background action indicators */}
      {canCancel && (
        <motion.div
          className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-end pr-6 overflow-hidden"
          style={{
            opacity: cancelOpacity,
            pointerEvents: 'none'
          }}
        >
          <div className="flex flex-col items-center gap-1 text-white">
            <XCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Cancel</span>
          </div>
        </motion.div>
      )}

      {canDelete && (
        <motion.div
          className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-l from-red-500 to-red-600 flex items-center justify-start pl-6 overflow-hidden"
          style={{
            opacity: deleteOpacity,
            pointerEvents: 'none'
          }}
        >
          <div className="flex flex-col items-center gap-1 text-white">
            <Trash2 className="w-6 h-6" />
            <span className="text-xs font-medium">Delete</span>
          </div>
        </motion.div>
      )}

      {/* Swipeable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: canCancel ? -150 : 0, right: canDelete ? 150 : 0 }}
        dragElastic={{ left: 0.1, right: 0.1 }}
        onDragEnd={handleDragEnd}
        style={{ x, scale }}
        className="relative touch-pan-y"
        whileTap={{ cursor: 'grabbing' }}
      >
        <QuoteCard
          quote={quote}
          onCancel={onCancel}
          onDelete={onDelete}
          onDownload={onDownload}
          onClick={onClick}
          layout={layout}
          isCancelling={isCancelling}
          isDeleting={isDeleting}
        />
      </motion.div>
    </motion.div>
  );
};
