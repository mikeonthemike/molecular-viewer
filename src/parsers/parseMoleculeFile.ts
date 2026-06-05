import { parseMMCIF } from '../parsers/mmCIFParser';
import { parsePDB } from '../parsers/PDBParser';
import type { MoleculeData } from '../parsers/types';

export type MoleculeFileFormat = 'pdb' | 'cif';

/** True when the file is a structure-factor (diffraction) CIF, not coordinates */
export function isStructureFactorFile(filename: string, text: string): boolean {
  const name = filename.toLowerCase();
  if (name.includes('-sf.cif') || name.includes('_sf.cif')) return true;

  const head = text.slice(0, 8192);
  const hasReflections = /_refln\./m.test(head) || /data_\w*sf/m.test(head);
  const hasAtomSites = /_atom_site\./m.test(text);
  return hasReflections && !hasAtomSites;
}

/** Extract a PDB ID hint from filename like 1EXR-sf.cif */
export function pdbIdFromFilename(filename: string): string | null {
  const match = filename.match(/([A-Za-z0-9]{4})/);
  return match ? match[1]!.toUpperCase() : null;
}

/** Infer file format from extension, falling back to content sniffing */
export function detectMoleculeFormat(filename: string, text: string): MoleculeFileFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';

  if (ext === 'pdb' || ext === 'ent') return 'pdb';
  if (ext === 'cif' || ext === 'mmcif') return 'cif';

  const head = text.slice(0, 4096);
  if (/^data_/m.test(head) || /_atom_site\./m.test(head)) return 'cif';
  if (/^(ATOM|HETATM|HEADER|REMARK|MODEL)\s/m.test(head)) return 'pdb';

  return null;
}

export function parseMoleculeFile(filename: string, text: string): MoleculeData {
  const format = detectMoleculeFormat(filename, text);
  if (!format) {
    throw new Error('Unrecognized file format. Please use a PDB or mmCIF file.');
  }

  const data = format === 'pdb' ? parsePDB(text) : parseMMCIF(text);
  if (data.atoms.length === 0) {
    if (format === 'cif' && isStructureFactorFile(filename, text)) {
      const id = pdbIdFromFilename(filename);
      const hint = id
        ? ` Try fetching "${id}" using the RCSB ID box, or download ${id}.cif (coordinates) instead of ${id}-sf.cif.`
        : ' Download the coordinate mmCIF (not the -sf structure factor file) from RCSB.';
      throw new Error(
        `This is a structure factor file (X-ray diffraction data), not an atomic coordinate file.${hint}`,
      );
    }
    throw new Error('No atoms found in file. The file may be empty or use an unsupported format variant.');
  }

  return data;
}
