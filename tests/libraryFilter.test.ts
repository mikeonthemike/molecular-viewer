import { describe, expect, it } from 'vitest';
import { LIBRARY_ENTRIES } from '../src/data/library';
import { filterLibraryEntries, isRcsbAccessionFallback } from '../src/utils/libraryFilter';

describe('libraryFilter', () => {
  it('returns all entries when no filters applied', () => {
    expect(filterLibraryEntries(LIBRARY_ENTRIES, 'all', '')).toHaveLength(16);
  });

  it('filters by category', () => {
    const enzymes = filterLibraryEntries(LIBRARY_ENTRIES, 'enzyme', '');
    expect(enzymes.length).toBeGreaterThan(0);
    expect(enzymes.every((e) => e.category === 'enzyme')).toBe(true);
  });

  it('filters by name and tags', () => {
    const crambin = filterLibraryEntries(LIBRARY_ENTRIES, 'all', 'crambin');
    expect(crambin).toHaveLength(1);
    expect(crambin[0]?.accession).toBe('1CRN');

    const helix = filterLibraryEntries(LIBRARY_ENTRIES, 'all', 'double helix');
    expect(helix.length).toBeGreaterThanOrEqual(2);
  });

  it('detects RCSB accession fallback', () => {
    expect(isRcsbAccessionFallback('1ABC', 0)).toBe(true);
    expect(isRcsbAccessionFallback('1CRN', 1)).toBe(false);
    expect(isRcsbAccessionFallback('crambin', 0)).toBe(false);
  });
});
