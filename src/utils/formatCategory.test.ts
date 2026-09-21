import { describe, expect, it } from 'vitest';
import { formatCategory } from './formatCategory';

describe('formatCategory', () => {
  it('formats a kebab-case category for display', () => {
    expect(formatCategory('historic-site')).toBe('Historic Site');
  });
});
