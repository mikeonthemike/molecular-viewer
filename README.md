# Molecular Viewer

Browser-based interactive 3D molecular structure viewer built with React 19, Three.js, TypeScript, and Vite.

## Features

- Load **PDB** or **mmCIF** files via drag-and-drop
- Fetch structures from **RCSB** by 4-character accession code
- Rendering modes: ball-and-stick, space-filling, ribbon, backbone
- Colour schemes: element (CPK), chain, residue type, B-factor, secondary structure
- Atom selection, distance measurement, chain visibility toggles
- Web Worker for bond calculation and secondary structure analysis
- Progressive WebGPU enhancement with WebGL2 fallback
- Installable PWA

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173 and try loading `1CRN` from RCSB or drop a `.pdb` / `.cif` file.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run Vitest unit tests |
| `npm run validate-tours` | Validate guided tours against live RCSB structures |
| `npm run inspect-structure -- <ID>` | Print chain inventory and suggested tour metadata for an accession |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Guided tours (authoring)

Tours live in `src/data/tours.ts`. Before adding or editing a tour:

1. **Inspect the structure** — fetches the RCSB asymmetric unit and prints polymer vs ligand chains, suggested `visibleChains`, and `expectedPolymerChainCount`:

   ```bash
   npm run inspect-structure -- 1HHO
   ```

2. **Author steps** — add entries to `src/data/tours.ts`. Use `visibleChains` from the report on every step so ligand asym units do not appear as extra chains. Set camera scales by loading the structure in the viewer and calling `viewerRef.current?.logCameraState()` in DevTools.

3. **Validate** — checks chain IDs, residue highlights, and metadata against RCSB:

   ```bash
   npm run validate-tours
   ```

See `AGENTS.md` for the full agent workflow.

## Tech stack

React 19 · Three.js r168 · Zustand 5 · TypeScript 5 · Vite 6 · Vitest

See `molecular_viewer_tech_spec.html` for the full technical specification.
