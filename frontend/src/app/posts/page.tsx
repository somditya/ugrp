import PostList from '@/components/post/PostList';
import { usePosts } from '@/hooks/usePosts';

export default function PostsPage() {
  const { posts, loading, error, meta } = usePosts(1);

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Posts</h1>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          <PostList posts={posts} />
          {meta && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="text-sm text-gray-600">
                Page {meta.page} of {meta.totalPages} ({meta.total} total)
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
