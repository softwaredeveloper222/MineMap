// chatService.ts
import { firestore } from "@/firebase/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";

export const getChatId = (uid1: string, uid2: string, hazardId: string) => {
  return [uid1, uid2, hazardId].sort().join("_"); // ensures same ID for both users
};

// ✅ Ensure chat exists before sending message
const ensureChatExists = async (chatId: string, participants: string[], hazardId: string) => {
  const chatRef = doc(firestore, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      hazardId,
      participants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
    });
  }
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  receiverId: string,
  hazardId: string,
  type: string,
  audioUrl?: string,
  text?: string
) => {
  const messagesRef = collection(firestore, "chats", chatId, "messages");

  // make sure parent chat exists
  await ensureChatExists(chatId, [senderId, receiverId], hazardId);

  // add new message
  const newMsgRef = await addDoc(messagesRef, {
    type,
    audioUrl,
    text,
    senderId,
    createdAt: serverTimestamp(),
  });

  // update chat metadata
  const chatRef = doc(firestore, "chats", chatId);
  await setDoc(
    chatRef,
    {
      lastMessage: text,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return newMsgRef;
};

export const listenMessages = (
  chatId: string,
  callback: (messages: any[]) => void
) => {
  const messagesRef = collection(firestore, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  let initialized = false;
  let currentMessages: any[] = [];

  return onSnapshot(q, (snapshot) => {
    // Handle incremental changes
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const newMsg = { id: change.doc.id, ...change.doc.data() };
        currentMessages.push(newMsg);
      }
      if (change.type === "modified") {
        const updated = { id: change.doc.id, ...change.doc.data() };
        currentMessages = currentMessages.map((m) =>
          m.id === updated.id ? updated : m
        );
      }
      if (change.type === "removed") {
        currentMessages = currentMessages.filter((m) => m.id !== change.doc.id);
      }
    });

    // On first snapshot, build the full list
    if (!initialized) {
      currentMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      initialized = true;
    }

    callback([...currentMessages]); // return new state
  });
};


export const listenChats = (
  userId: string,
  callback: (chats: any[]) => void
) => {
  const chatsRef = collection(firestore, "chats");
  const q = query(chatsRef, orderBy("updatedAt", "asc"));

  let initialized = false;
  let currentChats: any[] = [];

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const chat = { id: change.doc.id, ...change.doc.data() };

      // filter: only chats that include this user
      if (!chat.id.includes(userId)) return;

      if (change.type === "added") {
        // add only if not already in list
        if (!currentChats.find((c) => c.id === chat.id)) {
          currentChats.push(chat);
        }
      }

      if (change.type === "modified") {
        currentChats = currentChats.map((c) =>
          c.id === chat.id ? chat : c
        );
      }

      if (change.type === "removed") {
        currentChats = currentChats.filter((c) => c.id !== chat.id);
      }
    });

    // On first snapshot, load the full list
    if (!initialized) {
      currentChats = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((chat) => chat.id.includes(userId));
      initialized = true;
    }

    callback([...currentChats]); // emit updated list
  });
};

export const readMark = async (chatId: string, userId: string) => {
  const chatRef = doc(firestore, "chats", chatId);

  try {
    await updateDoc(chatRef, {
      [`lastRead.${userId}`]: serverTimestamp(),
    });
  } catch (err: any) {
    // This error happens if the chat doc does not exist
    console.warn("readMark failed, chat does not exist:", err.message);
  }
};

export const getUnreadCount = async (chatId: string, currentUserId: string) => {
  // 1. Get chat doc to read lastReadAt
  const chatRef = doc(firestore, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) return 0;

  const lastReadAt = chatSnap.data()?.lastRead?.[currentUserId] || null;

  // 2. Query messages after lastReadAt
  let q = query(
    collection(firestore, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  if (lastReadAt) {
    q = query(
      collection(firestore, "chats", chatId, "messages"),
      where("createdAt", ">", lastReadAt),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

};

export const getAllUnreadCount = async (userId: string) => {
  const chatsRef = collection(firestore, "chats");
  const snapshot = await getDocs(chatsRef);

  const unreadCounts: Record<string, number> = {};
  let totalUnread = 0;

  for (const docSnap of snapshot.docs) {
    const chat = { id: docSnap.id, ...docSnap.data() };

    // ✅ Only consider chats where this user is a participant
    if (!chat.participants?.includes(userId)) continue;

    const count = await getUnreadCount(chat.id, userId);
    unreadCounts[chat.id] = count;
    totalUnread += count;
  }

  return {
    perChat: unreadCounts, // e.g. { chatId1: 2, chatId2: 5 }
    totalUnread,           // e.g. 7
  };
};