import { useContext, useState } from 'react';
import {
  Flag,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useData } from '../contexts/useData';
import { RouterContext } from '../contexts/RouterContext';
import { Avatar } from '../components/ui/Avatar';
import { FetchState } from '../components/ui/FetchState';
import { uploadMedia } from '../services/storage';

export const MomentsView = () => {
  const { user } = useAuth();
  const {
    moments,
    circles,
    loading,
    errors,
    refreshMoments,
    createMoment,
    toggleMomentLike,
    addMomentComment,
    deleteMoment,
    reportContent,
    showToast,
  } = useData();
  const { routeParams } = useContext(RouterContext);

  const [selectedCircleFilter, setSelectedCircleFilter] = useState(routeParams.circleId || 'all');
  const [showCreate, setShowCreate] = useState(Boolean(routeParams.circleId));
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [openCommentsId, setOpenCommentsId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  const filteredMoments = moments.filter((m) => {
    if (selectedCircleFilter === 'all') return true;
    return m.circleId === selectedCircleFilter;
  });

  async function handleCreate(event) {
    event.preventDefault();
    if (!selectedImage) {
      setSubmitError('Choose an image for your moment.');
      return;
    }
    const form = new FormData(event.currentTarget);
    const circleId = form.get('circleId') || null;
    const chosenCircle = circles.find((c) => c.id === circleId);
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const image = await uploadMedia(selectedImage);
      await createMoment({
        image,
        title: form.get('title'),
        location: form.get('location') || 'Vibely Community',
        circleId,
        circleName: chosenCircle?.name || 'Public Feed',
      });
      setShowCreate(false);
      setSelectedImage(null);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddComment(e, momentId) {
    e.preventDefault();
    const text = commentInputs[momentId];
    if (!text?.trim()) return;
    try {
      await addMomentComment(momentId, text.trim());
      setCommentInputs((curr) => ({ ...curr, [momentId]: '' }));
    } catch (error) {
      showToast(error.message);
    }
  }

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shared Moments</h1>
            <p className="text-xs text-slate-500">Visual memories shared across your circles and community.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto shadow-md shadow-violet-500/20"
          >
            <Plus size={15} /> Create Moment
          </button>
        </div>

        {/* Circle Filter Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCircleFilter('all')}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold shrink-0 transition-colors ${
              selectedCircleFilter === 'all'
                ? 'bg-violet-600 text-white'
                : 'bg-white dark:bg-slate-950 text-slate-500 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All Moments ({moments.length})
          </button>
          {circles.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCircleFilter(c.id)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold shrink-0 transition-colors ${
                selectedCircleFilter === c.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-slate-950 text-slate-500 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <FetchState loading={loading.moments} error={errors.moments} onRetry={refreshMoments}>
          <div className="space-y-6">
            {filteredMoments.length === 0 ? (
              <div className="bg-white dark:bg-slate-950 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No moments in this feed yet</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="bg-violet-600 text-white px-4 py-2 rounded-2xl text-xs font-bold"
                >
                  + Share a Moment
                </button>
              </div>
            ) : (
              filteredMoments.map((moment) => {
                const isCommentsOpen = openCommentsId === moment.id;
                const commentsList = Array.isArray(moment.commentsList) ? moment.commentsList : [];

                return (
                  <div
                    key={moment.id}
                    className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm"
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={moment.author?.avatar || moment.authorAvatar}
                          name={moment.author?.name || moment.authorName}
                          size="sm"
                        />
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                            {moment.author?.name || moment.authorName || 'Vibely User'}
                          </h3>
                          <p className="text-[10px] text-slate-400">
                            {moment.location || 'Vibely'} • {moment.time || moment.createdAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-1 bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 rounded-full">
                          {moment.circleName || moment.circle?.name || moment.circle || 'Public Feed'}
                        </span>
                        {moment.authorId === user?.id ? (
                          <button
                            onClick={() => deleteMoment(moment.id).catch((e) => showToast(e.message))}
                            className="text-slate-400 hover:text-rose-500 p-1"
                            title="Delete Moment"
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              reportContent({
                                targetType: 'moment',
                                targetId: moment.id,
                                reason: `Reported moment: ${moment.title}`,
                              }).catch((e) => showToast(e.message))
                            }
                            className="text-slate-400 hover:text-amber-500 p-1"
                            title="Report Moment"
                          >
                            <Flag size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <img src={moment.image || moment.imageUrl} className="w-full h-80 object-cover" alt="Moment" />

                    <div className="p-4 space-y-3">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{moment.title}</h4>
                      <div className="flex items-center space-x-5 text-xs text-slate-500 pt-1">
                        <button
                          onClick={() => toggleMomentLike(moment.id).catch((e) => showToast(e.message))}
                          className={`flex items-center space-x-1.5 font-semibold transition-transform active:scale-90 ${
                            moment.isLiked ? 'text-rose-500' : 'hover:text-rose-500'
                          }`}
                        >
                          <Heart size={17} className={moment.isLiked ? 'fill-rose-500 text-rose-500' : ''} />
                          <span>{moment.likes ?? 0} Likes</span>
                        </button>
                        <button
                          onClick={() => setOpenCommentsId(isCommentsOpen ? null : moment.id)}
                          className="flex items-center space-x-1.5 font-semibold hover:text-violet-500"
                        >
                          <MessageCircle size={17} />
                          <span>{moment.comments ?? commentsList.length} Comments</span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      {isCommentsOpen && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                          {commentsList.length === 0 ? (
                            <p className="text-xs text-slate-400">No comments yet. Start the conversation!</p>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {commentsList.map((c) => (
                                <div key={c.id} className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-2xl">
                                  <Avatar src={c.authorAvatar} name={c.authorName} size="sm" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{c.authorName}</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-300">{c.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <form onSubmit={(e) => handleAddComment(e, moment.id)} className="flex gap-2">
                            <input
                              type="text"
                              value={commentInputs[moment.id] || ''}
                              onChange={(e) =>
                                setCommentInputs((curr) => ({ ...curr, [moment.id]: e.target.value }))
                              }
                              placeholder="Write a comment..."
                              className="flex-1 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white text-xs px-3.5 py-2.5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                            <button
                              type="submit"
                              className="bg-violet-600 hover:bg-violet-700 text-white px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1"
                            >
                              <Send size={14} /> Post
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </FetchState>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white dark:bg-slate-950 max-w-md w-full p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Moment</h2>
              <button type="button" onClick={() => setShowCreate(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer p-3 rounded-2xl bg-slate-100 dark:bg-slate-900">
              <ImageIcon size={18} className="text-violet-600" />
              <span className="truncate">{selectedImage?.name || 'Choose an image'}</span>
              <input
                type="file"
                accept="image/*"
                required
                className="sr-only"
                onChange={(event) => setSelectedImage(event.target.files?.[0] || null)}
              />
            </label>
            <input
              name="title"
              required
              placeholder="Moment caption or title"
              className="w-full bg-slate-100 dark:bg-slate-900 p-3 rounded-2xl text-sm text-slate-900 dark:text-white"
            />
            <input
              name="location"
              placeholder="Location (e.g. Bengaluru, India)"
              className="w-full bg-slate-100 dark:bg-slate-900 p-3 rounded-2xl text-sm text-slate-900 dark:text-white"
            />
            <select
              name="circleId"
              defaultValue={routeParams.circleId || ''}
              className="w-full bg-slate-100 dark:bg-slate-900 p-3 rounded-2xl text-sm text-slate-900 dark:text-white"
            >
              <option value="">Public Feed (Everyone)</option>
              {circles.map((circle) => (
                <option key={circle.id} value={circle.id}>{circle.name}</option>
              ))}
            </select>
            {submitError && <p role="alert" className="text-sm text-rose-500">{submitError}</p>}
            <button
              disabled={isSubmitting}
              className="w-full bg-violet-600 disabled:opacity-60 text-white p-3 rounded-2xl text-sm font-bold"
            >
              {isSubmitting ? 'Uploading...' : 'Share Moment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
