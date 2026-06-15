import { create } from 'zustand';

type NetworkStatus = 'online' | 'offline' | 'poor';

interface NetworkState {
  status: NetworkStatus;
  setStatus: (s: NetworkStatus) => void;
}

export const useNetworkStore = create<NetworkState>()((set) => ({
  status: navigator.onLine ? 'online' : 'offline',
  setStatus: (status) => set({ status }),
}));
