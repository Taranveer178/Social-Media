import {
  Activity,
  Bell,
  Bookmark,
  Globe,
  Home,
  LogOut,
  MessageCircle,
  Moon,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useData } from '../../contexts/useData';
import { useRouter } from '../../contexts/useRouter';
import { useTheme } from '../../contexts/useTheme';
import { Avatar } from '../ui/Avatar';

export const Sidebar = () => {
  const { currentRoute, navigate } = useRouter();
  const { logout, user } = useAuth();
  const { unreadNotificationsCount, chats } = useData();
  const { isDark, toggleTheme } = useTheme();

  const navItems = [
    { id: '/', icon: Home, label: 'Feed & Home' },
    { id: '/chats', icon: MessageCircle, label: 'Chats', badge: chats.length > 0 },
    { id: '/circles', icon: Users, label: 'Private Circles' },
    { id: '/moments', icon: Sparkles, label: 'Moments' },
    { id: '/discover', icon: Globe, label: 'Discover & Vibe' },
    { id: '/notifications', icon: Bell, label: 'Notifications', badge: unreadNotificationsCount > 0, count: unreadNotificationsCount },
    { id: '/saved', icon: Bookmark, label: 'Saved Messages' },
    { id: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: '/admin', icon: Shield, label: 'Admin Panel' });
  }

  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-64 h-screen bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 z-20 shrink-0">
      <div className="p-4 flex items-center justify-center lg:justify-start space-x-3 my-2 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
          <Activity className="text-white" size={22} />
        </div>
        <div className="hidden lg:block">
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Vibely
          </span>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">SHARE YOUR VIBE</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1.5 mt-2 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id || (currentRoute.startsWith(item.id) && item.id !== '/');
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-colors duration-150 group
                ${isActive
                  ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
                }
              `}
            >
              <div className="relative flex items-center justify-center lg:justify-start w-full">
                <Icon size={21} strokeWidth={isActive ? 2.25 : 1.8} className="shrink-0" />
                <span className="hidden lg:block ml-3.5 text-sm">{item.label}</span>
                {item.badge && (
                  item.count ? (
                    <span className="absolute right-0 lg:static lg:ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  ) : (
                    <span className="absolute right-0 lg:static lg:ml-auto w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                  )
                )}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <button onClick={toggleTheme} className="w-full flex items-center justify-center lg:justify-start p-2.5 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">
          {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
          <span className="hidden lg:block ml-3 text-sm font-medium">{isDark ? 'Light Theme' : 'Dark Theme'}</span>
        </button>

        <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer" onClick={() => navigate('/profile')}>
          <Avatar src={user?.avatar} name={user?.name} size="sm" isOnline={true} />
          <div className="hidden lg:block ml-2.5 flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">@{user?.username}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              logout();
            }}
            title="Sign Out"
            className="hidden lg:block text-slate-400 hover:text-rose-500 p-1"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};
