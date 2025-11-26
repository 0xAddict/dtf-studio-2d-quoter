import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { getQuoteByQuoteId, updateQuoteStatus, deleteQuote, Quote } from '../services/supabase/quotes';
import { SlideToConfirm } from './ui/SlideToConfirm';
import { ConfirmationDialog } from './ui/ConfirmationDialog';

export const QuoteDetailsPage: React.FC = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (quoteId) {
      loadQuote();
    }
  }, [quoteId]);

  const loadQuote = async () => {
    if (!quoteId) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await getQuoteByQuoteId(quoteId);

      if (fetchError) {
        setError(fetchError.message || 'Failed to load quote');
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Quote not found');
        setLoading(false);
        return;
      }

      setQuote(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!quote) return;

    setIsCancelling(true);
    try {
      const { error: cancelError } = await updateQuoteStatus(quote.quote_id, 'cancelled');

      if (cancelError) {
        throw cancelError;
      }

      await loadQuote();
      toast.success('Quote cancelled successfully.');
    } catch (err: any) {
      toast.error('Failed to cancel quote. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDelete = async () => {
    if (!quote) return;

    setIsDeleting(true);
    try {
      const { error: deleteError } = await deleteQuote(quote.quote_id);

      if (deleteError) {
        throw deleteError;
      }

      toast.success('Quote deleted successfully.');
      navigate('/my-quotes');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete quote. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    if (!quote) return;
    toast.info('PDF download will be available soon.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <header className="glass border-b border-gray-200/50 dark:border-slate-700/50 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate('/my-quotes')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Quotes</span>
            </button>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
            <XCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
              {error || 'Quote not found'}
            </h3>
            <button
              onClick={() => navigate('/my-quotes')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  const statusConfig = getStatusConfig(quote.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="glass border-b border-gray-200/50 dark:border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/my-quotes')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {/* Quote Header */}
        <div className="glass rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-5 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {quote.quote_id}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                {formatDate(quote.created_at)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                €{quote.total_cost?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {quote.quantity} pcs
              </div>
            </div>
          </div>

          {/* Model Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
            <Package className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{quote.model_file_name}</span>
          </div>
        </div>

        {/* Specifications */}
        <div className="glass rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-5 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Specifications</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Material</div>
              <div className="font-medium text-gray-900 dark:text-white capitalize">{quote.material}</div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Timeline</div>
              <div className="font-medium text-gray-900 dark:text-white">{quote.timeline}</div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Finishing</div>
              <div className="font-medium text-gray-900 dark:text-white capitalize">{quote.finishing}</div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Scale</div>
              <div className="font-medium text-gray-900 dark:text-white">{quote.scale}%</div>
            </div>
          </div>
        </div>

        {/* Model Information */}
        {(quote.vertices || quote.triangles || quote.dimensions) && (
          <div className="glass rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-5 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Model Information</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {quote.vertices && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Vertices:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{quote.vertices.toLocaleString()}</span>
                </div>
              )}
              {quote.triangles && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Triangles:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{quote.triangles.toLocaleString()}</span>
                </div>
              )}
              {quote.dimensions && typeof quote.dimensions === 'object' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">X:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{quote.dimensions.x}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Y:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{quote.dimensions.y}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Z:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{quote.dimensions.z}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Pricing Breakdown */}
        {(quote.base_cost !== null || quote.material_cost !== null) && (
          <div className="glass rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-5 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing Breakdown</h2>
            <div className="space-y-2 text-sm">
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
                <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-slate-700 font-semibold">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">€{quote.total_cost.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Notes */}
        {quote.admin_notes && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-5 mb-4">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">Admin Notes</h2>
            <p className="text-sm text-blue-800 dark:text-blue-200">{quote.admin_notes}</p>
          </div>
        )}

        {/* Contact Information */}
        <div className="glass rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-5 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h2>
          <div className="space-y-2 text-sm">
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

        {/* Additional Notes */}
        {quote.message && (
          <div className="glass rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-5 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Additional Information</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{quote.message}</p>
          </div>
        )}

        {/* Model File Link */}
        {quote.model_file_url && (
          <a
            href={quote.model_file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 glass rounded-xl border border-gray-200/50 dark:border-slate-700/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors mb-4"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="font-medium">View Model File</span>
          </a>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Download PDF */}
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 glass border border-gray-200/60 dark:border-slate-600/60 hover:border-indigo-300 dark:hover:border-indigo-600 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl font-medium transition-all duration-200"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>

          {/* Cancel Button */}
          {statusConfig.canCancel && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-200/60 dark:border-slate-700/60 hover:border-red-300 dark:hover:border-red-700 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  Cancel Quote
                </>
              )}
            </button>
          )}

          {/* Delete Button for cancelled quotes */}
          {quote.status === 'cancelled' && (
            <div className="mt-2">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-red-200/60 dark:border-red-800/60 bg-red-50/50 dark:bg-red-900/20 hover:bg-red-100/80 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Delete Quote
                    </>
                  )}
                </button>
              ) : (
                <>
                  {/* Mobile: Slide to confirm */}
                  <div className="sm:hidden space-y-3">
                    <SlideToConfirm
                      onConfirm={handleDelete}
                      label="Slide to delete"
                      confirmLabel="Deleting..."
                      variant="danger"
                      isLoading={isDeleting}
                    />
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                  {/* Desktop: Confirmation dialog */}
                  <ConfirmationDialog
                    isOpen={showDeleteConfirm}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={handleDelete}
                    title="Delete Quote"
                    message={`Are you sure you want to permanently delete quote ${quote.quote_id}? This action cannot be undone.`}
                    confirmLabel="Delete Quote"
                    cancelLabel="Keep Quote"
                    variant="danger"
                    isLoading={isDeleting}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
