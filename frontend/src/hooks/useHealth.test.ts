import { renderHook, act } from '@testing-library/react';
import { useHealth } from './useHealth';

const mockFetch = jest.fn();
Object.defineProperty(global, 'fetch', { value: mockFetch, writable: true });

describe('useHealth', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('fetches and returns health status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', timestamp: '2024-01-01T00:00:00.000Z' }),
    });

    const { result, waitFor } = renderHook(() => useHealth());

    await waitFor(() => !result.current.loading);

    expect(result.current.status).toEqual({
      status: 'ok',
      timestamp: '2024-01-01T00:00:00.000Z',
    });
    expect(result.current.loading).toBe(false);
  });

  it('handles fetch errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result, waitFor } = renderHook(() => useHealth());

    await waitFor(() => !result.current.loading);

    expect(result.current.status).toEqual({
      status: 'error',
      timestamp: expect.any(String),
    });
  });
});
