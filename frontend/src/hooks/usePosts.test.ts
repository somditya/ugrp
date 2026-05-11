import { renderHook, act } from '@testing-library/react';
import { usePosts } from './usePosts';

const mockFetch = jest.fn();
Object.defineProperty(global, 'fetch', { value: mockFetch, writable: true });

describe('usePosts', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('fetches posts successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: '1',
            title: 'Test',
            content: null,
            published: true,
            authorId: '1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            author: { id: '1', name: 'Test', email: 'test@test.com' },
          },
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      }),
    });

    const { result, waitFor } = renderHook(() => usePosts(1));

    await waitFor(() => !result.current.loading);

    expect(result.current.posts).toHaveLength(1);
    expect(result.current.meta!.total).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result, waitFor } = renderHook(() => usePosts(1));

    await waitFor(() => !result.current.loading);

    expect(result.current.error).toBe('Network error');
    expect(result.current.posts).toHaveLength(0);
  });
});