import type { RefObject } from 'react';
import { getToursForStructure } from '../data/tours';
import type { MoleculeViewer } from '../renderers/MoleculeViewer';
import { useStore } from '../store';
import styles from './TourSelector.module.css';

interface TourSelectorProps {
  viewerRef: RefObject<MoleculeViewer | null>;
}

const AUDIENCE_LABELS: Record<string, string> = {
  general: 'General',
  undergraduate: 'Undergraduate',
  advanced: 'Advanced',
};

export function TourSelector({ viewerRef }: TourSelectorProps) {
  const loadedLibraryId = useStore((s) => s.loadedLibraryId);
  const activeTourId = useStore((s) => s.activeTourId);
  const completedTours = useStore((s) => s.completedTours);
  const representation = useStore((s) => s.representation);
  const colorScheme = useStore((s) => s.colorScheme);
  const visibleChains = useStore((s) => s.visibleChains);

  const startTour = useStore((s) => s.startTour);

  const structureId = loadedLibraryId ?? '';
  const tours = getToursForStructure(structureId);

  if (tours.length === 0 || activeTourId) return null;

  const handleStart = (tourId: string) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const camera = viewer.getCameraState();
    startTour(tourId, {
      representation,
      colorScheme,
      cameraPosition: camera.position,
      cameraTarget: camera.target,
      visibleChains: Array.from(visibleChains),
    });
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.heading}>Guided tours</h2>
      <ul className={styles.list}>
        {tours.map((tour) => {
          const completed = completedTours[tour.id] === tour.steps.length - 1;
          return (
            <li key={tour.id}>
              <button type="button" className={styles.tourBtn} onClick={() => handleStart(tour.id)}>
                <span className={styles.tourTitle}>
                  {tour.title}
                  {completed && <span className={styles.completedBadge}>Completed</span>}
                </span>
                <span className={styles.tourMeta}>
                  {AUDIENCE_LABELS[tour.audience] ?? tour.audience} · ~{tour.estimatedMinutes} min ·{' '}
                  {tour.steps.length} steps
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
