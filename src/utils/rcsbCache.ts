import { fetchRCSBStructure, parseMMCIF } from '../parsers/mmCIFParser';
import type { MoleculeData } from '../parsers/types';

const CACHE_PREFIX = 'mv-cif-';

function cacheKey(accession: string): string {
  return `${CACHE_PREFIX}${accession.trim().toUpperCase()}`;
}

async function fetchCifText(accession: string): Promise<string> {
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

  return response.text();
}

/** Fetch mmCIF from RCSB, using sessionStorage to avoid repeat downloads in the same session */
export async function fetchRCSBStructureCached(accession: string): Promise<MoleculeData> {
  const id = accession.trim().toUpperCase();
  const key = cacheKey(id);

  try {
    const cached = sessionStorage.getItem(key);
    if (cached) return parseMMCIF(cached);
  } catch {
    // sessionStorage may be unavailable; fall through to network fetch
  }

  try {
    const text = await fetchCifText(id);
    try {
      sessionStorage.setItem(key, text);
    } catch {
      // Caching is best-effort
    }
    return parseMMCIF(text);
  } catch (err) {
    // Delegate to fetchRCSBStructure for consistent error messages on edge cases
    if (err instanceof Error && err.message.includes('Invalid accession')) {
      throw err;
    }
    return fetchRCSBStructure(id);
  }
}
