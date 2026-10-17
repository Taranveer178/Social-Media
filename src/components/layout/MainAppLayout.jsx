import { useContext } from 'react';
import { RouterContext } from '../../contexts/RouterContext';
import { useData } from '../../contexts/useData';
import { Toast } from '../ui/Toast';
import { ActiveCallOverlay } from '../ui/ActiveCallOverlay';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { DashboardView } from '../../views/DashboardView';
import { ChatView } from '../../views/ChatView';
import { StoriesView } from '../../views/StoriesView';
import { CirclesView } from '../../views/CirclesView';
import { MomentsView } from '../../views/MomentsView';
import { DiscoverView } from '../../views/DiscoverView';
import { NotificationsView } from '../../views/NotificationsView';
import { SavedMessagesView } from '../../views/SavedMessagesView';
import { SettingsView } from '../../views/SettingsView';
import { AdminDashboardView } from '../../views/AdminDashboardView';

export function MainAppLayout() {
  const { currentRoute } = useContext(RouterContext);
  const { toastMessage } = useData();
  const views = {
    '/': <DashboardView />,
    '/chats': <ChatView />,
    '/stories': <StoriesView />,
    '/circles': <CirclesView />,
    '/moments': <MomentsView />,
    '/discover': <DiscoverView />,
    '/notifications': <NotificationsView />,
    '/saved': <SavedMessagesView />,
    '/settings': <SettingsView />,
    '/profile': <SettingsView />,
    '/admin': <AdminDashboardView />,
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
      <Toast message={toastMessage} />
      <Sidebar />
      {views[currentRoute] || <DashboardView />}
      <BottomNav />
      <ActiveCallOverlay />
    </div>
  );
}
