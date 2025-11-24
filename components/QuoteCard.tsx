import React, { useState } from 'react';
import { Download, Calendar, Package, Clock, CheckCircle, XCircle, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Quote } from '../services/supabase/quotes';

interface QuoteCardProps {
  quote: Quote;
  onCancel?: (quoteId: string) => Promise<void>;
  onDownload?: (quoteId: string) => void;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onCancel, onDownload }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!onCancel) return;

    if (window.confirm('Are you sure you want to cancel this quote?')) {
      setIsCancelling(true);
      try {
        await onCancel(quote.quote_id);
      } catch (err) {
        console.error('Failed to cancel quote:', err);
      } finally {
        setIsCancelling(false);
      }
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(quote.quote_id);
    }
  };

  // Status badge styling
  const getStatusConfig = (status: Quote['status']) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          textColor: 'text-yellow-700 dark:text-yellow-400',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
        };
      case 'reviewed':
        return {
          icon: AlertCircle,
          label: 'Reviewed',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
          textColor: 'text-blue-700 dark:text-blue-400',
          borderColor: 'border-blue-200 dark:border-blue-800',
        };
      case 'accepted':
        return {
          icon: CheckCircle,
          label: 'Accepted',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          textColor: 'text-green-700 dark:text-green-400',
          borderColor: 'border-green-200 dark:border-green-800',
        };
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Rejected',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          textColor: 'text-red-700 dark:text-red-400',
          borderColor: 'border-red-200 dark:border-red-800',
        };
      case 'cancelled':
        return {
          icon: XCircle,
          label: 'Cancelled',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20',
          textColor: 'text-gray-700 dark:text-gray-400',
          borderColor: 'border-gray-200 dark:border-gray-800',
        };
      default:
        return {
          icon: Clock,
          label: status,
          bgColor: 'bg-gray-100 dark:bg-gray-900/20',
          textColor: 'text-gray-700 dark:text-gray-400',
          borderColor: 'border-gray-200 dark:border-gray-800',
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {quote.quote_id}
              </h3>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}>
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(quote.created_at)}
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {quote.model_file_name}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              €{quote.total_cost.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {quote.quantity} pcs
            </div>
          </div>
        </div>
      </div>

      {/* Summary Info */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Material</div>
            <div className="font-medium text-gray-900 dark:text-white capitalize">{quote.material}</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Timeline</div>
            <div className="font-medium text-gray-900 dark:text-white">{quote.timeline}</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Finishing</div>
            <div className="font-medium text-gray-900 dark:text-white capitalize">{quote.finishing}</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Scale</div>
            <div className="font-medium text-gray-900 dark:text-white">{quote.scale}%</div>
          </div>
        </div>

        {/* Admin Notes */}
        {quote.admin_notes && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Admin Notes:</div>
            <div className="text-sm text-blue-900 dark:text-blue-300">{quote.admin_notes}</div>
          </div>
        )}

        {/* Expandable Details */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
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
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 space-y-4">
            {/* Model Stats */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Model Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Vertices:</span>
                  <span className="text-gray-900 dark:text-white">{quote.vertices.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Triangles:</span>
                  <span className="text-gray-900 dark:text-white">{quote.triangles.toLocaleString()}</span>
                </div>
                {quote.dimensions && (
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
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Pricing Breakdown</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Base Cost:</span>
                  <span className="text-gray-900 dark:text-white">€{quote.base_cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Material Cost:</span>
                  <span className="text-gray-900 dark:text-white">€{quote.material_cost.toFixed(2)}</span>
                </div>
                {quote.finishing_cost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Finishing Cost:</span>
                    <span className="text-gray-900 dark:text-white">€{quote.finishing_cost.toFixed(2)}</span>
                  </div>
                )}
                {quote.quantity_discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Quantity Discount:</span>
                    <span>-€{quote.quantity_discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-slate-700 font-semibold">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">€{quote.total_cost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Contact Information</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="text-gray-900 dark:text-white">{quote.customer_email}</span>
                </div>
                {quote.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                    <span className="text-gray-900 dark:text-white">{quote.customer_phone}</span>
                  </div>
                )}
                {quote.customer_company && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Company:</span>
                    <span className="text-gray-900 dark:text-white">{quote.customer_company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Message */}
            {quote.message && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Additional Information</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{quote.message}</p>
              </div>
            )}

            {/* Model File Link */}
            {quote.model_file_url && (
              <div>
                <a
                  href={quote.model_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Download Model File →
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>

        {quote.status === 'pending' && onCancel && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCancelling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Cancel'
            )}
          </button>
        )}
      </div>
    </div>
  );
};
