import { STRUCTURE_CATEGORIES } from '../data/library';
import { structureHasTour } from '../data/tours';
import type { LibraryEntry } from '../parsers/types';
import styles from './StructureCard.module.css';

interface StructureCardProps {
  entry: LibraryEntry;
  onLoad: (entry: LibraryEntry) => void;
  loading: boolean;
}

function categoryLabel(category: LibraryEntry['category']): string {
  return STRUCTURE_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}

export function StructureCard({ entry, onLoad, loading }: StructureCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.name}>{entry.name}</h3>
        <span className={styles.accession}>{entry.accession}</span>
      </div>
      <p className={styles.organism}>{entry.organism}</p>
      <div className={styles.meta}>
        <span className={styles.badge}>{categoryLabel(entry.category)}</span>
        {structureHasTour(entry.id) && (
          <span className={styles.tourBadge}>Guided tour</span>
        )}
        <span className={styles.atomCount}>{entry.atomCount.toLocaleString()} atoms</span>
      </div>
      <p className={styles.description}>{entry.description}</p>
      <div className={styles.tags}>
        {entry.tags.map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
          </span>
        ))}
      </div>
      <button
        type="button"
        className={styles.loadBtn}
        disabled={loading}
        onClick={() => onLoad(entry)}
      >
        Load
      </button>
    </article>
  );
}
