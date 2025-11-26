import React, { useState, useRef } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';

interface SlideToConfirmProps {
  onConfirm: () => void | Promise<void>;
  label?: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  disabled?: boolean;
  isLoading?: boolean;
}

export const SlideToConfirm: React.FC<SlideToConfirmProps> = ({
  onConfirm,
  label = 'Slide to confirm',
  confirmLabel = 'Confirmed!',
  variant = 'danger',
  disabled = false,
  isLoading = false,
}) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const thumbWidth = 48; // Width of the thumb button

  const variantStyles = {
    danger: {
      track: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
      trackFill: 'bg-gradient-to-r from-red-500 to-red-600',
      thumb: 'bg-white dark:bg-slate-200 text-red-600 dark:text-red-500',
      thumbConfirmed: 'bg-red-600 dark:bg-red-500 text-white',
      text: 'text-red-700 dark:text-red-300',
      textConfirmed: 'text-white',
    },
    warning: {
      track: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
      trackFill: 'bg-gradient-to-r from-amber-500 to-amber-600',
      thumb: 'bg-white dark:bg-slate-200 text-amber-600 dark:text-amber-500',
      thumbConfirmed: 'bg-amber-600 dark:bg-amber-500 text-white',
      text: 'text-amber-700 dark:text-amber-300',
      textConfirmed: 'text-white',
    },
    default: {
      track: 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700',
      trackFill: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      thumb: 'bg-white dark:bg-slate-200 text-indigo-600 dark:text-indigo-500',
      thumbConfirmed: 'bg-indigo-600 dark:bg-indigo-500 text-white',
      text: 'text-gray-600 dark:text-gray-400',
      textConfirmed: 'text-white',
    },
  };

  const styles = variantStyles[variant];

  const getMaxDrag = () => {
    if (!containerRef.current) return 200;
    return containerRef.current.offsetWidth - thumbWidth - 8; // 8 for padding
  };

  const handleStart = (clientX: number) => {
    if (disabled || isLoading || isConfirmed) return;
    startX.current = clientX - dragX;
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || disabled || isLoading || isConfirmed) return;
    const newX = clientX - startX.current;
    const maxDrag = getMaxDrag();
    setDragX(Math.max(0, Math.min(newX, maxDrag)));
  };

  const handleEnd = async () => {
    if (!isDragging || disabled || isLoading || isConfirmed) return;
    setIsDragging(false);

    const maxDrag = getMaxDrag();
    const threshold = maxDrag * 0.85; // 85% threshold to confirm

    if (dragX >= threshold) {
      setIsConfirmed(true);
      setDragX(maxDrag);
      await onConfirm();
    } else {
      // Animate back to start
      setDragX(0);
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleEnd();
    }
  };

  // Progress percentage
  const maxDrag = getMaxDrag();
  const progress = maxDrag > 0 ? dragX / maxDrag : 0;

  return (
    <div
      ref={containerRef}
      className={`relative h-12 rounded-xl border overflow-hidden select-none ${styles.track} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Fill track */}
      <div
        className={`absolute inset-y-0 left-0 ${styles.trackFill} transition-all ${isDragging ? 'duration-0' : 'duration-300'}`}
        style={{ width: `${dragX + thumbWidth}px` }}
      />

      {/* Label */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-colors ${progress > 0.5 ? styles.textConfirmed : styles.text}`}>
        <span className="text-sm font-medium">
          {isConfirmed ? confirmLabel : label}
        </span>
      </div>

      {/* Thumb */}
      <div
        className={`absolute top-1 left-1 w-10 h-10 rounded-lg shadow-md flex items-center justify-center transition-all ${isDragging ? 'duration-0 scale-105' : 'duration-300'} ${isConfirmed ? styles.thumbConfirmed : styles.thumb}`}
        style={{ transform: `translateX(${dragX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ChevronRight className={`w-5 h-5 transition-transform ${isDragging ? 'scale-110' : ''}`} />
        )}
      </div>
    </div>
  );
};
