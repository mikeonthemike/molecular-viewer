import type { StateCreator } from 'zustand';
import type { StructureCategory } from '../parsers/types';

const RECENTLY_VIEWED_KEY = 'mv-recently-viewed';
const MAX_RECENT = 5;

export type LibraryCategoryFilter = StructureCategory | 'all';

function loadRecentlyViewed(): string[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function persistRecentlyViewed(ids: string[]): void {
  try {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids));
  } catch {
    // localStorage may be unavailable
  }
}

export interface LibrarySlice {
  activeCategory: LibraryCategoryFilter;
  searchQuery: string;
  recentlyViewed: string[];
  libraryExpanded: boolean;
  loadedLibraryId: string | null;
  setActiveCategory: (category: LibraryCategoryFilter) => void;
  setSearchQuery: (query: string) => void;
  setLibraryExpanded: (expanded: boolean) => void;
  addRecentlyViewed: (accession: string) => void;
  setLoadedLibraryId: (id: string | null) => void;
}

export const createLibrarySlice: StateCreator<LibrarySlice> = (set) => ({
  activeCategory: 'all',
  searchQuery: '',
  recentlyViewed: loadRecentlyViewed(),
  libraryExpanded: true,
  loadedLibraryId: null,

  setActiveCategory: (activeCategory) => set({ activeCategory }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setLibraryExpanded: (libraryExpanded) => set({ libraryExpanded }),

  addRecentlyViewed: (accession) =>
    set((state) => {
      const id = accession.trim().toUpperCase();
      const next = [id, ...state.recentlyViewed.filter((r) => r !== id)].slice(0, MAX_RECENT);
      persistRecentlyViewed(next);
      return { recentlyViewed: next };
    }),

  setLoadedLibraryId: (loadedLibraryId) => set({ loadedLibraryId }),
});
