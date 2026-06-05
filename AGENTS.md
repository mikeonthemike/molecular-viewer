# Molecular Viewer — Agent Guide

Browser-based 3D molecular structure viewer: React 19, Three.js r168, Zustand 5, TypeScript (strict), Vite 6, Vitest.

Use this document when editing, reviewing, or extending the codebase. Prefer small, focused changes that match existing patterns.

## Quick reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server (http://localhost:5173) |
| `npm run build` | Typecheck (`tsc --noEmit`) + production bundle |
| `npm run test` | Vitest unit tests (run before finishing work) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint (requires `eslint-plugin-react` — see Known issues) |
| `npm run format` | Prettier on `src/` and `tests/` |
| `npm run validate-tours` | Tour validation against live RCSB fetches |
| `npm run inspect-structure -- <ID>` | Tour authoring: chain inventory + suggested metadata |

**Version:** Bump `version` in `package.json` when shipping functional changes.

**Docs:** `README.md` (overview), `molecular_viewer_tech_spec.html` (spec), `docs/todo.md` (backlog), `docs/molecular_viewer_full_roadmap_specs.html` (roadmap).

---

## Architecture

Data flows in one direction: **parse → store → worker enrichment → Three.js render**.

```
FileUpload / RCSB fetch
    → parseMoleculeFile() / fetchRCSBStructure()
    → Zustand setData() (+ structureVersion++)
    → processMoleculeInWorker()  (bonds, secondary structure, spatial index)
    → updateBonds() / updateSecondaryStructure()
    → ViewerCanvas effects → MoleculeViewer
```

### Layer responsibilities

| Layer | Path | Role |
|-------|------|------|
| **Parsers** | `src/parsers/` | PDB/mmCIF → `MoleculeData`. Shared types in `types.ts`. |
| **Engine** | `src/engine/` | Bond calculation, secondary-structure analysis, spatial index. Heavy work in `moleculeWorker.ts`. |
| **Renderers** | `src/renderers/` | Three.js scene (`MoleculeViewer` orchestrates `AtomRenderer`, `BondRenderer`, `RibbonRenderer`, `SurfaceRenderer`). |
| **Components** | `src/components/` | React UI; bridge store state to `MoleculeViewer` via effects. |
| **Store** | `src/store/` | Zustand slices: `moleculeSlice`, `viewerSlice`, `selectionSlice`. Composed in `index.ts`. |
| **Utils** | `src/utils/` | Constants (VDW radii, bond thresholds, RCSB URL), color schemes, geometry helpers. |

### Core types (`src/parsers/types.ts`)

- `Atom`, `Bond`, `Residue`, `Chain`, `MoleculeData` — canonical structure model.
- `RepresentationMode`, `ColorScheme` — viewer display enums.
- `MoleculeTask` / `MoleculeResult` — worker message contracts.

Do not duplicate these shapes elsewhere; extend `types.ts` when adding fields.

---

## Conventions

### TypeScript

- **Strict mode** with `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`.
- Path alias: `@/` → `src/` (configured in `tsconfig.json` and `vite.config.ts`).
- Prefer explicit types on public APIs; let inference handle locals.
- Prefix intentionally unused parameters with `_` (ESLint allows this).

### React

- **StrictMode is enabled** (`src/main.tsx`). Async initialization (e.g. `MoleculeViewer.initRenderer`) must guard against mount/unmount/remount races — see `initGeneration` and `disposed` in `MoleculeViewer.ts`.
- Functional components only; hooks for lifecycle and store subscriptions.
- **CSS Modules** for component styles (`ComponentName.module.css`). Global styles live in `src/index.css`.
- Select store slices narrowly: `useStore((s) => s.representation)` — avoid subscribing to the whole store.

### Zustand

- One slice per concern; add new state via a new slice or extend the appropriate existing slice.
- `structureVersion` increments on every new structure load — `ViewerCanvas` depends on this (not just `data` reference equality) to detect fresh files.
- Immutable updates: spread nested objects (`data: { ...state.data, bonds }`).
- `visibleChains` is a `Set<string>` — clone before mutating (`new Set(state.visibleChains)`).

### Three.js / rendering

