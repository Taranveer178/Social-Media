import { useContext, useEffect, useRef, useState } from 'react';
import {
  BarChart2,
  Check,
  CheckCheck,
  ChevronLeft,
  Clock,
  Filter,
  Mic,
  MicOff,
  MoreVertical,
  Paperclip,
  Pause,
  Phone,
  Play,
  Plus,
  Search,
  Send,
  Smile,
  Sparkles,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { RouterContext } from '../contexts/RouterContext';
import { useData } from '../contexts/useData';
import { Avatar } from '../components/ui/Avatar';
import { IconButton } from '../components/ui/IconButton';
import { FetchState } from '../components/ui/FetchState';
import { uploadMedia } from '../services/storage';

const QUICK_EMOJIS = ['😊', '🔥', '🚀', '💜', '✨', '🎉', '☕', '🎧', '🙌', '😂'];

export const ChatView = () => {
  const {
    chats,
    users,
    savedMessages,
    loading,
    errors,
    refreshChats,
    refreshChatMessages,
    watchChatMessages,
    startDirectChat,
    createGroupChat,
    sendMessage,
    deleteMessage,
    toggleDisappearingMessages,
    deleteChat,
    addReaction,
    toggleSaveMessage,
    votePoll,
    setActiveCall,
    showToast,
  } = useData();
  const { routeParams, navigate } = useContext(RouterContext);
  const { user } = useAuth();

  const [selectedChatId, setSelectedChatId] = useState(null);
  const activeChatId = routeParams.chatId || selectedChatId || chats[0]?.id;
  const [searchQuery, setSearchQuery] = useState('');
  const [chatFilter, setChatFilter] = useState('all'); // 'all' | 'direct' | 'groups'
  const [inputText, setInputText] = useState('');
  const [audioSpeed, setAudioSpeed] = useState('1x');
  const [isPlayingAudio, setIsPlayingAudio] = useState({});
  const [showTranscript, setShowTranscript] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatTab, setNewChatTab] = useState('direct'); // 'direct' | 'group'
  const [groupName, setGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);
  const audioPlayersRef = useRef({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];
  const isGroup = activeChat?.isGroup;
  const participants = Array.isArray(activeChat?.participants) ? activeChat.participants : [];
  const otherId = participants.find((id) => id !== user?.id);
  const otherUser = !isGroup
    ? users.find((u) => u.id === otherId) || activeChat?.participantProfiles?.[otherId]
    : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages?.length]);

  useEffect(() => {
    if (!activeChatId) return undefined;
    return watchChatMessages(activeChatId);
  }, [activeChatId, watchChatMessages]);

  const filteredChats = chats.filter((chat) => {
    if (chatFilter === 'direct' && chat.isGroup) return false;
    if (chatFilter === 'groups' && !chat.isGroup) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const chatPartIds = Array.isArray(chat.participants) ? chat.participants : [];
    const targetId = chatPartIds.find((id) => id !== user?.id);
    const target = !chat.isGroup ? (users.find((u) => u.id === targetId) || chat.participantProfiles?.[targetId]) : null;
    const nameMatch = (chat.isGroup ? chat.groupName : target?.name || '').toLowerCase().includes(q);
    const msgMatch = (chat.messages || []).some(
      (m) => (m.text || '').toLowerCase().includes(q) || (m.transcript || '').toLowerCase().includes(q)
    );
    return nameMatch || msgMatch || (chat.lastMessage || '').toLowerCase().includes(q);
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;
    try {
      await sendMessage(activeChat.id, inputText.trim());
      setInputText('');
      setShowEmojiPicker(false);
      setRecordingError('');
    } catch (error) {
      setRecordingError(error.message);
    }
  };

  const handleImageAttachment = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !activeChat) return;
    setIsUploadingMedia(true);
    setRecordingError('');
    try {
      const imageUrl = await uploadMedia(file, 'image');
      await sendMessage(activeChat.id, file.name, 'image', { imageUrl });
      showToast('Photo sent! 📷');
    } catch (error) {
      setRecordingError(error.message);
    } finally {
      setIsUploadingMedia(false);
      event.target.value = '';
    }
  };

  const handleCreatePoll = async (event) => {
    event.preventDefault();
    if (!activeChat || !pollQuestion.trim()) return;
    const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      showToast('Provide at least 2 poll options.');
      return;
    }
    try {
      const formattedOptions = validOptions.map((text, idx) => ({
        id: `opt_${idx + 1}_${Date.now()}`,
        text,
        votes: 0,
      }));
      await sendMessage(activeChat.id, pollQuestion.trim(), 'poll', {
        question: pollQuestion.trim(),
        options: formattedOptions,
        totalVotes: 0,
        votedBy: {},
      });
      setPollQuestion('');
      setPollOptions(['', '']);
      setShowPollModal(false);
      showToast('Poll published to chat! 📊');
    } catch (error) {
      showToast(error.message);
    }
  };

  const handleStartDirectChat = async (targetUser) => {
    try {
      const chat = await startDirectChat(targetUser);
      setSelectedChatId(chat.id);
      navigate('/chats', { chatId: chat.id });
      setShowNewChatModal(false);
    } catch (error) {
      showToast(error.message);
    }
  };

  const handleCreateGroupChat = async (event) => {
    event.preventDefault();
    if (!groupName.trim()) return;
    try {
      const chat = await createGroupChat({
        groupName: groupName.trim(),
        memberIds: selectedGroupMembers,
      });
      setSelectedChatId(chat.id);
      navigate('/chats', { chatId: chat.id });
      setGroupName('');
      setSelectedGroupMembers([]);
      setShowNewChatModal(false);
    } catch (error) {
      showToast(error.message);
    }
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingError('Voice recording is not supported by this browser.');
      return;
    }
    try {
      setRecordingError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recordingChatId = activeChat?.id;
      if (!recordingChatId) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('Select a conversation before recording a voice message.');
      }
      const supportedMimeType = typeof MediaRecorder.isTypeSupported === 'function'
        ? ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type))
        : '';
      const recorder = new MediaRecorder(stream, supportedMimeType ? { mimeType: supportedMimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) audioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => setRecordingError('The voice recording could not be completed.');
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        setIsUploadingMedia(true);
        try {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          if (!blob.size) throw new Error('No audio was captured.');
          const audioUrl = await uploadMedia(blob, 'audio');
          const durationSeconds = Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000));
          const duration = `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, '0')}`;
          await sendMessage(recordingChatId, '', 'voice', {
            audioUrl,
            duration,
            transcript: 'Voice note recorded via Vibely encrypted audio.',
          });
          showToast('Voice message sent! 🎙️');
        } catch (error) {
          setRecordingError(error.message);
        } finally {
          setIsUploadingMedia(false);
        }
      };
      recorder.start();
      recordingStartedAtRef.current = Date.now();
      setIsRecording(true);
    } catch (error) {
      setRecordingError(error.message || 'Microphone access was denied.');
    }
  };

  const toggleAudio = async (message) => {
    const currentPlayer = audioPlayersRef.current[message.id];
    if (currentPlayer && !currentPlayer.paused) {
      currentPlayer.pause();
      setIsPlayingAudio((current) => ({ ...current, [message.id]: false }));
      return;
    }
    try {
      const player = currentPlayer || new Audio(message.audioUrl);
      player.playbackRate = Number.parseFloat(audioSpeed);
      player.onended = () => setIsPlayingAudio((current) => ({ ...current, [message.id]: false }));
      audioPlayersRef.current[message.id] = player;
      await player.play();
      setIsPlayingAudio((current) => ({ ...current, [message.id]: true }));
    } catch (error) {
      showToast(error.message || 'Unable to play this voice message.');
    }
  };

  return (
    <div className="flex-1 flex h-full min-h-0 bg-slate-50 dark:bg-slate-900 overflow-hidden pb-16 md:pb-0">
      {/* Conversations Sidebar (Left) */}
      <div className={`w-full md:w-80 lg:w-96 bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col ${routeParams.chatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Messages</h1>
          <div className="flex items-center space-x-1">
            <IconButton
              icon={Plus}
              title="New Chat or Group"
              onClick={() => setShowNewChatModal(true)}
            />
            <IconButton
              icon={Filter}
              active={chatFilter !== 'all'}
              title="Cycle Filter (All / Direct / Groups)"
              onClick={() => {
                const next = chatFilter === 'all' ? 'direct' : chatFilter === 'direct' ? 'groups' : 'all';
                setChatFilter(next);
                showToast(`Filter: ${next.toUpperCase()} chats`);
              }}
            />
          </div>
        </div>

        {/* Search & Filter Tabs */}
        <div className="p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats, messages & transcripts..."
              className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white text-xs pl-9 pr-4 py-2.5 rounded-2xl border border-transparent focus:border-violet-500 focus:outline-none transition-all"
            />
          </div>
          <div className="flex gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'direct', label: 'Direct' },
              { id: 'groups', label: 'Groups' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setChatFilter(tab.id)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                  chatFilter === tab.id
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat List */}
        <FetchState loading={loading.chats} error={errors.chats} onRetry={refreshChats}>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50 p-2 space-y-1">
            {filteredChats.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-xs text-slate-400">No conversations match your filter.</p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="bg-violet-600 text-white px-4 py-2 rounded-2xl text-xs font-bold"
                >
                  + Start New Chat
                </button>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const chatIsGroup = chat.isGroup;
                const chatParticipants = Array.isArray(chat.participants) ? chat.participants : [];
                const targetId = chatParticipants.find((id) => id !== user?.id);
                const targetUser = !chatIsGroup
                  ? users.find((u) => u.id === targetId) || chat.participantProfiles?.[targetId]
                  : null;
                const lastMsg = chat.messages?.[chat.messages.length - 1];
                const isSelected = chat.id === activeChat?.id;

                return (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setSelectedChatId(chat.id);
                      navigate('/chats', { chatId: chat.id });
                    }}
                    className={`flex items-center p-3 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-violet-50 dark:bg-violet-950/40 border border-violet-200/50 dark:border-violet-900/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                    }`}
                  >
                    <Avatar
                      src={chatIsGroup ? chat.groupAvatar : targetUser?.avatar}
                      name={chatIsGroup ? chat.groupName : targetUser?.name}
                      isOnline={targetUser?.isOnline}
                      vibe={targetUser?.vibe}
                    />

                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {chatIsGroup ? chat.groupName : (targetUser?.name || 'Vibely User')}
                        </h3>
                        <span className="text-[10px] text-slate-400">{lastMsg?.timestamp || chat.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {lastMsg?.type === 'voice'
                          ? '🎙️ Voice note'
                          : lastMsg?.type === 'image'
                            ? '📷 Photo'
                            : lastMsg?.type === 'poll'
                              ? `📊 Poll: ${lastMsg.question || lastMsg.text}`
                              : lastMsg?.text || chat.lastMessage || 'Start chatting...'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </FetchState>
      </div>

      {/* Main Conversation Window (Right) */}
      <div className={`flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-900/50 ${!routeParams.chatId && 'hidden md:flex'}`}>
        {activeChat ? (
          <>
            {/* Header */}
            <div className="bg-white dark:bg-slate-950 p-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shadow-sm sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <button onClick={() => navigate('/chats')} className="md:hidden text-slate-500">
                  <ChevronLeft size={22} />
                </button>
                <Avatar
                  src={isGroup ? activeChat.groupAvatar : otherUser?.avatar}
                  name={isGroup ? activeChat.groupName : otherUser?.name}
                  size="sm"
                  isOnline={otherUser?.isOnline}
                />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {isGroup ? activeChat.groupName : (otherUser?.name || 'Vibely User')}
                  </h2>
                  <p className="text-[11px] text-emerald-500 font-medium">
                    {activeChat.typingUsers?.length
                      ? 'Typing...'
                      : isGroup
                        ? `${participants.length} members`
                        : otherUser?.isOnline
                          ? `Online now ${otherUser?.vibe ? `• ${otherUser.vibe}` : ''}`
                          : 'Active on Vibely'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1 relative">
                <IconButton
                  icon={BarChart2}
                  title="Create Poll"
                  onClick={() => setShowPollModal(true)}
                />
                <IconButton
                  icon={Phone}
                  title="Voice Call"
                  onClick={() => setActiveCall({ user: otherUser || { name: activeChat.groupName }, type: 'voice' })}
                />
                <IconButton
                  icon={Video}
                  title="Video Call"
                  onClick={() => setActiveCall({ user: otherUser || { name: activeChat.groupName }, type: 'video' })}
                />
                <IconButton
                  icon={MoreVertical}
                  title="Chat Options"
                  onClick={() => setShowChatMenu((v) => !v)}
                />

                {showChatMenu && (
                  <div className="absolute right-0 top-12 w-56 bg-white dark:bg-slate-950 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-30 text-xs">
                    <button
                      onClick={() => {
                        toggleDisappearingMessages(activeChat.id, !activeChat.disappearingMessages);
                        setShowChatMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <Clock size={14} />
                      <span>{activeChat.disappearingMessages ? 'Disable Disappearing Mode' : 'Enable Disappearing Mode'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowPollModal(true);
                        setShowChatMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <BarChart2 size={14} />
                      <span>Create Poll in Chat</span>
                    </button>
                    <button
                      onClick={() => {
                        deleteChat(activeChat.id);
                        setShowChatMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600"
                    >
                      <Trash2 size={14} />
                      <span>Delete Conversation</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-center my-2">
                <span className="text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                  End-to-end encrypted • Disappearing messages {activeChat.disappearingMessages ? 'On (24h)' : 'Off'}
                </span>
              </div>

              <FetchState
                loading={loading[`messages:${activeChat.id}`]}
                error={errors[`chat:${activeChat.id}`]}
                onRetry={() => refreshChatMessages(activeChat.id).catch((error) => showToast(error.message))}
              >
                {(activeChat.messages || []).length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-400">
                    No messages in this conversation yet. Say hello! 👋
                  </p>
                )}
                {(activeChat.messages || []).map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  const isStarred = savedMessages.some((s) => s.id === msg.id);

                  return (
                    <div key={msg.id} className={`flex flex-wrap ${isMe ? 'justify-end' : 'justify-start'} group`}>
                      <div className="max-w-[82%] md:max-w-[65%] space-y-1">
                        {isGroup && !isMe && (
                          <span className="text-[10px] font-bold text-slate-400 ml-2">{msg.senderName}</span>
                        )}
                        {/* Bubble */}
                        <div
                          className={`p-3.5 rounded-3xl shadow-sm relative text-sm ${
                            isMe
                              ? 'bg-green-600 text-white rounded-br-xs'
                              : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-800/80'
                          }`}
                        >
                          {/* Story Reply Reference */}
                          {msg.type === 'story_reply' && (
                            <div className="mb-2 p-2 rounded-xl bg-black/15 dark:bg-white/10 text-xs flex items-center gap-2">
                              {msg.storyImage && (
                                <img src={msg.storyImage} alt="" className="w-8 h-8 rounded-lg object-cover" />
                              )}
                              <span className="italic opacity-90">Replied to story: "{msg.storyCaption}"</span>
                            </div>
                          )}

                          {/* Image Message */}
                          {msg.type === 'image' && msg.imageUrl && (
                            <div className="mb-2">
                              <img
                                src={msg.imageUrl}
                                alt={msg.text || 'Attachment'}
                                className="rounded-2xl max-h-72 w-auto object-cover"
                              />
                            </div>
                          )}

                          {/* Voice Message Player Layout */}
                          {msg.type === 'voice' ? (
                            <div className="space-y-2 min-w-0 w-full sm:min-w-[220px]">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => toggleAudio(msg)}
                                  className={`p-2.5 rounded-full ${isMe ? 'bg-white/20 text-white' : 'bg-violet-600 text-white'}`}
                                >
                                  {isPlayingAudio[msg.id] ? <Pause size={16} /> : <Play size={16} />}
                                </button>

                                <div className="flex-1 flex items-center space-x-1 h-6">
                                  {[40, 75, 30, 90, 60, 100, 45, 80, 50, 95, 35, 70].map((h, i) => (
                                    <div
                                      key={i}
                                      className={`flex-1 rounded-full transition-all ${isMe ? 'bg-white/60' : 'bg-violet-500'}`}
                                      style={{ height: `${h}%` }}
                                    ></div>
                                  ))}
                                </div>

                                <span className="text-xs opacity-80">{msg.duration || '0:08'}</span>
                                <button
                                  onClick={() => {
                                    const nextSpeed = audioSpeed === '1x' ? '1.5x' : audioSpeed === '1.5x' ? '2x' : '1x';
                                    setAudioSpeed(nextSpeed);
                                    if (audioPlayersRef.current[msg.id]) {
                                      audioPlayersRef.current[msg.id].playbackRate = Number.parseFloat(nextSpeed);
                                    }
                                  }}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10"
                                >
                                  {audioSpeed}
                                </button>
                              </div>

                              <div className="pt-2 border-t border-current/10">
                                <button
                                  onClick={() => setShowTranscript((p) => ({ ...p, [msg.id]: !p[msg.id] }))}
                                  className="text-[11px] font-semibold flex items-center space-x-1 opacity-90 hover:underline"
                                >
                                  <Sparkles size={12} />
                                  <span>{showTranscript[msg.id] ? 'Hide AI Transcript' : 'View AI Transcript'}</span>
                                </button>
                                {showTranscript[msg.id] && (
                                  <p className="text-xs italic mt-1.5 p-2 rounded-xl bg-black/10 dark:bg-white/10">
                                    "{msg.transcript || 'Voice message transcribed via Vibely Audio AI.'}"
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : msg.type === 'poll' ? (
                            /* Poll Layout */
                            <div className="space-y-3 min-w-0 w-full sm:min-w-[220px]">
                              <p className="font-bold">{msg.question || msg.text}</p>
                              <div className="space-y-2">
                                {(msg.options || []).map((opt) => {
                                  const percent = Math.round(((opt.votes || 0) / (msg.totalVotes || 1)) * 100);
                                  const myVote = msg.votedBy?.[user?.id] === opt.id;
                                  return (
                                    <div
                                      key={opt.id}
                                      onClick={() => votePoll(activeChat.id, msg.id, opt.id).catch((error) => showToast(error.message))}
                                      className={`relative p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 cursor-pointer overflow-hidden text-slate-900 dark:text-white border ${
                                        myVote ? 'border-violet-500' : 'border-transparent'
                                      }`}
                                    >
                                      <div
                                        className="absolute left-0 top-0 bottom-0 bg-violet-500/25 transition-all"
                                        style={{ width: `${percent}%` }}
                                      ></div>
                                      <div className="relative flex justify-between text-xs font-semibold gap-3">
                                        <span>{opt.text} {myVote ? '✓' : ''}</span>
                                        <span>{percent}% ({opt.votes || 0})</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-[10px] opacity-75">{msg.totalVotes || 0} total votes • Tap an option to vote</p>
                            </div>
                          ) : (
                            msg.type !== 'image' && <p>{msg.text}</p>
                          )}

                          <div className="flex items-center justify-between space-x-2 mt-1">
                            {/* Render Reactions */}
                            {Array.isArray(msg.reactions) && msg.reactions.length > 0 ? (
                              <div className="flex items-center gap-1 bg-black/15 dark:bg-white/15 px-2 py-0.5 rounded-full text-xs">
                                {msg.reactions.map((r, idx) => (
                                  <span key={idx}>{r}</span>
                                ))}
                              </div>
                            ) : <span />}
                            <div className="flex items-center space-x-1">
                              <span className="text-[10px] opacity-70">{msg.timestamp}</span>
                              {isMe && (msg.status === 'read'
                                ? <CheckCheck size={14} className="opacity-80" />
                                : <Check size={14} className="opacity-80" />)}
                            </div>
                          </div>
                        </div>

                        {/* Action icons on hover */}
                        <div className={`flex items-center space-x-2 w-full md:w-auto opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {['❤️', '🔥', '😂', '👍'].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => addReaction(activeChat.id, msg.id, emoji).catch((error) => showToast(error.message))}
                              className="text-xs hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            onClick={() => toggleSaveMessage(msg, activeChat.id)}
                            className={`text-xs transition-transform hover:scale-125 ${isStarred ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}
                            title={isStarred ? 'Unstar message' : 'Star message'}
                          >
                            ⭐
                          </button>
                          {isMe && (
                            <button
                              onClick={() => deleteMessage(activeChat.id, msg.id).catch((e) => showToast(e.message))}
                              className="text-xs text-slate-400 hover:text-rose-500"
                              title="Delete message"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </FetchState>
              <div ref={messagesEndRef} />
            </div>

            {/* Emoji Quick Bar */}
            {showEmojiPicker && (
              <div className="px-4 py-2 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setInputText((current) => `${current}${emoji}`)}
                    className="text-lg hover:scale-125 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageAttachment}
              />
              <form onSubmit={handleSend} className="flex items-center space-x-2 max-w-4xl mx-auto">
                <IconButton
                  icon={Paperclip}
                  title="Attach photo"
                  onClick={() => fileInputRef.current?.click()}
                />
                <IconButton
                  icon={BarChart2}
                  title="Create Poll"
                  onClick={() => setShowPollModal(true)}
                />

                <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center px-4 py-2 border border-transparent focus-within:border-violet-500 transition-all">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((v) => !v)}
                    className="text-slate-400 hover:text-violet-500 mr-2 shrink-0"
                    title="Insert emoji"
                  >
                    <Smile size={20} />
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isUploadingMedia ? 'Uploading media...' : 'Type a vibe or message...'}
                    disabled={isUploadingMedia}
                    className="w-full bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {inputText.trim() ? (
                  <button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-700 text-white p-3 rounded-2xl transition-transform active:scale-95 shadow-md shadow-violet-500/20"
                  >
                    <Send size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleVoiceRecord}
                    title={isRecording ? 'Stop recording' : 'Record voice message'}
                    className={`text-white p-3 rounded-2xl transition-transform active:scale-95 ${
                      isRecording ? 'bg-rose-600 animate-pulse' : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                )}
              </form>
              {recordingError && <p className="max-w-4xl mx-auto mt-2 text-xs text-rose-500" role="alert">{recordingError}</p>}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 space-y-3">
            <p className="text-sm font-medium">Select a conversation or start a new one</p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="bg-violet-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-violet-500/20"
            >
              + New Conversation
            </button>
          </div>
        )}
      </div>

      {/* New Chat / Group Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 max-w-md w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Start Conversation</h2>
              <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setNewChatTab('direct')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                  newChatTab === 'direct' ? 'bg-white dark:bg-slate-800 text-violet-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Direct Chat
              </button>
              <button
                type="button"
                onClick={() => setNewChatTab('group')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                  newChatTab === 'group' ? 'bg-white dark:bg-slate-800 text-violet-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                New Group Chat
              </button>
            </div>

            {newChatTab === 'direct' ? (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {users.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No other users found yet. Click "Seed Sample Firebase Data" on the Home screen to add sample users!
                  </p>
                ) : (
                  users.map((u) => (
                    <div key={u.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar} name={u.name} size="sm" isOnline={u.isOnline} />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.vibe}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartDirectChat(u)}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                      >
                        Message
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <form onSubmit={handleCreateGroupChat} className="space-y-3">
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group Name (e.g., Weekend Trip Crew)"
                  className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3 rounded-2xl text-xs"
                />
                <p className="text-xs font-semibold text-slate-500">Select Members:</p>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {users.map((u) => {
                    const checked = selectedGroupMembers.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar src={u.avatar} name={u.name} size="sm" />
                          <span className="text-xs font-medium text-slate-900 dark:text-white">{u.name}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedGroupMembers((curr) =>
                              checked ? curr.filter((id) => id !== u.id) : [...curr, u.id]
                            )
                          }
                        />
                      </label>
                    );
                  })}
                </div>
                <button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-2xl text-xs font-bold"
                >
                  Create Group Chat
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create Poll Modal */}
      {showPollModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePoll}
            className="bg-white dark:bg-slate-950 max-w-md w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Interactive Poll</h2>
              <button type="button" onClick={() => setShowPollModal(false)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              required
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3 rounded-2xl text-xs"
            />
            <div className="space-y-2">
              {pollOptions.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  required={idx < 2}
                  value={opt}
                  onChange={(e) =>
                    setPollOptions((curr) => curr.map((item, i) => (i === idx ? e.target.value : item)))
                  }
                  placeholder={`Option ${idx + 1}`}
                  className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-2.5 rounded-2xl text-xs"
                />
              ))}
              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={() => setPollOptions((curr) => [...curr, ''])}
                  className="text-xs font-bold text-violet-600 hover:underline"
                >
                  + Add Option
                </button>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-2xl text-xs font-bold"
            >
              Send Poll to Chat
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
