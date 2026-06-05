import { useRef } from 'react';
import { AppHeader } from './components/AppHeader';
import { ControlsPanel } from './components/ControlsPanel';
import { LibraryBrowser } from './components/LibraryBrowser';
import { MeasureOverlay } from './components/MeasureOverlay';
import { SelectionInfo } from './components/SelectionInfo';
import { TourCallout } from './components/TourCallout';
import { TourPlayer } from './components/TourPlayer';
import { ViewerCanvas } from './components/ViewerCanvas';
import { getTourById } from './data/tours';
import { useEmbedBoot } from './hooks/useEmbedBoot';
import type { MoleculeViewer } from './renderers/MoleculeViewer';
import { useStore } from './store';
import styles from './App.module.css';

export function App() {
  const viewerRef = useRef<MoleculeViewer | null>(null);

  const data = useStore((s) => s.data);
  const libraryExpanded = useStore((s) => s.libraryExpanded);
  const embedMode = useStore((s) => s.embedMode);
  const activeTourId = useStore((s) => s.activeTourId);
  const currentStepIndex = useStore((s) => s.currentStepIndex);

  useEmbedBoot();

  const showLibrary = !embedMode && (data === null || libraryExpanded);
  const tour = activeTourId ? getTourById(activeTourId) : undefined;
  const tourStep = tour?.steps[currentStepIndex];

  const viewerContent = (
    <div className={styles.viewerArea}>
      <ViewerCanvas viewerRef={viewerRef} />
      {tourStep && tour && (
        <TourCallout
          step={tourStep}
          stepIndex={currentStepIndex}
          totalSteps={tour.steps.length}
        />
      )}
      {activeTourId && <TourPlayer />}
      <MeasureOverlay />
    </div>
  );

  if (embedMode) {
    return <div className={styles.app}>{viewerContent}</div>;
  }

  return (
    <div className={styles.app}>
      <AppHeader mode={showLibrary ? 'library' : 'viewer'} />

      {showLibrary ? (
        <LibraryBrowser />
      ) : (
        <>
          <div className={styles.main}>
            <ControlsPanel viewerRef={viewerRef} />
            {viewerContent}
          </div>
          <SelectionInfo />
        </>
      )}
    </div>
  );
}
