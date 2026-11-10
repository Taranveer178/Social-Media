import { useState } from 'react';

export const StoryRing = ({ src, name = 'Story', isViewed, size = 'lg', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const sizes = { md: 'w-14 h-14', lg: 'w-16 h-16' };
  const fallbackUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

  return (
    <div className={`rounded-full p-[2px] ${isViewed ? 'bg-slate-300 dark:bg-slate-700' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'} ${className} transition-transform hover:scale-105`}>
      <div className="rounded-full bg-white p-[2px] dark:bg-slate-950">
        <img
          src={!imgError && src ? src : fallbackUrl}
          onError={() => setImgError(true)}
          className={`${sizes[size]} rounded-full bg-violet-100 object-cover dark:bg-slate-800`}
          alt="Story"
        />
      </div>
    </div>
  );
};
