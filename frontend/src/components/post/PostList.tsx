import PostCard from './PostCard';
import { Post } from '@/types';

interface Props {
  posts: Post[];
}

export default function PostList({ posts }: Props) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
