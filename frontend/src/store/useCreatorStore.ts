// src/store/useCreatorStore.ts
import { create } from "zustand";
import axios from "axios";

interface Entry {
  id: number;
  entryIndex: number;
  mediaType?: string;
  title?: string;
  description?: string;
}

interface Series {
  id: number;
  contractAddress: string;
  name: string;
  symbol: string;
  description: string;
  metadataURI?: string;
  coverImage?: string;
  creatorWallet: string;
  entries?: Entry[];
}

interface CreatorStore {
  series: Series[];
  selectedSeries: Series | null;
  loading: boolean;
  error: string | null;
  fetchSeries: () => Promise<void>;
  fetchSeriesById: (id: string) => Promise<void>;
  clearSelectedSeries: () => void;
}

export const useCreatorStore = create<CreatorStore>((set) => ({
  series: [],
  selectedSeries: null,
  loading: false,
  error: null,

  fetchSeries: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get("/backend/mySeries", {
        withCredentials: true,
      });

      if (res.data.success) {
        console.log(res.data.data);
        const series = res.data.data.map((s: any) => ({
          ...s,
          creatorWallet: s.creator.wallet,
        }));
        set({ series: series, loading: false });
      } else {
        set({ error: res.data.message, loading: false });
      }
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch series", loading: false });
    }
  },

  fetchSeriesById: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.get(`/backend/series/${id}`, {
        withCredentials: true,
      });

      if (res.data.success) {
        const series = {
          ...res.data.data,
          creatorWallet: res.data.data.creator.wallet,
        };
        set({ selectedSeries: series, loading: false });
      } else {
        set({ error: res.data.message, loading: false });
      }
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch series", loading: false });
    }
  },

  clearSelectedSeries: () => set({ selectedSeries: null }),
}));
