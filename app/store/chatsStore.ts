import { create } from "zustand";

type ChatStore = {
    chats: any[];
    setChats: (chats: any[]) => void;
    addChat: (chat: any) => void;

    messages: any[];
    setMessages: (messages: any[]) => void;
    addMessage: (message: any) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
    chats: [],
    setChats: (chats) => set({ chats }),
    addChat: (chat) =>
        set((state) => ({ chats: [...state.chats, chat] })),

    messages: [],
    setMessages: (messages) => set({ messages }),
    addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
}));
