import type { Atom, MoleculeData } from './types';
import { buildChains, computeBounds, parseElement } from '../utils/geometryUtils';

/** Parse mmCIF _atom_site loop into MoleculeData */
export function parseMMCIF(text: string): MoleculeData {
  const lines = text.split(/\r?\n/);
  const atoms: Atom[] = [];

  let inAtomSiteLoop = false;
  let headers: string[] = [];
  let dataStarted = false;

  const getCol = (row: string[], name: string): string => {
    const idx = headers.indexOf(name);
    return idx >= 0 ? (row[idx] ?? '').trim() : '';
  };

  parseLoop: for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed === 'loop_') {
      if (dataStarted && atoms.length > 0) break parseLoop;
      inAtomSiteLoop = false;
      headers = [];
      dataStarted = false;
      continue;
    }

    if (trimmed.startsWith('_atom_site.')) {
      inAtomSiteLoop = true;
      headers.push(trimmed);
      continue;
    }

    if (inAtomSiteLoop && headers.length > 0) {
      if (trimmed.startsWith('_') || trimmed.startsWith('data_')) {
        if (dataStarted) break parseLoop;
        inAtomSiteLoop = false;
        headers = [];
        continue;
      }

      // Skip comment lines inside the loop without ending parse
      if (trimmed.startsWith('#')) continue;

      if (trimmed.startsWith(';')) continue;

      const tokens = splitCifRow(trimmed);
      if (tokens.length === 0) continue;

      // Pad short rows — some mmCIF variants omit trailing optional columns
      while (tokens.length < headers.length) {
        tokens.push('.');
      }

      dataStarted = true;

      const name = getCol(tokens, '_atom_site.label_atom_id') ||
        getCol(tokens, '_atom_site.auth_atom_id');
      const residueName = getCol(tokens, '_atom_site.label_comp_id') ||
        getCol(tokens, '_atom_site.auth_comp_id');
      const chainID = getCol(tokens, '_atom_site.label_asym_id') ||
        getCol(tokens, '_atom_site.auth_asym_id') || 'A';
      const seqStr = getCol(tokens, '_atom_site.label_seq_id') ||
        getCol(tokens, '_atom_site.auth_seq_id');
      const x = parseFloat(getCol(tokens, '_atom_site.Cartn_x')) || 0;
      const y = parseFloat(getCol(tokens, '_atom_site.Cartn_y')) || 0;
      const z = parseFloat(getCol(tokens, '_atom_site.Cartn_z')) || 0;
      const elementField = getCol(tokens, '_atom_site.type_symbol');
      const bFactorStr = getCol(tokens, '_atom_site.B_iso_or_equiv');
      const occupancyStr = getCol(tokens, '_atom_site.occupancy');

      if (!name || (x === 0 && y === 0 && z === 0 && !elementField)) continue;

      const serial = atoms.length + 1;
      const atom: Atom = {
        serial,
        name,
        element: parseElement(name, elementField),
        residueName,
        chainID,
        residueSeq: parseInt(seqStr, 10) || 0,
        x,
        y,
        z,
      };

      if (bFactorStr && bFactorStr !== '.') atom.bFactor = parseFloat(bFactorStr);
      if (occupancyStr && occupancyStr !== '.') atom.occupancy = parseFloat(occupancyStr);

      atoms.push(atom);
    }
  }

  const chains = buildChains(atoms);
  for (const chain of chains) {
    for (const residue of chain.residues) {
      residue.secondaryStructure = 'loop';
    }
  }

  const { center, boundingRadius } = computeBounds(atoms);

  return {
    atoms,
    bonds: [],
    chains,
    center,
    boundingRadius,
    hasConectBonds: false,
  };
}

/** Split a mmCIF data row respecting quoted strings */
function splitCifRow(line: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (!inQuote && (ch === "'" || ch === '"')) {
      inQuote = true;
      quoteChar = ch;
      continue;
    }
    if (inQuote && ch === quoteChar) {
      inQuote = false;
      tokens.push(current);
      current = '';
      if (line[i + 1] === quoteChar) i += 1;
      continue;
    }
    if (!inQuote && /\s/.test(ch)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }
    current += ch;
  }
  if (current) tokens.push(current);
  return tokens;
}

/** Fetch structure from RCSB by 4-char accession code */
export async function fetchRCSBStructure(accession: string): Promise<MoleculeData> {
  const id = accession.trim().toUpperCase();
  if (!/^[A-Z0-9]{4}$/.test(id)) {
    throw new Error('Invalid accession code. Must be 4 alphanumeric characters.');
  }

  const url = `https://files.rcsb.org/download/${id}.cif`;
  const response = await fetch(url);

  if (response.status === 404) {
    throw new Error(`Structure "${id}" not found in the RCSB database.`);
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch structure: ${response.statusText}`);
  }

  const text = await response.text();
  return parseMMCIF(text);
}
