import { toSearchPattern } from './products';

vi.mock('../lib/supabase', () => ({ supabase: {} }));

describe('toSearchPattern', () => {
  it('wraps a lowercased search in wildcards', () => {
    expect(toSearchPattern('  Jett ')).toBe('%jett%');
  });

  it('has nothing to search for when the text is blank', () => {
    expect(toSearchPattern('   ')).toBeNull();
  });

  it.each(['%', '_', '*', '\\', '%_*'])('removes the wildcard in %s', (text) => {
    expect(toSearchPattern(text)).toBeNull();
  });

  it('stops a wildcard joining the text on either side', () => {
    expect(toSearchPattern('zen_reen')).toBe('%zen reen%');
    expect(toSearchPattern('j%tt')).toBe('%j tt%');
  });
});
