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
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Tech stack

React 19 · Three.js r168 · Zustand 5 · TypeScript 5 · Vite 6 · Vitest

See `molecular_viewer_tech_spec.html` for the full technical specification.
