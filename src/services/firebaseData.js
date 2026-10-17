import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase';

export const DEFAULT_USER_SETTINGS = {
  privacy: {
    showOnlineStatus: true,
    allowConnectionRequests: true,
    readReceipts: true,
    privateProfile: false,
  },
  notifications: {
    messageAlerts: true,
    storyUpdates: true,
    momentActivity: true,
    connectionRequests: true,
  },
  storage: {
    autoTranscripts: true,
    autoTranslate: true,
    highQualityMedia: true,
  },
};

function toDate(value) {
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function toDisplayTime(value) {
  return toDate(value)?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) || '';
}

export function toDisplayDateTime(value) {
  return toDate(value)?.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) || '';
}

function fromDocument(snapshot) {
  const data = snapshot.data() || {};
  return {
    ...data,
    id: snapshot.id,
    timestamp: data.timestamp || toDisplayTime(data.createdAt),
  };
}

function publicProfile(user) {
  return {
    id: user.id,
    name: user.name || 'Vibely User',
    username: user.username || (user.email ? user.email.split('@')[0] : 'vibely_user'),
    avatar: user.avatar || '',
    bio: user.bio || '',
    vibe: user.vibe || '🔥 Focused',
    role: user.role || 'user',
    isOnline: true,
    lastSeenAt: serverTimestamp(),
  };
}

export async function saveNewUserProfile(user) {
  const cleanUsername = (user.username || user.email?.split('@')[0] || 'user').replace(/^@/, '');
  const fullUser = {
    ...user,
    username: cleanUsername,
    vibe: user.vibe || '🔥 Focused',
    role: user.role || 'user',
    status: 'active',
    settings: user.settings || DEFAULT_USER_SETTINGS,
    savedMessages: [],
    createdAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  };
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', user.id), fullUser, { merge: true });
  batch.set(doc(db, 'profiles', user.id), publicProfile(fullUser), { merge: true });
  await batch.commit();
}

export async function syncPublicProfile(user) {
  if (!user?.id) return;
  const profileRef = doc(db, 'profiles', user.id);
  const userRef = doc(db, 'users', user.id);
  const [profileSnapshot, userSnapshot] = await Promise.all([
    getDoc(profileRef),
    getDoc(userRef),
  ]);
  const existingUser = userSnapshot.exists() ? userSnapshot.data() : {};
  const cleanUsername = (user.username || existingUser.username || user.email?.split('@')[0] || 'user').replace(/^@/, '');
  const mergedProfile = {
    id: user.id,
    name: user.name || existingUser.name || 'Vibely User',
    username: cleanUsername,
    avatar: user.avatar || existingUser.avatar || '',
    bio: user.bio || existingUser.bio || '',
    vibe: user.vibe || existingUser.vibe || '🔥 Focused',
    isOnline: existingUser.settings?.privacy?.showOnlineStatus !== false,
    lastSeenAt: serverTimestamp(),
  };
  if (!profileSnapshot.exists()) {
    mergedProfile.role = existingUser.role || user.role || 'user';
  }
  const batch = writeBatch(db);
  if (!userSnapshot.exists()) {
    batch.set(userRef, {
      ...user,
      username: cleanUsername,
      vibe: mergedProfile.vibe,
      role: 'user',
      status: 'active',
      settings: DEFAULT_USER_SETTINGS,
      savedMessages: [],
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    }, { merge: true });
  } else {
    batch.set(userRef, { lastSeenAt: serverTimestamp() }, { merge: true });
  }
  batch.set(profileRef, mergedProfile, { merge: true });
  await batch.commit();
}

export async function updateUserProfiles(user, profile) {
  const editableFields = ['name', 'username', 'bio', 'vibe', 'avatar'];
  const updates = Object.fromEntries(
    editableFields
      .filter((key) => profile[key] !== undefined)
      .map((key) => [key, key === 'username' ? String(profile[key]).replace(/^@/, '') : profile[key]])
  );
  updates.updatedAt = serverTimestamp();
  const nextUser = { ...user, ...updates };
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', user.id), updates, { merge: true });
  batch.set(doc(db, 'profiles', user.id), updates, { merge: true });
  await batch.commit();
  return nextUser;
}

export async function updateUserSettings(userId, settings) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', userId), { settings, updatedAt: serverTimestamp() }, { merge: true });
  if (settings?.privacy?.showOnlineStatus !== undefined) {
    batch.set(doc(db, 'profiles', userId), { isOnline: Boolean(settings.privacy.showOnlineStatus) }, { merge: true });
  }
  await batch.commit();
  return settings;
}

