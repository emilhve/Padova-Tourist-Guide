import { describe, expect, it } from 'vitest';
import { formatCategory } from './formatCategory';

describe('formatCategory', () => {
  it('translates place categories for display', () => {
    expect(formatCategory('landmark')).toBe('Landemerke');
    expect(formatCategory('church')).toBe('Kirke');
    expect(formatCategory('food')).toBe('Mat og drikke');
  });
});
