import { useCallback, useState } from 'react';
import { parsePDB } from '../parsers/PDBParser';
import { fetchRCSBStructure, parseMMCIF } from '../parsers/mmCIFParser';
import { processMoleculeInWorker } from '../engine/processMolecule';
import { useStore } from '../store';
import styles from './FileUpload.module.css';

export function FileUpload() {
  const [accession, setAccession] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const setData = useStore((s) => s.setData);
  const setLoading = useStore((s) => s.setLoading);
  const setError = useStore((s) => s.setError);
  const updateBonds = useStore((s) => s.updateBonds);
  const updateSecondaryStructure = useStore((s) => s.updateSecondaryStructure);
  const setVisibleChains = useStore((s) => s.setVisibleChains);
  const clearMeasurements = useStore((s) => s.clearMeasurements);
  const selectAtom = useStore((s) => s.selectAtom);

  const loadMolecule = useCallback(
    (data: ReturnType<typeof parsePDB>) => {
      setLoading(true);
      setError(null);
      clearMeasurements();
      selectAtom(null);
      setData(data);
      setVisibleChains(new Set(data.chains.map((c) => c.id)));

      let pending = 3;
      const cleanup = processMoleculeInWorker(data, (result) => {
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

      return cleanup;
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
        const ext = file.name.split('.').pop()?.toLowerCase();

        let data;
        if (ext === 'pdb') {
          data = parsePDB(text);
        } else if (ext === 'cif') {
          data = parseMMCIF(text);
        } else {
          setError('Unsupported file type. Use .pdb or .cif files.');
          return;
        }

        loadMolecule(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to parse file';
        setError(message);
      }
    },
    [loadMolecule, setError],
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
      loadMolecule(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fetch failed';
      setError(message);
      setLoading(false);
    }
  }, [accession, loadMolecule, setError, setLoading]);

  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);

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
        <p>Drop a .pdb or .cif file here</p>
        <label className={styles.fileLabel}>
          Browse files
          <input
            type="file"
            accept=".pdb,.cif"
            className={styles.fileInput}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>
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
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
