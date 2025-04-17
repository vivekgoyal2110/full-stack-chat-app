import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isTyping: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error loading users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    if (!userId) return;
    
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error loading messages");
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      const newMessage = res.data;

      // Add message to local state
      if (!messages.some(msg => msg._id === newMessage._id)) {
        set({ messages: [...messages, newMessage] });
      }

      // Emit via socket
      const socket = useAuthStore.getState().socket;
      const authUser = useAuthStore.getState().authUser;
      
      if (socket) {
        socket.emit("sendMessage", {
          ...newMessage,
          senderId: authUser._id,
          receiverId: selectedUser._id
        });
      }

      return newMessage;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
      return null;
    }
  },

  deleteMessage: async (messageId, deleteForEveryone = false) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`, {
        data: { deleteForEveryone }
      });
      
      // We don't need to update messages state here as it will be handled by socket events
      const message = deleteForEveryone ? "Message deleted for everyone" : "Message deleted for you";
      toast.success(message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { authUser } = useAuthStore.getState();
    
    if (!socket) return;

    // Remove any existing listeners to prevent duplicates
    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("userTyping");

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages } = get();
      
      // Check if the message belongs to the current chat
      if (selectedUser && (
        (newMessage.senderId === selectedUser._id && newMessage.receiverId === authUser._id) ||
        (newMessage.senderId === authUser._id && newMessage.receiverId === selectedUser._id)
      )) {
        if (!messages.some(msg => msg._id === newMessage._id)) {
          set({ messages: [...messages, newMessage] });
        }
      }
    });

    socket.on("messageDeleted", ({ messageId, deleteForEveryone }) => {
      const { messages } = get();
      if (deleteForEveryone) {
        // Replace the message text with "This message was deleted"
        set({
          messages: messages.map(msg => 
            msg._id === messageId 
              ? { ...msg, text: "This message was deleted", image: null, deleteForEveryone: true }
              : msg
          )
        });
      } else {
        // Remove the message only for the current user
        set({ messages: messages.filter(msg => msg._id !== messageId) });
      }
    });

    socket.on("userTyping", ({ senderId, isTyping }) => {
      const { selectedUser } = get();
      if (selectedUser && senderId === selectedUser._id) {
        set({ isTyping });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("messageDeleted");
      socket.off("userTyping");
    }
  },

  setSelectedUser: (user) => {
    set({ selectedUser: user });
    if (user) {
      get().getMessages(user._id);
    } else {
      set({ messages: [] });
    }
  },
}));