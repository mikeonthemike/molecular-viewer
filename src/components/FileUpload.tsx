import { useCallback, useEffect, useRef, useState } from 'react';
import { useStructureLoader } from '../hooks/useStructureLoader';
import { useStore } from '../store';
import styles from './FileUpload.module.css';

interface FileUploadProps {
  /** Compact layout for embedding inside the library browser */
  compact?: boolean;
}

export function FileUpload({ compact = false }: FileUploadProps) {
  const [accession, setAccession] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [loadedName, setLoadedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { loadFromFile, fetchAndLoad } = useStructureLoader();

  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const atomCount = useStore((s) => s.data?.atoms.length ?? 0);
  const structureVersion = useStore((s) => s.structureVersion);
  const loadedLibraryId = useStore((s) => s.loadedLibraryId);

  useEffect(() => {
    if (structureVersion > 0 && loadedLibraryId) {
      setLoadedName(loadedLibraryId);
    }
  }, [structureVersion, loadedLibraryId]);

  const handleFile = useCallback(
    async (file: File) => {
      setLoadedName(file.name);
      await loadFromFile(file);
    },
    [loadFromFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleFetch = useCallback(async () => {
    setLoadedName(accession.toUpperCase());
    await fetchAndLoad(accession);
  }, [accession, fetchAndLoad]);

  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ''}`}>
      <div
        className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <p>Drop a PDB or mmCIF file here</p>
        <button
          type="button"
          className={styles.fileLabel}
          onClick={() => fileInputRef.current?.click()}
        >
          Browse files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdb,.ent,.cif,.mmcif"
          className={styles.fileInput}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
      </div>

      <div className={styles.fetchRow}>
        <input
          type="text"
          placeholder="RCSB ID (e.g. 1CRN)"
          value={accession}
          maxLength={4}
          onChange={(e) => setAccession(e.target.value.toUpperCase())}
          className={styles.accessionInput}
        />
        <button
          type="button"
          onClick={() => void handleFetch()}
          disabled={loading || accession.length !== 4}
        >
          Fetch
        </button>
      </div>

      {!compact && loading && <p className={styles.status}>Processing structure…</p>}
      {!compact && !loading && loadedName && atomCount > 0 && (
        <p className={styles.status}>
          Loaded {loadedName} ({atomCount.toLocaleString()} atoms)
        </p>
      )}
      {!compact && error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
