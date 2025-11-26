import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  // Convenience methods
  success: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => string;
  error: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => string;
  warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => string;
  info: (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATION = 4000;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duration = toast.duration ?? DEFAULT_DURATION;

    setToasts(prev => [...prev, { ...toast, id }]);

    // Auto-remove after duration (unless duration is 0 for persistent toasts)
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => {
    return addToast({ message, variant: 'success', ...options });
  }, [addToast]);

  const error = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => {
    return addToast({ message, variant: 'error', duration: 6000, ...options });
  }, [addToast]);

  const warning = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => {
    return addToast({ message, variant: 'warning', ...options });
  }, [addToast]);

  const info = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'variant'>>) => {
    return addToast({ message, variant: 'info', ...options });
  }, [addToast]);

  const value = useMemo(() => ({
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }), [toasts, addToast, removeToast, success, error, warning, info]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Container Component
interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

// Individual Toast Item
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const variantConfig = {
  success: {
    icon: CheckCircle,
    containerClass: 'bg-white/95 dark:bg-slate-900/95 border-emerald-200/80 dark:border-emerald-800/80',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    textClass: 'text-emerald-900 dark:text-emerald-100',
  },
  error: {
    icon: XCircle,
    containerClass: 'bg-white/95 dark:bg-slate-900/95 border-rose-200/80 dark:border-rose-800/80',
    iconClass: 'text-rose-600 dark:text-rose-400',
    textClass: 'text-rose-900 dark:text-rose-100',
  },
  warning: {
    icon: AlertCircle,
    containerClass: 'bg-white/95 dark:bg-slate-900/95 border-amber-200/80 dark:border-amber-800/80',
    iconClass: 'text-amber-600 dark:text-amber-400',
    textClass: 'text-amber-900 dark:text-amber-100',
  },
  info: {
    icon: Info,
    containerClass: 'bg-white/95 dark:bg-slate-900/95 border-sky-200/80 dark:border-sky-800/80',
    iconClass: 'text-sky-600 dark:text-sky-400',
    textClass: 'text-sky-900 dark:text-sky-100',
  },
};

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const config = variantConfig[toast.variant];
  const Icon = config.icon;

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 p-4 rounded-xl
        backdrop-blur-xl border shadow-lg
        animate-slide-up
        ${config.containerClass}
      `}
      role="alert"
    >
      <div className={`flex-shrink-0 ${config.iconClass}`}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.textClass}`}>
          {toast.message}
        </p>

        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
