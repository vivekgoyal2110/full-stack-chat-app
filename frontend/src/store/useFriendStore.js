import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useChatStore } from "./useChatStore.js";
import { useAuthStore } from "./useAuthStore.js";

export const useFriendStore = create((set, get) => ({
    searchResults: null,
    friendRequests: [],
    blockedUsers: [],
    isSearching: false,
    isSendingRequest: false,
    isLoadingRequests: false,
    isLoadingBlockedUsers: false,

    // Socket event subscriptions
    subscribeToFriendEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        // Remove existing listeners to prevent duplicates
        socket.off("friendRequestReceived");
        socket.off("friendRequestResponseReceived");

        // Listen for new friend requests
        socket.on("friendRequestReceived", ({ request }) => {
            if (request && request.from) {
                // Add the new request to the state
                set(state => ({
                    friendRequests: [...state.friendRequests, request]
                }));
                toast.success(`New friend request from ${request.from.fullName}`);
            }
        });

        // Listen for friend request responses
        socket.on("friendRequestResponseReceived", ({ from, status, requestId }) => {
            const message = status === 'accepted' 
                ? `${from.fullName} accepted your friend request` 
                : `${from.fullName} rejected your friend request`;
            
            toast(message, {
                icon: status === 'accepted' ? '👍' : '👎'
            });

            if (status === 'accepted') {
                // Refresh friends list if request was accepted
                useChatStore.getState().getUsers();
            }
        });
    },

    unsubscribeFromFriendEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
            socket.off("friendRequestReceived");
            socket.off("friendRequestResponseReceived");
        }
    },

    searchUsers: async (email) => {
        if (!email) return;
        set({ isSearching: true, searchResults: null });
        try {
            const res = await axiosInstance.get(`/friends/search?email=${email}`);
            set({ searchResults: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Error searching for user");
            set({ searchResults: null });
        } finally {
            set({ isSearching: false });
        }
    },

    sendFriendRequest: async (userId) => {
        set({ isSendingRequest: true });
        try {
            const res = await axiosInstance.post(`/friends/request/${userId}`);
            toast.success(res.data.message);
            set({ searchResults: null }); // Clear search results after sending request
        } catch (error) {
            toast.error(error.response?.data?.message || "Error sending friend request");
        } finally {
            set({ isSendingRequest: false });
        }
    },

    getFriendRequests: async () => {
        set({ isLoadingRequests: true });
        try {
            const res = await axiosInstance.get('/friends/requests');
            set({ friendRequests: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Error loading friend requests");
        } finally {
            set({ isLoadingRequests: false });
        }
    },

    handleFriendRequest: async (requestId, action) => {
        try {
            const res = await axiosInstance.put(`/friends/request/${requestId}`, { action });
            toast.success(res.data.message);
            
            // Update friend requests list in state
            set(state => ({
                friendRequests: state.friendRequests.filter(req => req._id !== requestId)
            }));
            
            if (action === 'accepted') {
                // Refresh friends list if request was accepted
                useChatStore.getState().getUsers();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Error handling friend request");
        }
    },

    removeFriend: async (userId) => {
        try {
            const res = await axiosInstance.delete(`/friends/remove/${userId}`);
            toast.success(res.data.message);
            // Clear selected user if they were the one removed
            const selectedUser = useChatStore.getState().selectedUser;
            if (selectedUser?._id === userId) {
                useChatStore.setState({ selectedUser: null, messages: [] });
            }
            // Refresh friends list
            useChatStore.getState().getUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error removing friend");
        }
    },

    blockUser: async (userId) => {
        try {
            const res = await axiosInstance.post(`/friends/block/${userId}`);
            toast.success(res.data.message);
            // Clear selected user if they were the one blocked
            const selectedUser = useChatStore.getState().selectedUser;
            if (selectedUser?._id === userId) {
                useChatStore.setState({ selectedUser: null, messages: [] });
            }
            // Refresh friends list
            useChatStore.getState().getUsers();
            // Refresh blocked users list
            get().getBlockedUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error blocking user");
        }
    },

    unblockUser: async (userId) => {
        try {
            const res = await axiosInstance.delete(`/friends/unblock/${userId}`);
            toast.success(res.data.message);
            // Refresh blocked users list
            get().getBlockedUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error unblocking user");
        }
    },

    getBlockedUsers: async () => {
        set({ isLoadingBlockedUsers: true });
        try {
            const res = await axiosInstance.get('/friends/blocked');
            set({ blockedUsers: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Error loading blocked users");
        } finally {
            set({ isLoadingBlockedUsers: false });
        }
    },

    clearSearchResults: () => {
        set({ searchResults: null });
    }
}));