export async function syncSavedMessagesToFirestore(userId, savedMessages) {
  if (!userId) return;
  await setDoc(doc(db, 'users', userId), { savedMessages, updatedAt: serverTimestamp() }, { merge: true });
}

// ==================== NOTIFICATIONS ====================
export async function createNotification({ recipientId, sender, type, title, body, link = '/', meta = {} }) {
  if (!recipientId || (sender?.id && recipientId === sender.id)) return null;
  try {
    const ref = await addDoc(collection(db, 'notifications'), {
      recipientId,
      senderId: sender?.id || '',
      senderName: sender?.name || 'Vibely User',
      senderAvatar: sender?.avatar || '',
      type,
      title,
      body,
      link,
      meta,
      read: false,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch {
    return null;
  }
}

export async function fetchNotifications(userId) {
  const snapshot = await getDocs(query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
  ));
  return snapshot.docs
    .map((docSnap) => {
      const item = fromDocument(docSnap);
      return {
        ...item,
        time: toDisplayDateTime(item.createdAt) || item.timestamp || 'Just now',
      };
    })
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
}

export function subscribeToNotifications(userId, onUpdate) {
  if (!userId) return () => {};
  const q = query(collection(db, 'notifications'), where('recipientId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs
      .map((docSnap) => {
        const item = fromDocument(docSnap);
        return {
          ...item,
          time: toDisplayDateTime(item.createdAt) || item.timestamp || 'Just now',
        };
      })
      .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
    onUpdate(items);
  }, () => {});
}

export async function markNotificationRead(notificationId) {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsRead(userId) {
  const snapshot = await getDocs(query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
  ));
  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    if (!docSnap.data().read) {
      batch.update(docSnap.ref, { read: true });
    }
  });
  await batch.commit();
}

export async function clearNotifications(userId) {
  const snapshot = await getDocs(query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
  ));
  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
  await batch.commit();
}

// ==================== CHATS & MESSAGES ====================
export async function fetchChats(userId) {
  const snapshot = await getDocs(query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
  ));
  return snapshot.docs
    .map(fromDocument)
    .sort((a, b) => (toDate(b.updatedAt)?.getTime() || 0) - (toDate(a.updatedAt)?.getTime() || 0));
}

export function subscribeToChats(userId, onUpdate, onError) {
  if (!userId) return () => {};
  const q = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs
      .map(fromDocument)
      .sort((a, b) => (toDate(b.updatedAt)?.getTime() || 0) - (toDate(a.updatedAt)?.getTime() || 0));
    onUpdate(items);
  }, (err) => {
    if (onError) onError(err);
  });
}

export async function fetchChatMessages(chatId) {
  const snapshot = await getDocs(query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc'),
  ));
  return snapshot.docs.map(fromDocument);
}

export function subscribeToChatMessages(chatId, onUpdate) {
  if (!chatId) return () => {};
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    onUpdate(snapshot.docs.map(fromDocument));
  }, () => {});
}

export async function startOrOpenDirectChat(currentUser, targetUser) {
  if (!currentUser?.id || !targetUser?.id) {
    throw new Error('Select a valid user to start a conversation.');
  }
  const existingSnapshot = await getDocs(query(
    collection(db, 'chats'),
    where('participants', 'array-contains', currentUser.id),
  ));
  const existingDirect = existingSnapshot.docs
    .map(fromDocument)
    .find((chat) => !chat.isGroup && Array.isArray(chat.participants) && chat.participants.includes(targetUser.id));

  if (existingDirect) {
    return existingDirect;
  }

  const now = Timestamp.fromDate(new Date());
  const chatData = {
    isGroup: false,
    participants: [currentUser.id, targetUser.id],
    participantProfiles: {
      [currentUser.id]: {
        id: currentUser.id,
        name: currentUser.name || 'Vibely User',
        avatar: currentUser.avatar || '',
        vibe: currentUser.vibe || '',
      },
      [targetUser.id]: {
        id: targetUser.id,
        name: targetUser.name || 'Vibely User',
        avatar: targetUser.avatar || '',
        vibe: targetUser.vibe || '',
      },
    },
    lastMessage: 'Conversation started 👋',
    disappearingMessages: false,
    createdAt: now,
    updatedAt: now,
  };
  const chatRef = await addDoc(collection(db, 'chats'), chatData);
  const createdSnap = await getDoc(chatRef);
  return { ...fromDocument(createdSnap), messages: [] };
}