- Single Three.js instance: use `THREE.WebGLRenderer` only. Do **not** import `three/webgpu` (causes duplicate Three bundles; see comment in `MoleculeViewer.ts`).
- `MoleculeViewer` owns the scene loop, resize observer, raycasting, and disposal. Sub-renderers build geometry; they do not manage the canvas.
- On structure load: `load()` rebuilds the scene. Bond updates from the worker use `refreshBonds()` to avoid full rebuilds.
- Centre coordinates on load (`coordinateCenter`) so large PDB offsets do not break the camera.

### Web Worker

- Worker entry: `src/engine/moleculeWorker.ts`, spawned from `processMolecule.ts` via Vite module workers (`worker: { format: 'es' }` in Vite config).
- **Always clean up** worker listeners when loading a new structure (`workerCleanupRef` in `FileUpload.tsx`).
- Keep worker messages typed with `MoleculeTask` / `MoleculeResult`. Post separate messages per result type (bonds, secondaryStructure, spatialIndex).

### Parsers

- Entry point: `parseMoleculeFile(filename, text)` — format detection, validation, helpful errors.
- Structure-factor CIFs (`-sf.cif`, `_refln` without `_atom_site`) must continue to surface actionable errors (see `isStructureFactorFile`).
- RCSB fetch: `fetchRCSBStructure()` in `mmCIFParser.ts`; URL template in `RCSB_CIF_URL` constant.
- Parsers are synchronous and pure — no store or DOM access.

### Formatting

Prettier: single quotes, semicolons, trailing commas, `printWidth: 100`.

---

## Testing

Tests live in `tests/` (not co-located). Vitest + jsdom; globals enabled.

| Area | What to test | Example |
|------|--------------|---------|
| Parsers | Atom counts, coordinates, edge cases | `PDBParser.test.ts`, `mmCIFParser.test.ts` |
| File routing | Format detection, SF-file errors | `parseMoleculeFile.test.ts` |
| Engine | Bond inference, geometry | `BondCalculator.test.ts` |
| Utils | Color mapping, ranges | `colorSchemes.test.ts` |
| Store | Slice actions and immutability | `store.test.ts` |
| Components | Mount/dispose; mock heavy deps | `ViewerCanvas.test.tsx` mocks `MoleculeViewer` |

**Fixtures:** Use `?raw` imports for sample files (`tests/fixtures/sample.pdb?raw`).

**Guidelines:**

- Add tests for new parser fields, algorithms, and store actions.
- Mock `MoleculeViewer` (and WebGL/Worker) in component tests — do not require a real GPU.
- Prefer deterministic inputs (inline CIF snippets, small PDB fixtures).
- Run `npm run test` after changes; all 18 tests should pass.

---

## Common edit scenarios

### Add a representation or color scheme

1. Extend `RepresentationMode` or `ColorScheme` in `types.ts`.
2. Implement rendering in the appropriate renderer (`AtomRenderer`, `RibbonRenderer`, etc.).
3. Wire `MoleculeViewer.setRepresentation()` / `setColorScheme()`.
4. Add UI control in `ControlsPanel.tsx`.
5. Add defaults in `viewerSlice.ts` if needed.
6. Test color logic in `colorSchemes.test.ts` if applicable.

### Add a parser field (e.g. new mmCIF column)

1. Extend `Atom` or related type in `types.ts`.
2. Parse in `PDBParser.ts` and/or `mmCIFParser.ts`.
3. Thread through to renderers or store only if the UI needs it.
4. Add parser tests with fixture data.

### Add UI state

1. Decide which slice owns it (molecule vs viewer vs selection).
2. Add action + selector; subscribe in the component that needs it.
3. If it affects the canvas, add a `useEffect` in `ViewerCanvas.tsx` calling the matching `MoleculeViewer` method.
4. Extend `store.test.ts`.

### Add or edit a guided tour

1. Run `npm run inspect-structure -- <ACCESSION>` — prints polymer vs ligand chains, center/radius, and suggested `expectedPolymerChainCount`, `assemblyContext`, and `visibleChains` (see `src/utils/tourAuthoringReport.ts`, CLI in `scripts/inspect-structure.ts`).
2. Add or update the tour in `src/data/tours.ts`. Set `visibleChains` on **every** step to polymer chain IDs only so ligand asym units do not appear in the chain list.
3. Author camera scales in the running viewer via `MoleculeViewer.logCameraState()` (exposed on the viewer ref in DevTools).
4. Run `npm run validate-tours` — uses `src/utils/validateTour.ts` and live RCSB fetches; fix any reported issues before shipping.
5. Bump `package.json` version when shipping tour changes.

### Performance-sensitive work

