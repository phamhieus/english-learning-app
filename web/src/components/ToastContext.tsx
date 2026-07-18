import { useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from './classNames';
import { ToastContext, type ToastType, type ToastAction, type ToastOptions } from './toast-context';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType, options?: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, action: options?.action }]);

    const duration = options?.duration === undefined ? 3000 : options.duration;
    if (duration !== null && duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const success = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast]);
  const info = useCallback((message: string) => addToast(message, 'info'), [addToast]);

  const contextValue = useMemo(() => ({ addToast, success, error, info }), [addToast, success, error, info]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Mobile: full-width above the bottom tab bar; desktop: bottom-right stack */}
      <div className="fixed bottom-24 inset-x-4 md:bottom-6 md:left-auto md:right-6 z-50 flex flex-col gap-3 items-stretch md:items-end">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 md:slide-in-from-right-8 fade-in duration-300 md:min-w-[300px]",
              toast.type === 'success' ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800/50" :
              toast.type === 'error' ? "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/50" :
              "bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800/50"
            )}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}

            <span className="font-medium flex-1">{toast.message}</span>

            {toast.action && (
              <button
                onClick={() => { toast.action!.onClick(); dismiss(toast.id); }}
                className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity shrink-0"
              >
                {toast.action.label}
              </button>
            )}

            <button
              onClick={() => dismiss(toast.id)}
              className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
