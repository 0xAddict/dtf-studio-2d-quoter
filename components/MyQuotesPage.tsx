import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getUserQuotes, updateQuoteStatus, Quote, getUserQuoteStats } from '../services/supabase/quotes';
import { QuoteCard } from './QuoteCard';
import { ConfirmationDialog } from './ui/ConfirmationDialog';

type FilterType = 'all' | 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'cancelled';
type ViewMode = 'grid' | 'list';

export const MyQuotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [confirmQuoteId, setConfirmQuoteId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    accepted: 0,
    rejected: 0,
    cancelled: 0,
    totalValue: 0,
  });

  // Load quotes on mount
  useEffect(() => {
    loadQuotes();
    loadStats();
  }, []);

  // Filter and search quotes when filter or search term changes
  useEffect(() => {
    let result = quotes;

    // Apply status filter
    if (filter !== 'all') {
      result = result.filter(q => q.status === filter);
    }

    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      result = result.filter(q =>
        q.quote_id.toLowerCase().includes(search) ||
        q.model_file_name.toLowerCase().includes(search) ||
        q.material.toLowerCase().includes(search)
      );
    }

    setFilteredQuotes(result);
  }, [quotes, filter, searchTerm]);

  const loadQuotes = async () => {
    console.log('📊 MyQuotesPage: Loading quotes...');
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await getUserQuotes();

      if (fetchError) {
        console.error('❌ Failed to load quotes:', fetchError);

        // Check if it's a table doesn't exist error
        if (fetchError.message?.includes('relation') && fetchError.message?.includes('does not exist')) {
          setError('Quote requests table not set up yet. Please run the SQL migration in Supabase Dashboard.');
        } else {
          setError(fetchError.message || 'Failed to load quotes');
        }
        setLoading(false);
        return;
      }

      console.log('✅ Loaded', data?.length || 0, 'quotes');
      setQuotes(data || []);
    } catch (err: any) {
      console.error('❌ Unexpected error loading quotes:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    console.log('📊 MyQuotesPage: Loading stats...');
    try {
      const { data, error: statsError } = await getUserQuoteStats();

      if (statsError) {
        console.error('❌ Failed to load stats:', statsError);
        // Don't show error to user, stats are optional
        return;
      }

      if (data) {
        console.log('✅ Stats loaded:', data);
        setStats(data);
      }
    } catch (err) {
      console.error('❌ Unexpected error loading stats:', err);
      // Don't show error to user, stats are optional
    }
  };

  const handleCancelQuote = async () => {
    if (!confirmQuoteId) return;

    setIsCancelling(true);
    try {
      const { error: cancelError } = await updateQuoteStatus(confirmQuoteId, 'cancelled');

      if (cancelError) {
        throw cancelError;
      }

      await loadQuotes();
      await loadStats();
      toast.success('Quote cancelled successfully.');
    } catch (err: any) {
      console.error('❌ Failed to cancel quote:', err);
      toast.error('Failed to cancel quote. Please try again.');
    } finally {
      setIsCancelling(false);
      setConfirmQuoteId(null);
    }
  };

  const handleDownloadPDF = (quoteId: string) => {
    console.log('Download PDF requested for', quoteId);
    toast.info('PDF download will be available soon.');
  };

  const renderViewToggle = () => (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-inner" role="group" aria-label="View toggle">
      <button
        onClick={() => setViewMode('grid')}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
          viewMode === 'grid'
            ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-200 shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-200'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        Grid
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
          viewMode === 'list'
            ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-200 shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-200'
        }`}
      >
        <List className="w-4 h-4" />
        List
      </button>
    </div>
  );

  // Stats cards data
  const statsCards = [
    {
      label: 'Total Quotes',
      value: stats.total,
      icon: TrendingUp,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
    {
      label: 'Accepted',
      value: stats.accepted,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      label: 'Total Value',
      value: `€${stats.totalValue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="glass border-b border-gray-200/50 dark:border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                aria-label="Back to viewer"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Quotes</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.name} • {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="glass rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters & Search */}
        <div className="glass rounded-2xl border border-gray-200/50 dark:border-slate-700/50 p-5 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Search */}
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by quote ID, model name, or material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50/80 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-200"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-end">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterType)}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* View Toggle */}
              {renderViewToggle()}
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredQuotes.length} of {quotes.length} quotes
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center shadow-sm">
            <XCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
              Failed to Load Quotes
            </h3>
            <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={loadQuotes}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && quotes.length === 0 && (
          <div className="glass border border-gray-200/50 dark:border-slate-700/50 rounded-2xl p-12 text-center shadow-sm">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Quotes Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You haven't submitted any quote requests yet. Upload a model and request a quote to get started!
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-medium transition-all min-h-[48px] shadow-sm hover:shadow-md"
              >
                Upload Model
              </button>
            </div>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && quotes.length > 0 && filteredQuotes.length === 0 && (
          <div className="glass border border-gray-200/50 dark:border-slate-700/50 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Quotes Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or search term.
            </p>
          </div>
        )}

        {/* Quotes Layout */}
        {!loading && !error && filteredQuotes.length > 0 && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-5' : 'space-y-4'}>
            {filteredQuotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onCancel={() => setConfirmQuoteId(quote.quote_id)}
                onDownload={handleDownloadPDF}
                layout={viewMode}
                isCancelling={isCancelling && confirmQuoteId === quote.quote_id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!confirmQuoteId}
        onClose={() => setConfirmQuoteId(null)}
        onConfirm={handleCancelQuote}
        title="Cancel Quote"
        message={`Are you sure you want to cancel quote ${confirmQuoteId}? This action cannot be undone.`}
        confirmLabel="Cancel Quote"
        cancelLabel="Keep Quote"
        variant="danger"
        isLoading={isCancelling}
      />
    </div>
  );
};
