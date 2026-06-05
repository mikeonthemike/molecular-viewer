import { useEffect, useRef } from 'react';
import { MoleculeViewer } from '../renderers/MoleculeViewer';
import { useStore } from '../store';
import styles from './ViewerCanvas.module.css';

export function ViewerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<MoleculeViewer | null>(null);

  const data = useStore((s) => s.data);
  const structureVersion = useStore((s) => s.structureVersion);
  const representation = useStore((s) => s.representation);
  const colorScheme = useStore((s) => s.colorScheme);
  const showHydrogens = useStore((s) => s.showHydrogens);
  const visibleChains = useStore((s) => s.visibleChains);
  const measurements = useStore((s) => s.measurements);
  const selectAtom = useStore((s) => s.selectAtom);
  const addMeasurementPair = useStore((s) => s.addMeasurementPair);
  const clearMeasurements = useStore((s) => s.clearMeasurements);

  useEffect(() => {
    if (!canvasRef.current) return;
    const viewer = new MoleculeViewer(canvasRef.current);
    viewerRef.current = viewer;

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, []);

  // Load a new structure when the user opens a file or fetches from RCSB
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
  }, [structureVersion, data]);

  // Refresh bonds after worker completes without rebuilding the whole scene
  useEffect(() => {
    if (!data || structureVersion === 0) return;
    viewerRef.current?.refreshBonds(data.bonds);
  }, [data?.bonds, structureVersion]);

  useEffect(() => {
    viewerRef.current?.setRepresentation(representation);
  }, [representation]);

  useEffect(() => {
    viewerRef.current?.setColorScheme(colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    viewerRef.current?.setShowHydrogens(showHydrogens);
  }, [showHydrogens]);

  useEffect(() => {
    if (visibleChains.size > 0) {
      viewerRef.current?.setVisibleChains(visibleChains);
    }
  }, [visibleChains]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    viewer.clearMeasurements();
    for (const m of measurements) {
      viewer.addMeasurement(m.atomA, m.atomB);
    }
  }, [measurements]);

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
  }, [selectAtom, addMeasurementPair, clearMeasurements]);

  return (
    <div className={styles.container} data-testid="viewer-canvas">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
