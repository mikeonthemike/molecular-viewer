import type { StateCreator } from 'zustand';
import type { SavedViewerState } from '../parsers/types';

const COMPLETED_TOURS_KEY = 'mv-completed-tours';

function loadCompletedTours(): Record<string, number> {
  try {
    const raw = localStorage.getItem(COMPLETED_TOURS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as Record<string, number>;
  } catch {
    return {};
  }
}

function persistCompletedTours(completed: Record<string, number>): void {
  try {
    localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify(completed));
  } catch {
    // localStorage may be unavailable
  }
}

export interface TourSlice {
  activeTourId: string | null;
  currentStepIndex: number;
  savedViewerState: SavedViewerState | null;
  /** Set on exit so ViewerCanvas can restore the pre-tour camera */
  restoredViewerState: SavedViewerState | null;
  completedTours: Record<string, number>;
  embedMode: boolean;
  pendingEmbedTourId: string | null;
  setEmbedMode: (embed: boolean) => void;
  setPendingEmbedTourId: (tourId: string | null) => void;
  startTour: (tourId: string, savedState: SavedViewerState) => void;
  exitTour: () => SavedViewerState | null;
  clearRestoredViewerState: () => void;
  nextStep: (maxIndex: number) => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  markTourCompleted: (tourId: string, stepIndex: number) => void;
}

export const createTourSlice: StateCreator<TourSlice> = (set, get) => ({
  activeTourId: null,
  currentStepIndex: 0,
  savedViewerState: null,
  restoredViewerState: null,
  completedTours: loadCompletedTours(),
  embedMode: false,
  pendingEmbedTourId: null,

  setEmbedMode: (embedMode) => set({ embedMode }),

  setPendingEmbedTourId: (pendingEmbedTourId) => set({ pendingEmbedTourId }),

  startTour: (tourId, savedState) =>
    set({
      activeTourId: tourId,
      currentStepIndex: 0,
      savedViewerState: savedState,
    }),

  exitTour: () => {
    const restored = get().savedViewerState;
    set({
      activeTourId: null,
      currentStepIndex: 0,
      savedViewerState: null,
      restoredViewerState: restored,
    });
    return restored;
  },

  clearRestoredViewerState: () => set({ restoredViewerState: null }),

  nextStep: (maxIndex) =>
    set((state) => ({
      currentStepIndex: Math.min(state.currentStepIndex + 1, maxIndex),
    })),

  prevStep: () =>
    set((state) => ({
      currentStepIndex: Math.max(state.currentStepIndex - 1, 0),
    })),

  goToStep: (index) => set({ currentStepIndex: Math.max(0, index) }),

  markTourCompleted: (tourId, stepIndex) =>
    set((state) => {
      const completed = { ...state.completedTours, [tourId]: stepIndex };
      persistCompletedTours(completed);
      return { completedTours: completed };
    }),
});
