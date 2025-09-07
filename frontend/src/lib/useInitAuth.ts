// lib/useInitAuth.ts
import { useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

export function useInitAuth() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await axios.get("/backend/me", { withCredentials: true });
        if (res.data.success && res.data.data) {
          setUser(res.data.data);
        } else {
          clearUser();
        }
      } catch {
        clearUser();
      }
    }
    fetchUser();
  }, [setUser, clearUser]);
}
