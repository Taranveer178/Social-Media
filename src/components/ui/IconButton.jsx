

export const IconButton = ({ icon: Icon, onClick, active, badge, className = '', title }) => (
  <button 
    onClick={onClick}
    title={title}
    className={`relative p-2.5 rounded-2xl transition-all duration-200 active:scale-95
      ${active ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'}
      ${className}
    `}
  >
    <Icon size={20} strokeWidth={2.2} />
    {Boolean(badge) && (
      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
    )}
  </button>
);
