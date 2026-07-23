import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UiState {
  pointsHidden: boolean;
  setPointsHidden: (v: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      pointsHidden: false,
      setPointsHidden: (pointsHidden) => set({ pointsHidden }),
    }),
    {
      name: 'ptrack-ui',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