export async function createGroupChat(currentUser, { groupName, groupAvatar = '', memberIds = [], circleId = null }) {
  if (!currentUser?.id || !groupName?.trim()) {
    throw new Error('Provide a group name to create a group chat.');
  }
  const allParticipants = Array.from(new Set([currentUser.id, ...memberIds]));
  const now = Timestamp.fromDate(new Date());
  const chatData = {
    isGroup: true,
    groupName: groupName.trim(),
    groupAvatar: groupAvatar || '',
    circleId: circleId || null,
    creatorId: currentUser.id,
    participants: allParticipants,
    lastMessage: `${currentUser.name || 'Someone'} created "${groupName.trim()}"`,
    disappearingMessages: false,
    createdAt: now,
    updatedAt: now,
  };
  const chatRef = await addDoc(collection(db, 'chats'), chatData);
  const createdSnap = await getDoc(chatRef);
  return { ...fromDocument(createdSnap), messages: [] };
}

export async function createChatMessage(chatId, user, text, type = 'text', extra = {}) {
  const chatRef = doc(db, 'chats', chatId);
  const messageRef = doc(collection(chatRef, 'messages'));
  const createdAt = new Date();
  const previewText = type === 'voice'
    ? '🎙️ Voice note'
    : type === 'image'
      ? '📷 Photo'
      : type === 'poll'
        ? `📊 Poll: ${extra.question || text}`
        : type === 'story_reply'
          ? `💬 Replied to story: ${text}`
          : text;

  const message = {
    senderId: user.id,
    senderName: user.name || 'Vibely User',
    senderAvatar: user.avatar || '',
    text: text || '',
    type,
    reactions: [],
    ...extra,
    status: 'sent',
    createdAt: Timestamp.fromDate(createdAt),
  };
  const batch = writeBatch(db);
  batch.set(messageRef, message);
  batch.update(chatRef, {
    updatedAt: Timestamp.fromDate(createdAt),
    lastMessage: previewText,
  });
  await batch.commit();
  return fromDocument(await getDoc(messageRef));
}

export async function deleteChatMessage(chatId, messageId) {
  await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
}

export async function toggleChatDisappearing(chatId, enabled) {
  await updateDoc(doc(db, 'chats', chatId), {
    disappearingMessages: Boolean(enabled),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteChat(chatId) {
  await deleteDoc(doc(db, 'chats', chatId));
}

export async function addMessageReaction(chatId, messageId, emoji) {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    reactions: arrayUnion(emoji),
  });
}

export async function updateMessageMetadata(chatId, messageId, updates) {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), updates);
}

export async function castPollVote(chatId, messageId, optionId, voterId) {
  const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(messageRef);
    if (!snapshot.exists()) throw new Error('This poll is no longer available.');
    const message = snapshot.data();
    if (message.type !== 'poll' || !Array.isArray(message.options)) {
      throw new Error('This message is not a poll.');
    }
    const votedBy = message.votedBy || {};
    if (voterId && votedBy[voterId] === optionId) {
      return;
    }
    const previousOptionId = voterId ? votedBy[voterId] : null;
    const option = message.options.find((item) => item.id === optionId);
    if (!option) throw new Error('That poll option is no longer available.');

    const updatedOptions = message.options.map((item) => {
      let votes = item.votes || 0;
      if (previousOptionId && item.id === previousOptionId && votes > 0) {
        votes -= 1;
      }
      if (item.id === optionId) {
        votes += 1;
      }
      return { ...item, votes };
    });
    const nextTotal = updatedOptions.reduce((sum, item) => sum + (item.votes || 0), 0);
    transaction.update(messageRef, {
      options: updatedOptions,
      totalVotes: nextTotal,
      votedBy: voterId ? { ...votedBy, [voterId]: optionId } : votedBy,
    });
  });
}

