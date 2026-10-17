import { useContext, useState } from 'react';
import { Check, MessageCircle, Search, UserCheck, UserPlus, X } from 'lucide-react';
import { useData } from '../contexts/useData';
import { useAuth } from '../contexts/useAuth';
import { RouterContext } from '../contexts/RouterContext';
import { Avatar } from '../components/ui/Avatar';
import { FetchState } from '../components/ui/FetchState';

const VIBE_FILTERS = [
  'All Vibes',
  'Same Vibe as Me',
  '💻 Coding',
  '☕ Coffee',
  '🎧 Music',
  '✈️ Travel',
  '🔥 Focused',
  '😴 Tired',
];

export const DiscoverView = () => {
  const { user } = useAuth();
  const {
    users,
    connections,
    sendConnectionRequest,
    respondToConnection,
    startDirectChat,
    showToast,
    loading,
    errors,
    refreshUsers,
  } = useData();
  const { navigate } = useContext(RouterContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [vibeFilter, setVibeFilter] = useState('All Vibes');
  const [requestError, setRequestError] = useState('');
  const [pendingUserId, setPendingUserId] = useState(null);

  const incomingRequests = connections.filter(
    (c) => c.recipientId === user?.id && c.status === 'pending'
  );

  const getConnectionStatus = (targetUserId) => {
    const conn = connections.find(
      (c) =>
        (c.senderId === user?.id && c.recipientId === targetUserId) ||
        (c.senderId === targetUserId && c.recipientId === user?.id)
    );
    if (!conn) return { status: 'none', id: null };
    if (conn.status === 'accepted') return { status: 'accepted', id: conn.id };
    if (conn.senderId === user?.id) return { status: 'sent', id: conn.id };
    return { status: 'incoming', id: conn.id };
  };

  const filteredUsers = users.filter((u) => {
    if (vibeFilter === 'Same Vibe as Me' && u.vibe !== user?.vibe) return false;
    if (vibeFilter !== 'All Vibes' && vibeFilter !== 'Same Vibe as Me' && u.vibe !== vibeFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.bio || '').toLowerCase().includes(q) ||
      (u.vibe || '').toLowerCase().includes(q)
    );
  });

  const handleConnect = async (targetUser) => {
    setPendingUserId(targetUser.id);
    setRequestError('');
    try {
      await sendConnectionRequest(targetUser);
    } catch (error) {
      setRequestError(error.message);
    } finally {
      setPendingUserId(null);
    }
  };

  const handleMessageUser = async (targetUser) => {
    try {
      const chat = await startDirectChat(targetUser);
      navigate('/chats', { chatId: chat.id });
    } catch (error) {
      showToast(error.message);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Discover & Mood Match</h1>
            <p className="text-xs text-slate-500">Connect and message people sharing your vibe right now.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, @username, bio..."
              className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Vibe Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {VIBE_FILTERS.map((vibe) => (
            <button
              key={vibe}
              onClick={() => setVibeFilter(vibe)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold shrink-0 transition-colors ${
                vibeFilter === vibe
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {vibe}
            </button>
          ))}
        </div>

        {/* Incoming Connection Requests Banner */}
        {incomingRequests.length > 0 && (
          <div className="bg-violet-50/80 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/60 p-4 rounded-3xl space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              Incoming Connection Requests ({incomingRequests.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-950 p-3.5 rounded-2xl flex items-center justify-between border border-slate-200/80 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={req.senderAvatar} name={req.senderName} size="sm" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{req.senderName}</p>
                      <p className="text-[10px] text-slate-400">Wants to connect on Vibely</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => respondToConnection(req.id, 'accepted')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Check size={13} /> Accept
                    </button>
                    <button
                      onClick={() => respondToConnection(req.id, 'declined')}
                      className="bg-slate-100 dark:bg-slate-800 text-slate-500 p-1.5 rounded-xl hover:text-rose-500"
                      title="Decline"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {requestError && <p role="alert" className="text-sm text-rose-500">{requestError}</p>}

        <FetchState loading={loading.users} error={errors.users} onRetry={refreshUsers}>
          {filteredUsers.length === 0 ? (
            <div className="bg-white dark:bg-slate-950 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No people match this vibe filter</p>
              <p className="text-xs text-slate-400">Try selecting "All Vibes" or seed sample community profiles from the Dashboard.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUsers.map((u) => {
                const connState = getConnectionStatus(u.id);
                return (
                  <div
                    key={u.id}
                    className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <Avatar src={u.avatar} name={u.name} size="md" isOnline={u.isOnline} vibe={u.vibe} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.name}</h3>
                          <span className="text-[11px] text-slate-400 truncate">@{u.username}</span>
                        </div>
                        <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">{u.vibe}</p>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{u.bio}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleMessageUser(u)}
                        className="p-2.5 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 hover:bg-violet-100"
                        title={`Message ${u.name}`}
                      >
                        <MessageCircle size={17} />
                      </button>

                      {connState.status === 'accepted' ? (
                        <span className="px-3 py-2 rounded-2xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <UserCheck size={14} /> Connected
                        </span>
                      ) : connState.status === 'sent' ? (
                        <span className="px-3 py-2 rounded-2xl text-xs font-semibold bg-slate-100 dark:bg-slate-900 text-slate-400">
                          Requested
                        </span>
                      ) : connState.status === 'incoming' ? (
                        <button
                          onClick={() => respondToConnection(connState.id, 'accepted')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-2xl text-xs font-bold"
                        >
                          Accept
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(u)}
                          disabled={pendingUserId === u.id}
                          className="bg-slate-900 dark:bg-slate-800 text-white px-3.5 py-2 rounded-2xl text-xs font-semibold hover:bg-violet-600 disabled:opacity-60 transition-colors flex items-center gap-1.5"
                        >
                          <UserPlus size={14} />
                          <span>{pendingUserId === u.id ? 'Sending...' : 'Connect'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </FetchState>
      </div>
    </div>
  );
};
