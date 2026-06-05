import { useEffect, useRef } from 'react';
import { getLibraryEntry } from '../data/library';
import { getTourById } from '../data/tours';
import { useStructureLoader } from './useStructureLoader';
import { useStore } from '../store';
import { parseEmbedParams } from '../utils/embedUrl';

/** Boot embed mode from URL params: load structure and auto-start tour */
export function useEmbedBoot() {
  const booted = useRef(false);
  const { fetchAndLoad } = useStructureLoader();

  const data = useStore((s) => s.data);
  const loading = useStore((s) => s.loading);
  const pendingEmbedTourId = useStore((s) => s.pendingEmbedTourId);
  const representation = useStore((s) => s.representation);
  const colorScheme = useStore((s) => s.colorScheme);

  const setEmbedMode = useStore((s) => s.setEmbedMode);
  const setPendingEmbedTourId = useStore((s) => s.setPendingEmbedTourId);
  const setLibraryExpanded = useStore((s) => s.setLibraryExpanded);
  const startTour = useStore((s) => s.startTour);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    const params = parseEmbedParams();
    if (!params.embed) return;

    setEmbedMode(true);
    setLibraryExpanded(false);

    const tour = params.tourId ? getTourById(params.tourId) : undefined;
    const structureId = params.structureId ?? tour?.structureId;

    if (tour) {
      setPendingEmbedTourId(tour.id);
    }

    if (structureId) {
      const entry = getLibraryEntry(structureId);
      void fetchAndLoad(structureId, entry);
    }
  }, [fetchAndLoad, setEmbedMode, setLibraryExpanded, setPendingEmbedTourId]);

  useEffect(() => {
    if (!pendingEmbedTourId || loading || !data) return;

    const tour = getTourById(pendingEmbedTourId);
    if (!tour) {
      setPendingEmbedTourId(null);
      return;
    }

    const polymerIds = data.chains
      .filter((c) => c.residues.length > 1)
      .map((c) => c.id);
    startTour(pendingEmbedTourId, {
      representation,
      colorScheme,
      cameraPosition: [0, 0, 0],
      cameraTarget: [0, 0, 0],
      visibleChains: polymerIds.length > 0 ? polymerIds : ['A', 'B'],
    });
    setPendingEmbedTourId(null);
  }, [
    pendingEmbedTourId,
    loading,
    data,
    representation,
    colorScheme,
    startTour,
    setPendingEmbedTourId,
  ]);
}
