import { useStore } from '../store';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onFetchAccession?: (accession: string) => void;
  showRcsbFallback?: boolean;
  fallbackAccession?: string;
}

export function SearchBar({
  onFetchAccession,
  showRcsbFallback = false,
  fallbackAccession,
}: SearchBarProps) {
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const loading = useStore((s) => s.loading);

  return (
    <div className={styles.wrapper}>
      <input
        type="search"
        placeholder="Search the library by name or tag…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={styles.input}
        aria-label="Search structures"
      />
      {showRcsbFallback && fallbackAccession && onFetchAccession && (
        <button
          type="button"
          className={styles.fallbackBtn}
          disabled={loading}
          onClick={() => onFetchAccession(fallbackAccession)}
        >
          Fetch {fallbackAccession.toUpperCase()} from RCSB
        </button>
      )}
    </div>
  );
}
