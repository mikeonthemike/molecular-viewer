import { useEffect, useRef, type RefObject } from 'react';
import { getTourById } from '../data/tours';
import { MoleculeViewer } from '../renderers/MoleculeViewer';
import { useStore } from '../store';
import { applyTourStep } from '../utils/applyTourStep';
import styles from './ViewerCanvas.module.css';

interface ViewerCanvasProps {
  viewerRef?: RefObject<MoleculeViewer | null>;
}

export function ViewerCanvas({ viewerRef: externalViewerRef }: ViewerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const internalViewerRef = useRef<MoleculeViewer | null>(null);
  const viewerRef = externalViewerRef ?? internalViewerRef;

  const data = useStore((s) => s.data);
  const loading = useStore((s) => s.loading);
  const structureVersion = useStore((s) => s.structureVersion);
  const representation = useStore((s) => s.representation);
  const colorScheme = useStore((s) => s.colorScheme);
  const showHydrogens = useStore((s) => s.showHydrogens);
  const visibleChains = useStore((s) => s.visibleChains);
  const measurements = useStore((s) => s.measurements);
  const activeTourId = useStore((s) => s.activeTourId);
  const currentStepIndex = useStore((s) => s.currentStepIndex);
  const restoredViewerState = useStore((s) => s.restoredViewerState);

  const setRepresentation = useStore((s) => s.setRepresentation);
  const setColorScheme = useStore((s) => s.setColorScheme);
  const setVisibleChains = useStore((s) => s.setVisibleChains);
  const selectAtom = useStore((s) => s.selectAtom);
  const addMeasurementPair = useStore((s) => s.addMeasurementPair);
  const clearMeasurements = useStore((s) => s.clearMeasurements);
  const clearRestoredViewerState = useStore((s) => s.clearRestoredViewerState);

  useEffect(() => {
    if (!canvasRef.current) return;
    const viewer = new MoleculeViewer(canvasRef.current);
    viewerRef.current = viewer;

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, [viewerRef]);

  useEffect(() => {
    if (!data || structureVersion === 0) return;

    const applyLoad = () => {
      if (!viewerRef.current) return false;
      viewerRef.current.load(data);
      return true;
    };

    if (!applyLoad()) {
      const frame = requestAnimationFrame(() => {
        applyLoad();
      });
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [structureVersion, data, viewerRef]);

  useEffect(() => {
    if (!data || structureVersion === 0) return;
    viewerRef.current?.refreshBonds(data.bonds);
  }, [data?.bonds, structureVersion, viewerRef]);

  useEffect(() => {
    viewerRef.current?.setRepresentation(representation);
  }, [representation, viewerRef]);

  useEffect(() => {
    viewerRef.current?.setColorScheme(colorScheme);
  }, [colorScheme, viewerRef]);

  useEffect(() => {
    viewerRef.current?.setShowHydrogens(showHydrogens);
  }, [showHydrogens, viewerRef]);

  useEffect(() => {
    if (visibleChains.size > 0) {
      viewerRef.current?.setVisibleChains(visibleChains);
    }
  }, [visibleChains, viewerRef]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    viewer.clearMeasurements();
    for (const m of measurements) {
      viewer.addMeasurement(m.atomA, m.atomB);
    }
  }, [measurements, viewerRef]);

  // Apply tour step when active tour or step index changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !data || !activeTourId) return;

    const tour = getTourById(activeTourId);
    const step = tour?.steps[currentStepIndex];
    if (!step) return;

    let cancelled = false;
    void applyTourStep(viewer, step, data, setRepresentation, setColorScheme, setVisibleChains).then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [
    activeTourId,
    currentStepIndex,
    data,
    structureVersion,
    setRepresentation,
    setColorScheme,
    setVisibleChains,
    viewerRef,
  ]);

  useEffect(() => {
    if (!activeTourId) {
      viewerRef.current?.clearHighlights();
    }
  }, [activeTourId, viewerRef]);

  // Restore pre-tour camera after exit
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !restoredViewerState) return;

    void viewer
      .animateCameraTo(restoredViewerState.cameraPosition, restoredViewerState.cameraTarget)
      .then(() => clearRestoredViewerState());
  }, [restoredViewerState, clearRestoredViewerState, viewerRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const viewer = viewerRef.current;
    if (!canvas || !viewer) return;

    let clickTimer: ReturnType<typeof setTimeout> | null = null;

    const handleClick = (clientX: number, clientY: number, isDouble: boolean) => {
      const atom = viewer.pickAtom(clientX, clientY);
      if (atom) {
        if (isDouble) {
          addMeasurementPair(atom);
        } else {
          selectAtom(atom);
        }
      } else if (isDouble) {
        clearMeasurements();
      } else {
        selectAtom(null);
      }
    };

    const onClick = (e: MouseEvent) => {
      if (e.detail === 2) return;
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        handleClick(e.clientX, e.clientY, false);
      }, 250);
    };

    const onDblClick = (e: MouseEvent) => {
      if (clickTimer) clearTimeout(clickTimer);
      handleClick(e.clientX, e.clientY, true);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length > 0 || e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0]!;
      handleClick(touch.clientX, touch.clientY, false);
    };

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('dblclick', onDblClick);
    canvas.addEventListener('touchend', onTouchEnd);

    return () => {
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('dblclick', onDblClick);
      canvas.removeEventListener('touchend', onTouchEnd);
      if (clickTimer) clearTimeout(clickTimer);
    };
  }, [selectAtom, addMeasurementPair, clearMeasurements, viewerRef]);

  return (
    <div className={styles.container} data-testid="viewer-canvas">
      <canvas ref={canvasRef} className={styles.canvas} />
      {loading && (
        <div className={styles.loadingOverlay} aria-live="polite" aria-busy="true">
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading structure…</p>
        </div>
      )}
    </div>
  );
}
