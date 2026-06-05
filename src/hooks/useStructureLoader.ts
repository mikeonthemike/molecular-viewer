import { useCallback } from 'react';
import { processMoleculeInWorker } from '../engine/processMolecule';
import { parseMoleculeFile } from '../parsers/parseMoleculeFile';
import type { LibraryEntry, MoleculeData } from '../parsers/types';
import { useStore } from '../store';
import { getPolymerChainIds } from '../utils/polymerChains';
import { fetchRCSBStructureCached } from '../utils/rcsbCache';

// Shared across all hook consumers so library and file upload do not leak workers
let workerCleanup: (() => void) | null = null;

export function useStructureLoader() {

  const setData = useStore((s) => s.setData);
  const setLoading = useStore((s) => s.setLoading);
  const setError = useStore((s) => s.setError);
  const updateBonds = useStore((s) => s.updateBonds);
  const updateSecondaryStructure = useStore((s) => s.updateSecondaryStructure);
  const setVisibleChains = useStore((s) => s.setVisibleChains);
  const setRepresentation = useStore((s) => s.setRepresentation);
  const setColorScheme = useStore((s) => s.setColorScheme);
  const clearMeasurements = useStore((s) => s.clearMeasurements);
  const selectAtom = useStore((s) => s.selectAtom);
  const addRecentlyViewed = useStore((s) => s.addRecentlyViewed);
  const setLoadedLibraryId = useStore((s) => s.setLoadedLibraryId);
  const setLibraryExpanded = useStore((s) => s.setLibraryExpanded);
  const exitTour = useStore((s) => s.exitTour);

  const loadMolecule = useCallback(
    (data: MoleculeData, sourceName: string, entry?: LibraryEntry) => {
      workerCleanup?.();

      if (useStore.getState().activeTourId) {
        exitTour();
      }

      setLoading(true);
      setError(null);
      clearMeasurements();
      selectAtom(null);
      const polymerIds = getPolymerChainIds(data);
      setVisibleChains(
        new Set(polymerIds.length > 0 ? polymerIds : data.chains.map((c) => c.id)),
      );
      setData(data);

      if (entry) {
        setRepresentation(entry.defaultRepresentation);
        setColorScheme(entry.defaultColorScheme);
      }
      // Track accession so guided tours can match the loaded structure
      const accession = entry?.id ?? sourceName.trim().toUpperCase();
      setLoadedLibraryId(/^[A-Z0-9]{4}$/.test(accession) ? accession : null);

      setLibraryExpanded(false);
      addRecentlyViewed(sourceName);

      let pending = 3;
      workerCleanup = processMoleculeInWorker(data, (result) => {
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
      setRepresentation,
      setColorScheme,
      clearMeasurements,
      selectAtom,
      addRecentlyViewed,
      setLoadedLibraryId,
      setLibraryExpanded,
      exitTour,
    ],
  );

  const loadFromFile = useCallback(
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

  const fetchAndLoad = useCallback(
    async (accession: string, entry?: LibraryEntry) => {
      try {
        setLoading(true);
        setError(null);
        const id = accession.trim().toUpperCase();
        const data = await fetchRCSBStructureCached(id);
        loadMolecule(data, id, entry);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Fetch failed';
        setError(message);
        setLoading(false);
      }
    },
    [loadMolecule, setError, setLoading],
  );

  return { loadMolecule, loadFromFile, fetchAndLoad };
}
