import type { LibraryEntry, StructureCategory } from '../parsers/types';

export type LibraryCategoryFilter = StructureCategory | 'all';

/** Client-side filter for the curated library — no network calls */
export function filterLibraryEntries(
  entries: LibraryEntry[],
  category: LibraryCategoryFilter,
  query: string,
): LibraryEntry[] {
  let filtered = entries;

  if (category !== 'all') {
    filtered = filtered.filter((e) => e.category === category);
  }

  const trimmed = query.trim();
  if (trimmed) {
    const q = trimmed.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.accession.toLowerCase().includes(q) ||
        e.organism.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  return filtered;
}

/** True when the query looks like a 4-char RCSB accession not in the library */
export function isRcsbAccessionFallback(query: string, filteredCount: number): boolean {
  return filteredCount === 0 && /^[A-Z0-9]{4}$/i.test(query.trim());
}
