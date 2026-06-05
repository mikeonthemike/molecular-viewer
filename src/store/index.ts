import { create } from 'zustand';
import { createLibrarySlice, type LibrarySlice } from './librarySlice';
import { createMoleculeSlice, type MoleculeSlice } from './moleculeSlice';
import { createSelectionSlice, type SelectionSlice } from './selectionSlice';
import { createTourSlice, type TourSlice } from './tourSlice';
import { createViewerSlice, type ViewerSlice } from './viewerSlice';

export type AppStore = MoleculeSlice & ViewerSlice & SelectionSlice & LibrarySlice & TourSlice;

export const useStore = create<AppStore>()((...args) => ({
  ...createMoleculeSlice(...args),
  ...createViewerSlice(...args),
  ...createSelectionSlice(...args),
  ...createLibrarySlice(...args),
  ...createTourSlice(...args),
}));
