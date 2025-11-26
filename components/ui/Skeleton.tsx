import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton loading component following Apple HIG principles.
 * Provides a placeholder while content is loading.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-slate-700';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton-wave',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width ?? '100%',
    height: height ?? (variant === 'text' ? '1em' : '100%'),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      aria-hidden="true"
      role="presentation"
    />
  );
};

/**
 * Skeleton for a quote card in the MyQuotesPage
 */
export const QuoteCardSkeleton: React.FC<{ layout?: 'grid' | 'list' }> = ({ layout = 'grid' }) => {
  return (
    <div
      className={`bg-white/90 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden ${
        layout === 'list' ? 'md:flex md:items-stretch' : ''
      }`}
    >
      {/* Header */}
      <div className={`p-5 border-b border-gray-200/80 dark:border-slate-700/80 bg-gradient-to-r from-gray-50/80 to-white/40 dark:from-slate-800 dark:to-slate-900 ${
        layout === 'list' ? 'md:border-b-0 md:border-r md:min-w-[360px]' : ''
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton variant="rounded" width={120} height={20} />
              <Skeleton variant="rounded" width={80} height={24} />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton variant="text" width={100} height={14} />
              <Skeleton variant="text" width={80} height={14} />
            </div>
          </div>
          <div className="text-right">
            <Skeleton variant="rounded" width={80} height={32} />
            <Skeleton variant="text" width={40} height={14} className="mt-1 ml-auto" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`p-5 ${layout === 'list' ? 'md:flex-1' : ''}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Skeleton variant="text" width={60} height={12} className="mb-1" />
              <Skeleton variant="text" width={80} height={16} />
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-center">
          <Skeleton variant="rounded" width={100} height={20} />
        </div>
      </div>

      {/* Actions */}
      <div className={`p-5 pt-0 flex gap-3 ${
        layout === 'list' ? 'md:flex-col md:justify-center md:min-w-[220px] md:border-l md:border-gray-200/80 dark:md:border-slate-700/80' : ''
      }`}>
        <Skeleton variant="rounded" height={42} className="flex-1" />
        <Skeleton variant="rounded" width={80} height={42} />
      </div>
    </div>
  );
};

/**
 * Skeleton for stats cards
 */
export const StatsCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/80 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <Skeleton variant="rounded" width={40} height={40} />
      </div>
      <Skeleton variant="text" width={60} height={28} className="mb-1" />
      <Skeleton variant="text" width={80} height={16} />
    </div>
  );
};

/**
 * Skeleton for model info panel
 */
export const ModelInfoSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Material Selection */}
      <div>
        <Skeleton variant="text" width={100} height={16} className="mb-2" />
        <Skeleton variant="rounded" height={40} />
      </div>

      {/* Model Stats */}
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
          <Skeleton variant="text" width={60} height={12} className="mb-1" />
          <Skeleton variant="text" width={80} height={24} />
        </div>
        <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
          <Skeleton variant="text" width={60} height={12} className="mb-1" />
          <Skeleton variant="text" width={80} height={24} />
        </div>
      </div>

      {/* Dimensions */}
      <div className="pt-2">
        <Skeleton variant="text" width={120} height={14} className="mb-2" />
        <div className="space-y-2 pl-2">
          {['X', 'Y', 'Z'].map((axis) => (
            <div key={axis} className="flex justify-between">
              <Skeleton variant="text" width={20} height={16} />
              <Skeleton variant="text" width={60} height={16} />
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 mt-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={40} />
      </div>
    </div>
  );
};

/**
 * Skeleton for the 3D viewer loading state
 */
export const ViewerLoadingSkeleton: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="text-center p-8">
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Animated cube placeholder */}
          <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-800 rounded-2xl animate-pulse" />
          <div className="absolute inset-2 border-4 border-indigo-300 dark:border-indigo-700 rounded-xl animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="absolute inset-4 border-4 border-indigo-400 dark:border-indigo-600 rounded-lg animate-pulse" style={{ animationDelay: '300ms' }} />
          <div className="absolute inset-6 bg-indigo-500 dark:bg-indigo-500 rounded-md animate-pulse" style={{ animationDelay: '450ms' }} />
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" width={160} height={20} className="mx-auto" />
          <Skeleton variant="text" width={120} height={14} className="mx-auto" />
        </div>
      </div>
    </div>
  );
};
