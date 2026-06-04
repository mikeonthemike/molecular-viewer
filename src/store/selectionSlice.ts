import type { StateCreator } from 'zustand';
import type { Atom, Measurement } from '../parsers/types';
import { atomDistance } from '../utils/geometryUtils';

export interface SelectionSlice {
  selectedAtom: Atom | null;
  measurements: Measurement[];
  highlightedChain: string | null;
  pendingMeasureAtom: Atom | null;
  selectAtom: (atom: Atom | null) => void;
  setHighlightedChain: (chainID: string | null) => void;
  addMeasurementPair: (atom: Atom) => void;
  clearMeasurements: () => void;
}

let measureId = 0;

export const createSelectionSlice: StateCreator<SelectionSlice> = (set, get) => ({
  selectedAtom: null,
  measurements: [],
  highlightedChain: null,
  pendingMeasureAtom: null,

  selectAtom: (atom) => set({ selectedAtom: atom }),

  setHighlightedChain: (highlightedChain) => set({ highlightedChain }),

  addMeasurementPair: (atom) => {
    const { pendingMeasureAtom } = get();
    if (!pendingMeasureAtom) {
      set({ pendingMeasureAtom: atom, selectedAtom: atom });
      return;
    }

    if (pendingMeasureAtom.serial === atom.serial) return;

    measureId += 1;
    const measurement: Measurement = {
      id: `m-${measureId}`,
      atomA: pendingMeasureAtom,
      atomB: atom,
      distance: atomDistance(pendingMeasureAtom, atom),
    };

    set((state) => ({
      measurements: [...state.measurements, measurement],
      pendingMeasureAtom: null,
      selectedAtom: atom,
    }));
  },

  clearMeasurements: () => set({ measurements: [], pendingMeasureAtom: null }),
});
