import type { StateCreator } from 'zustand';
import type { ColorScheme, RepresentationMode } from '../parsers/types';

export interface ViewerSlice {
  representation: RepresentationMode;
  colorScheme: ColorScheme;
  showHydrogens: boolean;
  visibleChains: Set<string>;
  setRepresentation: (mode: RepresentationMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setShowHydrogens: (show: boolean) => void;
  setVisibleChains: (chains: Set<string>) => void;
  toggleChainVisibility: (chainID: string) => void;
}

export const createViewerSlice: StateCreator<ViewerSlice> = (set) => ({
  representation: 'ball-and-stick',
  colorScheme: 'element',
  showHydrogens: true,
  visibleChains: new Set<string>(),

  setRepresentation: (representation) => set({ representation }),

  setColorScheme: (colorScheme) => set({ colorScheme }),

  setShowHydrogens: (showHydrogens) => set({ showHydrogens }),

  setVisibleChains: (visibleChains) => set({ visibleChains }),

  toggleChainVisibility: (chainID) =>
    set((state) => {
      const next = new Set(state.visibleChains);
      if (next.has(chainID)) next.delete(chainID);
      else next.add(chainID);
      return { visibleChains: next };
    }),
});
