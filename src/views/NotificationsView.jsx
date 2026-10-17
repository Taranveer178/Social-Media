import { Bell, CheckCheck, Circle, Sparkles, Trash2 } from 'lucide-react';
import { useRouter } from '../contexts/useRouter';
import { useData } from '../contexts/useData';

export function NotificationsView() {
  const { navigate } = useRouter();
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useData();

  const handleOpenNotification = (notification) => {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-300">
              <Bell size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-500 font-bold">Inbox</p>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => markAllNotificationsRead()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-violet-200 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
            <button
              onClick={() => clearNotifications()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
            >
              <Trash2 size={14} />
              Clear
            </button>
          </div>
        </header>

        <section className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-10 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-300">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">No notifications yet</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You’ll see new messages, replies, circles, and community updates here.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleOpenNotification(notification)}
                  className={`w-full text-left p-4 md:p-5 transition-colors ${
                    notification.read
                      ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/70'
                      : 'bg-violet-50/70 dark:bg-violet-950/20 hover:bg-violet-50 dark:hover:bg-violet-950/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative mt-1 shrink-0">
                      {notification.senderAvatar ? (
                        <img
                          src={notification.senderAvatar}
                          alt={notification.senderName || 'User'}
                          className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-amber-400 flex items-center justify-center text-white text-xs font-bold uppercase">
                          {(notification.senderName || 'V').slice(0, 1)}
                        </div>
                      )}
                      {!notification.read && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-violet-500 ring-2 ring-white dark:ring-slate-950" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {notification.title || notification.type || 'Vibely update'}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {notification.time || 'Just now'}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {notification.body || 'You have a new update.'}
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          <Circle size={8} fill="currentColor" className="text-violet-500" />
                          {notification.type || 'update'}
                        </span>
                        {!notification.read && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {unreadNotificationsCount > 0 && (
          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            {unreadNotificationsCount} unread notification{unreadNotificationsCount === 1 ? '' : 's'}
          </div>
        )}
      </div>
    </main>
  );
}
