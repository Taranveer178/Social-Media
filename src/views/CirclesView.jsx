import { useContext, useState } from 'react';
import {
  ArrowLeft,
  Lock,
  MessageCircle,
  Plus,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useData } from '../contexts/useData';
import { RouterContext } from '../contexts/RouterContext';
import { Avatar } from '../components/ui/Avatar';
import { FetchState } from '../components/ui/FetchState';

const CIRCLE_COLORS = [
  { label: 'Violet', value: 'bg-violet-600' },
  { label: 'Fuchsia', value: 'bg-fuchsia-600' },
  { label: 'Indigo', value: 'bg-indigo-600' },
  { label: 'Emerald', value: 'bg-emerald-600' },
  { label: 'Amber', value: 'bg-amber-500' },
];

export const CirclesView = () => {
  const { user } = useAuth();
  const {
    circles,
    moments,
    users,
    createCircle,
    joinCircle,
    leaveCircle,
    addCircleMember,
    deleteCircle,
    openCircleChat,
    loading,
    errors,
    refreshCircles,
    showToast,
  } = useData();
  const { navigate } = useContext(RouterContext);

  const [showModal, setShowModal] = useState(false);
  const [activeCircleId, setActiveCircleId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('bg-violet-600');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [inviteUserId, setInviteUserId] = useState('');

  const activeCircle = circles.find((c) => c.id === activeCircleId) || null;
  const circleMoments = moments.filter((m) => m.circleId === activeCircle?.id);
  const circleMembers = users.filter((u) => (activeCircle?.memberIds || []).includes(u.id));
  const nonMembers = users.filter((u) => !(activeCircle?.memberIds || []).includes(u.id));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const created = await createCircle({ name: name.trim(), description, color });
      setName('');
      setDescription('');
      setShowModal(false);
      setActiveCircleId(created.id);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCircleChat = async (circle) => {
    try {
      const chat = await openCircleChat(circle);
      navigate('/chats', { chatId: chat.id });
    } catch (error) {
      showToast(error.message);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!activeCircle || !inviteUserId) return;
    try {
      await addCircleMember(activeCircle.id, inviteUserId);
      setInviteUserId('');
    } catch (error) {
      showToast(error.message);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {activeCircle ? (
          /* Circle Detail Workspace */
          <div className="space-y-6">
            <button
              onClick={() => setActiveCircleId(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-violet-600"
            >
              <ArrowLeft size={16} /> Back to All Circles
            </button>

            <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl ${activeCircle.color || 'bg-violet-600'} text-white flex items-center justify-center shrink-0 shadow-lg`}>
                  <Lock size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{activeCircle.name}</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{activeCircle.description}</p>
                  <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 mt-2">
                    {activeCircle.members || (activeCircle.memberIds || []).length} Members in this Circle
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenCircleChat(activeCircle)}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5"
                >
                  <MessageCircle size={15} /> Open Circle Chat
                </button>
                <button
                  onClick={() => navigate('/moments', { circleId: activeCircle.id })}
                  className="bg-slate-900 dark:bg-slate-800 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Sparkles size={15} /> Share Moment
                </button>
                {activeCircle.creatorId === user?.id ? (
                  <button
                    onClick={() => {
                      deleteCircle(activeCircle.id);
                      setActiveCircleId(null);
                    }}
                    className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100"
                    title="Delete Circle"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : activeCircle.isMember ? (
                  <button
                    onClick={() => leaveCircle(activeCircle.id)}
                    className="px-3 py-2 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40"
                  >
                    Leave Circle
                  </button>
                ) : (
                  <button
                    onClick={() => joinCircle(activeCircle.id)}
                    className="px-4 py-2 rounded-2xl text-xs font-bold text-white bg-emerald-600"
                  >
                    Join Circle
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Circle Moments Feed */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Circle Moments ({circleMoments.length})
                </h2>
                {circleMoments.length === 0 ? (
                  <div className="bg-white dark:bg-slate-950 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 text-center space-y-3">
                    <p className="text-xs text-slate-400">No moments posted to {activeCircle.name} yet.</p>
                    <button
                      onClick={() => navigate('/moments', { circleId: activeCircle.id })}
                      className="bg-violet-600 text-white px-4 py-2 rounded-2xl text-xs font-bold"
                    >
                      + Post First Circle Moment
                    </button>
                  </div>
                ) : (
                  circleMoments.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm"
                    >
                      <div className="p-4 flex items-center gap-3">
                        <Avatar src={m.author?.avatar} name={m.author?.name} size="sm" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{m.author?.name}</p>
                          <p className="text-[10px] text-slate-400">{m.location} • {m.time}</p>
                        </div>
                      </div>
                      <img src={m.image || m.imageUrl} alt={m.title} className="w-full h-64 object-cover" />
                      <div className="p-4">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{m.title}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Circle Members & Invite */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users size={16} className="text-violet-500" />
                    <span>Circle Members</span>
                  </h3>

                  <div className="space-y-2.5">
                    {(activeCircle.memberIds || []).includes(user?.id) && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={user?.avatar} name={user?.name} size="sm" isOnline={true} />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name} (You)</p>
                            <p className="text-[10px] text-slate-400">{user?.vibe}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {circleMembers.map((m) => (
                      <div key={m.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={m.avatar} name={m.name} size="sm" isOnline={m.isOnline} />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{m.name}</p>
                            <p className="text-[10px] text-slate-400">{m.vibe}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {nonMembers.length > 0 && (
                    <form onSubmit={handleInviteMember} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 block">Add Member to Circle</label>
                      <div className="flex gap-2">
                        <select
                          value={inviteUserId}
                          onChange={(e) => setInviteUserId(e.target.value)}
                          className="flex-1 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white text-xs p-2.5 rounded-xl"
                        >
                          <option value="">Select user...</option>
                          {nonMembers.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          disabled={!inviteUserId}
                          className="bg-violet-600 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <UserPlus size={14} /> Add
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* All Circles Grid */
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Private Circles</h1>
                <p className="text-xs text-slate-500">Selective social spaces with custom privacy boundaries.</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-2xl flex items-center space-x-2 text-xs font-bold transition-all shadow-md shadow-violet-500/20"
              >
                <Plus size={16} />
                <span>New Circle</span>
              </button>
            </div>

            <FetchState loading={loading.circles} error={errors.circles} onRetry={refreshCircles}>
              {circles.length === 0 ? (
                <div className="bg-white dark:bg-slate-950 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                  <Lock className="mx-auto text-violet-500" size={36} />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">No Circles created yet</p>
                  <p className="text-xs text-slate-400">Create a Private Circle to share exclusive moments and group chats.</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-violet-600 text-white px-4 py-2 rounded-2xl text-xs font-bold"
                  >
                    + Create First Circle
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {circles.map((circle) => {
                    const isMember = circle.isMember || (circle.memberIds || []).includes(user?.id);
                    return (
                      <div
                        key={circle.id}
                        className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl ${circle.color || 'bg-violet-600'} text-white flex items-center justify-center shadow-lg`}>
                              <Lock size={22} />
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                              isMember
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-900'
                            }`}>
                              {isMember ? 'Joined ✓' : 'Open Circle'}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{circle.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{circle.description}</p>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-semibold text-slate-400">{circle.members || 1} Members</span>
                          <div className="flex items-center gap-2">
                            {!isMember && (
                              <button
                                onClick={() => joinCircle(circle.id)}
                                className="text-xs font-bold bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 px-3 py-1.5 rounded-xl"
                              >
                                Join
                              </button>
                            )}
                            <button
                              onClick={() => setActiveCircleId(circle.id)}
                              className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                            >
                              Open Circle →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </FetchState>
          </>
        )}
      </div>

      {/* Create Circle Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 max-w-md w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Private Circle</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Circle Name (e.g., Founders Club)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3 rounded-2xl text-xs border border-transparent focus:border-violet-500 focus:outline-none"
              />
              <textarea
                placeholder="Description & purpose..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3 rounded-2xl text-xs border border-transparent focus:border-violet-500 focus:outline-none h-20 resize-none"
              />
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500">Circle Theme Color</span>
                <div className="flex gap-2">
                  {CIRCLE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-7 h-7 rounded-full ${c.value} ${color === c.value ? 'ring-2 ring-offset-2 ring-violet-500' : ''}`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              {submitError && <p role="alert" className="text-xs text-rose-500">{submitError}</p>}
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-500">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-violet-600 disabled:opacity-60 text-white px-4 py-2 rounded-2xl text-xs font-bold">
                  {isSubmitting ? 'Creating...' : 'Create Circle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
