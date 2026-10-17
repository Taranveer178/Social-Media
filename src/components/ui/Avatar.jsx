import { useState } from 'react';

export const Avatar = ({ src, name = 'V', size = 'md', isOnline, vibe, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const fallbackUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name || 'Vibely')}`;
  const displaySrc = !imgError && src ? src : fallbackUrl;

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <img
        src={displaySrc}
        onError={() => setImgError(true)}
        alt={name || 'Avatar'}
        className={`${sizes[size] || sizes.md} rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm bg-violet-100 dark:bg-slate-800`}
      />
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
      )}
      {vibe && (
        <span className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 text-[10px] px-1.5 py-0.5 rounded-full shadow-md border border-slate-100 dark:border-slate-700 whitespace-nowrap">
          {vibe.split(' ')[0]}
        </span>
      )}
    </div>
  );
};
