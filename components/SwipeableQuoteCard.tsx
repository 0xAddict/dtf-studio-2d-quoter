import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2, Archive } from 'lucide-react';
import { Quote } from '../services/supabase/quotes';
import { QuoteCard } from './QuoteCard';

interface SwipeableQuoteCardProps {
  quote: Quote;
  onCancel?: (quoteId: string) => void;
  onSwipeCancel?: (quoteId: string) => void;
  onDownload?: (quoteId: string) => void;
  layout?: 'grid' | 'list';
  isCancelling?: boolean;
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
  onDownload,
  layout = 'grid',
  isCancelling,
}) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const x = useMotionValue(0);

  // Calculate background opacity based on swipe distance
  const backgroundOpacity = useTransform(x, [-200, -100, 0], [1, 0.8, 0]);
  const scale = useTransform(x, [-200, 0], [0.95, 1]);

  // Can only swipe to cancel if quote is pending or processing
  const canCancel = quote.status === 'pending' || quote.status === 'processing';
  const showSwipe = canCancel && isTouchDevice();

  const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = -120; // Swipe threshold in pixels

    if (info.offset.x < threshold && canCancel && onSwipeCancel) {
      setIsRemoving(true);
      await onSwipeCancel(quote.quote_id);
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
      x: -300,
      scale: 0.8,
      transition: { duration: 0.3, ease: 'easeIn' }
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
          onDownload={onDownload}
          layout={layout}
          isCancelling={isCancelling}
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
      {/* Background action indicator */}
      <motion.div
        className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-end pr-6 overflow-hidden"
        style={{ opacity: backgroundOpacity }}
      >
        <div className="flex flex-col items-center gap-1 text-white">
          <Trash2 className="w-6 h-6" />
          <span className="text-xs font-medium">Cancel</span>
        </div>
      </motion.div>

      {/* Swipeable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ x, scale }}
        className="relative touch-pan-y"
        whileTap={{ cursor: 'grabbing' }}
      >
        <QuoteCard
          quote={quote}
          onCancel={onCancel}
          onDownload={onDownload}
          layout={layout}
          isCancelling={isCancelling}
        />

        {/* Swipe hint indicator - shown on first few cards */}
        <motion.div
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400 dark:text-gray-500 pointer-events-none sm:hidden"
        >
          <motion.div
            animate={{ x: [-5, 0, -5] }}
            transition={{ repeat: 2, duration: 0.8, ease: 'easeInOut' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
