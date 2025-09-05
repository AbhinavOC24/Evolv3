// store/useAuthStore.ts
import { create } from "zustand";

type User = {
  id: string;
  wallet: string;
  joinedAt: string;
};

type AuthState = {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
