import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('formats a valid date string', () => {
    const result = formatDate('2024-01-15T10:30:00.000Z');
    expect(result).toContain('2024');
    expect(result).toContain('January');
  });

  it('handles different date strings', () => {
    const result = formatDate('2024-06-01T00:00:00.000Z');
    expect(result).toContain('June');
    expect(result).toContain('1, 2024');
  });
});
