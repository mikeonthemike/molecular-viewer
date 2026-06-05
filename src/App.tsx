import { AppHeader } from './components/AppHeader';
import { ControlsPanel } from './components/ControlsPanel';
import { LibraryBrowser } from './components/LibraryBrowser';
import { MeasureOverlay } from './components/MeasureOverlay';
import { SelectionInfo } from './components/SelectionInfo';
import { ViewerCanvas } from './components/ViewerCanvas';
import { useStore } from './store';
import styles from './App.module.css';

export function App() {
  const data = useStore((s) => s.data);
  const libraryExpanded = useStore((s) => s.libraryExpanded);

  // Library mode: first load, or user chose to browse for a different structure
  const showLibrary = data === null || libraryExpanded;

  return (
    <div className={styles.app}>
      <AppHeader mode={showLibrary ? 'library' : 'viewer'} />

      {showLibrary ? (
        <LibraryBrowser />
      ) : (
        <>
          <div className={styles.main}>
            <ControlsPanel />
            <div className={styles.viewerArea}>
              <ViewerCanvas />
              <MeasureOverlay />
            </div>
          </div>
          <SelectionInfo />
        </>
      )}
    </div>
  );
}
