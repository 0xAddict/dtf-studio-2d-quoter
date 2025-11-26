import React, { useState, useRef, useEffect } from 'react';
import { Trash2, XCircle } from 'lucide-react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Quote } from '../services/supabase/quotes';
import { QuoteCard } from './QuoteCard';
import { SlideToConfirm } from './ui/SlideToConfirm';

interface SwipeableQuoteCardProps {
  quote: Quote;
  onCancel?: (quoteId: string) => void;
  onSwipeCancel?: (quoteId: string) => void;
  onDelete?: (quoteId: string) => Promise<void>;
  onDownload?: (quoteId: string) => void;
  layout?: 'grid' | 'list';
  isCancelling?: boolean;
  isDeleting?: boolean;
  showInlineConfirmation?: boolean;
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
  showInlineConfirmation = false,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const x = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Can only swipe to cancel if quote is pending or processing
  const canCancel = quote.status === 'pending' || quote.status === 'processing';
  const canDelete = quote.status === 'cancelled';
  const showSwipe = (canCancel || canDelete) && isTouchDevice();

  // Background colors based on swipe direction
  const backgroundLeft = useTransform(x, [-150, 0], [1, 0]);
  const backgroundRight = useTransform(x, [0, 150], [0, 1]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;

    if (info.offset.x > threshold && canCancel) {
      // Swipe right - cancel quote
      setShowCancelConfirm(true);
    } else if (info.offset.x < -threshold && canDelete) {
      // Swipe left - delete quote
      setShowDeleteConfirm(true);
    }
  };

  const handleCancelConfirm = async () => {
    if (onSwipeCancel) {
      setIsRemoving(true);
      await onSwipeCancel(quote.quote_id);
      setShowCancelConfirm(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      setIsRemoving(true);
      await onDelete(quote.quote_id);
      setShowDeleteConfirm(false);
    }
  };

  const resetConfirmations = () => {
    setShowCancelConfirm(false);
    setShowDeleteConfirm(false);
  };

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
          showInlineConfirmation={showInlineConfirmation}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${isRemoving ? 'animate-slide-out-left' : 'animate-fade-in'}`}>
      {/* Background action indicators */}
      {canCancel && (
        <motion.div
          className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 flex items-center justify-start pl-6 overflow-hidden"
          style={{ opacity: backgroundRight }}
        >
          <div className="flex flex-col items-center gap-1 text-white">
            <XCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Cancel</span>
          </div>
        </motion.div>
      )}
      {canDelete && (
        <motion.div
          className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-end pr-6 overflow-hidden"
          style={{ opacity: backgroundLeft }}
        >
          <div className="flex flex-col items-center gap-1 text-white">
            <Trash2 className="w-6 h-6" />
            <span className="text-xs font-medium">Delete</span>
          </div>
        </motion.div>
      )}

      {/* Swipeable card */}
      <motion.div
        ref={cardRef}
        className="relative"
        style={{ x }}
        drag={showSwipe ? 'x' : false}
        dragConstraints={{ left: canDelete ? -150 : 0, right: canCancel ? 150 : 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <QuoteCard
          quote={quote}
          onCancel={onCancel}
          onDelete={onDelete}
          onDownload={onDownload}
          layout={layout}
          isCancelling={isCancelling}
          isDeleting={isDeleting}
          showInlineConfirmation={showInlineConfirmation}
        />
      </motion.div>

      {/* Cancel Confirmation Modal - Mobile Only */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="w-full max-w-md mx-4 mb-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Cancel Quote?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to cancel quote {quote.quote_id}? This action cannot be undone.
              </p>
              <div className="space-y-3">
                <SlideToConfirm
                  onConfirm={handleCancelConfirm}
                  label="Slide to cancel quote"
                  confirmLabel="Cancelling..."
                  variant="warning"
                  isLoading={isRemoving}
                />
                <button
                  onClick={resetConfirmations}
                  className="w-full py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Keep Quote
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal - Mobile Only */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="w-full max-w-md mx-4 mb-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Quote?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to permanently delete quote {quote.quote_id}? This action cannot be undone.
              </p>
              <div className="space-y-3">
                <SlideToConfirm
                  onConfirm={handleDeleteConfirm}
                  label="Slide to delete"
                  confirmLabel="Deleting..."
                  variant="danger"
                  isLoading={isRemoving}
                />
                <button
                  onClick={resetConfirmations}
                  className="w-full py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Keep Quote
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
