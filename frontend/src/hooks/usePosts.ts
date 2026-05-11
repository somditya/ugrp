import { useState, useEffect, useCallback } from 'react';
import { Post, PaginatedResponse, ApiResponse } from '@/types';

export function usePosts(page: number = 1) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Post>['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/posts?page=' + String(page));
      if (!res.ok) throw new Error('HTTP ' + String(res.status));
      const json: ApiResponse<PaginatedResponse<Post>> = await res.json();
      setPosts(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (err: any) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, meta, loading, error, refetch: fetchPosts };
}
