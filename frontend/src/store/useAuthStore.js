import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_URL;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  init: () => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      set({ authUser: user });
      return user;
    }
    return null;
  },

  checkAuth: async () => {
    try {
      const storedUser = get().init(); // First try to restore from localStorage
      if (!storedUser) {
        set({ isCheckingAuth: false, authUser: null });
        return;
      }

      const res = await axiosInstance.get("/auth/check");
      const updatedUser = { ...res.data, token: storedUser.token };
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      set({ authUser: updatedUser });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      localStorage.removeItem('authUser');
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      localStorage.setItem('authUser', JSON.stringify(res.data));
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating account");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      localStorage.setItem('authUser', JSON.stringify(res.data));
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error logging in");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      localStorage.removeItem('authUser');
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error logging out");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      const currentUser = JSON.parse(localStorage.getItem('authUser') || '{}');
      const updatedUser = { ...res.data, token: currentUser.token };
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      set({ authUser: updatedUser });
      toast.success("Profile updated successfully");
      return updatedUser;
    } catch (error) {
      console.error("Error in update profile:", error);
      const errorMessage = error.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage);
      return null;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    try {
      const socket = io(BASE_URL, {
        path: '/socket.io',
        query: { userId: authUser._id },
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        secure: true,
        forceNew: true,
        auth: { token: authUser.token }
      });

      socket.on('connect', () => {
        console.log('Socket connected successfully');
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        if (error.message.includes('websocket')) {
          socket.io.opts.transports = ['polling'];
        }
      });

      socket.on("getOnlineUsers", (users) => {
        set({ onlineUsers: users });
      });

      set({ socket });
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));