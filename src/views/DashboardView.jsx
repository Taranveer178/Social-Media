import { useContext, useState } from 'react';
import {
  Activity,
  Bell,
  Database,
  Flame,
  Heart,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { RouterContext } from '../contexts/RouterContext';
import { useData } from '../contexts/useData';
import { Avatar } from '../components/ui/Avatar';
import { StoryRing } from '../components/ui/StoryRing';
import { IconButton } from '../components/ui/IconButton';
import { FetchState } from '../components/ui/FetchState';

export const DashboardView = () => {
  const {
    stories,
    chats,
    moments,
    circles,
    users,
    unreadNotificationsCount,
    loading,
    errors,
    refreshStories,
    refreshChats,
    updateProfile,
    toggleMomentLike,
    seedDemoData,
    showToast,
  } = useData();
  const { navigate } = useContext(RouterContext);
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
    } catch (err) {
      showToast(err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 pb-24 md:pb-8">
      {/* Top Header Mobile */}
      <div className="md:hidden bg-white/90 dark:bg-slate-950/90 backdrop-blur-md p-4 sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white">
            <Activity size={18} />
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white">Vibely</span>
        </div>
        <div className="flex items-center space-x-1">
          <IconButton icon={Search} onClick={() => navigate('/discover')} title="Discover" />
          <IconButton icon={Bell} badge={unreadNotificationsCount > 0} onClick={() => navigate('/notifications')} title="Notifications" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        {/* Welcome / Empty Database Quick-Seeder Banner */}
        {(users.length === 0 && stories.length === 0 && moments.length === 0) && (
          <section className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-violet-200 dark:border-violet-900/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database size={16} className="text-violet-600" />
                <span>Fresh Firebase Database Detected</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Populate your Firestore collections (`profiles`, `stories`, `circles`, `moments`, `chats`, and `connections`) with sample community data so you can test every feature immediately.
              </p>
            </div>
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 shadow-md shadow-violet-500/20 transition-all"
            >
              {isSeeding ? 'Seeding Firestore...' : 'Seed Sample Firebase Data'}
            </button>
          </section>
        )}

        {/* Stories Section */}
        <section className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="text-violet-500" size={20} />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Vibe Stories</h2>
            </div>
            <button onClick={() => navigate('/stories')} className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              View All ({stories.length})
            </button>
          </div>

          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-none">
            <div
              onClick={() => navigate('/stories', { create: true })}
              className="flex flex-col items-center space-y-2 shrink-0 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-violet-400 dark:border-violet-600 flex items-center justify-center bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform">
                <Plus size={24} />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Add Story</span>
            </div>

            <FetchState loading={loading.stories} error={errors.stories} onRetry={refreshStories}>
              {stories.map((story) => {
                const author = story.author || users.find((u) => u.id === story.userId) || user;
                return (
                  <div
                    key={story.id}
                    onClick={() => navigate('/stories', { storyId: story.id })}
                    className="flex flex-col items-center space-y-1.5 shrink-0 cursor-pointer"
                  >
                    <StoryRing src={author?.avatar} name={author?.name} isViewed={story.isViewed} />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate w-16 text-center">
                      {author?.name?.split(' ')[0] || 'Vibely'}
                    </span>
                  </div>
                );
              })}
            </FetchState>
          </div>
        </section>

        {/* Quick Vibe Actions */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Chats', sub: `${chats.length} active`, icon: MessageCircle, path: '/chats' },
            { label: 'Circles', sub: `${circles.length} spaces`, icon: Users, path: '/circles' },
            { label: 'Mood Match', sub: `${users.length} people`, icon: Flame, path: '/discover' },
            { label: 'Moments', sub: `${moments.length} shared`, icon: Sparkles, path: '/moments' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className="p-4 rounded-2xl flex items-center space-x-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-green-300 dark:hover:border-green-800 transition-colors"
              >
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400">
                  <Icon size={22} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">{item.label}</span>
                  <span className="text-[11px] text-slate-400">{item.sub}</span>
                </div>
              </button>
            );
          })}
        </section>

        {/* Vibe Status Selector Filter */}
        <section className="bg-white dark:bg-slate-950 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Your current vibe</span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{user?.vibe || '🔥 Focused'}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">What is your energy right now?</h3>
            <div className="flex flex-wrap gap-2 pt-2">
              {['💻 Coding', '☕ Coffee', '🎧 Music', '✈️ Travel', '🔥 Focused', '😴 Tired'].map((vibe, idx) => {
                const isSelected = user?.vibe === vibe;
                return (
                  <button
                    key={idx}
                    onClick={() =>
                      updateProfile({ vibe })
                        .then(() => showToast(`Vibe updated to ${vibe}!`))
                        .catch((error) => showToast(error.message))
                    }
                    className={`px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {vibe}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Recent Conversations & Latest Moments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Conversations */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <MessageCircle className="text-violet-500" size={20} />
                <span>Recent Conversations</span>
              </h2>
              <button onClick={() => navigate('/chats')} className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                View All Chats
              </button>
            </div>

            <div className="bg-white dark:bg-slate-950 rounded-3xl p-2 shadow-sm border border-slate-200/80 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800/60">
              <FetchState loading={loading.chats} error={errors.chats} onRetry={refreshChats}>
                {chats.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <p className="text-xs text-slate-400">No active chats yet.</p>
                    <button
                      onClick={() => navigate('/discover')}
                      className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      Find someone on Discover to start chatting →
                    </button>
                  </div>
                ) : (
                  chats.slice(0, 4).map((chat) => {
                    const isGroup = chat.isGroup;
                    const participants = Array.isArray(chat.participants) ? chat.participants : [];
                    const otherId = participants.find((id) => id !== user?.id);
                    const otherUser = !isGroup
                      ? users.find((u) => u.id === otherId) || chat.participantProfiles?.[otherId]
                      : null;
                    const lastMsg = chat.messages?.[chat.messages.length - 1];

                    return (
                      <div
                        key={chat.id}
                        onClick={() => navigate('/chats', { chatId: chat.id })}
                        className="flex items-center p-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-2xl cursor-pointer transition-colors"
                      >
                        <Avatar
                          src={isGroup ? chat.groupAvatar : otherUser?.avatar}
                          name={isGroup ? chat.groupName : otherUser?.name}
                          isOnline={otherUser?.isOnline}
                          vibe={otherUser?.vibe}
                        />
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white truncate text-sm">
                              {isGroup ? chat.groupName : (otherUser?.name || 'Vibely User')}
                            </h3>
                            <span className="text-[11px] text-slate-400 shrink-0">{lastMsg?.timestamp || chat.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {lastMsg?.type === 'voice'
                              ? '🎙️ Voice note'
                              : lastMsg?.text || chat.lastMessage || 'Tap to chat'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </FetchState>
            </div>
          </section>

          {/* Latest Moments Feed Preview */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Sparkles className="text-fuchsia-500" size={20} />
                <span>Latest Moments</span>
              </h2>
              <button onClick={() => navigate('/moments')} className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                Open Moments Feed
              </button>
            </div>

            <div className="bg-white dark:bg-slate-950 rounded-3xl p-3 shadow-sm border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              {moments.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-xs text-slate-400">No moments shared yet.</p>
                  <button
                    onClick={() => navigate('/moments')}
                    className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Share the first moment →
                  </button>
                </div>
              ) : (
                moments.slice(0, 2).map((moment) => (
                  <div
                    key={moment.id}
                    className="flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <img
                      src={moment.image || moment.imageUrl}
                      alt={moment.title}
                      onClick={() => navigate('/moments')}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{moment.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        by {moment.author?.name || 'Vibely User'} • {moment.circleName || 'Public'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <button
                          onClick={() => toggleMomentLike(moment.id).catch((e) => showToast(e.message))}
                          className={`flex items-center gap-1 font-semibold ${moment.isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}
                        >
                          <Heart size={13} className={moment.isLiked ? 'fill-rose-500 text-rose-500' : ''} />
                          <span>{moment.likes ?? 0}</span>
                        </button>
                        <button
                          onClick={() => navigate('/moments')}
                          className="flex items-center gap-1 hover:text-violet-500"
                        >
                          <MessageCircle size={13} />
                          <span>{moment.comments ?? 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