// ==================== STORIES ====================
export async function fetchStories(userId) {
  const snapshot = await getDocs(query(collection(db, 'stories'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((storySnapshot) => {
    const story = fromDocument(storySnapshot);
    const likedBy = Array.isArray(story.likedBy) ? story.likedBy : [];
    return {
      ...story,
      isViewed: (story.viewedBy || []).includes(userId),
      isLiked: likedBy.includes(userId),
      likes: story.likes ?? likedBy.length,
      timestamp: toDisplayTime(story.createdAt) || story.timestamp || 'Just now',
    };
  });
}

export async function createStory(user, story) {
  const storyRef = await addDoc(collection(db, 'stories'), {
    ...story,
    userId: user.id,
    author: { name: user.name || 'Vibely User', avatar: user.avatar || '' },
    viewedBy: [user.id],
    likedBy: [],
    likes: 0,
    repliesCount: 0,
    createdAt: serverTimestamp(),
  });
  const snapshot = await getDoc(storyRef);
  return {
    ...fromDocument(snapshot),
    isViewed: true,
    isLiked: false,
    likes: 0,
    timestamp: toDisplayTime(snapshot.data()?.createdAt) || toDisplayTime(new Date()),
  };
}

export async function markStoryViewed(storyId, userId) {
  await updateDoc(doc(db, 'stories', storyId), { viewedBy: arrayUnion(userId) });
}

export async function toggleStoryLike(storyId, user) {
  const storyRef = doc(db, 'stories', storyId);
  let liked = false;
  let storyOwnerId = null;
  let nextLikes = 0;

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(storyRef);
    if (!snap.exists()) throw new Error('Story no longer exists.');
    const data = snap.data();
    storyOwnerId = data.userId;
    const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
    liked = !likedBy.includes(user.id);
    const updatedLikedBy = liked
      ? [...likedBy, user.id]
      : likedBy.filter((id) => id !== user.id);
    nextLikes = updatedLikedBy.length;
    transaction.update(storyRef, {
      likedBy: updatedLikedBy,
      likes: nextLikes,
    });
  });

  if (liked && storyOwnerId && storyOwnerId !== user.id) {
    await createNotification({
      recipientId: storyOwnerId,
      sender: user,
      type: 'story_like',
      title: 'Story Liked ❤️',
      body: `${user.name || 'Someone'} liked your story.`,
      link: '/stories',
      meta: { storyId },
    });
  }

  return { liked, likes: nextLikes };
}

export async function replyToStory(story, sender, replyText) {
  if (!story?.id || !sender?.id || !replyText?.trim()) {
    throw new Error('Enter a message to reply to this story.');
  }
  const targetUser = {
    id: story.userId,
    name: story.author?.name || 'Vibely User',
    avatar: story.author?.avatar || '',
  };
  let chat = null;
  if (story.userId && story.userId !== sender.id) {
    chat = await startOrOpenDirectChat(sender, targetUser);
    await createChatMessage(chat.id, sender, replyText.trim(), 'story_reply', {
      storyId: story.id,
      storyCaption: story.caption || 'Story',
      storyImage: story.image || story.imageUrl || '',
    });
    await createNotification({
      recipientId: story.userId,
      sender,
      type: 'story_reply',
      title: 'New Story Reply 💬',
      body: `${sender.name || 'Someone'} replied to your story: "${replyText.trim()}"`,
      link: '/chats',
      meta: { chatId: chat.id, storyId: story.id },
    });
  }
  const storyRef = doc(db, 'stories', story.id);
  const snap = await getDoc(storyRef);
  if (snap.exists()) {
    const currentReplies = snap.data().repliesCount || 0;
    await updateDoc(storyRef, { repliesCount: currentReplies + 1 });
  }
  return chat;
}

export async function deleteStory(storyId) {
  await deleteDoc(doc(db, 'stories', storyId));
}

// ==================== CIRCLES ====================
export async function fetchCircles(userId) {
  const snapshot = await getDocs(collection(db, 'circles'));
  return snapshot.docs.map((circleSnapshot) => {
    const circle = fromDocument(circleSnapshot);
    const memberIds = Array.isArray(circle.memberIds) ? circle.memberIds : [];
    return {
      ...circle,
      memberIds,
      members: memberIds.length,
      isMember: memberIds.includes(userId),
    };
  });
}

export async function createCircle(userId, circle) {
  const circleRef = await addDoc(collection(db, 'circles'), {
    name: circle.name,
    description: circle.description || '',
    color: circle.color || 'bg-violet-600',
    privacy: circle.privacy || 'open',
    creatorId: userId,
    memberIds: [userId, ...(circle.memberIds || [])],
    createdAt: serverTimestamp(),
  });
  const snapshot = await getDoc(circleRef);
  const created = fromDocument(snapshot);
  const memberIds = Array.isArray(created.memberIds) ? created.memberIds : [userId];
  return { ...created, memberIds, members: memberIds.length, isMember: true };
}

export async function joinCircle(circleId, userId) {
  const circleRef = doc(db, 'circles', circleId);
  await updateDoc(circleRef, {
    memberIds: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  });
}

export async function leaveCircle(circleId, userId) {
  const circleRef = doc(db, 'circles', circleId);
  await updateDoc(circleRef, {
    memberIds: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  });
}

export async function addCircleMember(circleId, targetUserId, inviter) {
  const circleRef = doc(db, 'circles', circleId);
  await updateDoc(circleRef, {
    memberIds: arrayUnion(targetUserId),
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(circleRef);
  const circleName = snap.exists() ? snap.data().name : 'a Private Circle';
  if (inviter) {
    await createNotification({
      recipientId: targetUserId,
      sender: inviter,
      type: 'circle_invite',
      title: 'Added to Private Circle 🔒',
      body: `${inviter.name || 'Someone'} added you to "${circleName}".`,
      link: '/circles',
      meta: { circleId },
    });
  }
}

export async function deleteCircle(circleId) {
  await deleteDoc(doc(db, 'circles', circleId));
}

export async function openOrCreateCircleChat(currentUser, circle) {
  if (circle.chatId) {
    const existingSnap = await getDoc(doc(db, 'chats', circle.chatId));
    if (existingSnap.exists()) {
      const data = existingSnap.data();
      if (!(data.participants || []).includes(currentUser.id)) {
        await updateDoc(existingSnap.ref, { participants: arrayUnion(currentUser.id) });
      }
      return fromDocument(existingSnap);
    }
  }
  const createdChat = await createGroupChat(currentUser, {
    groupName: `${circle.name} Circle`,
    memberIds: circle.memberIds || [currentUser.id],
    circleId: circle.id,
  });
  await updateDoc(doc(db, 'circles', circle.id), { chatId: createdChat.id });
  return createdChat;
}

// ==================== MOMENTS ====================
export async function fetchMoments(userId) {
  const snapshot = await getDocs(collection(db, 'moments'));
  const moments = snapshot.docs.map((momentSnapshot) => {
    const moment = fromDocument(momentSnapshot);
    const likedBy = Array.isArray(moment.likedBy) ? moment.likedBy : [];
    const commentsList = Array.isArray(moment.commentsList) ? moment.commentsList : [];
    return {
      ...moment,
      likedBy,
      isLiked: likedBy.includes(userId),
      likes: moment.likes ?? likedBy.length,
      commentsList,
      comments: moment.comments ?? commentsList.length,
      time: toDisplayDateTime(moment.createdAt) || moment.time || 'Just now',
    };
  });
  return moments.sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
}

export async function createMoment(user, moment) {
  const momentRef = await addDoc(collection(db, 'moments'), {
    ...moment,
    circleId: moment.circleId || null,
    circleName: moment.circleName || 'Public Feed',
    authorId: user.id,
    author: { name: user.name || 'Vibely User', avatar: user.avatar || '' },
    likedBy: [],
    likes: 0,
    commentsList: [],
    comments: 0,
    createdAt: serverTimestamp(),
  });
  const snapshot = await getDoc(momentRef);
  const created = fromDocument(snapshot);
  return {
    ...created,
    likedBy: [],
    isLiked: false,
    likes: 0,
    commentsList: [],
    comments: 0,
    time: toDisplayDateTime(created.createdAt) || toDisplayDateTime(new Date()),
  };
}

export async function toggleMomentLike(momentId, user) {
  const momentRef = doc(db, 'moments', momentId);
  let isLiked = false;
  let nextLikes = 0;
  let authorId = null;
  let momentTitle = '';

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(momentRef);
    if (!snap.exists()) throw new Error('This moment no longer exists.');
    const data = snap.data();
    authorId = data.authorId;
    momentTitle = data.title || 'your moment';
    const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
    isLiked = !likedBy.includes(user.id);
    const updatedLikedBy = isLiked
      ? [...likedBy, user.id]
      : likedBy.filter((id) => id !== user.id);
    nextLikes = updatedLikedBy.length;
    transaction.update(momentRef, {
      likedBy: updatedLikedBy,
      likes: nextLikes,
    });
  });

  if (isLiked && authorId && authorId !== user.id) {
    await createNotification({
      recipientId: authorId,
      sender: user,
      type: 'moment_like',
      title: 'Moment Liked ❤️',
      body: `${user.name || 'Someone'} liked "${momentTitle}".`,
      link: '/moments',
      meta: { momentId },
    });
  }

  return { isLiked, likes: nextLikes };
}

export async function addMomentComment(momentId, user, text) {
  if (!text?.trim()) throw new Error('Comment cannot be empty.');
  const momentRef = doc(db, 'moments', momentId);
  const commentObj = {
    id: crypto.randomUUID(),
    authorId: user.id,
    authorName: user.name || 'Vibely User',
    authorAvatar: user.avatar || '',
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
  let authorId = null;
  let momentTitle = '';
  let updatedCommentsList = [];

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(momentRef);
    if (!snap.exists()) throw new Error('This moment no longer exists.');
    const data = snap.data();
    authorId = data.authorId;
    momentTitle = data.title || 'your moment';
    const currentList = Array.isArray(data.commentsList) ? data.commentsList : [];
    updatedCommentsList = [...currentList, commentObj];
    transaction.update(momentRef, {
      commentsList: updatedCommentsList,
      comments: updatedCommentsList.length,
    });
  });

  if (authorId && authorId !== user.id) {
    await createNotification({
      recipientId: authorId,
      sender: user,
      type: 'moment_comment',
      title: 'New Comment on Moment 💬',
      body: `${user.name || 'Someone'} commented on "${momentTitle}": "${text.trim()}"`,
      link: '/moments',
      meta: { momentId },
    });
  }

  return commentObj;
}

