import { useContext, useState } from 'react';
import {
  Bell,
  Clapperboard,
  Database,
  Heart,
  MessageCircle,
  Plus,
  Search,
  Send,
  Sparkles,
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
    moments,
    users,
    unreadNotificationsCount,
    loading,
    errors,
    refreshStories,
    refreshMoments,
    toggleMomentLike,
    addMomentComment,
    seedDemoData,
    showToast,
  } = useData();
  const { navigate } = useContext(RouterContext);
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [activeFeed, setActiveFeed] = useState('posts');
  const [openCommentsId, setOpenCommentsId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  const feedMoments = activeFeed === 'reels'
    ? moments.filter((moment) => moment.mediaType === 'video' || moment.type === 'reel')
    : moments.filter((moment) => moment.mediaType !== 'video' && moment.type !== 'reel');

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
    } catch (error) {
      showToast(error.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleComment = async (event, momentId) => {
    event.preventDefault();
    const text = commentInputs[momentId]?.trim();
    if (!text) return;

    try {
      await addMomentComment(momentId, text);
      setCommentInputs((current) => ({ ...current, [momentId]: '' }));
    } catch (error) {
      showToast(error.message);
    }
  };

  const handleShare = async (moment) => {
    const shareUrl = `${window.location.origin}/moments`;
    try {
      await navigator.clipboard.writeText(`${moment.title || 'Check out this post'} ${shareUrl}`);
      showToast('Post link copied.');
    } catch {
      showToast('Could not copy the post link on this device.');
    }
  };

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-[#fafafa] text-slate-950 dark:bg-slate-950 dark:text-slate-100 pb-24 md:pb-8">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
        <button onClick={() => navigate('/')} className="font-serif text-[26px] font-bold tracking-tight" aria-label="Vibely home">
          vibely
        </button>
        <div className="flex items-center gap-1">
          <IconButton icon={Plus} onClick={() => navigate('/moments', { create: true })} title="Create post" />
          <IconButton icon={Heart} onClick={() => navigate('/notifications')} title="Notifications" badge={unreadNotificationsCount > 0} />
          <IconButton icon={MessageCircle} onClick={() => navigate('/chats')} title="Messages" />
        </div>
      </header>

      <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-10 px-0 py-0 md:px-8 md:py-8 lg:grid-cols-[minmax(0,630px)_minmax(260px,320px)]">
        <div className="min-w-0">
          {users.length === 0 && stories.length === 0 && moments.length === 0 && (
            <section className="m-4 flex flex-col gap-4 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm dark:border-violet-900 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between md:m-0 md:mb-6">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <Database size={16} className="text-violet-600" />
                  Your community is ready for its first post
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add sample people, stories, and posts to explore Vibely.
                </p>
              </div>
              <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="shrink-0 rounded-full bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
              >
                {isSeeding ? 'Loading sample data…' : 'Explore sample data'}
              </button>
            </section>
          )}

          <section aria-label="Stories" className="border-y border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 md:mb-6 md:rounded-xl md:border md:px-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Stories</h2>
              <button onClick={() => navigate('/stories')} className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400">
                See all
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1">
              <button
                onClick={() => navigate('/stories', { create: true })}
                className="flex w-[62px] shrink-0 flex-col items-center gap-1.5"
              >
                <span className="relative flex h-[62px] w-[62px] items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-violet-600 dark:border-slate-700 dark:bg-slate-900">
                  <Avatar src={user?.avatar} name={user?.name} size="lg" className="opacity-60" />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-white dark:border-slate-950">
                    <Plus size={14} />
                  </span>
                </span>
                <span className="w-full truncate text-center text-[11px]">Your story</span>
              </button>
              <FetchState loading={loading.stories} error={errors.stories} onRetry={refreshStories}>
                {stories.map((story) => {
                  const author = story.author || users.find((item) => item.id === story.userId) || user;
                  return (
                    <button
                      key={story.id}
                      onClick={() => navigate('/stories', { storyId: story.id })}
                      className="flex w-[62px] shrink-0 flex-col items-center gap-1.5"
                    >
                      <StoryRing src={author?.avatar} name={author?.name} isViewed={story.isViewed} />
                      <span className="w-full truncate text-center text-[11px]">{author?.name?.split(' ')[0] || 'Vibely'}</span>
                    </button>
                  );
                })}
              </FetchState>
            </div>
          </section>

          <nav aria-label="Feed type" className="sticky top-[57px] z-20 grid grid-cols-2 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:static md:mb-4 md:rounded-xl md:border">
            <button
              onClick={() => setActiveFeed('posts')}
              aria-pressed={activeFeed === 'posts'}
              className={`flex items-center justify-center gap-2 border-b-2 py-3 text-xs font-bold uppercase tracking-[0.12em] transition ${
                activeFeed === 'posts'
                  ? 'border-violet-600 text-violet-700 dark:text-violet-300'
                  : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles size={15} /> Posts
            </button>
            <button
              onClick={() => setActiveFeed('reels')}
              aria-pressed={activeFeed === 'reels'}
              className={`flex items-center justify-center gap-2 border-b-2 py-3 text-xs font-bold uppercase tracking-[0.12em] transition ${
                activeFeed === 'reels'
                  ? 'border-violet-600 text-violet-700 dark:text-violet-300'
                  : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Clapperboard size={15} /> Reels
            </button>
          </nav>

          <FetchState loading={loading.moments} error={errors.moments} onRetry={refreshMoments}>
            {feedMoments.length === 0 ? (
              <section className="mx-4 my-8 flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900 md:mx-0">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700">
                  {activeFeed === 'reels' ? <Clapperboard size={25} /> : <Sparkles size={25} />}
                </span>
                <h2 className="text-base font-semibold">
                  {activeFeed === 'reels' ? 'No Reels yet' : 'Your feed is waiting'}
                </h2>
                <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                  {activeFeed === 'reels'
                    ? 'Share a short video to start your Reels feed.'
                    : 'Share a photo with your community or explore people to follow.'}
                </p>
                <button
                  onClick={() => navigate('/moments', { create: true, mediaType: activeFeed === 'reels' ? 'video' : 'image' })}
                  className="mt-5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  {activeFeed === 'reels' ? 'Create a Reel' : 'Create your first post'}
                </button>
              </section>
            ) : (
              <div className={activeFeed === 'reels' ? 'space-y-5 px-3 py-4 md:px-0' : 'space-y-4 md:space-y-5'}>
                {feedMoments.map((moment) => {
                  const author = moment.author || users.find((item) => item.id === moment.authorId);
                  const commentsList = Array.isArray(moment.commentsList) ? moment.commentsList : [];
                  const isCommentsOpen = openCommentsId === moment.id;
                  const mediaSrc = moment.mediaUrl || moment.image || moment.imageUrl;
                  const isReel = moment.mediaType === 'video' || moment.type === 'reel';

                  return (
                    <article
                      key={moment.id}
                      className={`overflow-hidden border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:rounded-xl md:border ${
                        activeFeed === 'reels' ? 'mx-auto max-w-[440px]' : ''
                      }`}
                    >
                      <header className="flex items-center justify-between px-3 py-3 md:px-4">
                        <div className="flex min-w-0 items-center gap-3 text-left">
                          <Avatar src={author?.avatar || moment.authorAvatar} name={author?.name || moment.authorName} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold">
                              {author?.username || author?.name || moment.authorName || 'Vibely User'}
                            </span>
                            <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                              {moment.location || moment.circleName || 'Vibely'}
                            </span>
                          </span>
                        </div>
                      </header>

                      {isReel ? (
                        <video
                          src={mediaSrc}
                          controls
                          playsInline
                          preload="metadata"
                          className="aspect-[9/16] max-h-[78vh] w-full bg-black object-contain"
                          aria-label={moment.title || 'Reel'}
                        />
                      ) : (
                        <img
                          src={mediaSrc}
                          alt={moment.title || 'Community post'}
                          className="aspect-[4/5] w-full bg-slate-100 object-cover dark:bg-slate-900"
                          loading="lazy"
                        />
                      )}

                      <div className="px-3 pb-3 pt-2 md:px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => toggleMomentLike(moment.id).catch((error) => showToast(error.message))}
                              aria-label={moment.isLiked ? 'Unlike post' : 'Like post'}
                              className={`transition active:scale-90 ${moment.isLiked ? 'text-rose-500' : 'hover:text-slate-500'}`}
                            >
                              <Heart size={25} strokeWidth={1.8} className={moment.isLiked ? 'fill-rose-500' : ''} />
                            </button>
                            <button
                              onClick={() => setOpenCommentsId(isCommentsOpen ? null : moment.id)}
                              aria-label="Show comments"
                              className="transition hover:text-slate-500"
                            >
                              <MessageCircle size={24} strokeWidth={1.8} />
                            </button>
                            <button onClick={() => handleShare(moment)} aria-label="Share post" className="transition hover:text-slate-500">
                              <Send size={23} strokeWidth={1.8} />
                            </button>
                          </div>
                        </div>

                        <p className="mt-2 text-[13px] font-semibold">
                          {moment.likes ?? 0} {moment.likes === 1 ? 'like' : 'likes'}
                        </p>
                        <p className="mt-1 text-[13px] leading-5">
                          <span className="mr-1.5 font-semibold">{author?.username || author?.name || moment.authorName || 'Vibely User'}</span>
                          {moment.title}
                        </p>
                        <button
                          onClick={() => setOpenCommentsId(isCommentsOpen ? null : moment.id)}
                          className="mt-1 text-[13px] text-slate-500 dark:text-slate-400"
                        >
                          View all {moment.comments ?? commentsList.length} comments
                        </button>
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{moment.time || 'Just now'}</p>

                        {isCommentsOpen && (
                          <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                            {commentsList.map((comment) => (
                              <div key={comment.id} className="text-[13px] leading-5">
                                <span className="mr-2 font-semibold">{comment.authorName || 'Vibely User'}</span>
                                {comment.text}
                              </div>
                            ))}
                            <form onSubmit={(event) => handleComment(event, moment.id)} className="flex gap-2">
                              <input
                                value={commentInputs[moment.id] || ''}
                                onChange={(event) => setCommentInputs((current) => ({ ...current, [moment.id]: event.target.value }))}
                                placeholder="Add a comment…"
                                aria-label="Write a comment"
                                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
                              />
                              <button type="submit" className="text-sm font-semibold text-violet-600 disabled:opacity-50" disabled={!commentInputs[moment.id]?.trim()}>
                                Post
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </FetchState>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-5">
            <div className="flex items-center gap-3">
              <Avatar src={user?.avatar} name={user?.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user?.username || user?.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.name}</p>
              </div>
              <button onClick={() => navigate('/profile')} className="text-xs font-semibold text-violet-600 dark:text-violet-400">Profile</button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-500">Suggested for you</h2>
                <button onClick={() => navigate('/discover')} className="text-xs font-semibold">See all</button>
              </div>
              <div className="space-y-3">
                {users.filter((item) => item.id !== user?.id).slice(0, 4).map((suggestion) => (
                  <div key={suggestion.id} className="flex items-center gap-3">
                    <Avatar src={suggestion.avatar} name={suggestion.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{suggestion.username || suggestion.name}</p>
                      <p className="truncate text-[11px] text-slate-500">{suggestion.vibe || 'Suggested for you'}</p>
                    </div>
                    <button onClick={() => navigate('/discover')} className="text-xs font-semibold text-violet-600 dark:text-violet-400">View</button>
                  </div>
                ))}
                {users.length <= 1 && <p className="text-xs text-slate-500">Explore people to find your community.</p>}
              </div>
            </div>
            <div className="flex items-center gap-x-2 gap-y-1 text-[10px] text-slate-400">
              <button onClick={() => navigate('/settings')} className="hover:underline">Settings</button>
              <button onClick={() => navigate('/discover')} className="hover:underline">Discover</button>
              <span>© 2026 VIBELY</span>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed right-5 top-5 z-20 hidden md:flex items-center gap-2">
        <IconButton icon={Search} onClick={() => navigate('/discover')} title="Discover" />
        <IconButton icon={Bell} badge={unreadNotificationsCount > 0} onClick={() => navigate('/notifications')} title="Notifications" />
        <button
          onClick={() => navigate('/moments', { create: true })}
          className="flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/10 transition hover:bg-violet-700"
        >
          <Plus size={17} /> Create
        </button>
      </div>
    </main>
  );
};
