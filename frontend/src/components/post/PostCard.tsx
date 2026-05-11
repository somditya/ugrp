import { Post } from '@/types';
import { formatDate } from '@/utils/formatDate';

interface Props {
  post: Post;
}

export default function PostCard({ post }: Props) {
  return (
    <article className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>
      <p className="text-gray-600 mb-4">{post.content || 'No content'}</p>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>By {post.author.name || 'Unknown'}</span>
        <span>{formatDate(post.createdAt)}</span>
      </div>
    </article>
  );
}
