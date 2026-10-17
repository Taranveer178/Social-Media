import { useContext } from 'react';
import { Bookmark, MessageCircle, Trash2 } from 'lucide-react';
import { useData } from '../contexts/useData';
import { RouterContext } from '../contexts/RouterContext';

export const SavedMessagesView = () => {
  const { savedMessages, toggleSaveMessage } = useData();
  const { navigate } = useContext(RouterContext);

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Starred Messages</h1>
          <p className="text-xs text-slate-500">Important messages synced to your Firebase account.</p>
        </div>

        {savedMessages.length === 0 ? (
          <div className="bg-white dark:bg-slate-950 p-12 rounded-3xl text-center space-y-3 border border-slate-200 dark:border-slate-800">
            <Bookmark className="mx-auto text-slate-300" size={40} />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No starred messages yet</p>
            <p className="text-xs text-slate-400">Click the ⭐ icon on any chat message to bookmark it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedMessages.map((m) => (
              <div
                key={m.id}
                className="bg-white dark:bg-slate-950 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                      {m.senderName || 'Vibely Message'}
                    </span>
                    <span className="text-[10px] text-slate-400">{m.timestamp}</span>
                  </div>
                  <p className="text-sm text-slate-900 dark:text-white break-words">
                    {m.type === 'voice'
                      ? '🎙️ Voice Note'
                      : m.type === 'poll'
                        ? `📊 Poll: ${m.question || m.text}`
                        : m.text}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {m.chatId && (
                    <button
                      onClick={() => navigate('/chats', { chatId: m.chatId })}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center gap-1"
                    >
                      <MessageCircle size={13} /> Open Chat
                    </button>
                  )}
                  <button
                    onClick={() => toggleSaveMessage(m)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Remove from Starred"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