export async function deleteMoment(momentId) {
  await deleteDoc(doc(db, 'moments', momentId));
}

export async function reportContent(reporter, { targetType, targetId, reason }) {
  const reportRef = await addDoc(collection(db, 'reports'), {
    reporterId: reporter.id,
    reporterName: reporter.name || 'Vibely User',
    targetType,
    targetId,
    reason: reason || 'Inappropriate content',
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return reportRef.id;
}

// ==================== DISCOVER & CONNECTIONS ====================
export async function fetchDiscoverProfiles(userId) {
  const snapshot = await getDocs(collection(db, 'profiles'));
  return snapshot.docs
    .filter((profile) => profile.id !== userId && profile.data()?.status !== 'suspended')
    .map((profile) => {
      const data = profile.data();
      const lastSeen = toDate(data.lastSeenAt);
      const recentlyActive = lastSeen ? (Date.now() - lastSeen.getTime() < 15 * 60 * 1000) : false;
      return {
        id: profile.id,
        name: data.name || 'Vibely User',
        username: data.username || 'vibely_user',
        avatar: data.avatar || '',
        bio: data.bio || '',
        vibe: data.vibe || '🔥 Focused',
        isOnline: data.isOnline ?? recentlyActive,
      };
    });
}

export async function fetchConnections(userId) {
  if (!userId) return [];
  const [sentSnap, receivedSnap] = await Promise.all([
    getDocs(query(collection(db, 'connections'), where('senderId', '==', userId))),
    getDocs(query(collection(db, 'connections'), where('recipientId', '==', userId))),
  ]);
  const map = new Map();
  sentSnap.docs.forEach((d) => map.set(d.id, fromDocument(d)));
  receivedSnap.docs.forEach((d) => map.set(d.id, fromDocument(d)));
  return Array.from(map.values());
}

export async function sendConnectionRequest(sender, recipient) {
  const senderId = typeof sender === 'object' ? sender.id : sender;
  const recipientId = typeof recipient === 'object' ? recipient.id : recipient;
  const connectionId = `${senderId}_${recipientId}`;
  const reverseId = `${recipientId}_${senderId}`;
  const connectionRef = doc(db, 'connections', connectionId);
  const reverseRef = doc(db, 'connections', reverseId);

  await runTransaction(db, async (transaction) => {
    const [existing, reverseExisting] = await Promise.all([
      transaction.get(connectionRef),
      transaction.get(reverseRef),
    ]);
    if (existing.exists()) {
      throw new Error('You have already sent a connection request to this user.');
    }
    if (reverseExisting.exists()) {
      transaction.update(reverseRef, { status: 'accepted', updatedAt: serverTimestamp() });
      return;
    }
    transaction.set(connectionRef, {
      senderId,
      senderName: sender?.name || 'Vibely User',
      senderAvatar: sender?.avatar || '',
      recipientId,
      recipientName: recipient?.name || 'Vibely User',
      recipientAvatar: recipient?.avatar || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  });

  if (typeof sender === 'object' && recipientId) {
    await createNotification({
      recipientId,
      sender,
      type: 'connection_request',
      title: 'New Vibe Connection Request 🤝',
      body: `${sender.name || 'Someone'} wants to connect with you on Vibely!`,
      link: '/discover',
      meta: { connectionId },
    });
  }
}

export async function respondToConnectionRequest(connectionId, status, currentUser) {
  const connectionRef = doc(db, 'connections', connectionId);
  const snap = await getDoc(connectionRef);
  if (!snap.exists()) throw new Error('Connection request not found.');
  const data = snap.data();

  if (status === 'declined') {
    await deleteDoc(connectionRef);
    return { id: connectionId, status: 'declined' };
  }

  await updateDoc(connectionRef, {
    status: 'accepted',
    updatedAt: serverTimestamp(),
  });

  if (currentUser && data.senderId) {
    await createNotification({
      recipientId: data.senderId,
      sender: currentUser,
      type: 'connection_accepted',
      title: 'Connection Accepted 🎉',
      body: `${currentUser.name || 'Someone'} accepted your connection request!`,
      link: '/chats',
      meta: { connectionId },
    });
  }

  return { ...fromDocument(await getDoc(connectionRef)), status: 'accepted' };
}

// ==================== ADMIN DASHBOARD ====================
export async function fetchAdminDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [profilesCount, activeCount, momentsCount, reportsSnapshot, profilesSnapshot, usersSnapshot] = await Promise.all([
    getCountFromServer(collection(db, 'profiles')),
    getCountFromServer(query(
      collection(db, 'profiles'),
      where('lastSeenAt', '>=', Timestamp.fromDate(today)),
    )).catch(() => ({ data: () => ({ count: 0 }) })),
    getCountFromServer(collection(db, 'moments')).catch(() => ({ data: () => ({ count: 0 }) })),
    getDocs(collection(db, 'reports')).catch(() => ({ docs: [] })),
    getDocs(collection(db, 'profiles')).catch(() => ({ docs: [] })),
    getDocs(collection(db, 'users')).catch(() => ({ docs: [] })),
  ]);

  const userMap = new Map();
  profilesSnapshot.docs.forEach((d) => userMap.set(d.id, fromDocument(d)));
  usersSnapshot.docs.forEach((d) => userMap.set(d.id, { ...(userMap.get(d.id) || {}), ...fromDocument(d) }));

  const reports = reportsSnapshot.docs.map(fromDocument);
  const pendingReportsCount = reports.filter((r) => r.status !== 'resolved').length;

  return {
    analytics: {
      totalAccounts: profilesCount.data().count,
      activeToday: activeCount.data().count,
      transcriptsProcessed: momentsCount.data().count,
      pendingReports: pendingReportsCount,
    },
    users: Array.from(userMap.values()),
    reports,
  };
}

export async function suspendUser(userId) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', userId), { status: 'suspended' }, { merge: true });
  batch.set(doc(db, 'profiles', userId), { status: 'suspended', isOnline: false }, { merge: true });
  await batch.commit();
}

export async function unsuspendUser(userId) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', userId), { status: 'active' }, { merge: true });
  batch.set(doc(db, 'profiles', userId), { status: 'active' }, { merge: true });
  await batch.commit();
}

export async function resolveModerationReport(reportId) {
  await updateDoc(doc(db, 'reports', reportId), {
    status: 'resolved',
    resolvedAt: serverTimestamp(),
  });
}

// ==================== SEED SAMPLE DATA TO FIRESTORE ====================
export async function seedDemoCommunityData(currentUser) {
  if (!currentUser?.id) throw new Error('Sign in first to seed community data.');

  const demoProfiles = [
    {
      id: 'demo_arav_sharma',
      name: 'Aarav Sharma',
      username: 'aarav_codes',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Aarav',
      bio: 'Full-stack engineer building edge apps on Cloudflare & Firebase ⚡',
      vibe: '💻 Coding',
      role: 'user',
      status: 'active',
      isOnline: true,
      isSeed: true,
    },
    {
      id: 'demo_maya_lin',
      name: 'Maya Lin',
      username: 'mayavibes',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Maya',
      bio: 'Product designer, specialty coffee enthusiast & synthwave listener ☕🎧',
      vibe: '☕ Coffee',
      role: 'user',
      status: 'active',
      isOnline: true,
      isSeed: true,
    },
    {
      id: 'demo_kabir_verma',
      name: 'Kabir Verma',
      username: 'kabir_tracks',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Kabir',
      bio: 'Lo-fi producer & late night beatmaker. Always down to collab.',
      vibe: '🎧 Music',
      role: 'user',
      status: 'active',
      isOnline: false,
      isSeed: true,
    },
    {
      id: 'demo_zoya_khan',
      name: 'Zoya Khan',
      username: 'zoyawanders',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Zoya',
      bio: 'Digital nomad exploring mountain cafes and indie communities ✈️',
      vibe: '✈️ Travel',
      role: 'user',
      status: 'active',
      isOnline: true,
      isSeed: true,
    },
  ];

  const batch = writeBatch(db);
  for (const p of demoProfiles) {
    batch.set(doc(db, 'profiles', p.id), { ...p, lastSeenAt: serverTimestamp() }, { merge: true });
  }

  // Create 2 sample circles with currentUser included
  const circle1Ref = doc(db, 'circles', 'circle_founders_club');
  batch.set(circle1Ref, {
    name: 'Cloudflare & Firebase Builders',
    description: 'Shipping real-time serverless apps, edge functions, and clean UI.',
    color: 'bg-violet-600',
    privacy: 'open',
    creatorId: currentUser.id,
    memberIds: [currentUser.id, 'demo_arav_sharma', 'demo_maya_lin'],
    createdAt: serverTimestamp(),
  }, { merge: true });

  const circle2Ref = doc(db, 'circles', 'circle_late_night_lofi');
  batch.set(circle2Ref, {
    name: 'Late Night Lo-Fi & Coffee',
    description: 'Chill playlists, night coding sessions, and espresso notes.',
    color: 'bg-fuchsia-600',
    privacy: 'open',
    creatorId: 'demo_kabir_verma',
    memberIds: [currentUser.id, 'demo_kabir_verma', 'demo_zoya_khan'],
    createdAt: serverTimestamp(),
  }, { merge: true });

  // Create sample stories
  const story1Ref = doc(db, 'stories', 'story_demo_1');
  batch.set(story1Ref, {
    userId: 'demo_maya_lin',
    author: { name: 'Maya Lin', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Maya' },
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    caption: 'Morning pour-over before diving into the design sprint ☕✨',
    vibe: '☕ Coffee',
    viewedBy: [],
    likedBy: ['demo_arav_sharma'],
    likes: 1,
    repliesCount: 0,
    createdAt: serverTimestamp(),
  }, { merge: true });

  const story2Ref = doc(db, 'stories', 'story_demo_2');
  batch.set(story2Ref, {
    userId: 'demo_arav_sharma',
    author: { name: 'Aarav Sharma', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Aarav' },
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',
    caption: 'Zero-latency Firestore listeners + Cloudflare Pages deploy is live! 🚀',
    vibe: '💻 Coding',
    viewedBy: [],
    likedBy: ['demo_maya_lin', 'demo_zoya_khan'],
    likes: 2,
    repliesCount: 1,
    createdAt: serverTimestamp(),
  }, { merge: true });

  // Create sample moments
  const moment1Ref = doc(db, 'moments', 'moment_demo_1');
  batch.set(moment1Ref, {
    title: 'Golden hour workspace setup — shipping Vibely 2.0 on Cloudflare Pages!',
    location: 'Bengaluru, India',
    circleId: 'circle_founders_club',
    circleName: 'Cloudflare & Firebase Builders',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80',
    authorId: 'demo_arav_sharma',
    author: { name: 'Aarav Sharma', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Aarav' },
    likedBy: ['demo_maya_lin'],
    likes: 1,
    commentsList: [
      {
        id: 'c_demo_1',
        authorId: 'demo_maya_lin',
        authorName: 'Maya Lin',
        authorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Maya',
        text: 'Love the clean dark mode palette! 🔥',
        createdAt: new Date().toISOString(),
      },
    ],
    comments: 1,
    createdAt: serverTimestamp(),
  }, { merge: true });

  const moment2Ref = doc(db, 'moments', 'moment_demo_2');
  batch.set(moment2Ref, {
    title: 'Mountain cafe view with fast fiber and fresh roast ☕🏔️',
    location: 'Manali, HP',
    circleId: null,
    circleName: 'Public Feed',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80',
    authorId: 'demo_zoya_khan',
    author: { name: 'Zoya Khan', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Zoya' },
    likedBy: ['demo_kabir_verma', 'demo_arav_sharma'],
    likes: 2,
    commentsList: [],
    comments: 0,
    createdAt: serverTimestamp(),
  }, { merge: true });

  // Create an incoming connection request so user can test accepting it
  const connRef = doc(db, 'connections', `demo_maya_lin_${currentUser.id}`);
  batch.set(connRef, {
    senderId: 'demo_maya_lin',
    senderName: 'Maya Lin',
    senderAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Maya',
    recipientId: currentUser.id,
    recipientName: currentUser.name || 'You',
    recipientAvatar: currentUser.avatar || '',
    status: 'pending',
    createdAt: serverTimestamp(),
  }, { merge: true });

  await batch.commit();

  // Ensure a starter chat with Aarav exists
  const starterChat = await startOrOpenDirectChat(currentUser, demoProfiles[0]);
  const existingMsgs = await fetchChatMessages(starterChat.id);
  if (existingMsgs.length === 0) {
    await createChatMessage(
      starterChat.id,
      demoProfiles[0],
      'Hey! Welcome to Vibely 🎉 All Firestore collections (Chats, Stories, Circles, Moments, Discover, Notifications & Settings) are now connected!',
      'text',
      { translation: '¡Hola! Bienvenido a Vibely 🎉 ¡Todas las colecciones de Firestore ya están conectadas!' }
    );
    await createChatMessage(
      starterChat.id,
      demoProfiles[0],
      'Which Vibely feature are you testing first?',
      'poll',
      {
        question: 'Which Vibely feature are you testing first?',
        options: [
          { id: 'opt_1', text: '⚡ Real-time Chats & Polls', votes: 3 },
          { id: 'opt_2', text: '✨ Moments & Likes/Comments', votes: 2 },
          { id: 'opt_3', text: '🔒 Private Circles & Stories', votes: 4 },
        ],
        totalVotes: 9,
        votedBy: {},
      }
    );
  }
}
