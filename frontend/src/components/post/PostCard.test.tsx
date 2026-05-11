import { render, screen } from '@testing-library/react';
import PostCard from './PostCard';
import { mockPost } from '@/mocks/post';

describe('PostCard', () => {
  it('renders the post title', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText(mockPost.title)).toBeInTheDocument();
  });

  it('renders the post content', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText(mockPost.content || '')).toBeInTheDocument();
  });

  it('renders author name', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText(/By Mock Author/)).toBeInTheDocument();
  });

  it('renders with no content fallback', () => {
    render(
      <PostCard
        post={{
          ...mockPost,
          id: '2',
          title: 'No Content Post',
          content: null,
        }}
      />
    );
    expect(screen.getByText('No content')).toBeInTheDocument();
  });
});
