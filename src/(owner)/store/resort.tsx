import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authenticatedApiRequest } from "../../api/client";
import { getUserIdFromToken } from "../../api/request";
import type { Resort } from "../../api/resort";

interface ResortState {
  resorts: Resort[];
  loading: boolean;
  error: string | null;
  hasCheckedResorts: boolean;
  hasResorts: boolean;
  isHydrated: boolean;

  fetchResortsByOwner: () => Promise<void>;
  refreshResorts: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  resorts: [],
  loading: false,
  error: null,
  hasCheckedResorts: false,
  hasResorts: false,
  isHydrated: false,
};

export const useResortStore = create<ResortState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchResortsByOwner: async () => {
        if (get().loading) return;

        set({ loading: true, error: null });

        try {
          const userId = await getUserIdFromToken();
          if (!userId) {
            throw new Error("Unable to get user ID from token");
          }

          const data = await authenticatedApiRequest(`/resort/owner/${userId}`);

          const resortsData = Array.isArray(data) ? data : [data];
          const validResorts = resortsData.filter(
            (resort) => resort && resort._id
          );

          set({
            resorts: validResorts,
            hasResorts: validResorts.length > 0,
            loading: false,
            hasCheckedResorts: true,
            error: null,
          });
          console.log(data);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to fetch resorts";
          let finalError: string | null = errorMessage;

          if (
            errorMessage.toLowerCase().includes("no resorts found") ||
            errorMessage.toLowerCase().includes("not found")
          ) {
            finalError = null;
          }

          set({
            resorts: [],
            hasResorts: false,
            error: finalError,
            loading: false,
            hasCheckedResorts: true,
          });
          console.error("Error fetching resorts by owner:", err);
        }
      },

      refreshResorts: async () => {
        await get().fetchResortsByOwner();
      },

      reset: () => {
        set({ ...initialState, isHydrated: true });
      },
    }),
    {
      name: "resort-storage",
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        resorts: state.resorts,
        hasResorts: state.hasResorts,
        hasCheckedResorts: state.hasCheckedResorts,
      }),

      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
        }
      },
    }
  )
);
