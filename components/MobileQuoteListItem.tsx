import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { Quote } from '../services/supabase/quotes';

interface MobileQuoteListItemProps {
  quote: Quote;
}

export const MobileQuoteListItem: React.FC<MobileQuoteListItemProps> = ({ quote }) => {
  const navigate = useNavigate();

  // Status badge styling
  const getStatusConfig = (status: Quote['status']) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          bgColor: 'bg-amber-50 dark:bg-amber-900/30',
          textColor: 'text-amber-700 dark:text-amber-300',
          dotColor: 'bg-amber-500',
        };
      case 'processing':
        return {
          icon: Clock,
          label: 'Processing',
          bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
          textColor: 'text-indigo-700 dark:text-indigo-300',
          dotColor: 'bg-indigo-500',
        };
      case 'reviewed':
        return {
          icon: AlertCircle,
          label: 'Reviewed',
          bgColor: 'bg-sky-50 dark:bg-sky-900/30',
          textColor: 'text-sky-700 dark:text-sky-300',
          dotColor: 'bg-sky-500',
        };
      case 'accepted':
        return {
          icon: CheckCircle,
          label: 'Accepted',
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          dotColor: 'bg-emerald-500',
        };
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Rejected',
          bgColor: 'bg-rose-50 dark:bg-rose-900/30',
          textColor: 'text-rose-700 dark:text-rose-300',
          dotColor: 'bg-rose-500',
        };
      case 'cancelled':
        return {
          icon: XCircle,
          label: 'Cancelled',
          bgColor: 'bg-gray-100 dark:bg-slate-800',
          textColor: 'text-gray-600 dark:text-gray-400',
          dotColor: 'bg-gray-400',
        };
      default:
        return {
          icon: Clock,
          label: status,
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-700 dark:text-gray-300',
          dotColor: 'bg-gray-500',
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const statusConfig = getStatusConfig(quote.status);

  const handleClick = () => {
    navigate(`/quote/${quote.quote_id}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 p-3 glass rounded-xl border border-gray-200/50 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all active:scale-[0.99] text-left"
    >
      {/* Status dot */}
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusConfig.dotColor}`} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          {/* Quote ID (shortened) */}
          <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
            {quote.quote_id.length > 12 ? `${quote.quote_id.slice(0, 12)}...` : quote.quote_id}
          </span>
          {/* Price */}
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
            €{quote.total_cost?.toFixed(0) || '0'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          {/* Date and quantity */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{formatDate(quote.created_at)}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span>{quote.quantity} pcs</span>
          </div>
          {/* Status badge */}
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusConfig.bgColor} ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
    </button>
  );
};
