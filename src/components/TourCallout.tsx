import type { TourStep } from '../parsers/types';
import styles from './TourCallout.module.css';

interface TourCalloutProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
}

export function TourCallout({ step, stepIndex, totalSteps }: TourCalloutProps) {
  return (
    <div className={styles.callout} role="status" aria-live="polite">
      <span className={styles.stepLabel}>
        Step {stepIndex + 1} of {totalSteps}
      </span>
      <h3 className={styles.title}>{step.title}</h3>
      <p className={styles.body}>{step.body}</p>
    </div>
  );
}
