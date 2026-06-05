import { useMemo } from 'react';
import { LIBRARY_ENTRIES, STRUCTURE_CATEGORIES } from '../data/library';
import { useStructureLoader } from '../hooks/useStructureLoader';
import type { LibraryEntry } from '../parsers/types';
import { useStore } from '../store';
import { filterLibraryEntries, isRcsbAccessionFallback } from '../utils/libraryFilter';
import { OwnStructurePanel } from './OwnStructurePanel';
import { SearchBar } from './SearchBar';
import { StructureCard } from './StructureCard';
import styles from './LibraryBrowser.module.css';

/** Full-page library view — shown on first load and when browsing for a different structure */
export function LibraryBrowser() {
  const activeCategory = useStore((s) => s.activeCategory);
  const searchQuery = useStore((s) => s.searchQuery);
  const loading = useStore((s) => s.loading);

  const setActiveCategory = useStore((s) => s.setActiveCategory);

  const { fetchAndLoad } = useStructureLoader();

  const filtered = useMemo(
    () => filterLibraryEntries(LIBRARY_ENTRIES, activeCategory, searchQuery),
    [activeCategory, searchQuery],
  );

  const showRcsbFallback = isRcsbAccessionFallback(searchQuery, filtered.length);

  const handleLoad = (entry: LibraryEntry) => {
    void fetchAndLoad(entry.accession, entry);
  };

  return (
    <section className={styles.browser} aria-label="Structure library">
      <div className={styles.content}>
        <OwnStructurePanel />

        <div className={styles.libraryDivider}>
          <span>or pick from the library</span>
        </div>

        <SearchBar
          showRcsbFallback={showRcsbFallback}
          fallbackAccession={searchQuery.trim()}
          onFetchAccession={(accession) => void fetchAndLoad(accession)}
        />

        <div className={styles.categories} role="tablist" aria-label="Filter by category">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'all'}
            className={activeCategory === 'all' ? styles.pillActive : styles.pill}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          {STRUCTURE_CATEGORIES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeCategory === id}
              className={activeCategory === id ? styles.pillActive : styles.pill}
              onClick={() => setActiveCategory(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className={styles.grid}>
            {filtered.map((entry) => (
              <StructureCard
                key={entry.id}
                entry={entry}
                onLoad={handleLoad}
                loading={loading}
              />
            ))}
          </div>
        ) : (
          !showRcsbFallback && <p className={styles.empty}>No structures match your search.</p>
        )}
      </div>
    </section>
  );
}
