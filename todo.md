# Molecular Viewer — TODO

## Structure factors

Support mmCIF structure factor files (e.g. `1EXR-sf.cif`) that contain `_refln` diffraction data instead of `_atom_site` coordinates.

- [ ] Detect structure factor CIFs and offer to load the matching coordinate file (e.g. fetch `1EXR.cif` when user drops `1EXR-sf.cif`)
- [ ] Parse `_refln` loops: Miller indices (`index_h`, `index_k`, `index_l`), measured intensities, sigmas, and status flags
- [ ] Compute structure factors (Fobs/Fcalc) and difference map coefficients where available
- [ ] Generate 3D electron density map on a grid (FFT from reflections)
- [ ] Render density as an isosurface or volume slice overlay on the coordinate model
- [ ] UI controls: map type (2Fo-Fc, Fo-Fc), contour level, opacity, toggle visibility
- [ ] Run map generation in a Web Worker to avoid blocking the main thread
- [ ] Cache computed maps per structure so contour adjustments stay interactive

Currently, structure factor files show a clear error directing users to the coordinate mmCIF or RCSB fetch.

## Different display modes
- [ ] Option to display different molecular shape structures like alpha helix, beta-pleated sheets

## Useful Information
- [ ] Add information panel about the molecule
- [ ] Find a good source for information to pull in and how to cache/persist it

## Search and Index
- [ ] Search for specific molecules that can then be looked up
- 

## Display
- [ ] Get the right hand panel to match the scroll for the main canvas