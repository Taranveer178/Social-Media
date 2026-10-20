import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addCircleMember as addFirestoreCircleMember,
  addMessageReaction,
  addMomentComment as addFirestoreMomentComment,
  castPollVote,
  clearNotifications as clearFirestoreNotifications,
  createChatMessage,
  createCircle as createFirestoreCircle,
  createGroupChat as createFirestoreGroupChat,
  createMoment as createFirestoreMoment,
  createStory as createFirestoreStory,
  DEFAULT_USER_SETTINGS,
  deleteChat as deleteFirestoreChat,
  deleteChatMessage as deleteFirestoreChatMessage,
  deleteCircle as deleteFirestoreCircle,
  deleteMoment as deleteFirestoreMoment,
  deleteStory as deleteFirestoreStory,
  fetchChatMessages,
  fetchChats,
  fetchCircles,
  fetchConnections,
  fetchDiscoverProfiles,
  fetchMoments,
  fetchNotifications,
  fetchStories,
  joinCircle as joinFirestoreCircle,
  leaveCircle as leaveFirestoreCircle,
  markAllNotificationsRead as markAllFirestoreNotificationsRead,
  markNotificationRead as markFirestoreNotificationRead,
  markStoryViewed as markFirestoreStoryViewed,
  openOrCreateCircleChat as openOrCreateFirestoreCircleChat,
  replyToStory as replyToFirestoreStory,
  reportContent as reportFirestoreContent,
  respondToConnectionRequest as respondToFirestoreConnectionRequest,
  seedDemoCommunityData as seedFirestoreDemoData,
  sendConnectionRequest as sendFirestoreConnectionRequest,
  startOrOpenDirectChat as startOrOpenFirestoreDirectChat,
  subscribeToChats,
  subscribeToChatMessages,
  subscribeToNotifications,
  syncSavedMessagesToFirestore,
  toggleChatDisappearing as toggleFirestoreChatDisappearing,
  toggleMomentLike as toggleFirestoreMomentLike,
  toggleStoryLike as toggleFirestoreStoryLike,
  updateMessageMetadata as updateFirestoreMessageMetadata,
  updateUserProfiles,
  updateUserSettings as updateFirestoreUserSettings,
} from '../services/firebaseData';
import { useAuth } from './useAuth';
import { DataContext } from './DataContext';

