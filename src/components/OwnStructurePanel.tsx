import { useCallback, useRef, useState } from 'react';
import { useStructureLoader } from '../hooks/useStructureLoader';
import { useStore } from '../store';
import styles from './OwnStructurePanel.module.css';

/** Prominent entry point for loading a structure by RCSB ID or file upload */
export function OwnStructurePanel() {
  const [accession, setAccession] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { loadFromFile, fetchAndLoad } = useStructureLoader();
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);

  const handleFile = useCallback(
    async (file: File) => {
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

  const handleFetch = useCallback(() => {
    void fetchAndLoad(accession);
  }, [accession, fetchAndLoad]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && accession.length === 4 && !loading) {
      handleFetch();
    }
  };

  return (
    <section className={styles.panel} aria-label="Load your own structure">
      <h3 className={styles.heading}>Have your own structure?</h3>
      <p className={styles.hint}>Enter a 4-character RCSB accession code to fetch it directly.</p>

      <div className={styles.rcsbRow}>
        <label className={styles.rcsbLabel} htmlFor="rcsb-accession">
          RCSB ID
        </label>
        <input
          id="rcsb-accession"
          type="text"
          placeholder="e.g. 1CRN"
          value={accession}
          maxLength={4}
          onChange={(e) => setAccession(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          className={styles.rcsbInput}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          className={styles.loadBtn}
          onClick={handleFetch}
          disabled={loading || accession.length !== 4}
        >
          Load structure
        </button>
      </div>

      <div className={styles.divider}>
        <span>or upload a file</span>
      </div>

      <div
        className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <p className={styles.dropText}>Drop a PDB or mmCIF file here</p>
        <button
          type="button"
          className={styles.browseBtn}
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

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
