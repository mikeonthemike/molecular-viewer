import type { StateCreator } from 'zustand';
import type { MoleculeData } from '../parsers/types';

export interface MoleculeSlice {
  data: MoleculeData | null;
  loading: boolean;
  error: string | null;
  setData: (data: MoleculeData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateBonds: (bonds: MoleculeData['bonds']) => void;
  updateSecondaryStructure: (residues: Array<{ seq: number; chainID: string; secondaryStructure?: 'helix' | 'sheet' | 'loop' }>) => void;
  clearMolecule: () => void;
}

export const createMoleculeSlice: StateCreator<MoleculeSlice> = (set) => ({
  data: null,
  loading: false,
  error: null,

  setData: (data) => set({ data, error: null, loading: false }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  updateBonds: (bonds) =>
    set((state) => {
      if (!state.data) return state;
      return { data: { ...state.data, bonds } };
    }),

  updateSecondaryStructure: (residues) =>
    set((state) => {
      if (!state.data) return state;
      const chains = state.data.chains.map((chain) => ({
        ...chain,
        residues: chain.residues.map((residue) => {
          const updated = residues.find(
            (r) => r.chainID === chain.id && r.seq === residue.seq,
          );
          return updated?.secondaryStructure
            ? { ...residue, secondaryStructure: updated.secondaryStructure }
            : residue;
        }),
      }));
      return { data: { ...state.data, chains } };
    }),

  clearMolecule: () => set({ data: null, error: null, loading: false }),
});
