import { getLibraryEntry } from '../data/library';
import { useStructureLoader } from '../hooks/useStructureLoader';
import { useStore } from '../store';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  mode: 'library' | 'viewer';
}

export function AppHeader({ mode }: AppHeaderProps) {
  const loadedLibraryId = useStore((s) => s.loadedLibraryId);
  const recentlyViewed = useStore((s) => s.recentlyViewed);
  const loading = useStore((s) => s.loading);
  const data = useStore((s) => s.data);

  const setLibraryExpanded = useStore((s) => s.setLibraryExpanded);
  const { fetchAndLoad } = useStructureLoader();

  const loadedEntry = loadedLibraryId ? getLibraryEntry(loadedLibraryId) : undefined;
  const hasStructure = data !== null;

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <h1 className={styles.title}>Molecular Viewer</h1>
        {mode === 'library' && (
          <p className={styles.subtitle}>Choose a structure to explore</p>
        )}
        {mode === 'viewer' && loadedEntry && (
          <p className={styles.subtitle}>
            {loadedEntry.name}
            <span className={styles.accession}>{loadedEntry.accession}</span>
          </p>
        )}
        {mode === 'viewer' && !loadedEntry && loadedLibraryId && (
          <p className={styles.subtitle}>
            <span className={styles.accession}>{loadedLibraryId}</span>
          </p>
        )}
      </div>

      <div className={styles.actions}>
        {mode === 'library' && hasStructure && (
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setLibraryExpanded(false)}
          >
            Back to viewer
          </button>
        )}

        {mode === 'viewer' && (
          <>
            {recentlyViewed.length > 0 && (
              <div className={styles.recentRow}>
                {recentlyViewed.map((id) => {
                  const entry = getLibraryEntry(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className={styles.recentBtn}
                      disabled={loading}
                      onClick={() => void fetchAndLoad(id, entry)}
                    >
                      {entry?.name ?? id}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => setLibraryExpanded(true)}
            >
              Browse library
            </button>
          </>
        )}
      </div>
    </header>
  );
}
