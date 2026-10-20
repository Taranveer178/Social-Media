import { useContext, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Image as ImageIcon, Plus, Send, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useData } from '../contexts/useData';
import { RouterContext } from '../contexts/RouterContext';
import { Avatar } from '../components/ui/Avatar';
import { FetchState } from '../components/ui/FetchState';
import { uploadMedia } from '../services/storage';

export const StoriesView = () => {
  const { user } = useAuth();
  const {
    stories,
    users,
    loading,
    errors,
    refreshStories,
    createStory,
    markStoryViewed,
    toggleStoryLike,
    replyToStory,
    deleteStory,
    showToast,
  } = useData();
  const { navigate, routeParams } = useContext(RouterContext);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showCreate, setShowCreate] = useState(Boolean(routeParams.create));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const routeStoryIndex = routeParams.storyId
    ? stories.findIndex((story) => story.id === routeParams.storyId)
    : -1;
  const currentIndex = selectedIndex ?? (routeStoryIndex >= 0 ? routeStoryIndex : 0);
  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, stories.length - 1));
  const activeStory = stories[safeIndex] || null;
  const storyAuthor = activeStory?.author
    || activeStory?.user
    || users.find((item) => item.id === activeStory?.userId)
    || (activeStory?.userId === user?.id ? user : null)
    || user;

  useEffect(() => {
    if (!activeStory?.id || activeStory.isViewed) return;
    markStoryViewed(activeStory.id).catch((error) => setSubmitError(error.message));
  }, [activeStory?.id, activeStory?.isViewed, markStoryViewed]);

  async function handleCreate(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const imageFile = selectedImage;
    if (!imageFile) {
      setSubmitError('Choose an image for your story.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const image = await uploadMedia(imageFile);
      await createStory({
        image,
        caption: form.get('caption') || '',
        vibe: form.get('vibe') || user?.vibe || '✨ Vibing',
      });
      setShowCreate(false);
      setSelectedImage(null);
      setSelectedIndex(0);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendReply(event) {
    event.preventDefault();
    if (!activeStory || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      await replyToStory(activeStory, replyText.trim());
      setReplyText('');
    } catch (error) {
      showToast(error.message);
    } finally {
      setIsSendingReply(false);
    }
  }

  async function handleLikeStory() {
    if (!activeStory) return;
    try {
      await toggleStoryLike(activeStory.id);
    } catch (error) {
      showToast(error.message);
    }
  }

  return (
    <div className="flex-1 h-full min-h-0 bg-black flex items-center justify-center relative p-4 pb-20 md:pb-4">
      <div className="absolute top-5 right-5 flex items-center gap-2 z-30">
        <button
          onClick={() => setShowCreate(true)}
          className="text-white bg-violet-600 hover:bg-violet-700 px-3.5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg"
        >
          <Plus size={16} /> Add Story
        </button>
        <button
          onClick={() => navigate('/')}
          className="text-white bg-white/20 hover:bg-white/30 p-2.5 rounded-full backdrop-blur-md"
          title="Close Stories"
        >
          <X size={20} />
        </button>
      </div>

      <FetchState loading={loading.stories} error={errors.stories} onRetry={refreshStories}>
        {activeStory ? (
          <div className="w-full max-w-sm h-[85vh] bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col justify-between p-4">
            <img
              src={activeStory.image || activeStory.imageUrl}
              className="absolute inset-0 w-full h-full object-cover opacity-85"
              alt="Story"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85 pointer-events-none"></div>

            {/* Top Header */}
            <div className="relative z-20 space-y-3">
              <div className="flex space-x-1">
                {stories.map((story, index) => (
                  <button
                    key={story.id}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer"
                  >
                    <div className={`h-full bg-white transition-all duration-300 ${index <= safeIndex ? 'w-full' : 'w-0'}`}></div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-2">
                  <Avatar src={storyAuthor?.avatar} name={storyAuthor?.name} size="sm" />
                  <div>
                    <p className="text-xs font-bold">{storyAuthor?.name || 'Vibely User'}</p>
                    <p className="text-[10px] opacity-75">
                      {activeStory.timestamp} • {(activeStory.viewedBy || []).length} views
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeStory.vibe && (
                    <span className="text-xs font-semibold bg-violet-600 px-2.5 py-1 rounded-full">
                      {activeStory.vibe}
                    </span>
                  )}
                  {activeStory.userId === user?.id && (
                    <button
                      onClick={() => deleteStory(activeStory.id).catch((e) => showToast(e.message))}
                      className="p-1.5 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white"
                      title="Delete Story"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Prev / Next Navigation Buttons */}
            <div className="relative z-20 flex items-center justify-between my-auto pointer-events-none">
              <button
                type="button"
                disabled={safeIndex === 0}
                onClick={() => setSelectedIndex((i) => Math.max(0, (i ?? currentIndex) - 1))}
                className="pointer-events-auto p-2 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-20"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                disabled={safeIndex >= stories.length - 1}
                onClick={() => setSelectedIndex((i) => Math.min(stories.length - 1, (i ?? currentIndex) + 1))}
                className="pointer-events-auto p-2 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-20"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Bottom Caption, Reply & Like */}
            <div className="relative z-20 space-y-3">
              {activeStory.caption && (
                <p className="text-white text-sm font-semibold drop-shadow-md bg-black/30 backdrop-blur-xs p-2.5 rounded-2xl">
                  {activeStory.caption}
                </p>
              )}
              <form onSubmit={handleSendReply} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${storyAuthor?.name?.split(' ')[0] || 'story'}...`}
                  className="flex-1 bg-white/20 backdrop-blur-md text-white text-xs px-4 py-2.5 rounded-2xl border border-white/20 placeholder-white/70 focus:outline-none focus:border-violet-400"
                />
                {replyText.trim() && (
                  <button
                    type="submit"
                    disabled={isSendingReply}
                    className="bg-violet-600 hover:bg-violet-700 text-white p-2.5 rounded-2xl"
                    title="Send Reply"
                  >
                    <Send size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLikeStory}
                  className={`p-2.5 rounded-2xl flex items-center gap-1 text-xs font-bold transition-transform active:scale-90 ${
                    activeStory.isLiked ? 'bg-rose-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <Heart size={16} className={activeStory.isLiked ? 'fill-white' : ''} />
                  <span>{activeStory.likes || 0}</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-white text-sm">No stories yet. Share the first one!</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-violet-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold"
            >
              + Create Story
            </button>
          </div>
        )}
      </FetchState>

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white dark:bg-slate-950 max-w-md w-full p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create a Story</h2>
              <button type="button" onClick={() => setShowCreate(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer p-3 rounded-2xl bg-slate-100 dark:bg-slate-900">
              <ImageIcon size={18} className="text-violet-600" />
              <span className="truncate">{selectedImage?.name || 'Choose an image for your story'}</span>
              <input
                type="file"
                accept="image/*"
                required
                className="sr-only"
                onChange={(event) => setSelectedImage(event.target.files?.[0] || null)}
              />
            </label>
            <input
              name="caption"
              placeholder="Add a caption..."
              className="w-full bg-slate-100 dark:bg-slate-900 p-3 rounded-2xl text-sm text-slate-900 dark:text-white"
            />
            <input
              name="vibe"
              defaultValue={user?.vibe || '✨ Vibing'}
              placeholder="Your vibe (e.g. ☕ Coffee)"
              className="w-full bg-slate-100 dark:bg-slate-900 p-3 rounded-2xl text-sm text-slate-900 dark:text-white"
            />
            {submitError && <p role="alert" className="text-sm text-rose-500">{submitError}</p>}
            <button
              disabled={isSubmitting}
              className="w-full bg-violet-600 disabled:opacity-60 text-white p-3 rounded-2xl text-sm font-bold"
            >
              {isSubmitting ? 'Uploading...' : 'Share Story'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
