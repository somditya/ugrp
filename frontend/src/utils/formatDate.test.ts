import { formatDate, getPriorityColor, getStatusColor } from './formatDate';

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

describe('getPriorityColor', () => {
  it('returns red for CRITICAL', () => {
    expect(getPriorityColor('CRITICAL')).toBe('bg-red-100 text-red-800');
  });

  it('returns orange for HIGH', () => {
    expect(getPriorityColor('HIGH')).toBe('bg-orange-100 text-orange-800');
  });

  it('returns gray for NORMAL', () => {
    expect(getPriorityColor('NORMAL')).toBe('bg-gray-100 text-gray-800');
  });
});

describe('getStatusColor', () => {
  it('returns red for SLA_BREACHED', () => {
    expect(getStatusColor('SLA_BREACHED')).toBe('bg-red-100 text-red-800');
  });

  it('returns green for RESOLVED', () => {
    expect(getStatusColor('RESOLVED')).toBe('bg-green-100 text-green-800');
  });

  it('returns default for unknown status', () => {
    expect(getStatusColor('UNKNOWN' as any)).toBe('bg-gray-100 text-gray-800');
  });
});