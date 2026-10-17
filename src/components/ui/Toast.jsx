import { Sparkles } from 'lucide-react';

export const Toast = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed top-5 right-5 z-50 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 border border-slate-700 animate-slide-down">
      <Sparkles size={18} className="text-violet-400 animate-pulse" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
