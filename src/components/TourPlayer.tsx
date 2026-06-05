import { useCallback, useEffect, useTransition } from 'react';
import { getTourById } from '../data/tours';
import { useStore } from '../store';
import styles from './TourPlayer.module.css';

export function TourPlayer() {
  const [isPending, startTransition] = useTransition();

  const activeTourId = useStore((s) => s.activeTourId);
  const currentStepIndex = useStore((s) => s.currentStepIndex);
  const embedMode = useStore((s) => s.embedMode);

  const nextStep = useStore((s) => s.nextStep);
  const prevStep = useStore((s) => s.prevStep);
  const exitTour = useStore((s) => s.exitTour);
  const markTourCompleted = useStore((s) => s.markTourCompleted);
  const setRepresentation = useStore((s) => s.setRepresentation);
  const setColorScheme = useStore((s) => s.setColorScheme);
  const setVisibleChains = useStore((s) => s.setVisibleChains);

  const tour = activeTourId ? getTourById(activeTourId) : undefined;

  const handleExit = useCallback(() => {
    const restored = exitTour();
    if (restored) {
      startTransition(() => {
        setRepresentation(restored.representation);
        setColorScheme(restored.colorScheme);
        setVisibleChains(new Set(restored.visibleChains));
      });
    }
  }, [exitTour, setRepresentation, setColorScheme, setVisibleChains, startTransition]);

  const handleNext = useCallback(() => {
    if (!tour) return;
    const isLast = currentStepIndex >= tour.steps.length - 1;
    if (isLast) {
      markTourCompleted(tour.id, currentStepIndex);
      if (!embedMode) handleExit();
      return;
    }
    startTransition(() => nextStep(tour.steps.length - 1));
  }, [tour, currentStepIndex, nextStep, markTourCompleted, embedMode, handleExit, startTransition]);

  const handlePrev = useCallback(() => {
    startTransition(() => prevStep());
  }, [prevStep, startTransition]);

  useEffect(() => {
    if (!activeTourId || !tour) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape' && !embedMode) {
        handleExit();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTourId, tour, handleNext, handlePrev, handleExit, embedMode]);

  if (!tour) return null;

  const total = tour.steps.length;
  const progress = ((currentStepIndex + 1) / total) * 100;
  const isLast = currentStepIndex >= total - 1;

  return (
    <div className={`${styles.player} ${isPending ? styles.pending : ''}`} role="toolbar" aria-label="Tour navigation">
      <button
        type="button"
        className={styles.navBtn}
        onClick={handlePrev}
        disabled={currentStepIndex === 0}
        aria-label="Previous step"
      >
        ◀ Prev
      </button>

      <div className={styles.progressWrap}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        <span className={styles.progressText}>
          {currentStepIndex + 1} / {total}
        </span>
      </div>

      <button type="button" className={styles.navBtn} onClick={handleNext} aria-label={isLast ? 'Finish tour' : 'Next step'}>
        {isLast ? 'Finish' : 'Next ▶'}
      </button>

      {!embedMode && (
        <button type="button" className={styles.exitBtn} onClick={handleExit}>
          Exit tour
        </button>
      )}
    </div>
  );
}