- Run off the main thread (extend `moleculeWorker.ts` or add a dedicated worker).
- Avoid blocking `FileUpload` or `ViewerCanvas` during parse — parsing is sync today but keep files small; worker handles bonds/SS.
- For future electron-density / FFT work (see `docs/todo.md`), use workers and cache per structure.

---

## Quality checklist (before finishing)

- [ ] `npm run build` succeeds (catches type errors).
- [ ] `npm run test` passes.
- [ ] No unused imports or locals (TypeScript strict + ESLint).
- [ ] Worker listeners cleaned up on re-load.
- [ ] `MoleculeViewer.dispose()` called on unmount; no leaked `requestAnimationFrame` or `ResizeObserver`.
- [ ] User-facing errors are clear strings (not raw thrown objects).
- [ ] Visual changes preserve existing layout unless explicitly requested.
- [ ] `package.json` version incremented for functional changes.

---

## Pitfalls to avoid

1. **StrictMode double-mount** — Any async init in `MoleculeViewer` must check `disposed` / `initGeneration`.
2. **Reloading on bond updates** — Use `refreshBonds()`, not `load()`, when only bonds change after the worker.
3. **Stale structure detection** — Bump `structureVersion` in `setData`, not only mutate `data`.
4. **Duplicate Three.js** — Never mix `three` and `three/webgpu` imports.
5. **Mutating Zustand state** — Especially `Set` and nested `chains` arrays.
6. **Parser side effects** — Keep parsers pure; network fetch stays in `mmCIFParser.fetchRCSBStructure`.
7. **Scope creep** — This is a client-only viewer; no backend. Check `docs/todo.md` before building roadmap features unprompted.

---

## Known issues

- `npm run lint` fails: `eslint.config.js` imports `eslint-plugin-react` but it is not listed in `package.json` devDependencies. Add it before relying on lint in CI.
- README mentions WebGPU enhancement; current renderer uses WebGL2 only.

---

## Planned work (do not implement unless asked)

Tracked in `docs/todo.md` and `docs/molecular_viewer_full_roadmap_specs.html`:

- Structure-factor CIFs → electron density maps (FFT, isosurfaces, worker, caching).
- Secondary-structure display modes (helix/sheet emphasis).
- Molecule information panel and external data sources.
- Structure search / curated library (Phase 1 roadmap).
- Right panel scroll sync with main canvas.

When implementing roadmap items, read the relevant spec section first and add tests for any new parsing or numerical code.

---

## File map (high-traffic)

```
src/
  App.tsx                 # Layout shell
  components/
    FileUpload.tsx        # Drop, browse, RCSB fetch, worker kickoff
    ViewerCanvas.tsx      # Canvas + store → MoleculeViewer bridge
    ControlsPanel.tsx     # Representation, colors, chains, export
    SelectionInfo.tsx     # Selected atom details
    MeasureOverlay.tsx    # Distance measurement UI
  parsers/
    parseMoleculeFile.ts  # Format detection + entry
    PDBParser.ts / mmCIFParser.ts
    types.ts
  engine/
    processMolecule.ts    # Worker facade
    moleculeWorker.ts
    BondCalculator.ts / StructureAnalyser.ts / SpatialIndex.ts
  renderers/
    MoleculeViewer.ts     # Scene orchestrator
    AtomRenderer.ts / BondRenderer.ts / RibbonRenderer.ts / SurfaceRenderer.ts
  store/
    moleculeSlice.ts / viewerSlice.ts / selectionSlice.ts / index.ts
  utils/
    constants.ts / colorSchemes.ts / geometryUtils.ts
    structureInventory.ts / tourAuthoringReport.ts / validateTour.ts
  data/
    tours.ts              # Guided tour definitions
scripts/
  inspect-structure.ts    # Tour authoring CLI
tests/                    # Vitest suites + fixtures/
```

---

## Principles for agents

1. **Read before writing** — Match naming, imports, and patterns in the target file and its neighbours.
2. **Minimal diff** — Solve the requested problem only; do not refactor unrelated code.
3. **Preserve behaviour** — Rendering, parsing, and UX should remain identical unless the task says otherwise.
4. **Explain non-obvious logic** — Short comments for business rules (e.g. SF-file detection), not narration of obvious code.
5. **Test real behaviour** — Parsers, bond math, and store logic deserve tests; trivial getters do not.
6. **Ask when unsure** — Especially for visual changes, new dependencies, or roadmap-sized features.
