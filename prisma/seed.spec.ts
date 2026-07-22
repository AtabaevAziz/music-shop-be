import {
  normalizeSeedOptionalString,
  normalizeSeedRequiredString
} from './seed';

describe('seed normalization helpers', () => {
  it('trims required string values', () => {
    expect(normalizeSeedRequiredString('  Fender  ')).toBe('Fender');
  });

  it('preserves nullish optional values', () => {
    expect(normalizeSeedOptionalString(undefined)).toBeUndefined();
    expect(normalizeSeedOptionalString(null)).toBeNull();
  });

  it('normalizes blank optional values to null', () => {
    expect(normalizeSeedOptionalString('   ')).toBeNull();
  });

  it('trims populated optional values', () => {
    expect(normalizeSeedOptionalString('  Akmal R.  ')).toBe('Akmal R.');
  });
});
