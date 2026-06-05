import { describe, expect, it } from 'vitest';
import { getTourById, getToursForStructure, TOURS } from '../src/data/tours';

describe('tours data', () => {
  it('has unique tour and step ids', () => {
    const tourIds = TOURS.map((t) => t.id);
    expect(new Set(tourIds).size).toBe(tourIds.length);

    for (const tour of TOURS) {
      const stepIds = tour.steps.map((s) => s.id);
      expect(new Set(stepIds).size).toBe(stepIds.length);
    }
  });

  it('exposes haemoglobin pilot tour', () => {
    const tour = getTourById('haemoglobin-oxygen');
    expect(tour?.structureId).toBe('1HHO');
    expect(tour?.steps).toHaveLength(5);
    expect(getToursForStructure('1HHO')).toHaveLength(1);
  });

  it('exposes lysozyme tour for library entry 1LYZ', () => {
    const tour = getTourById('lysozyme-catalysis');
    expect(tour?.structureId).toBe('1LYZ');
    expect(tour?.expectedPolymerChainCount).toBe(1);
    expect(tour?.steps).toHaveLength(5);
    expect(getToursForStructure('1LYZ')).toHaveLength(1);
  });
});