function readSavedMessages(userId, firestoreSaved) {
  if (Array.isArray(firestoreSaved) && firestoreSaved.length > 0) {
    return firestoreSaved;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(`vibely_saved_messages_${userId}`) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function DataProvider({ children }) {
  const { user, setUser } = useAuth();
  const userId = user?.id;
  const [chats, setChats] = useState([]);
  const [stories, setStories] = useState([]);
  const [circles, setCircles] = useState([]);
  const [moments, setMoments] = useState([]);
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [savedMessages, setSavedMessages] = useState(() => readSavedMessages(user?.id, user?.savedMessages));
  const [savedMessagesOwner, setSavedMessagesOwner] = useState(userId);
  const [activeCall, setActiveCall] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const toastTimeout = useRef(null);
  const activeUserId = useRef(userId);

  useEffect(() => {
    activeUserId.current = userId;
  }, [userId]);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    window.clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const load = useCallback(async (key, loader, setter) => {
    if (!userId) return;
    const requestedUserId = userId;
    setLoading((current) => ({ ...current, [key]: true }));
    setErrors((current) => ({ ...current, [key]: '' }));
    try {
      const result = await loader(userId);
      if (activeUserId.current !== requestedUserId) return;
      setter(result);
    } catch (error) {
      if (activeUserId.current !== requestedUserId) return;
      setErrors((current) => ({ ...current, [key]: error.message }));
    } finally {
      if (activeUserId.current === requestedUserId) {
        setLoading((current) => ({ ...current, [key]: false }));
      }
    }
  }, [userId]);

  const refreshChats = useCallback(() => load('chats', fetchChats, setChats), [load]);
  const refreshStories = useCallback(() => load('stories', fetchStories, setStories), [load]);
  const refreshCircles = useCallback(() => load('circles', fetchCircles, setCircles), [load]);
  const refreshMoments = useCallback(() => load('moments', fetchMoments, setMoments), [load]);
  const refreshUsers = useCallback(() => load('users', fetchDiscoverProfiles, setUsers), [load]);
  const refreshConnections = useCallback(() => load('connections', fetchConnections, setConnections), [load]);
  const refreshNotifications = useCallback(() => load('notifications', fetchNotifications, setNotifications), [load]);

  const refreshChatMessages = useCallback(async (chatId) => {
    if (!userId || !chatId) return [];
    const requestedUserId = userId;
    const key = `messages:${chatId}`;
    setLoading((current) => ({ ...current, [key]: true }));
    setErrors((current) => ({ ...current, [`chat:${chatId}`]: '' }));
    try {
      const messages = await fetchChatMessages(chatId);
      if (activeUserId.current !== requestedUserId) return [];
      setChats((current) => current.map((chat) => (
        chat.id === chatId ? { ...chat, messages } : chat
      )));
      return messages;
    } catch (error) {
      if (activeUserId.current !== requestedUserId) return [];
      setErrors((current) => ({ ...current, [`chat:${chatId}`]: error.message }));
      throw error;
    } finally {
      if (activeUserId.current === requestedUserId) {
        setLoading((current) => ({ ...current, [key]: false }));
      }
    }
  }, [userId]);

  const watchChatMessages = useCallback((chatId) => subscribeToChatMessages(chatId, (messages) => {
    setChats((current) => current.map((chat) => (
      chat.id === chatId ? { ...chat, messages } : chat
    )));
  }), []);

  useEffect(() => {
    if (!userId) {
      setChats([]);
      setStories([]);
      setCircles([]);
      setMoments([]);
      setUsers([]);
      setConnections([]);
      setNotifications([]);
      setErrors({});
      setLoading({});
      return undefined;
    }
    refreshChats();
    refreshStories();
    refreshCircles();
    refreshMoments();
    refreshUsers();
    refreshConnections();
    refreshNotifications();

    const unsubChats = subscribeToChats(userId, (updatedChats) => {
      setChats((current) => {
        const msgMap = new Map(current.map((c) => [c.id, c.messages]));
        return updatedChats.map((c) => ({
          ...c,
          messages: msgMap.get(c.id) || c.messages || [],
        }));
      });
    });

    const unsubNotifs = subscribeToNotifications(userId, (updatedNotifs) => {
      setNotifications(updatedNotifs);
    });

    return () => {
      unsubChats();
      unsubNotifs();
    };
  }, [
    userId,
    refreshChats,
    refreshStories,
    refreshCircles,
    refreshMoments,
    refreshUsers,
    refreshConnections,
    refreshNotifications,
  ]);

  useEffect(() => {
    setSavedMessages(readSavedMessages(userId, user?.savedMessages));
    setSavedMessagesOwner(userId);
  }, [userId, user?.savedMessages]);

  const chatIdsKey = chats.map((chat) => chat.id).join('|');
  useEffect(() => {
    if (!userId || !chatIdsKey) return undefined;
    const chatIds = chatIdsKey.split('|').filter(Boolean);
    Promise.all(chatIds.map((chatId) => refreshChatMessages(chatId).catch(() => {})));
    return undefined;
  }, [userId, chatIdsKey, refreshChatMessages]);

  useEffect(() => {
    if (userId && savedMessagesOwner === userId) {
      try {
        localStorage.setItem(`vibely_saved_messages_${userId}`, JSON.stringify(savedMessages));
      } catch {
        // ignore storage quota errors
      }
    }
  }, [userId, savedMessages, savedMessagesOwner]);

  useEffect(() => () => window.clearTimeout(toastTimeout.current), []);

  const startDirectChat = useCallback(async (targetUser) => {
    if (!user) throw new Error('You must be signed in to start a chat.');
    const chat = await startOrOpenFirestoreDirectChat(user, targetUser);
    setChats((current) => {
      if (current.some((c) => c.id === chat.id)) return current;
      return [chat, ...current];
    });
    return chat;
  }, [user]);

  const createGroupChat = useCallback(async (groupInfo) => {
    if (!user) throw new Error('You must be signed in to create a group chat.');
    const chat = await createFirestoreGroupChat(user, groupInfo);
    setChats((current) => [chat, ...current]);
    showToast(`Group "${chat.groupName}" created! 🎉`);
    return chat;
  }, [user, showToast]);

  const sendMessage = useCallback(async (chatId, text, type = 'text', extra = {}) => {
    if (!user) throw new Error('You must be signed in to send messages.');
    const savedMessage = await createChatMessage(chatId, user, text, type, extra);
    setChats((current) => current.map((chat) => (
      chat.id === chatId
        ? {
            ...chat,
            lastMessage: type === 'voice' ? '🎙️ Voice note' : type === 'image' ? '📷 Photo' : type === 'poll' ? `📊 Poll: ${extra.question || text}` : text,
            messages: [...(chat.messages || []), savedMessage],
          }
        : chat
    )));
    return savedMessage;
  }, [user]);

  const deleteMessage = useCallback(async (chatId, messageId) => {
    await deleteFirestoreChatMessage(chatId, messageId);
    setChats((current) => current.map((chat) => (
      chat.id === chatId
        ? { ...chat, messages: (chat.messages || []).filter((m) => m.id !== messageId) }
        : chat
    )));
    showToast('Message deleted.');
  }, [showToast]);

  const toggleDisappearingMessages = useCallback(async (chatId, enabled) => {
    await toggleFirestoreChatDisappearing(chatId, enabled);
    setChats((current) => current.map((chat) => (
      chat.id === chatId ? { ...chat, disappearingMessages: Boolean(enabled) } : chat
    )));
    showToast(enabled ? 'Disappearing messages enabled ⏳' : 'Disappearing messages turned off');
  }, [showToast]);

  const deleteChat = useCallback(async (chatId) => {
    await deleteFirestoreChat(chatId);
    setChats((current) => current.filter((chat) => chat.id !== chatId));
    showToast('Conversation deleted.');
  }, [showToast]);

  const addReaction = useCallback(async (chatId, messageId, emoji) => {
    await addMessageReaction(chatId, messageId, emoji);
    setChats((current) => current.map((chat) => chat.id === chatId ? {
      ...chat,
      messages: (chat.messages || []).map((message) => message.id === messageId
        ? { ...message, reactions: Array.from(new Set([...(message.reactions || []), emoji])) }
        : message),
    } : chat));
  }, []);

  const updateMessageMetadata = useCallback(async (chatId, messageId, updates) => {
    await updateFirestoreMessageMetadata(chatId, messageId, updates);
    setChats((current) => current.map((chat) => chat.id === chatId ? {
      ...chat,
      messages: (chat.messages || []).map((message) => message.id === messageId
        ? { ...message, ...updates }
        : message),
    } : chat));
  }, []);

  const toggleSaveMessage = useCallback(async (message, chatId = null) => {
    const alreadySaved = savedMessages.some((item) => item.id === message.id);
    const enriched = {
      ...message,
      chatId: chatId || message.chatId || null,
      savedAt: new Date().toISOString(),
    };
    const nextSaved = alreadySaved
      ? savedMessages.filter((item) => item.id !== message.id)
      : [enriched, ...savedMessages];
    setSavedMessages(nextSaved);
    showToast(alreadySaved ? 'Removed from Starred Messages' : 'Saved to Starred Messages! ⭐');
    if (userId) {
      await syncSavedMessagesToFirestore(userId, nextSaved).catch(() => {});
    }
  }, [savedMessages, showToast, userId]);

  const votePoll = useCallback(async (chatId, messageId, optionId) => {
    await castPollVote(chatId, messageId, optionId, userId);
    await refreshChatMessages(chatId);
    showToast('Vote recorded in Firebase! 📊');
  }, [userId, refreshChatMessages, showToast]);

  const createCircle = useCallback(async (circle) => {
    if (!userId) throw new Error('You must be signed in to create a circle.');
    const created = await createFirestoreCircle(userId, {
      ...circle,
      color: circle.color || 'bg-violet-600',
    });
    setCircles((current) => [created, ...current]);
    showToast('New Circle created in Firestore! 🔒');
    return created;
  }, [userId, showToast]);

  const joinCircle = useCallback(async (circleId) => {
    if (!userId) throw new Error('Sign in to join circles.');
    await joinFirestoreCircle(circleId, userId);
    setCircles((current) => current.map((c) => {
      if (c.id !== circleId) return c;
      const memberIds = Array.from(new Set([...(c.memberIds || []), userId]));
      return { ...c, memberIds, members: memberIds.length, isMember: true };
    }));
    showToast('Joined Circle! 🎉');
  }, [userId, showToast]);

  const leaveCircle = useCallback(async (circleId) => {
    if (!userId) throw new Error('Sign in first.');
    await leaveFirestoreCircle(circleId, userId);
    setCircles((current) => current.map((c) => {
      if (c.id !== circleId) return c;
      const memberIds = (c.memberIds || []).filter((id) => id !== userId);
      return { ...c, memberIds, members: memberIds.length, isMember: false };
    }));
    showToast('Left Circle.');
  }, [userId, showToast]);

  const addCircleMember = useCallback(async (circleId, targetUserId) => {
    if (!user) throw new Error('Sign in first.');
    await addFirestoreCircleMember(circleId, targetUserId, user);
    setCircles((current) => current.map((c) => {
      if (c.id !== circleId) return c;
      const memberIds = Array.from(new Set([...(c.memberIds || []), targetUserId]));
      return { ...c, memberIds, members: memberIds.length };
    }));
    showToast('Member added to Circle! 👥');
  }, [user, showToast]);

  const deleteCircle = useCallback(async (circleId) => {
    await deleteFirestoreCircle(circleId);
    setCircles((current) => current.filter((c) => c.id !== circleId));
    showToast('Circle deleted.');
  }, [showToast]);

  const openCircleChat = useCallback(async (circle) => {
    if (!user) throw new Error('Sign in first.');
    const chat = await openOrCreateFirestoreCircleChat(user, circle);
    setChats((current) => {
      if (current.some((c) => c.id === chat.id)) return current;
      return [chat, ...current];
    });
    return chat;
  }, [user]);

  const createStory = useCallback(async (story) => {
    if (!user) throw new Error('You must be signed in to create a story.');
    const created = await createFirestoreStory(user, story);
    setStories((current) => [created, ...current]);
    showToast('Story published! ✨');
    return created;
  }, [user, showToast]);

  const markStoryViewed = useCallback(async (storyId) => {
    if (!userId) throw new Error('You must be signed in to view stories.');
    await markFirestoreStoryViewed(storyId, userId);
    setStories((current) => current.map((story) => (
      story.id === storyId ? { ...story, isViewed: true } : story
    )));
  }, [userId]);

  const toggleStoryLike = useCallback(async (storyId) => {
    if (!user) throw new Error('Sign in to like stories.');
    const result = await toggleFirestoreStoryLike(storyId, user);
    setStories((current) => current.map((story) => (
      story.id === storyId ? { ...story, isLiked: result.liked, likes: result.likes } : story
    )));
    return result;
  }, [user]);

  const replyToStory = useCallback(async (story, replyText) => {
    if (!user) throw new Error('Sign in to reply to stories.');
    const chat = await replyToFirestoreStory(story, user, replyText);
    setStories((current) => current.map((s) => (
      s.id === story.id ? { ...s, repliesCount: (s.repliesCount || 0) + 1 } : s
    )));
    if (chat) {
      await refreshChats();
    }
    showToast('Reply sent to chat! 💬');
    return chat;
  }, [user, refreshChats, showToast]);

  const deleteStory = useCallback(async (storyId) => {
    await deleteFirestoreStory(storyId);
    setStories((current) => current.filter((s) => s.id !== storyId));
    showToast('Story deleted.');
  }, [showToast]);

  const createMoment = useCallback(async (moment) => {
    if (!user) throw new Error('You must be signed in to share a moment.');
    const created = await createFirestoreMoment(user, moment);
    setMoments((current) => [created, ...current]);
    showToast('Moment shared to feed! ✨');
    return created;
  }, [user, showToast]);

  const toggleMomentLike = useCallback(async (momentId) => {
    if (!user) throw new Error('Sign in to like moments.');
    const result = await toggleFirestoreMomentLike(momentId, user);
    setMoments((current) => current.map((m) => (
      m.id === momentId ? { ...m, isLiked: result.isLiked, likes: result.likes } : m
    )));
    return result;
  }, [user]);

  const addMomentComment = useCallback(async (momentId, text) => {
    if (!user) throw new Error('Sign in to comment.');
    const comment = await addFirestoreMomentComment(momentId, user, text);
    setMoments((current) => current.map((m) => {
      if (m.id !== momentId) return m;
      const nextList = [...(m.commentsList || []), comment];
      return { ...m, commentsList: nextList, comments: nextList.length };
    }));
    showToast('Comment posted! 💬');
    return comment;
  }, [user, showToast]);

  const deleteMoment = useCallback(async (momentId) => {
    await deleteFirestoreMoment(momentId);
    setMoments((current) => current.filter((m) => m.id !== momentId));
    showToast('Moment deleted.');
  }, [showToast]);

  const reportContent = useCallback(async (payload) => {
    if (!user) throw new Error('Sign in to submit a report.');
    await reportFirestoreContent(user, payload);
    showToast('Report submitted to moderators. 🛡️');
  }, [user, showToast]);

  const sendConnectionRequest = useCallback(async (targetUser) => {
    if (!user) throw new Error('Sign in to connect.');
    await sendFirestoreConnectionRequest(user, targetUser);
    await refreshConnections();
    showToast(`Connection request sent to ${targetUser.name}! 🤝`);
  }, [user, refreshConnections, showToast]);

  const respondToConnection = useCallback(async (connectionId, status) => {
    if (!user) throw new Error('Sign in first.');
    await respondToFirestoreConnectionRequest(connectionId, status, user);
    await refreshConnections();
    showToast(status === 'accepted' ? 'Connection accepted! 🎉' : 'Request declined.');
  }, [user, refreshConnections, showToast]);

  const markNotificationRead = useCallback(async (notificationId) => {
    await markFirestoreNotificationRead(notificationId);
    setNotifications((current) => current.map((n) => (
      n.id === notificationId ? { ...n, read: true } : n
    )));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    if (!userId) return;
    await markAllFirestoreNotificationsRead(userId);
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read.');
  }, [userId, showToast]);

  const clearNotifications = useCallback(async () => {
    if (!userId) return;
    await clearFirestoreNotifications(userId);
    setNotifications([]);
    showToast('Notifications cleared.');
  }, [userId, showToast]);

  const updateProfile = useCallback(async (profile) => {
    if (!user?.id) throw new Error('You must be signed in to update your profile.');
    const nextUser = await updateUserProfiles(user, profile);
    setUser(nextUser);
    return nextUser;
  }, [user, setUser]);

  const updateSettings = useCallback(async (nextSettings) => {
    if (!user?.id) throw new Error('You must be signed in to update settings.');
    const merged = {
      ...(user.settings || DEFAULT_USER_SETTINGS),
      ...nextSettings,
    };
    await updateFirestoreUserSettings(user.id, merged);
    setUser((current) => ({ ...current, settings: merged }));
    showToast('Settings saved to Firebase! ⚙️');
    return merged;
  }, [user, setUser, showToast]);

  const seedDemoData = useCallback(async () => {
    if (!user) throw new Error('Sign in first.');
    await seedFirestoreDemoData(user);
    await Promise.all([
      refreshUsers(),
      refreshCircles(),
      refreshStories(),
      refreshMoments(),
      refreshChats(),
      refreshConnections(),
      refreshNotifications(),
    ]);
    showToast('Sample community data seeded to Firebase! 🚀');
  }, [
    user,
    refreshUsers,
    refreshCircles,
    refreshStories,
    refreshMoments,
    refreshChats,
    refreshConnections,
    refreshNotifications,
    showToast,
  ]);

  const unreadNotificationsCount = useMemo(() => {
    const unreadNotifs = notifications.filter((n) => !n.read).length;
    const pendingIncoming = connections.filter((c) => c.recipientId === userId && c.status === 'pending').length;
    return unreadNotifs + pendingIncoming;
  }, [notifications, connections, userId]);

  const value = useMemo(() => ({
    chats,
    stories,
    circles,
    moments,
    users,
    connections,
    notifications,
    unreadNotificationsCount,
    savedMessages,
    activeCall,
    toastMessage,
    loading,
    errors,
    startDirectChat,
    createGroupChat,
    sendMessage,
    deleteMessage,
    toggleDisappearingMessages,
    deleteChat,
    addReaction,
    updateMessageMetadata,
    toggleSaveMessage,
    votePoll,
    createCircle,
    joinCircle,
    leaveCircle,
    addCircleMember,
    deleteCircle,
    openCircleChat,
    createStory,
    markStoryViewed,
    toggleStoryLike,
    replyToStory,
    deleteStory,
    createMoment,
    toggleMomentLike,
    addMomentComment,
    deleteMoment,
    reportContent,
    sendConnectionRequest,
    respondToConnection,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    updateProfile,
    updateSettings,
    seedDemoData,
    setActiveCall,
    showToast,
    refreshChats,
    refreshStories,
    refreshCircles,
    refreshMoments,
    refreshUsers,
    refreshConnections,
    refreshNotifications,
    refreshChatMessages,
    watchChatMessages,
  }), [
    chats,
    stories,
    circles,
    moments,
    users,
    connections,
    notifications,
    unreadNotificationsCount,
    savedMessages,
    activeCall,
    toastMessage,
    loading,
    errors,
    startDirectChat,
    createGroupChat,
    sendMessage,
    deleteMessage,
    toggleDisappearingMessages,
    deleteChat,
    addReaction,
    updateMessageMetadata,
    toggleSaveMessage,
    votePoll,
    createCircle,
    joinCircle,
    leaveCircle,
    addCircleMember,
    deleteCircle,
    openCircleChat,
    createStory,
    markStoryViewed,
    toggleStoryLike,
    replyToStory,
    deleteStory,
    createMoment,
    toggleMomentLike,
    addMomentComment,
    deleteMoment,
    reportContent,
    sendConnectionRequest,
    respondToConnection,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    updateProfile,
    updateSettings,
    seedDemoData,
    showToast,
    refreshChats,
    refreshStories,
    refreshCircles,
    refreshMoments,
    refreshUsers,
    refreshConnections,
    refreshNotifications,
    refreshChatMessages,
    watchChatMessages,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
