import { useContext } from 'react';
import { Globe, Home, MessageCircle, Sparkles, User, Users } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import { RouterContext } from '../../contexts/RouterContext';

export const BottomNav = () => {
  const { currentRoute, navigate } = useContext(RouterContext);
  const { user } = useContext(AuthContext);

  const navItems = [
    { id: '/', icon: Home },
    { id: '/chats', icon: MessageCircle, badge: true },
    { id: '/circles', icon: Users },
    { id: '/moments', icon: Sparkles },
    { id: '/discover', icon: Globe },
    { id: '/profile', icon: User, avatar: user?.avatar },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 pb-safe z-40">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id || (currentRoute.startsWith(item.id) && item.id !== '/');
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className="p-2.5 relative rounded-2xl transition-transform active:scale-90"
            >
              {item.avatar ? (
                <div className={`rounded-full p-0.5 transition-all ${isActive ? 'ring-2 ring-violet-500 scale-105' : ''}`}>
                  <img src={item.avatar} className="w-6 h-6 rounded-full object-cover" alt="profile" />
                </div>
              ) : (
                <Icon
                  size={22}
                  className={isActive ? 'text-violet-600 dark:text-violet-400 scale-110' : 'text-slate-400 dark:text-slate-500'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              )}
              {item.badge && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
