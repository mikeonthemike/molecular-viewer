import { create } from 'zustand';
import { createMoleculeSlice, type MoleculeSlice } from './moleculeSlice';
import { createSelectionSlice, type SelectionSlice } from './selectionSlice';
import { createViewerSlice, type ViewerSlice } from './viewerSlice';

export type AppStore = MoleculeSlice & ViewerSlice & SelectionSlice;

export const useStore = create<AppStore>()((...args) => ({
  ...createMoleculeSlice(...args),
  ...createViewerSlice(...args),
  ...createSelectionSlice(...args),
}));
