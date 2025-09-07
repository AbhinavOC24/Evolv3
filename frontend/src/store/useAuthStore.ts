// store/useAuthStore.ts
import { create } from "zustand";

type AuthStatus = "loading" | "unauthenticated" | "authenticated";

interface AuthState {
  user: any | null;
  status: AuthStatus;
  setUser: (user: any) => void;
  clearUser: () => void;
  setStatus: (status: AuthStatus) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  setUser: (user) => set({ user, status: "authenticated" }),
  clearUser: () => set({ user: null, status: "unauthenticated" }),
  setStatus: (status) => set({ status }),
}));
