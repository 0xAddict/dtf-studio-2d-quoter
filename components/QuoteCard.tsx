import React, { useState } from 'react';
import { Download, Calendar, Package, Clock, CheckCircle, XCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Quote } from '../services/supabase/quotes';
import { SlideToConfirm } from './ui/SlideToConfirm';

interface QuoteCardProps {
  quote: Quote;
  onCancel?: (quoteId: string) => void;
  onDelete?: (quoteId: string) => Promise<void>;
  onDownload?: (quoteId: string) => void;
  layout?: 'grid' | 'list';
  isCancelling?: boolean;
  isDeleting?: boolean;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onCancel, onDelete, onDownload, layout = 'grid', isCancelling, isDeleting }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCancel = () => {
    if (!onCancel) return;
    onCancel(quote.quote_id);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(quote.quote_id);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(quote.quote_id);
    }
  };

  // Status badge styling
  const getStatusConfig = (status: Quote['status']) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          bgColor: 'bg-amber-50 dark:bg-amber-900/30',
          textColor: 'text-amber-800 dark:text-amber-100',
          borderColor: 'border-amber-200/80 dark:border-amber-700',
          canCancel: true,
        };
      case 'processing':
        return {
          icon: Clock,
          label: 'Processing',
          bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
          textColor: 'text-indigo-800 dark:text-indigo-100',
          borderColor: 'border-indigo-200/80 dark:border-indigo-700',
          canCancel: true,
        };
      case 'reviewed':
        return {
          icon: AlertCircle,
          label: 'Reviewed',
          bgColor: 'bg-sky-50 dark:bg-sky-900/30',
          textColor: 'text-sky-800 dark:text-sky-100',
          borderColor: 'border-sky-200/80 dark:border-sky-700',
          canCancel: false,
        };
      case 'accepted':
        return {
          icon: CheckCircle,
          label: 'Accepted',
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
          textColor: 'text-emerald-800 dark:text-emerald-100',
          borderColor: 'border-emerald-200/80 dark:border-emerald-700',
          canCancel: false,
        };
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Rejected',
          bgColor: 'bg-rose-50 dark:bg-rose-900/30',
          textColor: 'text-rose-800 dark:text-rose-100',
          borderColor: 'border-rose-200/80 dark:border-rose-700',
          canCancel: false,
        };
      case 'cancelled':
        return {
          icon: XCircle,
          label: 'Cancelled',
          bgColor: 'bg-gray-100 dark:bg-slate-800',
          textColor: 'text-gray-800 dark:text-gray-100',
          borderColor: 'border-gray-200/80 dark:border-slate-700',
          canCancel: false,
        };
      default:
        return {
          icon: Clock,
          label: status,
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-900 dark:text-gray-100',
          borderColor: 'border-gray-200/80 dark:border-gray-700',
          canCancel: true,
        };
    }
  };

  const statusConfig = getStatusConfig(quote.status);
  const StatusIcon = statusConfig.icon;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const containerClasses = `glass rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${
    layout === 'list' ? 'md:flex md:items-stretch' : ''
  }`;

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div
        className={`p-3 sm:p-5 border-b border-gray-200/80 dark:border-slate-700/80 bg-gradient-to-r from-gray-50/80 to-white/40 dark:from-slate-800 dark:to-slate-900 ${
          layout === 'list' ? 'md:border-b-0 md:border-r' : ''
        } md:min-w-[320px] lg:min-w-[360px]`}
      >
        <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 ${layout === 'list' ? 'md:flex-col' : ''}`}>
          <div className="flex-1 min-w-0">
            {/* Quote ID and Status */}
            <div className="flex items-center justify-between sm:justify-start gap-2 mb-1">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                {quote.quote_id}
              </h3>
              <div
                className={`inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border shadow-sm ring-1 ring-inset flex-shrink-0 ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
              >
                <StatusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {statusConfig.label}
              </div>
            </div>
            {/* Date and Model info */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span className="hidden sm:inline">{formatDate(quote.created_at)}</span>
                <span className="sm:hidden">{new Date(quote.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <Package className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">{quote.model_file_name}</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between sm:block sm:text-right border-t sm:border-t-0 border-gray-100 dark:border-slate-700/50 pt-2 sm:pt-0 mt-1 sm:mt-0">
            <div className="text-lg sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              €{quote.total_cost?.toFixed(2) || '0.00'}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              {quote.quantity} pcs
            </div>
          </div>
        </div>
      </div>

      {/* Summary Info */}
      <div className={`p-3 sm:p-5 ${layout === 'list' ? 'md:flex-1' : ''}`}>
        <div
          className={`grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm ${
            layout === 'list' ? 'sm:grid-cols-4 md:grid-cols-3' : 'sm:grid-cols-4'
          }`}
        >
          <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg p-2 sm:p-0 sm:bg-transparent dark:sm:bg-transparent">
            <div className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Material</div>
            <div className="font-medium text-gray-900 dark:text-white capitalize text-xs sm:text-sm">{quote.material}</div>
          </div>
          <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg p-2 sm:p-0 sm:bg-transparent dark:sm:bg-transparent">
            <div className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Timeline</div>
            <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{quote.timeline}</div>
          </div>
          <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg p-2 sm:p-0 sm:bg-transparent dark:sm:bg-transparent">
            <div className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Finishing</div>
            <div className="font-medium text-gray-900 dark:text-white capitalize text-xs sm:text-sm">{quote.finishing}</div>
          </div>
          <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg p-2 sm:p-0 sm:bg-transparent dark:sm:bg-transparent">
            <div className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Scale</div>
            <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{quote.scale}%</div>
          </div>
        </div>

        {/* Admin Notes */}
        {quote.admin_notes && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-[10px] sm:text-xs font-medium text-blue-700 dark:text-blue-400 mb-0.5 sm:mb-1">Admin Notes:</div>
            <div className="text-xs sm:text-sm text-blue-900 dark:text-blue-300">{quote.admin_notes}</div>
          </div>
        )}

        {/* Expandable Details */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 sm:mt-5 w-full flex items-center justify-center gap-2 text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors py-2"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show Details
            </>
          )}
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200/80 dark:border-slate-700/80 space-y-3 sm:space-y-4">
            {/* Model Stats */}
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1.5 sm:mb-2">Model Information</h4>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
                {quote.vertices && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Vertices:</span>
                    <span className="text-gray-900 dark:text-white">{quote.vertices.toLocaleString()}</span>
                  </div>
                )}
                {quote.triangles && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Triangles:</span>
                    <span className="text-gray-900 dark:text-white">{quote.triangles.toLocaleString()}</span>
                  </div>
                )}
                {quote.dimensions && typeof quote.dimensions === 'object' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">X:</span>
                      <span className="text-gray-900 dark:text-white">{quote.dimensions.x}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Y:</span>
                      <span className="text-gray-900 dark:text-white">{quote.dimensions.y}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Z:</span>
                      <span className="text-gray-900 dark:text-white">{quote.dimensions.z}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Pricing Breakdown */}
            {(quote.base_cost !== null || quote.material_cost !== null) && (
              <div>
                <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1.5 sm:mb-2">Pricing Breakdown</h4>
                <div className="space-y-1 text-xs sm:text-sm">
                  {quote.base_cost !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Base Cost:</span>
                      <span className="text-gray-900 dark:text-white">€{quote.base_cost.toFixed(2)}</span>
                    </div>
                  )}
                  {quote.material_cost !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Material Cost:</span>
                      <span className="text-gray-900 dark:text-white">€{quote.material_cost.toFixed(2)}</span>
                    </div>
                  )}
                  {quote.finishing_cost !== null && quote.finishing_cost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Finishing Cost:</span>
                      <span className="text-gray-900 dark:text-white">€{quote.finishing_cost.toFixed(2)}</span>
                    </div>
                  )}
                  {quote.quantity_discount !== null && quote.quantity_discount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Quantity Discount:</span>
                      <span>-€{quote.quantity_discount.toFixed(2)}</span>
                    </div>
                  )}
                  {quote.total_cost !== null && (
                    <div className="flex justify-between pt-1.5 sm:pt-2 border-t border-gray-200 dark:border-slate-700 font-semibold">
                      <span className="text-gray-900 dark:text-white">Total:</span>
                      <span className="text-indigo-600 dark:text-indigo-400">€{quote.total_cost.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1.5 sm:mb-2">Contact Information</h4>
              <div className="text-xs sm:text-sm space-y-1">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">Email:</span>
                  <span className="text-gray-900 dark:text-white truncate">{quote.email}</span>
                </div>
                {quote.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                    <span className="text-gray-900 dark:text-white">{quote.phone}</span>
                  </div>
                )}
                {quote.company && (
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">Company:</span>
                    <span className="text-gray-900 dark:text-white truncate">{quote.company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Message */}
            {quote.notes && (
              <div>
                <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1.5 sm:mb-2">Additional Information</h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{quote.notes}</p>
              </div>
            )}

            {/* Model File Link */}
            {quote.model_file_url && (
              <div>
                <a
                  href={quote.model_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Download Model File →
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        className={`p-3 sm:p-5 pt-0 ${
          layout === 'list'
            ? 'md:flex md:flex-col md:justify-center md:gap-3 md:min-w-[180px] lg:min-w-[200px] md:border-l md:border-gray-200/80 dark:md:border-slate-700/80 md:pt-5'
            : ''
        }`}
      >
        {/* Buttons - horizontal on mobile, stacked on larger screens */}
        <div className="flex flex-col gap-2 sm:gap-2.5">
          <div className="flex flex-row gap-2 sm:gap-2.5">
            <button
              onClick={handleDownload}
              className="flex-1 sm:w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 glass dark:glass border border-gray-200/60 dark:border-slate-600/60 hover:border-indigo-300 dark:hover:border-indigo-600 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 min-h-[40px] sm:min-h-[48px] group"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden xs:inline sm:inline">Download</span> PDF
            </button>

            {statusConfig.canCancel && onCancel && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 sm:w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200/60 dark:border-slate-700/60 hover:border-red-300 dark:hover:border-red-700 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] sm:min-h-[44px]"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    <span className="hidden xs:inline sm:inline">Cancelling...</span>
                    <span className="xs:hidden sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Cancel
                  </>
                )}
              </button>
            )}
          </div>

          {/* Delete button for cancelled quotes */}
          {quote.status === 'cancelled' && onDelete && (
            <div className="mt-1">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border border-red-200/60 dark:border-red-800/60 bg-red-50/50 dark:bg-red-900/20 hover:bg-red-100/80 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] sm:min-h-[44px]"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Delete Quote</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <SlideToConfirm
                    onConfirm={handleDelete}
                    label="Slide to delete"
                    confirmLabel="Deleting..."
                    variant="danger"
                    isLoading={isDeleting}
                  />
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
