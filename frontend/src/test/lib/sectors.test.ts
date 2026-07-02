import { describe, it, expect } from 'vitest';
import { KIGALI_SECTORS } from '../../lib/sectors';

describe('KIGALI_SECTORS', () => {
  it('is an array', () => {
    expect(Array.isArray(KIGALI_SECTORS)).toBe(true);
  });

  it('has 16 sectors', () => {
    expect(KIGALI_SECTORS).toHaveLength(16);
  });

  it('contains Kimironko', () => {
    expect(KIGALI_SECTORS).toContain('Kimironko');
  });

  it('contains Kacyiru', () => {
    expect(KIGALI_SECTORS).toContain('Kacyiru');
  });

  it('contains no duplicates', () => {
    const unique = new Set(KIGALI_SECTORS);
    expect(unique.size).toBe(KIGALI_SECTORS.length);
  });

  it('all entries are non-empty strings', () => {
    KIGALI_SECTORS.forEach((sector) => {
      expect(typeof sector).toBe('string');
      expect(sector.length).toBeGreaterThan(0);
    });
  });
});
