import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("chatapp-theme") || "coffee",
  setTheme: (theme) => {
    localStorage.setItem("chatapp-theme", theme);
    set({ theme });
  },
}));