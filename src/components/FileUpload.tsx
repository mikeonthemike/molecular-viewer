import { useCallback, useEffect, useRef, useState } from 'react';
import { processMoleculeInWorker } from '../engine/processMolecule';
import { parseMoleculeFile } from '../parsers/parseMoleculeFile';
import { fetchRCSBStructure } from '../parsers/mmCIFParser';
import { useStore } from '../store';
import styles from './FileUpload.module.css';

export function FileUpload() {
  const [accession, setAccession] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [loadedName, setLoadedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerCleanupRef = useRef<(() => void) | null>(null);

  const setData = useStore((s) => s.setData);
  const setLoading = useStore((s) => s.setLoading);
  const setError = useStore((s) => s.setError);
  const updateBonds = useStore((s) => s.updateBonds);
  const updateSecondaryStructure = useStore((s) => s.updateSecondaryStructure);
  const setVisibleChains = useStore((s) => s.setVisibleChains);
  const clearMeasurements = useStore((s) => s.clearMeasurements);
  const selectAtom = useStore((s) => s.selectAtom);

  useEffect(
    () => () => {
      workerCleanupRef.current?.();
    },
    [],
  );

  const loadMolecule = useCallback(
    (data: ReturnType<typeof parseMoleculeFile>, sourceName: string) => {
      workerCleanupRef.current?.();

      setLoading(true);
      setError(null);
      clearMeasurements();
      selectAtom(null);
      setLoadedName(sourceName);
      setVisibleChains(new Set(data.chains.map((c) => c.id)));
      setData(data);

      let pending = 3;
      workerCleanupRef.current = processMoleculeInWorker(data, (result) => {
        if (result.type === 'bonds') {
          updateBonds(result.bonds);
        } else if (result.type === 'secondaryStructure') {
          updateSecondaryStructure(result.residues);
        } else if (result.type === 'error') {
          setError(result.message);
        }

        pending -= 1;
        if (pending <= 0) setLoading(false);
      });
    },
    [
      setData,
      setLoading,
      setError,
      updateBonds,
      updateSecondaryStructure,
      setVisibleChains,
      clearMeasurements,
      selectAtom,
    ],
  );

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const data = parseMoleculeFile(file.name, text);
        loadMolecule(data, file.name);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to parse file';
        setError(message);
        setLoading(false);
      }
    },
    [loadMolecule, setError, setLoading],
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
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRCSBStructure(accession);
      loadMolecule(data, accession.toUpperCase());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fetch failed';
      setError(message);
      setLoading(false);
    }
  }, [accession, loadMolecule, setError, setLoading]);

  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const atomCount = useStore((s) => s.data?.atoms.length ?? 0);

  return (
    <div className={styles.wrapper}>
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
            // Allow re-selecting the same file
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
        <button type="button" onClick={() => void handleFetch()} disabled={loading || accession.length !== 4}>
          Fetch
        </button>
      </div>

      {loading && <p className={styles.status}>Processing structure…</p>}
      {!loading && loadedName && atomCount > 0 && (
        <p className={styles.status}>
          Loaded {loadedName} ({atomCount.toLocaleString()} atoms)
        </p>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
