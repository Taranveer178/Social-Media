import { AlertCircle, RefreshCw } from 'lucide-react';

export function FetchState({ loading, error, onRetry, children }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-violet-600" role="status" aria-live="polite">
        <RefreshCw size={20} className="animate-spin" />
        <span className="ml-2 text-sm">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-rose-600 dark:text-rose-400" role="alert">
        <AlertCircle size={22} className="mx-auto mb-2" />
        <p className="text-sm">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-3 inline-flex items-center gap-2 text-xs font-bold hover:underline">
            <RefreshCw size={14} /> Try again
          </button>
        )}
      </div>
    );
  }

  return children;
}
